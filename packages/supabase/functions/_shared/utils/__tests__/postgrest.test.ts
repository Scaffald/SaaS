import { assertEquals, assertStringIncludes } from 'https://deno.land/std@0.223.0/assert/mod.ts'
import { orIlike, quotePostgrestValue } from '../postgrest.ts'

/**
 * The failure mode these guard against (#429): a search term containing `,`
 * or `()` stops being a term and becomes extra PostgREST filter grammar. RLS
 * bounds the damage to the caller's own rows, so the symptom is wrong results
 * rather than a leak — which is exactly why it needs a test rather than being
 * noticed in use.
 */

Deno.test('quotePostgrestValue wraps the value so separators are literal', () => {
  assertEquals(quotePostgrestValue('plumbing'), '"plumbing"')
})

Deno.test('quotePostgrestValue escapes quotes and backslashes', () => {
  assertEquals(quotePostgrestValue('say "hi"'), '"say \\"hi\\""')
  assertEquals(quotePostgrestValue('back\\slash'), '"back\\\\slash"')
})

Deno.test('orIlike builds one condition per column', () => {
  assertEquals(
    orIlike(['title', 'description'], 'weld'),
    'title.ilike."%weld%",description.ilike."%weld%"'
  )
})

Deno.test('a comma in the term cannot open a new condition', () => {
  // Unquoted this became three conditions, the third being attacker-chosen.
  const filter = orIlike(['title'], 'a,status.eq.archived')
  assertEquals(filter, 'title.ilike."%a,status.eq.archived%"')
  // The comma is inside the quoted value, so only one condition exists.
  assertEquals(filter.split('",').length, 1)
})

Deno.test('parentheses cannot open a group', () => {
  const filter = orIlike(['title'], 'x),or(id.gt.0')
  assertStringIncludes(filter, '"%x),or(id.gt.0%"')
  // Nothing outside the quoted region.
  assertEquals(filter.startsWith('title.ilike."'), true)
  assertEquals(filter.endsWith('"'), true)
})

Deno.test('an empty term still produces a valid wildcard condition', () => {
  assertEquals(orIlike(['title'], ''), 'title.ilike."%%"')
})
