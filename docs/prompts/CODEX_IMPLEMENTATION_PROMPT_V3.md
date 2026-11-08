# Codex Task: Implement the Agreed Menu Platform Architecture (V3)

You are working in the existing Git repository for **Menu**, a Digital Ordering & Service Platform for cafés, restaurants, bars, and other dine-in businesses.

Your task is to implement the agreed architecture below. Treat these decisions as the target architecture, not suggestions. Do not preserve architectural decisions from the existing backend merely to avoid rewriting it.

## 1. Start by inspecting the repository

Before modifying anything:

1. Read the root `AGENTS.md`, README, and relevant architecture/requirements documents.
2. Identify the Git repository root, current branch, working-tree status, and existing project structure.
3. Inspect the current Next.js application, Go backend (including files deleted in the current working tree, recoverable from Git history), Docker Compose, and existing tests.
4. Determine whether an `archive/legacy-backend` branch exists. Do not assume it does.
5. Understand the current staged deletions and untracked directories. The old backend removal is an intentional part of the ongoing restructuring.

**Important safety rules:**
- Do not reset, clean, force-checkout, or overwrite the user's working tree.
- Do not discard staged changes.
- Do not commit or push changes.
- Do not delete the existing frontend.
- Preserve useful existing business logic and tests where appropriate, but migrate them into the new architecture rather than retaining the old structure.
- If an operation risks losing work, stop and explain before proceeding.
- Do not create a second Git repository or run `git init`.

## 2. Target monorepo structure

Keep one Git repository with independently managed applications:

```text
Menu/
├── apps/
│   ├── web/                       # Existing Next.js application
│   └── staff/                     # Flutter application (future)
│
├── services/
│   └── backend/                   # Go modular monolith
│       ├── cmd/
│       │   ├── api/
│       │   └── worker/
│       ├── internal/
│       │   ├── domain/
│       │   ├── application/
│       │   ├── infrastructure/
│       │   ├── interfaces/
│       │   │   └── http/
│       │   └── shared/
│       ├── ent/
│       │   ├── schema/
│       │   └── generate.go
│       ├── migrations/
│       ├── tests/
│       │   └── integration/
│       ├── go.mod
│       ├── go.sum
│       ├── atlas.hcl
│       └── .env.example
│
├── infra/
│   └── docker/
├── docs/
│   ├── architecture/
│   ├── api/
│   └── requirements/
├── docker-compose.yml
├── AGENTS.md
└── README.md
```

The existing Next.js application must remain functional. Do not initialize another Next.js application.

Flutter is a planned application, not an immediate implementation requirement. Do not generate a Flutter project yet.

## 3. Backend architecture

Implement a **layered modular monolith**, not distributed microservices.

Use these boundaries:

- `domain`: entities, value objects, business rules, domain events, and repository contracts.
- `application`: use cases, workflows, orchestration, transaction boundaries, and application-level interfaces.
- `infrastructure`: Ent/PostgreSQL adapters, Redis, RabbitMQ, filesystem storage, and WebSocket infrastructure.
- `interfaces/http`: HTTP handlers, DTOs, middleware, validation, and routing.
- `shared`: genuinely cross-cutting utilities such as configuration, logging, errors, and clock abstractions.

Organize business capabilities into modules:

- identity
- guest
- table
- catalog
- ordering
- service
- billing
- payment
- staff
- reporting
- notification

Use dependency inversion. Domain and application layers must not depend on HTTP, Ent-generated types, Redis, or RabbitMQ implementations.

Create interfaces where they represent meaningful boundaries. Do not mechanically create unnecessary interfaces for every struct.

Use two executable processes sharing the same application and infrastructure modules:

- `cmd/api`: HTTP API and WebSocket server.
- `cmd/worker`: background jobs, transactional outbox publishing, message consumers, and scheduled processing.

## 4. Technology decisions

Use:

- Go 1.27.0 (already installed).
- Ent v0.14.6 as the ORM and typed database client.
- Atlas for versioned database migrations.
- PostgreSQL 16 as the durable source of truth.
- pgx as the PostgreSQL driver.
- Chi for HTTP routing.
- Redis for caching and temporary state.
- RabbitMQ for asynchronous event distribution.
- WebSockets for real-time client updates.
- `log/slog` for structured logging.
- UUID identifiers.
- Protected persistent local filesystem storage behind a `MediaStorage` interface for voice attachments.

Use Go modules. Keep dependencies in `services/backend/go.mod`.

Do not introduce an additional ORM, SQL query generator, or competing migration framework.

The existing machine has an Atlas canary installation. Determine a compatible stable Atlas release, pin/document it, and do not silently depend on the canary build.

Use Ent schema generation through `go generate ./ent`. Keep one schema file per entity.

## 5. Core architectural/business rules

Implement the database model and application foundations around these requirements.

### Single-venue local-first MVP

- One installation represents one venue.
- Do not introduce tenant or branch IDs or tenant checks throughout every request.
- Remove tenant-specific runtime assumptions from the new architecture.
- Preserve useful QR resolution and related logic where appropriate.
- SaaS multi-tenancy is a future extension, not an MVP requirement.

### Guest identity and table sessions

- Customers access the platform through table QR codes without installing an application or creating accounts.
- Store the opaque guest credential in a secure HttpOnly cookie, never in localStorage.
- localStorage may hold non-secret context such as table ID, session ID, credential ID, and expiry.
- Support one browser/device identity participating in multiple table sessions.
- Persist guest credentials and session memberships in PostgreSQL.
- Redis may cache credential lookups and membership indexes; PostgreSQL remains authoritative.
- When another device scans a table QR with an active session, ask whether the visitor belongs to that session. If yes, allow joining; if no, do not expose the existing session's orders or bill.
- Do not implement guest join codes.
- A customer moving to another available table does not need staff authorization. Record the transfer and notify staff.
- Prevent conflicting active sessions for the same table.
- Support `active`, `idle`, and appropriate terminal session states.
- Only one active session may occupy a table at a time. An idle historical session must not prevent a new active session from being created.
- Preserve historical sessions, orders, and unpaid bills. Never overwrite an old session when a new customer arrives.
- If an old idle session is revisited after another session has occupied the table, do not reactivate it in a way that conflicts with the new session.
- Make inactivity timeout and guest credential expiration configurable through settings.
- Use server-side activity timestamps and background processing to transition inactive sessions to idle.
- Define meaningful activity explicitly; browser heartbeats alone must not indefinitely keep sessions active.

### Orders and service

Support:

`Received → Confirmed → Preparing → Ready → Delivered`

Also support cancellation and correction rules with appropriate audit history.

Customers can submit orders, customization, text notes, and voice instructions. Staff receive relevant notifications.

Service requests include waiter assistance, water, additional items, bill requests, and customer issues.

### Billing and payment

- Generate itemized bills from delivered orders according to the configured business rules.
- Electronic transfers are reported first and only become verified after staff verification.
- Cash is recorded only after the staff member physically receives it.
- Record amount received, amount applied, and change returned where applicable.
- Cashier can verify electronic transfers, record received cash, and close sessions.
- Waiter and Head Waiter can verify electronic transfers and close sessions.
- Cash recording is not a default waiter permission.
- Admin has full permissions.
- GM/Supervisor can verify electronic transfers and close sessions, but cash recording is not enabled by default.
- Kitchen staff cannot verify payments or close sessions.
- Waiter permissions must respect assigned-table scope.
- Use permission-based authorization rather than hardcoding every role check into handlers.

Do not assume that a customer-submitted transfer screenshot or reference is proof of payment.

### Messaging and real-time events

Implement the transactional outbox pattern:

1. Commit business changes and outbox events in the same PostgreSQL transaction.
2. A worker claims unpublished outbox records safely.
3. Publish to RabbitMQ with publisher confirms.
4. Handle retries and failures.
5. Make consumers idempotent.
6. Avoid relying on Redis for durable event delivery.

Use WebSockets to deliver appropriate live updates to Next.js and future Flutter clients.

### Media storage

Use a protected persistent local filesystem implementation behind an interface. Do not expose uploaded voice files as unrestricted public files.

## 6. Database design

Use Ent schemas as the source of truth for the application's database model.

Design the schema carefully, including:

- users and staff profiles;
- roles and permissions;
- guest credentials;
- tables;
- table sessions;
- session memberships;
- table transfers;
- menu categories and items;
- menu options/customizations;
- orders and order items;
- service requests;
- bills and bill items;
- payments and payment verification records;
- configurable business settings;
- notifications;
- audit records;
- transactional outbox events.

Use appropriate foreign keys, unique constraints, indexes, timestamps, and enum-like status fields.

Important: the database must support multiple historical idle sessions on a table but prevent multiple active sessions. Use an appropriate PostgreSQL partial unique index or equivalent constraint for active sessions only.

Do not create a simplistic schema that loses historical session or payment information.

Do not put every model in one large Ent schema file. Use one file per entity.

## 7. Atlas and migration strategy

The old backend contains handwritten migrations for tenant, menu, and order tables. Those belong to the legacy implementation.

Do not blindly apply them to the new V3 schema.

- Review existing migrations for useful business constraints and data-model insights.
- Build the new Ent schemas.
- Configure Atlas correctly for the new schema.
- Generate a clean initial migration for the V3 schema.
- Review generated SQL for correctness.
- Document how to apply migrations and inspect migration status.
- Do not drop or modify an existing database or volume to make migrations pass.
- If the existing database contains data, identify the migration/data-preservation implications and document them before any destructive operation.

Do not claim migrations are verified unless they have actually been generated and tested.

## 8. Infrastructure and Docker Compose

Keep the root `docker-compose.yml`.

Configure local development infrastructure for:

- PostgreSQL 16
- Redis 7.2
- RabbitMQ with its management interface
- Persistent volumes
- Health checks
- Environment-based configuration

Do not hardcode production credentials. Provide `.env.example` with development placeholders and document secure configuration.

The API and worker may be added as application services once their entrypoints are implemented.

## 9. Existing implementation migration

The old backend has modules for authentication, KDS, menu, notification, orders, payments, tenant management, WebSockets, and related tests.

Do not copy these wholesale.

Inspect them and selectively migrate useful:

- business rules;
- validation;
- payment provider integrations;
- order/KDS behavior;
- WebSocket behavior;
- tests;
- error handling.

Rewrite them to respect the new domain/application/infrastructure/interface boundaries.

Remove tenant enforcement from the MVP architecture.

Avoid leaving two competing implementations of the same functionality.

Keep the existing Next.js application working. Update Docker build contexts and scripts if the directory move requires it.

## 10. Quality requirements

- Follow idiomatic Go conventions.
- Use context propagation for I/O operations.
- Use dependency injection at application boundaries.
- Handle errors consistently.
- Use structured logging.
- Validate inputs at HTTP boundaries.
- Keep API DTOs separate from domain and Ent models.
- Implement database transactions where workflows require atomicity.
- Use tests for business rules and important workflows.
- Include integration tests for PostgreSQL, Redis, and RabbitMQ where practical.
- Avoid unnecessary abstractions and placeholder implementations.
- Do not invent unspecified business rules. Document unresolved decisions clearly.

## 11. Execution plan

Work in phases and report progress through actual changes, not just architectural descriptions.

**Phase 1 — Repository foundation**
- Confirm repository layout and preserve existing work.
- Establish the final monorepo structure.
- Initialize Go module and dependencies.
- Add backend configuration, logging, API entrypoint, and worker entrypoint.
- Establish build and test commands.

**Phase 2 — Database foundation**
- Define Ent schemas.
- Generate Ent client.
- Configure Atlas.
- Generate and review initial migration.
- Verify against a disposable development database without destroying existing data.

**Phase 3 — Infrastructure**
- Configure PostgreSQL, Redis, RabbitMQ.
- Implement infrastructure adapters.
- Implement transactional outbox and idempotent message-processing foundations.
- Implement WebSocket infrastructure.

**Phase 4 — Application architecture**
- Implement domain and application boundaries.
- Implement identity, guest/session, table, catalog, ordering, billing, payment, and notification foundations.
- Add authorization and configurable session-expiration behavior.

**Phase 5 — Frontend integration**
- Preserve the existing Next.js application.
- Align API contracts and WebSocket event contracts.
- Update Compose and development documentation.
- Do not initialize Flutter yet.

## 12. Verification and final report

Run and report the actual results of:

```bash
go generate ./ent
go test ./...
go vet ./...
```

Also verify:

- Ent generation succeeds.
- Atlas configuration loads.
- Migration generation succeeds.
- Migration application succeeds against a disposable test database.
- API and worker compile.
- Docker Compose configuration is valid.
- Existing Next.js dependencies and scripts still work.
- No accidental tenant enforcement remains in the MVP runtime.

If a command cannot run because a dependency or environment is unavailable, explain exactly what is missing. Never claim a test passed if it was not run.

At the end, provide:

1. Final repository tree.
2. Summary of architectural decisions implemented.
3. Important files created or changed.
4. Dependencies installed and their purposes.
5. Commands to run the full project locally.
6. Tests and verification results.
7. Outstanding issues and decisions requiring human input.

**Priority:** Implement the agreed V3 architecture correctly. Do not optimize for preserving the old backend's design. Preserve useful work where it makes sense, but architectural consistency, data integrity, and maintainability take priority.
