# Client Configuration

Configure the Scaffald SDK client for your application.

## Creating a Client

### `new Scaffald(config)`

Creates a new Scaffald API client.

```typescript
const client = new Scaffald({
  apiKey?: string
  accessToken?: string
  baseUrl?: string
  maxRetries?: number
  timeout?: number
  headers?: Record<string, string>
})
```

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `apiKey` | `string` | Yes* | - | API key for server-side authentication |
| `accessToken` | `string` | Yes* | - | OAuth access token for client-side auth |
| `baseUrl` | `string` | No | `https://api.scaffald.com` | Base API URL |
| `maxRetries` | `number` | No | `3` | Max retry attempts (0-10) |
| `timeout` | `number` | No | `30000` | Request timeout in ms (1000-300000) |
| `headers` | `object` | No | `{}` | Additional HTTP headers |

\* Either `apiKey` or `accessToken` is required

**Example:**

```typescript
const client = new Scaffald({
  apiKey: process.env.SCAFFALD_API_KEY,
  maxRetries: 5,
  timeout: 60000
})
```

## Authentication Methods

### Server-Side (API Key)

For Node.js applications and server-side usage:

```typescript
const client = new Scaffald({
  apiKey: process.env.SCAFFALD_API_KEY
})
```

### Client-Side (OAuth)

For browser applications and user authentication:

```typescript
const client = new Scaffald({
  accessToken: userAccessToken
})
```

See the [OAuth Guide](/docs/api/oauth) for complete OAuth flow documentation.

## Configuration Options

### Base URL

Override the default API endpoint:

```typescript
const client = new Scaffald({
  apiKey: 'your-key',
  baseUrl: 'https://api-staging.scaffald.com'
})
```

### Retry Configuration

Control automatic retry behavior:

```typescript
const client = new Scaffald({
  apiKey: 'your-key',
  maxRetries: 5  // Retry up to 5 times on network errors
})
```

### Timeout

Set request timeout in milliseconds:

```typescript
const client = new Scaffald({
  apiKey: 'your-key',
  timeout: 60000  // 60 seconds
})
```

### Custom Headers

Add custom HTTP headers to all requests:

```typescript
const client = new Scaffald({
  apiKey: 'your-key',
  headers: {
    'X-Custom-Header': 'value',
    'X-App-Version': '1.0.0'
  }
})
```

## Next Steps

- [Jobs API](/docs/api/jobs) - Search and retrieve job listings
- [Applications API](/docs/api/applications) - Submit and manage applications
- [OAuth Guide](/docs/api/oauth) - Implement user authentication
- [Rate Limiting](/docs/api/rate-limiting) - Understand API limits
