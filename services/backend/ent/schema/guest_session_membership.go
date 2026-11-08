package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// GuestSessionMembership grants one device access to one table session.
type GuestSessionMembership struct{ ent.Schema }

func (GuestSessionMembership) Mixin() []ent.Mixin { return []ent.Mixin{BaseMixin{}} }
func (GuestSessionMembership) Fields() []ent.Field {
	return []ent.Field{field.Time("joined_at").Default(utcNow), field.Time("left_at").Optional().Nillable()}
}
func (GuestSessionMembership) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("guest_credential", GuestCredential.Type).Unique().Required(),
		edge.To("table_session", TableSession.Type).Unique().Required(),
	}
}
func (GuestSessionMembership) Indexes() []ent.Index {
	return []ent.Index{index.Edges("guest_credential", "table_session").Unique(), index.Edges("table_session", "guest_credential")}
}
