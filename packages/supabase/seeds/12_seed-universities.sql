-- Seed Universities for Testing
-- This file seeds the data.universities table with test data including Ferris State University

INSERT INTO data.universities (name, country, alpha_two_code, state_province, domains, web_pages, slug, is_active) VALUES
('Ferris State University', 'United States', 'US', 'Michigan', ARRAY['ferris.edu'], ARRAY['https://www.ferris.edu'], 'ferris-state-university', true),
('Massachusetts Institute of Technology', 'United States', 'US', 'Massachusetts', ARRAY['mit.edu'], ARRAY['https://www.mit.edu'], 'mit', true),
('Harvard University', 'United States', 'US', 'Massachusetts', ARRAY['harvard.edu'], ARRAY['https://www.harvard.edu'], 'harvard-university', true),
('Stanford University', 'United States', 'US', 'California', ARRAY['stanford.edu'], ARRAY['https://www.stanford.edu'], 'stanford-university', true),
('University of Michigan', 'United States', 'US', 'Michigan', ARRAY['umich.edu'], ARRAY['https://www.umich.edu'], 'university-of-michigan', true)
ON CONFLICT (slug) DO NOTHING;
