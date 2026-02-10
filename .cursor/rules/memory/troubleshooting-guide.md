# Troubleshooting Guide

## Common Issues and Solutions

### Build and Development Issues

#### 1. TypeScript Errors
**Symptoms**: Type checking fails, build errors
**Common Causes**:
- Missing type definitions
- Incorrect import paths
- Outdated type files

**Solutions**:
```bash
# Regenerate Supabase types
pnpm supa generate

# Clear TypeScript cache
rm -rf node_modules/.cache
pnpm install

# Check for circular dependencies
pnpm check-circular-deps

# Run type checking
pnpm typecheck
```

#### 2. Metro Bundler Issues (React Native)
**Symptoms**: Bundle fails to load, module resolution errors
**Solutions**:
```bash
# Clear Metro cache
pnpm start --clear

# Reset Metro bundler
npx react-native start --reset-cache

# Clear all caches
rm -rf node_modules/.cache
rm -rf .expo
pnpm install
```

#### 3. Expo Development Server Issues
**Symptoms**: Server won't start, connection issues
**Solutions**:
```bash
# Kill existing processes
killall node
killall expo

# Restart development server
pnpm dev

# Check if port is in use
lsof -ti:8081 | xargs kill -9

# Use different port
pnpm start --port 8082
```

### Database and API Issues

#### 1. Supabase Connection Issues
**Symptoms**: API calls fail, authentication errors
**Debugging Steps**:
```bash
# Check Supabase status
pnpm supa status

# Verify environment variables
echo $EXPO_PUBLIC_SUPABASE_URL
echo $EXPO_PUBLIC_SUPABASE_ANON_KEY

# Test database connection
pnpm supa db ping
```

**Solutions**:
- Verify `.env` file exists and has correct values
- Check if Supabase is running locally: `pnpm supa start`
- Verify RLS policies allow access
- Check network connectivity

#### 2. tRPC Procedure Errors
**Symptoms**: API calls return errors, type mismatches
**Debugging**:
```typescript
// Add logging to tRPC procedures
export const exampleProcedure = publicProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ input, ctx }) => {
    console.log('Input:', input)
    console.log('Context:', ctx)
    
    try {
      const result = await ctx.supabase
        .from('table')
        .select('*')
        .eq('id', input.id)
      
      console.log('Result:', result)
      return result
    } catch (error) {
      console.error('Procedure error:', error)
      throw error
    }
  })
```

#### 3. Database Permission Errors
**Symptoms**: RLS policy violations, access denied
**Solutions**:
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Test policy with specific user
SET ROLE authenticated;
SET request.jwt.claims TO '{"sub": "user-id", "role": "authenticated"}';
SELECT * FROM your_table;

-- Reset role
RESET ROLE;
```

### Package and Dependency Issues

#### 1. pnpm Workspace Issues
**Symptoms**: Packages not found, version conflicts
**Solutions**:
```bash
# Check workspace integrity
pnpm check-deps

# Fix dependency versions
pnpm dedupe

# Reinstall all dependencies
rm -rf node_modules
rm pnpm.lock
pnpm install

# Check for duplicate packages
pnpm why package-name
```

#### 2. Sherif Linting Warnings
**Symptoms**: Monorepo linting fails
**Common Issues**:
- Dependencies in wrong package.json
- Version mismatches across workspaces
- Missing peer dependencies

**Solutions**:
```bash
# Run sherif with autofix
pnpm lint-sherif -f

# Check specific issues
pnpm lint-sherif --verbose

# Move dependencies to correct location
# Root package.json should only have devDependencies
```

#### 3. Circular Dependency Errors
**Symptoms**: Build fails, runtime errors
**Detection**:
```bash
# Check for circular dependencies
pnpm check-circular-deps

# Check specific package
scripts/check-circular-deps.sh packages/core/src
```

**Solutions**:
- Refactor code to remove circular imports
- Use dependency injection
- Extract shared utilities to separate files

### UI and Styling Issues

#### 1. Beyond UI / Theme Styling Problems
**Symptoms**: Styles not applied, theme issues
**Solutions**:
- Ensure the app is wrapped with the theme/UI provider from `@unicornlove/beyond-ui` or `@scf/core`.
- Use design tokens and style factories from the Beyond UI package; see `packages/beyond-ui/STYLING_GUIDE.md` and `packages/beyond-ui/docs/API_CONVENTIONS.md`.

#### 2. Cross-Platform Styling Issues
**Symptoms**: Different appearance on web vs mobile
**Solutions**:
- Use platform-specific files (`.native.tsx`, `.web.tsx`) when needed
- Use Beyond UI responsive utilities and breakpoints
- Test on actual devices, not just simulators

### Performance Issues

#### 1. Slow Build Times
**Symptoms**: Long build/compile times
**Solutions**:
```bash
# Use Turbo cache
pnpm build --cache

# Check for large dependencies
npx bundle-analyzer

# Avoid barrel files
# Use direct imports instead of index.ts re-exports
```

#### 2. Runtime Performance Issues
**Symptoms**: Slow app performance, memory leaks
**Solutions**:
```typescript
// Use React.memo for expensive components
export const ExpensiveComponent = React.memo(({ data }) => {
  return <ComplexUI data={data} />
})

// Use useMemo for expensive calculations
const processedData = useMemo(() => {
  return data.map(item => processItem(item))
}, [data])

// Use useCallback for event handlers
const handlePress = useCallback(() => {
  onPress(id)
}, [onPress, id])
```

### Git and Version Control Issues

#### 1. Pre-commit Hook Failures
**Symptoms**: Commits fail due to quality checks
**Solutions**:
```bash
# Run checks manually
pnpm check

# Fix formatting issues
pnpm format:fix

# Fix linting issues
pnpm lint:fix

# Skip hooks (not recommended)
git commit --no-verify
```

#### 2. Merge Conflicts in Generated Files
**Symptoms**: Conflicts in pnpm.lock, generated types
**Solutions**:
```bash
# For pnpm.lock conflicts
rm pnpm.lock
pnpm install

# For generated types
pnpm supa generate

# For package-lock.json (if exists)
rm package-lock.json
```

## Debugging Strategies

### 1. Systematic Debugging Process
1. **Identify the scope**: Is it build-time or runtime?
2. **Check recent changes**: `git log --oneline -10`
3. **Verify environment**: Check env vars, dependencies
4. **Isolate the issue**: Minimal reproduction case
5. **Check logs**: Console, network, build logs
6. **Test incrementally**: Add logging, test small changes

### 2. Useful Debugging Commands
```bash
# Check git history for context
git log --oneline -10
git diff HEAD~5..HEAD

# Check running processes
ps aux | grep node
ps aux | grep expo

# Check network connections
netstat -an | grep 8081
netstat -an | grep 54321

# Check environment
env | grep EXPO
env | grep SUPABASE

# Check file permissions
ls -la .env
ls -la node_modules/.bin/
```

### 3. Logging and Monitoring
```typescript
// Add debug logging
const DEBUG = __DEV__ || process.env.NODE_ENV === 'development'

export const logger = {
  debug: (message: string, data?: any) => {
    if (DEBUG) {
      console.log(`[DEBUG] ${message}`, data)
    }
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error)
  }
}

// Use in components
export function Component() {
  logger.debug('Component rendered', { props })
  
  useEffect(() => {
    logger.debug('Effect triggered')
  }, [])
  
  return <div>Content</div>
}
```

## Emergency Procedures

### 1. Complete Reset
```bash
# Nuclear option - reset everything
rm -rf node_modules
rm -rf .expo
rm pnpm-lock.yaml
rm package-lock.json

# Reinstall
pnpm install

# Regenerate types
pnpm supa generate

# Restart services
pnpm supa restart
pnpm dev
```

### 2. Rollback Strategy
```bash
# Find last working commit
git log --oneline

# Create backup branch
git checkout -b backup-$(date +%Y%m%d)

# Rollback to working state
git checkout main
git reset --hard <working-commit-hash>

# Or revert specific changes
git revert <problematic-commit-hash>
```

### 3. Service Recovery
```bash
# Restart all services
killall node
killall expo
pnpm supa stop
pnpm supa start
pnpm dev

# Check service status
pnpm supa status
curl http://localhost:8081
curl http://localhost:54321/health
```

## Getting Help

### 1. Information to Gather
- Error messages (full stack traces)
- Steps to reproduce
- Environment details (OS, Node version, etc.)
- Recent changes (git log)
- Package versions (pnpm list)

### 2. Useful Commands for Bug Reports
```bash
# System information
node --version
pnpm --version
expo --version

# Package information
pnpm list --depth=0
pnpm why problematic-package

# Git context
git log --oneline -5
git status
git diff
```

### 3. Common Resources
- [Expo Documentation](https://docs.expo.dev/)
- [Beyond UI](packages/beyond-ui/) – API conventions, STYLING_GUIDE, ARCHITECTURE
- [Supabase Documentation](https://supabase.com/docs)
- [tRPC Documentation](https://trpc.io/)
- Project GitHub Issues and Discussions
