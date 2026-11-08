package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

// GuestCredential represents one browser/device credential; only its token
// hash is stored. A credential can have memberships in several table sessions.
type GuestCredential struct{ ent.Schema }

func (GuestCredential) Mixin() []ent.Mixin { return []ent.Mixin{BaseMixin{}} }
func (GuestCredential) Fields() []ent.Field {
	return []ent.Field{
		field.String("token_hash").NotEmpty().MaxLen(64).Unique().Sensitive(),
		field.Time("expires_at"),
		field.Time("revoked_at").Optional().Nillable(),
		field.Time("last_seen_at").Optional().Nillable(),
		field.String("device_label").Optional().Nillable().MaxLen(120),
	}
}
func (GuestCredential) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("memberships", GuestSessionMembership.Type).Ref("guest_credential"),
		edge.From("orders", CustomerOrder.Type).Ref("placed_by"),
		edge.From("service_requests", ServiceRequest.Type).Ref("requested_by"),
		edge.From("transfers", TableTransfer.Type).Ref("initiated_by"),
		edge.From("media_assets", MediaAsset.Type).Ref("uploaded_by"),
		edge.From("notifications", Notification.Type).Ref("guest_recipient"),
	}
}
