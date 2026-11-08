package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/google/uuid"
)

// AuditRecord is an append-only record for sensitive administrative changes.
// The polymorphic subject is stored as type and UUID so audit history survives
// retention or deactivation of the referenced business record.
type AuditRecord struct{ ent.Schema }

func (AuditRecord) Mixin() []ent.Mixin { return []ent.Mixin{IDCreatedMixin{}} }
func (AuditRecord) Fields() []ent.Field {
	return []ent.Field{
		field.Enum("actor_type").Values("staff", "guest", "system"),
		field.UUID("actor_id", uuid.UUID{}).Optional().Nillable(),
		field.String("action").NotEmpty().MaxLen(120),
		field.String("entity_type").NotEmpty().MaxLen(120),
		field.UUID("entity_id", uuid.UUID{}),
		field.JSON("before", map[string]any{}).Optional(),
		field.JSON("after", map[string]any{}).Optional(),
		field.String("reason").Default("").MaxLen(1000),
	}
}
func (AuditRecord) Indexes() []ent.Index {
	return []ent.Index{index.Fields("entity_type", "entity_id", "created_at"), index.Fields("actor_type", "actor_id", "created_at")}
}
