/**
 * scripts/invite-list/lib.ts — run with:
 *   pnpm exec tsx --test scripts/invite-list/lib.test.ts
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { batches, classify, mapColumns, parseCsv, rowsToContacts, sourceFor, summarize, toCsv } from './lib.ts'

test('parseCsv: quotes, escaped quotes, embedded commas and newlines, CRLF, BOM, blank lines', () => {
  const text = '﻿Name,Email\r\n"Doe, Jane","jane@example.test"\r\n\r\n"Say ""hi""\nthere",x@example.test\n'
  assert.deepEqual(parseCsv(text), [
    ['Name', 'Email'],
    ['Doe, Jane', 'jane@example.test'],
    ['Say "hi"\nthere', 'x@example.test'],
  ])
  assert.deepEqual(parseCsv('a,b'), [['a', 'b']], 'no trailing newline')
})

test('mapColumns: Google Contacts, Outlook and hand-made headers', () => {
  assert.deepEqual(mapColumns(['First Name', 'Last Name', 'E-mail 1 - Value', 'Phone 1 - Value', 'Labels']), {
    first: 0,
    last: 1,
    email: 2,
    phone: 3,
    tags: 4,
  })
  assert.deepEqual(mapColumns(['name', 'email_address', 'mobile', 'note']), { name: 0, email: 1, phone: 2, note: 3 })
})

test('rowsToContacts: normalises, prefers email, catches duplicates and junk', () => {
  const rows = parseCsv(
    [
      'First,Last,Email,Phone,Note',
      'Sam,Ortiz, SAM@Example.test ,555 555 0100,',
      'Pat,,,(555) 555-0101,Come work with us',
      'Dup,,sam@example.test,,',
      'Nobody,,not-an-email,12,',
      'Lee,,,+1 555 555 0101,',
    ].join('\n')
  )
  const { rows: out } = rowsToContacts(rows)
  assert.deepEqual(
    out.map((r) => [r.line, r.name, r.email, r.phone, r.classification]),
    [
      [2, 'Sam Ortiz', 'sam@example.test', null, 'new_email'],
      [3, 'Pat', null, '+15555550101', 'new_phone'],
      [4, 'Dup', 'sam@example.test', null, 'duplicate'],
      [5, 'Nobody', null, null, 'invalid'],
      [6, 'Lee', null, '+15555550101', 'duplicate'],
    ]
  )
  assert.equal(out[1].note, 'Come work with us')
  assert.throws(() => rowsToContacts([['Name', 'Company']]), /No email or phone column/)
})

test('classify: self, members and earlier invites, leaving decided rows alone', () => {
  const { rows } = rowsToContacts(
    parseCsv('email,phone\nme@example.test,\nmember@example.test,\nold@example.test,\n,5555550199\nnew@example.test,\nbad,')
  )
  const out = classify(rows, {
    inviterEmail: 'Me@Example.test',
    members: new Set(['member@example.test']),
    invitedEmails: new Set(['old@example.test']),
    invitedPhones: new Set(['+15555550199']),
  })
  assert.deepEqual(
    out.map((r) => r.classification),
    ['self', 'member', 'already_invited', 'already_invited', 'new_email', 'invalid']
  )
  assert.equal(summarize(out).already_invited, 2)
})

test('batches: rows with a note go alone with it; the rest share the message in capped batches', () => {
  const { rows } = rowsToContacts(
    parseCsv(['email,note', ...Array.from({ length: 5 }, (_, i) => `p${i}@example.test,${i === 2 ? 'hey' : ''}`)].join('\n'))
  )
  const out = batches(rows, 2, 'shared')
  assert.deepEqual(
    out.map((b) => [b.rows.map((r) => r.email), b.message]),
    [
      [['p0@example.test', 'p1@example.test'], 'shared'],
      [['p2@example.test'], 'hey'],
      [['p3@example.test', 'p4@example.test'], 'shared'],
    ]
  )
  assert.equal(batches(rows, 500, null)[0].rows.length <= 50, true, 'never above the api limit')
})

test('sourceFor and toCsv: a valid source, and spreadsheet-safe output', () => {
  assert.equal(sourceFor('/Users/x/lists/My Crew (2026).csv'), 'script:My-Crew-2026-.csv')
  assert.equal(
    toCsv(['a', 'b'], [
      { a: 'x, y', b: '=SUM(A1)' },
      { a: 'say "hi"', b: null },
      { a: '+15550104411', b: '+cmd|x' },
    ]),
    'a,b\n"x, y",\'=SUM(A1)\n"say ""hi""",\n+15550104411,\'+cmd|x\n'
  )
})
