DROP POLICY IF EXISTS order_status_history_tenant_isolation ON order_status_history;
DROP POLICY IF EXISTS order_item_tenant_isolation ON order_item;
DROP POLICY IF EXISTS order_entity_tenant_isolation ON order_entity;

DROP TABLE IF EXISTS payment_webhooks;
DROP TABLE IF EXISTS order_status_history;
DROP TABLE IF EXISTS order_item;
DROP TABLE IF EXISTS order_entity;
