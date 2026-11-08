// Package rabbitmq implements durable event publication with publisher confirms.
package rabbitmq

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net"
	"sync"
	"time"

	"github.com/Digital-Ordering-and-Service-Platform/digital-ordering-and-service-platform/services/backend/internal/infrastructure/persistence/postgres"
	"github.com/Digital-Ordering-and-Service-Platform/digital-ordering-and-service-platform/services/backend/internal/shared/config"
	"github.com/rabbitmq/amqp091-go"
)

type envelope struct {
	ID             string          `json:"id"`
	Type           string          `json:"type"`
	AggregateType  string          `json:"aggregate_type"`
	AggregateID    string          `json:"aggregate_id"`
	IdempotencyKey string          `json:"idempotency_key"`
	Payload        json.RawMessage `json:"payload"`
	OccurredAt     time.Time       `json:"occurred_at"`
}

type Publisher struct {
	cfg          config.Rabbit
	url          string
	mu           sync.RWMutex
	connection   *amqp091.Connection
	channel      *amqp091.Channel
	confirm      <-chan amqp091.Confirmation
	returns      <-chan amqp091.Return
	closeCh      <-chan *amqp091.Error
	channelClose <-chan *amqp091.Error
	publishMu    sync.Mutex
	reconnectMu  sync.Mutex
	cancel       context.CancelFunc
	done         chan struct{}
	logger       *slog.Logger
}

func Open(ctx context.Context, rawURL string, cfg config.Rabbit, logger *slog.Logger) (*Publisher, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	if rawURL == "" {
		return nil, errors.New("RABBITMQ_URL is required")
	}
	if logger == nil {
		logger = slog.Default()
	}
	p := &Publisher{cfg: cfg, url: rawURL, done: make(chan struct{}), logger: logger}
	if err := p.connect(); err != nil {
		return nil, fmt.Errorf("connect to RabbitMQ: %w", err)
	}
	if err := ctx.Err(); err != nil {
		_ = p.Close()
		return nil, err
	}
	monitorCtx, cancel := context.WithCancel(context.Background())
	p.cancel = cancel
	go p.monitor(monitorCtx)
	return p, nil
}

func (p *Publisher) connect() error {
	dialer := &net.Dialer{Timeout: p.cfg.ConnectTimeout}
	conn, err := amqp091.DialConfig(p.url, amqp091.Config{Dial: dialer.Dial})
	if err != nil {
		return err
	}
	channel, err := conn.Channel()
	if err != nil {
		_ = conn.Close()
		return err
	}
	if err = channel.ExchangeDeclare(p.cfg.Exchange, amqp091.ExchangeTopic, true, false, false, false, nil); err != nil {
		_ = channel.Close()
		_ = conn.Close()
		return fmt.Errorf("declare event exchange: %w", err)
	}
	queue, err := channel.QueueDeclare(p.cfg.Queue, true, false, false, false, nil)
	if err != nil {
		_ = channel.Close()
		_ = conn.Close()
		return fmt.Errorf("declare event queue: %w", err)
	}
	if err = channel.QueueBind(queue.Name, p.cfg.RoutingKey, p.cfg.Exchange, false, nil); err != nil {
		_ = channel.Close()
		_ = conn.Close()
		return fmt.Errorf("bind event queue: %w", err)
	}
	if err = channel.Confirm(false); err != nil {
		_ = channel.Close()
		_ = conn.Close()
		return fmt.Errorf("enable publisher confirms: %w", err)
	}
	confirm := channel.NotifyPublish(make(chan amqp091.Confirmation, 1))
	returns := channel.NotifyReturn(make(chan amqp091.Return, 1))
	connectionClose := conn.NotifyClose(make(chan *amqp091.Error, 1))
	channelClose := channel.NotifyClose(make(chan *amqp091.Error, 1))
	p.mu.Lock()
	oldConn, oldChannel := p.connection, p.channel
	p.connection, p.channel = conn, channel
	p.confirm, p.returns, p.closeCh, p.channelClose = confirm, returns, connectionClose, channelClose
	p.mu.Unlock()
	if oldChannel != nil {
		_ = oldChannel.Close()
	}
	if oldConn != nil {
		_ = oldConn.Close()
	}
	return nil
}

func (p *Publisher) monitor(ctx context.Context) {
	defer close(p.done)
	backoff := p.cfg.ReconnectMin
	for {
		p.mu.RLock()
		connClose, chanClose := p.closeCh, p.channelClose
		p.mu.RUnlock()
		select {
		case <-ctx.Done():
			return
		case <-connClose:
		case <-chanClose:
		}
		p.reconnectMu.Lock()
		for ctx.Err() == nil {
			if err := p.connect(); err == nil {
				p.logger.Info("RabbitMQ connection recovered")
				backoff = p.cfg.ReconnectMin
				break
			} else {
				p.logger.Warn("RabbitMQ reconnect failed", "retry_after", backoff, "error", err)
			}
			timer := time.NewTimer(backoff)
			select {
			case <-ctx.Done():
				timer.Stop()
				p.reconnectMu.Unlock()
				return
			case <-timer.C:
			}
			backoff *= 2
			if backoff > p.cfg.ReconnectMax {
				backoff = p.cfg.ReconnectMax
			}
		}
		p.reconnectMu.Unlock()
		if ctx.Err() != nil {
			return
		}
	}
}

func (p *Publisher) Check(ctx context.Context) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	p.mu.RLock()
	defer p.mu.RUnlock()
	if p.connection == nil || p.connection.IsClosed() || p.channel == nil || p.channel.IsClosed() {
		return errors.New("RabbitMQ connection is unavailable")
	}
	return nil
}

func (p *Publisher) Publish(ctx context.Context, event postgres.OutboxEvent) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	body, err := json.Marshal(envelope{ID: event.ID, Type: event.Type, AggregateType: event.AggregateType, AggregateID: event.AggregateID, IdempotencyKey: event.IdempotencyKey, Payload: event.Payload, OccurredAt: time.Now().UTC()})
	if err != nil {
		return fmt.Errorf("encode event envelope: %w", err)
	}
	p.publishMu.Lock()
	defer p.publishMu.Unlock()
	p.mu.RLock()
	channel, confirms, returns := p.channel, p.confirm, p.returns
	p.mu.RUnlock()
	if channel == nil || channel.IsClosed() {
		return errors.New("RabbitMQ channel is unavailable")
	}
	if err := channel.PublishWithContext(ctx, p.cfg.Exchange, event.Type, true, false, amqp091.Publishing{
		ContentType: "application/json", DeliveryMode: amqp091.Persistent, MessageId: event.IdempotencyKey,
		Type: event.Type, Timestamp: time.Now().UTC(), Body: body,
	}); err != nil {
		return fmt.Errorf("publish event: %w", err)
	}
	confirmTimer := time.NewTimer(p.cfg.ConfirmTimeout)
	defer confirmTimer.Stop()
	select {
	case <-ctx.Done():
		_ = channel.Close()
		return ctx.Err()
	case <-confirmTimer.C:
		_ = channel.Close()
		return errors.New("timed out waiting for RabbitMQ publisher confirm")
	case delivery, ok := <-confirms:
		if !ok {
			return errors.New("RabbitMQ publisher confirmation stream closed")
		}
		// Mandatory returns are delivered before the corresponding confirm. Drain
		// immediately after the confirm; publication is serialized per channel.
		select {
		case returned := <-returns:
			if returned.MessageId == event.IdempotencyKey {
				return fmt.Errorf("RabbitMQ returned unroutable event %q: %s", event.Type, returned.ReplyText)
			}
		default:
		}
		if !delivery.Ack {
			return errors.New("RabbitMQ negatively acknowledged event")
		}
		return nil
	}
}

func (p *Publisher) Close() error {
	if p == nil {
		return nil
	}
	if p.cancel != nil {
		p.cancel()
		<-p.done
	}
	p.mu.Lock()
	defer p.mu.Unlock()
	var err error
	if p.channel != nil {
		err = p.channel.Close()
	}
	if p.connection != nil {
		if closeErr := p.connection.Close(); err == nil && closeErr != nil {
			err = closeErr
		}
	}
	p.channel, p.connection = nil, nil
	return err
}

var _ interface {
	Publish(context.Context, postgres.OutboxEvent) error
} = (*Publisher)(nil)
