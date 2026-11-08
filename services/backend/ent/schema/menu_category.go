package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

// MenuCategory groups menu items for guest browsing.
type MenuCategory struct{ ent.Schema }

func (MenuCategory) Mixin() []ent.Mixin { return []ent.Mixin{BaseMixin{}} }
func (MenuCategory) Fields() []ent.Field {
	return []ent.Field{
		field.String("name_en").NotEmpty().MaxLen(120),
		field.String("name_am").Default("").MaxLen(120),
		field.Int("sort_order").Default(0),
		field.Bool("active").Default(true),
	}
}
func (MenuCategory) Edges() []ent.Edge {
	return []ent.Edge{edge.From("items", MenuItem.Type).Ref("category")}
}
