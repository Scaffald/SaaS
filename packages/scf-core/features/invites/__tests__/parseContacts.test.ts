import { describe, expect, it } from 'vitest'
import { parseContacts } from '../parseContacts'

describe('parseContacts', () => {
  it('reads emails and phones, one per line or comma/semicolon separated, with names', () => {
    const out = parseContacts(
      [
        'sam@example.test',
        'Sam Ortiz <sam.o@example.test>, Pat 555-010-4411; +1 (555) 010-4412',
        '"Lee, Jo" <lee@example.test>',
      ].join('\n')
    )
    expect(out.map((e) => e.contact)).toEqual([
      { email: 'sam@example.test', name: null },
      { email: 'sam.o@example.test', name: 'Sam Ortiz' },
      { phone: '555-010-4411', name: 'Pat' },
      { phone: '+1 (555) 010-4412', name: null },
      { email: 'lee@example.test', name: 'Lee, Jo' },
    ])
  })

  it('marks what it cannot read and ignores blank lines', () => {
    const out = parseContacts('\n\nnot a contact\n555-0123\n\nok@example.test\n')
    expect(out.map((e) => [e.raw, e.contact === null])).toEqual([
      ['not a contact', true],
      ['555-0123', true],
      ['ok@example.test', false],
    ])
  })

  it('returns nothing for empty input', () => {
    expect(parseContacts('')).toEqual([])
    expect(parseContacts('  \n , ; ')).toEqual([])
  })
})
