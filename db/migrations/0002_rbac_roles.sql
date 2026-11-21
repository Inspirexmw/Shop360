-- RBAC roles: owner (owner/admin), manager, cashier and finance (finance/accounts).
-- Existing "employee" accounts become cashiers; unknown values are made safe.
UPDATE users SET role = 'cashier' WHERE role = 'employee' OR role IS NULL;
UPDATE users SET role = 'cashier' WHERE role NOT IN ('owner', 'manager', 'cashier', 'finance');

-- users.role stays TEXT so the API validates roles with the shared role list.
-- Apply with: psql "$DATABASE_URL" -f db/migrations/0002_rbac_roles.sql
