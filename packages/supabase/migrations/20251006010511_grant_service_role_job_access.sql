-- Grant service role access to external job tables for import functions

-- Grant full access to service_role for job import operations
GRANT ALL ON external_job_feeds TO service_role;
GRANT ALL ON external_jobs TO service_role;
GRANT ALL ON external_job_industries TO service_role;
GRANT ALL ON external_job_skills TO service_role;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
