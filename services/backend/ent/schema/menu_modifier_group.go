package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/dialect/entsql"
	"entgo.io/ent/schema"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

// MenuModifierGroup defines a set of choices available for a menu item.
type MenuModifierGroup struct{ ent.Schema }

func (MenuModifierGroup) Mixin() []ent.Mixin { return []ent.Mixin{BaseMixin{}} }
func (MenuModifierGroup) Fields() []ent.Field {
	return []ent.Field{
		field.String("name_en").NotEmpty().MaxLen(120),
		field.String("name_am").Default("").MaxLen(120),
		field.Int("min_selections").Default(0),
		field.Int("max_selections").Default(1),
		field.Int("sort_order").Default(0),
	}
}
func (MenuModifierGroup) Edges() []ent.Edge {
	return []ent.Edge{edge.To("menu_item", MenuItem.Type).Unique().Required(), edge.From("options", MenuModifierOption.Type).Ref("group")}
}
func (MenuModifierGroup) Annotations() []schema.Annotation {
	return []schema.Annotation{entsql.Checks(map[string]string{
		"modifier_selection_min_nonnegative": "min_selections >= 0",
		"modifier_selection_range_valid":     "max_selections >= min_selections",
	})}
}
