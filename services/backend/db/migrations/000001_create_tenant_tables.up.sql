-- Create RESTAURANT table
CREATE TABLE IF NOT EXISTS restaurant (
    id VARCHAR(26) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    establishment_mode VARCHAR(50) NOT NULL DEFAULT 'table_service',
    service_charge_pct DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    vat_pct DECIMAL(5,2) NOT NULL DEFAULT 15.00,
    cash_fallback_enabled BOOLEAN NOT NULL DEFAULT true,
    pickup_alarm_enabled BOOLEAN NOT NULL DEFAULT false,
    token_version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create TABLE_ENTITY table
CREATE TABLE IF NOT EXISTS table_entity (
    id VARCHAR(26) PRIMARY KEY,
    restaurant_id VARCHAR(26) NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
    table_number VARCHAR(50) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'table',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_table_entity_restaurant_id ON table_entity(restaurant_id);

-- Create STAFF_USER table
CREATE TABLE IF NOT EXISTS staff_user (
    id VARCHAR(26) PRIMARY KEY,
    restaurant_id VARCHAR(26) NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_staff_user_restaurant_id ON staff_user(restaurant_id);

-- Enable Row-Level Security (RLS) on tenant tables per AD-2
ALTER TABLE table_entity ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_user ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies enforcing current_setting('app.current_restaurant_id', true)
CREATE POLICY table_entity_tenant_isolation ON table_entity
    FOR ALL
    USING (restaurant_id = current_setting('app.current_restaurant_id', true))
    WITH CHECK (restaurant_id = current_setting('app.current_restaurant_id', true));

CREATE POLICY staff_user_tenant_isolation ON staff_user
    FOR ALL
    USING (restaurant_id = current_setting('app.current_restaurant_id', true))
    WITH CHECK (restaurant_id = current_setting('app.current_restaurant_id', true));
