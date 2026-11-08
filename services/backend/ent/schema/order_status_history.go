package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/google/uuid"
)

// OrderStatusHistory is an append-only state transition and actor record.
type OrderStatusHistory struct{ ent.Schema }

func (OrderStatusHistory) Mixin() []ent.Mixin { return []ent.Mixin{IDCreatedMixin{}} }
func (OrderStatusHistory) Fields() []ent.Field {
	return []ent.Field{
		field.String("from_status").Optional().Nillable().MaxLen(32),
		field.Enum("to_status").Values("received", "confirmed", "preparing", "ready", "delivered", "cancelled"),
		field.Enum("actor_type").Values("staff", "guest", "system"),
		field.UUID("actor_id", uuid.UUID{}).Optional().Nillable(),
		field.String("reason").Default("").MaxLen(1000),
	}
}
func (OrderStatusHistory) Edges() []ent.Edge {
	return []ent.Edge{edge.To("customer_order", CustomerOrder.Type).Unique().Required()}
}
func (OrderStatusHistory) Indexes() []ent.Index {
	return []ent.Index{index.Fields("created_at").Edges("customer_order")}
}
