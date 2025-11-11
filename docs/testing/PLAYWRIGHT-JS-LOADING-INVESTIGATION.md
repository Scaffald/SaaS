# Playwright JavaScript Loading Investigation

**Date**: November 5, 2025
**Issue**: Tests failing with "You need to enable JavaScript to run this app" message
**Status**: ✅ Root cause identified, action plan created

---

## Executive Summary

Tests appeared to fail due to JavaScript not loading, but **investigation reveals JavaScript IS loading and executing correctly**. The real issue is that the React app renders almost nothing (empty flexbox div) instead of page content. This is likely an **authentication state or routing issue**, NOT a bundle loading problem.

---

## Investigation Process

### 1. Initial Hypothesis (INCORRECT)
- **Assumed**: 22MB JavaScript bundle timing out or failing to load
- **Evidence**: Tests showing "You need to enable JavaScript" message

### 2. Deep Dive Analysis
Created debug test (`tests/debug-js-loading.spec.ts`) with browser console logging.

### 3. Key Findings

#### ✅ JavaScript IS Working:
```
BROWSER [info]: Download the React DevTools
BROWSER [log]: Running application "main" with appParams: {rootTag: #root}
BROWSER [log]: [web] Supabase URL: http://127.0.0.1:54321
BROWSER [log]: [web] Supabase Key: Present
```

#### ❌ React App Renders Almost Nothing:
```
BODY TEXT: You need to enable JavaScript to run this app.
ROOT HTML LENGTH: 98
ROOT HTML PREVIEW: <div class="css-view-g5y9jx r-flex-13awgt0"><div style="flex: 1 1 0%; display: flex;"></div></div>
```

---

## Root Cause Analysis

### The Real Problem

1. **JavaScript bundle loads successfully** (22MB, HTTP 200)
2. **React initializes correctly** (console logs confirm)
3. **Supabase connects** (URL and key logs appear)
4. **BUT**: React renders an almost-empty div (98 bytes) instead of page content

### Why Tests See "You need to enable JavaScript"

The `<noscript>` tag in the HTML template is **outside** the `#root` div:
```html
<body>
  <noscript>You need to enable JavaScript to run this app.</noscript>
  <div id="root"></div>
</body>
```

Tests using `page.locator('body').textContent()` **incorrectly** pick up the noscript message even though JavaScript IS running.

### Likely Causes

1. **Authentication State Issue**:
   - Auth storage state from `tests/.auth/super-admin.json` may not be properly applied
   - React app may be detecting "not authenticated" and showing blank screen
   - Route protection redirecting or hiding content

2. **Routing Issue**:
   - Navigation to `/office/organizations` not working
   - Expo Router not matching the route
   - Conditional rendering hiding content

3. **Require Cycle Warning**:
   ```
   Require cycle: react-query/index.ts → QueryProvider.tsx → api.ts → react-query/index.ts
   ```
   While not fatal, could cause initialization issues.

---

## Bundle Analysis

### Current State
- **Bundle Size**: 22MB (development mode with source maps)
- **Entry Point**: `/node_modules/expo-router/entry.bundle?platform=web&dev=true&lazy=true`
- **Metro Config**: Using Tamagui plugin with CSS extraction
- **Bundle Delivery**: ✅ Successfully loads and executes

### Development vs Production
- **Development**: 22MB is normal (includes source maps, HMR, debugging info)
- **Production**: Would be significantly smaller with minification and tree shaking

### Optimization Opportunities (Future)

#### 1. Enable Code Splitting
Expo Router supports lazy loading routes:
```ts
// Use Suspense boundaries and lazy loading
export { default as loading } from './loading'
```

#### 2. Production Build Optimization
```bash
# Production builds are much smaller
pnpm exec expo export --platform web
```

#### 3. Metro Bundler Configuration
Current config is basic. Could add:
- Custom transformer for tree shaking
- Source map exclusion for production
- Asset optimization

#### 4. Dependency Audit
```bash
# Analyze what's in the bundle
npx expo-env-info
```

#### 5. Remove Development-Only Code
- React DevTools
- HMR websocket
- Source maps
- Debugging utilities

---

## Immediate Action Items

### Priority 1: Fix React Rendering Issue

**Task**: Investigate why React app renders empty content

**Steps**:
1. Add more debug logging to check authentication state
2. Verify storage state is properly loaded in tests
3. Check if route protection is blocking access
4. Inspect React Router state during test execution
5. Look for conditional rendering that might hide content

**Debug Test to Add**:
```ts
test('debug authentication and routing', async ({ page }) => {
  await page.goto('http://localhost:8081/office/organizations')

  // Check auth state in localStorage/sessionStorage
  const authState = await page.evaluate(() => {
    return {
      localStorage: Object.keys(localStorage),
      sessionStorage: Object.keys(sessionStorage),
      supabaseAuth: localStorage.getItem('supabase.auth.token')
    }
  })
  console.log('AUTH STATE:', authState)

  // Check current URL after navigation
  console.log('CURRENT URL:', page.url())

  // Check for error boundaries or redirects
  const errorText = await page.locator('[role="alert"]').textContent().catch(() => null)
  console.log('ERROR TEXT:', errorText)
})
```

###Priority 2: Fix Test Selectors

**Task**: Update tests to check `#root` content instead of `body`

**Current (Incorrect)**:
```ts
const pageContent = await page.locator('body').textContent()
expect(pageContent).toMatch(/organizations/i)
```

**Correct**:
```ts
const rootContent = await page.locator('#root').textContent()
expect(rootContent).toMatch(/organizations/i)
```

### Priority 3: Add Waiting Strategy

**Task**: Wait for React to render content before checking

**Add to tests**:
```ts
// Wait for actual content, not just HTML load
await page.waitForSelector('[data-testid="organizations-table"]', { timeout: 10000 })

// OR wait for root to have substantial content
await page.waitForFunction(
  () => document.querySelector('#root')?.innerHTML.length > 500,
  { timeout: 10000 }
)
```

---

## Bundle Optimization (Lower Priority)

### When to Optimize

**NOT NOW**: Development bundles are meant to be large. Focus on:
1. Fixing the React rendering issue
2. Getting tests passing
3. Completing REQ-65

**LATER** (when moving to production):
1. Run production build: `expo export --platform web`
2. Analyze bundle with source map explorer
3. Implement code splitting for routes
4. Audit and remove unused dependencies
5. Configure metro for better tree shaking

### Expected Improvements

- **Development → Production**: 22MB → ~2-5MB (gzipped)
- **Code Splitting**: Additional 30-50% reduction
- **Tree Shaking**: Remove 20-40% unused code
- **Asset Optimization**: Smaller images, fonts, icons

---

## Require Cycle Fix

**Warning Found**:
```
Require cycle: react-query/index.ts → QueryProvider.tsx → api.ts → react-query/index.ts
```

**Impact**: Low (cycles allowed but can cause initialization issues)

**Fix** (when time permits):
1. Move API utils to separate file
2. Refactor circular dependency
3. Use dependency injection pattern

---

## Testing Recommendations

### 1. Add Comprehensive Debug Test
```ts
// tests/debug-react-rendering.spec.ts
test('debug React app state', async ({ page }) => {
  page.on('console', msg => console.log(`[${msg.type()}]:`, msg.text()))
  page.on('pageerror', err => console.log('ERROR:', err))

  await page.goto('http://localhost:8081/office/organizations')
  await page.waitForTimeout(5000)

  // Check all relevant state
  const state = await page.evaluate(() => ({
    rootHTML: document.querySelector('#root')?.innerHTML.length,
    url: window.location.href,
    localStorage: Object.keys(localStorage),
    hasAuth: !!localStorage.getItem('supabase.auth.token'),
    visibleElements: {
      table: !!document.querySelector('[data-testid="organizations-table"]'),
      header: !!document.querySelector('h1'),
      navigation: !!document.querySelector('nav')
    }
  }))

  console.log('STATE:', JSON.stringify(state, null, 2))
})
```

### 2. Update Test Wait Strategy
- Don't rely on `page.waitForTimeout()` alone
- Use `waitForSelector()` with meaningful selectors
- Wait for network idle: `page.waitForLoadState('networkidle')`
- Check for actual content rendering, not just HTML presence

### 3. Fix Test Assertions
- Change from `body.textContent()` to `#root.textContent()`
- Wait for specific elements before checking content
- Use more specific selectors (data-testid attributes)

---

## Next Steps

1. **Immediate**:
   - Run debug test to understand React rendering failure
   - Check authentication state persistence
   - Verify routing is working

2. **Short Term** (This Week):
   - Fix React rendering issue
   - Update test selectors to use `#root`
   - Add proper wait conditions
   - Complete REQ-65 Tasks 4-5

3. **Long Term** (Next Sprint):
   - Bundle size analysis for production
   - Implement code splitting
   - Fix require cycle
   - Production build optimization

---

## Conclusion

The "JavaScript not loading" issue is actually a **React rendering issue disguised as a JavaScript problem**. The bundle loads fine, React starts fine, but the app renders empty content. Focus should be on:

1. ✅ **Debugging React state** (authentication, routing)
2. ✅ **Fixing test selectors** (use #root not body)
3. ✅ **Adding proper waits** (wait for actual content)

Bundle optimization is **NOT urgent** - it's a performance concern for production, not a testing blocker.

---

**Created**: November 5, 2025
**Last Updated**: November 5, 2025
**Related**: REQ-65 (Organization Forms), REQ-72 (Auth Setup), REQ-2 (Comprehensive Testing)
