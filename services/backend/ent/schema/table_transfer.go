package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

// TableTransfer records a guest-authorized move and its source/destination.
type TableTransfer struct{ ent.Schema }

func (TableTransfer) Mixin() []ent.Mixin { return []ent.Mixin{IDCreatedMixin{}} }
func (TableTransfer) Fields() []ent.Field {
	return []ent.Field{field.String("reason").Default("").MaxLen(500)}
}
func (TableTransfer) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("table_session", TableSession.Type).Unique().Required(),
		edge.To("from_table", DiningTable.Type).Unique().Required(),
		edge.To("to_table", DiningTable.Type).Unique().Required(),
		edge.To("initiated_by", GuestCredential.Type).Unique().Required(),
	}
}
