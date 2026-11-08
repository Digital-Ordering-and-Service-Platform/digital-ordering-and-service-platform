package main

import (
	"context"
	"errors"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/Digital-Ordering-and-Service-Platform/digital-ordering-and-service-platform/services/backend/internal/infrastructure/messaging/rabbitmq"
	"github.com/Digital-Ordering-and-Service-Platform/digital-ordering-and-service-platform/services/backend/internal/infrastructure/outbox"
	"github.com/Digital-Ordering-and-Service-Platform/digital-ordering-and-service-platform/services/backend/internal/infrastructure/persistence/postgres"
	"github.com/Digital-Ordering-and-Service-Platform/digital-ordering-and-service-platform/services/backend/internal/shared/config"
	"github.com/Digital-Ordering-and-Service-Platform/digital-ordering-and-service-platform/services/backend/internal/shared/logging"
)

func main() {
	if err := run(); err != nil {
		_, _ = os.Stderr.WriteString("worker: " + err.Error() + "\n")
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
	broker, err := rabbitmq.Open(context.Background(), cfg.RabbitURL, cfg.Rabbit, logger)
	if err != nil {
		return err
	}
	defer func() {
		if err := broker.Close(); err != nil {
			logger.Error("close RabbitMQ", "error", err)
		}
	}()
	host, _ := os.Hostname()
	owner := outbox.FormatOwner(host, os.Getpid())
	processor, err := outbox.New(database.OutboxStore(), broker, outbox.Config{
		Owner: owner, BatchSize: cfg.Outbox.BatchSize, PollInterval: cfg.Outbox.PollInterval,
		LeaseDuration: cfg.Outbox.LeaseDuration, RetryBase: cfg.Outbox.RetryBase, RetryMax: cfg.Outbox.RetryMax,
	}, logger)
	if err != nil {
		return err
	}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	logger.Info("worker started", "environment", cfg.Environment, "outbox_owner", owner)
	workerDone := make(chan error, 1)
	go func() { workerDone <- processor.Run(ctx) }()
	select {
	case err := <-workerDone:
		if err != nil && !errors.Is(err, context.Canceled) {
			return err
		}
	case <-ctx.Done():
		logger.Info("worker shutdown requested")
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		select {
		case <-workerDone:
		case <-shutdownCtx.Done():
			return shutdownCtx.Err()
		}
	}
	logger.Info("worker stopped")
	return nil
}
