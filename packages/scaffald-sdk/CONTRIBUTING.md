# Contributing to Scaffald SDK

Thank you for your interest in contributing to the Scaffald SDK! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js 18 or higher
- pnpm (recommended) or npm
- Git

### Getting Started

1. **Clone the repository**

```bash
git clone https://github.com/Unicorn/UNI-Construct.git
cd UNI-Construct/packages/scaffald-sdk
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Run tests**

```bash
pnpm test
```

4. **Build the SDK**

```bash
pnpm build
```

## Project Structure

```
packages/scaffald-sdk/
├── src/
│   ├── client.ts              # Main Scaffald client class
│   ├── config.ts              # Configuration types
│   ├── index.ts               # Main exports
│   │
│   ├── auth/
│   │   ├── oauth.ts           # OAuth client
│   │   └── pkce.ts            # PKCE utilities
│   │
│   ├── resources/
│   │   ├── base.ts            # Base resource class
│   │   ├── jobs.ts            # Jobs resource
│   │   ├── applications.ts    # Applications resource
│   │   └── profiles.ts        # Profiles resource
│   │
│   ├── http/
│   │   ├── client.ts          # HTTP client
│   │   ├── retry.ts           # Retry middleware
│   │   └── errors.ts          # Error classes
│   │
│   ├── webhooks/
│   │   └── verify.ts          # Webhook verification
│   │
│   ├── react/
│   │   ├── provider.tsx       # React provider
│   │   ├── hooks.ts           # React hooks
│   │   └── index.ts           # React exports
│   │
│   └── __tests__/
│       ├── jobs.test.ts
│       ├── applications.test.ts
│       ├── oauth.test.ts
│       ├── react.test.tsx
│       └── mocks/
│           └── server.ts      # MSW server setup
│
├── examples/                   # Example applications
├── dist/                       # Build output (gitignored)
├── README.md                   # Main documentation
├── CHANGELOG.md                # Version history
└── package.json
```

## Development Workflow

### Making Changes

1. **Create a new branch**

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

2. **Make your changes**

- Write clear, concise code
- Follow existing code style
- Add tests for new features
- Update documentation

3. **Run quality checks**

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Run tests
pnpm test

# Build
pnpm build
```

4. **Commit your changes**

Follow conventional commit format:

```bash
git commit -m "feat: add new feature"
git commit -m "fix: resolve bug"
git commit -m "docs: update README"
git commit -m "test: add tests for X"
```

Commit types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

5. **Push and create a pull request**

```bash
git push origin feature/your-feature-name
```

Then create a pull request on GitHub.

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage
```

### Writing Tests

- Place tests in `src/__tests__/`
- Use descriptive test names
- Test both success and error cases
- Mock external dependencies with MSW

Example:

```typescript
import { describe, it, expect } from 'vitest'
import { server } from './mocks/server'
import Scaffald from '../index'

describe('Jobs Resource', () => {
  it('should list jobs', async () => {
    const client = new Scaffald({ apiKey: 'test_key' })
    const jobs = await client.jobs.list({ limit: 10 })

    expect(jobs.data).toHaveLength(10)
    expect(jobs.total).toBeGreaterThan(0)
  })
})
```

## Code Style

- **TypeScript**: Use TypeScript for all source code
- **Formatting**: Biome handles formatting automatically
- **Naming**: Use camelCase for variables/functions, PascalCase for classes/types
- **Exports**: Use named exports except for the default client export
- **Comments**: Use JSDoc for public APIs

```typescript
/**
 * Retrieves a job by ID
 *
 * @param id - The job ID
 * @returns The job object
 * @throws {NotFoundError} If the job doesn't exist
 *
 * @example
 * ```typescript
 * const job = await client.jobs.retrieve('job_123')
 * console.log(job.title)
 * ```
 */
async retrieve(id: string): Promise<Job> {
  return this.get<Job>(`/v1/jobs/${id}`)
}
```

## Adding New Features

### Adding a New Resource

1. Create the resource file in `src/resources/`
2. Extend the `Resource` base class
3. Add methods for each endpoint
4. Export types
5. Add the resource to the main `Scaffald` class
6. Write tests
7. Update documentation

Example:

```typescript
// src/resources/companies.ts
import { Resource } from './base.js'

export interface Company {
  id: string
  name: string
  // ...
}

export class Companies extends Resource {
  async list(): Promise<Company[]> {
    return this.get<Company[]>('/v1/companies')
  }

  async retrieve(id: string): Promise<Company> {
    return this.get<Company>(`/v1/companies/${id}`)
  }
}
```

```typescript
// src/client.ts
import { Companies } from './resources/companies.js'

export class Scaffald {
  public readonly companies: Companies

  constructor(config: ScaffaldConfig) {
    // ...
    this.companies = new Companies(this.http)
  }
}
```

### Adding React Hooks

1. Add the hook to `src/react/hooks.ts`
2. Export from `src/react/index.ts`
3. Write tests in `src/__tests__/react.test.tsx`
4. Document in README

```typescript
// src/react/hooks.ts
export function useCompanies() {
  const client = useScaffald()

  return useQuery({
    queryKey: ['companies'],
    queryFn: () => client.companies.list(),
  })
}
```

## Documentation

- **README.md**: Keep the main README up to date
- **CHANGELOG.md**: Document all changes
- **JSDoc**: Add JSDoc comments to all public APIs
- **Examples**: Add examples for new features

## Release Process

Releases are automated via GitHub Actions. To publish a new version:

1. **Update version in package.json**

```bash
# For patch (0.1.0 -> 0.1.1)
npm version patch

# For minor (0.1.0 -> 0.2.0)
npm version minor

# For major (0.1.0 -> 1.0.0)
npm version major
```

2. **Update CHANGELOG.md**

Add a new section for the version with all changes.

3. **Commit and tag**

```bash
git add package.json CHANGELOG.md
git commit -m "chore: release v0.2.0"
git tag sdk-v0.2.0
git push origin main --tags
```

4. **GitHub Actions will:**
   - Run tests
   - Build the package
   - Publish to npm
   - Create a GitHub release

## Getting Help

- 📧 Email: dev@scaffald.com
- 💬 Discord: https://discord.gg/scaffald
- 🐛 Issues: https://github.com/Unicorn/UNI-Construct/issues

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what's best for the community
- Show empathy towards other community members

## License

By contributing to Scaffald SDK, you agree that your contributions will be licensed under the MIT License.
