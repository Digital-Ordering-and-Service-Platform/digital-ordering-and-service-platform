package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/dialect/entsql"
	"entgo.io/ent/schema"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// Payment records a guest-reported electronic transfer or cash physically
// received by staff. A reference or uploaded image is never verification.
type Payment struct{ ent.Schema }

func (Payment) Mixin() []ent.Mixin { return []ent.Mixin{BaseMixin{}} }
func (Payment) Fields() []ent.Field {
	return []ent.Field{
		field.Enum("method").Values("cash", "telebirr", "chapa", "cbe_birr", "other_electronic"),
		field.Enum("status").Values("pending_verification", "verified", "cash_received", "rejected", "failed", "refunded"),
		field.Int64("amount_minor").NonNegative(),
		field.Int64("amount_received_minor").Optional().Nillable(),
		field.Int64("amount_applied_minor").NonNegative().Default(0),
		field.Int64("change_returned_minor").NonNegative().Default(0),
		field.String("reported_reference").Optional().Nillable().MaxLen(255),
		field.String("provider_transaction_id").Optional().Nillable().MaxLen(255),
		field.String("idempotency_key").Optional().Nillable().MaxLen(160).Unique(),
		field.Time("reported_at").Default(utcNow),
		field.Time("recorded_at").Optional().Nillable(),
	}
}
func (Payment) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("bill", Bill.Type).Unique().Required(),
		edge.To("cash_received_by", StaffUser.Type).Unique(),
		edge.From("verifications", PaymentVerification.Type).Ref("payment"),
		edge.From("reported_evidence", MediaAsset.Type).Ref("payment_evidence_for").Unique(),
	}
}
func (Payment) Indexes() []ent.Index {
	return []ent.Index{index.Fields("method", "status", "reported_at")}
}
func (Payment) Annotations() []schema.Annotation {
	return []schema.Annotation{entsql.Checks(map[string]string{
		"payment_amount_nonnegative":    "amount_minor >= 0 AND amount_applied_minor >= 0 AND change_returned_minor >= 0",
		"payment_received_nonnegative":  "amount_received_minor IS NULL OR amount_received_minor >= 0",
		"cash_requires_received_amount": "method <> 'cash' OR status <> 'cash_received' OR amount_received_minor IS NOT NULL",
	})}
}
