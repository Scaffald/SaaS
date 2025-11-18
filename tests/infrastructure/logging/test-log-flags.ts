import { readFileSync } from 'node:fs'

const HEADER_BYTES = 2048
const VERBOSE_PRAGMA = /@testlog\s+verbose\b/i
const truthyValues = new Set(['1', 'true', 'yes', 'y', 'on'])

const envVerbose = normalizeBooleanFlag(process.env.TEST_LOG_VERBOSE)
const pragmaCache = new Map<string, boolean>()

function normalizeBooleanFlag(value?: string | null): boolean {
  if (!value) {
    return false
  }
  const normalized = value.trim().toLowerCase()
  return truthyValues.has(normalized)
}

function readHeader(filepath: string): string {
  try {
    const contents = readFileSync(filepath, 'utf8')
    return contents.slice(0, HEADER_BYTES)
  } catch {
    return ''
  }
}

function hasVerbosePragma(filepath: string): boolean {
  const header = readHeader(filepath)
  return VERBOSE_PRAGMA.test(header)
}

export function isVerboseSuite(filepath?: string): boolean {
  if (envVerbose) {
    return true
  }
  if (!filepath) {
    return false
  }
  if (pragmaCache.has(filepath)) {
    return pragmaCache.get(filepath) ?? false
  }
  const flag = hasVerbosePragma(filepath)
  pragmaCache.set(filepath, flag)
  return flag
}

export function describeVerboseSource(filepath?: string): string | undefined {
  if (envVerbose) {
    return 'TEST_LOG_VERBOSE'
  }
  if (filepath && hasVerbosePragma(filepath)) {
    return '@testlog verbose pragma'
  }
  return undefined
}

