package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/dialect/entsql"
	"entgo.io/ent/schema"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

// BillItem keeps the exact name, quantity, and pricing used on a bill.
type BillItem struct{ ent.Schema }

func (BillItem) Mixin() []ent.Mixin { return []ent.Mixin{BaseMixin{}} }
func (BillItem) Fields() []ent.Field {
	return []ent.Field{
		field.String("item_name_snapshot").NotEmpty().MaxLen(180),
		field.Int("quantity").Positive(),
		field.Int64("unit_price_minor").NonNegative(),
		field.Int64("line_total_minor").NonNegative(),
	}
}
func (BillItem) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("bill", Bill.Type).Unique().Required(),
		edge.To("source_order_item", OrderItem.Type).Unique(),
	}
}
func (BillItem) Annotations() []schema.Annotation {
	return []schema.Annotation{entsql.Checks(map[string]string{
		"bill_item_quantity_positive": "quantity > 0",
		"bill_item_price_nonnegative": "unit_price_minor >= 0 AND line_total_minor >= 0",
	})}
}
