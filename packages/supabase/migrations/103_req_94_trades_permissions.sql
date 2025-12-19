-- =========================================================
-- 103_req_94_trades_permissions.sql
-- Ensure trades taxonomy grants for authenticated users
-- =========================================================

BEGIN;

-- Immediate grants for existing trades reference data
GRANT SELECT ON TABLE data.trades TO authenticated;
GRANT SELECT ON TABLE data.trades TO anon;
GRANT ALL ON TABLE data.trades TO service_role;

-- Ensure future reference tables inherit expected privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA data
  GRANT SELECT ON TABLES TO authenticated, anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA data
  GRANT ALL ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA data
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated, anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA data
  GRANT ALL ON SEQUENCES TO service_role;

COMMIT;


