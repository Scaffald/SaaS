#!/usr/bin/env tsx
/**
 * Invite a list of your own contacts to Scaffald (#1394, epic #1399).
 *
 *   pnpm invite-list --file ~/lists/crew.csv --as you@example.com --env dev            # dry run
 *   pnpm invite-list --file ~/lists/crew.csv --as you@example.com --env prod --send --limit 50
 *   pnpm invite-list --file ~/lists/crew.csv --as you@example.com --env prod --report
 *
 * Reads a CSV (Google Contacts / Outlook exports or a hand-made sheet; columns
 * are matched loosely: name or first/last, email, phone, tags, note), cleans
 * and de-duplicates it, and sorts every row into: new email, new phone,
 * already a member, yourself, already invited by you, duplicate, invalid.
 * Nothing is sent unless you pass --send.
 *
 * Sending goes through POST /v1/invites as the named inviter, so it uses the
 * same email, limits (50 per request, 200 per day) and tracking as the app,
 * with source `script:<file>`. NevarMail drops unsubscribed or bounced
 * addresses at send time (reported as `suppressed`); this script can't check
 * that in advance.
 *
 * Phone-only rows are NEVER texted by Scaffald (TCPA: texting numbers from a
 * contact list needs each person's written consent). With --send they get an
 * invite link, written to `<out>/<file>-links.csv` with a ready-to-send text
 * and an sms: link, for you to send from your own phone.
 *
 * Nobody on the list is added to the newsletter.
 *
 * Re-running is safe: anyone you have already invited is skipped. If NevarMail's
 * daily cap or the 200-a-day limit stops a run, run it again tomorrow.
 *
 * Flags:
 *   --file <csv>        required
 *   --as <email>        required: the inviter (must already have an account)
 *   --env <name>        local (default) | dev | preview | prod
 *   --send              actually invite (otherwise dry run)
 *   --limit <n>         invite at most n new rows this run
 *   --message <text>    personal note for rows without their own `note`
 *   --batch <n>         contacts per request (default 25, max 50)
 *   --delay-ms <n>      pause between requests (default 1500)
 *   --out <dir>         where CSVs go (default tmp/invite-list)
 *   --report            show what happened to this file's invites, no sending
 *   --api-base <url>    override the api base (e.g. http://127.0.0.1:8000/v1)
 *   --yes               skip the typed confirmation (not allowed for prod)
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, join, resolve } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  batches,
  classify,
  type ListRow,
  normalizeEmail,
  parseCsv,
  rowsToContacts,
  sourceFor,
  summarize,
  toCsv,
} from './invite-list/lib.ts'

type EnvName = 'local' | 'dev' | 'preview' | 'prod'

const argv = process.argv.slice(2)
const flag = (name: string) => {
  const i = argv.indexOf(`--${name}`)
  return i === -1 ? undefined : argv[i + 1]
}
const has = (name: string) => argv.includes(`--${name}`)

function die(message: string): never {
  console.error(`✗ ${message}`)
  process.exit(1)
}

// --- configuration ----------------------------------------------------------

function readEnvFile(file: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m) out[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
  }
  return out
}

function loadTarget(env: EnvName) {
  if (env === 'local') {
    const raw = execFileSync(
      'pnpm',
      ['exec', 'supabase', '--workdir', 'packages', 'status', '-o', 'env'],
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }
    )
    const vars: Record<string, string> = {}
    for (const line of raw.split('\n')) {
      const m = line.match(/^([A-Z_]+)="?(.*?)"?$/)
      if (m) vars[m[1]] = m[2]
    }
    return { url: vars.API_URL, anonKey: vars.ANON_KEY, serviceKey: vars.SERVICE_ROLE_KEY }
  }
  const file = { dev: '.env.dev', preview: '.env.preview', prod: '.env.production' }[env]
  let vars: Record<string, string>
  try {
    vars = readEnvFile(file)
  } catch {
    die(
      `${file} not found. Run from the repo root (it is gitignored; copy it from the main checkout).`
    )
  }
  return {
    url: vars.EXPO_PUBLIC_SUPABASE_URL,
    anonKey: vars.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    serviceKey: vars.SUPABASE_SERVICE_ROLE_KEY,
  }
}

// --- database lookups (service role) ---------------------------------------

async function inChunks<T>(items: T[], size: number, fn: (part: T[]) => Promise<void>) {
  for (let i = 0; i < items.length; i += size) await fn(items.slice(i, i + size))
}

async function memberEmails(admin: SupabaseClient, emails: string[]): Promise<Set<string>> {
  const out = new Set<string>()
  await inChunks(emails, 200, async (part) => {
    const { data, error } = await admin.schema('core').rpc('user_ids_by_email', { p_emails: part })
    if (error)
      die(`member lookup failed: ${error.message} (is migration 397 applied on this environment?)`)
    for (const r of (data ?? []) as Array<{ email: string }>) out.add(r.email)
  })
  return out
}

async function alreadyInvited(
  admin: SupabaseClient,
  inviterId: string,
  emails: string[],
  phones: string[]
) {
  const invitedEmails = new Set<string>()
  const invitedPhones = new Set<string>()
  await inChunks(emails, 200, async (part) => {
    const { data, error } = await admin
      .schema('core')
      .from('generic_invitations')
      .select('invitee_email')
      .eq('inviter_id', inviterId)
      .in('invitee_email', part)
    if (error) die(`invite lookup failed: ${error.message}`)
    for (const r of data ?? []) if (r.invitee_email) invitedEmails.add(r.invitee_email)
  })
  await inChunks(phones, 200, async (part) => {
    const { data, error } = await admin
      .schema('core')
      .from('generic_invitations')
      .select('invitee_phone')
      .eq('inviter_id', inviterId)
      .in('invitee_phone', part)
    if (error) die(`invite lookup failed: ${error.message}`)
    for (const r of data ?? []) if (r.invitee_phone) invitedPhones.add(r.invitee_phone)
  })
  return { invitedEmails, invitedPhones }
}

async function inviterId(admin: SupabaseClient, email: string): Promise<string> {
  const { data: ids } = await admin.schema('core').rpc('user_ids_by_email', { p_emails: [email] })
  const id = (ids as Array<{ user_id: string }> | null)?.[0]?.user_id
  if (!id) die(`${email} has no Scaffald account on this environment.`)
  return id
}

/**
 * A session for the inviter, only when sending: an admin magic link redeemed
 * on the spot, with no password and nothing mailed to the inviter. Dry runs
 * and reports never sign in as anyone.
 */
async function inviterToken(
  admin: SupabaseClient,
  url: string,
  anonKey: string,
  email: string
): Promise<string> {
  const { data: link, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
  if (error || !link) die(`could not mint a session for ${email}: ${error?.message}`)
  const client = createClient(url, anonKey, { auth: { persistSession: false } })
  const { data: s, error: otpError } = await client.auth.verifyOtp({
    type: 'magiclink',
    token_hash: link.properties.hashed_token,
  })
  if (otpError || !s.session) die(`could not sign in as ${email}: ${otpError?.message}`)
  return s.session.access_token
}

// --- report -------------------------------------------------------------------

async function report(
  admin: SupabaseClient,
  inviterId: string,
  source: string,
  outDir: string,
  stem: string
) {
  const { data: invites, error } = await admin
    .schema('core')
    .from('generic_invitations')
    .select(
      'id, invitee_name, invitee_email, invitee_phone, channel, status, created_at, email_opened_at, email_clicked_at, metadata'
    )
    .eq('inviter_id', inviterId)
    .eq('source', source)
    .order('created_at')
  if (error) die(`report failed: ${error.message}`)
  const ids = (invites ?? []).map((i) => i.id)
  const joined = new Map<string, { onboarded_at: string | null }>()
  await inChunks(ids, 200, async (part) => {
    const { data } = await admin
      .schema('core')
      .from('referral_attributions')
      .select('invitation_id, onboarded_at')
      .in('invitation_id', part)
    for (const a of data ?? []) joined.set(a.invitation_id, a)
  })
  const rows = (invites ?? []).map((i) => {
    const a = joined.get(i.id)
    return {
      name: i.invitee_name,
      email: i.invitee_email,
      phone: i.invitee_phone,
      channel: i.channel,
      status: a?.onboarded_at ? 'onboarded' : a ? 'joined' : i.status,
      sent_at: i.created_at,
      opened_at: i.email_opened_at,
      clicked_at: i.email_clicked_at,
      delivery_failure:
        (i.metadata as { delivery_failure?: { type?: string } } | null)?.delivery_failure?.type ??
        '',
    }
  })
  const counts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1
    return acc
  }, {})
  const file = join(outDir, `${stem}-report.csv`)
  writeFileSync(file, toCsv(Object.keys(rows[0] ?? { name: '' }), rows))
  console.log(`\n${rows.length} invites from ${source}:`, counts)
  console.log(
    `  opened: ${rows.filter((r) => r.opened_at).length}, clicked: ${rows.filter((r) => r.clicked_at).length}`
  )
  console.log(`  → ${file}`)
}

// --- main ---------------------------------------------------------------------

async function main() {
  const file = flag('file') ?? die('--file is required')
  const asEmail = normalizeEmail(flag('as')) ?? die('--as <inviter email> is required')
  const env = (flag('env') ?? 'local') as EnvName
  if (!['local', 'dev', 'preview', 'prod'].includes(env)) die(`unknown --env ${env}`)
  const send = has('send')
  const limit = flag('limit') ? Number(flag('limit')) : Number.POSITIVE_INFINITY
  const batchSize = Number(flag('batch') ?? 25)
  const delayMs = Number(flag('delay-ms') ?? 1500)
  const message = flag('message')?.slice(0, 500) ?? null
  const outDir = resolve(flag('out') ?? 'tmp/invite-list')
  const path = resolve(file.replace(/^~(?=\/)/, homedir()))
  const stem = basename(path).replace(/\.[^.]+$/, '')
  const source = sourceFor(path)

  const target = loadTarget(env)
  if (!target.url || !target.anonKey || !target.serviceKey)
    die(`missing Supabase URL or keys for ${env}`)
  const apiBase = (flag('api-base') ?? `${target.url}/functions/v1/api/v1`).replace(/\/+$/, '')
  const admin = createClient(target.url, target.serviceKey, { auth: { persistSession: false } })
  mkdirSync(outDir, { recursive: true })

  const inviter = { id: await inviterId(admin, asEmail) }
  console.log(`Inviter: ${asEmail} on ${env}  ·  source ${source}`)

  if (has('report')) {
    await report(admin, inviter.id, source, outDir, stem)
    return
  }

  const parsed = rowsToContacts(parseCsv(readFileSync(path, 'utf8')))
  const emails = parsed.rows.map((r) => r.email).filter((e): e is string => !!e)
  const phones = parsed.rows.map((r) => r.phone).filter((p): p is string => !!p)
  const [members, invited] = await Promise.all([
    memberEmails(admin, emails),
    alreadyInvited(admin, inviter.id, emails, phones),
  ])
  const rows = classify(parsed.rows, { inviterEmail: asEmail, members, ...invited })
  const counts = summarize(rows)

  console.log(`\n${path}: ${rows.length} rows`)
  console.table(counts)
  const todo = rows.filter(
    (r) => r.classification === 'new_email' || r.classification === 'new_phone'
  )
  const thisRun = todo.slice(0, limit)
  console.log(
    `To invite: ${todo.length} (${counts.new_email} by email, ${counts.new_phone} by your own text message)` +
      (thisRun.length < todo.length ? ` · this run: ${thisRun.length} (--limit)` : '')
  )

  const results = new Map<
    number,
    {
      status: string
      reason?: string
      invitationId?: string
      link?: string
      shareText?: string
      smsUrl?: string
    }
  >()

  if (!send) {
    writeOutputs(outDir, stem, rows, results)
    console.log('\nDry run: nothing sent. Add --send to invite.')
    return
  }
  if (thisRun.length === 0) {
    console.log('\nNothing new to invite.')
    return
  }

  if (env === 'prod' || !has('yes')) {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    const answer = await rl.question(
      `\nInvite ${thisRun.length} people from ${asEmail} on ${env}? Type ${thisRun.length} to confirm: `
    )
    rl.close()
    if (answer.trim() !== String(thisRun.length)) die('not confirmed; nothing sent')
  }

  const token = await inviterToken(admin, target.url, target.anonKey, asEmail)
  let emailStopped: string | null = null
  let stopped: string | null = null
  for (const batch of batches(thisRun, batchSize, message)) {
    if (stopped) break
    const sendable = batch.rows.filter((r) => !(r.email && emailStopped))
    for (const r of batch.rows)
      if (r.email && emailStopped) results.set(r.line, { status: 'not_sent', reason: emailStopped })
    if (!sendable.length) continue

    const res = await fetch(`${apiBase}/invites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: target.anonKey,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        contacts: sendable.map((r) => ({ name: r.name, email: r.email, phone: r.phone })),
        message: batch.message,
        source,
      }),
    })
    const body = (await res.json().catch(() => null)) as {
      results?: Array<Record<string, string> & { index: number }>
    } | null
    if (!res.ok || !body?.results) {
      stopped = `api ${res.status}`
      for (const r of sendable) results.set(r.line, { status: 'not_sent', reason: stopped })
      console.error(`✗ POST /invites answered ${res.status}; stopping.`)
      break
    }
    for (const r of body.results) {
      const row = sendable[r.index]
      results.set(row.line, {
        status: r.status,
        reason: r.reason,
        invitationId: r.invitationId,
        link: r.link,
        shareText: r.shareText,
        smsUrl: r.smsUrl,
      })
      if (r.reason === 'send_limit' || r.reason === 'email_not_configured') emailStopped = r.reason
      if (r.reason === 'daily_limit') stopped = 'daily_limit'
    }
    const done = [...results.values()]
    process.stdout.write(
      `\r  sent ${done.filter((d) => d.status === 'sent').length} · links ${done.filter((d) => d.status === 'ready').length} · skipped ${done.filter((d) => d.status === 'skipped').length} · failed ${done.filter((d) => d.status === 'failed').length}   `
    )
    await new Promise((r) => setTimeout(r, delayMs))
  }
  process.stdout.write('\n')

  writeOutputs(outDir, stem, rows, results)
  if (emailStopped === 'send_limit')
    console.log(
      'NevarMail daily sending cap reached: email rows left are marked not_sent. Re-run tomorrow.'
    )
  if (emailStopped === 'email_not_configured')
    console.log(
      'Email is not configured on this environment (NevarMail use case missing); email rows were not sent.'
    )
  if (stopped === 'daily_limit')
    console.log(
      'The 200-invites-a-day limit was reached. Re-run tomorrow; invited rows are skipped.'
    )
}

function writeOutputs(
  outDir: string,
  stem: string,
  rows: ListRow[],
  results: Map<
    number,
    {
      status: string
      reason?: string
      invitationId?: string
      link?: string
      shareText?: string
      smsUrl?: string
    }
  >
) {
  const resultsFile = join(outDir, `${stem}-results.csv`)
  writeFileSync(
    resultsFile,
    toCsv(
      [
        'line',
        'name',
        'email',
        'phone',
        'raw_email',
        'raw_phone',
        'tags',
        'classification',
        'status',
        'reason',
        'invitation_id',
        'link',
      ],
      rows.map((r) => {
        const res = results.get(r.line)
        return {
          line: r.line,
          name: r.name,
          email: r.email,
          phone: r.phone,
          raw_email: r.rawEmail,
          raw_phone: r.rawPhone,
          tags: r.tags,
          classification: r.classification,
          status: res?.status ?? (results.size ? 'not_attempted' : 'dry_run'),
          reason: res?.reason ?? '',
          invitation_id: res?.invitationId ?? '',
          link: res?.link ?? '',
        }
      })
    )
  )
  const links = rows
    .map((r) => ({ r, res: results.get(r.line) }))
    .filter(({ res }) => res?.status === 'ready')
    .map(({ r, res }) => ({
      name: r.name,
      phone: r.phone,
      link: res?.link,
      text: res?.shareText,
      sms_url: res?.smsUrl,
    }))
  console.log(`  → ${resultsFile}`)
  if (links.length) {
    const linksFile = join(outDir, `${stem}-links.csv`)
    writeFileSync(linksFile, toCsv(['name', 'phone', 'link', 'text', 'sms_url'], links))
    console.log(`  → ${linksFile}  (${links.length} to text from your own phone)`)
  }
}

main().catch((e) => die((e as Error).message))
