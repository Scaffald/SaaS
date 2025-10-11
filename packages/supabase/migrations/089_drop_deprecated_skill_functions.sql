-- =========================================================
-- 089_drop_deprecated_skill_functions.sql
-- Drop deprecated skill functions that reference old schema
-- =========================================================

BEGIN;

-- These functions reference the old hierarchical skills table
-- which was replaced by polymorphic user_skills in migration 087

DROP FUNCTION IF EXISTS public.search_parent_skills(UUID, UUID, INTEGER);
DROP FUNCTION IF EXISTS public.get_skill_children(UUID);
DROP FUNCTION IF EXISTS public.get_user_skills_with_parents(UUID);
DROP FUNCTION IF EXISTS public.search_skills_with_hierarchy(TEXT, UUID, INTEGER);
DROP FUNCTION IF EXISTS public.get_skill_details(UUID);

-- Note: The old profile.skills router endpoints will still work for basic operations
-- but searchParentSkills and getUserSkills should be replaced with skillsV2 endpoints

COMMIT;
