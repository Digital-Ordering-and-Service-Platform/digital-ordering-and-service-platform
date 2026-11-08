// Package outbox publishes committed events from PostgreSQL to a durable broker.
package outbox

import (
	"context"
	"errors"
	"fmt"
	"hash/fnv"
	"log/slog"
	"time"

	"github.com/Digital-Ordering-and-Service-Platform/digital-ordering-and-service-platform/services/backend/internal/infrastructure/persistence/postgres"
)

type Store interface {
	Claim(context.Context, string, int, time.Duration) ([]postgres.OutboxEvent, error)
	MarkPublished(context.Context, string, string) error
	MarkFailed(context.Context, string, string, time.Duration, error) error
}

type Broker interface {
	Publish(context.Context, postgres.OutboxEvent) error
}

type Config struct {
	Owner         string
	BatchSize     int
	PollInterval  time.Duration
	LeaseDuration time.Duration
	RetryBase     time.Duration
	RetryMax      time.Duration
}

type Worker struct {
	store  Store
	broker Broker
	cfg    Config
	logger *slog.Logger
}

func New(store Store, broker Broker, cfg Config, logger *slog.Logger) (*Worker, error) {
	if store == nil || broker == nil {
		return nil, errors.New("outbox store and broker are required")
	}
	if cfg.Owner == "" || cfg.BatchSize < 1 || cfg.PollInterval <= 0 || cfg.LeaseDuration <= 0 || cfg.RetryBase <= 0 || cfg.RetryMax < cfg.RetryBase {
		return nil, errors.New("invalid outbox worker configuration")
	}
	if logger == nil {
		logger = slog.Default()
	}
	return &Worker{store: store, broker: broker, cfg: cfg, logger: logger}, nil
}

func (w *Worker) Run(ctx context.Context) error {
	ticker := time.NewTicker(w.cfg.PollInterval)
	defer ticker.Stop()
	for {
		if err := w.drain(ctx); err != nil && !errors.Is(err, context.Canceled) {
			w.logger.Error("outbox polling failed", "error", err)
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
		}
	}
}

func (w *Worker) drain(ctx context.Context) error {
	for count := 0; count < w.cfg.BatchSize; count++ {
		if err := ctx.Err(); err != nil {
			return err
		}
		events, err := w.store.Claim(ctx, w.cfg.Owner, 1, w.cfg.LeaseDuration)
		if err != nil {
			return err
		}
		if len(events) == 0 {
			return nil
		}
		event := events[0]
		if err := w.broker.Publish(ctx, event); err != nil {
			delay := w.retryDelay(event)
			if releaseErr := w.store.MarkFailed(ctx, event.ID, w.cfg.Owner, delay, err); releaseErr != nil {
				w.logger.Error("failed to release outbox lease", "event_id", event.ID, "error", releaseErr)
			} else {
				w.logger.Warn("outbox event publication will retry", "event_id", event.ID, "attempt", event.Attempts, "retry_after", delay, "error", err)
			}
			continue
		}
		if err := w.store.MarkPublished(ctx, event.ID, w.cfg.Owner); err != nil {
			// Rabbit may already have accepted this event. Leaving the lease to expire
			// preserves at-least-once delivery and requires idempotent consumers.
			w.logger.Error("confirmed event could not be marked published", "event_id", event.ID, "error", err)
			continue
		}
		w.logger.Info("outbox event published", "event_id", event.ID, "event_type", event.Type)
	}
	return nil
}

func (w *Worker) retryDelay(event postgres.OutboxEvent) time.Duration {
	shift := event.Attempts - 1
	if shift < 0 {
		shift = 0
	}
	if shift > 30 {
		shift = 30
	}
	delay := w.cfg.RetryBase * time.Duration(uint64(1)<<uint(shift))
	if delay <= 0 || delay > w.cfg.RetryMax {
		delay = w.cfg.RetryMax
	}
	// Stable per-event jitter prevents a large batch from retrying in lockstep.
	h := fnv.New32a()
	_, _ = h.Write([]byte(event.ID))
	jitter := time.Duration(h.Sum32()%201) * delay / 1000
	if delay+jitter > w.cfg.RetryMax {
		return w.cfg.RetryMax
	}
	return delay + jitter
}

func (w *Worker) DrainOnce(ctx context.Context) error { return w.drain(ctx) }

func FormatOwner(host string, pid int) string { return fmt.Sprintf("%s:%d", host, pid) }
