# External Job Import System

## Overview

This system automatically imports job listings from external sources (RSS feeds, APIs) into the Scaffald platform. Jobs are parsed, mapped to industries, deduplicated, and stored for user discovery.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Supabase Edge Functions                     │
├─────────────────────────────────────────────────────────┤
│  1. pg_cron Trigger (every 3 hours)                     │
│     ↓                                                     │
│  2. job-import-orchestrator                              │
│     ↓                                                     │
│  3. Feed Parsers                                         │
│     • WeWorkRemotely (RSS)                               │
│     • Jooble (API)                                       │
│     • Generic RSS                                        │
│     ↓                                                     │
│  4. Industry Mapper                                      │
│     • Rule-based (keywords)                              │
│     • AI fallback (OpenAI GPT-4)                         │
│     ↓                                                     │
│  5. Deduplicator                                         │
│     • GUID matching                                      │
│     • Fuzzy text matching                                │
│     • Content hash                                       │
│     ↓                                                     │
│  6. Database Writer                                      │
│     • external_jobs table                                │
│     • external_job_industries junction                   │
└─────────────────────────────────────────────────────────┘
```

## Database Schema

### Tables Created

1. **external_job_feeds** - Feed source configuration
2. **external_jobs** - Cached external job listings
3. **external_job_industries** - Job-to-industry mappings
4. **external_job_skills** - Job-to-skill mappings (optional)

### Views

- **v_job_import_stats** - Monitoring dashboard
- **v_cron_jobs** - Active cron schedules

### Functions

- **calculate_job_content_hash()** - Content-based deduplication
- **find_similar_jobs()** - Fuzzy matching for duplicates
- **trigger_job_import()** - Manual import trigger

## Setup Instructions

### 1. Run Migrations

```bash
# Apply the migrations
pnpm supa db push

# Or if using migration files directly
pnpm supa migration up
```

This creates:
- Migration 043: External job feed tables
- Migration 044: pg_cron scheduling

### 2. Configure Environment Variables

Add to your `.env` or Supabase dashboard:

```bash
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional - for AI-powered industry mapping
OPENAI_API_KEY=sk-...

# Optional - for Jooble API
JOOBLE_API_KEY=your_jooble_key
```

### 3. Seed Initial Feeds

Add feed sources to the database:

```sql
INSERT INTO external_job_feeds (name, url, feed_type, parser_config, is_active)
VALUES
  (
    'We Work Remotely',
    'https://weworkremotely.com/remote-jobs.rss',
    'rss',
    '{"parser": "weworkremotely", "extractSkills": true}'::jsonb,
    true
  ),
  (
    'Jooble Construction US',
    'https://jooble.org/api/',
    'api',
    '{"parser": "jooble", "keywords": "construction", "location": "United States"}'::jsonb,
    true
  );
```

### 4. Deploy Edge Functions

```bash
# Deploy the orchestrator function
pnpm supa functions deploy job-import-orchestrator

# Deploy manual trigger function (optional)
pnpm supa functions deploy manual-job-import
```

## Usage

### Automatic Imports (Cron)

Jobs are automatically imported every 3 hours at:
- 00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00

No action needed - pg_cron handles this automatically.

### Manual Import Trigger

Via SQL function:

```sql
SELECT trigger_job_import();
```

Via Edge Function:

```bash
curl -X POST \
  https://your-project.supabase.co/functions/v1/manual-job-import \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"feedId": "optional-specific-feed-id"}'
```

### Query Imported Jobs

```sql
-- Get active external jobs
SELECT * FROM external_jobs
WHERE is_active = true
ORDER BY posted_date DESC
LIMIT 50;

-- Get jobs with industry mappings
SELECT
  ej.*,
  eji.industry_id,
  i.name AS industry_name,
  eji.confidence_score
FROM external_jobs ej
JOIN external_job_industries eji ON eji.external_job_id = ej.id
JOIN industries i ON i.id = eji.industry_id
WHERE ej.is_active = true;

-- Monitor import stats
SELECT * FROM v_job_import_stats;
```

## Industry Mapping

### Rule-Based (Primary)

Uses keyword matching against predefined industry categories:

- Construction, Carpentry, Electrical, Plumbing, HVAC
- Roofing, Flooring, Painting, Landscaping, Welding
- Software, Healthcare, Manufacturing, Automotive
- Engineering, Architecture, Property Management, Safety

See `_shared/mappers/industry-keywords.ts` for full list.

### AI-Powered (Fallback)

When rule-based confidence < 0.7, OpenAI GPT-4 is used:

1. Sends job title + description + category to OpenAI
2. Requests industry classification with confidence scores
3. Returns top 3 industry matches
4. Only used for ~10% of jobs (cost-effective)

### Configuration

Edit `industry-keywords.ts` to:

- Add new industry categories
- Modify keyword weights
- Add negative keywords (exclusions)
- Set required keyword combinations

## Deduplication Strategy

### Level 1: Exact GUID Match

```sql
UNIQUE(feed_id, external_guid)
```

Prevents re-importing same job from same feed.

### Level 2: Fuzzy Text Match

```sql
SELECT find_similar_jobs('Job Title', 'Company Name', 7);
```

Uses PostgreSQL `similarity()` function:
- Title similarity > 70%
- Company similarity > 80%
- Posted within 7 days

### Level 3: Content Hash

```sql
content_hash = SHA256(title + company + description_snippet)
```

Catches renamed/reposted jobs with identical content.

## Job Retention Policy

### Active Jobs

Remain `is_active = true` until:
- `expires_date` is reached (if set)
- 30 days have passed since `posted_date` (if no expiry set)

### Archived Jobs

Daily cron at 2:00 AM sets `is_active = false` for expired jobs.
Kept for 90 days for analytics.

### Deleted Jobs

Weekly cron on Sundays at 3:00 AM permanently deletes jobs archived > 90 days.

## Monitoring

### Check Cron Job Status

```sql
SELECT * FROM v_cron_jobs;
```

### Import Statistics

```sql
SELECT
  feed_name,
  total_jobs,
  active_jobs,
  archived_jobs,
  mapped_industries,
  avg_industry_confidence,
  last_fetched_at,
  error_count
FROM v_job_import_stats;
```

### Recent Errors

```sql
SELECT
  name,
  last_error,
  error_count,
  last_success_at
FROM external_job_feeds
WHERE error_count > 0
ORDER BY last_fetched_at DESC;
```

## Adding New Feed Sources

### RSS Feeds

1. Add to `external_job_feeds` table
2. Set `feed_type = 'rss'`
3. Configure parser in `parser_config`:

```json
{
  "parser": "generic",
  "extractSkills": true,
  "fieldMappings": {
    "title": "title",
    "description": "description",
    "link": "link",
    "company": "dc:creator"
  }
}
```

### API Sources

1. Add to `external_job_feeds` table
2. Set `feed_type = 'api'`
3. Create parser in `_shared/parsers/`
4. Add to orchestrator switch statement

Example:

```typescript
// _shared/parsers/your-api-parser.ts
export async function parseYourAPI(feed: ExternalJobFeed): Promise<ParsedJob[]> {
  const config = feed.parser_config as { apiKey: string; keywords: string };

  const response = await fetch(`https://api.example.com/jobs`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${config.apiKey}` },
    body: JSON.stringify({ keywords: config.keywords }),
  });

  const data = await response.json();

  return data.jobs.map((job) => ({
    external_guid: job.id,
    title: job.title,
    description: job.description,
    company_name: job.company,
    application_url: job.applyUrl,
    external_url: job.url,
    posted_date: new Date(job.posted),
  }));
}
```

## Troubleshooting

### Jobs Not Importing

1. Check cron is active:
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'import-external-jobs';
   ```

2. Check feed errors:
   ```sql
   SELECT * FROM external_job_feeds WHERE error_count > 0;
   ```

3. Test manual trigger:
   ```sql
   SELECT trigger_job_import();
   ```

### Jobs Not Mapped to Industries

1. Check industry mappings exist:
   ```sql
   SELECT * FROM external_job_industries LIMIT 10;
   ```

2. Review confidence scores:
   ```sql
   SELECT
     confidence_score,
     COUNT(*) as count
   FROM external_job_industries
   GROUP BY confidence_score
   ORDER BY confidence_score;
   ```

3. Add more keywords to `industry-keywords.ts` for your domain

### High Error Rates

1. Check feed URLs are accessible
2. Verify API keys are valid
3. Review Edge Function logs in Supabase dashboard
4. Check rate limiting from external sources

## Performance Optimization

### Database Indexes

All performance-critical indexes are created by migrations:

- `idx_external_jobs_active` - Filter active jobs
- `idx_external_jobs_posted` - Sort by date
- `idx_external_jobs_company` - Company lookups
- `idx_external_jobs_category` - Category filtering
- `idx_external_jobs_hash` - Deduplication

### Caching Strategy

- Jobs cached in `external_jobs` table
- Refreshed every 3 hours
- No expensive API calls during user queries
- Industry mappings pre-computed and stored

### Cost Management

- Rule-based mapping handles 90% of jobs (free)
- AI mapping only for uncertain cases (~10%)
- Automatic cleanup reduces storage costs
- Cron runs during low-traffic hours

## Next Steps

1. ✅ Database migrations applied
2. ✅ Industry mapping configured
3. ⏳ Implement RSS parsers (WeWorkRemotely, generic)
4. ⏳ Implement API parsers (Jooble)
5. ⏳ Create deduplication service
6. ⏳ Build job-import-orchestrator function
7. ⏳ Deploy and test
8. ⏳ Monitor and optimize

## Support

For issues or questions:

1. Check Edge Function logs in Supabase dashboard
2. Review `v_job_import_stats` for import health
3. Check `external_job_feeds` table for feed errors
4. Review cron job history: `SELECT * FROM cron.job_run_details;`
