package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// MenuItem is a sellable catalog entry. Historical orders hold immutable
// snapshots, while the relation to this record remains for reporting.
type MenuItem struct{ ent.Schema }

func (MenuItem) Mixin() []ent.Mixin { return []ent.Mixin{BaseMixin{}} }
func (MenuItem) Fields() []ent.Field {
	return []ent.Field{
		field.String("name_en").NotEmpty().MaxLen(180),
		field.String("name_am").Default("").MaxLen(180),
		field.String("description_en").Default("").MaxLen(4000),
		field.String("description_am").Default("").MaxLen(4000),
		field.Int64("price_minor").NonNegative(),
		field.Bool("available").Default(true),
		field.Int("prep_time_minutes").Default(15).Positive(),
		field.JSON("allergen_tags", []string{}).Default([]string{}),
	}
}
func (MenuItem) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("category", MenuCategory.Type).Unique().Required(),
		edge.From("modifier_groups", MenuModifierGroup.Type).Ref("menu_item"),
		edge.From("order_items", OrderItem.Type).Ref("menu_item"),
	}
}
func (MenuItem) Indexes() []ent.Index {
	return []ent.Index{index.Fields("available").Edges("category")}
}
