package config

import (
	"os"
	"testing"
)

var configEnvKeys = []string{
	"APP_ENV",
	"LOG_LEVEL",
	"HTTP_ADDRESS",
	"DATABASE_URL",
	"REDIS_URL",
	"RABBITMQ_URL",
	"MEDIA_ROOT",
	"POSTGRES_MAX_OPEN_CONNS", "POSTGRES_MAX_IDLE_CONNS", "POSTGRES_CONN_MAX_LIFETIME", "POSTGRES_CONN_MAX_IDLE_TIME", "POSTGRES_CONNECT_TIMEOUT",
	"REDIS_OPERATION_TIMEOUT", "REDIS_DIAL_TIMEOUT", "REDIS_READ_TIMEOUT", "REDIS_WRITE_TIMEOUT", "REDIS_POOL_SIZE", "REDIS_MIN_IDLE_CONNS",
	"RABBITMQ_CONNECT_TIMEOUT", "RABBITMQ_CONFIRM_TIMEOUT", "RABBITMQ_RECONNECT_MIN", "RABBITMQ_RECONNECT_MAX",
	"RABBITMQ_EXCHANGE", "RABBITMQ_QUEUE", "RABBITMQ_ROUTING_KEY", "READINESS_TIMEOUT", "WEBSOCKET_QUEUE_SIZE",
	"OUTBOX_BATCH_SIZE", "OUTBOX_POLL_INTERVAL", "OUTBOX_LEASE_DURATION", "OUTBOX_RETRY_BASE", "OUTBOX_RETRY_MAX",
}

func clearConfigEnv(t *testing.T) {
	t.Helper()
	previous := make(map[string]string, len(configEnvKeys))
	wasSet := make(map[string]bool, len(configEnvKeys))
	for _, key := range configEnvKeys {
		previous[key], wasSet[key] = os.LookupEnv(key)
		if err := os.Unsetenv(key); err != nil {
			t.Fatalf("unset %s: %v", key, err)
		}
	}
	t.Cleanup(func() {
		for _, key := range configEnvKeys {
			var err error
			if wasSet[key] {
				err = os.Setenv(key, previous[key])
			} else {
				err = os.Unsetenv(key)
			}
			if err != nil {
				t.Errorf("restore %s: %v", key, err)
			}
		}
	})
}

func TestLoadDefaults(t *testing.T) {
	clearConfigEnv(t)

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if cfg.Environment != "development" || cfg.LogLevel != "info" || cfg.HTTPAddress != ":8080" {
		t.Fatalf("unexpected defaults: %+v", cfg)
	}
	if cfg.DatabaseURL != "" || cfg.RedisURL != "" || cfg.RabbitURL != "" {
		t.Fatalf("infrastructure URLs should be optional by default: %+v", cfg)
	}
	if cfg.Postgres.MaxOpenConnections != 20 || cfg.Redis.PoolSize != 10 || cfg.Outbox.BatchSize != 50 || cfg.WebSocketQueueSize != 64 {
		t.Fatalf("unexpected infrastructure defaults: %+v", cfg)
	}
}

func TestLoadRejectsInvalidInfrastructureSettings(t *testing.T) {
	for _, test := range []struct{ name, key, value string }{
		{"pool size", "POSTGRES_MAX_OPEN_CONNS", "zero"},
		{"idle pool bounds", "POSTGRES_MAX_IDLE_CONNS", "21"},
		{"bad duration", "REDIS_OPERATION_TIMEOUT", "soon"},
		{"zero operation timeout", "REDIS_OPERATION_TIMEOUT", "0s"},
		{"backoff order", "RABBITMQ_RECONNECT_MAX", "500ms"},
		{"lease confirm bound", "OUTBOX_LEASE_DURATION", "1s"},
	} {
		t.Run(test.name, func(t *testing.T) {
			clearConfigEnv(t)
			t.Setenv(test.key, test.value)
			if _, err := Load(); err == nil {
				t.Fatal("Load() error = nil, want validation error")
			}
		})
	}
}

func TestLoadInvalidHTTPAddress(t *testing.T) {
	clearConfigEnv(t)
	t.Setenv("HTTP_ADDRESS", "localhost")

	if _, err := Load(); err == nil {
		t.Fatal("Load() error = nil, want invalid address error")
	}
}

func TestLoadMalformedURLs(t *testing.T) {
	for _, test := range []struct {
		name string
		key  string
	}{
		{name: "postgres", key: "DATABASE_URL"},
		{name: "redis", key: "REDIS_URL"},
		{name: "rabbitmq", key: "RABBITMQ_URL"},
	} {
		t.Run(test.name, func(t *testing.T) {
			clearConfigEnv(t)
			t.Setenv(test.key, "://bad-url")
			if _, err := Load(); err == nil {
				t.Fatalf("Load() error = nil, want malformed %s error", test.key)
			}
		})
	}
}

func TestLoadUnsupportedURLSchemes(t *testing.T) {
	for _, test := range []struct {
		name string
		key  string
		url  string
	}{
		{name: "postgres", key: "DATABASE_URL", url: "mysql://localhost/menu"},
		{name: "redis", key: "REDIS_URL", url: "http://localhost:6379"},
		{name: "rabbitmq", key: "RABBITMQ_URL", url: "https://localhost:5672"},
	} {
		t.Run(test.name, func(t *testing.T) {
			clearConfigEnv(t)
			t.Setenv(test.key, test.url)
			if _, err := Load(); err == nil {
				t.Fatalf("Load() error = nil, want unsupported scheme error for %s", test.key)
			}
		})
	}
}

func TestLoadSupportedURLSchemes(t *testing.T) {
	for _, test := range []struct {
		name string
		key  string
		url  string
	}{
		{name: "postgres", key: "DATABASE_URL", url: "postgres://localhost/menu"},
		{name: "postgresql", key: "DATABASE_URL", url: "postgresql://localhost/menu"},
		{name: "redis", key: "REDIS_URL", url: "redis://localhost:6379/0"},
		{name: "rediss", key: "REDIS_URL", url: "rediss://localhost:6379/0"},
		{name: "amqp", key: "RABBITMQ_URL", url: "amqp://localhost:5672/"},
		{name: "amqps", key: "RABBITMQ_URL", url: "amqps://localhost:5671/"},
	} {
		t.Run(test.name, func(t *testing.T) {
			clearConfigEnv(t)
			t.Setenv(test.key, test.url)
			if _, err := Load(); err != nil {
				t.Fatalf("Load() error = %v", err)
			}
		})
	}
}
