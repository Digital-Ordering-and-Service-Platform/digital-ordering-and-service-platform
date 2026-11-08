package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// PaymentVerification appends each staff decision about an electronic
// transfer, preserving rejected and subsequent verification attempts.
type PaymentVerification struct{ ent.Schema }

func (PaymentVerification) Mixin() []ent.Mixin { return []ent.Mixin{IDCreatedMixin{}} }
func (PaymentVerification) Fields() []ent.Field {
	return []ent.Field{
		field.Enum("decision").Values("verified", "rejected"),
		field.String("note").Default("").MaxLen(1000),
		field.String("reference_checked").Optional().Nillable().MaxLen(255),
		field.Time("verified_at").Default(utcNow),
	}
}
func (PaymentVerification) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("payment", Payment.Type).Unique().Required(),
		edge.To("verified_by", StaffUser.Type).Unique().Required(),
	}
}
func (PaymentVerification) Indexes() []ent.Index {
	return []ent.Index{index.Fields("verified_at").Edges("payment")}
}
