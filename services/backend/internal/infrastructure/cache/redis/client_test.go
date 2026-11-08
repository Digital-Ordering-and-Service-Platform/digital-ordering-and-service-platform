package redis

import (
	"context"
	"strings"
	"testing"
	"time"

	"github.com/Digital-Ordering-and-Service-Platform/digital-ordering-and-service-platform/services/backend/internal/shared/config"
)

func testConfig() config.Redis {
	return config.Redis{OperationTimeout: 100 * time.Millisecond, DialTimeout: 100 * time.Millisecond, ReadTimeout: 100 * time.Millisecond, WriteTimeout: 100 * time.Millisecond, PoolSize: 2}
}

func TestOpenRejectsMalformedURL(t *testing.T) {
	if _, err := Open(context.Background(), "redis://[broken", testConfig()); err == nil {
		t.Fatal("Open accepted malformed URL")
	}
}

func TestOpenFailureDoesNotEchoPassword(t *testing.T) {
	_, err := Open(context.Background(), "redis://:private-secret@127.0.0.1:1/0", testConfig())
	if err == nil {
		t.Fatal("Open succeeded without Redis")
	}
	if strings.Contains(err.Error(), "private-secret") {
		t.Fatalf("error leaked URL password: %v", err)
	}
}
