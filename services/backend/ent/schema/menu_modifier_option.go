package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

// MenuModifierOption is one available choice within a modifier group.
type MenuModifierOption struct{ ent.Schema }

func (MenuModifierOption) Mixin() []ent.Mixin { return []ent.Mixin{BaseMixin{}} }
func (MenuModifierOption) Fields() []ent.Field {
	return []ent.Field{
		field.String("name_en").NotEmpty().MaxLen(120),
		field.String("name_am").Default("").MaxLen(120),
		field.Int64("price_delta_minor").Default(0),
		field.Bool("available").Default(true),
		field.Int("sort_order").Default(0),
	}
}
func (MenuModifierOption) Edges() []ent.Edge {
	return []ent.Edge{edge.To("group", MenuModifierGroup.Type).Unique().Required()}
}
