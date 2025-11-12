-- =========================================================
-- 046_req_94_trades_taxonomy.sql
-- Trades taxonomy reference data and user skill mapping
-- =========================================================

BEGIN;

-- ---------------------------------------------------------
-- Trades reference table (data schema)
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS data.trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug CITEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  csi_divisions TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS data_trades_set_updated_at ON data.trades;

CREATE TRIGGER data_trades_set_updated_at
  BEFORE UPDATE ON data.trades
  FOR EACH ROW
  EXECUTE FUNCTION core.set_updated_at();

-- ---------------------------------------------------------
-- Seed common construction trades (idempotent)
-- ---------------------------------------------------------

INSERT INTO data.trades (slug, name, description, csi_divisions)
VALUES
  ('general-conditions', 'General Conditions', 'Project administration, mobilization, and general requirements.', ARRAY['01']),
  ('sitework', 'Sitework & Civil', 'Earthwork, utilities, and exterior improvements.', ARRAY['02', '31', '32', '33']),
  ('concrete', 'Concrete', 'Formwork, reinforcing, placement, and finishing of concrete.', ARRAY['03']),
  ('masonry', 'Masonry', 'Brick, block, stone, and masonry assemblies.', ARRAY['04']),
  ('metals', 'Structural & Miscellaneous Metals', 'Steel fabrication, erection, and metal components.', ARRAY['05']),
  ('carpentry', 'Carpentry & Millwork', 'Rough and finish carpentry, casework, and millwork.', ARRAY['06']),
  ('envelope', 'Building Envelope', 'Thermal, moisture protection, roofing, and weather barriers.', ARRAY['07']),
  ('openings', 'Openings & Glazing', 'Doors, frames, windows, curtainwall, and glazing systems.', ARRAY['08']),
  ('finishes', 'Interior Finishes', 'Drywall, flooring, ceilings, and specialty finishes.', ARRAY['09']),
  ('specialties', 'Specialties & Equipment', 'Specialties, equipment, furnishings, and conveying systems.', ARRAY['10', '11', '12', '13', '14']),
  ('mechanical', 'Mechanical (HVAC)', 'Heating, ventilation, air conditioning, and refrigeration.', ARRAY['23']),
  ('plumbing', 'Plumbing', 'Sanitary, water supply, medical gas, and related systems.', ARRAY['22']),
  ('fire-protection', 'Fire Suppression', 'Fire sprinklers and protection systems.', ARRAY['21']),
  ('electrical', 'Electrical', 'Power, lighting, low-voltage, and communications infrastructure.', ARRAY['26', '27', '28']),
  ('exterior-improvements', 'Exterior Improvements', 'Landscaping, fencing, paving, and site amenities.', ARRAY['32']),
  ('utilities', 'Utilities', 'Underground utilities and process piping.', ARRAY['33'])
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  csi_divisions = EXCLUDED.csi_divisions,
  updated_at = NOW();

-- ---------------------------------------------------------
-- Extend user skills with trade reference
-- ---------------------------------------------------------

ALTER TABLE core.user_skills
  ADD COLUMN IF NOT EXISTS trade_id UUID REFERENCES data.trades(id);

CREATE INDEX IF NOT EXISTS user_skills_trade_idx
  ON core.user_skills (trade_id);

-- ---------------------------------------------------------
-- Helper function to map CSI skills to trades
-- ---------------------------------------------------------

CREATE OR REPLACE FUNCTION core.detect_trade_for_csi_skill(skill_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT trades.id
  FROM data.masterformat mf
  CROSS JOIN LATERAL (
    SELECT SUBSTRING(mf.code_key FROM '^[0-9]{2}') AS division_prefix
  ) prefix
  JOIN data.trades trades
    ON prefix.division_prefix IS NOT NULL
    AND trades.csi_divisions @> ARRAY[prefix.division_prefix]
  WHERE mf.id = skill_id
  ORDER BY trades.id
  LIMIT 1
$$;

-- ---------------------------------------------------------
-- Trigger to automatically assign trade_id on change
-- ---------------------------------------------------------

CREATE OR REPLACE FUNCTION core.assign_user_skill_trade()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.skill_taxonomy = 'csi' AND NEW.csi_skill_id IS NOT NULL THEN
    NEW.trade_id := core.detect_trade_for_csi_skill(NEW.csi_skill_id);
  ELSE
    NEW.trade_id := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_skills_assign_trade ON core.user_skills;

CREATE TRIGGER user_skills_assign_trade
  BEFORE INSERT OR UPDATE ON core.user_skills
  FOR EACH ROW
  EXECUTE FUNCTION core.assign_user_skill_trade();

-- ---------------------------------------------------------
-- Backfill existing user skill trade assignments
-- ---------------------------------------------------------

UPDATE core.user_skills us
SET trade_id = core.detect_trade_for_csi_skill(us.csi_skill_id)
WHERE us.skill_taxonomy = 'csi';

COMMIT;


