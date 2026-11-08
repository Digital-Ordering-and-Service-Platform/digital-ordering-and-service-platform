package rabbitmq

import (
	"context"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/Digital-Ordering-and-Service-Platform/digital-ordering-and-service-platform/services/backend/internal/infrastructure/persistence/postgres"
	"github.com/Digital-Ordering-and-Service-Platform/digital-ordering-and-service-platform/services/backend/internal/shared/config"
	"github.com/rabbitmq/amqp091-go"
)

func TestOpenFailsWhenRabbitMQIsUnavailable(t *testing.T) {
	cfg := config.Rabbit{ConnectTimeout: 100 * time.Millisecond, ConfirmTimeout: 100 * time.Millisecond, ReconnectMin: time.Millisecond, ReconnectMax: 10 * time.Millisecond, Exchange: "events", Queue: "events", RoutingKey: "#"}
	_, err := Open(context.Background(), "amqp://user:private-secret@127.0.0.1:1/", cfg, nil)
	if err == nil {
		t.Fatal("Open succeeded without RabbitMQ")
	}
	if strings.Contains(err.Error(), "private-secret") {
		t.Fatalf("error leaked RabbitMQ password: %v", err)
	}
}

func TestPublisherConfirmAndRouting(t *testing.T) {
	rawURL := strings.TrimSpace(os.Getenv("RABBITMQ_TEST_URL"))
	if rawURL == "" {
		t.Skip("RABBITMQ_TEST_URL is not set; disposable RabbitMQ integration test skipped")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	name := "phase3.test." + time.Now().Format("150405.000000000")
	cfg := config.Rabbit{ConnectTimeout: 2 * time.Second, ConfirmTimeout: 3 * time.Second, ReconnectMin: time.Second, ReconnectMax: 2 * time.Second, Exchange: name, Queue: name, RoutingKey: "order.*"}
	publisher, err := Open(ctx, rawURL, cfg, nil)
	if err != nil {
		t.Fatal(err)
	}
	defer publisher.Close()
	if err := publisher.Publish(ctx, testEvent("order.created")); err != nil {
		t.Fatalf("confirmed routed publication failed: %v", err)
	}
	connection, err := amqp091.Dial(rawURL)
	if err != nil {
		t.Fatal(err)
	}
	defer connection.Close()
	channel, err := connection.Channel()
	if err != nil {
		t.Fatal(err)
	}
	defer channel.Close()
	deliveries, err := channel.Consume(name, "phase3-test", false, false, false, false, nil)
	if err != nil {
		t.Fatal(err)
	}
	select {
	case delivery := <-deliveries:
		if delivery.MessageId != "test-key" || delivery.DeliveryMode != amqp091.Persistent {
			t.Fatalf("unexpected delivery properties: %+v", delivery)
		}
		_ = delivery.Ack(false)
	case <-ctx.Done():
		t.Fatal("confirmed event was not routed to durable queue")
	}
	if err := publisher.Publish(ctx, testEvent("payment.created")); err == nil {
		t.Fatal("unroutable mandatory publication was treated as confirmed success")
	}
}

func testEvent(eventType string) postgres.OutboxEvent {
	return postgres.OutboxEvent{ID: "event-id", Type: eventType, AggregateType: "order", AggregateID: "aggregate-id", IdempotencyKey: "test-key", Payload: []byte(`{"status":"received"}`)}
}
