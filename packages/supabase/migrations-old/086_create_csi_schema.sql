-- =========================================================
-- 086_create_csi_schema.sql
-- Construction Specifications Institute (CSI) MasterFormat
-- =========================================================

BEGIN;

-- Create CSI schema
CREATE SCHEMA IF NOT EXISTS csi;

-- =========================================================
-- CSI MasterFormat Table
-- =========================================================

CREATE TABLE csi.masterformat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Code components (4-part hierarchy)
  code TEXT[4] NOT NULL,
  code_key TEXT UNIQUE NOT NULL,
  code_display TEXT NOT NULL,
  
  -- Naming
  name TEXT NOT NULL,
  description TEXT,
  
  -- Hierarchy
  depth SMALLINT NOT NULL CHECK (depth BETWEEN 1 AND 4),
  parent_id UUID REFERENCES csi.masterformat(id) ON DELETE CASCADE,
  
  -- Metadata
  active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT csi_code_length CHECK (array_length(code, 1) = 4)
);

-- =========================================================
-- Indexes
-- =========================================================

CREATE INDEX idx_csi_code_key ON csi.masterformat(code_key);
CREATE INDEX idx_csi_code_gin ON csi.masterformat USING GIN(code);
CREATE INDEX idx_csi_parent ON csi.masterformat(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_csi_depth ON csi.masterformat(depth);
CREATE INDEX idx_csi_active ON csi.masterformat(active) WHERE active = true;

-- =========================================================
-- Helper Functions
-- =========================================================

-- Search CSI by name or code
CREATE OR REPLACE FUNCTION csi.search_masterformat(
  search_term TEXT
)
RETURNS TABLE (
  id UUID,
  code_key TEXT,
  code_display TEXT,
  name TEXT,
  depth SMALLINT,
  relevance NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.code_key,
    m.code_display,
    m.name,
    m.depth,
    CASE 
      WHEN m.name ILIKE search_term || '%' THEN 1.0
      WHEN m.name ILIKE '%' || search_term || '%' THEN 0.5
      WHEN m.code_display ILIKE search_term || '%' THEN 0.8
      ELSE 0.3
    END as relevance
  FROM csi.masterformat m
  WHERE m.active = true
    AND (
      m.name ILIKE '%' || search_term || '%'
      OR m.code_display ILIKE '%' || search_term || '%'
      OR m.code_key ILIKE '%' || search_term || '%'
    )
  ORDER BY relevance DESC, m.name;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get full hierarchy path for a code
CREATE OR REPLACE FUNCTION csi.get_hierarchy_path(
  code_id UUID
)
RETURNS TABLE (
  level INT,
  id UUID,
  code_key TEXT,
  name TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE hierarchy AS (
    SELECT 
      1 as level,
      m.id,
      m.code_key,
      m.name,
      m.parent_id
    FROM csi.masterformat m
    WHERE m.id = code_id
    
    UNION ALL
    
    SELECT 
      h.level + 1,
      m.id,
      m.code_key,
      m.name,
      m.parent_id
    FROM csi.masterformat m
    JOIN hierarchy h ON h.parent_id = m.id
  )
  SELECT level, hierarchy.id, hierarchy.code_key, hierarchy.name
  FROM hierarchy
  ORDER BY level DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- =========================================================
-- Permissions
-- =========================================================

-- Service role: full access
GRANT ALL ON SCHEMA csi TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA csi TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA csi TO service_role;

-- Authenticated: read-only
GRANT USAGE ON SCHEMA csi TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA csi TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA csi TO authenticated;

-- Anonymous: read-only
GRANT USAGE ON SCHEMA csi TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA csi TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA csi TO anon;

COMMIT;
