package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

// Permission is an atomic authorization capability.
type Permission struct{ ent.Schema }

func (Permission) Mixin() []ent.Mixin { return []ent.Mixin{BaseMixin{}} }
func (Permission) Fields() []ent.Field {
	return []ent.Field{field.String("code").NotEmpty().MaxLen(120).Unique(), field.String("description").Default("").MaxLen(500)}
}
func (Permission) Edges() []ent.Edge {
	return []ent.Edge{edge.From("roles", Role.Type).Ref("permissions")}
}
