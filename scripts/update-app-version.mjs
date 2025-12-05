#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const expoPackagePath = path.join(projectRoot, 'apps/scaffald/package.json')

const SUPPORTED_LEVELS = new Set(['major', 'minor', 'patch'])

const parseLevel = () => {
  const levelArg = process.argv.find((arg) => arg.startsWith('--level='))
  const explicitLevel = levelArg?.split('=')[1]
  if (explicitLevel && SUPPORTED_LEVELS.has(explicitLevel)) {
    return explicitLevel
  }
  const shortFlagIndex = process.argv.findIndex((arg) => arg === '--level')
  if (shortFlagIndex >= 0) {
    const value = process.argv?.[shortFlagIndex + 1]
    if (value && SUPPORTED_LEVELS.has(value)) {
      return value
    }
  }
  return 'patch'
}

const bumpVersion = (version, level) => {
  const [rawMajor = '0', rawMinor = '0', rawPatch = '0'] = version.split('.')

  let major = Number.parseInt(rawMajor, 10)
  let minor = Number.parseInt(rawMinor, 10)
  let patch = Number.parseInt(rawPatch, 10)

  if (Number.isNaN(major) || Number.isNaN(minor) || Number.isNaN(patch)) {
    throw new Error(`Invalid semantic version "${version}"`)
  }

  switch (level) {
    case 'major':
      major += 1
      minor = 0
      patch = 0
      break
    case 'minor':
      minor += 1
      patch = 0
      break
    case 'patch':
    default:
      patch += 1
      break
  }

  return `${major}.${minor}.${patch}`
}

try {
  const packageJson = JSON.parse(readFileSync(expoPackagePath, 'utf8'))
  const currentVersion = packageJson.version ?? '1.0.0'
  const level = parseLevel()
  const nextVersion = bumpVersion(currentVersion, level)

  if (currentVersion === nextVersion) {
    console.log('[version] No change detected')
    process.exit(0)
  }

  packageJson.version = nextVersion
  writeFileSync(expoPackagePath, `${JSON.stringify(packageJson, null, 2)}\n`)
  console.log(`[version] Bumped scaffald-app ${level} version: ${currentVersion} → ${nextVersion}`)
} catch (error) {
  console.error('[version] Failed to update scaffald-app version')
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}

