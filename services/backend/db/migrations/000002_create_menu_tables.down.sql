DROP POLICY IF EXISTS item_option_tenant_isolation ON item_option;
DROP POLICY IF EXISTS menu_item_tenant_isolation ON menu_item;
DROP POLICY IF EXISTS menu_category_tenant_isolation ON menu_category;

DROP TABLE IF EXISTS item_option;
DROP TABLE IF EXISTS menu_item;
DROP TABLE IF EXISTS menu_category;
