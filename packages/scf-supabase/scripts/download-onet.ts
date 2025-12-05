#!/usr/bin/env tsx

/**
 * Download O*NET 30.0 MySQL SQL files from onetcenter.org
 * Checks for existing files and skips download if they exist
 * Optionally runs conversion after download
 */

import { exec } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { promisify } from 'node:util'

import AdmZip from 'adm-zip'

const execAsync = promisify(exec)

// Get the project root directory
// When running from packages/scf-supabase, process.cwd() is the package dir, so go up 2 levels
// When running from root, process.cwd() is root, so go to packages/scf-supabase
const getProjectRoot = () => {
  const cwd = process.cwd()
  // Check if we're in packages/scf-supabase directory
  if (cwd.endsWith('packages/scf-supabase')) {
    return path.resolve(cwd, '../..')
  }
  // Otherwise assume we're at root
  return cwd
}

const PROJECT_ROOT = getProjectRoot()
const ONET_DIR = path.join(PROJECT_ROOT, 'packages/supabase/onet')
const TEXT_ROOT_DIR = path.join(PROJECT_ROOT, 'packages/supabase/seed-data/onet')
const TEXT_RAW_DIR = path.join(TEXT_ROOT_DIR, 'raw')
const TEXT_ZIP_PATH = path.join(TEXT_ROOT_DIR, 'db_30_0_text.zip')
const BASE_URL = 'https://www.onetcenter.org/dl_files/database/db_30_0_mysql'
const TEXT_ZIP_URL = 'https://www.onetcenter.org/dl_files/database/db_30_0_text.zip'

// Map O*NET file names (from website) to our expected local file names (for convert-onet-sql.ts)
// O*NET uses numbered files, but we need to rename them to match convert-onet-sql.ts expectations
const FILE_MAPPING: Array<{ onetName: string; localName: string }> = [
  // Reference/lookup tables first
  {
    onetName: '01_content_model_reference',
    localName: '01_content_model_reference.sql',
  },
  { onetName: '04_scales_reference', localName: '02_scales_reference.sql' },
  { onetName: '03_occupation_data', localName: '03_occupation_data.sql' },
  { onetName: '23_iwa_reference', localName: '04_iwa_reference.sql' },
  { onetName: '14_job_zones', localName: '05_job_zones.sql' },

  // Abilities - Note: O*NET doesn't have separate "scores" files, they're in the main files
  { onetName: '11_abilities', localName: '06_abilities.sql' },
  // Ability scores are typically in the abilities file, but we'll create a placeholder if needed
  { onetName: '11_abilities', localName: '07_ability_scores.sql' }, // Will be empty or same as abilities

  // Skills
  { onetName: '16_skills', localName: '08_skills.sql' },
  { onetName: '16_skills', localName: '09_skill_scores.sql' }, // Will be empty or same as skills

  // Knowledge
  { onetName: '15_knowledge', localName: '10_knowledge.sql' },
  { onetName: '15_knowledge', localName: '11_knowledge_scores.sql' }, // Will be empty or same as knowledge

  // Work Activities
  { onetName: '19_work_activities', localName: '12_work_activities.sql' },
  { onetName: '19_work_activities', localName: '13_work_activity_scores.sql' }, // Will be empty or same
  { onetName: '24_dwa_reference', localName: '14_dwa_reference.sql' },

  // Work Context
  { onetName: '20_work_context', localName: '15_work_context.sql' },
  { onetName: '20_work_context', localName: '16_work_context_scores.sql' }, // Will be empty or same
  {
    onetName: '10_work_context_categories',
    localName: '17_work_context_categories.sql',
  },

  // Work Styles
  { onetName: '21_work_styles', localName: '18_work_styles.sql' },
  { onetName: '21_work_styles', localName: '19_work_style_scores.sql' }, // Will be empty or same

  // Work Values
  { onetName: '22_work_values', localName: '20_work_values.sql' },
  { onetName: '22_work_values', localName: '21_work_value_scores.sql' }, // Will be empty or same

  // Interests
  { onetName: '13_interests', localName: '22_interests.sql' },
  { onetName: '13_interests', localName: '23_interest_scores.sql' }, // Will be empty or same

  // Education & Training
  {
    onetName: '12_education_training_experience',
    localName: '24_education_training_experience.sql',
  },
  {
    onetName: '05_ete_categories',
    localName: '25_education_training_categories.sql',
  },
  { onetName: '02_job_zone_reference', localName: '26_job_zone_reference.sql' },

  // Tasks
  { onetName: '17_task_statements', localName: '27_task_statements.sql' },
  { onetName: '09_task_categories', localName: '28_task_categories.sql' },
  { onetName: '18_task_ratings', localName: '29_task_ratings.sql' },
  { onetName: '25_tasks_to_dwas', localName: '30_tasks_to_dwas.sql' },

  // Tools & Technology
  { onetName: '32_tools_used', localName: '31_tools_used.sql' },
  { onetName: '31_technology_skills', localName: '32_technology_skills.sql' },

  // Titles & Descriptions
  { onetName: '29_alternate_titles', localName: '33_alternate_titles.sql' },
  {
    onetName: '30_sample_of_reported_titles',
    localName: '34_sample_of_reported_titles.sql',
  },

  // Additional reference data
  { onetName: '28_unspsc_reference', localName: '35_unspsc_reference.sql' },
  {
    onetName: '07_occupation_level_metadata',
    localName: '36_occupation_level_metadata.sql',
  },
  // Note: IWA_to_Work_Activity might not exist as separate file, may need to skip or create empty
  { onetName: '23_iwa_reference', localName: '37_iwa_to_work_activity.sql' }, // Placeholder
  // Career_Changers_Matrix might not exist
  {
    onetName: '27_related_occupations',
    localName: '38_career_changers_matrix.sql',
  }, // Placeholder
  {
    onetName: '27_related_occupations',
    localName: '39_related_occupations.sql',
  },
  // Updated_Links might not exist
  { onetName: '01_content_model_reference', localName: '40_updated_links.sql' }, // Placeholder
]

interface DownloadStats {
  downloaded: number
  skipped: number
  failed: number
  errors: string[]
}

const stats: DownloadStats = {
  downloaded: 0,
  skipped: 0,
  failed: 0,
  errors: [],
}

function ensureDirectory(directory: string, label?: string): void {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true })
    if (label) {
      console.log(`📁 Created ${label}: ${directory}`)
    }
  }
}

/**
 * Download a file from URL to local path
 */
async function downloadFile(url: string, filePath: string): Promise<boolean> {
  try {
    const response = await fetch(url)

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`File not found: ${url}`)
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Ensure directory exists
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    fs.writeFileSync(filePath, buffer)

    return true
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    stats.errors.push(`Failed to download ${path.basename(filePath)}: ${errorMsg}`)
    return false
  }
}

/**
 * Check if file exists and has content
 */
function fileExists(filePath: string): boolean {
  if (!fs.existsSync(filePath)) {
    return false
  }

  const stats = fs.statSync(filePath)
  return stats.size > 0
}

// Track which O*NET files we've already downloaded to avoid duplicates
const downloadedOnetFiles = new Set<string>()

/**
 * Download a single O*NET file
 */
async function downloadOnetFile(
  mapping: { onetName: string; localName: string },
  skipExisting = true
): Promise<boolean> {
  const localPath = path.join(ONET_DIR, mapping.localName)
  const url = `${BASE_URL}/${mapping.onetName}.sql`

  // Check if file already exists locally
  if (skipExisting && fileExists(localPath)) {
    console.log(`⏭️  Skipping ${mapping.localName} (already exists)`)
    stats.skipped++
    return true
  }

  // If we've already downloaded this O*NET file for another mapping, copy it
  if (downloadedOnetFiles.has(mapping.onetName)) {
    const sourcePath = path.join(ONET_DIR, `${mapping.onetName}.sql`)
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, localPath)
      console.log(`📋 Copied ${mapping.localName} from ${mapping.onetName}.sql`)
      stats.downloaded++
      return true
    }
  }

  console.log(`⬇️  Downloading ${mapping.localName} from ${mapping.onetName}.sql...`)

  // Download to temporary name first, then rename
  const tempPath = path.join(ONET_DIR, `${mapping.onetName}.sql`)
  const success = await downloadFile(url, tempPath)

  if (success) {
    // Copy to the expected local name
    if (tempPath !== localPath) {
      fs.copyFileSync(tempPath, localPath)
      // Clean up the temporary O*NET numbered file if it's different from local name
      // Keep it only if we might need it for other mappings
      if (
        !FILE_MAPPING.some(
          (m) => m.onetName === mapping.onetName && m.localName !== mapping.localName
        )
      ) {
        // No other mappings need this file, so delete it
        try {
          fs.unlinkSync(tempPath)
        } catch {
          // Ignore errors deleting temp files
        }
      }
    }

    downloadedOnetFiles.add(mapping.onetName)
    const fileSize = (fs.statSync(localPath).size / 1024 / 1024).toFixed(2)
    console.log(`   ✅ Downloaded ${mapping.localName} (${fileSize} MB)`)
    stats.downloaded++
  } else {
    console.log(`   ❌ Failed to download ${mapping.localName}`)
    stats.failed++
  }

  return success
}

function textBundleExists(): boolean {
  return fileExists(TEXT_ZIP_PATH)
}

function textRawPopulated(): boolean {
  if (!fs.existsSync(TEXT_RAW_DIR)) {
    return false
  }
  return fs
    .readdirSync(TEXT_RAW_DIR, { withFileTypes: true })
    .some(
      (entry) =>
        entry.isFile() &&
        (entry.name.toLowerCase().endsWith('.txt') || entry.name.toLowerCase().endsWith('.tsv'))
    )
}

async function downloadTextBundle(forceDownload: boolean): Promise<boolean> {
  if (textBundleExists() && !forceDownload) {
    const fileSize = (fs.statSync(TEXT_ZIP_PATH).size / 1024 / 1024).toFixed(2)
    console.log(`⏭️  Skipping text bundle download (already exists: ${fileSize} MB)`)
    return true
  }

  console.log('⬇️  Downloading O*NET text bundle (db_30_0_text.zip)...')
  const success = await downloadFile(TEXT_ZIP_URL, TEXT_ZIP_PATH)
  if (success) {
    const fileSize = (fs.statSync(TEXT_ZIP_PATH).size / 1024 / 1024).toFixed(2)
    console.log(`   ✅ Downloaded text bundle (${fileSize} MB)`)
  } else {
    console.error('   ❌ Failed to download O*NET text bundle')
  }
  return success
}

function extractTextBundle(forceExtract: boolean): void {
  ensureDirectory(TEXT_RAW_DIR, 'raw data directory')

  if (!forceExtract && textRawPopulated()) {
    console.log('⏭️  Skipping extraction (raw O*NET text files already present)')
    return
  }

  if (!textBundleExists()) {
    throw new Error(
      'Text bundle not found. Download it first with --with-text or remove --skip-text.'
    )
  }

  console.log('📦 Extracting O*NET text bundle...')
  const zip = new AdmZip(TEXT_ZIP_PATH)

  if (forceExtract && fs.existsSync(TEXT_RAW_DIR)) {
    for (const entry of fs.readdirSync(TEXT_RAW_DIR)) {
      const entryPath = path.join(TEXT_RAW_DIR, entry)
      fs.rmSync(entryPath, { recursive: true, force: true })
    }
  }

  zip.extractAllTo(TEXT_RAW_DIR, true)

  const extractedCount = flattenExtractedTextFiles()
  console.log(`   ✅ Extracted ${extractedCount} text files into ${TEXT_RAW_DIR}`)
}

function flattenExtractedTextFiles(): number {
  if (!fs.existsSync(TEXT_RAW_DIR)) {
    return 0
  }

  const entries = fs.readdirSync(TEXT_RAW_DIR, { withFileTypes: true })

  const hasTopLevelTxt = entries.some(
    (entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.txt')
  )

  if (!hasTopLevelTxt) {
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const sourceDir = path.join(TEXT_RAW_DIR, entry.name)
      for (const nested of fs.readdirSync(sourceDir, {
        withFileTypes: true,
      })) {
        const sourcePath = path.join(sourceDir, nested.name)
        const targetPath = path.join(TEXT_RAW_DIR, nested.name)
        fs.renameSync(sourcePath, targetPath)
      }
      fs.rmSync(sourceDir, { recursive: true, force: true })
    }
  }

  return fs
    .readdirSync(TEXT_RAW_DIR, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() &&
        (entry.name.toLowerCase().endsWith('.txt') || entry.name.toLowerCase().endsWith('.tsv'))
    ).length
}

/**
 * Run conversion script
 */
async function runConversion(): Promise<boolean> {
  console.log('\n🔄 Running O*NET SQL conversion...\n')

  try {
    // Use the same pattern as seed-all.ts for path resolution
    const scriptDir = path.dirname(new URL(import.meta.url).pathname)
    const convertScriptPath = path.join(scriptDir, 'convert-onet-sql.ts')

    // Resolve to absolute path for better compatibility
    const absolutePath = path.isAbsolute(convertScriptPath)
      ? convertScriptPath
      : path.resolve(process.cwd(), convertScriptPath)

    const { stdout, stderr } = await execAsync(`pnpx tsx "${absolutePath}"`, {
      env: process.env,
      cwd: process.cwd(),
    })

    if (stdout) console.log(stdout)
    if (stderr && !stderr.includes('Warning')) {
      console.error(stderr)
    }

    return true
  } catch (error) {
    console.error('❌ Error running conversion:', error)
    return false
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2)
  const textOnly = args.includes('--text-only')
  const skipSqlDownload = args.includes('--skip-download') || textOnly
  const skipConvertFlag = args.includes('--skip-convert') || textOnly
  const autoConvert = args.includes('--convert')
  const forceText = args.includes('--force-text')
  const forceExtract = args.includes('--force-extract') || forceText
  const fetchText = textOnly || args.includes('--with-text') || !args.includes('--skip-text')

  console.log('📥 O*NET 30.0 Database Download\n')
  console.log('='.repeat(50))

  // Ensure directory exists
  if (!fs.existsSync(ONET_DIR)) {
    fs.mkdirSync(ONET_DIR, { recursive: true })
    console.log(`📁 Created directory: ${ONET_DIR}\n`)
  }

  if (skipSqlDownload) {
    console.log('⏭️  Skipping download (--skip-download flag)\n')
  } else {
    console.log(`📂 Target directory: ${ONET_DIR}\n`)
    console.log(`📊 Files to download: ${FILE_MAPPING.length}\n`)

    // Download all files
    for (const mapping of FILE_MAPPING) {
      await downloadOnetFile(mapping, true)
    }

    // Clean up any remaining O*NET numbered files that aren't needed
    console.log('\n🧹 Cleaning up temporary files...')
    const onetFiles = fs.readdirSync(ONET_DIR).filter((f) => f.endsWith('.sql'))
    const expectedFiles = new Set(FILE_MAPPING.map((m) => m.localName))
    let cleaned = 0
    for (const file of onetFiles) {
      if (!expectedFiles.has(file)) {
        try {
          fs.unlinkSync(path.join(ONET_DIR, file))
          cleaned++
        } catch {
          // Ignore errors
        }
      }
    }
    if (cleaned > 0) {
      console.log(`   ✅ Cleaned up ${cleaned} temporary files`)
    }

    console.log(`\n${'='.repeat(50)}`)
    console.log('📊 Download Summary')
    console.log('='.repeat(50))
    console.log(`✅ Downloaded: ${stats.downloaded}`)
    console.log(`⏭️  Skipped (existing): ${stats.skipped}`)
    console.log(`❌ Failed: ${stats.failed}`)

    if (stats.errors.length > 0) {
      console.log('\n⚠️  Errors:')
      for (const error of stats.errors) {
        console.log(`   - ${error}`)
      }
    }

    if (stats.failed > 0) {
      console.log('\n❌ Some downloads failed. Check errors above.')
      process.exit(1)
    }
  }

  if (fetchText) {
    console.log('\n📦 Synchronising O*NET text bundle...\n')
    ensureDirectory(TEXT_ROOT_DIR, 'text bundle directory')
    ensureDirectory(TEXT_RAW_DIR)

    const downloadSuccess = await downloadTextBundle(forceText || textOnly)
    if (!downloadSuccess) {
      console.error('\n❌ Failed to download O*NET text bundle.')
      process.exit(1)
    }

    try {
      extractTextBundle(forceExtract || textOnly)
    } catch (error) {
      console.error('\n❌ Failed to extract O*NET text bundle:', error)
      process.exit(1)
    }
  } else {
    console.log('\n⏭️  Skipping O*NET text bundle (use --with-text to enable)')
  }

  // Run conversion if requested
  if (!skipConvertFlag && !textOnly && (autoConvert || !skipSqlDownload)) {
    const conversionSuccess = await runConversion()
    if (!conversionSuccess) {
      console.error('\n❌ Conversion failed.')
      process.exit(1)
    }
  } else if (skipConvertFlag && !textOnly) {
    console.log('\n⏭️  Skipping conversion (--skip-convert flag)')
    console.log(
      '💡 Run conversion manually: pnpm tsx packages/supabase/scripts/convert-onet-sql.ts'
    )
  }

  console.log('\n✅ O*NET download complete!')
  console.log('💡 Next steps:')
  console.log('   - Apply migration: pnpm supa db reset')
  console.log('   - Or apply specific migration: pnpm supa migration up\n')
}

main().catch((error) => {
  console.error('\n💥 Download failed:', error)
  process.exit(1)
})
