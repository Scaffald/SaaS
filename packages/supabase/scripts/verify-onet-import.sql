-- =========================================================
-- Verify O*NET Import
-- =========================================================

\echo '========================================='
\echo 'O*NET Database Import Verification'
\echo '========================================='
\echo ''

-- Check occupation count
\echo '1. Total Occupations:'
SELECT COUNT(*) as occupation_count FROM onet.occupation_data;
\echo ''

-- Test search function
\echo '2. Search for "software engineer":'
SELECT onetsoc_code, title, rank 
FROM onet.search_occupations('software engineer')
LIMIT 5;
\echo ''

-- Browse first 10 occupations
\echo '3. First 10 Occupations:'
SELECT onetsoc_code, title 
FROM onet.occupation_data 
ORDER BY title 
LIMIT 10;
\echo ''

-- Check table counts
\echo '4. Table Statistics:'
SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables 
WHERE schemaname = 'onet'
ORDER BY n_live_tup DESC
LIMIT 10;
\echo ''

\echo '========================================='
\echo 'Verification Complete!'
\echo '========================================='
