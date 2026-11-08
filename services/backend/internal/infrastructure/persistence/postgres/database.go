// Package postgres owns PostgreSQL connectivity and persistence adapters.
package postgres

import (
	"context"
	"database/sql"
	"fmt"

	entsql "entgo.io/ent/dialect/sql"
	"github.com/Digital-Ordering-and-Service-Platform/digital-ordering-and-service-platform/services/backend/ent"
	"github.com/Digital-Ordering-and-Service-Platform/digital-ordering-and-service-platform/services/backend/internal/shared/config"
	_ "github.com/jackc/pgx/v5/stdlib"
)

// Database owns both the generated Ent client and the SQL handle used by the
// transactional outbox adapter. Neither is exposed to domain/application code.
type Database struct {
	client *ent.Client
	sql    *sql.DB
}

func Open(ctx context.Context, cfg config.Config) (*Database, error) {
	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}
	db, err := sql.Open("pgx", cfg.DatabaseURL)
	if err != nil {
		return nil, fmt.Errorf("open PostgreSQL connection: %w", err)
	}
	db.SetMaxOpenConns(cfg.Postgres.MaxOpenConnections)
	db.SetMaxIdleConns(cfg.Postgres.MaxIdleConnections)
	db.SetConnMaxLifetime(cfg.Postgres.ConnectionMaxLifetime)
	db.SetConnMaxIdleTime(cfg.Postgres.ConnectionMaxIdleTime)
	connectCtx, cancel := context.WithTimeout(ctx, cfg.Postgres.ConnectTimeout)
	defer cancel()
	if err := db.PingContext(connectCtx); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("connect to PostgreSQL: %w", err)
	}
	client := ent.NewClient(ent.Driver(entsql.OpenDB("postgres", db)))
	return &Database{client: client, sql: db}, nil
}

func (d *Database) Check(ctx context.Context) error {
	if d == nil || d.sql == nil {
		return fmt.Errorf("PostgreSQL is not initialized")
	}
	return d.sql.PingContext(ctx)
}

func (d *Database) Close() error {
	if d == nil {
		return nil
	}
	if d.client != nil {
		return d.client.Close()
	}
	if d.sql != nil {
		return d.sql.Close()
	}
	return nil
}

func (d *Database) OutboxStore() *OutboxStore { return &OutboxStore{db: d.sql} }
