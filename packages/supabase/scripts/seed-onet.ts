import { once } from 'node:events'
import { createReadStream, existsSync } from 'node:fs'
import { mkdir, readdir } from 'node:fs/promises'
import path from 'node:path'
import { createInterface } from 'node:readline'
import type { Duplex } from 'node:stream'
import { setTimeout as delay } from 'node:timers/promises'
import { parse } from 'csv-parse'
import { Pool } from 'pg'
import { from as copyFrom } from 'pg-copy-streams'

type ColumnMapping = {
  header: string
  column: string
  transform?: (value: string) => string | number | null
}

type TableConfig = {
  table: string
  file: string
  columns: ColumnMapping[]
}

const PROJECT_ROOT = (() => {
  const cwd = process.cwd()
  if (cwd.endsWith(path.join('packages', 'supabase'))) {
    return path.resolve(cwd, '..', '..')
  }
  return cwd
})()

const SOURCE_ROOT =
  process.env.ONET_SOURCE_DIR ?? path.join(PROJECT_ROOT, 'packages/supabase/seed-data/onet/raw')
const FORCE_RELOAD = process.env.ONET_FORCE_RELOAD === '1'
const DEFAULT_TABLE_PAUSE_MS = 1000
const parsedPauseMs = Number.parseInt(process.env.ONET_TABLE_PAUSE_MS ?? '', 10)
const TABLE_PAUSE_MS = Number.isNaN(parsedPauseMs) ? DEFAULT_TABLE_PAUSE_MS : parsedPauseMs
const COPY_NULL_VALUE = '\\N'

const TABLE_LOAD_ORDER: TableConfig[] = [
  {
    table: 'content_model_reference',
    file: 'Content Model Reference.txt',
    columns: [
      { header: 'Element ID', column: 'element_id', transform: asText },
      { header: 'Element Name', column: 'element_name', transform: asText },
      { header: 'Description', column: 'description', transform: asText },
    ],
  },
  {
    table: 'scales_reference',
    file: 'Scales Reference.txt',
    columns: [
      { header: 'Scale ID', column: 'scale_id', transform: asText },
      { header: 'Scale Name', column: 'scale_name', transform: asText },
      { header: 'Minimum', column: 'minimum', transform: asInt },
      { header: 'Maximum', column: 'maximum', transform: asInt },
    ],
  },
  {
    table: 'occupation_data',
    file: 'Occupation Data.txt',
    columns: [
      { header: 'O*NET-SOC Code', column: 'onetsoc_code', transform: asText },
      { header: 'Title', column: 'title', transform: asText },
      { header: 'Description', column: 'description', transform: asText },
    ],
  },
  {
    table: 'iwa_reference',
    file: 'IWA Reference.txt',
    columns: [
      { header: 'Element ID', column: 'element_id', transform: asText },
      { header: 'IWA ID', column: 'iwa_id', transform: asText },
      { header: 'IWA Title', column: 'iwa_title', transform: asText },
    ],
  },
  {
    table: 'dwa_reference',
    file: 'DWA Reference.txt',
    columns: [
      { header: 'Element ID', column: 'element_id', transform: asText },
      { header: 'IWA ID', column: 'iwa_id', transform: asText },
      { header: 'DWA ID', column: 'dwa_id', transform: asText },
      { header: 'DWA Title', column: 'dwa_title', transform: asText },
    ],
  },
  {
    table: 'job_zone_reference',
    file: 'Job Zone Reference.txt',
    columns: [
      { header: 'Job Zone', column: 'job_zone', transform: asInt },
      { header: 'Name', column: 'name', transform: asText },
      { header: 'Experience', column: 'experience', transform: asText },
      { header: 'Education', column: 'education', transform: asText },
      { header: 'Job Training', column: 'job_training', transform: asText },
      { header: 'Examples', column: 'examples', transform: asText },
      { header: 'SVP Range', column: 'svp_range', transform: asText },
    ],
  },
  {
    table: 'job_zones',
    file: 'Job Zones.txt',
    columns: [
      { header: 'O*NET-SOC Code', column: 'onetsoc_code', transform: asText },
      { header: 'Job Zone', column: 'job_zone', transform: asInt },
      { header: 'Date', column: 'date_updated', transform: asMonthYear },
      { header: 'Domain Source', column: 'domain_source', transform: asText },
    ],
  },
  {
    table: 'abilities',
    file: 'Abilities.txt',
    columns: [
      { header: 'O*NET-SOC Code', column: 'onetsoc_code', transform: asText },
      { header: 'Element ID', column: 'element_id', transform: asText },
      { header: 'Scale ID', column: 'scale_id', transform: asText },
      { header: 'Data Value', column: 'data_value', transform: asDecimal },
      { header: 'N', column: 'n', transform: asInt },
      { header: 'Standard Error', column: 'standard_error', transform: asDecimal },
      { header: 'Lower CI Bound', column: 'lower_ci_bound', transform: asDecimal },
      { header: 'Upper CI Bound', column: 'upper_ci_bound', transform: asDecimal },
      {
        header: 'Recommend Suppress',
        column: 'recommend_suppress',
        transform: asFlag,
      },
      {
        header: 'Not Relevant',
        column: 'not_relevant',
        transform: asFlag,
      },
      { header: 'Date', column: 'date_updated', transform: asMonthYear },
      { header: 'Domain Source', column: 'domain_source', transform: asText },
    ],
  },
  {
    table: 'skills',
    file: 'Skills.txt',
    columns: [
      { header: 'O*NET-SOC Code', column: 'onetsoc_code', transform: asText },
      { header: 'Element ID', column: 'element_id', transform: asText },
      { header: 'Scale ID', column: 'scale_id', transform: asText },
      { header: 'Data Value', column: 'data_value', transform: asDecimal },
      { header: 'N', column: 'n', transform: asInt },
      { header: 'Standard Error', column: 'standard_error', transform: asDecimal },
      { header: 'Lower CI Bound', column: 'lower_ci_bound', transform: asDecimal },
      { header: 'Upper CI Bound', column: 'upper_ci_bound', transform: asDecimal },
      {
        header: 'Recommend Suppress',
        column: 'recommend_suppress',
        transform: asFlag,
      },
      {
        header: 'Not Relevant',
        column: 'not_relevant',
        transform: asFlag,
      },
      { header: 'Date', column: 'date_updated', transform: asMonthYear },
      { header: 'Domain Source', column: 'domain_source', transform: asText },
    ],
  },
  {
    table: 'knowledge',
    file: 'Knowledge.txt',
    columns: [
      { header: 'O*NET-SOC Code', column: 'onetsoc_code', transform: asText },
      { header: 'Element ID', column: 'element_id', transform: asText },
      { header: 'Scale ID', column: 'scale_id', transform: asText },
      { header: 'Data Value', column: 'data_value', transform: asDecimal },
      { header: 'N', column: 'n', transform: asInt },
      { header: 'Standard Error', column: 'standard_error', transform: asDecimal },
      { header: 'Lower CI Bound', column: 'lower_ci_bound', transform: asDecimal },
      { header: 'Upper CI Bound', column: 'upper_ci_bound', transform: asDecimal },
      {
        header: 'Recommend Suppress',
        column: 'recommend_suppress',
        transform: asFlag,
      },
      {
        header: 'Not Relevant',
        column: 'not_relevant',
        transform: asFlag,
      },
      { header: 'Date', column: 'date_updated', transform: asMonthYear },
      { header: 'Domain Source', column: 'domain_source', transform: asText },
    ],
  },
  {
    table: 'work_activities',
    file: 'Work Activities.txt',
    columns: [
      { header: 'O*NET-SOC Code', column: 'onetsoc_code', transform: asText },
      { header: 'Element ID', column: 'element_id', transform: asText },
      { header: 'Scale ID', column: 'scale_id', transform: asText },
      { header: 'Data Value', column: 'data_value', transform: asDecimal },
      { header: 'N', column: 'n', transform: asInt },
      { header: 'Standard Error', column: 'standard_error', transform: asDecimal },
      { header: 'Lower CI Bound', column: 'lower_ci_bound', transform: asDecimal },
      { header: 'Upper CI Bound', column: 'upper_ci_bound', transform: asDecimal },
      {
        header: 'Recommend Suppress',
        column: 'recommend_suppress',
        transform: asFlag,
      },
      {
        header: 'Not Relevant',
        column: 'not_relevant',
        transform: asFlag,
      },
      { header: 'Date', column: 'date_updated', transform: asMonthYear },
      { header: 'Domain Source', column: 'domain_source', transform: asText },
    ],
  },
  {
    table: 'work_styles',
    file: 'Work Styles.txt',
    columns: [
      { header: 'O*NET-SOC Code', column: 'onetsoc_code', transform: asText },
      { header: 'Element ID', column: 'element_id', transform: asText },
      { header: 'Scale ID', column: 'scale_id', transform: asText },
      { header: 'Data Value', column: 'data_value', transform: asDecimal },
      { header: 'N', column: 'n', transform: asInt },
      { header: 'Standard Error', column: 'standard_error', transform: asDecimal },
      { header: 'Lower CI Bound', column: 'lower_ci_bound', transform: asDecimal },
      { header: 'Upper CI Bound', column: 'upper_ci_bound', transform: asDecimal },
      {
        header: 'Recommend Suppress',
        column: 'recommend_suppress',
        transform: asFlag,
      },
      { header: 'Date', column: 'date_updated', transform: asMonthYear },
      { header: 'Domain Source', column: 'domain_source', transform: asText },
    ],
  },
  {
    table: 'work_values',
    file: 'Work Values.txt',
    columns: [
      { header: 'O*NET-SOC Code', column: 'onetsoc_code', transform: asText },
      { header: 'Element ID', column: 'element_id', transform: asText },
      { header: 'Scale ID', column: 'scale_id', transform: asText },
      { header: 'Data Value', column: 'data_value', transform: asDecimal },
      { header: 'Date', column: 'date_updated', transform: asMonthYear },
      { header: 'Domain Source', column: 'domain_source', transform: asText },
    ],
  },
  {
    table: 'interests',
    file: 'Interests.txt',
    columns: [
      { header: 'O*NET-SOC Code', column: 'onetsoc_code', transform: asText },
      { header: 'Element ID', column: 'element_id', transform: asText },
      { header: 'Scale ID', column: 'scale_id', transform: asText },
      { header: 'Data Value', column: 'data_value', transform: asDecimal },
      { header: 'Date', column: 'date_updated', transform: asMonthYear },
      { header: 'Domain Source', column: 'domain_source', transform: asText },
    ],
  },
  {
    table: 'ete_categories',
    file: 'Education, Training, and Experience Categories.txt',
    columns: [
      { header: 'Element ID', column: 'element_id', transform: asText },
      { header: 'Scale ID', column: 'scale_id', transform: asText },
      { header: 'Category', column: 'category', transform: asInt },
      {
        header: 'Category Description',
        column: 'category_description',
        transform: asText,
      },
    ],
  },
  {
    table: 'education_training_experience',
    file: 'Education, Training, and Experience.txt',
    columns: [
      { header: 'O*NET-SOC Code', column: 'onetsoc_code', transform: asText },
      { header: 'Element ID', column: 'element_id', transform: asText },
      { header: 'Scale ID', column: 'scale_id', transform: asText },
      { header: 'Category', column: 'category', transform: asInt },
      { header: 'Data Value', column: 'data_value', transform: asDecimal },
      { header: 'N', column: 'n', transform: asInt },
      { header: 'Standard Error', column: 'standard_error', transform: asDecimal },
      { header: 'Lower CI Bound', column: 'lower_ci_bound', transform: asDecimal },
      { header: 'Upper CI Bound', column: 'upper_ci_bound', transform: asDecimal },
      {
        header: 'Recommend Suppress',
        column: 'recommend_suppress',
        transform: asFlag,
      },
      { header: 'Date', column: 'date_updated', transform: asMonthYear },
      { header: 'Domain Source', column: 'domain_source', transform: asText },
    ],
  },
  {
    table: 'work_context_categories',
    file: 'Work Context Categories.txt',
    columns: [
      { header: 'Element ID', column: 'element_id', transform: asText },
      { header: 'Scale ID', column: 'scale_id', transform: asText },
      { header: 'Category', column: 'category', transform: asInt },
      {
        header: 'Category Description',
        column: 'category_description',
        transform: asText,
      },
    ],
  },
  {
    table: 'work_context',
    file: 'Work Context.txt',
    columns: [
      { header: 'O*NET-SOC Code', column: 'onetsoc_code', transform: asText },
      { header: 'Element ID', column: 'element_id', transform: asText },
      { header: 'Scale ID', column: 'scale_id', transform: asText },
      { header: 'Category', column: 'category', transform: asInt },
      { header: 'Data Value', column: 'data_value', transform: asDecimal },
      { header: 'N', column: 'n', transform: asInt },
      { header: 'Standard Error', column: 'standard_error', transform: asDecimal },
      { header: 'Lower CI Bound', column: 'lower_ci_bound', transform: asDecimal },
      { header: 'Upper CI Bound', column: 'upper_ci_bound', transform: asDecimal },
      {
        header: 'Recommend Suppress',
        column: 'recommend_suppress',
        transform: asFlag,
      },
      {
        header: 'Not Relevant',
        column: 'not_relevant',
        transform: asFlag,
      },
      { header: 'Date', column: 'date_updated', transform: asMonthYear },
      { header: 'Domain Source', column: 'domain_source', transform: asText },
    ],
  },
  {
    table: 'task_categories',
    file: 'Task Categories.txt',
    columns: [
      { header: 'Scale ID', column: 'scale_id', transform: asText },
      { header: 'Category', column: 'category', transform: asInt },
      {
        header: 'Category Description',
        column: 'category_description',
        transform: asText,
      },
    ],
  },
  {
    table: 'task_statements',
    file: 'Task Statements.txt',
    columns: [
      { header: 'O*NET-SOC Code', column: 'onetsoc_code', transform: asText },
      { header: 'Task ID', column: 'task_id', transform: asBigInt },
      { header: 'Task', column: 'task', transform: asText },
      { header: 'Task Type', column: 'task_type', transform: asText },
      {
        header: 'Incumbents Responding',
        column: 'incumbents_responding',
        transform: asInt,
      },
      { header: 'Date', column: 'date_updated', transform: asMonthYear },
      { header: 'Domain Source', column: 'domain_source', transform: asText },
    ],
  },
  {
    table: 'task_ratings',
    file: 'Task Ratings.txt',
    columns: [
      { header: 'O*NET-SOC Code', column: 'onetsoc_code', transform: asText },
      { header: 'Task ID', column: 'task_id', transform: asBigInt },
      { header: 'Scale ID', column: 'scale_id', transform: asText },
      { header: 'Category', column: 'category', transform: asInt },
      { header: 'Data Value', column: 'data_value', transform: asDecimal },
      { header: 'N', column: 'n', transform: asInt },
      { header: 'Standard Error', column: 'standard_error', transform: asDecimal },
      { header: 'Lower CI Bound', column: 'lower_ci_bound', transform: asDecimal },
      { header: 'Upper CI Bound', column: 'upper_ci_bound', transform: asDecimal },
      {
        header: 'Recommend Suppress',
        column: 'recommend_suppress',
        transform: asFlag,
      },
      { header: 'Date', column: 'date_updated', transform: asMonthYear },
      { header: 'Domain Source', column: 'domain_source', transform: asText },
    ],
  },
  {
    table: 'tasks_to_dwas',
    file: 'Tasks to DWAs.txt',
    columns: [
      { header: 'O*NET-SOC Code', column: 'onetsoc_code', transform: asText },
      { header: 'Task ID', column: 'task_id', transform: asBigInt },
      { header: 'DWA ID', column: 'dwa_id', transform: asText },
      { header: 'Date', column: 'date_updated', transform: asMonthYear },
      { header: 'Domain Source', column: 'domain_source', transform: asText },
    ],
  },
  {
    table: 'unspsc_reference',
    file: 'UNSPSC Reference.txt',
    columns: [
      { header: 'Commodity Code', column: 'commodity_code', transform: asBigInt },
      {
        header: 'Commodity Title',
        column: 'commodity_title',
        transform: asText,
      },
      { header: 'Class Code', column: 'class_code', transform: asBigInt },
      { header: 'Class Title', column: 'class_title', transform: asText },
      { header: 'Family Code', column: 'family_code', transform: asBigInt },
      { header: 'Family Title', column: 'family_title', transform: asText },
      { header: 'Segment Code', column: 'segment_code', transform: asBigInt },
      { header: 'Segment Title', column: 'segment_title', transform: asText },
    ],
  },
  {
    table: 'tools_used',
    file: 'Tools Used.txt',
    columns: [
      { header: 'O*NET-SOC Code', column: 'onetsoc_code', transform: asText },
      { header: 'Example', column: 'example', transform: asText },
      { header: 'Commodity Code', column: 'commodity_code', transform: asBigInt },
    ],
  },
  {
    table: 'technology_skills',
    file: 'Technology Skills.txt',
    columns: [
      { header: 'O*NET-SOC Code', column: 'onetsoc_code', transform: asText },
      { header: 'Example', column: 'example', transform: asText },
      { header: 'Commodity Code', column: 'commodity_code', transform: asBigInt },
      { header: 'Hot Technology', column: 'hot_technology', transform: asFlag },
      { header: 'In Demand', column: 'in_demand', transform: asFlag },
    ],
  },
  {
    table: 'alternate_titles',
    file: 'Alternate Titles.txt',
    columns: [
      { header: 'O*NET-SOC Code', column: 'onetsoc_code', transform: asText },
      { header: 'Alternate Title', column: 'alternate_title', transform: asText },
      { header: 'Short Title', column: 'short_title', transform: asText },
      { header: 'Source(s)', column: 'sources', transform: asText },
    ],
  },
  {
    table: 'sample_of_reported_titles',
    file: 'Sample of Reported Titles.txt',
    columns: [
      { header: 'O*NET-SOC Code', column: 'onetsoc_code', transform: asText },
      { header: 'Reported Job Title', column: 'reported_job_title', transform: asText },
      {
        header: 'Shown in My Next Move',
        column: 'shown_in_my_next_move',
        transform: asFlag,
      },
    ],
  },
  {
    table: 'occupation_level_metadata',
    file: 'Occupation Level Metadata.txt',
    columns: [
      { header: 'O*NET-SOC Code', column: 'onetsoc_code', transform: asText },
      { header: 'Item', column: 'item', transform: asText },
      { header: 'Response', column: 'response', transform: asText },
      { header: 'N', column: 'n', transform: asInt },
      { header: 'Percent', column: 'percent', transform: asDecimal },
      { header: 'Date', column: 'date_updated', transform: asMonthYear },
    ],
  },
  {
    table: 'related_occupations',
    file: 'Related Occupations.txt',
    columns: [
      { header: 'O*NET-SOC Code', column: 'onetsoc_code', transform: asText },
      {
        header: 'Related O*NET-SOC Code',
        column: 'related_onetsoc_code',
        transform: asText,
      },
      {
        header: 'Relatedness Tier',
        column: 'relatedness_tier',
        transform: asText,
      },
      { header: 'Index', column: 'related_index', transform: asInt },
    ],
  },
]

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL must be set to seed O*NET data.')
  }

  await ensureSourceDirectory()

  const sentinelConfig = TABLE_LOAD_ORDER.find((config) => config.table === 'occupation_data')

  if (!sentinelConfig) {
    throw new Error('Missing sentinel configuration for onet.occupation_data.')
  }

  const sentinelFilePath = path.join(SOURCE_ROOT, sentinelConfig.file)
  if (!existsSync(sentinelFilePath)) {
    throw new Error(`Missing expected file: ${sentinelFilePath}`)
  }

  const expectedOccupationRows = await countFileRows(sentinelFilePath)
  const pool = new Pool({ connectionString: databaseUrl })

  try {
    const existingOccupationRows = await getTableRowCount(pool, sentinelConfig.table)

    if (
      !FORCE_RELOAD &&
      expectedOccupationRows > 0 &&
      existingOccupationRows === expectedOccupationRows
    ) {
      console.log(
        `ℹ️  onet.${sentinelConfig.table} already has ${existingOccupationRows.toLocaleString()} rows. Set ONET_FORCE_RELOAD=1 to force reseed.`
      )
      return
    }

    if (existingOccupationRows > 0) {
      console.log(
        `ℹ️  Existing O*NET data detected (${existingOccupationRows.toLocaleString()} rows). Replacing with new seed.`
      )
    }

    const allTables = TABLE_LOAD_ORDER.map((config) => config.table)
    await truncateTables(pool, allTables)

    for (const [index, config] of TABLE_LOAD_ORDER.entries()) {
      await loadTable(pool, config)
      if (TABLE_PAUSE_MS > 0 && index < TABLE_LOAD_ORDER.length - 1) {
        await delay(TABLE_PAUSE_MS)
      }
    }

    console.log('✅ O*NET seed complete')
  } finally {
    await pool.end()
  }
}

async function ensureSourceDirectory() {
  if (!existsSync(SOURCE_ROOT)) {
    await mkdir(SOURCE_ROOT, { recursive: true })
  }
  const files = await readdir(SOURCE_ROOT)
  if (files.length === 0) {
    console.warn(
      `ℹ️  No files found in ${SOURCE_ROOT}. Place extracted db_30_0_text files or provide ONET_SOURCE_DIR.`
    )
  }
}

async function truncateTables(pool: Pool, tables: string[]) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const tableList = tables.map((table) => `onet.${table}`).join(', ')
    await client.query(`TRUNCATE TABLE ${tableList} CASCADE;`)
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

async function getTableRowCount(pool: Pool, table: string): Promise<number> {
  const result = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::bigint AS count FROM onet.${table};`
  )
  const rawCount = result.rows[0]?.count
  if (rawCount === undefined) {
    throw new Error(`Failed to retrieve row count for onet.${table}`)
  }
  return Number.parseInt(rawCount, 10)
}

async function countFileRows(filePath: string): Promise<number> {
  const stream = createReadStream(filePath)
  const reader = createInterface({
    input: stream,
    crlfDelay: Infinity,
  })

  let count = 0
  let isHeader = true

  try {
    for await (const line of reader) {
      if (isHeader) {
        isHeader = false
        continue
      }
      if (line.length === 0) {
        continue
      }
      count += 1
    }
  } finally {
    reader.close()
  }

  return count
}

function buildCopyCommand(config: TableConfig): string {
  const columnList = config.columns.map((column) => column.column).join(', ')
  // QUOTE ' with default ESCAPE (same as quote): double single-quotes in data for literal '
  return `COPY onet.${config.table} (${columnList}) FROM STDIN WITH (FORMAT csv, DELIMITER E'\\t', NULL '${COPY_NULL_VALUE}', QUOTE '''')`
}

async function writeCopyRow(stream: Duplex, row: (string | number | null)[]): Promise<void> {
  const formattedRow = formatCopyRow(row)
  if (!stream.write(formattedRow)) {
    await once(stream, 'drain')
  }
}

function formatCopyRow(row: (string | number | null)[]): string {
  const formattedValues = row.map((value) => formatCopyValue(value))
  return `${formattedValues.join('\t')}\n`
}

function formatCopyValue(value: string | number | null): string {
  if (value === null) {
    return COPY_NULL_VALUE
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error('Encountered non-finite number during COPY')
    }
    return value.toString()
  }

  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return COPY_NULL_VALUE
  }

  const needsQuoting =
    trimmed.includes('\t') ||
    trimmed.includes('\n') ||
    trimmed.includes('\r') ||
    trimmed.includes("'")

  if (!needsQuoting) {
    return trimmed
  }

  // COPY QUOTE '': escape single quote by doubling it
  return `'${trimmed.replace(/'/g, "''")}'`
}

function waitForStreamCompletion(stream: Duplex): Promise<void> {
  return new Promise((resolve, reject) => {
    stream.once('finish', resolve)
    stream.once('error', (error) => {
      reject(error)
    })
  })
}

function copyStreamSafeDestroy(stream: Duplex, error: unknown): void {
  if (typeof stream.destroy !== 'function' || stream.destroyed) {
    return
  }

  if (error instanceof Error) {
    stream.destroy(error)
    return
  }

  stream.destroy(
    new Error(typeof error === 'string' ? error : 'COPY stream failed with unknown error')
  )
}

async function loadTable(pool: Pool, config: TableConfig) {
  const filePath = path.join(SOURCE_ROOT, config.file)
  if (!existsSync(filePath)) {
    throw new Error(`Missing expected file: ${filePath}`)
  }

  console.log(`→ Loading ${config.table} from ${config.file}`)

  const client = await pool.connect()
  let inserted = 0
  let copyStream: Duplex | null = null
  let copyCompletion: Promise<void> | null = null

  try {
    await client.query('BEGIN')

    const copyCommand = buildCopyCommand(config)
    copyStream = client.query(copyFrom(copyCommand))
    copyCompletion = waitForStreamCompletion(copyStream)

    const stream = createReadStream(filePath)
    const parser = stream.pipe(
      parse({
        delimiter: '\t',
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_quotes: true,
      })
    )

    copyStream.on('error', (error) => {
      parser.destroy(error as Error)
    })

    for await (const record of parser) {
      const row = config.columns.map((column) => {
        const rawValue = (record[column.header] ?? '') as string
        return column.transform ? column.transform(rawValue) : defaultTransform(rawValue)
      })

      await writeCopyRow(copyStream, row)
      inserted += 1
    }

    copyStream.end()
    if (copyCompletion) {
      await copyCompletion
    }

    await client.query('COMMIT')
    console.log(`  ↳ inserted ${inserted.toLocaleString()} rows`)
  } catch (error) {
    await client.query('ROLLBACK')
    console.error(`  ✖ failed to load ${config.table}`)
    if (copyStream) {
      copyStreamSafeDestroy(copyStream, error)
    }
    throw error
  } finally {
    client.release()
  }
}

function sanitize(value: string): string | null {
  const trimmed = value?.trim()
  if (!trimmed || trimmed.toLowerCase() === 'n/a') {
    return null
  }
  return trimmed
}

function defaultTransform(value: string): string | null {
  return sanitize(value)
}

function asText(value: string): string | null {
  return sanitize(value)
}

function asFlag(value: string): string | null {
  const sanitized = sanitize(value)
  return sanitized ? sanitized.toUpperCase() : null
}

function asInt(value: string): number | null {
  const sanitized = sanitize(value)
  if (!sanitized) return null
  const parsed = Number.parseInt(sanitized, 10)
  return Number.isNaN(parsed) ? null : parsed
}

function asBigInt(value: string): number | null {
  const sanitized = sanitize(value)
  if (!sanitized) return null
  const parsed = Number.parseInt(sanitized, 10)
  return Number.isNaN(parsed) ? null : parsed
}

function asDecimal(value: string): number | null {
  const sanitized = sanitize(value)
  if (!sanitized) return null
  const parsed = Number.parseFloat(sanitized)
  return Number.isNaN(parsed) ? null : parsed
}

function asMonthYear(value: string): string | null {
  const sanitized = sanitize(value)
  if (!sanitized) return null
  // Handles both MM/YYYY and YYYY formats
  if (/^\d{2}\/\d{4}$/.test(sanitized)) {
    const [month, year] = sanitized.split('/')
    return `${year}-${month}-01`
  }
  if (/^\d{4}$/.test(sanitized)) {
    return `${sanitized}-01-01`
  }
  throw new Error(`Unexpected date format: ${sanitized}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
