-- =========================================================
-- 413_community_seed_data.sql
-- Seed initial communities and skill taxonomy (Tier 0-3)
-- =========================================================

BEGIN;

-- =========================================================
-- SEED COMMUNITIES
-- =========================================================
INSERT INTO community.communities (id, name, slug, description) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'Cosmetology', 'cosmetology', 'Licensed cosmetologists — hair, nails, makeup, and skincare professionals'),
  ('a0000000-0000-4000-8000-000000000002', 'Electrical', 'electrical', 'Licensed electricians — residential, commercial, and industrial electrical work'),
  ('a0000000-0000-4000-8000-000000000003', 'Plumbing', 'plumbing', 'Licensed plumbers — rough, finish, and specialty plumbing'),
  ('a0000000-0000-4000-8000-000000000004', 'HVAC', 'hvac', 'Licensed HVAC technicians — heating, ventilation, air conditioning, and refrigeration'),
  ('a0000000-0000-4000-8000-000000000005', 'Carpentry', 'carpentry', 'Skilled carpenters — framing, finish, cabinetry, and furniture'),
  ('a0000000-0000-4000-8000-000000000006', 'Welding', 'welding', 'Certified welders — MIG, TIG, stick, flux-core, and specialty welding'),
  ('a0000000-0000-4000-8000-000000000007', 'Masonry', 'masonry', 'Licensed masons — brick, block, stone, and concrete work'),
  ('a0000000-0000-4000-8000-000000000008', 'Painting', 'painting', 'Licensed painters — residential, commercial, decorative, and industrial coatings'),
  ('a0000000-0000-4000-8000-000000000009', 'Roofing', 'roofing', 'Licensed roofers — shingle, flat, metal, tile, and green roofing'),
  ('a0000000-0000-4000-8000-000000000010', 'Landscaping', 'landscaping', 'Licensed landscapers — design, hardscape, irrigation, and maintenance');

-- =========================================================
-- SEED SKILL TAXONOMY — Tier 0 (Trade level, maps to community)
-- =========================================================
INSERT INTO community.skill_taxonomy (id, name, slug, tier, community_id) VALUES
  ('b0000000-0000-4000-8000-000000000001', 'Cosmetology', 'cosmetology', 0, 'a0000000-0000-4000-8000-000000000001'),
  ('b0000000-0000-4000-8000-000000000002', 'Electrical', 'electrical', 0, 'a0000000-0000-4000-8000-000000000002'),
  ('b0000000-0000-4000-8000-000000000003', 'Plumbing', 'plumbing', 0, 'a0000000-0000-4000-8000-000000000003'),
  ('b0000000-0000-4000-8000-000000000004', 'HVAC', 'hvac', 0, 'a0000000-0000-4000-8000-000000000004'),
  ('b0000000-0000-4000-8000-000000000005', 'Carpentry', 'carpentry', 0, 'a0000000-0000-4000-8000-000000000005'),
  ('b0000000-0000-4000-8000-000000000006', 'Welding', 'welding', 0, 'a0000000-0000-4000-8000-000000000006'),
  ('b0000000-0000-4000-8000-000000000007', 'Masonry', 'masonry', 0, 'a0000000-0000-4000-8000-000000000007'),
  ('b0000000-0000-4000-8000-000000000008', 'Painting', 'painting', 0, 'a0000000-0000-4000-8000-000000000008'),
  ('b0000000-0000-4000-8000-000000000009', 'Roofing', 'roofing', 0, 'a0000000-0000-4000-8000-000000000009'),
  ('b0000000-0000-4000-8000-000000000010', 'Landscaping', 'landscaping', 0, 'a0000000-0000-4000-8000-000000000010');

-- =========================================================
-- COSMETOLOGY — Tier 1 (Primary Disciplines)
-- =========================================================
INSERT INTO community.skill_taxonomy (id, name, slug, tier, parent_id) VALUES
  ('c1000000-0000-4000-8000-000000000001', 'Hair', 'hair', 1, 'b0000000-0000-4000-8000-000000000001'),
  ('c1000000-0000-4000-8000-000000000002', 'Nails', 'nails', 1, 'b0000000-0000-4000-8000-000000000001'),
  ('c1000000-0000-4000-8000-000000000003', 'Makeup', 'makeup', 1, 'b0000000-0000-4000-8000-000000000001'),
  ('c1000000-0000-4000-8000-000000000004', 'Skincare', 'skincare', 1, 'b0000000-0000-4000-8000-000000000001');

-- Cosmetology > Hair — Tier 2 (Subskills)
INSERT INTO community.skill_taxonomy (id, name, slug, tier, parent_id) VALUES
  ('c2000000-0000-4000-8000-000000000001', 'Color', 'color', 2, 'c1000000-0000-4000-8000-000000000001'),
  ('c2000000-0000-4000-8000-000000000002', 'Cut', 'cut', 2, 'c1000000-0000-4000-8000-000000000001'),
  ('c2000000-0000-4000-8000-000000000003', 'Styling', 'styling', 2, 'c1000000-0000-4000-8000-000000000001'),
  ('c2000000-0000-4000-8000-000000000004', 'Extensions', 'extensions', 2, 'c1000000-0000-4000-8000-000000000001'),
  ('c2000000-0000-4000-8000-000000000005', 'Texture', 'texture', 2, 'c1000000-0000-4000-8000-000000000001');

-- Cosmetology > Hair > Color — Tier 3 (Specialties)
INSERT INTO community.skill_taxonomy (name, slug, tier, parent_id) VALUES
  ('Foiling', 'foiling', 3, 'c2000000-0000-4000-8000-000000000001'),
  ('Balayage', 'balayage', 3, 'c2000000-0000-4000-8000-000000000001'),
  ('Full Color', 'full-color', 3, 'c2000000-0000-4000-8000-000000000001'),
  ('Color Correction', 'color-correction', 3, 'c2000000-0000-4000-8000-000000000001'),
  ('Root Touch-Up', 'root-touch-up', 3, 'c2000000-0000-4000-8000-000000000001'),
  ('Highlights', 'highlights', 3, 'c2000000-0000-4000-8000-000000000001'),
  ('Lowlights', 'lowlights', 3, 'c2000000-0000-4000-8000-000000000001'),
  ('Ombre', 'ombre', 3, 'c2000000-0000-4000-8000-000000000001'),
  ('Vivid/Fashion Color', 'vivid-fashion-color', 3, 'c2000000-0000-4000-8000-000000000001');

-- Cosmetology > Hair > Cut — Tier 3
INSERT INTO community.skill_taxonomy (name, slug, tier, parent_id) VALUES
  ('Precision Cut', 'precision-cut', 3, 'c2000000-0000-4000-8000-000000000002'),
  ('Layering', 'layering', 3, 'c2000000-0000-4000-8000-000000000002'),
  ('Fades', 'fades', 3, 'c2000000-0000-4000-8000-000000000002'),
  ('Razor Cut', 'razor-cut', 3, 'c2000000-0000-4000-8000-000000000002'),
  ('Textured Cut', 'textured-cut', 3, 'c2000000-0000-4000-8000-000000000002'),
  ('Bob/Lob', 'bob-lob', 3, 'c2000000-0000-4000-8000-000000000002');

-- Cosmetology > Hair > Styling — Tier 3
INSERT INTO community.skill_taxonomy (name, slug, tier, parent_id) VALUES
  ('Updos', 'updos', 3, 'c2000000-0000-4000-8000-000000000003'),
  ('Blowout', 'blowout', 3, 'c2000000-0000-4000-8000-000000000003'),
  ('Braiding', 'braiding', 3, 'c2000000-0000-4000-8000-000000000003'),
  ('Bridal', 'bridal', 3, 'c2000000-0000-4000-8000-000000000003'),
  ('Waves/Curls', 'waves-curls', 3, 'c2000000-0000-4000-8000-000000000003');

-- Cosmetology > Nails — Tier 2
INSERT INTO community.skill_taxonomy (id, name, slug, tier, parent_id) VALUES
  ('c2000000-0000-4000-8000-000000000010', 'Manicure', 'manicure', 2, 'c1000000-0000-4000-8000-000000000002'),
  ('c2000000-0000-4000-8000-000000000011', 'Pedicure', 'pedicure', 2, 'c1000000-0000-4000-8000-000000000002'),
  ('c2000000-0000-4000-8000-000000000012', 'Nail Art', 'nail-art', 2, 'c1000000-0000-4000-8000-000000000002'),
  ('c2000000-0000-4000-8000-000000000013', 'Acrylics', 'acrylics', 2, 'c1000000-0000-4000-8000-000000000002'),
  ('c2000000-0000-4000-8000-000000000014', 'Gel', 'gel', 2, 'c1000000-0000-4000-8000-000000000002');

-- =========================================================
-- ELECTRICAL — Tier 1 (Primary Disciplines)
-- =========================================================
INSERT INTO community.skill_taxonomy (id, name, slug, tier, parent_id) VALUES
  ('c1000000-0000-4000-8000-000000000010', 'Residential', 'residential-electrical', 1, 'b0000000-0000-4000-8000-000000000002'),
  ('c1000000-0000-4000-8000-000000000011', 'Commercial', 'commercial-electrical', 1, 'b0000000-0000-4000-8000-000000000002'),
  ('c1000000-0000-4000-8000-000000000012', 'Industrial', 'industrial-electrical', 1, 'b0000000-0000-4000-8000-000000000002'),
  ('c1000000-0000-4000-8000-000000000013', 'Low Voltage', 'low-voltage', 1, 'b0000000-0000-4000-8000-000000000002');

-- Electrical > Residential — Tier 2
INSERT INTO community.skill_taxonomy (name, slug, tier, parent_id) VALUES
  ('Panel Upgrades', 'panel-upgrades', 2, 'c1000000-0000-4000-8000-000000000010'),
  ('Wiring', 'wiring', 2, 'c1000000-0000-4000-8000-000000000010'),
  ('Lighting', 'lighting-electrical', 2, 'c1000000-0000-4000-8000-000000000010'),
  ('EV Charger Install', 'ev-charger-install', 2, 'c1000000-0000-4000-8000-000000000010'),
  ('Smart Home', 'smart-home', 2, 'c1000000-0000-4000-8000-000000000010'),
  ('Troubleshooting', 'troubleshooting-electrical', 2, 'c1000000-0000-4000-8000-000000000010');

-- =========================================================
-- PLUMBING — Tier 1 (Primary Disciplines)
-- =========================================================
INSERT INTO community.skill_taxonomy (id, name, slug, tier, parent_id) VALUES
  ('c1000000-0000-4000-8000-000000000020', 'Rough Plumbing', 'rough-plumbing', 1, 'b0000000-0000-4000-8000-000000000003'),
  ('c1000000-0000-4000-8000-000000000021', 'Finish Plumbing', 'finish-plumbing', 1, 'b0000000-0000-4000-8000-000000000003'),
  ('c1000000-0000-4000-8000-000000000022', 'Service & Repair', 'service-repair-plumbing', 1, 'b0000000-0000-4000-8000-000000000003'),
  ('c1000000-0000-4000-8000-000000000023', 'Gas Piping', 'gas-piping', 1, 'b0000000-0000-4000-8000-000000000003');

-- Plumbing > Rough Plumbing — Tier 2
INSERT INTO community.skill_taxonomy (name, slug, tier, parent_id) VALUES
  ('Soldering', 'soldering', 2, 'c1000000-0000-4000-8000-000000000020'),
  ('PEX', 'pex', 2, 'c1000000-0000-4000-8000-000000000020'),
  ('Copper', 'copper', 2, 'c1000000-0000-4000-8000-000000000020'),
  ('Drain Rough-In', 'drain-rough-in', 2, 'c1000000-0000-4000-8000-000000000020');

-- Plumbing > Finish Plumbing — Tier 2
INSERT INTO community.skill_taxonomy (name, slug, tier, parent_id) VALUES
  ('Fixture Install', 'fixture-install', 2, 'c1000000-0000-4000-8000-000000000021'),
  ('Water Heater', 'water-heater', 2, 'c1000000-0000-4000-8000-000000000021'),
  ('Drain Repair', 'drain-repair', 2, 'c1000000-0000-4000-8000-000000000021');

-- =========================================================
-- HVAC — Tier 1
-- =========================================================
INSERT INTO community.skill_taxonomy (id, name, slug, tier, parent_id) VALUES
  ('c1000000-0000-4000-8000-000000000030', 'Heating', 'heating', 1, 'b0000000-0000-4000-8000-000000000004'),
  ('c1000000-0000-4000-8000-000000000031', 'Cooling', 'cooling', 1, 'b0000000-0000-4000-8000-000000000004'),
  ('c1000000-0000-4000-8000-000000000032', 'Ventilation', 'ventilation', 1, 'b0000000-0000-4000-8000-000000000004'),
  ('c1000000-0000-4000-8000-000000000033', 'Refrigeration', 'refrigeration', 1, 'b0000000-0000-4000-8000-000000000004');

-- =========================================================
-- CARPENTRY — Tier 1
-- =========================================================
INSERT INTO community.skill_taxonomy (id, name, slug, tier, parent_id) VALUES
  ('c1000000-0000-4000-8000-000000000040', 'Framing', 'framing', 1, 'b0000000-0000-4000-8000-000000000005'),
  ('c1000000-0000-4000-8000-000000000041', 'Finish Carpentry', 'finish-carpentry', 1, 'b0000000-0000-4000-8000-000000000005'),
  ('c1000000-0000-4000-8000-000000000042', 'Cabinetry', 'cabinetry', 1, 'b0000000-0000-4000-8000-000000000005'),
  ('c1000000-0000-4000-8000-000000000043', 'Furniture', 'furniture', 1, 'b0000000-0000-4000-8000-000000000005');

-- =========================================================
-- WELDING — Tier 1
-- =========================================================
INSERT INTO community.skill_taxonomy (id, name, slug, tier, parent_id) VALUES
  ('c1000000-0000-4000-8000-000000000050', 'MIG', 'mig', 1, 'b0000000-0000-4000-8000-000000000006'),
  ('c1000000-0000-4000-8000-000000000051', 'TIG', 'tig', 1, 'b0000000-0000-4000-8000-000000000006'),
  ('c1000000-0000-4000-8000-000000000052', 'Stick', 'stick', 1, 'b0000000-0000-4000-8000-000000000006'),
  ('c1000000-0000-4000-8000-000000000053', 'Flux-Core', 'flux-core', 1, 'b0000000-0000-4000-8000-000000000006');

-- =========================================================
-- MASONRY — Tier 1
-- =========================================================
INSERT INTO community.skill_taxonomy (id, name, slug, tier, parent_id) VALUES
  ('c1000000-0000-4000-8000-000000000060', 'Brick', 'brick', 1, 'b0000000-0000-4000-8000-000000000007'),
  ('c1000000-0000-4000-8000-000000000061', 'Block', 'block', 1, 'b0000000-0000-4000-8000-000000000007'),
  ('c1000000-0000-4000-8000-000000000062', 'Stone', 'stone', 1, 'b0000000-0000-4000-8000-000000000007'),
  ('c1000000-0000-4000-8000-000000000063', 'Concrete', 'concrete', 1, 'b0000000-0000-4000-8000-000000000007');

-- =========================================================
-- PAINTING — Tier 1
-- =========================================================
INSERT INTO community.skill_taxonomy (id, name, slug, tier, parent_id) VALUES
  ('c1000000-0000-4000-8000-000000000070', 'Interior', 'interior-painting', 1, 'b0000000-0000-4000-8000-000000000008'),
  ('c1000000-0000-4000-8000-000000000071', 'Exterior', 'exterior-painting', 1, 'b0000000-0000-4000-8000-000000000008'),
  ('c1000000-0000-4000-8000-000000000072', 'Decorative', 'decorative-painting', 1, 'b0000000-0000-4000-8000-000000000008'),
  ('c1000000-0000-4000-8000-000000000073', 'Industrial Coatings', 'industrial-coatings', 1, 'b0000000-0000-4000-8000-000000000008');

-- =========================================================
-- ROOFING — Tier 1
-- =========================================================
INSERT INTO community.skill_taxonomy (id, name, slug, tier, parent_id) VALUES
  ('c1000000-0000-4000-8000-000000000080', 'Shingle', 'shingle', 1, 'b0000000-0000-4000-8000-000000000009'),
  ('c1000000-0000-4000-8000-000000000081', 'Flat/Low-Slope', 'flat-low-slope', 1, 'b0000000-0000-4000-8000-000000000009'),
  ('c1000000-0000-4000-8000-000000000082', 'Metal', 'metal-roofing', 1, 'b0000000-0000-4000-8000-000000000009'),
  ('c1000000-0000-4000-8000-000000000083', 'Tile', 'tile-roofing', 1, 'b0000000-0000-4000-8000-000000000009');

-- =========================================================
-- LANDSCAPING — Tier 1
-- =========================================================
INSERT INTO community.skill_taxonomy (id, name, slug, tier, parent_id) VALUES
  ('c1000000-0000-4000-8000-000000000090', 'Design', 'landscape-design', 1, 'b0000000-0000-4000-8000-000000000010'),
  ('c1000000-0000-4000-8000-000000000091', 'Hardscape', 'hardscape', 1, 'b0000000-0000-4000-8000-000000000010'),
  ('c1000000-0000-4000-8000-000000000092', 'Irrigation', 'irrigation', 1, 'b0000000-0000-4000-8000-000000000010'),
  ('c1000000-0000-4000-8000-000000000093', 'Maintenance', 'landscape-maintenance', 1, 'b0000000-0000-4000-8000-000000000010');

COMMIT;
