# E2E Tests with Detox (Native)

End-to-end tests for Scaffald on iOS and Android simulators/emulators.

## Prerequisites

### iOS
1. **Xcode** (version 15 or higher)
2. **Command Line Tools**: `xcode-select --install`
3. **iOS Simulator** running

### Android
1. **Android Studio**
2. **Android SDK** (API 33 or higher)
3. **Android Emulator** created and running
   ```bash
   # Create emulator (first time only)
   avdmanager create avd -n Pixel_5_API_33 -k "system-images;android-33;google_apis;x86_64"

   # Start emulator
   emulator -avd Pixel_5_API_33
   ```

### Common
1. **Detox CLI** (first time only):
   ```bash
   pnpm add -g detox-cli
   ```

2. **Supabase Running**:
   ```bash
   pnpm supa:start
   ```

## Installation

```bash
# Install dependencies
pnpm install

# Install Detox
pnpm add -D detox jest-circus

# iOS: Install pods
cd ios && pod install && cd ..
```

## Running Tests

### iOS

```bash
# Build the app for testing (first time or after code changes)
pnpm test:e2e:ios:build

# Run tests
pnpm test:e2e:ios
```

### Android

```bash
# Build the app for testing (first time or after code changes)
pnpm test:e2e:android:build

# Run tests
pnpm test:e2e:android
```

### Debug Mode

```bash
# iOS with logs
pnpm detox test --configuration ios.sim.debug --loglevel verbose

# Android with logs
pnpm detox test --configuration android.emu.debug --loglevel verbose
```

## Test Structure

```
tests/e2e/
├── detox.config.js          # Jest config for Detox
├── detox-setup.ts           # Test setup/teardown
├── app-launch.detox.ts      # App launch tests
└── README-DETOX.md          # This file
```

## Writing Detox Tests

### Basic Test Template

```typescript
import { device, element, by, expect as detoxExpect } from 'detox';

describe('Feature Name', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('does something', async () => {
    // Find and interact with element
    await element(by.id('submit-button')).tap();

    // Verify result
    await detoxExpect(element(by.text('Success'))).toBeVisible();
  });
});
```

### Finding Elements

**Always use testID** for reliable element matching:

```tsx
// In your React Native component:
<Button testID="submit-button">Submit</Button>

// In your test:
await element(by.id('submit-button')).tap();
```

Other matchers:
```typescript
by.id('test-id')               // Preferred
by.text('Click Me')            // Text content
by.label('Submit')             // Accessibility label
by.type('RCTButton')           // Component type
```

### Common Actions

```typescript
// Tap
await element(by.id('button')).tap();

// Type text
await element(by.id('email-input')).typeText('test@example.com');

// Clear text
await element(by.id('email-input')).clearText();

// Scroll
await element(by.id('scroll-view')).scrollTo('bottom');

// Swipe
await element(by.id('list')).swipe('up');

// Long press
await element(by.id('item')).longPress();
```

### Common Assertions

```typescript
// Visibility
await detoxExpect(element(by.id('header'))).toBeVisible();
await detoxExpect(element(by.id('modal'))).not.toBeVisible();

// Existence (may not be visible due to scroll)
await detoxExpect(element(by.id('item'))).toExist();

// Text content
await detoxExpect(element(by.id('title'))).toHaveText('Welcome');

// Value (for inputs)
await detoxExpect(element(by.id('input'))).toHaveValue('test');
```

## Adding testID to Components

### Good Practices

```tsx
// ✅ GOOD: Descriptive, hierarchical IDs
<View testID="profile-screen">
  <Text testID="profile-name">John Doe</Text>
  <Button testID="profile-edit-button">Edit</Button>
</View>

// ✅ GOOD: Dynamic IDs for lists
{items.map((item) => (
  <View key={item.id} testID={`item-${item.id}`}>
    <Text testID={`item-${item.id}-title`}>{item.title}</Text>
  </View>
))}

// ❌ BAD: Generic IDs
<Button testID="button">Submit</Button>

// ❌ BAD: No testID at all
<Button>Submit</Button>
```

## Debugging

### View element tree
```typescript
// In your test:
await device.captureViewHierarchy();
// Output saved to artifacts/
```

### Take screenshot
```typescript
await device.takeScreenshot('my-screenshot');
```

### Logs
```bash
# iOS logs
tail -f ~/Library/Logs/CoreSimulator/*/system.log

# Android logs
adb logcat
```

### Common Issues

**"Cannot find element with ID 'button'"**
- Verify testID is set on the component
- Check element is visible (not scrolled off-screen)
- Use `await device.captureViewHierarchy()` to see all elements

**"App failed to load"**
- Rebuild the app: `pnpm test:e2e:ios:build`
- Check Metro bundler is not already running
- Verify simulator/emulator is running

**"Timeout waiting for element"**
- Increase timeout: `await waitFor(element).toBeVisible().withTimeout(10000);`
- Check element actually exists in that state

**"Detox server connection failed"**
- Kill any existing Detox processes
- Restart your test: `pnpm test:e2e:ios`

## Performance Tips

1. **Reuse app instance**: Use `device.reloadReactNative()` instead of relaunching
2. **Parallel tests**: Detox runs tests sequentially by default (maxWorkers: 1)
3. **Build once**: Build the app once, run tests multiple times
4. **Mock navigation**: Use `device.openURL()` for deep linking to screens

## REQ-9: No Mocking Internal Systems

✅ **DO use real**:
- Real Supabase database
- Real authentication
- Real API calls

❌ **DO NOT mock**:
- Database queries
- tRPC endpoints
- Supabase Auth

## CI/CD Integration

```yaml
# .github/workflows/e2e-native.yml
- name: Run Detox Tests (iOS)
  run: |
    pnpm test:e2e:ios:build
    pnpm test:e2e:ios

- name: Upload screenshots
  uses: actions/upload-artifact@v3
  with:
    name: detox-screenshots
    path: artifacts/
```

## Best Practices

1. **Use testID everywhere**: Makes tests reliable
2. **Keep tests isolated**: Each test should work independently
3. **Test user flows**: Focus on complete journeys
4. **Clean up data**: Reset app state between tests
5. **Avoid sleeps**: Use `waitFor()` instead of `sleep()`

## Example: Complete Flow

```typescript
describe('Project Creation Flow', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES' },
    });
  });

  it('should create a new project', async () => {
    // 1. Sign in
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('TestPassword123!');
    await element(by.id('sign-in-button')).tap();

    // 2. Wait for dashboard
    await waitFor(element(by.id('dashboard-screen')))
      .toBeVisible()
      .withTimeout(10000);

    // 3. Navigate to projects
    await element(by.id('projects-tab')).tap();

    // 4. Create project
    await element(by.id('new-project-button')).tap();
    await element(by.id('project-name-input')).typeText('Test Project');
    await element(by.id('create-button')).tap();

    // 5. Verify success
    await detoxExpect(element(by.text('Test Project'))).toBeVisible();
  });
});
```

## Resources

- [Detox Documentation](https://wix.github.io/Detox/)
- [Detox API Reference](https://wix.github.io/Detox/docs/api/actions)
- [Expo + Detox Guide](https://docs.expo.dev/build-reference/e2e-tests/)
