-- Migration: Clean and Organize Certification Categories (REQ-232)
-- This migration identifies and fixes duplicate certification categories,
-- organizes the hierarchy, and removes deprecated categories while preserving user data.

-- Step 1: Create a function to identify duplicate categories
-- Duplicates are defined as certifications with the same title at the same depth level
-- with the same parent (or both null parents)

CREATE OR REPLACE FUNCTION data.identify_duplicate_certifications()
RETURNS TABLE (
  title TEXT,
  depth INTEGER,
  parent_id UUID,
  duplicate_count BIGINT,
  certification_ids UUID[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.title,
    c.depth,
    c.parent_id,
    COUNT(*)::BIGINT as duplicate_count,
    ARRAY_AGG(c.id ORDER BY c.created_at) as certification_ids
  FROM data.certifications c
  WHERE c.is_active = true
  GROUP BY c.title, c.depth, c.parent_id
  HAVING COUNT(*) > 1
  ORDER BY duplicate_count DESC, c.depth, c.title;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create a function to merge duplicate certifications
-- This function merges duplicate certifications by:
-- 1. Keeping the oldest certification (earliest created_at)
-- 2. Updating all user_certifications to point to the kept certification
-- 3. Updating all child certifications to point to the kept parent
-- 4. Marking duplicates as inactive (soft delete)

CREATE OR REPLACE FUNCTION data.merge_duplicate_certifications(
  duplicate_ids UUID[],
  keep_id UUID
)
RETURNS void AS $$
DECLARE
  dup_id UUID;
BEGIN
  -- Update user_certifications to point to the kept certification
  UPDATE core.user_certifications
  SET certification_id = keep_id,
      updated_at = NOW()
  WHERE certification_id = ANY(duplicate_ids)
    AND certification_id != keep_id;

  -- Update child certifications to point to the kept parent
  UPDATE data.certifications
  SET parent_id = keep_id,
      updated_at = NOW()
  WHERE parent_id = ANY(duplicate_ids)
    AND parent_id != keep_id;

  -- Mark duplicates as inactive (soft delete)
  UPDATE data.certifications
  SET is_active = false,
      updated_at = NOW()
  WHERE id = ANY(duplicate_ids)
    AND id != keep_id;

  -- Log the merge
  RAISE NOTICE 'Merged % duplicate certifications into %', array_length(duplicate_ids, 1) - 1, keep_id;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create a function to clean up deprecated categories
-- Deprecated categories are those that:
-- 1. Have no user_certifications associated
-- 2. Have no child certifications
-- 3. Are marked as inactive or have is_active = false

CREATE OR REPLACE FUNCTION data.cleanup_deprecated_certifications()
RETURNS TABLE (
  removed_count INTEGER,
  kept_count INTEGER
) AS $$
DECLARE
  removed INTEGER := 0;
  kept INTEGER := 0;
BEGIN
  -- Mark as inactive: certifications with no user associations and no children
  WITH deprecated AS (
    SELECT c.id
    FROM data.certifications c
    WHERE c.is_active = true
      AND NOT EXISTS (
        SELECT 1 FROM core.user_certifications uc
        WHERE uc.certification_id = c.id AND uc.is_active = true
      )
      AND NOT EXISTS (
        SELECT 1 FROM data.certifications child
        WHERE child.parent_id = c.id AND child.is_active = true
      )
      AND c.depth < 2  -- Only mark categories (depth 0, 1) as deprecated, not actual certifications
  )
  UPDATE data.certifications
  SET is_active = false,
      updated_at = NOW()
  WHERE id IN (SELECT id FROM deprecated);

  GET DIAGNOSTICS removed = ROW_COUNT;

  -- Count kept certifications
  SELECT COUNT(*) INTO kept
  FROM data.certifications
  WHERE is_active = true;

  RETURN QUERY SELECT removed, kept;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create a function to normalize category names
-- This ensures consistent naming (trim whitespace, fix capitalization)

CREATE OR REPLACE FUNCTION data.normalize_certification_titles()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  -- Normalize titles: trim whitespace, fix common capitalization issues
  UPDATE data.certifications
  SET title = TRIM(title),
      updated_at = NOW()
  WHERE title != TRIM(title);

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create a function to verify hierarchy integrity
-- Ensures all certifications have valid parent references

CREATE OR REPLACE FUNCTION data.verify_certification_hierarchy()
RETURNS TABLE (
  invalid_count INTEGER,
  invalid_certs JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as invalid_count,
    jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'title', c.title,
        'depth', c.depth,
        'parent_id', c.parent_id,
        'issue', CASE
          WHEN c.depth > 0 AND c.parent_id IS NULL THEN 'Missing parent'
          WHEN c.depth = 0 AND c.parent_id IS NOT NULL THEN 'Top-level has parent'
          WHEN c.parent_id IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM data.certifications p
            WHERE p.id = c.parent_id AND p.is_active = true
          ) THEN 'Invalid parent reference'
          ELSE 'Unknown issue'
        END
      )
    ) as invalid_certs
  FROM data.certifications c
  WHERE c.is_active = true
    AND (
      (c.depth > 0 AND c.parent_id IS NULL)
      OR (c.depth = 0 AND c.parent_id IS NOT NULL)
      OR (c.parent_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM data.certifications p
        WHERE p.id = c.parent_id AND p.is_active = true
      ))
    );
END;
$$ LANGUAGE plpgsql;

-- Step 6: Main cleanup function that runs all cleanup operations
-- This is the function that should be called to perform the cleanup

CREATE OR REPLACE FUNCTION data.clean_certification_categories()
RETURNS TABLE (
  operation TEXT,
  result JSONB
) AS $$
DECLARE
  dup_result RECORD;
  cleanup_result RECORD;
  normalize_count INTEGER;
  verify_result RECORD;
BEGIN
  -- Step 1: Normalize titles
  SELECT data.normalize_certification_titles() INTO normalize_count;
  RETURN QUERY SELECT 'normalize_titles'::TEXT, jsonb_build_object('updated', normalize_count);

  -- Step 2: Identify and report duplicates (but don't auto-merge - requires manual review)
  -- This is a reporting step - actual merging should be done manually after review
  FOR dup_result IN
    SELECT * FROM data.identify_duplicate_certifications()
  LOOP
    RETURN QUERY SELECT 
      'duplicate_found'::TEXT,
      jsonb_build_object(
        'title', dup_result.title,
        'depth', dup_result.depth,
        'count', dup_result.duplicate_count,
        'ids', dup_result.certification_ids
      );
  END LOOP;

  -- Step 3: Clean up deprecated categories
  SELECT * INTO cleanup_result FROM data.cleanup_deprecated_certifications();
  RETURN QUERY SELECT 
    'cleanup_deprecated'::TEXT,
    jsonb_build_object(
      'removed', cleanup_result.removed_count,
      'kept', cleanup_result.kept_count
    );

  -- Step 4: Verify hierarchy integrity
  SELECT * INTO verify_result FROM data.verify_certification_hierarchy();
  RETURN QUERY SELECT 
    'verify_hierarchy'::TEXT,
    jsonb_build_object(
      'invalid_count', verify_result.invalid_count,
      'invalid_certs', verify_result.invalid_certs
    );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION data.identify_duplicate_certifications() TO authenticated;
GRANT EXECUTE ON FUNCTION data.merge_duplicate_certifications(UUID[], UUID) TO service_role;
GRANT EXECUTE ON FUNCTION data.cleanup_deprecated_certifications() TO service_role;
GRANT EXECUTE ON FUNCTION data.normalize_certification_titles() TO service_role;
GRANT EXECUTE ON FUNCTION data.verify_certification_hierarchy() TO authenticated;
GRANT EXECUTE ON FUNCTION data.clean_certification_categories() TO service_role;

-- Note: This migration creates functions for identifying and cleaning certification categories.
-- The actual cleanup should be run manually after reviewing the duplicate report:
-- SELECT * FROM data.clean_certification_categories();
-- 
-- To merge specific duplicates after review:
-- SELECT data.merge_duplicate_certifications(
--   ARRAY['dup-id-1'::UUID, 'dup-id-2'::UUID],
--   'keep-id'::UUID
-- );

