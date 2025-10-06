-- Seed initial job feeds

INSERT INTO external_job_feeds (name, feed_url, feed_type, require_industry_match, active)
VALUES 
  ('WeWorkRemotely - Programming', 'https://weworkremotely.com/remote-jobs.rss', 'rss', false, true),
  ('WeWorkRemotely - Design', 'https://weworkremotely.com/categories/remote-design-jobs.rss', 'rss', false, true)
ON CONFLICT (feed_url) DO NOTHING;
