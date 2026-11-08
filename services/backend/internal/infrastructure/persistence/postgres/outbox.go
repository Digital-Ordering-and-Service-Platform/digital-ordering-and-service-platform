package postgres

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"
)

// OutboxEvent is an infrastructure-neutral message envelope, not an Ent model.
type OutboxEvent struct {
	ID             string
	Type           string
	AggregateID    string
	AggregateType  string
	IdempotencyKey string
	Payload        json.RawMessage
	Attempts       int
}

type OutboxStore struct{ db *sql.DB }

// Claim leases eligible rows in a short transaction. Expired leases are
// reclaimable, and SKIP LOCKED allows independent workers to proceed safely.
func (s *OutboxStore) Claim(ctx context.Context, owner string, limit int, lease time.Duration) ([]OutboxEvent, error) {
	if s == nil || s.db == nil {
		return nil, errors.New("outbox database is not initialized")
	}
	if owner == "" || limit < 1 || lease <= 0 {
		return nil, errors.New("outbox claim requires owner, positive limit, and positive lease")
	}
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("begin outbox claim: %w", err)
	}
	defer func() { _ = tx.Rollback() }()
	const query = `WITH candidates AS (
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
          event.idempotency_key, event.payload, event.attempts`
	rows, err := tx.QueryContext(ctx, query, limit, owner, lease.Microseconds())
	if err != nil {
		return nil, fmt.Errorf("claim outbox events: %w", err)
	}
	var events []OutboxEvent
	for rows.Next() {
		var event OutboxEvent
		if err := rows.Scan(&event.ID, &event.Type, &event.AggregateID, &event.AggregateType, &event.IdempotencyKey, &event.Payload, &event.Attempts); err != nil {
			_ = rows.Close()
			return nil, fmt.Errorf("scan claimed outbox event: %w", err)
		}
		events = append(events, event)
	}
	if err := rows.Err(); err != nil {
		_ = rows.Close()
		return nil, fmt.Errorf("read claimed outbox events: %w", err)
	}
	if err := rows.Close(); err != nil {
		return nil, fmt.Errorf("close claimed outbox rows: %w", err)
	}
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("commit outbox claim: %w", err)
	}
	return events, nil
}

func (s *OutboxStore) MarkPublished(ctx context.Context, id, owner string) error {
	if s == nil || s.db == nil {
		return errors.New("outbox database is not initialized")
	}
	result, err := s.db.ExecContext(ctx, `UPDATE outbox_events SET status='published', published_at=CURRENT_TIMESTAMP,
 lease_owner=NULL, lease_until=NULL, last_error=NULL, updated_at=CURRENT_TIMESTAMP
 WHERE id=$1 AND status='pending' AND lease_owner=$2`, id, owner)
	return requireLeaseUpdate(result, err, "mark outbox event published")
}

func (s *OutboxStore) MarkFailed(ctx context.Context, id, owner string, retryAfter time.Duration, cause error) error {
	if s == nil || s.db == nil {
		return errors.New("outbox database is not initialized")
	}
	if retryAfter < 0 {
		return errors.New("outbox retry delay must not be negative")
	}
	message := "publication failed"
	if cause != nil {
		message = cause.Error()
	}
	message = strings.TrimSpace(message)
	if len(message) > 2000 {
		message = message[:2000]
	}
	result, err := s.db.ExecContext(ctx, `UPDATE outbox_events SET available_at=CURRENT_TIMESTAMP + make_interval(secs => $3::double precision / 1000000),
 lease_owner=NULL, lease_until=NULL, last_error=$4, updated_at=CURRENT_TIMESTAMP
 WHERE id=$1 AND status='pending' AND lease_owner=$2`, id, owner, retryAfter.Microseconds(), message)
	return requireLeaseUpdate(result, err, "release failed outbox event")
}

func requireLeaseUpdate(result sql.Result, err error, operation string) error {
	if err != nil {
		return fmt.Errorf("%s: %w", operation, err)
	}
	count, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("%s rows affected: %w", operation, err)
	}
	if count != 1 {
		return fmt.Errorf("%s: lease was lost", operation)
	}
	return nil
}
