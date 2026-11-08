package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

// StaffUser is an authenticated staff account for this single venue.
type StaffUser struct{ ent.Schema }

func (StaffUser) Mixin() []ent.Mixin { return []ent.Mixin{BaseMixin{}} }
func (StaffUser) Fields() []ent.Field {
	return []ent.Field{
		field.String("email").NotEmpty().MaxLen(320).Unique(),
		field.String("password_hash").NotEmpty().Sensitive(),
		field.String("display_name").NotEmpty().MaxLen(160),
		field.String("phone").Optional().Nillable().MaxLen(40),
		field.Bool("active").Default(true),
	}
}
func (StaffUser) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("roles", Role.Type),
		edge.From("table_assignments", StaffTableAssignment.Type).Ref("staff_user"),
		edge.From("verified_payments", PaymentVerification.Type).Ref("verified_by"),
		edge.From("cash_payments_received", Payment.Type).Ref("cash_received_by"),
		edge.From("assigned_service_requests", ServiceRequest.Type).Ref("assigned_staff"),
		edge.From("notifications", Notification.Type).Ref("staff_recipient"),
	}
}
