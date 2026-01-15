-- =========================================================
-- seed-forsured.sql - ForSured Test Data Orchestrator
-- Runs all ForSured-specific seed files in order
-- =========================================================
--
-- Usage:
--   pnpm supa db seed --file seeds/forsured/seed-forsured.sql
--
-- Prerequisites:
--   - Supabase must be running (pnpm supa start)
--   - Core migrations must be applied (pnpm supa db reset)
--   - Core seeds should be applied first for industries
--
-- =========================================================

\echo '============================================='
\echo 'ForSured Test Data Seeder'
\echo '============================================='
\echo ''

-- =========================================================
-- Step 1: Seed ForSured Test Users
-- =========================================================
\echo 'Step 1/7: Seeding ForSured test users...'
\i seeds/forsured/001_seed-users.sql
\echo '✅ Users seeded'
\echo ''

-- =========================================================
-- Step 2: Seed ForSured Organizations
-- =========================================================
\echo 'Step 2/7: Seeding ForSured organizations...'
\i seeds/forsured/002_seed-organizations.sql
\echo '✅ Organizations seeded'
\echo ''

-- =========================================================
-- Step 3: Seed ForSured Projects & Subcontractors
-- =========================================================
\echo 'Step 3/7: Seeding ForSured projects & subcontractors...'
\i seeds/forsured/003_seed-projects.sql
\echo '✅ Projects & subcontractors seeded'
\echo ''

-- =========================================================
-- Step 4: Seed ForSured Documents, Policies & Compliance
-- =========================================================
\echo 'Step 4/7: Seeding ForSured documents, policies & compliance...'
\i seeds/forsured/004_seed-policies.sql
\echo '✅ Documents, policies & compliance seeded'
\echo ''

-- =========================================================
-- Step 5: Seed ForSured Tasks & Comments
-- =========================================================
\echo 'Step 5/7: Seeding ForSured tasks & comments...'
\i seeds/forsured/005_seed-tasks.sql
\echo '✅ Tasks & comments seeded'
\echo ''

-- =========================================================
-- Step 6: Seed ForSured Broker-Client Relationships
-- =========================================================
\echo 'Step 6/7: Seeding ForSured broker-client relationships...'
\i seeds/forsured/006_seed-relationships.sql
\echo '✅ Broker-client relationships seeded'
\echo ''

-- =========================================================
-- Step 7: Seed Comprehensive Data for Test Users
-- =========================================================
\echo 'Step 7/7: Seeding comprehensive data for test users...'
\i seeds/forsured/008_seed-test-users-comprehensive.sql
\echo '✅ Test users comprehensive data seeded'
\echo ''

-- =========================================================
-- Summary
-- =========================================================
\echo '============================================='
\echo 'ForSured Test Data Complete!'
\echo '============================================='
\echo ''
\echo 'Test Users (from "/" page):'
\echo '  - test-gc@forsured.test (Manager with projects, subs, broker)'
\echo '  - test-contractor@forsured.test (Contractor with broker, managers, projects, tasks)'
\echo '  - test-broker@forsured.test (Broker with clients, docs, tasks)'
\echo ''
\echo 'Additional Test Users:'
\echo '  - gc-fresh@forsured-test.com'
\echo '  - gc-active@forsured-test.com'
\echo '  - contractor-active@forsured-test.com'
\echo '  - broker-active@forsured-test.com'
\echo '  - admin@forsured-test.com'
\echo ''
\echo 'Password for all: ForsuredTest123!'
\echo ''
\echo 'Test IDs available in:'
\echo '  packages/supabase/seeds/forsured/test-ids.ts'
\echo '============================================='
