-- =========================================================
-- 411_community_skill_taxonomy.sql
-- Hierarchical skill taxonomy for trade communities (Tier 0-3+)
-- =========================================================

BEGIN;

-- =========================================================
-- Table: community.skill_taxonomy
-- Predefined hierarchical tree — NOT free-form tags
-- Tier 0: Trade/Certification (maps to community)
-- Tier 1: Primary Discipline (e.g., Hair, Nails, Makeup)
-- Tier 2: Subskill (e.g., Color, Cut, Styling)
-- Tier 3: Specialty (e.g., Foiling, Balayage, Updos)
-- =========================================================
CREATE TABLE community.skill_taxonomy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug CITEXT NOT NULL,
  tier SMALLINT NOT NULL CHECK (tier BETWEEN 0 AND 4),
  parent_id UUID REFERENCES community.skill_taxonomy(id) ON DELETE CASCADE,
  community_id UUID REFERENCES community.communities(id) ON DELETE CASCADE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  tsv TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', name)) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique within same parent (allows same name in different branches)
  UNIQUE (slug, parent_id)
);

COMMENT ON TABLE community.skill_taxonomy IS 'Hierarchical skill taxonomy — the core data asset differentiating Scaffold Communities';
COMMENT ON COLUMN community.skill_taxonomy.tier IS '0=Trade, 1=Primary Discipline, 2=Subskill, 3=Specialty, 4=Micro-specialty';
COMMENT ON COLUMN community.skill_taxonomy.community_id IS 'Tier 0 entries map to a community; deeper tiers inherit via parent chain';
COMMENT ON COLUMN community.skill_taxonomy.tsv IS 'Full-text search vector for search-first tagging UX';

-- Tier 0 must have community_id, deeper tiers must have parent_id
ALTER TABLE community.skill_taxonomy ADD CONSTRAINT chk_tier_0_has_community
  CHECK (NOT (tier = 0 AND community_id IS NULL));

ALTER TABLE community.skill_taxonomy ADD CONSTRAINT chk_deeper_tiers_have_parent
  CHECK (NOT (tier > 0 AND parent_id IS NULL));

-- =========================================================
-- Function: community.search_skill_taxonomy
-- Search-first approach: type a term, get results with full parent chain
-- =========================================================
CREATE OR REPLACE FUNCTION community.search_skill_taxonomy(
  p_query TEXT,
  p_community_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
) RETURNS TABLE (
  id UUID,
  name TEXT,
  slug CITEXT,
  tier SMALLINT,
  parent_id UUID,
  community_id UUID,
  parent_chain JSONB,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE ancestry AS (
    -- Base: matching nodes
    SELECT
      st.id,
      st.name,
      st.slug,
      st.tier,
      st.parent_id,
      st.community_id,
      ts_rank(st.tsv, websearch_to_tsquery('english', p_query)) AS rank,
      ARRAY[jsonb_build_object('id', st.id, 'name', st.name, 'tier', st.tier)] AS chain
    FROM community.skill_taxonomy st
    WHERE st.tsv @@ websearch_to_tsquery('english', p_query)
      AND st.is_active = true
      AND (p_community_id IS NULL OR st.community_id = p_community_id OR EXISTS (
        -- Check if skill belongs to the requested community via its ancestor chain
        WITH RECURSIVE ancestors AS (
          SELECT st2.id, st2.parent_id, st2.community_id
          FROM community.skill_taxonomy st2 WHERE st2.id = st.id
          UNION ALL
          SELECT st3.id, st3.parent_id, st3.community_id
          FROM community.skill_taxonomy st3
          JOIN ancestors a ON a.parent_id = st3.id
        )
        SELECT 1 FROM ancestors WHERE community_id = p_community_id
      ))

    UNION ALL

    -- Recursive: walk up to parents
    SELECT
      p.id,
      p.name,
      p.slug,
      p.tier,
      p.parent_id,
      p.community_id,
      a.rank,
      jsonb_build_object('id', p.id, 'name', p.name, 'tier', p.tier) || a.chain
    FROM community.skill_taxonomy p
    JOIN ancestry a ON a.parent_id = p.id
  )
  SELECT DISTINCT ON (ancestry.id)
    ancestry.id,
    ancestry.name,
    ancestry.slug,
    ancestry.tier,
    ancestry.parent_id,
    ancestry.community_id,
    to_jsonb(ancestry.chain) AS parent_chain,
    ancestry.rank
  FROM ancestry
  WHERE ancestry.parent_id IS NULL  -- Only return leaf matches (with full chain)
     OR ancestry.tier = (SELECT MIN(a2.tier) FROM ancestry a2 WHERE a2.id = ancestry.id)
  ORDER BY ancestry.id, ancestry.rank DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION community.search_skill_taxonomy IS 'Search-first skill tagging: type a term, get results with auto-selected parent hierarchy';

GRANT EXECUTE ON FUNCTION community.search_skill_taxonomy TO authenticated;
GRANT EXECUTE ON FUNCTION community.search_skill_taxonomy TO service_role;

-- =========================================================
-- Function: community.get_skill_ancestors
-- Given a skill ID, return its full ancestry chain (for auto-tagging)
-- =========================================================
CREATE OR REPLACE FUNCTION community.get_skill_ancestors(p_skill_id UUID)
RETURNS UUID[] AS $$
DECLARE
  v_ancestors UUID[];
BEGIN
  WITH RECURSIVE chain AS (
    SELECT id, parent_id FROM community.skill_taxonomy WHERE id = p_skill_id
    UNION ALL
    SELECT st.id, st.parent_id
    FROM community.skill_taxonomy st
    JOIN chain c ON c.parent_id = st.id
  )
  SELECT array_agg(id) INTO v_ancestors FROM chain;

  RETURN v_ancestors;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION community.get_skill_ancestors IS 'Returns array of all ancestor IDs for a skill — used for auto-parent-tagging on posts';

GRANT EXECUTE ON FUNCTION community.get_skill_ancestors TO authenticated;
GRANT EXECUTE ON FUNCTION community.get_skill_ancestors TO service_role;

-- =========================================================
-- Indexes
-- =========================================================
CREATE INDEX idx_skill_taxonomy_parent_id ON community.skill_taxonomy (parent_id);
CREATE INDEX idx_skill_taxonomy_community_id ON community.skill_taxonomy (community_id);
CREATE INDEX idx_skill_taxonomy_tier ON community.skill_taxonomy (tier);
CREATE INDEX idx_skill_taxonomy_tsv ON community.skill_taxonomy USING GIN (tsv);
CREATE INDEX idx_skill_taxonomy_active ON community.skill_taxonomy (is_active) WHERE is_active = true;

-- Updated_at trigger
CREATE TRIGGER trg_skill_taxonomy_updated_at BEFORE UPDATE ON community.skill_taxonomy
  FOR EACH ROW EXECUTE FUNCTION community.set_updated_at();

COMMIT;
