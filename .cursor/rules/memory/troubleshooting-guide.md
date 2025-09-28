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
yarn supa generate

# Clear TypeScript cache
rm -rf node_modules/.cache
yarn install

# Check for circular dependencies
yarn check-circular-deps

# Run type checking
yarn typecheck
```

#### 2. Metro Bundler Issues (React Native)
**Symptoms**: Bundle fails to load, module resolution errors
**Solutions**:
```bash
# Clear Metro cache
yarn start --clear

# Reset Metro bundler
npx react-native start --reset-cache

# Clear all caches
rm -rf node_modules/.cache
rm -rf .expo
yarn install
```

#### 3. Expo Development Server Issues
**Symptoms**: Server won't start, connection issues
**Solutions**:
```bash
# Kill existing processes
killall node
killall expo

# Restart development server
yarn dev

# Check if port is in use
lsof -ti:8081 | xargs kill -9

# Use different port
yarn start --port 8082
```

### Database and API Issues

#### 1. Supabase Connection Issues
**Symptoms**: API calls fail, authentication errors
**Debugging Steps**:
```bash
# Check Supabase status
yarn supa status

# Verify environment variables
echo $EXPO_PUBLIC_SUPABASE_URL
echo $EXPO_PUBLIC_SUPABASE_ANON_KEY

# Test database connection
yarn supa db ping
```

**Solutions**:
- Verify `.env` file exists and has correct values
- Check if Supabase is running locally: `yarn supa start`
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

#### 1. Yarn Workspace Issues
**Symptoms**: Packages not found, version conflicts
**Solutions**:
```bash
# Check workspace integrity
yarn check-deps

# Fix dependency versions
yarn dedupe

# Reinstall all dependencies
rm -rf node_modules
rm yarn.lock
yarn install

# Check for duplicate packages
yarn why package-name
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
yarn lint-sherif -f

# Check specific issues
yarn lint-sherif --verbose

# Move dependencies to correct location
# Root package.json should only have devDependencies
```

#### 3. Circular Dependency Errors
**Symptoms**: Build fails, runtime errors
**Detection**:
```bash
# Check for circular dependencies
yarn check-circular-deps

# Check specific package
scripts/check-circular-deps.sh packages/core/src
```

**Solutions**:
- Refactor code to remove circular imports
- Use dependency injection
- Extract shared utilities to separate files

### UI and Styling Issues

#### 1. Tamagui Styling Problems
**Symptoms**: Styles not applied, theme issues
**Solutions**:
```typescript
// Ensure Tamagui provider is set up
import { TamaguiProvider } from '@tamagui/core'
import config from './tamagui.config'

export function App() {
  return (
    <TamaguiProvider config={config}>
      {/* Your app */}
    </TamaguiProvider>
  )
}

// Check theme configuration
import { useTheme } from '@tamagui/core'

export function Component() {
  const theme = useTheme()
  console.log('Current theme:', theme)
  
  return <Text color="$color">Text</Text>
}
```

#### 2. Cross-Platform Styling Issues
**Symptoms**: Different appearance on web vs mobile
**Solutions**:
- Use platform-specific files (`.native.tsx`, `.web.tsx`)
- Check Tamagui responsive breakpoints
- Test on actual devices, not just simulators

### Performance Issues

#### 1. Slow Build Times
**Symptoms**: Long build/compile times
**Solutions**:
```bash
# Use Turbo cache
yarn build --cache

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
yarn check

# Fix formatting issues
yarn format:fix

# Fix linting issues
yarn lint:fix

# Skip hooks (not recommended)
git commit --no-verify
```

#### 2. Merge Conflicts in Generated Files
**Symptoms**: Conflicts in yarn.lock, generated types
**Solutions**:
```bash
# For yarn.lock conflicts
rm yarn.lock
yarn install

# For generated types
yarn supa generate

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
rm -rf .next
rm yarn.lock
rm package-lock.json

# Reinstall
yarn install

# Regenerate types
yarn supa generate

# Restart services
yarn supa restart
yarn dev
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
yarn supa stop
yarn supa start
yarn dev

# Check service status
yarn supa status
curl http://localhost:8081
curl http://localhost:54321/health
```

## Getting Help

### 1. Information to Gather
- Error messages (full stack traces)
- Steps to reproduce
- Environment details (OS, Node version, etc.)
- Recent changes (git log)
- Package versions (yarn list)

### 2. Useful Commands for Bug Reports
```bash
# System information
node --version
yarn --version
expo --version

# Package information
yarn list --depth=0
yarn why problematic-package

# Git context
git log --oneline -5
git status
git diff
```

### 3. Common Resources
- [Expo Documentation](https://docs.expo.dev/)
- [Tamagui Documentation](https://tamagui.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [tRPC Documentation](https://trpc.io/)
- Project GitHub Issues and Discussions
