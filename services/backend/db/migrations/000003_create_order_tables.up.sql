-- Create ORDER_ENTITY table
CREATE TABLE IF NOT EXISTS order_entity (
    id VARCHAR(26) PRIMARY KEY,
    restaurant_id VARCHAR(26) NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
    table_id VARCHAR(26) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Payment Pending',
    payment_status VARCHAR(50) NOT NULL DEFAULT 'unpaid',
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    service_charge_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    order_intent_id VARCHAR(26) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_order_status CHECK (status IN (
        'Cart', 'Checkout', 'Payment Pending', 'Payment Confirmed', 'Received',
        'Preparing', 'Ready', 'Notified', 'Delivered', 'Picked Up', 'Closed',
        'Payment Failed', 'Cancelled'
    ))
);

CREATE INDEX IF NOT EXISTS idx_order_entity_restaurant ON order_entity(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_order_entity_table ON order_entity(table_id);
CREATE INDEX IF NOT EXISTS idx_order_intent_id ON order_entity(order_intent_id);

-- Create ORDER_ITEM table
CREATE TABLE IF NOT EXISTS order_item (
    id VARCHAR(26) PRIMARY KEY,
    order_id VARCHAR(26) NOT NULL REFERENCES order_entity(id) ON DELETE CASCADE,
    menu_item_id VARCHAR(26) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    selected_options JSONB NOT NULL DEFAULT '{}'::jsonb,
    special_instructions TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_item_order ON order_item(order_id);

-- Create ORDER_STATUS_HISTORY table per AD-6
CREATE TABLE IF NOT EXISTS order_status_history (
    id VARCHAR(26) PRIMARY KEY,
    order_id VARCHAR(26) NOT NULL REFERENCES order_entity(id) ON DELETE CASCADE,
    from_status VARCHAR(50) NOT NULL,
    to_status VARCHAR(50) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    actor_id VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON order_status_history(order_id);

-- Create PAYMENT_WEBHOOKS table per AD-5
CREATE TABLE IF NOT EXISTS payment_webhooks (
    id VARCHAR(26) PRIMARY KEY,
    provider VARCHAR(50) NOT NULL,
    provider_tx_id VARCHAR(255) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_provider_tx UNIQUE (provider, provider_tx_id)
);

-- Enable RLS on order tables per AD-2
ALTER TABLE order_entity ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY order_entity_tenant_isolation ON order_entity
    FOR ALL USING (restaurant_id = current_setting('app.current_restaurant_id', true))
    WITH CHECK (restaurant_id = current_setting('app.current_restaurant_id', true));

CREATE POLICY order_item_tenant_isolation ON order_item
    FOR ALL USING (
        order_id IN (SELECT id FROM order_entity WHERE restaurant_id = current_setting('app.current_restaurant_id', true))
    );

CREATE POLICY order_status_history_tenant_isolation ON order_status_history
    FOR ALL USING (
        order_id IN (SELECT id FROM order_entity WHERE restaurant_id = current_setting('app.current_restaurant_id', true))
    );
