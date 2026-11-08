# Phase 3 infrastructure

The API and worker are separate processes. Both use the shared validated
configuration and structured logger. The API requires PostgreSQL, starts without
Redis when cache connectivity fails, and exposes liveness at `/healthz` and
dependency readiness at `/readyz`. PostgreSQL is the required readiness
dependency; Redis is reported as optional so cache failure does not prevent
durable reads and writes. The API does not connect to RabbitMQ. The worker
requires PostgreSQL and RabbitMQ and owns outbox publication.

Ent is initialized inside `internal/infrastructure/persistence/postgres` and
its generated types remain there. The PostgreSQL adapter configures the
connection pool, verifies the connection during startup, exposes a reusable
health check, and closes the Ent client/driver during shutdown. Schema changes
are never applied during process startup; use the documented Atlas migration
workflow separately.

Redis is accessed through the application `Cache` port and stores temporary
values only. Its URL parser supports `redis://` and `rediss://`, including URL
credentials and TLS. Callers must treat cache errors as misses/fallback
conditions; no business operation uses Redis as its durable store.

RabbitMQ uses the durable topic exchange `digital-ordering.events`, durable
queue `digital-ordering.events`, and `#` binding by default. Those names are
configurable. Publications are persistent, mandatory, and serialized per
confirm channel. The worker waits for a publisher confirmation and rejects
negative or returned messages. A dropped connection is retried with capped
exponential backoff. A startup connection failure fails worker startup; a
connection lost after startup is recovered by the publisher monitor.

The outbox worker claims one event at a time in a short transaction using
`FOR UPDATE SKIP LOCKED`, with owner and expiry lease columns. It releases the
transaction before broker publication. Confirmed events are marked published;
errors incremented at claim time are retained, their lease is cleared, and
`available_at` is advanced using capped exponential backoff with stable small
jitter. Failed events are never deleted or marked permanently terminal. An
expired lease is eligible for another worker. If the broker accepted an event
but the worker crashed before the database update, it may be published again.
Delivery is therefore **at least once**, and future consumers must deduplicate
using the event idempotency key. No business-specific event handlers are
registered in this phase.

The WebSocket hub has no route or unauthenticated endpoint. A future authorized
caller must authenticate a connection and choose its topic before calling
`ServeConn`. Each connection has one reader, one writer, and a bounded queue;
a slow consumer is disconnected instead of accumulating unbounded memory. Hub
payloads are JSON transport data and do not depend on Ent records.

Local media storage implements the application `MediaStorage` port. It writes
opaque UUID keys atomically, stores files with owner-only permissions, rejects
unsafe keys and symlinks, and never serves public URLs. Authorization and the
guest upload workflow are not part of this phase.

## Configuration

See [`services/backend/.env.example`](../../services/backend/.env.example) for
the complete local environment template. It contains development-only
placeholders, not credentials for shared environments. Copy it to an ignored
environment file, replace the placeholders, then load it into the process
environment before running the API or worker. `docker compose --env-file
services/backend/.env.example config` validates Compose interpolation without
starting services. If the backend processes themselves run inside containers,
their URLs must use Compose service names (`postgres`, `redis`, `rabbitmq`) in
place of `localhost`.

Required by the API: `DATABASE_URL`, `MEDIA_ROOT`. Required by the worker:
`DATABASE_URL`, `RABBITMQ_URL`. `REDIS_URL` is required only when starting the
Redis adapter; the API treats adapter connection failure as optional and
reports it on `/readyz`. PostgreSQL accepts `postgres://` or `postgresql://`,
Redis accepts `redis://` or `rediss://`, and RabbitMQ accepts `amqp://` or
`amqps://`.

Pool, connection, operation, confirm, reconnect, readiness, outbox, and
WebSocket queue settings are documented inline in the example file. Durations
use Go duration syntax. Configuration errors identify the variable but never
print configured URLs or credentials.

## Local services

The root Compose file preserves the existing `postgres_data` and `redis_data`
named volumes and adds `rabbitmq_data`. All development ports bind to loopback.
RabbitMQ's management port is available only on loopback. PostgreSQL, Redis,
and RabbitMQ include health checks. Do not use `docker compose down -v`; the
named volumes may contain local data.

The worker handles broker outages by retaining outbox rows and retrying
publication. PostgreSQL remains required. The API does not publish directly to
RabbitMQ, so broker outages do not prevent it from accepting durable work once
application workflows are added.
