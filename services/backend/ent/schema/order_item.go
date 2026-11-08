package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/dialect/entsql"
	"entgo.io/ent/schema"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

// OrderItem stores catalog and pricing snapshots so later menu edits cannot
// rewrite what was ordered. Customizations are snapshot JSON, not live joins.
type OrderItem struct{ ent.Schema }

func (OrderItem) Mixin() []ent.Mixin { return []ent.Mixin{BaseMixin{}} }
func (OrderItem) Fields() []ent.Field {
	return []ent.Field{
		field.String("item_name_snapshot").NotEmpty().MaxLen(180),
		field.Int("quantity").Positive(),
		field.Int64("unit_price_minor").NonNegative(),
		field.JSON("customizations", []map[string]any{}).Default([]map[string]any{}),
		field.String("special_instructions").Default("").MaxLen(2000),
	}
}
func (OrderItem) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("customer_order", CustomerOrder.Type).Unique().Required(),
		edge.To("menu_item", MenuItem.Type).Unique().Required(),
		edge.From("voice_instruction", MediaAsset.Type).Ref("voice_instruction_for").Unique(),
		edge.From("bill_items", BillItem.Type).Ref("source_order_item"),
	}
}
func (OrderItem) Annotations() []schema.Annotation {
	return []schema.Annotation{entsql.Checks(map[string]string{
		"order_item_quantity_positive": "quantity > 0",
		"order_item_price_nonnegative": "unit_price_minor >= 0",
	})}
}
