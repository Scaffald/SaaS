---
sidebar_position: 5
title: Pagination
---

# Pagination

Learn how to work with paginated API responses in the Scaffald SDK.

## Basic Pagination

Most list endpoints support pagination using `page` and `per_page` parameters:

```typescript
// Get first page of jobs
const page1 = await client.jobs.list({
  page: 1,
  per_page: 20,
});

console.log(page1.data); // Array of jobs
console.log(page1.meta); // Pagination metadata
```

## Pagination Metadata

The SDK returns pagination metadata with list responses:

```typescript
const response = await client.jobs.list({ per_page: 10 });

console.log(response.meta);
// {
//   page: 1,
//   per_page: 10,
//   total: 156,
//   total_pages: 16,
//   has_next: true,
//   has_prev: false
// }
```

## Iterating Through Pages

```typescript
let page = 1;
let hasMore = true;

while (hasMore) {
  const response = await client.jobs.list({ page, per_page: 50 });
  
  // Process jobs
  response.data.forEach(job => {
    console.log(job.title);
  });
  
  hasMore = response.meta.has_next;
  page++;
}
```

## React Pagination

Use the built-in pagination hooks:

```typescript
import { useJobs } from '@scaffald/sdk/react';
import { useState } from 'react';

function PaginatedJobsList() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useJobs({ page, per_page: 20 });

  return (
    <div>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div className="jobs">
            {data.data.map(job => (
              <div key={job.id}>{job.title}</div>
            ))}
          </div>
          
          <div className="pagination">
            <button
              disabled={!data.meta.has_prev}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </button>
            
            <span>
              Page {data.meta.page} of {data.meta.total_pages}
            </span>
            
            <button
              disabled={!data.meta.has_next}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
```

## Infinite Scroll

Implement infinite scroll with React Query:

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';
import { useScaffaldClient } from '@scaffald/sdk/react';

function InfiniteJobsList() {
  const client = useScaffaldClient();
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['jobs', 'infinite'],
    queryFn: ({ pageParam = 1 }) =>
      client.jobs.list({ page: pageParam, per_page: 20 }),
    getNextPageParam: (lastPage) =>
      lastPage.meta.has_next ? lastPage.meta.page + 1 : undefined,
  });

  return (
    <div>
      {data?.pages.map(page =>
        page.data.map(job => <div key={job.id}>{job.title}</div>)
      )}
      
      {hasNextPage && (
        <button onClick={() => fetchNextPage()}>
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```
