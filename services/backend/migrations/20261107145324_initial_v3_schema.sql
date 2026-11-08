-- Create "audit_records" table
CREATE TABLE "audit_records" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actor_type" character varying NOT NULL,
  "actor_id" uuid NULL,
  "action" character varying NOT NULL,
  "entity_type" character varying NOT NULL,
  "entity_id" uuid NOT NULL,
  "before" jsonb NULL,
  "after" jsonb NULL,
  "reason" character varying NOT NULL DEFAULT '',
  PRIMARY KEY ("id")
);
-- Create index "auditrecord_actor_type_actor_id_created_at" to table: "audit_records"
CREATE INDEX "auditrecord_actor_type_actor_id_created_at" ON "audit_records" ("actor_type", "actor_id", "created_at");
-- Create index "auditrecord_entity_type_entity_id_created_at" to table: "audit_records"
CREATE INDEX "auditrecord_entity_type_entity_id_created_at" ON "audit_records" ("entity_type", "entity_id", "created_at");
-- Create "dining_tables" table
CREATE TABLE "dining_tables" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "label" character varying NOT NULL,
  "qr_token_hash" character varying NOT NULL,
  "enabled" boolean NOT NULL DEFAULT true,
  "sort_order" bigint NOT NULL DEFAULT 0,
  PRIMARY KEY ("id")
);
-- Create index "dining_tables_label_key" to table: "dining_tables"
CREATE UNIQUE INDEX "dining_tables_label_key" ON "dining_tables" ("label");
-- Create index "dining_tables_qr_token_hash_key" to table: "dining_tables"
CREATE UNIQUE INDEX "dining_tables_qr_token_hash_key" ON "dining_tables" ("qr_token_hash");
-- Create "outbox_events" table
CREATE TABLE "outbox_events" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "event_type" character varying NOT NULL,
  "aggregate_id" uuid NOT NULL,
  "aggregate_type" character varying NOT NULL,
  "idempotency_key" character varying NOT NULL,
  "payload" jsonb NOT NULL,
  "status" character varying NOT NULL DEFAULT 'pending',
  "attempts" bigint NOT NULL DEFAULT 0,
  "available_at" timestamptz NOT NULL,
  "lease_until" timestamptz NULL,
  "lease_owner" character varying NULL,
  "last_error" character varying NULL,
  "published_at" timestamptz NULL,
  PRIMARY KEY ("id")
);
-- Create index "outbox_events_idempotency_key_key" to table: "outbox_events"
CREATE UNIQUE INDEX "outbox_events_idempotency_key_key" ON "outbox_events" ("idempotency_key");
-- Create index "outboxevent_status_available_at_created_at" to table: "outbox_events"
CREATE INDEX "outboxevent_status_available_at_created_at" ON "outbox_events" ("status", "available_at", "created_at");
-- Create "table_sessions" table
CREATE TABLE "table_sessions" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" character varying NOT NULL DEFAULT 'active',
  "started_at" timestamptz NOT NULL,
  "last_activity_at" timestamptz NOT NULL,
  "idled_at" timestamptz NULL,
  "closed_at" timestamptz NULL,
  "table_session_dining_table" uuid NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "table_sessions_dining_tables_dining_table" FOREIGN KEY ("table_session_dining_table") REFERENCES "dining_tables" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create index "tablesession_last_activity_at" to table: "table_sessions"
CREATE INDEX "tablesession_last_activity_at" ON "table_sessions" ("last_activity_at");
-- Create index "tablesession_table_session_dining_table" to table: "table_sessions"
CREATE UNIQUE INDEX "tablesession_table_session_dining_table" ON "table_sessions" ("table_session_dining_table") WHERE ((status)::text = 'active'::text);
-- Create "bills" table
CREATE TABLE "bills" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" character varying NOT NULL DEFAULT 'open',
  "revision" bigint NOT NULL DEFAULT 1,
  "subtotal_minor" bigint NOT NULL,
  "service_charge_minor" bigint NOT NULL DEFAULT 0,
  "tax_minor" bigint NOT NULL DEFAULT 0,
  "total_minor" bigint NOT NULL,
  "amount_paid_minor" bigint NOT NULL DEFAULT 0,
  "issued_at" timestamptz NOT NULL,
  "paid_at" timestamptz NULL,
  "bill_table_session" uuid NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "bills_table_sessions_table_session" FOREIGN KEY ("bill_table_session") REFERENCES "table_sessions" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create index "bill_revision_bill_table_session" to table: "bills"
CREATE UNIQUE INDEX "bill_revision_bill_table_session" ON "bills" ("revision", "bill_table_session");
-- Create "guest_credentials" table
CREATE TABLE "guest_credentials" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "token_hash" character varying NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "revoked_at" timestamptz NULL,
  "last_seen_at" timestamptz NULL,
  "device_label" character varying NULL,
  PRIMARY KEY ("id")
);
-- Create index "guest_credentials_token_hash_key" to table: "guest_credentials"
CREATE UNIQUE INDEX "guest_credentials_token_hash_key" ON "guest_credentials" ("token_hash");
-- Create "customer_orders" table
CREATE TABLE "customer_orders" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" character varying NOT NULL DEFAULT 'received',
  "customer_note" character varying NOT NULL DEFAULT '',
  "submitted_at" timestamptz NOT NULL,
  "delivered_at" timestamptz NULL,
  "cancelled_at" timestamptz NULL,
  "correction_reason" character varying NULL,
  "customer_order_table_session" uuid NOT NULL,
  "customer_order_placed_by" uuid NULL,
  "customer_order_correction_of" uuid NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "customer_orders_customer_orders_correction_of" FOREIGN KEY ("customer_order_correction_of") REFERENCES "customer_orders" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "customer_orders_guest_credentials_placed_by" FOREIGN KEY ("customer_order_placed_by") REFERENCES "guest_credentials" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "customer_orders_table_sessions_table_session" FOREIGN KEY ("customer_order_table_session") REFERENCES "table_sessions" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create index "customerorder_status_submitted_at" to table: "customer_orders"
CREATE INDEX "customerorder_status_submitted_at" ON "customer_orders" ("status", "submitted_at");
-- Create "media_assets" table
CREATE TABLE "media_assets" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "storage_key" character varying NOT NULL,
  "content_type" character varying NOT NULL,
  "size_bytes" bigint NOT NULL,
  "sha256" character varying NOT NULL,
  "duration_seconds" bigint NULL,
  "media_asset_uploaded_by" uuid NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "media_assets_guest_credentials_uploaded_by" FOREIGN KEY ("media_asset_uploaded_by") REFERENCES "guest_credentials" ("id") ON UPDATE NO ACTION ON DELETE SET NULL
);
-- Create index "media_assets_storage_key_key" to table: "media_assets"
CREATE UNIQUE INDEX "media_assets_storage_key_key" ON "media_assets" ("storage_key");
-- Create "menu_categories" table
CREATE TABLE "menu_categories" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "name_en" character varying NOT NULL,
  "name_am" character varying NOT NULL DEFAULT '',
  "sort_order" bigint NOT NULL DEFAULT 0,
  "active" boolean NOT NULL DEFAULT true,
  PRIMARY KEY ("id")
);
-- Create "menu_items" table
CREATE TABLE "menu_items" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "name_en" character varying NOT NULL,
  "name_am" character varying NOT NULL DEFAULT '',
  "description_en" character varying NOT NULL DEFAULT '',
  "description_am" character varying NOT NULL DEFAULT '',
  "price_minor" bigint NOT NULL,
  "available" boolean NOT NULL DEFAULT true,
  "prep_time_minutes" bigint NOT NULL DEFAULT 15,
  "allergen_tags" jsonb NOT NULL,
  "menu_item_category" uuid NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "menu_items_menu_categories_category" FOREIGN KEY ("menu_item_category") REFERENCES "menu_categories" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create index "menuitem_available_menu_item_category" to table: "menu_items"
CREATE INDEX "menuitem_available_menu_item_category" ON "menu_items" ("available", "menu_item_category");
-- Create "order_items" table
CREATE TABLE "order_items" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "item_name_snapshot" character varying NOT NULL,
  "quantity" bigint NOT NULL,
  "unit_price_minor" bigint NOT NULL,
  "customizations" jsonb NOT NULL,
  "special_instructions" character varying NOT NULL DEFAULT '',
  "media_asset_voice_instruction_for" uuid NULL,
  "order_item_customer_order" uuid NOT NULL,
  "order_item_menu_item" uuid NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "order_items_customer_orders_customer_order" FOREIGN KEY ("order_item_customer_order") REFERENCES "customer_orders" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "order_items_media_assets_voice_instruction_for" FOREIGN KEY ("media_asset_voice_instruction_for") REFERENCES "media_assets" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "order_items_menu_items_menu_item" FOREIGN KEY ("order_item_menu_item") REFERENCES "menu_items" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "order_item_price_nonnegative" CHECK (unit_price_minor >= 0),
  CONSTRAINT "order_item_quantity_positive" CHECK (quantity > 0)
);
-- Create index "order_items_media_asset_voice_instruction_for_key" to table: "order_items"
CREATE UNIQUE INDEX "order_items_media_asset_voice_instruction_for_key" ON "order_items" ("media_asset_voice_instruction_for");
-- Create "bill_items" table
CREATE TABLE "bill_items" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "item_name_snapshot" character varying NOT NULL,
  "quantity" bigint NOT NULL,
  "unit_price_minor" bigint NOT NULL,
  "line_total_minor" bigint NOT NULL,
  "bill_item_bill" uuid NOT NULL,
  "bill_item_source_order_item" uuid NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "bill_items_bills_bill" FOREIGN KEY ("bill_item_bill") REFERENCES "bills" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "bill_items_order_items_source_order_item" FOREIGN KEY ("bill_item_source_order_item") REFERENCES "order_items" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "bill_item_price_nonnegative" CHECK ((unit_price_minor >= 0) AND (line_total_minor >= 0)),
  CONSTRAINT "bill_item_quantity_positive" CHECK (quantity > 0)
);
-- Create "staff_users" table
CREATE TABLE "staff_users" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "email" character varying NOT NULL,
  "password_hash" character varying NOT NULL,
  "display_name" character varying NOT NULL,
  "phone" character varying NULL,
  "active" boolean NOT NULL DEFAULT true,
  PRIMARY KEY ("id")
);
-- Create index "staff_users_email_key" to table: "staff_users"
CREATE UNIQUE INDEX "staff_users_email_key" ON "staff_users" ("email");
-- Create "business_settings" table
CREATE TABLE "business_settings" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "key" character varying NOT NULL,
  "value" jsonb NOT NULL,
  "description" character varying NOT NULL DEFAULT '',
  "business_setting_updated_by" uuid NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "business_settings_staff_users_updated_by" FOREIGN KEY ("business_setting_updated_by") REFERENCES "staff_users" ("id") ON UPDATE NO ACTION ON DELETE SET NULL
);
-- Create index "business_settings_key_key" to table: "business_settings"
CREATE UNIQUE INDEX "business_settings_key_key" ON "business_settings" ("key");
-- Create "guest_session_memberships" table
CREATE TABLE "guest_session_memberships" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "joined_at" timestamptz NOT NULL,
  "left_at" timestamptz NULL,
  "guest_session_membership_guest_credential" uuid NOT NULL,
  "guest_session_membership_table_session" uuid NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "guest_session_memberships_guest_credentials_guest_credential" FOREIGN KEY ("guest_session_membership_guest_credential") REFERENCES "guest_credentials" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "guest_session_memberships_table_sessions_table_session" FOREIGN KEY ("guest_session_membership_table_session") REFERENCES "table_sessions" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create index "guestsessionmembership_guest_session_membership_guest_credentia" to table: "guest_session_memberships"
CREATE UNIQUE INDEX "guestsessionmembership_guest_session_membership_guest_credentia" ON "guest_session_memberships" ("guest_session_membership_guest_credential", "guest_session_membership_table_session");
-- Create index "guestsessionmembership_guest_session_membership_table_session_g" to table: "guest_session_memberships"
CREATE INDEX "guestsessionmembership_guest_session_membership_table_session_g" ON "guest_session_memberships" ("guest_session_membership_table_session", "guest_session_membership_guest_credential");
-- Create "menu_modifier_groups" table
CREATE TABLE "menu_modifier_groups" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "name_en" character varying NOT NULL,
  "name_am" character varying NOT NULL DEFAULT '',
  "min_selections" bigint NOT NULL DEFAULT 0,
  "max_selections" bigint NOT NULL DEFAULT 1,
  "sort_order" bigint NOT NULL DEFAULT 0,
  "menu_modifier_group_menu_item" uuid NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "menu_modifier_groups_menu_items_menu_item" FOREIGN KEY ("menu_modifier_group_menu_item") REFERENCES "menu_items" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "modifier_selection_min_nonnegative" CHECK (min_selections >= 0),
  CONSTRAINT "modifier_selection_range_valid" CHECK (max_selections >= min_selections)
);
-- Create "menu_modifier_options" table
CREATE TABLE "menu_modifier_options" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "name_en" character varying NOT NULL,
  "name_am" character varying NOT NULL DEFAULT '',
  "price_delta_minor" bigint NOT NULL DEFAULT 0,
  "available" boolean NOT NULL DEFAULT true,
  "sort_order" bigint NOT NULL DEFAULT 0,
  "menu_modifier_option_group" uuid NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "menu_modifier_options_menu_modifier_groups_group" FOREIGN KEY ("menu_modifier_option_group") REFERENCES "menu_modifier_groups" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create "notifications" table
CREATE TABLE "notifications" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "event_type" character varying NOT NULL,
  "audience" character varying NOT NULL,
  "title" character varying NOT NULL,
  "body" character varying NOT NULL DEFAULT '',
  "payload" jsonb NOT NULL,
  "read_at" timestamptz NULL,
  "notification_staff_recipient" uuid NULL,
  "notification_guest_recipient" uuid NULL,
  "notification_table_session" uuid NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "notifications_guest_credentials_guest_recipient" FOREIGN KEY ("notification_guest_recipient") REFERENCES "guest_credentials" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "notifications_staff_users_staff_recipient" FOREIGN KEY ("notification_staff_recipient") REFERENCES "staff_users" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "notifications_table_sessions_table_session" FOREIGN KEY ("notification_table_session") REFERENCES "table_sessions" ("id") ON UPDATE NO ACTION ON DELETE SET NULL
);
-- Create index "notification_audience_read_at_created_at" to table: "notifications"
CREATE INDEX "notification_audience_read_at_created_at" ON "notifications" ("audience", "read_at", "created_at");
-- Create index "notification_event_type_created_at" to table: "notifications"
CREATE INDEX "notification_event_type_created_at" ON "notifications" ("event_type", "created_at");
-- Create "order_status_histories" table
CREATE TABLE "order_status_histories" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "from_status" character varying NULL,
  "to_status" character varying NOT NULL,
  "actor_type" character varying NOT NULL,
  "actor_id" uuid NULL,
  "reason" character varying NOT NULL DEFAULT '',
  "order_status_history_customer_order" uuid NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "order_status_histories_customer_orders_customer_order" FOREIGN KEY ("order_status_history_customer_order") REFERENCES "customer_orders" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create index "orderstatushistory_created_at_order_status_history_customer_ord" to table: "order_status_histories"
CREATE INDEX "orderstatushistory_created_at_order_status_history_customer_ord" ON "order_status_histories" ("created_at", "order_status_history_customer_order");
-- Create "payments" table
CREATE TABLE "payments" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "method" character varying NOT NULL,
  "status" character varying NOT NULL,
  "amount_minor" bigint NOT NULL,
  "amount_received_minor" bigint NULL,
  "amount_applied_minor" bigint NOT NULL DEFAULT 0,
  "change_returned_minor" bigint NOT NULL DEFAULT 0,
  "reported_reference" character varying NULL,
  "provider_transaction_id" character varying NULL,
  "idempotency_key" character varying NULL,
  "reported_at" timestamptz NOT NULL,
  "recorded_at" timestamptz NULL,
  "media_asset_payment_evidence_for" uuid NULL,
  "payment_bill" uuid NOT NULL,
  "payment_cash_received_by" uuid NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "payments_bills_bill" FOREIGN KEY ("payment_bill") REFERENCES "bills" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "payments_media_assets_payment_evidence_for" FOREIGN KEY ("media_asset_payment_evidence_for") REFERENCES "media_assets" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "payments_staff_users_cash_received_by" FOREIGN KEY ("payment_cash_received_by") REFERENCES "staff_users" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "cash_requires_received_amount" CHECK (((method)::text <> 'cash'::text) OR ((status)::text <> 'cash_received'::text) OR (amount_received_minor IS NOT NULL)),
  CONSTRAINT "payment_amount_nonnegative" CHECK ((amount_minor >= 0) AND (amount_applied_minor >= 0) AND (change_returned_minor >= 0)),
  CONSTRAINT "payment_received_nonnegative" CHECK ((amount_received_minor IS NULL) OR (amount_received_minor >= 0))
);
-- Create index "payment_method_status_reported_at" to table: "payments"
CREATE INDEX "payment_method_status_reported_at" ON "payments" ("method", "status", "reported_at");
-- Create index "payments_idempotency_key_key" to table: "payments"
CREATE UNIQUE INDEX "payments_idempotency_key_key" ON "payments" ("idempotency_key");
-- Create index "payments_media_asset_payment_evidence_for_key" to table: "payments"
CREATE UNIQUE INDEX "payments_media_asset_payment_evidence_for_key" ON "payments" ("media_asset_payment_evidence_for");
-- Create "payment_verifications" table
CREATE TABLE "payment_verifications" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "decision" character varying NOT NULL,
  "note" character varying NOT NULL DEFAULT '',
  "reference_checked" character varying NULL,
  "verified_at" timestamptz NOT NULL,
  "payment_verification_payment" uuid NOT NULL,
  "payment_verification_verified_by" uuid NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "payment_verifications_payments_payment" FOREIGN KEY ("payment_verification_payment") REFERENCES "payments" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "payment_verifications_staff_users_verified_by" FOREIGN KEY ("payment_verification_verified_by") REFERENCES "staff_users" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create index "paymentverification_verified_at_payment_verification_payment" to table: "payment_verifications"
CREATE INDEX "paymentverification_verified_at_payment_verification_payment" ON "payment_verifications" ("verified_at", "payment_verification_payment");
-- Create "permissions" table
CREATE TABLE "permissions" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "code" character varying NOT NULL,
  "description" character varying NOT NULL DEFAULT '',
  PRIMARY KEY ("id")
);
-- Create index "permissions_code_key" to table: "permissions"
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions" ("code");
-- Create "roles" table
CREATE TABLE "roles" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "name" character varying NOT NULL,
  "description" character varying NOT NULL DEFAULT '',
  "system_role" boolean NOT NULL DEFAULT false,
  PRIMARY KEY ("id")
);
-- Create index "roles_name_key" to table: "roles"
CREATE UNIQUE INDEX "roles_name_key" ON "roles" ("name");
-- Create "role_permissions" table
CREATE TABLE "role_permissions" (
  "role_id" uuid NOT NULL,
  "permission_id" uuid NOT NULL,
  PRIMARY KEY ("role_id", "permission_id"),
  CONSTRAINT "role_permissions_permission_id" FOREIGN KEY ("permission_id") REFERENCES "permissions" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "role_permissions_role_id" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create "service_requests" table
CREATE TABLE "service_requests" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "kind" character varying NOT NULL,
  "status" character varying NOT NULL DEFAULT 'open',
  "note" character varying NOT NULL DEFAULT '',
  "acknowledged_at" timestamptz NULL,
  "completed_at" timestamptz NULL,
  "service_request_table_session" uuid NOT NULL,
  "service_request_origin_table" uuid NOT NULL,
  "service_request_requested_by" uuid NULL,
  "service_request_assigned_staff" uuid NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "service_requests_dining_tables_origin_table" FOREIGN KEY ("service_request_origin_table") REFERENCES "dining_tables" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "service_requests_guest_credentials_requested_by" FOREIGN KEY ("service_request_requested_by") REFERENCES "guest_credentials" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "service_requests_staff_users_assigned_staff" FOREIGN KEY ("service_request_assigned_staff") REFERENCES "staff_users" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "service_requests_table_sessions_table_session" FOREIGN KEY ("service_request_table_session") REFERENCES "table_sessions" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create index "servicerequest_kind_status" to table: "service_requests"
CREATE INDEX "servicerequest_kind_status" ON "service_requests" ("kind", "status");
-- Create index "servicerequest_status_created_at" to table: "service_requests"
CREATE INDEX "servicerequest_status_created_at" ON "service_requests" ("status", "created_at");
-- Create "staff_table_assignments" table
CREATE TABLE "staff_table_assignments" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revoked_at" timestamptz NULL,
  "staff_table_assignment_staff_user" uuid NOT NULL,
  "staff_table_assignment_dining_table" uuid NOT NULL,
  "staff_table_assignment_assigned_by" uuid NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "staff_table_assignments_dining_tables_dining_table" FOREIGN KEY ("staff_table_assignment_dining_table") REFERENCES "dining_tables" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "staff_table_assignments_staff_users_assigned_by" FOREIGN KEY ("staff_table_assignment_assigned_by") REFERENCES "staff_users" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "staff_table_assignments_staff_users_staff_user" FOREIGN KEY ("staff_table_assignment_staff_user") REFERENCES "staff_users" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- Create index "stafftableassignment_staff_table_assignment_dining_table_staff_" to table: "staff_table_assignments"
CREATE INDEX "stafftableassignment_staff_table_assignment_dining_table_staff_" ON "staff_table_assignments" ("staff_table_assignment_dining_table", "staff_table_assignment_staff_user");
-- Create index "stafftableassignment_staff_table_assignment_staff_user_staff_ta" to table: "staff_table_assignments"
CREATE UNIQUE INDEX "stafftableassignment_staff_table_assignment_staff_user_staff_ta" ON "staff_table_assignments" ("staff_table_assignment_staff_user", "staff_table_assignment_dining_table") WHERE (revoked_at IS NULL);
-- Create "staff_user_roles" table
CREATE TABLE "staff_user_roles" (
  "staff_user_id" uuid NOT NULL,
  "role_id" uuid NOT NULL,
  PRIMARY KEY ("staff_user_id", "role_id"),
  CONSTRAINT "staff_user_roles_role_id" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "staff_user_roles_staff_user_id" FOREIGN KEY ("staff_user_id") REFERENCES "staff_users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create "table_transfers" table
CREATE TABLE "table_transfers" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reason" character varying NOT NULL DEFAULT '',
  "table_transfer_table_session" uuid NOT NULL,
  "table_transfer_from_table" uuid NOT NULL,
  "table_transfer_to_table" uuid NOT NULL,
  "table_transfer_initiated_by" uuid NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "table_transfers_dining_tables_from_table" FOREIGN KEY ("table_transfer_from_table") REFERENCES "dining_tables" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "table_transfers_dining_tables_to_table" FOREIGN KEY ("table_transfer_to_table") REFERENCES "dining_tables" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "table_transfers_guest_credentials_initiated_by" FOREIGN KEY ("table_transfer_initiated_by") REFERENCES "guest_credentials" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "table_transfers_table_sessions_table_session" FOREIGN KEY ("table_transfer_table_session") REFERENCES "table_sessions" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
