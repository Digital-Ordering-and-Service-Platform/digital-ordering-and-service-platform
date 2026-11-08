package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

// Role groups permissions for staff authorization.
type Role struct{ ent.Schema }

func (Role) Mixin() []ent.Mixin { return []ent.Mixin{BaseMixin{}} }
func (Role) Fields() []ent.Field {
	return []ent.Field{
		field.String("name").NotEmpty().MaxLen(80).Unique(),
		field.String("description").Default("").MaxLen(500),
		field.Bool("system_role").Default(false),
	}
}
func (Role) Edges() []ent.Edge {
	return []ent.Edge{edge.From("staff_users", StaffUser.Type).Ref("roles"), edge.To("permissions", Permission.Type)}
}
