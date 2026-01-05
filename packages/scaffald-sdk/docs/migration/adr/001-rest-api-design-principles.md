# ADR-001: REST API Design Principles

**Status**: Accepted
**Date**: 2025-12-31
**Decision Makers**: Backend Team, API Team
**Consulted**: Frontend Team, Product Team

---

## Context

We are migrating from tRPC (RPC-style API) to RESTful API for the UNI-Construct platform. We need to establish clear design principles to ensure consistency across all ~400 endpoints being created.

**Current State**:
- tRPC uses procedure-based naming (e.g., `jobs.list`, `applications.create`)
- No standard HTTP semantics
- Custom client required
- Limited caching opportunities

**Desired State**:
- RESTful resource-based API
- Standard HTTP methods and status codes
- Framework-agnostic (works with any HTTP client)
- Leverage HTTP caching (ETags, Cache-Control)

---

## Decision

We will adopt the following REST API design principles for all endpoints in the migration:

### 1. Resource-Oriented URLs

**Principle**: URLs represent resources (nouns), not actions (verbs)

**Examples**:
```
✅ GOOD:
GET /v1/jobs
GET /v1/jobs/:id
POST /v1/applications
GET /v1/profile/employment

❌ BAD:
POST /v1/getJobs
POST /v1/createApplication
GET /v1/fetchEmployment
```

**Nested Resources**:
- Use nesting for relationships: `/v1/jobs/:jobId/applications`
- Limit nesting to 2 levels for clarity
- Use query params for filters, not nested routes

### 2. HTTP Methods (REST Verbs)

**Standard Mapping**:

| Method | Purpose | Example | Response |
|--------|---------|---------|----------|
| GET | Retrieve resource(s) | `GET /v1/jobs` | 200 + data |
| POST | Create resource | `POST /v1/applications` | 201 + created resource |
| PUT | Replace entire resource | `PUT /v1/profile/:id` | 200 + updated resource |
| PATCH | Partially update resource | `PATCH /v1/profile/:id` | 200 + updated resource |
| DELETE | Remove resource | `DELETE /v1/applications/:id` | 204 (no content) |

**Idempotency**:
- GET, PUT, DELETE are idempotent
- POST is NOT idempotent
- Use idempotency keys for critical POST operations (payments)

### 3. HTTP Status Codes

**Standard Status Codes**:

**Success (2xx)**:
- `200 OK`: Successful GET, PUT, PATCH
- `201 Created`: Successful POST (resource created)
- `204 No Content`: Successful DELETE

**Client Errors (4xx)**:
- `400 Bad Request`: Invalid request body/params
- `401 Unauthorized`: Missing or invalid auth token
- `403 Forbidden`: Authenticated but not authorized
- `404 Not Found`: Resource doesn't exist
- `409 Conflict`: Duplicate resource (e.g., unique constraint)
- `422 Unprocessable Entity`: Validation errors
- `429 Too Many Requests`: Rate limit exceeded

**Server Errors (5xx)**:
- `500 Internal Server Error`: Unexpected server error
- `503 Service Unavailable`: Temporary downtime

**Never use**:
- `200 OK` with error in body (anti-pattern)
- Custom status codes outside standard range

### 4. Response Format

**Success Response Structure**:
```json
{
  "data": {
    "id": "123",
    "title": "Software Engineer",
    // ... resource fields
  },
  "pagination": {  // Optional, for lists
    "limit": 20,
    "offset": 0,
    "total": 100
  }
}
```

**Error Response Structure**:
```json
{
  "error": "ValidationError",
  "message": "Invalid email format",
  "details": [  // Optional, for validation errors
    {
      "field": "email",
      "message": "Must be valid email address"
    }
  ],
  "code": "VALIDATION_ERROR",  // Optional machine-readable code
  "requestId": "req_123abc"    // For debugging
}
```

**Consistency**:
- Always wrap data in `{ data: ... }` for single resources
- Always include `pagination` metadata for lists
- Always use `error` + `message` for errors

### 5. Versioning

**URL Versioning**:
```
/v1/jobs
/v2/jobs  // Future version
```

**Why URL versioning**:
- Simple and explicit
- Easy to route in CDN/load balancer
- Clear which version client is using

**Version Strategy**:
- Start with `/v1/`
- Increment version for breaking changes only
- Maintain old versions for 6 months minimum
- Deprecation warnings in response headers

### 6. Filtering, Sorting, Pagination

**Query Parameters for Lists**:

**Filtering**:
```
GET /v1/jobs?status=published&location=remote&employmentType=full-time
```

**Sorting**:
```
GET /v1/jobs?sortBy=createdAt&order=desc
```

**Pagination (Offset-based)**:
```
GET /v1/jobs?limit=20&offset=40
```

**Pagination (Cursor-based)** (for real-time feeds):
```
GET /v1/notifications?limit=20&cursor=abc123
```

**Field Selection** (optional optimization):
```
GET /v1/jobs?fields=id,title,company
```

### 7. Authentication

**JWT Bearer Tokens**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**API Keys** (for third-party integrations):
```
Authorization: Bearer sk_live_abc123...
```

**No Auth Required**:
- Public endpoints (job listings, public profiles)
- Mark clearly in OpenAPI spec

### 8. Rate Limiting

**Rate Limit Headers** (standard):
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

**Status Code**: `429 Too Many Requests`

**Tiers**:
- Free: 100 requests/minute
- Pro: 1000 requests/minute
- Enterprise: 10000 requests/minute

### 9. Content Negotiation

**Accept Header**:
```
Accept: application/json
```

**Content-Type**:
```
Content-Type: application/json; charset=utf-8
```

**Default**: JSON only (no XML, no other formats)

### 10. CORS Headers

**Allow CORS** for web clients:
```
Access-Control-Allow-Origin: https://app.scaffald.com
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Max-Age: 86400
```

**TODO**: Restrict origins in production (currently '*')

### 11. OpenAPI Documentation

**All endpoints MUST**:
- Have OpenAPI 3.1 specification
- Include request/response schemas (Zod)
- Include example requests/responses
- Document error responses
- Specify authentication requirements

**Auto-generate**:
- Use `@hono/zod-openapi` for automatic generation
- Serve Swagger UI at `/` endpoint
- Serve OpenAPI JSON at `/openapi.json`

### 12. Caching

**Cache-Control Headers** (for GET requests):

**Public, cacheable**:
```
Cache-Control: public, max-age=300  // 5 minutes
```

**Private, user-specific**:
```
Cache-Control: private, max-age=60  // 1 minute
```

**No cache** (sensitive data):
```
Cache-Control: no-store
```

**ETags** (for conditional requests):
```
ETag: "abc123hash"

// Client sends:
If-None-Match: "abc123hash"

// Server responds:
304 Not Modified (if unchanged)
```

---

## Rationale

### Why REST over tRPC?

**Advantages of REST**:
1. **Standard HTTP Semantics**: Leverage existing HTTP infrastructure (caching, CDNs, load balancers)
2. **Framework Agnostic**: Any HTTP client can consume the API
3. **Better Caching**: ETags, Cache-Control reduce server load
4. **Smaller Bundle Size**: No tRPC client needed (~50KB savings)
5. **OpenAPI Ecosystem**: Auto-generate clients, docs, tests
6. **Discoverability**: REST APIs are self-documenting

**Disadvantages** (mitigated):
- **Type Safety**: Mitigated by auto-generating TypeScript types from OpenAPI
- **N+1 Queries**: Mitigated by careful endpoint design and data loaders
- **Batching**: Mitigated by GraphQL-style field selection (optional)

### Alternative Considered: GraphQL

**Why not GraphQL?**
- Adds complexity (schema, resolvers, data loaders)
- Harder to cache (POST requests, query variations)
- Over-fetching/under-fetching less of a concern for our use case
- Team not familiar with GraphQL best practices

**Future consideration**: GraphQL layer on top of REST for power users

---

## Consequences

### Positive

- **Consistency**: All endpoints follow same patterns
- **Discoverability**: Developers can guess endpoint URLs
- **Caching**: Reduced server load, faster responses
- **Documentation**: OpenAPI auto-generates docs
- **Type Safety**: Auto-generated TypeScript types

### Negative

- **Migration Effort**: ~400 endpoints to create following these principles
- **Learning Curve**: Team must learn REST best practices
- **Endpoint Proliferation**: More endpoints than tRPC procedures

### Neutral

- **Testing**: Need comprehensive tests for each endpoint (already planned)
- **Monitoring**: Need to track REST-specific metrics (latency, cache hit rate)

---

## Compliance & Validation

**Every PR MUST**:
- [ ] Follow URL naming conventions (nouns, not verbs)
- [ ] Use correct HTTP methods
- [ ] Return correct status codes
- [ ] Include OpenAPI documentation
- [ ] Have consistent response format
- [ ] Include rate limiting headers
- [ ] Pass linter checks (Biome)
- [ ] Have 100% test coverage

**PR Review Checklist**:
- [ ] Endpoints follow REST principles
- [ ] OpenAPI spec validates
- [ ] Error responses consistent
- [ ] Caching headers appropriate

---

## References

- [RESTful API Design Guidelines (Microsoft)](https://github.com/microsoft/api-guidelines)
- [HTTP Status Codes (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [OpenAPI Specification 3.1](https://spec.openapis.org/oas/v3.1.0)
- [HTTP Caching (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)

---

## Amendments

*None yet*

---

**Document Owner**: API Lead
**Review Cadence**: Quarterly
**Last Reviewed**: 2025-12-31
**Next Review**: 2026-03-31
