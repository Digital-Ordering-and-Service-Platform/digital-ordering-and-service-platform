package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// Bill preserves an itemized settlement snapshot for a table session.
// Tax/service calculation policy is deliberately stored as resulting amounts;
// the product brief has not settled the calculation order.
type Bill struct{ ent.Schema }

func (Bill) Mixin() []ent.Mixin { return []ent.Mixin{BaseMixin{}} }
func (Bill) Fields() []ent.Field {
	return []ent.Field{
		field.Enum("status").Values("open", "partially_paid", "paid", "void").Default("open"),
		field.Int("revision").Positive().Default(1),
		field.Int64("subtotal_minor").NonNegative(),
		field.Int64("service_charge_minor").NonNegative().Default(0),
		field.Int64("tax_minor").NonNegative().Default(0),
		field.Int64("total_minor").NonNegative(),
		field.Int64("amount_paid_minor").NonNegative().Default(0),
		field.Time("issued_at").Default(utcNow),
		field.Time("paid_at").Optional().Nillable(),
	}
}
func (Bill) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("table_session", TableSession.Type).Unique().Required(),
		edge.From("items", BillItem.Type).Ref("bill"),
		edge.From("payments", Payment.Type).Ref("bill"),
	}
}
func (Bill) Indexes() []ent.Index {
	return []ent.Index{index.Fields("revision").Edges("table_session").Unique()}
}
