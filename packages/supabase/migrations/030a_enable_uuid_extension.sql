-- =========================================================
-- Migration: 030a_enable_uuid_extension
-- Description: Ensure uuid-ossp extension exists for uuid_generate_v4()
-- =========================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

COMMIT;

