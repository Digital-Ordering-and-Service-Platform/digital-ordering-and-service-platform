package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// CustomerOrder is a guest order; corrections are represented as new orders
// and their reasons are retained in status/audit history rather than mutation.
type CustomerOrder struct{ ent.Schema }

func (CustomerOrder) Mixin() []ent.Mixin { return []ent.Mixin{BaseMixin{}} }
func (CustomerOrder) Fields() []ent.Field {
	return []ent.Field{
		field.Enum("status").Values("received", "confirmed", "preparing", "ready", "delivered", "cancelled").Default("received"),
		field.String("customer_note").Default("").MaxLen(2000),
		field.Time("submitted_at").Default(utcNow),
		field.Time("delivered_at").Optional().Nillable(),
		field.Time("cancelled_at").Optional().Nillable(),
		field.String("correction_reason").Optional().Nillable().MaxLen(1000),
	}
}
func (CustomerOrder) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("table_session", TableSession.Type).Unique().Required(),
		edge.To("placed_by", GuestCredential.Type).Unique(),
		edge.From("items", OrderItem.Type).Ref("customer_order"),
		edge.From("status_history", OrderStatusHistory.Type).Ref("customer_order"),
		edge.To("correction_of", CustomerOrder.Type).Unique().From("corrections"),
	}
}
func (CustomerOrder) Indexes() []ent.Index {
	return []ent.Index{index.Fields("status", "submitted_at")}
}
