package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/dialect/entsql"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/mixin"
	"github.com/google/uuid"
)

// IDCreatedMixin provides UUID identity and UTC creation time to immutable
// records. PostgreSQL defaults also cover writes outside the Ent client.
type IDCreatedMixin struct{ mixin.Schema }

func (IDCreatedMixin) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).Default(uuid.New).Immutable().Annotations(entsql.DefaultExpr("gen_random_uuid()")),
		field.Time("created_at").Default(utcNow).Immutable().Annotations(entsql.DefaultExpr("CURRENT_TIMESTAMP")),
	}
}

// BaseMixin adds an updated timestamp to mutable records.
type BaseMixin struct{ mixin.Schema }

func (BaseMixin) Fields() []ent.Field {
	return append(IDCreatedMixin{}.Fields(),
		field.Time("updated_at").Default(utcNow).UpdateDefault(utcNow).Annotations(entsql.DefaultExpr("CURRENT_TIMESTAMP")),
	)
}

func utcNow() time.Time { return time.Now().UTC() }
