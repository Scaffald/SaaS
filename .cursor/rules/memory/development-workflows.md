# Development Workflows

## Daily Development Workflow

### 1. Starting Development
```bash
# Check git status and recent changes
git status
git log --oneline -5

# Pull latest changes
git pull origin main

# Install any new dependencies
yarn install

# Start development servers (if not already running)
yarn supa start    # Start Supabase (if needed)
yarn dev          # Start Expo development server
```

### 2. Making Changes
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make your changes...

# Run quality checks before committing
yarn check        # Format, lint, type check
yarn build        # Verify builds work

# Check for issues
yarn check-deps   # Dependency consistency
yarn lint-sherif  # Monorepo linting
```

### 3. Committing Changes
```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add user profile management

- Add profile overview screen with left/right layout
- Implement profile update form with validation
- Add profile image upload functionality
- Update navigation to include profile routes"

# Push to remote
git push origin feature/your-feature-name
```

## Feature Development Workflow

### 1. Planning Phase
- Review existing patterns in `.cursor/rules/memory/common-patterns.md`
- Check architecture decisions in `.cursor/rules/memory/architecture-decisions.md`
- Plan component structure following route naming convention

### 2. Implementation Phase
```bash
# Create feature structure
mkdir -p packages/core/features/new-feature
mkdir -p packages/core/features/new-feature/components
mkdir -p packages/core/features/new-feature/config

# Create route files following convention
touch packages/core/features/new-feature/new-feature-overview-left.tsx
touch packages/core/features/new-feature/new-feature-overview-right.tsx
touch packages/core/features/new-feature/new-feature-overview-screen.tsx
```

### 3. Component Development
```typescript
// Follow established patterns
// 1. Use Tamagui components
// 2. Implement proper TypeScript types
// 3. Add JSDoc documentation
// 4. Use direct imports (avoid barrel files)
// 5. Follow cross-platform patterns
```

### 4. Testing Phase
```bash
# Test on multiple platforms
yarn web         # Test web version
yarn ios         # Test iOS (if available)
yarn android     # Test Android (if available)

# Test API endpoints
# Use browser extensions like REST Client or Thunder Client
# Test with curl commands
```

## Code Review Workflow

### 1. Pre-Review Checklist
- [ ] All quality checks pass (`yarn check && yarn build`)
- [ ] No TypeScript errors
- [ ] Components follow established patterns
- [ ] Direct imports used (no barrel files)
- [ ] Cross-platform compatibility considered
- [ ] API endpoints tested
- [ ] Documentation updated if needed

### 2. Creating Pull Request
```bash
# Push feature branch
git push origin feature/your-feature-name

# Create PR with template:
# Title: Brief description of changes
# Description:
# - What was changed
# - Why it was changed
# - How to test
# - Screenshots (if UI changes)
```

### 3. Review Process
- Code review by team members
- Automated CI/CD checks must pass
- Manual testing on different platforms
- Address feedback and update PR

## Release Workflow

### 1. Pre-Release Preparation
```bash
# Ensure main branch is up to date
git checkout main
git pull origin main

# Run full test suite
yarn check && yarn build
yarn check-deps
yarn lint-sherif
yarn check-circular-deps

# Update version numbers if needed
# Update CHANGELOG.md
```

### 2. Deployment Process
```bash
# Web deployment (Expo Web)
yarn web:build
yarn deploy:web

# Mobile deployment (EAS Build)
yarn deploy:preview    # For preview builds
yarn deploy:prod      # For production builds
```

### 3. Post-Release
- Monitor for issues
- Update documentation
- Communicate changes to team
- Plan next iteration

## Database Workflow

### 1. Schema Changes
```bash
# Create new migration
yarn supa migration:new add_new_table

# Edit migration file in packages/supabase/migrations/
# Apply migration
yarn supa migration:up

# Generate new types
yarn supa generate
```

### 2. RLS Policy Updates
```sql
-- Add RLS policies in migration
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);
```

### 3. Testing Database Changes
```bash
# Reset database for testing
yarn supa reset

# Test with seed data
yarn supa seed

# Verify policies work correctly
# Test API endpoints with different user roles
```

## API Development Workflow

### 1. tRPC Procedure Development
```typescript
// packages/supabase/functions/trpc/index.ts
export const appRouter = router({
  profile: router({
    get: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input, ctx }) => {
        // Implementation
      }),
    
    update: protectedProcedure
      .input(profileUpdateSchema)
      .mutation(async ({ input, ctx }) => {
        // Implementation
      })
  })
})
```

### 2. Client-Side Integration
```typescript
// packages/core/utils/api.ts
import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '@app/supabase/functions/trpc'

export const api = createTRPCReact<AppRouter>()

// Usage in components
const { data: profile } = api.profile.get.useQuery({ id: '123' })
```

### 3. API Testing
```bash
# Test with curl
curl -X POST http://localhost:54321/functions/v1/trpc/profile.get \
  -H "Content-Type: application/json" \
  -d '{"input": {"id": "123"}}'

# Use browser extensions for interactive testing
# Thunder Client, REST Client, or Postman
```

## CI/CD Workflow

### 1. GitHub Actions Triggers
- **Pull Request**: All quality checks run
- **Push to main**: Full build and deployment
- **Manual trigger**: For specific deployments

### 2. Quality Gates
```yaml
# .github/workflows/integrity.yaml
jobs:
  code-quality:
    - Format, lint, type check (yarn check)
    - Build verification (yarn build)
  
  monorepo-integrity:
    - Dependency checks (yarn check-deps)
    - Sherif linting (yarn lint-sherif)
    - Circular dependency check (yarn check-circular-deps)
    - Yarn constraints (yarn constraints)
    - Dedupe check (yarn dedupe --check)
```

### 3. Deployment Pipeline
- **Preview**: Automatic deployment for PRs
- **Staging**: Deployment to staging environment
- **Production**: Manual approval for production deployment

## Debugging Workflow

### 1. Issue Investigation
```bash
# Check recent changes
git log --oneline -10
git diff HEAD~5..HEAD

# Check current status
yarn check
yarn supa status

# Look for specific errors
grep -r "error" packages/
```

### 2. Systematic Debugging
1. **Reproduce the issue** consistently
2. **Isolate the problem** to specific component/function
3. **Add logging** to understand data flow
4. **Test incrementally** with small changes
5. **Verify fix** doesn't break other functionality

### 3. Performance Investigation
```bash
# Check bundle size
npx bundle-analyzer

# Profile React components
# Use React DevTools Profiler

# Check for memory leaks
# Use browser dev tools memory tab
```

## Maintenance Workflow

### 1. Regular Maintenance Tasks
```bash
# Weekly dependency updates
yarn upgrade-interactive

# Monthly security audit
yarn audit

# Quarterly major version updates
# Plan and test major dependency updates
```

### 2. Code Quality Maintenance
```bash
# Regular code quality checks
yarn check
yarn lint-sherif
yarn check-circular-deps

# Refactoring sessions
# Remove unused code
# Update deprecated patterns
# Improve type safety
```

### 3. Documentation Updates
- Update `.cursor/rules/memory/` files with new patterns
- Update README files
- Update API documentation
- Update troubleshooting guides

## Team Collaboration Workflow

### 1. Communication
- Use descriptive commit messages
- Document architectural decisions
- Share knowledge through code reviews
- Update team on breaking changes

### 2. Knowledge Sharing
- Regular code review sessions
- Architecture decision records
- Pattern documentation updates
- Troubleshooting guide contributions

### 3. Onboarding New Team Members
1. **Setup**: Follow project setup guide
2. **Rules**: Review `.cursor/rules/` directory
3. **Patterns**: Study common patterns and examples
4. **Practice**: Start with small, well-defined tasks
5. **Mentoring**: Pair programming sessions

## Emergency Response Workflow

### 1. Production Issues
```bash
# Quick rollback if needed
git revert <problematic-commit>
git push origin main

# Emergency hotfix
git checkout -b hotfix/critical-fix
# Make minimal fix
git commit -m "hotfix: fix critical issue"
git push origin hotfix/critical-fix
# Create emergency PR
```

### 2. Service Outages
```bash
# Check service status
yarn supa status
curl http://localhost:8081/health

# Restart services
yarn supa restart
yarn dev

# Check logs for errors
yarn supa logs
```

### 3. Data Recovery
```bash
# Database backup/restore
yarn supa db dump > backup.sql
yarn supa db reset
yarn supa db restore < backup.sql
```

This workflow documentation should be updated regularly as the project evolves and new patterns emerge.
