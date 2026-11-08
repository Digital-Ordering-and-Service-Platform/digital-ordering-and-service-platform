package outbox

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/Digital-Ordering-and-Service-Platform/digital-ordering-and-service-platform/services/backend/internal/infrastructure/persistence/postgres"
)

type fakeStore struct {
	events    []postgres.OutboxEvent
	published []string
	failed    []failure
	claimed   int
}
type failure struct {
	id, owner string
	delay     time.Duration
	err       error
}

func (s *fakeStore) Claim(_ context.Context, _ string, limit int, _ time.Duration) ([]postgres.OutboxEvent, error) {
	s.claimed++
	if limit != 1 {
		return nil, errors.New("claims must be one at a time")
	}
	events := s.events
	s.events = nil
	return events, nil
}
func (s *fakeStore) MarkPublished(_ context.Context, id, owner string) error {
	s.published = append(s.published, id+"/"+owner)
	return nil
}
func (s *fakeStore) MarkFailed(_ context.Context, id, owner string, delay time.Duration, err error) error {
	s.failed = append(s.failed, failure{id, owner, delay, err})
	return nil
}

type fakeBroker struct {
	err       error
	published []string
}

func (b *fakeBroker) Publish(_ context.Context, event postgres.OutboxEvent) error {
	b.published = append(b.published, event.ID)
	return b.err
}

func TestWorkerMarksOnlyConfirmedPublicationPublished(t *testing.T) {
	store := &fakeStore{events: []postgres.OutboxEvent{{ID: "event-1", Attempts: 1}}}
	broker := &fakeBroker{}
	worker, err := New(store, broker, Config{Owner: "worker-a", BatchSize: 10, PollInterval: time.Second, LeaseDuration: 30 * time.Second, RetryBase: time.Second, RetryMax: time.Minute}, nil)
	if err != nil {
		t.Fatal(err)
	}
	if err := worker.DrainOnce(context.Background()); err != nil {
		t.Fatal(err)
	}
	if len(broker.published) != 1 || len(store.published) != 1 || len(store.failed) != 0 {
		t.Fatalf("unexpected delivery state: broker=%v published=%v failed=%v", broker.published, store.published, store.failed)
	}
}

func TestWorkerReleasesFailedPublicationWithBackoff(t *testing.T) {
	store := &fakeStore{events: []postgres.OutboxEvent{{ID: "event-2", Attempts: 3}}}
	broker := &fakeBroker{err: errors.New("confirm failed")}
	worker, err := New(store, broker, Config{Owner: "worker-b", BatchSize: 5, PollInterval: time.Second, LeaseDuration: 30 * time.Second, RetryBase: time.Second, RetryMax: 4 * time.Second}, nil)
	if err != nil {
		t.Fatal(err)
	}
	if err := worker.DrainOnce(context.Background()); err != nil {
		t.Fatal(err)
	}
	if len(store.published) != 0 || len(store.failed) != 1 {
		t.Fatalf("unexpected retry state: published=%v failed=%v", store.published, store.failed)
	}
	if store.failed[0].id != "event-2" || store.failed[0].owner != "worker-b" || store.failed[0].err.Error() != "confirm failed" {
		t.Fatalf("unexpected failure record: %+v", store.failed[0])
	}
	if store.failed[0].delay <= 0 || store.failed[0].delay > 4*time.Second {
		t.Fatalf("retry delay = %s, outside configured backoff", store.failed[0].delay)
	}
}
