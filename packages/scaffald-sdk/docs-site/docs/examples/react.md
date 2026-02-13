---
title: React Examples
---

# React Examples

Examples of using the Scaffald SDK with React.

## Provider Setup

```typescript
// App.tsx
import { ScaffaldProvider } from '@scaffald/sdk/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ScaffaldProvider
        config={{
          apiKey: import.meta.env.VITE_SCAFFALD_API_KEY,
        }}
      >
        <JobBoard />
      </ScaffaldProvider>
    </QueryClientProvider>
  );
}
```

## Job Listing Component

```typescript
// JobsList.tsx
import { useJobs } from '@scaffald/sdk/react';

export function JobsList() {
  const { data, isLoading, error } = useJobs();

  if (isLoading) return <div>Loading jobs...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="jobs-list">
      {data?.data.map(job => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
```

## Application Form

```typescript
// ApplicationForm.tsx
import { useCreateApplication } from '@scaffald/sdk/react';
import { useState } from 'react';

export function ApplicationForm({ jobId }: { jobId: string }) {
  const createApplication = useCreateApplication();
  const [coverLetter, setCoverLetter] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createApplication.mutateAsync({
        job_id: jobId,
        profile_id: 'profile_123',
        cover_letter: coverLetter,
      });
      alert('Application submitted!');
    } catch (error) {
      alert('Failed to submit application');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={coverLetter}
        onChange={(e) => setCoverLetter(e.target.value)}
        placeholder="Cover letter..."
      />
      <button type="submit" disabled={createApplication.isPending}>
        {createApplication.isPending ? 'Submitting...' : 'Apply'}
      </button>
    </form>
  );
}
```

For more React examples, see the [React Integration Guide](/docs/guide/react-integration).
