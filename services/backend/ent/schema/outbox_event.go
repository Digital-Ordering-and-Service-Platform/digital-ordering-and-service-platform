package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/google/uuid"
)

// OutboxEvent is committed with business changes and later published by the
// worker. Lease fields allow safe concurrent claiming in a future adapter.
type OutboxEvent struct{ ent.Schema }

func (OutboxEvent) Mixin() []ent.Mixin { return []ent.Mixin{BaseMixin{}} }
func (OutboxEvent) Fields() []ent.Field {
	return []ent.Field{
		field.String("event_type").NotEmpty().MaxLen(160),
		field.UUID("aggregate_id", uuid.UUID{}),
		field.String("aggregate_type").NotEmpty().MaxLen(120),
		field.String("idempotency_key").NotEmpty().MaxLen(200).Unique(),
		field.JSON("payload", map[string]any{}),
		field.Enum("status").Values("pending", "published").Default("pending"),
		field.Int("attempts").NonNegative().Default(0),
		field.Time("available_at").Default(utcNow),
		field.Time("lease_until").Optional().Nillable(),
		field.String("lease_owner").Optional().Nillable().MaxLen(160),
		field.String("last_error").Optional().Nillable().MaxLen(2000),
		field.Time("published_at").Optional().Nillable(),
	}
}
func (OutboxEvent) Indexes() []ent.Index {
	return []ent.Index{index.Fields("status", "available_at", "created_at")}
}
