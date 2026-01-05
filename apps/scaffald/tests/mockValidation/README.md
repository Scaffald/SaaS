# Mock Validation Framework

## Overview

The Mock Validation Framework ensures all testing mocks accurately represent their real implementations **before any tests execute**. This prevents false test passes caused by broken or outdated mocks.

**REQ-9 Testing Principle**: Only mock external services (Stripe, OpenAI, etc.), never mock internal systems (database, tRPC, Supabase).

## Why Mock Validation Matters

Without mock validation:
- ❌ Mocks drift from real APIs as dependencies update
- ❌ Tests pass but production breaks
- ❌ No early warning when mocks become stale
- ❌ Debugging is difficult (is it the test or the mock?)

With mock validation:
- ✅ Tests fail immediately if mocks are broken
- ✅ Clear error messages showing what's wrong
- ✅ Prevents wasted time on false positives
- ✅ Documentation of external API contracts

## How It Works

1. **Before Tests Run**: Framework validates all registered mocks
2. **Parallel Execution**: All validators run concurrently for speed
3. **Fail Fast**: Tests won't run if any mock is broken
4. **Clear Errors**: Detailed reporting of what's wrong and how to fix it

## Adding a New Validator

### Step 1: Create the Validator

Create a new file in `validators/` directory:

```typescript
// validators/StripeValidator.ts
import type { MockValidator, ValidationResult } from '../types';
import { createSuccessResult, createValidationError, createFailedResult } from '../MockValidationFramework';

export class StripeValidator implements MockValidator {
  readonly name = 'Stripe Mock';

  async validate(): Promise<ValidationResult> {
    const start = Date.now();
    const errors = [];

    try {
      // Import the mock
      const { mockStripe } = await import('../../mocks/externalServices');

      // Validate mock structure
      if (typeof mockStripe.customers?.create !== 'function') {
        errors.push(createValidationError(
          'customers.create',
          'function',
          typeof mockStripe.customers?.create,
          'Stripe mock missing customers.create method',
          'Add: mockStripe.customers.create = vi.fn(async (data) => ({ id: "cus_test", ...data }))'
        ));
      }

      // Add more validations for other Stripe methods
      // ...

      const duration = Date.now() - start;
      return errors.length > 0
        ? createFailedResult(this.name, errors, duration)
        : createSuccessResult(this.name, duration);

    } catch (error) {
      const duration = Date.now() - start;
      return createFailedResult(
        this.name,
        [createValidationError(
          'import',
          'successful import',
          error instanceof Error ? error.message : 'unknown error',
          'Failed to import Stripe mock'
        )],
        duration
      );
    }
  }
}
```

### Step 2: Register the Validator

Update `setup.ts` to register your validator:

```typescript
beforeAll(async () => {
  const { MockValidationFramework } = await import('./mockValidation');
  const framework = MockValidationFramework.getInstance();

  // Register Stripe validator
  const { StripeValidator } = await import('./mockValidation/validators/StripeValidator');
  framework.registerValidator(new StripeValidator());

  // Register other validators...

  const results = await framework.validateAll({
    failFast: true,
    verbose: true,
    timeoutMs: 15000,
  });

  if (!results.allPassed) {
    throw new Error('Mock validation failed. Fix mocks before running tests.');
  }
});
```

## Validation Best Practices

### What to Validate

✅ **DO validate**:
- Method signatures exist
- Return value shapes match real API
- Required properties are present
- Mock follows real API behavior patterns

❌ **DON'T validate**:
- Exact implementation details
- Mock's internal state
- Unrelated functionality

### Example: Stripe Customer Creation

```typescript
// GOOD: Validates structure and behavior
if (typeof mockStripe.customers?.create !== 'function') {
  errors.push(createValidationError(...));
}

const testCustomer = await mockStripe.customers.create({ email: 'test@example.com' });
if (!testCustomer.id || !testCustomer.email) {
  errors.push(createValidationError(
    'customers.create return value',
    'object with id and email',
    JSON.stringify(testCustomer),
    'Stripe customer create must return id and email fields'
  ));
}

// BAD: Too specific to implementation
if (mockStripe.customers.create.mock.calls.length !== 0) {
  errors.push(...); // Don't validate mock state
}
```

## Troubleshooting

### Validator Times Out

```
Error: Validator "Stripe Mock" timed out after 15000ms
```

**Solution**: Increase timeout in setup.ts or optimize validator

```typescript
const results = await framework.validateAll({
  timeoutMs: 30000, // Increase to 30 seconds
});
```

### Validator Throws Exception

```
Error in: execution
Expected: successful validation
Actual: Cannot read property 'create' of undefined
```

**Solution**: Check that the mock is properly initialized before validation

### All Validators Skipped

If no validators are registered, validation will pass with 0/0 results. This is expected when starting fresh.

## CLI Output Example

```
Starting Mock Validation
Running 3 validator(s)...

✓ Stripe Mock (145ms)
✓ OpenAI Mock (89ms)
✗ Mapbox Mock (67ms)

  Error in: geocode.forward
  Expected: function
  Actual:   undefined
  Message:  Mapbox mock missing geocode.forward method

  How to fix:
    Add: mockMapbox.geocode.forward = vi.fn(async (query) => ({ ... }))

──────────────────────────────────────────────────
Mock Validation Summary
──────────────────────────────────────────────────

  Total Time: 301ms
  Validators: 3
  Passed: 2
  Failed: 1

Mock validation failed with 1 error(s)
Tests will not run until mocks are fixed.
```

## Framework API

### MockValidationFramework

**Singleton instance**:
```typescript
const framework = MockValidationFramework.getInstance();
```

**Register validator**:
```typescript
framework.registerValidator(new MyValidator());
```

**Validate all**:
```typescript
const results = await framework.validateAll({
  failFast: true,    // Stop on first failure
  verbose: true,     // Show detailed errors
  timeoutMs: 15000,  // Max time per validator
});
```

### Helper Functions

**Create validation error**:
```typescript
createValidationError(
  field: string,
  expected: string,
  actual: string,
  message: string,
  howToFix?: string
)
```

**Create success result**:
```typescript
createSuccessResult(mockName: string, durationMs: number)
```

**Create failed result**:
```typescript
createFailedResult(
  mockName: string,
  errors: ValidationError[],
  durationMs: number
)
```

## Related Documentation

- [Testing Guide](../TESTING.md) - Overall testing strategy
- [External Service Mocks](../mocks/externalServices.ts) - All external mocks
- [Test Setup](../setup.ts) - Test environment configuration
