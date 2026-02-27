---
sidebar_position: 6
title: Examples
---

# Examples

Real-world usage examples for the Scaffald SDK.

## Node.js Examples

See [Node.js Examples](/docs/examples/node-js) for server-side usage.

## Browser Examples

See [Browser Examples](/docs/examples/browser) for client-side usage.

## React Examples

See [React Examples](/docs/examples/react) for React integration patterns.

## OAuth Flow

See [OAuth Flow Example](/docs/examples/oauth-flow) for complete authentication setup.

## Quick Examples

### List and Filter Jobs

```typescript
import Scaffald from '@scaffald/sdk';

const client = new Scaffald({ apiKey: process.env.SCAFFALD_API_KEY });

// List all jobs
const allJobs = await client.jobs.list();

// Filter by location
const remoteJobs = await client.jobs.list({
  filters: { is_remote: true },
});

// Search by title
const engineeringJobs = await client.jobs.search({
  query: 'Software Engineer',
});
```

### Create and Submit Application

```typescript
// Create a profile
const profile = await client.profiles.create({
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  phone: '+1234567890',
});

// Submit application
const application = await client.applications.create({
  job_id: 'job_123',
  profile_id: profile.id,
  cover_letter: 'I am very interested...',
});

// Upload resume
await client.applications.uploadResume({
  application_id: application.id,
  file: resumeFile,
});
```

### Manage Teams

```typescript
// Create a team
const team = await client.teams.create({
  name: 'Engineering Team',
  organization_id: 'org_123',
});

// Invite members
await client.teams.inviteMember({
  team_id: team.id,
  email: 'engineer@example.com',
  role: 'member',
});

// List team members
const members = await client.teams.listMembers({
  team_id: team.id,
});
```

### Track Analytics

```typescript
// Track job view
await client.analytics.track({
  event_type: 'job_view',
  job_id: 'job_123',
  user_id: 'user_456',
  metadata: {
    source: 'job_board',
    referrer: 'google',
  },
});

// Get analytics data
const stats = await client.analytics.getJobStats({
  job_id: 'job_123',
  date_range: 'last_30_days',
});
```
