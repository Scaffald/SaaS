-- Seed initial job feeds

INSERT INTO external_job_feeds (name, url, feed_type, is_active)
VALUES 
  ('WeWorkRemotely - All Jobs', 'https://weworkremotely.com/remote-jobs.rss', 'rss', true),
  ('WeWorkRemotely - Programming', 'https://weworkremotely.com/categories/remote-programming-jobs.rss', 'rss', true),
  ('WeWorkRemotely - Design', 'https://weworkremotely.com/categories/remote-design-jobs.rss', 'rss', true)
ON CONFLICT (name) DO NOTHING;
