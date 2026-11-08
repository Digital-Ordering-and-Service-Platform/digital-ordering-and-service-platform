package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// ServiceRequest tracks a guest request and the table where it originated.
type ServiceRequest struct{ ent.Schema }

func (ServiceRequest) Mixin() []ent.Mixin { return []ent.Mixin{BaseMixin{}} }
func (ServiceRequest) Fields() []ent.Field {
	return []ent.Field{
		field.Enum("kind").Values("waiter_assistance", "water", "additional_items", "bill_request", "customer_issue"),
		field.Enum("status").Values("open", "acknowledged", "completed", "cancelled").Default("open"),
		field.String("note").Default("").MaxLen(2000),
		field.Time("acknowledged_at").Optional().Nillable(),
		field.Time("completed_at").Optional().Nillable(),
	}
}
func (ServiceRequest) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("table_session", TableSession.Type).Unique().Required(),
		edge.To("origin_table", DiningTable.Type).Unique().Required(),
		edge.To("requested_by", GuestCredential.Type).Unique(),
		edge.To("assigned_staff", StaffUser.Type).Unique(),
	}
}
func (ServiceRequest) Indexes() []ent.Index {
	return []ent.Index{index.Fields("status", "created_at"), index.Fields("kind", "status")}
}
