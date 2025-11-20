import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

type TranslationRecord = Record<string, unknown>

type LocaleDefinition = {
  code: string
  data: TranslationRecord
}

type DuplicateReport = {
  locale: string
  keys: string[]
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const loadLocaleData = (code: string): TranslationRecord => {
  const localeDir = path.resolve(__dirname, '..', code)
  const files = fs.readdirSync(localeDir).filter((file) => file.endsWith('.json'))
  const record: TranslationRecord = {}

  for (const file of files) {
    const namespace = path.basename(file, '.json')
    const filePath = path.join(localeDir, file)
    const contents = fs.readFileSync(filePath, 'utf8')
    record[namespace] = JSON.parse(contents)
  }

  return record
}

const traverseKeys = (
  node: unknown,
  prefix: string,
  seen: Set<string>,
  duplicates: Set<string>
) => {
  if (node === null || typeof node !== 'object') {
    return
  }

  for (const [key, value] of Object.entries(node as TranslationRecord)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (seen.has(fullKey)) {
      duplicates.add(fullKey)
    } else {
      seen.add(fullKey)
    }
    traverseKeys(value, fullKey, seen, duplicates)
  }
}

const findDuplicateKeys = (data: TranslationRecord): string[] => {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  traverseKeys(data, '', seen, duplicates)
  return Array.from(duplicates).sort()
}

const locales: LocaleDefinition[] = [
  { code: 'en', data: loadLocaleData('en') },
  { code: 'es', data: loadLocaleData('es') },
  { code: 'fr', data: loadLocaleData('fr') },
]

const reports: DuplicateReport[] = []

for (const locale of locales) {
  const duplicateKeys = findDuplicateKeys(locale.data)
  if (duplicateKeys.length > 0) {
    reports.push({
      locale: locale.code,
      keys: duplicateKeys,
    })
  }
}

if (reports.length > 0) {
  console.error('❌ Duplicate translation keys detected:')
for (const report of reports) {
  console.error(`\nLocale: ${report.locale}`)
  for (const key of report.keys) {
    console.error(`  - ${key}`)
  }
}
  process.exit(1)
}

console.log('✅ No duplicate translation keys found.')

