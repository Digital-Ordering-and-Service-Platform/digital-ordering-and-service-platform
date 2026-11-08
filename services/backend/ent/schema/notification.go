package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// Notification is a durable in-app notification record; delivery is handled
// outside the database schema in a later phase.
type Notification struct{ ent.Schema }

func (Notification) Mixin() []ent.Mixin { return []ent.Mixin{BaseMixin{}} }
func (Notification) Fields() []ent.Field {
	return []ent.Field{
		field.String("event_type").NotEmpty().MaxLen(120),
		field.Enum("audience").Values("staff", "guest"),
		field.String("title").NotEmpty().MaxLen(180),
		field.String("body").Default("").MaxLen(2000),
		field.JSON("payload", map[string]any{}).Default(map[string]any{}),
		field.Time("read_at").Optional().Nillable(),
	}
}
func (Notification) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("staff_recipient", StaffUser.Type).Unique(),
		edge.To("guest_recipient", GuestCredential.Type).Unique(),
		edge.To("table_session", TableSession.Type).Unique(),
	}
}
func (Notification) Indexes() []ent.Index {
	return []ent.Index{index.Fields("audience", "read_at", "created_at"), index.Fields("event_type", "created_at")}
}
