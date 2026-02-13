# Security Policy

## Supported Versions

We actively support the following versions of the Scaffald SDK:

| Version | Supported          |
| ------- | ------------------ |
| 0.3.x   | :white_check_mark: |
| 0.2.x   | :x:                |
| 0.1.x   | :x:                |

We recommend always using the latest version to ensure you have the latest security fixes and features.

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability in the Scaffald SDK, please report it to us privately:

**Email:** security@scaffald.com

### What to Include

When reporting a vulnerability, please include:

- **Description**: A clear description of the vulnerability
- **Impact**: The potential impact of the vulnerability
- **Reproduction**: Step-by-step instructions to reproduce the issue
- **Version**: The version(s) of the SDK affected
- **Suggested Fix**: If you have a suggestion for how to fix it (optional)

### Response Timeline

We take security seriously and aim to respond to vulnerability reports quickly:

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Varies by severity (critical issues prioritized)

### Disclosure Policy

- We will coordinate disclosure with you
- We will credit you in the security advisory (unless you prefer to remain anonymous)
- We will publish a security advisory once a fix is available

## Security Best Practices

When using the Scaffald SDK:

1. **Keep Your API Keys Secret**
   - Never commit API keys to version control
   - Use environment variables for keys
   - Rotate keys regularly

2. **Use Environment Variables**
   ```bash
   SCAFFALD_API_KEY=scf_your_key_here
   ```

3. **Validate User Input**
   - Always validate and sanitize data before sending to the API
   - Don't trust client-side data

4. **Use HTTPS**
   - The SDK defaults to HTTPS for all API calls
   - Never use the SDK over HTTP in production

5. **Keep Dependencies Updated**
   ```bash
   npm update @scaffald/sdk
   ```

6. **Review Webhooks**
   - Always verify webhook signatures
   - Use the SDK's built-in verification utilities

## Security Features

The Scaffald SDK includes several security features:

- **HTTPS by Default**: All API calls use HTTPS
- **Webhook Signature Verification**: Built-in utilities for verifying webhook authenticity
- **Token Refresh**: Automatic OAuth token refresh
- **Type Safety**: TypeScript types prevent common errors
- **Input Validation**: Zod schemas validate all inputs

## Known Security Considerations

### API Keys in Client-Side Code

⚠️ **Never expose API keys in client-side JavaScript**

Use OAuth for client-side authentication:

```typescript
// ❌ DON'T: Expose API keys in browser
const client = new Scaffald({
  apiKey: 'scf_your_key', // Visible in browser!
});

// ✅ DO: Use OAuth for client-side
const client = new Scaffald({
  accessToken: userAccessToken,
});
```

### Server-Side Implementation

For server-side use, API keys are safe:

```typescript
// ✅ Server-side (Node.js)
const client = new Scaffald({
  apiKey: process.env.SCAFFALD_API_KEY,
});
```

## Third-Party Dependencies

We regularly audit our dependencies for vulnerabilities using:

- GitHub Dependabot
- npm audit
- Automated security scans

## Contact

For security-related questions or concerns:

- **Email:** security@scaffald.com
- **GitHub Security Advisories:** [View Advisories](https://github.com/Scaffald/sdk/security/advisories)

Thank you for helping keep Scaffald SDK secure!
