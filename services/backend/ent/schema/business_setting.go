package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

// BusinessSetting stores venue-specific configuration without hardcoding
// unresolved tax, inactivity, or credential-expiry policies into the schema.
type BusinessSetting struct{ ent.Schema }

func (BusinessSetting) Mixin() []ent.Mixin { return []ent.Mixin{BaseMixin{}} }
func (BusinessSetting) Fields() []ent.Field {
	return []ent.Field{
		field.String("key").NotEmpty().MaxLen(120).Unique(),
		field.JSON("value", map[string]any{}),
		field.String("description").Default("").MaxLen(500),
	}
}
func (BusinessSetting) Edges() []ent.Edge {
	return []ent.Edge{edge.To("updated_by", StaffUser.Type).Unique()}
}
