-- Create MENU_CATEGORY table
CREATE TABLE IF NOT EXISTS menu_category (
    id VARCHAR(26) PRIMARY KEY,
    restaurant_id VARCHAR(26) NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
    name_en VARCHAR(255) NOT NULL,
    name_am VARCHAR(255) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_menu_category_restaurant ON menu_category(restaurant_id);

-- Create MENU_ITEM table
CREATE TABLE IF NOT EXISTS menu_item (
    id VARCHAR(26) PRIMARY KEY,
    category_id VARCHAR(26) NOT NULL REFERENCES menu_category(id) ON DELETE CASCADE,
    restaurant_id VARCHAR(26) NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
    name_en VARCHAR(255) NOT NULL,
    name_am VARCHAR(255) NOT NULL,
    description_en TEXT NOT NULL DEFAULT '',
    description_am TEXT NOT NULL DEFAULT '',
    price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    is_available BOOLEAN NOT NULL DEFAULT true,
    prep_time_minutes INT NOT NULL DEFAULT 15,
    allergen_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_menu_item_category ON menu_item(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_item_restaurant ON menu_item(restaurant_id);

-- Create ITEM_OPTION table
CREATE TABLE IF NOT EXISTS item_option (
    id VARCHAR(26) PRIMARY KEY,
    menu_item_id VARCHAR(26) NOT NULL REFERENCES menu_item(id) ON DELETE CASCADE,
    restaurant_id VARCHAR(26) NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
    name_en VARCHAR(255) NOT NULL,
    name_am VARCHAR(255) NOT NULL,
    price_delta DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    type VARCHAR(20) NOT NULL DEFAULT 'addon', -- addon | removal | variant
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_item_option_item ON item_option(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_item_option_restaurant ON item_option(restaurant_id);

-- Enable RLS on menu tables per AD-2
ALTER TABLE menu_category ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_option ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY menu_category_tenant_isolation ON menu_category
    FOR ALL USING (restaurant_id = current_setting('app.current_restaurant_id', true))
    WITH CHECK (restaurant_id = current_setting('app.current_restaurant_id', true));

CREATE POLICY menu_item_tenant_isolation ON menu_item
    FOR ALL USING (restaurant_id = current_setting('app.current_restaurant_id', true))
    WITH CHECK (restaurant_id = current_setting('app.current_restaurant_id', true));

CREATE POLICY item_option_tenant_isolation ON item_option
    FOR ALL USING (restaurant_id = current_setting('app.current_restaurant_id', true))
    WITH CHECK (restaurant_id = current_setting('app.current_restaurant_id', true));
