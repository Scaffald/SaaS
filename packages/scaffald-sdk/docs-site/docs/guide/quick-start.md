---
sidebar_position: 2
title: Quick Start
---

# Quick Start Guide

Get up and running with the Scaffald SDK in 5 minutes!

## Installation

```bash
npm install @scaffald/sdk
```

## Basic Setup

### 1. Get an API Key

First, obtain an API key from the Scaffald dashboard:

1. Log in to [Scaffald](https://scaffald.com)
2. Navigate to Settings → API Keys
3. Create a new API key
4. Copy the key (you won't be able to see it again!)

### 2. Initialize the Client

```typescript
import Scaffald from '@scaffald/sdk';

const client = new Scaffald({
  apiKey: 'scf_your_api_key_here',
  baseURL: 'https://api.scaffald.com', // Optional, this is the default
});
```

### 3. Make Your First API Call

```typescript
// List all jobs
const jobs = await client.jobs.list();
console.log(jobs.data);

// Get a specific job
const job = await client.jobs.get({ id: 'job_123' });
console.log(job.title, job.description);

// Create a job application
const application = await client.applications.create({
  job_id: 'job_123',
  profile_id: 'profile_456',
  cover_letter: 'I am very interested in this position...',
});
```

## React Quick Start

### 1. Set Up the Provider

Wrap your app with the Scaffald provider:

```typescript
import { ScaffaldProvider } from '@scaffald/sdk/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ScaffaldProvider
        config={{
          apiKey: 'scf_your_api_key_here',
          baseURL: 'https://api.scaffald.com',
        }}
      >
        <YourApp />
      </ScaffaldProvider>
    </QueryClientProvider>
  );
}
```

### 2. Use React Hooks

```typescript
import { useJobs, useCreateApplication } from '@scaffald/sdk/react';

function JobsList() {
  const { data: jobs, isLoading, error } = useJobs();
  const createApplication = useCreateApplication();

  if (isLoading) return <div>Loading jobs...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const handleApply = async (jobId: string) => {
    await createApplication.mutateAsync({
      job_id: jobId,
      profile_id: 'profile_456',
    });
  };

  return (
    <div>
      {jobs?.data.map(job => (
        <div key={job.id}>
          <h3>{job.title}</h3>
          <p>{job.company_name}</p>
          <button onClick={() => handleApply(job.id)}>
            Apply Now
          </button>
        </div>
      ))}
    </div>
  );
}
```

## Next Steps

- Explore the [API Reference](/docs/api/overview) for all available resources
- Learn about [Authentication](/docs/guide/authentication) methods
- Check out [Examples](/docs/examples) for common use cases
- Read about [React Integration](/docs/guide/react-integration) for advanced patterns
