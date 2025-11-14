# API Load Testing

This directory contains load testing scripts for tRPC endpoints and API routes.

## Task 7: tRPC Router Load Testing and Concurrency Validation

### Setup

Load testing requires k6 or Artillery to be installed:

```bash
# Install k6
brew install k6  # macOS
# or visit https://k6.io/docs/getting-started/installation/

# Or install Artillery
npm install -g artillery
```

### Running Tests

```bash
# Run k6 load tests
k6 run trpc-routers.k6.js

# Run Artillery load tests
artillery run trpc-routers.artillery.yml
```

### Test Scenarios

Load tests validate:
- API endpoint concurrency (100, 500, 1000 concurrent users)
- Database query performance (< 500ms response time)
- Rate limiting enforcement
- Error handling under load
- Response time degradation patterns

### Targets

- **Response Time**: < 500ms for 95th percentile
- **Error Rate**: < 1% under load
- **Throughput**: Handle 1000+ concurrent requests
- **Rate Limiting**: Prevent abuse while allowing legitimate traffic

### CI/CD Integration

Load tests are run weekly via GitHub Actions scheduled workflow:
`.github/workflows/weekly-load-tests.yml`

### Notes

- Load tests should run against staging environment
- Monitor database connection pool usage
- Validate that rate limiting doesn't block legitimate users
- Test both authenticated and unauthenticated endpoints

