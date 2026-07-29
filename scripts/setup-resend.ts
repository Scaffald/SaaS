#!/usr/bin/env tsx
/**
 * Register a sending domain with Resend and publish its DNS records to Route53.
 *
 *   pnpm tsx scripts/setup-resend.ts --domain scaffald.com
 *   pnpm tsx scripts/setup-resend.ts --domain scaffald.com --dry-run
 *
 * Idempotent: re-running finds the existing domain instead of creating a
 * second one, and every record is an UPSERT, so it is safe to run again after
 * a partial failure or to repair drift.
 *
 * Requires RESEND_API_KEY plus AWS credentials, both read from .env the same
 * way the other scripts in here do.
 *
 * Note on SPF: Resend puts its SPF and MX on a `send.<domain>` subdomain and
 * signs with DKIM at `resend._domainkey.<domain>`. That means the apex SPF
 * record does not need to change — DMARC aligns through DKIM instead. Do not
 * "helpfully" add include:amazonses.com to the apex; it is not needed and it
 * spends one of SPF's ten DNS lookups.
 */

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const HOSTED_ZONE_ID = process.env.ROUTE53_ZONE_ID ?? 'Z03807932GT9W30LQ0T67'
const RESEND_API = 'https://api.resend.com'
/** One DNS character-string caps at 255 bytes; longer values must be split. */
const TXT_CHUNK = 255

type ResendRecord = {
  record: string
  name: string
  type: string
  ttl?: string | number
  status?: string
  value: string
  priority?: number
}

type ResendDomain = {
  id: string
  name: string
  status: string
  records?: ResendRecord[]
}

const args = process.argv.slice(2)
const flag = (name: string, fallback?: string) => {
  const i = args.indexOf(`--${name}`)
  return i === -1 ? fallback : args[i + 1]
}
const DOMAIN = flag('domain', 'scaffald.com')!
const DRY_RUN = args.includes('--dry-run')

function loadEnv() {
  for (const file of ['.env', '.env.production']) {
    try {
      for (const line of readFileSync(file, 'utf8').split('\n')) {
        const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
      }
    } catch {
      // Optional file.
    }
  }
}

async function resend<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${RESEND_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  const body = await res.text()
  if (!res.ok) throw new Error(`Resend ${path} -> ${res.status}: ${body}`)
  return body ? (JSON.parse(body) as T) : ({} as T)
}

/** Route53 rejects a single string over 255 bytes, but concatenates adjacent ones. */
function quoteTxt(value: string): string {
  const chunks: string[] = []
  for (let i = 0; i < value.length; i += TXT_CHUNK) chunks.push(value.slice(i, i + TXT_CHUNK))
  return chunks.map((c) => `"${c}"`).join(' ')
}

function toChange(record: ResendRecord) {
  const name = record.name.endsWith('.') ? record.name : `${record.name}.`
  const value =
    record.type === 'TXT'
      ? quoteTxt(record.value)
      : record.type === 'MX'
        ? `${record.priority ?? 10} ${record.value}`
        : record.value

  return {
    Action: 'UPSERT',
    ResourceRecordSet: {
      Name: name,
      Type: record.type,
      TTL: Number(record.ttl) || 300,
      ResourceRecords: [{ Value: value }],
    },
  }
}

function applyToRoute53(records: ResendRecord[]) {
  const batch = {
    Comment: `Resend sending records for ${DOMAIN}`,
    Changes: records.map(toChange),
  }

  if (DRY_RUN) {
    console.log('\n--dry-run, would submit this change batch:\n')
    console.log(JSON.stringify(batch, null, 2))
    return
  }

  const file = join(mkdtempSync(join(tmpdir(), 'resend-dns-')), 'batch.json')
  writeFileSync(file, JSON.stringify(batch))

  const out = execFileSync(
    'aws',
    [
      'route53',
      'change-resource-record-sets',
      '--hosted-zone-id',
      HOSTED_ZONE_ID,
      '--change-batch',
      `file://${file}`,
      '--output',
      'json',
    ],
    { encoding: 'utf8' }
  )
  const id = JSON.parse(out).ChangeInfo?.Id
  console.log(`  submitted to Route53 (${id})`)
}

async function main() {
  loadEnv()

  if (!process.env.RESEND_API_KEY) {
    console.error(
      'RESEND_API_KEY is not set.\n' +
        'Create one at https://resend.com/api-keys with Full access (it needs to\n' +
        'manage domains, not just send), then add it to .env as RESEND_API_KEY.'
    )
    process.exit(1)
  }
  if (!process.env.AWS_ACCESS_KEY_ID && process.env.AWS_KEY) {
    process.env.AWS_ACCESS_KEY_ID = process.env.AWS_KEY
    process.env.AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET
  }

  const { data: existing } = await resend<{ data: ResendDomain[] }>('/domains')
  let domain = existing?.find((d) => d.name === DOMAIN)

  if (domain) {
    console.log(`Domain ${DOMAIN} already registered (${domain.id}, status: ${domain.status})`)
    domain = await resend<ResendDomain>(`/domains/${domain.id}`)
  } else {
    console.log(`Registering ${DOMAIN} with Resend...`)
    domain = await resend<ResendDomain>('/domains', {
      method: 'POST',
      // us-east-1 keeps the sending region next to the Supabase project.
      body: JSON.stringify({ name: DOMAIN, region: 'us-east-1' }),
    })
    console.log(`  created ${domain.id}`)
  }

  const records = domain.records ?? []
  if (!records.length) {
    console.error('Resend returned no DNS records; nothing to publish.')
    process.exit(1)
  }

  console.log(`\nPublishing ${records.length} records to Route53 zone ${HOSTED_ZONE_ID}:`)
  for (const r of records) {
    console.log(`  ${r.type.padEnd(5)} ${r.name}`)
  }
  applyToRoute53(records)

  if (DRY_RUN) return

  console.log('\nAsking Resend to verify...')
  await resend(`/domains/${domain.id}/verify`, { method: 'POST' })

  // DNS has to propagate before Resend can see the records, so poll rather
  // than reporting the immediate (still "pending") status as the outcome.
  for (let attempt = 1; attempt <= 10; attempt++) {
    await new Promise((r) => setTimeout(r, 15_000))
    const current = await resend<ResendDomain>(`/domains/${domain.id}`)
    console.log(`  attempt ${attempt}: ${current.status}`)
    if (current.status === 'verified') {
      console.log(`\n${DOMAIN} is verified. You can now send from @${DOMAIN}.`)
      return
    }
    if (current.status === 'failure') {
      console.error('\nVerification failed. Check the records in Route53 against the dashboard.')
      process.exit(1)
    }
  }

  console.log(
    `\nStill pending after ~2.5 minutes. This is normal — DNS can take longer.\n` +
      `Re-check with: pnpm tsx scripts/setup-resend.ts --domain ${DOMAIN}`
  )
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
