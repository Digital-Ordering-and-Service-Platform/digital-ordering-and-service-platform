// Package config loads and validates process configuration from the environment.
package config

import (
	"errors"
	"fmt"
	"net"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"
)

// Config contains settings shared by the API and worker. Resource-specific
// addresses are optional here; each process validates the dependencies it uses.
type Config struct {
	Environment        string
	LogLevel           string
	HTTPAddress        string
	DatabaseURL        string
	RedisURL           string
	RabbitURL          string
	Postgres           Postgres
	Redis              Redis
	Rabbit             Rabbit
	MediaRoot          string
	ReadinessTimeout   time.Duration
	WebSocketQueueSize int
	Outbox             Outbox
}

type Postgres struct {
	MaxOpenConnections    int
	MaxIdleConnections    int
	ConnectionMaxLifetime time.Duration
	ConnectionMaxIdleTime time.Duration
	ConnectTimeout        time.Duration
}

type Redis struct {
	OperationTimeout   time.Duration
	DialTimeout        time.Duration
	ReadTimeout        time.Duration
	WriteTimeout       time.Duration
	PoolSize           int
	MinIdleConnections int
}

type Rabbit struct {
	ConnectTimeout time.Duration
	ConfirmTimeout time.Duration
	ReconnectMin   time.Duration
	ReconnectMax   time.Duration
	Exchange       string
	Queue          string
	RoutingKey     string
}

type Outbox struct {
	BatchSize     int
	PollInterval  time.Duration
	LeaseDuration time.Duration
	RetryBase     time.Duration
	RetryMax      time.Duration
}

// Load reads configuration and validates values without logging secrets.
func Load() (Config, error) {
	cfg := Config{
		Environment: getEnv("APP_ENV", "development"),
		LogLevel:    strings.ToLower(getEnv("LOG_LEVEL", "info")),
		HTTPAddress: getEnv("HTTP_ADDRESS", ":8080"),
		DatabaseURL: os.Getenv("DATABASE_URL"),
		RedisURL:    os.Getenv("REDIS_URL"),
		RabbitURL:   os.Getenv("RABBITMQ_URL"),
		MediaRoot:   os.Getenv("MEDIA_ROOT"),
	}
	var err error
	if cfg.Postgres.MaxOpenConnections, err = intEnv("POSTGRES_MAX_OPEN_CONNS", 20); err != nil {
		return Config{}, err
	}
	if cfg.Postgres.MaxIdleConnections, err = intEnv("POSTGRES_MAX_IDLE_CONNS", 5); err != nil {
		return Config{}, err
	}
	if cfg.Postgres.ConnectionMaxLifetime, err = durationEnv("POSTGRES_CONN_MAX_LIFETIME", 30*time.Minute); err != nil {
		return Config{}, err
	}
	if cfg.Postgres.ConnectionMaxIdleTime, err = durationEnv("POSTGRES_CONN_MAX_IDLE_TIME", 5*time.Minute); err != nil {
		return Config{}, err
	}
	if cfg.Postgres.ConnectTimeout, err = durationEnv("POSTGRES_CONNECT_TIMEOUT", 5*time.Second); err != nil {
		return Config{}, err
	}
	if cfg.Redis.OperationTimeout, err = durationEnv("REDIS_OPERATION_TIMEOUT", 2*time.Second); err != nil {
		return Config{}, err
	}
	if cfg.Redis.DialTimeout, err = durationEnv("REDIS_DIAL_TIMEOUT", 3*time.Second); err != nil {
		return Config{}, err
	}
	if cfg.Redis.ReadTimeout, err = durationEnv("REDIS_READ_TIMEOUT", 2*time.Second); err != nil {
		return Config{}, err
	}
	if cfg.Redis.WriteTimeout, err = durationEnv("REDIS_WRITE_TIMEOUT", 2*time.Second); err != nil {
		return Config{}, err
	}
	if cfg.Redis.PoolSize, err = intEnv("REDIS_POOL_SIZE", 10); err != nil {
		return Config{}, err
	}
	if cfg.Redis.MinIdleConnections, err = intEnv("REDIS_MIN_IDLE_CONNS", 0); err != nil {
		return Config{}, err
	}
	if cfg.Rabbit.ConnectTimeout, err = durationEnv("RABBITMQ_CONNECT_TIMEOUT", 5*time.Second); err != nil {
		return Config{}, err
	}
	if cfg.Rabbit.ConfirmTimeout, err = durationEnv("RABBITMQ_CONFIRM_TIMEOUT", 5*time.Second); err != nil {
		return Config{}, err
	}
	if cfg.Rabbit.ReconnectMin, err = durationEnv("RABBITMQ_RECONNECT_MIN", time.Second); err != nil {
		return Config{}, err
	}
	if cfg.Rabbit.ReconnectMax, err = durationEnv("RABBITMQ_RECONNECT_MAX", 30*time.Second); err != nil {
		return Config{}, err
	}
	cfg.Rabbit.Exchange = getEnv("RABBITMQ_EXCHANGE", "digital-ordering.events")
	cfg.Rabbit.Queue = getEnv("RABBITMQ_QUEUE", "digital-ordering.events")
	cfg.Rabbit.RoutingKey = getEnv("RABBITMQ_ROUTING_KEY", "#")
	cfg.ReadinessTimeout, err = durationEnv("READINESS_TIMEOUT", 2*time.Second)
	if err != nil {
		return Config{}, err
	}
	if cfg.WebSocketQueueSize, err = intEnv("WEBSOCKET_QUEUE_SIZE", 64); err != nil {
		return Config{}, err
	}
	if cfg.Outbox.BatchSize, err = intEnv("OUTBOX_BATCH_SIZE", 50); err != nil {
		return Config{}, err
	}
	if cfg.Outbox.PollInterval, err = durationEnv("OUTBOX_POLL_INTERVAL", 500*time.Millisecond); err != nil {
		return Config{}, err
	}
	if cfg.Outbox.LeaseDuration, err = durationEnv("OUTBOX_LEASE_DURATION", 30*time.Second); err != nil {
		return Config{}, err
	}
	if cfg.Outbox.RetryBase, err = durationEnv("OUTBOX_RETRY_BASE", 2*time.Second); err != nil {
		return Config{}, err
	}
	if cfg.Outbox.RetryMax, err = durationEnv("OUTBOX_RETRY_MAX", 5*time.Minute); err != nil {
		return Config{}, err
	}
	if err := cfg.Validate(); err != nil {
		return Config{}, err
	}
	return cfg, nil
}

func (c Config) Validate() error {
	if strings.TrimSpace(c.Environment) == "" {
		return errors.New("APP_ENV must not be empty")
	}
	switch c.LogLevel {
	case "debug", "info", "warn", "error":
	default:
		return fmt.Errorf("LOG_LEVEL must be debug, info, warn, or error; got %q", c.LogLevel)
	}
	if _, rawPort, err := net.SplitHostPort(c.HTTPAddress); err != nil {
		return fmt.Errorf("HTTP_ADDRESS must be a host:port address: %w", err)
	} else if port, err := strconv.Atoi(rawPort); err != nil || port < 1 || port > 65535 {
		return errors.New("HTTP_ADDRESS port must be between 1 and 65535")
	}
	for _, value := range []struct {
		name, rawURL string
		schemes      []string
	}{
		{"DATABASE_URL", c.DatabaseURL, []string{"postgres", "postgresql"}},
		{"REDIS_URL", c.RedisURL, []string{"redis", "rediss"}},
		{"RABBITMQ_URL", c.RabbitURL, []string{"amqp", "amqps"}},
	} {
		if value.rawURL == "" {
			continue
		}
		parsed, err := url.ParseRequestURI(value.rawURL)
		if err != nil || parsed.Scheme == "" || parsed.Host == "" {
			return fmt.Errorf("%s must be an absolute URL", value.name)
		}
		if !contains(value.schemes, strings.ToLower(parsed.Scheme)) {
			return fmt.Errorf("%s must use one of the schemes %s", value.name, strings.Join(value.schemes, ", "))
		}
	}
	positiveInts := map[string]int{"POSTGRES_MAX_OPEN_CONNS": c.Postgres.MaxOpenConnections, "REDIS_POOL_SIZE": c.Redis.PoolSize, "OUTBOX_BATCH_SIZE": c.Outbox.BatchSize, "WEBSOCKET_QUEUE_SIZE": c.WebSocketQueueSize}
	for name, value := range positiveInts {
		if value < 1 {
			return fmt.Errorf("%s must be positive", name)
		}
	}
	if c.Postgres.MaxIdleConnections < 0 || c.Postgres.MaxIdleConnections > c.Postgres.MaxOpenConnections {
		return errors.New("POSTGRES_MAX_IDLE_CONNS must be between zero and POSTGRES_MAX_OPEN_CONNS")
	}
	if c.Redis.MinIdleConnections < 0 || c.Redis.MinIdleConnections > c.Redis.PoolSize {
		return errors.New("REDIS_MIN_IDLE_CONNS must be between zero and REDIS_POOL_SIZE")
	}
	positiveDurations := map[string]time.Duration{
		"POSTGRES_CONN_MAX_LIFETIME": c.Postgres.ConnectionMaxLifetime, "POSTGRES_CONN_MAX_IDLE_TIME": c.Postgres.ConnectionMaxIdleTime,
		"POSTGRES_CONNECT_TIMEOUT": c.Postgres.ConnectTimeout, "REDIS_OPERATION_TIMEOUT": c.Redis.OperationTimeout,
		"REDIS_DIAL_TIMEOUT": c.Redis.DialTimeout, "REDIS_READ_TIMEOUT": c.Redis.ReadTimeout, "REDIS_WRITE_TIMEOUT": c.Redis.WriteTimeout,
		"RABBITMQ_CONNECT_TIMEOUT": c.Rabbit.ConnectTimeout, "RABBITMQ_CONFIRM_TIMEOUT": c.Rabbit.ConfirmTimeout, "RABBITMQ_RECONNECT_MIN": c.Rabbit.ReconnectMin,
		"RABBITMQ_RECONNECT_MAX": c.Rabbit.ReconnectMax, "READINESS_TIMEOUT": c.ReadinessTimeout,
		"OUTBOX_POLL_INTERVAL": c.Outbox.PollInterval, "OUTBOX_LEASE_DURATION": c.Outbox.LeaseDuration,
		"OUTBOX_RETRY_BASE": c.Outbox.RetryBase, "OUTBOX_RETRY_MAX": c.Outbox.RetryMax,
	}
	for name, value := range positiveDurations {
		if value <= 0 {
			return fmt.Errorf("%s must be positive", name)
		}
	}
	if c.Rabbit.ReconnectMax < c.Rabbit.ReconnectMin {
		return errors.New("RABBITMQ_RECONNECT_MAX must be at least RABBITMQ_RECONNECT_MIN")
	}
	if c.Outbox.RetryMax < c.Outbox.RetryBase {
		return errors.New("OUTBOX_RETRY_MAX must be at least OUTBOX_RETRY_BASE")
	}
	if c.Outbox.LeaseDuration <= c.Rabbit.ConfirmTimeout {
		return errors.New("OUTBOX_LEASE_DURATION must exceed RABBITMQ_CONFIRM_TIMEOUT")
	}
	if c.Rabbit.Exchange == "" || c.Rabbit.Queue == "" || c.Rabbit.RoutingKey == "" {
		return errors.New("RabbitMQ exchange, queue, and routing key must not be empty")
	}
	return nil
}

func intEnv(key string, fallback int) (int, error) {
	value, ok := os.LookupEnv(key)
	if !ok {
		return fallback, nil
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return 0, fmt.Errorf("%s must be an integer", key)
	}
	return parsed, nil
}

func durationEnv(key string, fallback time.Duration) (time.Duration, error) {
	value, ok := os.LookupEnv(key)
	if !ok {
		return fallback, nil
	}
	parsed, err := time.ParseDuration(value)
	if err != nil {
		return 0, fmt.Errorf("%s must be a duration: %w", key, err)
	}
	return parsed, nil
}

func contains(values []string, value string) bool {
	for _, candidate := range values {
		if candidate == value {
			return true
		}
	}
	return false
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
