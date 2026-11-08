package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

// DiningTable is a venue table. Occupancy is derived from active sessions.
type DiningTable struct{ ent.Schema }

func (DiningTable) Mixin() []ent.Mixin { return []ent.Mixin{BaseMixin{}} }
func (DiningTable) Fields() []ent.Field {
	return []ent.Field{
		field.String("label").NotEmpty().MaxLen(80).Unique(),
		field.String("qr_token_hash").NotEmpty().MaxLen(64).Unique().Sensitive(),
		field.Bool("enabled").Default(true),
		field.Int("sort_order").Default(0),
	}
}
func (DiningTable) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("sessions", TableSession.Type).Ref("dining_table"),
		edge.From("staff_assignments", StaffTableAssignment.Type).Ref("dining_table"),
		edge.From("outgoing_transfers", TableTransfer.Type).Ref("from_table"),
		edge.From("incoming_transfers", TableTransfer.Type).Ref("to_table"),
		edge.From("service_requests", ServiceRequest.Type).Ref("origin_table"),
	}
}
