#!/usr/bin/env node

/**
 * Temporarily renders env() placeholders inside packages/supabase/config.toml
 * and runs a Supabase CLI command with the resolved configuration.
 *
 * Usage: node scripts/run-supabase-config.mjs <env> <supabase args ...>
 *
 * Examples:
 *   node scripts/run-supabase-config.mjs preview config push
 */

const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const dotenv = require('dotenv')

const [, , envName = 'local', ...supabaseArgs] = process.argv

if (supabaseArgs.length === 0) {
  console.error('Usage: node scripts/run-supabase-config.mjs <env> <supabase args...>')
  process.exit(1)
}

const envFileMap = {
  local: '.env',
  development: '.env',
  dev: '.env',
  preview: '.env.preview',
  staging: '.env.staging',
  production: '.env.production',
  prod: '.env.production',
}

const projectRoot = path.resolve(__dirname, '..')
const envFile = envFileMap[envName] || envName
const envPath = path.resolve(projectRoot, envFile)

if (!fs.existsSync(envPath)) {
  console.error(`Environment file not found for "${envName}": ${envPath}`)
  process.exit(1)
}

dotenv.config({ path: envPath })

const configPath = path.resolve(projectRoot, 'packages', 'supabase', 'config.toml')
if (!fs.existsSync(configPath)) {
  console.error(`Supabase config not found at ${configPath}`)
  process.exit(1)
}

const originalConfig = fs.readFileSync(configPath, 'utf8')

function escapeToml(value) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

let renderedConfig
try {
  renderedConfig = originalConfig.replace(/env\(([^)]+)\)/g, (_, varName) => {
    const trimmed = varName.trim()
    const value = process.env[trimmed]
    if (typeof value === 'undefined') {
      throw new Error(`Missing environment variable "${trimmed}" required by config.toml`)
    }
    return escapeToml(value)
  })
} catch (error) {
  console.error(error.message || error)
  process.exit(1)
}

fs.writeFileSync(configPath, renderedConfig, 'utf8')

const supabaseCmd = spawnSync('pnpx', ['supabase', '--workdir', 'packages', ...supabaseArgs], {
  stdio: 'inherit',
  env: {
    ...process.env,
  },
})

fs.writeFileSync(configPath, originalConfig, 'utf8')

if (supabaseCmd.error) {
  console.error(supabaseCmd.error)
  process.exit(1)
}

process.exit(supabaseCmd.status ?? 1)
