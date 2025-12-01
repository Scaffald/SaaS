#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const expoPackagePath = path.join(projectRoot, 'apps/expo/package.json')

const newVersion = process.env.npm_package_version || process.argv[2]

if (!newVersion) {
  console.error('Usage: node update-version.mjs <version>')
  process.exit(1)
}

try {
  const packageJson = JSON.parse(readFileSync(expoPackagePath, 'utf8'))
  packageJson.version = newVersion
  writeFileSync(expoPackagePath, `${JSON.stringify(packageJson, null, 2)}\n`)
  console.log(`Updated apps/expo/package.json to version ${newVersion}`)
} catch (error) {
  console.error('Failed to update version:', error.message)
  process.exit(1)
}

