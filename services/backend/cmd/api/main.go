package main

import (
	"context"
	"errors"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/Digital-Ordering-and-Service-Platform/digital-ordering-and-service-platform/services/backend/internal/infrastructure/cache/redis"
	"github.com/Digital-Ordering-and-Service-Platform/digital-ordering-and-service-platform/services/backend/internal/infrastructure/persistence/postgres"
	realtime "github.com/Digital-Ordering-and-Service-Platform/digital-ordering-and-service-platform/services/backend/internal/infrastructure/realtime/websocket"
	localstorage "github.com/Digital-Ordering-and-Service-Platform/digital-ordering-and-service-platform/services/backend/internal/infrastructure/storage/local"
	apihttp "github.com/Digital-Ordering-and-Service-Platform/digital-ordering-and-service-platform/services/backend/internal/interfaces/http"
	"github.com/Digital-Ordering-and-Service-Platform/digital-ordering-and-service-platform/services/backend/internal/shared/config"
	"github.com/Digital-Ordering-and-Service-Platform/digital-ordering-and-service-platform/services/backend/internal/shared/logging"
)

func main() {
	if err := run(); err != nil {
		_, _ = os.Stderr.WriteString("api: " + err.Error() + "\n")
		os.Exit(1)
	}
}

func run() error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}
	logger := logging.New(cfg.LogLevel)
	startupCtx, startupCancel := context.WithTimeout(context.Background(), cfg.Postgres.ConnectTimeout)
	database, err := postgres.Open(startupCtx, cfg)
	startupCancel()
	if err != nil {
		return err
	}
	defer func() {
		if err := database.Close(); err != nil {
			logger.Error("close PostgreSQL", "error", err)
		}
	}()
	media, err := localstorage.New(cfg.MediaRoot)
	if err != nil {
		return err
	}
	_ = media // Injected here for future authorized handlers; no upload endpoint exists in Phase 3.
	hub, err := realtime.NewHub(cfg.WebSocketQueueSize)
	if err != nil {
		return err
	}
	redisClient, redisErr := redis.Open(context.Background(), cfg.RedisURL, cfg.Redis)
	if redisErr != nil {
		logger.Warn("Redis cache is unavailable; API will continue without cache", "error", redisErr)
	}
	if redisClient != nil {
		defer func() {
			if err := redisClient.Close(); err != nil {
				logger.Error("close Redis", "error", err)
			}
		}()
	}
	defer func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := hub.Shutdown(ctx); err != nil {
			logger.Error("stop WebSocket hub", "error", err)
		}
	}()
	checks := map[string]apihttp.ReadinessCheck{
		"postgres": {Required: true, Check: database.Check},
		"redis": {Required: false, Check: func(ctx context.Context) error {
			if redisClient == nil {
				return redisErr
			}
			return redisClient.Check(ctx)
		}},
	}
	server := &http.Server{
		Addr:              cfg.HTTPAddress,
		Handler:           apihttp.NewRouterWithReadiness(checks, cfg.ReadinessTimeout),
		ReadHeaderTimeout: 5 * time.Second,
		IdleTimeout:       2 * time.Minute,
		MaxHeaderBytes:    1 << 20,
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	serveErr := make(chan error, 1)
	go func() {
		logger.Info("API listening", "address", cfg.HTTPAddress, "environment", cfg.Environment)
		serveErr <- server.ListenAndServe()
	}()

	select {
	case err := <-serveErr:
		if errors.Is(err, http.ErrServerClosed) {
			return nil
		}
		return err
	case <-ctx.Done():
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := server.Shutdown(shutdownCtx); err != nil {
			return err
		}
		logger.Info("API stopped")
		return nil
	}
}
