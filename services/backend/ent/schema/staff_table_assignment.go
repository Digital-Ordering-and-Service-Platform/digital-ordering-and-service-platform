package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/dialect/entsql"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// StaffTableAssignment records current and historical waiter/table scope.
type StaffTableAssignment struct{ ent.Schema }

func (StaffTableAssignment) Mixin() []ent.Mixin { return []ent.Mixin{BaseMixin{}} }
func (StaffTableAssignment) Fields() []ent.Field {
	return []ent.Field{field.Time("revoked_at").Optional().Nillable()}
}
func (StaffTableAssignment) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("staff_user", StaffUser.Type).Unique().Required(),
		edge.To("dining_table", DiningTable.Type).Unique().Required(),
		edge.To("assigned_by", StaffUser.Type).Unique(),
	}
}
func (StaffTableAssignment) Indexes() []ent.Index {
	return []ent.Index{
		index.Edges("staff_user", "dining_table").Unique().Annotations(entsql.IndexWhere("revoked_at IS NULL")),
		index.Edges("dining_table", "staff_user"),
	}
}
