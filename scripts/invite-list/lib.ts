/**
 * Pure helpers for scripts/invite-list.ts (#1394): CSV in, classified
 * contacts out, CSV back. No network, no database.
 *
 * Email and phone normalisation come from the api function itself
 * (functions/api/lib/invites.ts), so the script classifies a row exactly the
 * way POST /v1/invites will.
 */
import {
  MAX_CONTACTS_PER_REQUEST,
  normalizeEmail,
  normalizePhone,
  SOURCE_RE,
} from '../../packages/supabase/functions/api/lib/invites.ts'

export { MAX_CONTACTS_PER_REQUEST, normalizeEmail, normalizePhone, SOURCE_RE }

/** RFC 4180-ish: quoted fields, "" escapes, CRLF or LF, a BOM, blank lines skipped. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, '')
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        field += '"'
        i++
      } else if (ch === '"') {
        quoted = false
      } else {
        field += ch
      }
      continue
    }
    if (ch === '"' && field === '') {
      quoted = true
    } else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++
      row.push(field)
      if (row.some((f) => f.trim() !== '')) rows.push(row)
      row = []
      field = ''
    } else {
      field += ch
    }
  }
  row.push(field)
  if (row.some((f) => f.trim() !== '')) rows.push(row)
  return rows
}

function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value)
  // A leading = + - @ can run as a formula when the file is opened in a
  // sheet, so prefix '. Phone numbers (digits, spaces, + - . ( )) are left
  // alone: they can't hold a formula and the prefix would ruin them.
  const numeric = /^[+-]?[\d\s().-]+$/.test(s)
  const safe = !numeric && /^[=+\-@]/.test(s) ? `'${s}` : s
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

export function toCsv(header: string[], rows: Array<Record<string, unknown>>): string {
  return `${[header.map(csvCell).join(','), ...rows.map((r) => header.map((h) => csvCell(r[h])).join(','))].join('\n')}\n`
}

/** Which column holds what. Header names are matched loosely (Google Contacts, Outlook, hand-made). */
export interface ColumnMap {
  name?: number
  first?: number
  last?: number
  email?: number
  phone?: number
  tags?: number
  note?: number
}

const ALIASES: Record<keyof ColumnMap, RegExp> = {
  name: /^(name|full ?name|display ?name|contact)$/,
  first: /^(first|first ?name|given ?name)$/,
  last: /^(last|last ?name|family ?name|surname)$/,
  email: /^(e-?mail|e-?mail ?address|e-?mail ?1 ?- ?value|primary ?e-?mail)$/,
  phone: /^(phone|mobile|cell|phone ?number|mobile ?phone|phone ?1 ?- ?value|primary ?phone)$/,
  tags: /^(tags?|labels?|groups?|group ?membership)$/,
  note: /^(note|notes|message|personal ?note)$/,
}

export function mapColumns(header: string[]): ColumnMap {
  const map: ColumnMap = {}
  header.forEach((raw, i) => {
    const h = raw
      .trim()
      .toLowerCase()
      .replace(/[_\s]+/g, ' ')
    for (const key of Object.keys(ALIASES) as Array<keyof ColumnMap>) {
      if (map[key] === undefined && ALIASES[key].test(h)) map[key] = i
    }
  })
  return map
}

export type Classification =
  | 'new_email'
  | 'new_phone'
  | 'member'
  | 'self'
  | 'already_invited'
  | 'duplicate'
  | 'invalid'

export interface ListRow {
  /** 1-based line in the file, counting the header as line 1. */
  line: number
  name: string | null
  email: string | null
  phone: string | null
  rawEmail: string
  rawPhone: string
  tags: string
  note: string | null
  classification: Classification
}

/**
 * Turns CSV rows into contacts, normalised and de-duplicated within the file.
 * An email wins over a phone when both are present, as on the server: only
 * email is ever sent by us.
 */
export function rowsToContacts(rows: string[][]): { rows: ListRow[]; columns: ColumnMap } {
  if (rows.length === 0) return { rows: [], columns: {} }
  const columns = mapColumns(rows[0])
  if (columns.email === undefined && columns.phone === undefined) {
    throw new Error(`No email or phone column found. Header was: ${rows[0].join(', ')}`)
  }
  const cell = (r: string[], i: number | undefined) => (i === undefined ? '' : (r[i] ?? '').trim())
  const seen = new Set<string>()
  const out: ListRow[] = rows.slice(1).map((r, i) => {
    const rawEmail = cell(r, columns.email)
    const rawPhone = cell(r, columns.phone)
    const email = normalizeEmail(rawEmail)
    const phone = email ? null : normalizePhone(rawPhone)
    const joined = [cell(r, columns.first), cell(r, columns.last)].filter(Boolean).join(' ')
    const name = (cell(r, columns.name) || joined).slice(0, 120) || null
    const key = email ?? phone
    let classification: Classification = email ? 'new_email' : phone ? 'new_phone' : 'invalid'
    if (key && seen.has(key)) classification = 'duplicate'
    if (key) seen.add(key)
    return {
      line: i + 2,
      name,
      email,
      phone,
      rawEmail,
      rawPhone,
      tags: cell(r, columns.tags),
      note: cell(r, columns.note) || null,
      classification,
    }
  })
  return { rows: out, columns }
}

/** Applies what the database knows. Rows already decided (invalid, duplicate) are left alone. */
export function classify(
  rows: ListRow[],
  known: {
    inviterEmail: string
    members: Set<string>
    invitedEmails: Set<string>
    invitedPhones: Set<string>
  }
): ListRow[] {
  const self = normalizeEmail(known.inviterEmail)
  return rows.map((r) => {
    if (r.classification !== 'new_email' && r.classification !== 'new_phone') return r
    let c: Classification = r.classification
    if (r.email && r.email === self) c = 'self'
    else if (r.email && known.members.has(r.email)) c = 'member'
    else if (
      (r.email && known.invitedEmails.has(r.email)) ||
      (r.phone && known.invitedPhones.has(r.phone))
    ) {
      c = 'already_invited'
    }
    return { ...r, classification: c }
  })
}

export function summarize(rows: ListRow[]): Record<Classification, number> {
  const out: Record<Classification, number> = {
    new_email: 0,
    new_phone: 0,
    member: 0,
    self: 0,
    already_invited: 0,
    duplicate: 0,
    invalid: 0,
  }
  for (const r of rows) out[r.classification]++
  return out
}

/** `script:<file>` with the file's base name reduced to what the api accepts. */
export function sourceFor(file: string): string {
  const base =
    (file.split('/').pop() ?? 'list')
      .replace(/[^A-Za-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'list'
  const source = `script:${base}`
  if (!SOURCE_RE.test(source)) throw new Error(`Could not make a valid source from ${file}`)
  return source
}

/**
 * Request batches for the rows to send. Rows with their own note go alone
 * (the api takes one message per request); the rest share `message`.
 */
export function batches(
  rows: ListRow[],
  size: number,
  message: string | null
): Array<{ rows: ListRow[]; message: string | null }> {
  const limit = Math.max(1, Math.min(size, MAX_CONTACTS_PER_REQUEST))
  const out: Array<{ rows: ListRow[]; message: string | null }> = []
  let current: ListRow[] = []
  for (const r of rows) {
    if (r.note) {
      out.push({ rows: [r], message: r.note.slice(0, 500) })
      continue
    }
    current.push(r)
    if (current.length === limit) {
      out.push({ rows: current, message })
      current = []
    }
  }
  if (current.length) out.push({ rows: current, message })
  return out
}
