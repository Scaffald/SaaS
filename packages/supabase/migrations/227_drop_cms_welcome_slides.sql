-- Drop CMS welcome slides and schema (CMS feature removed)
BEGIN;
DROP TABLE IF EXISTS cms.welcome_slides;
DROP SCHEMA IF EXISTS cms;
COMMIT;
