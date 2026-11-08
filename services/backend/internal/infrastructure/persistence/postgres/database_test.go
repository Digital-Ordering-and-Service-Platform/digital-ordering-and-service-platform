package postgres

import (
	"context"
	"strings"
	"testing"
	"time"

	"github.com/Digital-Ordering-and-Service-Platform/digital-ordering-and-service-platform/services/backend/internal/shared/config"
)

func TestOpenFailsCleanlyWhenPostgresUnavailable(t *testing.T) {
	cfg := config.Config{DatabaseURL: "postgres://operator:private-secret@127.0.0.1:1/menu?sslmode=disable", Postgres: config.Postgres{
		MaxOpenConnections: 2, MaxIdleConnections: 1, ConnectionMaxLifetime: time.Minute, ConnectionMaxIdleTime: time.Minute, ConnectTimeout: 200 * time.Millisecond,
	}}
	_, err := Open(context.Background(), cfg)
	if err == nil {
		t.Fatal("Open succeeded without PostgreSQL")
	}
	if strings.Contains(err.Error(), "private-secret") {
		t.Fatalf("error leaked database password: %v", err)
	}
}

func TestCloseNilDatabaseIsSafe(t *testing.T) {
	if err := (*Database)(nil).Close(); err != nil {
		t.Fatal(err)
	}
}
