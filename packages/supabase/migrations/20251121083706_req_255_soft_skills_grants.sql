-- Ensure anon and authenticated roles can read soft skills catalog
GRANT SELECT ON core.soft_skills TO anon, authenticated;


