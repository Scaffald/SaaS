# Scaffald SDK Examples

This directory contains working examples demonstrating how to use the Scaffald SDK in different environments.

## Examples

### 1. [Node.js Server](./node-js/)

Server-side usage with API key authentication.

**Features:**
- API key authentication
- Listing and filtering jobs
- Webhook signature verification
- Rate limit monitoring

**Run:**
```bash
cd node-js
export SCAFFALD_API_KEY=sk_test_your_key_here
node index.js
```

### 2. [Browser Application](./browser/)

Vanilla JavaScript browser application.

**Features:**
- OAuth 2.0 flow with PKCE
- Jobs listing and search
- Application submission

**Run:**
```bash
cd browser
# Open index.html in your browser
# Or use a local server:
python -m http.server 8000
# Visit http://localhost:8000
```

### 3. [React Application](./react/)

React application with hooks and TanStack Query.

**Features:**
- ScaffaldProvider setup
- Query hooks (useJobs, useJob, etc.)
- Mutation hooks (useCreateApplication, etc.)
- Automatic cache management
- Loading and error states

**Run:**
```bash
cd react
npm install
npm start
```

### 4. [OAuth 2.0 Flow](./oauth-flow.ts)

Complete OAuth 2.0 authorization code flow with PKCE.

**Features:**
- Authorization URL generation
- PKCE code challenge creation
- Token exchange
- Token refresh
- Token revocation
- React hook example

## Getting an API Key

1. Sign up at https://app.scaffald.com
2. Navigate to Settings → API Keys
3. Click "Create API Key"
4. Copy and save your key securely

**⚠️ Never expose API keys in client-side code!**

## Environment Variables

Create a `.env` file in the example directory:

```bash
# Node.js example
SCAFFALD_API_KEY=sk_test_your_key_here

# OAuth examples
SCAFFALD_CLIENT_ID=your_client_id
SCAFFALD_CLIENT_SECRET=your_client_secret  # Only for confidential clients
SCAFFALD_REDIRECT_URI=http://localhost:3000/callback

# Webhooks
SCAFFALD_WEBHOOK_SECRET=whsec_your_secret
```

## Common Patterns

### Error Handling

```typescript
import { ScaffaldError, RateLimitError, NotFoundError } from '@scaffald/sdk'

try {
  const job = await client.jobs.retrieve('job_123')
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter} seconds`)
  } else if (error instanceof NotFoundError) {
    console.log('Job not found')
  } else if (error instanceof ScaffaldError) {
    console.log(`API error: ${error.message}`)
  }
}
```

### Pagination

```typescript
// Manual pagination
let offset = 0
const limit = 20
let hasMore = true

while (hasMore) {
  const jobs = await client.jobs.list({ limit, offset })

  // Process jobs
  jobs.data.forEach(job => console.log(job.title))

  offset += limit
  hasMore = jobs.data.length === limit
}

// Or use total count
const { data, total } = await client.jobs.list({ limit: 100 })
console.log(`Showing ${data.length} of ${total} jobs`)
```

### Rate Limit Monitoring

```typescript
// Check current rate limit
const info = client.getRateLimitInfo()
console.log(`${info.remaining}/${info.limit} requests remaining`)

// Subscribe to updates
client.onRateLimitUpdate((info) => {
  if (info.remaining < 10) {
    console.warn('Rate limit approaching!')
  }
})

// Check if approaching limit
if (client.isRateLimitApproaching()) {
  // Implement backoff strategy
  await sleep(1000)
}
```

## Support

- 📖 [SDK Documentation](../README.md)
- 📧 [Email Support](mailto:dev@scaffald.com)
- 💬 [Discord Community](https://discord.gg/scaffald)
- 🐛 [Report Issues](https://github.com/Unicorn/UNI-Construct/issues)
