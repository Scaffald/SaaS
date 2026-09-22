/// <reference lib="deno.ns" />

/**
 * Query-string boolean parsing.
 *
 * `z.coerce.boolean()` is `Boolean(value)`, and a query string carries only
 * strings, so `Boolean("false")` is `true` — every value of the flag reads as
 * on, including the one sent to turn it off. `office-jobs.ts` validated
 * `myTeamsOnly` that way, which made the office Jobs screen filter every job
 * out and render "No jobs found" against thirteen seeded jobs.
 *
 * These tests pin the behaviour that replaced it, including the `"false"`
 * case that is the whole point.
 */

import { assertEquals } from '../shared/assert.ts'
import { booleanQueryParam } from '../../functions/_shared/query-schemas.ts'

Deno.test('booleanQueryParam - "false" parses as false, not true', () => {
  assertEquals(booleanQueryParam.parse('false'), false)
})

Deno.test('booleanQueryParam - "true" parses as true', () => {
  assertEquals(booleanQueryParam.parse('true'), true)
})

Deno.test('booleanQueryParam - numeric spellings', () => {
  assertEquals(booleanQueryParam.parse('1'), true)
  assertEquals(booleanQueryParam.parse('0'), false)
})

Deno.test('booleanQueryParam - spelling and whitespace do not matter', () => {
  assertEquals(booleanQueryParam.parse('TRUE'), true)
  assertEquals(booleanQueryParam.parse('False'), false)
  assertEquals(booleanQueryParam.parse(' true '), true)
})

Deno.test('booleanQueryParam - a real boolean passes through', () => {
  assertEquals(booleanQueryParam.parse(true), true)
  assertEquals(booleanQueryParam.parse(false), false)
})

Deno.test('booleanQueryParam - an unrecognised value is rejected, not guessed', () => {
  // The old schema answered `true` for every one of these.
  for (const value of ['yes', 'no', 'on', 'off', '', 'null']) {
    assertEquals(
      booleanQueryParam.safeParse(value).success,
      false,
      `${JSON.stringify(value)} should be rejected rather than coerced`,
    )
  }
})

Deno.test('booleanQueryParam - absent stays distinct from false', () => {
  const optional = booleanQueryParam.optional()
  assertEquals(optional.parse(undefined), undefined)
  assertEquals(optional.parse('false'), false)
})

Deno.test('booleanQueryParam - .default(false) makes absent mean off', () => {
  const withDefault = booleanQueryParam.default(false)
  assertEquals(withDefault.parse(undefined), false)
  assertEquals(withDefault.parse('true'), true)
})
