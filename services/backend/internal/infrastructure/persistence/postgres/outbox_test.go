package postgres

import (
	"context"
	"encoding/json"
	"errors"
	"regexp"
	"strings"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
)

func TestClaimUsesSkipLockedAndReclaimsExpiredLeases(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	query := regexp.QuoteMeta(`WITH candidates AS (
 SELECT id FROM outbox_events
 WHERE status = 'pending' AND available_at <= CURRENT_TIMESTAMP
   AND (lease_until IS NULL OR lease_until <= CURRENT_TIMESTAMP)
 ORDER BY available_at, created_at
 FOR UPDATE SKIP LOCKED
 LIMIT $1
)
UPDATE outbox_events AS event
SET lease_owner = $2, lease_until = CURRENT_TIMESTAMP + make_interval(secs => $3::double precision / 1000000),
    attempts = event.attempts + 1, updated_at = CURRENT_TIMESTAMP
FROM candidates
WHERE event.id = candidates.id
RETURNING event.id, event.event_type, event.aggregate_id, event.aggregate_type,
          event.idempotency_key, event.payload, event.attempts`)
	if !strings.Contains(query, "FOR UPDATE SKIP LOCKED") || !strings.Contains(query, "lease_until <= CURRENT_TIMESTAMP") {
		t.Fatal("test query did not include safe claim and lease recovery predicates")
	}
	lease := 30 * time.Second
	mock.ExpectBegin()
	mock.ExpectQuery(query).WithArgs(1, "worker-a", lease.Microseconds()).WillReturnRows(sqlmock.NewRows([]string{"id", "event_type", "aggregate_id", "aggregate_type", "idempotency_key", "payload", "attempts"}).AddRow("10000000-0000-4000-8000-000000000001", "order.created", "20000000-0000-4000-8000-000000000001", "order", "order:one", []byte(`{"ok":true}`), 2))
	mock.ExpectCommit()
	store := OutboxStore{db: db}
	events, err := store.Claim(context.Background(), "worker-a", 1, lease)
	if err != nil {
		t.Fatal(err)
	}
	if len(events) != 1 || events[0].Attempts != 2 || !json.Valid(events[0].Payload) {
		t.Fatalf("unexpected claimed event: %+v", events)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}

func TestOutboxLeasePublicationAndRetryTransitions(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	store := OutboxStore{db: db}
	mock.ExpectExec(regexp.QuoteMeta("UPDATE outbox_events SET status='published', published_at=CURRENT_TIMESTAMP,\n lease_owner=NULL, lease_until=NULL, last_error=NULL, updated_at=CURRENT_TIMESTAMP\n WHERE id=$1 AND status='pending' AND lease_owner=$2")).WithArgs("event-1", "worker-a").WillReturnResult(sqlmock.NewResult(0, 1))
	if err := store.MarkPublished(context.Background(), "event-1", "worker-a"); err != nil {
		t.Fatal(err)
	}
	mock.ExpectExec(regexp.QuoteMeta("UPDATE outbox_events SET available_at=CURRENT_TIMESTAMP + make_interval(secs => $3::double precision / 1000000),\n lease_owner=NULL, lease_until=NULL, last_error=$4, updated_at=CURRENT_TIMESTAMP\n WHERE id=$1 AND status='pending' AND lease_owner=$2")).WithArgs("event-2", "worker-a", 2*time.Second.Microseconds(), "broker unavailable").WillReturnResult(sqlmock.NewResult(0, 1))
	if err := store.MarkFailed(context.Background(), "event-2", "worker-a", 2*time.Second, errors.New("broker unavailable")); err != nil {
		t.Fatal(err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}

func TestLostLeaseIsReported(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	mock.ExpectExec("UPDATE outbox_events").WithArgs("event-1", "old-worker").WillReturnResult(sqlmock.NewResult(0, 0))
	if err := (&OutboxStore{db: db}).MarkPublished(context.Background(), "event-1", "old-worker"); err == nil || !strings.Contains(err.Error(), "lease was lost") {
		t.Fatalf("error = %v, want lost lease", err)
	}
}
