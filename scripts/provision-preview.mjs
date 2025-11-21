#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { randomBytes } from 'node:crypto'
import { spawnSync } from 'node:child_process'

const envName = process.argv[2] || 'preview'
const runId = process.env.RUN_ID || randomBytes(4).toString('hex')
const pnpmEnvScript = `env-${envName}`

const log = (message) => console.log(`\n[provision:${envName}] ${message}`)

const run = (cmd, args = []) => {
  const result = spawnSync(cmd, args, { stdio: 'inherit', env: process.env })
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} failed with code ${result.status}`)
  }
}

const ensureArtifactsFolder = () => {
  const artifactsDir = resolve('artifacts')
  mkdirSync(artifactsDir, { recursive: true })
  const summaryPath = join(artifactsDir, `provision-${envName}.log`)
  writeFileSync(summaryPath, `Provision started for ${envName} with run ${runId}\n`)
  return summaryPath
}

try {
  log('Ensuring migrations are applied to linked Supabase project')
  run('pnpm', [pnpmEnvScript, 'pnpx', 'supabase', '--workdir', 'packages', 'db', 'push', '--linked'])

  log('Seeding anonymized preview-safe data set')
  run('pnpm', [pnpmEnvScript, 'pnpm', '--filter', '@app/supabase', 'seed'])

  log('Generating per-run accounts for e2e suites')
  run('pnpm', [pnpmEnvScript, 'pnpx', 'tsx', 'packages/supabase/scripts/create-run-accounts.ts', '--run-id', runId])

  const summaryPath = ensureArtifactsFolder()
  log(`Provisioning complete. Run summary recorded at ${summaryPath}`)
} catch (error) {
  console.error(`Provisioning failed: ${error.message}`)
  process.exit(1)
}
