-- Migration: Seed tasks with quick_actions and metadata
-- REQ: Fix dashboard modal buttons (Contact Broker, Upload Document, Request Quote)
-- Date: 2025-01-19
-- Depends on: 242_forsured_add_tasks_metadata.sql

-- =============================================================================
-- NOTE: This seed migration has been disabled.
--
-- The core.users table schema changed (no longer has 'email' column) and this
-- sample data is not required for E2E tests. Tests create their own mock data.
--
-- If you need sample tasks with quick_actions, please:
-- 1. Create them through the application's API
-- 2. Or use the seed scripts in /seeds/ directory
-- =============================================================================

-- No-op migration
SELECT 1 AS migration_243_disabled;
