---
sidebar_position: 4
title: Error Handling
---

# Error Handling

Learn how to handle errors gracefully in the Scaffald SDK.

## Error Types

The SDK throws specific error types for different scenarios:

```typescript
import { ScaffaldError, NetworkError, ValidationError } from '@scaffald/sdk';

try {
  const job = await client.jobs.get({ id: 'invalid_id' });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Invalid input:', error.message);
    console.error('Validation errors:', error.errors);
  } else if (error instanceof NetworkError) {
    console.error('Network error:', error.message);
  } else if (error instanceof ScaffaldError) {
    console.error('API error:', error.message);
    console.error('Status code:', error.statusCode);
  }
}
```

## Common Error Scenarios

### 401 Unauthorized

```typescript
// Invalid or expired API key
try {
  await client.jobs.list();
} catch (error) {
  if (error.statusCode === 401) {
    // Redirect to login or refresh API key
  }
}
```

### 404 Not Found

```typescript
try {
  await client.jobs.get({ id: 'non_existent_id' });
} catch (error) {
  if (error.statusCode === 404) {
    console.error('Job not found');
  }
}
```

### 422 Validation Error

```typescript
try {
  await client.applications.create({
    job_id: 'job_123',
    // Missing required profile_id
  });
} catch (error) {
  if (error instanceof ValidationError) {
    error.errors.forEach(err => {
      console.error(`${err.field}: ${err.message}`);
    });
  }
}
```

## React Error Handling

React hooks automatically handle errors and provide error states:

```typescript
import { useJobs } from '@scaffald/sdk/react';

function JobsList() {
  const { data, isLoading, error } = useJobs();

  if (error) {
    return (
      <div className="error">
        <h3>Failed to load jobs</h3>
        <p>{error.message}</p>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  // ... rest of component
}
```

## Retry Logic

Implement custom retry logic for transient errors:

```typescript
async function fetchWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1 || error.statusCode < 500) {
        throw error;
      }
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

// Usage
const jobs = await fetchWithRetry(() => client.jobs.list());
```
