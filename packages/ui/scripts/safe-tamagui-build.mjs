#!/usr/bin/env node

import { cp, mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const packageRoot = path.resolve(__dirname, '..')
const sourceDir = path.join(packageRoot, 'src')
const buildRoot = path.join(packageRoot, '.tamagui-build')
const tempSourceDir = path.join(buildRoot, 'src')

const parseArgs = () => {
  const args = process.argv.slice(2)
  const flags = new Map()
  const positional = []

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (!arg.startsWith('--')) {
      positional.push(arg)
      continue
    }

    const next = args[index + 1]
    if (next && !next.startsWith('--')) {
      flags.set(arg, next)
      index += 1
    } else {
      flags.set(arg, true)
    }
  }

  return { flags, positional }
}

async function prepareWorkspace() {
  await rm(buildRoot, { recursive: true, force: true })
  await mkdir(buildRoot, { recursive: true })
  await cp(sourceDir, tempSourceDir, { recursive: true })
}

async function runBuild({ flags }) {
  const { default: cliUtils } = await import('@tamagui/cli/dist/utils.cjs')
  const { default: buildModule } = await import('@tamagui/cli/dist/build.cjs')

  const debugFlag = Boolean(flags.get('--debug'))
  const verboseFlag = Boolean(flags.get('--verbose'))
  const debug = debugFlag ? (verboseFlag ? 'verbose' : true) : false

  const options = await cliUtils.getOptions({ debug })

  await buildModule.build({
    ...options,
    dir: tempSourceDir,
    include: flags.get('--include'),
    exclude: flags.get('--exclude'),
    target: (flags.get('--target') ?? 'web'),
  })
}

async function main() {
  const parsed = parseArgs()

  await prepareWorkspace()
  await runBuild(parsed)

  console.log('')
  console.log('✅ Tamagui build output located at:')
  console.log(`   ${tempSourceDir}`)
  console.log('   Original source files remain untouched.')
}

main().catch((error) => {
  console.error('❌ Tamagui build failed:', error.message)
  process.exit(1)
})

