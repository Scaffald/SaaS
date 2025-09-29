# RSS Job Feeds Integration

## Overview

This document outlines the implementation of RSS job feed integration for Scaffald, enabling the platform to automatically fetch, parse, and cache job listings from external sources like We Work Remotely, LinkedIn, and other job boards.

## Current State Analysis

### ✅ Existing Schema Compatibility

Our current database schema is **80% ready** for RSS job feed integration:

**Existing Tables That Support Job Feeds:**
- `jobs` - Core job listings with basic fields
- `organizations` - Company information
- `skills` - Skills taxonomy with `job_skills` junction
- `industries` - Industry categorization
- `applications` - Job application tracking
- `users` - User profiles with skill matching
- `user_skills` - User skill proficiency levels

**Existing Features:**
- Geographic support with PostGIS
- Skills-based matching system
- Application workflow
- RLS policies and proper indexing

### ❌ Missing Components

**External Job Feed Infrastructure:**
- RSS feed management system
- External job post storage
- Feed parsing and caching
- Job deduplication logic
- External company profile handling

## RSS Feed Schema Design

### Core RSS Structure

```typescript
interface RSSFeed {
  title: string
  description: string
  link: string
  language: string
  lastBuildDate: string
  items: JobItem[]
}

interface JobItem {
  // RSS Standard Fields
  title: string
  description: string
  link: string
  guid: string
  pubDate: string
  category?: string[]
  
  // We Work Remotely Specific Fields
  company: {
    name: string
    logo?: string
    headquarters: string
    website?: string
  }
  
  job: {
    title: string
    location: string
    type: 'Full-Time' | 'Part-Time' | 'Contract' | 'Freelance'
    category: string
    tags: string[]
    compensation?: {
      amount?: string
      currency?: string
      period?: string
    }
    requirements: string[]
    responsibilities: string[]
    benefits?: string[]
    applicationUrl: string
  }
  
  // Metadata
  postedDate: string
  expiresDate?: string
  featured?: boolean
}
```

### Database Schema Extensions

#### 1. External Job Feeds Table

```sql
CREATE TABLE external_job_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL, -- "We Work Remotely"
  url VARCHAR(1000) NOT NULL,
  parser_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_fetched TIMESTAMPTZ,
  fetch_interval_minutes INTEGER DEFAULT 60,
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_external_job_feeds_active ON external_job_feeds(is_active) WHERE is_active = true;
CREATE INDEX idx_external_job_feeds_last_fetched ON external_job_feeds(last_fetched);
```

#### 2. External Jobs Table

```sql
CREATE TABLE external_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id UUID REFERENCES external_job_feeds(id) ON DELETE CASCADE,
  external_guid VARCHAR(255) NOT NULL, -- RSS guid
  title VARCHAR(500) NOT NULL,
  description TEXT,
  
  -- Company Information
  company_name VARCHAR(255),
  company_logo VARCHAR(1000),
  company_headquarters VARCHAR(255),
  company_website VARCHAR(1000),
  
  -- Job Details
  job_location VARCHAR(255),
  job_type VARCHAR(50),
  job_category VARCHAR(100),
  job_tags TEXT[],
  
  -- Compensation
  compensation_amount VARCHAR(100),
  compensation_currency VARCHAR(10),
  compensation_period VARCHAR(50),
  
  -- Job Content
  requirements TEXT[],
  responsibilities TEXT[],
  benefits TEXT[],
  
  -- URLs and Links
  application_url VARCHAR(1000),
  external_url VARCHAR(1000),
  
  -- Dates
  posted_date TIMESTAMPTZ,
  expires_date TIMESTAMPTZ,
  
  -- Status
  featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Cache Management
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_processed TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(feed_id, external_guid)
);

-- Indexes for Performance
CREATE INDEX idx_external_jobs_guid ON external_jobs(feed_id, external_guid);
CREATE INDEX idx_external_jobs_posted ON external_jobs(posted_date DESC);
CREATE INDEX idx_external_jobs_active ON external_jobs(is_active) WHERE is_active = true;
CREATE INDEX idx_external_jobs_company ON external_jobs(company_name);
CREATE INDEX idx_external_jobs_category ON external_jobs(job_category);
CREATE INDEX idx_external_jobs_location ON external_jobs(job_location);
CREATE INDEX idx_external_jobs_type ON external_jobs(job_type);
CREATE INDEX idx_external_jobs_featured ON external_jobs(featured) WHERE featured = true;
CREATE INDEX idx_external_jobs_expires ON external_jobs(expires_date) WHERE expires_date IS NOT NULL;
```

#### 3. Enhanced Jobs Table

```sql
-- Add external job support to existing jobs table
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS 
  external_source VARCHAR(100), -- 'weworkremotely', 'linkedin', etc.
  external_guid VARCHAR(255),
  external_url VARCHAR(1000),
  company_logo VARCHAR(1000),
  job_tags TEXT[],
  requirements TEXT[],
  responsibilities TEXT[],
  benefits TEXT[],
  featured BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ;

-- New indexes
CREATE INDEX idx_jobs_external_source ON jobs(external_source);
CREATE INDEX idx_jobs_featured ON jobs(featured) WHERE featured = true;
CREATE INDEX idx_jobs_expires ON jobs(expires_at) WHERE expires_at IS NOT NULL;
```

#### 4. External Job Skills Junction

```sql
CREATE TABLE external_job_skills (
  external_job_id UUID NOT NULL REFERENCES external_jobs(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  required_level SMALLINT CHECK (required_level BETWEEN 0 AND 5),
  confidence_score DECIMAL(3,2) DEFAULT 0.5, -- AI confidence in skill extraction
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (external_job_id, skill_id)
);

CREATE INDEX idx_external_job_skills_job ON external_job_skills(external_job_id);
CREATE INDEX idx_external_job_skills_skill ON external_job_skills(skill_id);
```

### RLS Policies

```sql
-- External job feeds (admin only)
ALTER TABLE external_job_feeds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "external_feeds_admin" ON external_job_feeds 
  FOR ALL TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM role_assignments ra 
    WHERE ra.user_id = auth.uid() 
    AND ra.role_id IN (SELECT id FROM roles WHERE name = 'admin')
  ));

-- External jobs (public read)
ALTER TABLE external_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "external_jobs_read" ON external_jobs 
  FOR SELECT TO anon, authenticated 
  USING (is_active = true);

-- External job skills (public read)
ALTER TABLE external_job_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "external_job_skills_read" ON external_job_skills 
  FOR SELECT TO anon, authenticated 
  USING (true);
```

## Implementation Plan

### Phase 1: Foundation (Week 1-2)

**Database Setup:**
- [ ] Create migration for external job feed tables
- [ ] Add external job fields to existing jobs table
- [ ] Set up RLS policies
- [ ] Create necessary indexes

**Basic RSS Parser:**
- [ ] Implement RSS XML parser
- [ ] Create We Work Remotely specific parser
- [ ] Add HTML content extraction
- [ ] Implement job data normalization

**Core Services:**
- [ ] `RSSFeedService` - Fetch and parse RSS feeds
- [ ] `JobCacheService` - Cache and manage external jobs
- [ ] `JobDeduplicationService` - Prevent duplicate jobs

### Phase 2: Integration (Week 3-4)

**tRPC API:**
- [ ] `getExternalJobs` - Query external job listings
- [ ] `getJobFeeds` - Manage RSS feed sources
- [ ] `refreshJobFeed` - Manual feed refresh
- [ ] `getJobRecommendations` - Skill-based job matching

**Frontend Components:**
- [ ] `ExternalJobCard` - Display external job listings
- [ ] `JobFeedManager` - Admin interface for feed management
- [ ] `JobSearchFilters` - Enhanced search with external jobs
- [ ] `JobRecommendations` - Personalized job suggestions

**Background Jobs:**
- [ ] RSS feed polling service
- [ ] Job expiration cleanup
- [ ] Skill extraction and matching
- [ ] Company profile enrichment

### Phase 3: Enhancement (Week 5-6)

**Advanced Features:**
- [ ] Multiple RSS feed support (LinkedIn, Indeed, etc.)
- [ ] AI-powered skill extraction from job descriptions
- [ ] Company profile auto-creation
- [ ] Job application tracking for external jobs
- [ ] Analytics and insights dashboard

**Performance Optimization:**
- [ ] Job search indexing
- [ ] Caching strategies
- [ ] Background processing optimization
- [ ] Database query optimization

**User Experience:**
- [ ] Job recommendation engine
- [ ] Personalized job alerts
- [ ] Application status tracking
- [ ] Company following system

### Phase 4: Scale & Analytics (Week 7-8)

**Monitoring & Analytics:**
- [ ] Feed health monitoring
- [ ] Job matching analytics
- [ ] User engagement metrics
- [ ] Performance dashboards

**Advanced Matching:**
- [ ] Machine learning job recommendations
- [ ] Skill gap analysis
- [ ] Salary benchmarking
- [ ] Market trend analysis

## Technical Architecture

### Service Layer

```typescript
// RSS Feed Service
class RSSFeedService {
  async fetchFeed(url: string): Promise<RSSFeed>
  async parseJobItem(item: any): Promise<JobItem>
  async validateJobData(job: JobItem): Promise<boolean>
}

// Job Cache Service
class JobCacheService {
  async cacheJobs(jobs: JobItem[]): Promise<void>
  async getJobs(filters: JobFilters): Promise<JobResponse>
  async refreshCache(): Promise<void>
  async clearExpiredJobs(): Promise<void>
}

// Job Matching Service
class JobMatchingService {
  async findMatchingJobs(userId: string): Promise<JobMatch[]>
  async extractSkills(jobDescription: string): Promise<Skill[]>
  async calculateMatchScore(job: JobItem, user: User): Promise<number>
}
```

### API Endpoints

```typescript
// tRPC Router
const jobFeedRouter = t.router({
  // External Jobs
  getExternalJobs: publicProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(20),
      category: z.string().optional(),
      location: z.string().optional(),
      type: z.string().optional(),
      featured: z.boolean().optional(),
      search: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      // Implementation
    }),

  // Job Recommendations
  getJobRecommendations: protectedProcedure
    .query(async ({ ctx }) => {
      // Implementation
    }),

  // Feed Management (Admin)
  getJobFeeds: protectedProcedure
    .query(async ({ ctx }) => {
      // Implementation
    }),

  refreshJobFeed: protectedProcedure
    .input(z.object({ feedId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Implementation
    }),
});
```

### Background Jobs

```typescript
// RSS Feed Polling
class RSSFeedPoller {
  async pollFeeds(): Promise<void> {
    const feeds = await this.getActiveFeeds();
    for (const feed of feeds) {
      await this.processFeed(feed);
    }
  }

  async processFeed(feed: ExternalJobFeed): Promise<void> {
    const rssData = await this.rssService.fetchFeed(feed.url);
    const jobs = await this.parseJobs(rssData.items);
    await this.cacheService.cacheJobs(jobs);
  }
}

// Job Cleanup
class JobCleanupService {
  async cleanupExpiredJobs(): Promise<void> {
    await this.db.query(`
      UPDATE external_jobs 
      SET is_active = false 
      WHERE expires_date < NOW() AND is_active = true
    `);
  }
}
```

## Configuration

### Environment Variables

```bash
# RSS Feed Configuration
RSS_FETCH_INTERVAL_MINUTES=60
RSS_MAX_CONCURRENT_FETCHES=5
RSS_REQUEST_TIMEOUT_MS=30000
RSS_USER_AGENT="Scaffald Job Bot/1.0"

# Cache Configuration
JOB_CACHE_TTL_HOURS=24
JOB_CACHE_MAX_ITEMS=10000
JOB_CACHE_CLEANUP_INTERVAL_HOURS=6

# AI/ML Configuration
SKILL_EXTRACTION_ENABLED=true
JOB_MATCHING_ENABLED=true
RECOMMENDATION_MODEL_VERSION="v1.0"
```

### Feed Configuration

```json
{
  "feeds": [
    {
      "name": "We Work Remotely",
      "url": "https://weworkremotely.com/remote-jobs.rss",
      "parser": "weworkremotely",
      "enabled": true,
      "fetchInterval": 60,
      "config": {
        "extractCompanyFromDescription": true,
        "parseCompensation": true,
        "extractSkills": true,
        "maxJobsPerFetch": 100
      }
    }
  ]
}
```

## Testing Strategy

### Unit Tests
- [ ] RSS parser functionality
- [ ] Job data normalization
- [ ] Skill extraction algorithms
- [ ] Job matching logic

### Integration Tests
- [ ] RSS feed fetching
- [ ] Database operations
- [ ] API endpoints
- [ ] Background job processing

### End-to-End Tests
- [ ] Complete job feed workflow
- [ ] User job search experience
- [ ] Job recommendation system
- [ ] Admin feed management

## Monitoring & Metrics

### Key Metrics
- **Feed Health**: Success rate, error count, fetch latency
- **Job Quality**: Parsing accuracy, skill extraction confidence
- **User Engagement**: Job views, applications, recommendations clicked
- **Performance**: API response times, database query performance

### Alerts
- RSS feed fetch failures
- High error rates
- Database performance issues
- Unusual job volume changes

## Security Considerations

### Data Protection
- Sanitize HTML content from RSS feeds
- Validate all external URLs
- Rate limit RSS feed requests
- Monitor for malicious content

### Access Control
- Admin-only feed management
- Public read access for job listings
- Secure API endpoints
- Proper RLS policies

## Future Enhancements

### Phase 5+ Roadmap
- [ ] Machine learning job recommendations
- [ ] Real-time job alerts
- [ ] Company intelligence integration
- [ ] Salary benchmarking
- [ ] Market trend analysis
- [ ] Integration with more job boards
- [ ] Mobile push notifications
- [ ] Advanced filtering and search

## Conclusion

The RSS job feed integration will significantly enhance Scaffald's value proposition by providing users with access to a comprehensive job market while maintaining the platform's focus on skilled trades and construction. The phased implementation approach ensures we can deliver value incrementally while building a robust, scalable system.

The existing database schema provides an excellent foundation, requiring only targeted extensions to support external job feeds. The implementation plan balances feature delivery with technical excellence, ensuring a smooth user experience and maintainable codebase.
