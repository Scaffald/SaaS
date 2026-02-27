---
sidebar_position: 1
title: Introduction
---

# Scaffald SDK Documentation

Welcome to the **Scaffald SDK** documentation! This is the official JavaScript/TypeScript SDK for the Scaffald API.

## What is Scaffald SDK?

The Scaffald SDK is a comprehensive client library that makes it easy to interact with the Scaffald API. It provides:

- ✅ **Type-Safe API Client**: Full TypeScript support with generated types
- ✅ **React Integration**: Pre-built React hooks powered by TanStack Query  
- ✅ **OAuth 2.0 Support**: Built-in support for OAuth authentication flows
- ✅ **34 API Resources**: Complete coverage of the Scaffald API
- ✅ **731+ Tests**: Comprehensive test coverage for reliability
- ✅ **Developer-Friendly**: Zero configuration, works out of the box

## Quick Start

Install the SDK via npm:

```bash
npm install @scaffald/sdk
```

### Basic Usage

```typescript
import Scaffald from '@scaffald/sdk';

const client = new Scaffald({
  apiKey: 'your-api-key',
  baseURL: 'https://api.scaffald.com',
});

// List jobs
const jobs = await client.jobs.list();
console.log(jobs.data);
```

### React Integration

```typescript
import { useJobs } from '@scaffald/sdk/react';

function JobsList() {
  const { data, isLoading, error } = useJobs();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data.data.map(job => (
        <div key={job.id}>{job.title}</div>
      ))}
    </div>
  );
}
```

## What's Next?

- 📦 [Installation](/docs/guide/installation) - Detailed setup instructions
- 🚀 [Quick Start](/docs/guide/quick-start) - Get up and running in 5 minutes
- 🔐 [Authentication](/docs/guide/authentication) - Learn about API keys and OAuth
- 📚 [API Reference](/docs/api/overview) - Complete API documentation
- 💡 [Examples](/docs/examples) - Real-world usage examples

## Getting Help

- **GitHub Issues**: [Report bugs or request features](https://github.com/Scaffald/sdk/issues)
- **GitHub Discussions**: [Ask questions and share ideas](https://github.com/Scaffald/sdk/discussions)
- **npm Package**: [@scaffald/sdk](https://www.npmjs.com/package/@scaffald/sdk)
