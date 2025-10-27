#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '../../..')

const navSource = fs.readFileSync(
  path.join(repoRoot, 'apps/expo/app/styleguide/_data/navigation.ts'),
  'utf8',
)

const pathMatches = [...navSource.matchAll(/path:\s*'([^']+)'/g)].map((match) => match[1])

let missing = []
for (const navPath of pathMatches) {
  const routePath = navPath.replace('/styleguide', '') || '/index'
  const normalized = routePath === '/index' ? 'index' : routePath.replace(/^\//, '')
  const filePath = path.join(repoRoot, 'apps/expo/app/styleguide', `${normalized}.tsx`)
  if (!fs.existsSync(filePath)) {
    missing.push(navPath)
  }
}

if (missing.length) {
  console.error('Missing styleguide pages:', missing)
  process.exit(1)
}

console.log('All styleguide navigation entries resolved successfully.')
