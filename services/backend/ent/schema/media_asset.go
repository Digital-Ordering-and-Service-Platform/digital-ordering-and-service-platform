package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

// MediaAsset stores metadata for protected local files; storage_key is never a
// public path or URL. Authorization and filesystem storage come in Phase 3/4.
type MediaAsset struct{ ent.Schema }

func (MediaAsset) Mixin() []ent.Mixin { return []ent.Mixin{IDCreatedMixin{}} }
func (MediaAsset) Fields() []ent.Field {
	return []ent.Field{
		field.String("storage_key").NotEmpty().MaxLen(255).Unique().Sensitive(),
		field.String("content_type").NotEmpty().MaxLen(120),
		field.Int64("size_bytes").Positive(),
		field.String("sha256").NotEmpty().MaxLen(64),
		field.Int("duration_seconds").Optional().Nillable().Positive(),
	}
}
func (MediaAsset) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("uploaded_by", GuestCredential.Type).Unique(),
		edge.To("voice_instruction_for", OrderItem.Type).Unique(),
		edge.To("payment_evidence_for", Payment.Type).Unique(),
	}
}
