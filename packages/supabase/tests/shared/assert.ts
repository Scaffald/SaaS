export function assert(condition: unknown, message = 'Assertion failed'): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

export function assertExists<T>(
  value: T,
  message = 'Expected value to be defined'
): asserts value is NonNullable<T> {
  if (value === undefined || value === null) {
    throw new Error(message)
  }
}

export function assertEquals<T>(
  actual: T,
  expected: T,
  message = 'Expected values to be equal'
): void {
  if (!Object.is(actual, expected)) {
    const pretty = (val: unknown) => (typeof val === 'string' ? `"${val}"` : `${val}`)
    throw new Error(`${message}\nActual: ${pretty(actual)}\nExpected: ${pretty(expected)}`)
  }
}

export function assertNotEquals<T>(
  actual: T,
  expected: T,
  message = 'Expected values to differ'
): void {
  if (Object.is(actual, expected)) {
    const pretty = (val: unknown) => (typeof val === 'string' ? `"${val}"` : `${val}`)
    throw new Error(`${message}\nBoth were: ${pretty(actual)}`)
  }
}
