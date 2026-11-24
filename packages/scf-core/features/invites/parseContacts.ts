/**
 * Turns what someone types or pastes into the "Add people" box into
 * contacts (#1398): one per line or separated by commas or semicolons, each
 * an email or a phone number, optionally with a name ("Sam Ortiz
 * <sam@example.com>", "Sam 555-010-4411").
 *
 * The server does the real normalising and dedupe; this only splits the text
 * and says which entries look unusable, so the screen can show it before
 * sending.
 */
import type { InviteContact } from '@scaffald/sdk'

export interface ParsedEntry {
  raw: string
  contact: InviteContact | null
}

const EMAIL_RE = /[^\s<>,;"]+@[^\s<>,;"]+\.[^\s<>,;"]+/
const PHONE_RE = /\+?[\d][\d\s().-]{6,}\d/

/**
 * Splits on newlines, commas and semicolons, but not inside "quotes" or
 * <angle brackets>, so `"Lee, Jo" <lee@example.com>` stays one entry.
 */
function split(text: string): string[] {
  const out: string[] = []
  let current = ''
  let inQuotes = false
  let inAngle = false
  for (const ch of text) {
    if (ch === '"') inQuotes = !inQuotes
    else if (ch === '<') inAngle = true
    else if (ch === '>') inAngle = false
    if (ch === '\n' || ((ch === ',' || ch === ';') && !inQuotes && !inAngle)) {
      out.push(current)
      current = ''
      // A new line always starts fresh, even after an unbalanced quote.
      if (ch === '\n') {
        inQuotes = false
        inAngle = false
      }
      continue
    }
    current += ch
  }
  out.push(current)
  return out.map((s) => s.trim()).filter(Boolean)
}

function nameFrom(raw: string, match: string): string | null {
  const name = raw
    .replace(match, '')
    .replace(/[<>"()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return name && /[a-z]/i.test(name) ? name.slice(0, 120) : null
}

export function parseContacts(text: string): ParsedEntry[] {
  return split(text).map((raw) => {
    const email = raw.match(EMAIL_RE)?.[0]
    if (email) return { raw, contact: { email, name: nameFrom(raw, email) } }
    const phone = raw.match(PHONE_RE)?.[0]
    if (phone && phone.replace(/\D/g, '').length >= 10) {
      return { raw, contact: { phone: phone.trim(), name: nameFrom(raw, phone) } }
    }
    return { raw, contact: null }
  })
}
