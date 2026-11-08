package application

import (
	"context"
	"time"
)

// Cache stores temporary values only; durable application state belongs in PostgreSQL.
type Cache interface {
	Get(context.Context, string) (string, bool, error)
	Set(context.Context, string, string, time.Duration) error
	Delete(context.Context, string) error
}
