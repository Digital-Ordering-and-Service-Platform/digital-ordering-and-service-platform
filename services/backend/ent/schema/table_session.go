package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/dialect/entsql"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// TableSession preserves one dining visit and its unpaid work as history.
type TableSession struct{ ent.Schema }

func (TableSession) Mixin() []ent.Mixin { return []ent.Mixin{BaseMixin{}} }
func (TableSession) Fields() []ent.Field {
	return []ent.Field{
		field.Enum("status").Values("active", "idle", "closed", "cancelled").Default("active"),
		field.Time("started_at").Default(utcNow),
		field.Time("last_activity_at").Default(utcNow),
		field.Time("idled_at").Optional().Nillable(),
		field.Time("closed_at").Optional().Nillable(),
	}
}
func (TableSession) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("dining_table", DiningTable.Type).Unique().Required(),
		edge.From("memberships", GuestSessionMembership.Type).Ref("table_session"),
		edge.From("orders", CustomerOrder.Type).Ref("table_session"),
		edge.From("service_requests", ServiceRequest.Type).Ref("table_session"),
		edge.From("bills", Bill.Type).Ref("table_session"),
		edge.From("transfers", TableTransfer.Type).Ref("table_session"),
		edge.From("notifications", Notification.Type).Ref("table_session"),
	}
}
func (TableSession) Indexes() []ent.Index {
	return []ent.Index{
		index.Edges("dining_table").Unique().Annotations(entsql.IndexWhere("status = 'active'")),
		index.Fields("last_activity_at"),
	}
}
