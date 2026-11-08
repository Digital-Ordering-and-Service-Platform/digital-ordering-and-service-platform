// Package redis implements temporary cache access. PostgreSQL remains the source
// of truth and callers must handle cache errors by falling back as appropriate.
package redis

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/Digital-Ordering-and-Service-Platform/digital-ordering-and-service-platform/services/backend/internal/application"
	"github.com/Digital-Ordering-and-Service-Platform/digital-ordering-and-service-platform/services/backend/internal/shared/config"
	redisv9 "github.com/redis/go-redis/v9"
)

type Client struct {
	client  *redisv9.Client
	timeout time.Duration
}

func Open(ctx context.Context, rawURL string, cfg config.Redis) (*Client, error) {
	if rawURL == "" {
		return nil, errors.New("REDIS_URL is required")
	}
	options, err := redisv9.ParseURL(rawURL)
	if err != nil {
		return nil, fmt.Errorf("parse REDIS_URL: %w", err)
	}
	options.DialTimeout, options.ReadTimeout, options.WriteTimeout = cfg.DialTimeout, cfg.ReadTimeout, cfg.WriteTimeout
	options.PoolSize, options.MinIdleConns = cfg.PoolSize, cfg.MinIdleConnections
	client := redisv9.NewClient(options)
	checkCtx, cancel := context.WithTimeout(ctx, cfg.OperationTimeout)
	defer cancel()
	if err := client.Ping(checkCtx).Err(); err != nil {
		_ = client.Close()
		return nil, fmt.Errorf("connect to Redis: %w", err)
	}
	return &Client{client: client, timeout: cfg.OperationTimeout}, nil
}

func (c *Client) Check(ctx context.Context) error {
	if c == nil || c.client == nil {
		return errors.New("Redis is not initialized")
	}
	checkCtx, cancel := context.WithTimeout(ctx, c.timeout)
	defer cancel()
	return c.client.Ping(checkCtx).Err()
}

func (c *Client) Get(ctx context.Context, key string) (string, bool, error) {
	if c == nil || c.client == nil {
		return "", false, errors.New("Redis is not initialized")
	}
	operationCtx, cancel := context.WithTimeout(ctx, c.timeout)
	defer cancel()
	result, err := c.client.Get(operationCtx, key).Result()
	if errors.Is(err, redisv9.Nil) {
		return "", false, nil
	}
	return result, err == nil, err
}

func (c *Client) Set(ctx context.Context, key, value string, ttl time.Duration) error {
	if c == nil || c.client == nil {
		return errors.New("Redis is not initialized")
	}
	operationCtx, cancel := context.WithTimeout(ctx, c.timeout)
	defer cancel()
	return c.client.Set(operationCtx, key, value, ttl).Err()
}

func (c *Client) Delete(ctx context.Context, key string) error {
	if c == nil || c.client == nil {
		return errors.New("Redis is not initialized")
	}
	operationCtx, cancel := context.WithTimeout(ctx, c.timeout)
	defer cancel()
	return c.client.Del(operationCtx, key).Err()
}

func (c *Client) Close() error {
	if c == nil || c.client == nil {
		return nil
	}
	return c.client.Close()
}

var _ application.Cache = (*Client)(nil)
