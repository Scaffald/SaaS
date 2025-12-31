import { Buffer } from 'node:buffer'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import type { Database } from '../../_shared/database.types.ts'
import { extractTextFromPdf as sharedExtractTextFromPdf } from '../../_shared/pdf/extract-text.ts'
import { profileEmploymentInputSchema, profileGeneralInputSchema } from '@scf/trpc/schemas'
import { supabaseAnonKey, supabaseUrl } from '../context.ts'
import { protectedProcedure, t } from '../middleware.ts'

type DbClient = SupabaseClient<Database>

const MAX_FILE_SIZE_BYTES = 1_048_576 // 1MB
const RESUME_BUCKET_ID = 'resumes'
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

const RESUME_SECTIONS = [
  'general',
  'experience',
  'education',
  'skills',
  'certifications',
  'employment',
] as const

type ResumeSection = (typeof RESUME_SECTIONS)[number]

// Lazy loading for large packages to reduce bundle size
// biome-ignore lint/suspicious/noExplicitAny: Dynamic import for optional dependency
let mammothModule: any | null = null

// biome-ignore lint/suspicious/noExplicitAny: Dynamic import for optional dependency
async function getMammoth(): Promise<any> {
  if (!mammothModule) {
    // @ts-expect-error: Dynamic import for optional dependency
    mammothModule = await import('mammoth')
  }
  return mammothModule
}

const uploadResumeInputSchema = z.object({
  fileData: z.string().min(1, 'File payload is required'),
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number().positive(),
  mimeType: z.string().min(1, 'MIME type is required'),
})

const uploadResumeOutputSchema = z.object({
  success: z.literal(true),
  resumeId: z.string().uuid(),
  filePath: z.string(),
})

const parseResumeInputSchema = z.object({
  resumeId: z.string().uuid(),
  sections: z.array(z.enum(RESUME_SECTIONS)).default([...RESUME_SECTIONS]),
})

const parsedGeneralSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  headline: z.string().optional(),
  bio: z.string().optional(),
})

const parsedExperienceSchema = z.object({
  title: z.string().optional(),
  company: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
  isCurrent: z.boolean().optional(),
  summary: z.string().optional(),
})

const parsedEducationSchema = z.object({
  school: z.string().optional(),
  degree: z.string().optional(),
  fieldOfStudy: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
})

const parsedCertificationSchema = z.object({
  name: z.string().optional(),
  issuer: z.string().optional(),
  issuedOn: z.string().optional().nullable(),
  expiresOn: z.string().optional().nullable(),
})

const parsedSkillSchema = z.object({
  name: z.string(),
  confidence: z.number().min(0).max(1).optional(),
})

const parsedEmploymentSchema = z.object({
  hourlyRate: z.number().optional(),
  locations: z.array(z.string()).optional(),
  openToTravel: z.boolean().optional(),
  travelDistanceMiles: z.number().optional(),
})

const parsedResumeSchema = z.object({
  general: z.array(parsedGeneralSchema).optional(),
  experience: z.array(parsedExperienceSchema).optional(),
  education: z.array(parsedEducationSchema).optional(),
  certifications: z.array(parsedCertificationSchema).optional(),
  skills: z.array(parsedSkillSchema).optional(),
  employment: parsedEmploymentSchema.optional(),
})

export function normalizeOpenAiResumePayload(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {}
  }

  const record = payload as Record<string, unknown>
  const normalized: Record<string, unknown> = { ...record }

  const coerceArrayOfObjects = (value: unknown): Array<Record<string, unknown>> | undefined => {
    if (value === undefined || value === null) {
      return undefined
    }

    const source = Array.isArray(value) ? value : [value]
    const objects = source.filter(
      (entry): entry is Record<string, unknown> =>
        Boolean(entry) && typeof entry === 'object' && !Array.isArray(entry)
    )

    return objects.length > 0 ? objects : undefined
  }

  const coerceSkills = (value: unknown): Array<Record<string, unknown>> | undefined => {
    if (value === undefined || value === null) {
      return undefined
    }

    const source = Array.isArray(value) ? value : [value]
    const entries: Array<Record<string, unknown>> = []

    for (const item of source) {
      if (typeof item === 'string') {
        const parts = item
          .split(/[,;•\n]+/g)
          .map((part) => part.trim())
          .filter(Boolean)
        if (parts.length === 0) {
          continue
        }
        for (const name of parts) {
          entries.push({ name })
        }
        continue
      }

      if (item && typeof item === 'object' && !Array.isArray(item)) {
        const recordItem = item as Record<string, unknown>
        if (typeof recordItem.name === 'string') {
          entries.push(recordItem)
        } else if (typeof recordItem.skill === 'string') {
          entries.push({ ...recordItem, name: recordItem.skill })
        }
      }
    }

    return entries.length > 0 ? entries : undefined
  }

  if ('general' in record) {
    const general = coerceArrayOfObjects(record.general)
    if (general) normalized.general = general
    else delete normalized.general
  }

  if ('experience' in record) {
    const experience = coerceArrayOfObjects(record.experience)
    if (experience) normalized.experience = experience
    else delete normalized.experience
  }

  if ('education' in record) {
    const education = coerceArrayOfObjects(record.education)
    if (education) normalized.education = education
    else delete normalized.education
  }

  if ('certifications' in record) {
    const certifications = coerceArrayOfObjects(record.certifications)
    if (certifications) normalized.certifications = certifications
    else delete normalized.certifications
  }

  if ('skills' in record) {
    const skills = coerceSkills(record.skills)
    if (skills) normalized.skills = skills
    else delete normalized.skills
  }

  if ('employment' in record) {
    const employment = record.employment
    if (employment && typeof employment === 'object' && !Array.isArray(employment)) {
      normalized.employment = employment
    } else if (typeof employment === 'string' && employment.trim().startsWith('{')) {
      try {
        const parsedEmployment = JSON.parse(employment)
        if (
          parsedEmployment &&
          typeof parsedEmployment === 'object' &&
          !Array.isArray(parsedEmployment)
        ) {
          normalized.employment = parsedEmployment
        } else {
          delete normalized.employment
        }
      } catch {
        delete normalized.employment
      }
    } else {
      delete normalized.employment
    }
  }

  return convertNullToUndefined(normalized)
}

function convertNullToUndefined<T>(value: T): T {
  if (value === null) {
    return undefined as T
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => convertNullToUndefined(item))
      .filter((item) => item !== undefined) as T
  }

  if (typeof value === 'object' && value !== null) {
    const recordValue = value as Record<string, unknown>
    const result: Record<string, unknown> = {}
    for (const [key, entryValue] of Object.entries(recordValue)) {
      result[key] = convertNullToUndefined(entryValue)
    }
    return result as T
  }

  return value
}

const parseErrorSchema = z.object({
  section: z.enum(RESUME_SECTIONS),
  message: z.string(),
  rawText: z.string().optional(),
})

const parseResumeOutputSchema = z.object({
  success: z.literal(true),
  parsedData: parsedResumeSchema,
  errors: z.array(parseErrorSchema).optional(),
})

const getWizardStateInputSchema = z.object({
  resumeId: z.string().uuid(),
})

const wizardStateSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  resumeId: z.string().uuid(),
  currentStep: z.number(),
  completedSteps: z.array(z.number()),
  parsedData: parsedResumeSchema.optional(),
  errors: z.array(parseErrorSchema).optional(),
  startedAt: z.string(),
  updatedAt: z.string(),
  completedAt: z.string().nullable(),
})

const saveSectionInputSchema = z.object({
  section: z.enum(RESUME_SECTIONS),
  data: z.unknown(),
  wizardState: z.object({
    resumeId: z.string().uuid(),
    currentStep: z.number(),
    completedSteps: z.array(z.number()),
  }),
  mergeStrategy: z
    .object({
      mode: z.enum(['replace', 'append', 'keepExisting']).default('replace'),
    })
    .optional(),
})

const updateProgressInputSchema = z.object({
  resumeId: z.string().uuid(),
  currentStep: z.number(),
  completedSteps: z.array(z.number()).optional(),
})

const hasUploadedOutputSchema = z.object({
  hasUploaded: z.boolean(),
})

type ResumeUploadRow = Database['core']['Tables']['resume_uploads']['Row']
type ResumeWizardRow = Database['core']['Tables']['resume_wizard_state']['Row']

function stripDataUrlPrefix(base64: string): string {
  const commaIndex = base64.indexOf(',')
  return commaIndex === -1 ? base64 : base64.slice(commaIndex + 1)
}

function decodeBase64File(base64: string): Uint8Array {
  try {
    const sanitized = stripDataUrlPrefix(base64.trim())
    const binaryString = atob(sanitized)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i += 1) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
  } catch (error) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Failed to decode file: ${error instanceof Error ? error.message : String(error)}`,
    })
  }
}

function sanitizeFileName(fileName: string): string {
  const name = fileName.replace(/[^A-Za-z0-9._-]/g, '_')
  return name.length > 255 ? name.slice(-255) : name
}

function buildResumePath(userId: string, fileName: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  return `${userId}/${timestamp}_${sanitizeFileName(fileName)}`
}

async function downloadResumeFile(supabase: DbClient, filePath: string): Promise<Uint8Array> {
  const { data, error } = await supabase.storage.from(RESUME_BUCKET_ID).download(filePath)

  if (error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to download resume: ${error.message}`,
    })
  }

  if (
    typeof (data as unknown as { arrayBuffer?: () => Promise<ArrayBuffer> })?.arrayBuffer ===
    'function'
  ) {
    const arrayBuffer = await (data as Blob).arrayBuffer()
    return new Uint8Array(arrayBuffer)
  }

  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data)
  }

  if (data instanceof Uint8Array) {
    return data
  }

  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Unsupported download response type for resume file',
  })
}

async function extractTextFromDocLike(bytes: Uint8Array): Promise<string> {
  try {
    const mammoth = await getMammoth()
    const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) })
    if (result.value.trim().length > 0) {
      return result.value
    }
  } catch (error) {
    console.warn('[resume] docx extraction failed', error)
  }

  try {
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes)
  } catch {
    return ''
  }
}

async function extractResumeText(bytes: Uint8Array, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf') {
    const { text } = await sharedExtractTextFromPdf(bytes, {
      namespace: 'resume',
    })
    return text
  }

  if (
    mimeType === 'application/msword' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return await extractTextFromDocLike(bytes)
  }

  return ''
}

function buildParsingPrompt(resumeText: string): string {
  const normalized = resumeText.trim()
  const truncated = normalized.slice(0, 1500)
  const truncationNote =
    normalized.length > 1500 ? '\n[Note: Resume text truncated to first 1500 characters.]\n' : ''
  return `Parse this resume and return JSON that matches the following rules exactly:
- Always respond with an object containing only the keys: general, experience, education, skills, certifications, employment.
- Each of general, experience, education, skills, certifications MUST be arrays. Use an empty array [] if no data is found. Do not return plain strings.
- The employment key MUST be an object with key/value pairs (or omit the key entirely if no structured data is found). Never return a string for employment.
- Skill entries MUST be objects shaped like: { "name": string, "confidence": number (0-1, optional) }.
- General entries MUST be objects shaped like: { "firstName": string?, "lastName": string?, "headline": string?, "bio": string? }.
- Experience entries MUST be objects shaped like: { "title": string?, "company": string?, "startDate": string?, "endDate": string|null?, "isCurrent": boolean?, "summary": string? }.
- Education entries MUST be objects shaped like: { "school": string?, "degree": string?, "fieldOfStudy": string?, "startDate": string?, "endDate": string|null? }.
- Certification entries MUST be objects shaped like: { "name": string?, "issuer": string?, "issuedOn": string|null?, "expiresOn": string|null? }.
- For sections with no reliable data, return an empty array (or omit employment).
- Do not include any explanatory text—return raw JSON only.

Resume text to parse:
${truncationNote}${truncated}`
}

function collectOpenAIContentFragments(content: unknown, visited = new Set<unknown>()): string[] {
  if (content === undefined || content === null) {
    return []
  }

  if (typeof content === 'string') {
    return [content]
  }

  if (typeof content !== 'object') {
    return []
  }

  if (visited.has(content)) {
    return []
  }

  visited.add(content)

  if (Array.isArray(content)) {
    return content.flatMap((item) => collectOpenAIContentFragments(item, visited))
  }

  const record = content as Record<string, unknown>
  const fragments: string[] = []

  if (record.json) {
    if (typeof record.json === 'string') {
      fragments.push(record.json)
    } else if (typeof record.json === 'object') {
      try {
        fragments.push(JSON.stringify(record.json))
      } catch {
        // ignore serialization errors and fall through
      }
    }
  }

  for (const key of ['text', 'content', 'value']) {
    if (key in record) {
      fragments.push(...collectOpenAIContentFragments(record[key], visited))
    }
  }

  return fragments
}

function extractJsonPayloadFromOpenAI(content: unknown): string | null {
  const fragments = collectOpenAIContentFragments(content)
  if (fragments.length === 0) {
    return null
  }

  const joined = fragments.join('\n').trim()
  if (!joined) {
    return null
  }

  const fencedMatch = joined.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fencedMatch) {
    return fencedMatch[1].trim()
  }

  if (
    (joined.startsWith('{') && joined.endsWith('}')) ||
    (joined.startsWith('[') && joined.endsWith(']'))
  ) {
    return joined
  }

  const firstBrace = joined.indexOf('{')
  const lastBrace = joined.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return joined.slice(firstBrace, lastBrace + 1).trim()
  }

  return joined
}

async function callOpenAIForResume(
  resumeText: string,
  openAiKey: string
): Promise<z.infer<typeof parsedResumeSchema>> {
  const requestStartedAt = performance.now()
  console.log(
    '[resume] parse:openai_request',
    JSON.stringify({
      textChars: resumeText.length,
      textPreview: resumeText.slice(0, 120),
    })
  )

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openAiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are a resume parsing assistant. Extract structured data from resumes conservatively and produce JSON.',
        },
        {
          role: 'user',
          content: buildParsingPrompt(resumeText),
        },
      ],
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    console.error(
      '[resume] parse:openai_error',
      JSON.stringify({
        status: response.status,
        elapsedMs: Math.round(performance.now() - requestStartedAt),
        body,
      })
    )
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `OpenAI parsing failed: ${body}`,
    })
  }

  const completion = await response.json()
  console.log(
    '[resume] parse:openai_response',
    JSON.stringify({
      status: response.status,
      elapsedMs: Math.round(performance.now() - requestStartedAt),
      usage: completion?.usage,
    })
  )
  const rawContent = completion?.choices?.[0]?.message?.content
  const content = extractJsonPayloadFromOpenAI(rawContent)

  if (!content) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'OpenAI returned empty completion',
    })
  }

  try {
    const parsed = JSON.parse(content)
    const normalized = normalizeOpenAiResumePayload(parsed)
    return parsedResumeSchema.parse(normalized)
  } catch (error) {
    console.error('[resume] Failed to parse OpenAI response', error, content)
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to parse OpenAI response',
    })
  }
}

async function matchSkillTaxonomies(
  supabase: DbClient,
  skillName: string
): Promise<{
  name: string
  csiMatch?: { id: string; code: string | null; label: string | null }
  onetMatch?: { id: string; title: string | null; description: string | null }
}> {
  const trimmed = skillName.trim()
  if (!trimmed) {
    return { name: skillName }
  }

  // biome-ignore lint/suspicious/noExplicitAny: Complex type inference from Supabase query
  let csiResult: any = null
  // biome-ignore lint/suspicious/noExplicitAny: Complex type inference from Supabase query
  let onetResult: any = null

  try {
    const csiResponse = await supabase
      .schema('data')
      .rpc('search_masterformat', { search_term: trimmed })
    csiResult = csiResponse.data
  } catch (error: unknown) {
    console.warn('[resume] CSI search failed', error)
  }

  try {
    const onetResponse = await supabase
      .schema('onet')
      .rpc('search_occupations', { search_query: trimmed })
    onetResult = onetResponse.data
  } catch (error: unknown) {
    console.warn('[resume] O*NET search failed', error)
  }

  const csiTop = csiResult?.[0]
  const onetTop = onetResult?.[0]

  return {
    name: skillName,
    csiMatch: csiTop
      ? {
          id: String(csiTop.id ?? ''),
          code: typeof csiTop.code_display === 'string' ? csiTop.code_display : null,
          label: typeof csiTop.name === 'string' ? csiTop.name : null,
        }
      : undefined,
    onetMatch: onetTop
      ? {
          id: typeof onetTop.onetsoc_code === 'string' ? onetTop.onetsoc_code : '',
          title: typeof onetTop.title === 'string' ? onetTop.title : null,
          description: typeof onetTop.description === 'string' ? onetTop.description : null,
        }
      : undefined,
  }
}

async function ensureWizardState(
  supabase: DbClient,
  userId: string,
  resumeId: string,
  parsedData: z.infer<typeof parsedResumeSchema>,
  errors: Array<z.infer<typeof parseErrorSchema>>
): Promise<ResumeWizardRow> {
  const { data: existing, error: fetchError } = await supabase
    .schema('core')
    .from('resume_wizard_state')
    .select('*')
    .eq('resume_id', resumeId)
    .eq('user_id', userId)
    .maybeSingle()

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to load wizard state: ${fetchError.message}`,
    })
  }

  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .schema('core')
      .from('resume_wizard_state')
      .update({
        parsed_data: parsedData,
        errors,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (updateError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to update wizard state: ${updateError.message}`,
      })
    }

    return updated
  }

  const { data: inserted, error: insertError } = await supabase
    .schema('core')
    .from('resume_wizard_state')
    .insert({
      user_id: userId,
      resume_id: resumeId,
      current_step: 0,
      completed_steps: [],
      parsed_data: parsedData,
      errors,
      started_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (insertError) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to create wizard state: ${insertError.message}`,
    })
  }

  return inserted
}

async function getResumeUploadForUser(
  supabase: DbClient,
  resumeId: string,
  userId: string
): Promise<ResumeUploadRow> {
  const { data, error } = await supabase
    .schema('core')
    .from('resume_uploads')
    .select('*')
    .eq('id', resumeId)
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Resume upload not found',
      })
    }

    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to load resume upload: ${error.message}`,
    })
  }

  return data
}

async function updateResumeParsingStatus(
  supabase: DbClient,
  resumeId: string,
  status: ResumeUploadRow['parsing_status'],
  errors?: Array<z.infer<typeof parseErrorSchema>>
): Promise<void> {
  const updatePayload: Partial<ResumeUploadRow> & {
    parsing_status: ResumeUploadRow['parsing_status']
    parsed_at?: string
    parsing_errors?: unknown
  } = {
    parsing_status: status,
    updated_at: new Date().toISOString(),
  }

  if (status === 'completed') {
    updatePayload.parsed_at = new Date().toISOString()
  }

  if (errors && errors.length > 0) {
    updatePayload.parsing_errors = errors
  }

  const { error } = await supabase
    .schema('core')
    .from('resume_uploads')
    .update(updatePayload)
    .eq('id', resumeId)

  if (error) {
    console.warn('[resume] failed to update parsing status', error)
  }
}

async function upsertProfileGeneral(
  supabase: DbClient,
  userId: string,
  // biome-ignore lint/suspicious/noExplicitAny: Zod type inference issue
  data: any
): Promise<void> {
  const now = new Date().toISOString()
  const userUpdate: Record<string, unknown> = {
    updated_at: now,
  }

  if (data.avatar_path !== undefined) {
    userUpdate.avatar_path = data.avatar_path
  }
  if (data.about !== undefined) {
    userUpdate.about = data.about
  }
  if (data.address !== undefined) {
    userUpdate.address = data.address
  }
  if (data.phone !== undefined) {
    userUpdate.phone = data.phone
  }
  if (data.first_name !== undefined || data.last_name !== undefined) {
    const displayName = [data.first_name ?? '', data.last_name ?? ''].join(' ').trim()
    if (displayName) {
      userUpdate.display_name = displayName
    }
  }
  if (data.email !== undefined) {
    userUpdate.email = data.email
  }
  if (data.phone !== undefined) {
    userUpdate.phone = data.phone
  }
  if (data.avatar_path !== undefined || data.about !== undefined) {
    const { error: userError } = await supabase
      .schema('core')
      .from('users')
      .update(userUpdate)
      .eq('id', userId)

    if (userError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to update profile: ${userError.message}`,
      })
    }
  }

  const privateUpdate: Record<string, unknown> = {
    user_id: userId,
    updated_at: now,
  }

  if (data.first_name !== undefined) {
    privateUpdate.first_name = data.first_name
  }
  if (data.last_name !== undefined) {
    privateUpdate.last_name = data.last_name
  }
  if (data.address !== undefined) {
    privateUpdate.address = data.address ?? null
  }
  if (data.phone !== undefined) {
    privateUpdate.phone = data.phone ?? null
  }

  const { error: profileError } = await supabase
    .schema('core')
    .from('profile')
    .upsert(privateUpdate as never, { onConflict: 'user_id' })

  if (profileError) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to update private profile: ${profileError.message}`,
    })
  }
}

async function upsertEmploymentPreferences(
  supabase: DbClient,
  userId: string,
  // biome-ignore lint/suspicious/noExplicitAny: Zod type inference issue
  data: any
): Promise<void> {
  // Convert hourly_rate (dollars) to hourly_rate_cents for database storage
  const hourlyRateCents =
    data.hourly_rate !== undefined && data.hourly_rate !== null
      ? Math.round(data.hourly_rate * 100)
      : null

  const { error } = await supabase
    .schema('core')
    .from('profile')
    .update({
      updated_at: new Date().toISOString(),
      preferred_work_locations: data.preferred_work_locations ?? null,
      open_to_travel: data.open_to_travel ?? null,
      travel_distance_miles: data.travel_distance_miles ?? null,
      availability: data.availability ?? null,
      hourly_rate_cents: hourlyRateCents,
      us_resident: data.us_resident ?? null,
      authorized_countries: data.authorized_countries ?? null,
      us_passport: data.us_passport ?? null,
      drivers_license_classes: data.drivers_license_classes ?? null,
      military_status: data.military_status ?? null,
    })
    .eq('user_id', userId)

  if (error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to update employment preferences: ${error.message}`,
    })
  }
}

async function upsertExperienceEntries(
  supabase: DbClient,
  userId: string,
  entries: Array<z.infer<typeof parsedExperienceSchema>>,
  strategy: 'replace' | 'append' | 'keepExisting'
): Promise<void> {
  if (strategy === 'replace') {
    const { error: deleteError } = await supabase
      .schema('core')
      .from('user_experience')
      .delete()
      .eq('user_id', userId)

    if (deleteError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to reset experience: ${deleteError.message}`,
      })
    }
  } else if (strategy === 'keepExisting') {
    return
  }

  if (entries.length === 0) {
    return
  }

  const payload = entries
    .filter((entry) => entry.title && entry.company)
    .map((entry) => ({
      user_id: userId,
      job_title: entry.title ?? '',
      company_name: entry.company ?? '',
      start_date: entry.startDate ?? null,
      end_date: entry.endDate ?? null,
      is_current: entry.isCurrent ?? false,
      description: entry.summary ?? null,
    }))

  if (payload.length === 0) {
    return
  }

  const { error } = await supabase.schema('core').from('user_experience').insert(payload)

  if (error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to upsert experience: ${error.message}`,
    })
  }
}

async function upsertEducationEntries(
  supabase: DbClient,
  userId: string,
  entries: Array<z.infer<typeof parsedEducationSchema>>,
  strategy: 'replace' | 'append' | 'keepExisting'
): Promise<void> {
  if (strategy === 'replace') {
    const { error: deleteError } = await supabase
      .schema('core')
      .from('user_education')
      .delete()
      .eq('user_id', userId)

    if (deleteError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to reset education: ${deleteError.message}`,
      })
    }
  } else if (strategy === 'keepExisting') {
    return
  }

  const payload = entries
    .filter((entry) => entry.school)
    .map((entry) => ({
      user_id: userId,
      school: entry.school ?? '',
      degree: entry.degree ?? null,
      field_of_study: entry.fieldOfStudy ?? null,
      start_date: entry.startDate ?? null,
      end_date: entry.endDate ?? null,
    }))

  if (payload.length === 0) {
    return
  }

  const { error } = await supabase.schema('core').from('user_education').insert(payload)

  if (error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to upsert education: ${error.message}`,
    })
  }
}

async function upsertCertifications(
  supabase: DbClient,
  userId: string,
  _entries: Array<z.infer<typeof parsedCertificationSchema>>,
  strategy: 'replace' | 'append' | 'keepExisting'
): Promise<void> {
  // Note: The user_certifications table requires a certification_id (FK to certifications taxonomy).
  // Resume parsing extracts free-form certification data (name, issuer, dates) that doesn't
  // match the taxonomy structure. We skip saving certifications from resume parsing here.
  // Users can manually add certifications through the profile certifications interface,
  // which has proper taxonomy matching logic.
  //
  // If strategy is "replace", we still clear existing certifications to maintain consistency
  // with the user's intent to replace data from the resume.
  if (strategy === 'replace') {
    const { error: deleteError } = await supabase
      .schema('core')
      .from('user_certifications')
      .delete()
      .eq('user_id', userId)

    if (deleteError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to reset certifications: ${deleteError.message}`,
      })
    }
  }

  // Skip inserting certifications since we can't match them to the taxonomy
  // without additional logic to find/create matching certification entries
  return
}

async function upsertSkills(
  supabase: DbClient,
  userId: string,
  skills: Array<{
    name: string
    csiMatch?: { id: string }
    onetMatch?: { id: string }
  }>,
  strategy: 'replace' | 'append' | 'keepExisting'
): Promise<void> {
  const userScopedClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {},
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  userScopedClient.auth
    .setSession({
      access_token: '',
      refresh_token: '',
    })
    .catch(() => {})

  if (strategy === 'replace') {
    const { error: deleteError } = await supabase
      .schema('core')
      .from('user_skills')
      .delete()
      .eq('user_id', userId)

    if (deleteError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to reset skills: ${deleteError.message}`,
      })
    }
  } else if (strategy === 'keepExisting') {
    return
  }

  // Only include skills that have at least one match (CSI or ONet)
  // Skills must be mapped to an existing taxonomy entry to satisfy the constraint
  const inserts = skills
    .filter((skill) => {
      // Must have a name and at least one match
      return skill.name && (skill.csiMatch?.id || skill.onetMatch?.id)
    })
    .map((skill) => {
      // Prefer CSI match if available, otherwise use ONet match
      // We know at least one exists due to the filter above
      const hasCsiMatch = !!skill.csiMatch?.id
      return {
        user_id: userId,
        skill_taxonomy: hasCsiMatch ? 'csi' : 'onet',
        csi_skill_id: hasCsiMatch ? (skill.csiMatch?.id ?? null) : null,
        onet_occupation_id: hasCsiMatch ? null : (skill.onetMatch?.id ?? null),
        proficiency_level: 3,
      }
    })

  if (inserts.length === 0) {
    return
  }

  const { error } = await supabase.schema('core').from('user_skills').insert(inserts)

  if (error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to upsert skills: ${error.message}`,
    })
  }
}

export const resumeRouter = t.router({
  upload: protectedProcedure
    .input(uploadResumeInputSchema)
    .output(uploadResumeOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx

      console.log(
        '[resume] upload:start',
        JSON.stringify({
          userId: user.id,
          fileName: input.fileName,
          fileSize: input.fileSize,
          mimeType: input.mimeType,
        })
      )

      if (!ALLOWED_MIME_TYPES.has(input.mimeType)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Please upload a PDF or Word document',
        })
      }

      if (input.fileSize > MAX_FILE_SIZE_BYTES) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'File size exceeds 1MB limit. Please upload a smaller file.',
        })
      }

      const bytes = decodeBase64File(input.fileData)
      if (bytes.byteLength > MAX_FILE_SIZE_BYTES) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'File size exceeds 1MB limit. Please upload a smaller file.',
        })
      }

      const filePath = buildResumePath(user.id, input.fileName)
      const { error: uploadError } = await supabase.storage
        .from(RESUME_BUCKET_ID)
        .upload(filePath, bytes, {
          contentType: input.mimeType,
          upsert: false,
        })

      if (uploadError) {
        console.error('[resume] upload failure', uploadError)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to upload file. Please try again.',
        })
      }

      console.log(
        '[resume] upload:stored',
        JSON.stringify({
          userId: user.id,
          filePath,
        })
      )

      const { data, error } = await supabase
        .schema('core')
        .from('resume_uploads')
        .insert({
          user_id: user.id,
          file_path: filePath,
          file_name: input.fileName,
          file_size: bytes.byteLength,
          mime_type: input.mimeType,
          parsing_status: 'processing',
        })
        .select()
        .single()

      if (error || !data) {
        console.error('[resume] failed to persist upload', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to store resume metadata.',
        })
      }

      console.log(
        '[resume] upload:completed',
        JSON.stringify({
          userId: user.id,
          resumeId: data.id,
        })
      )

      return {
        success: true,
        resumeId: data.id,
        filePath: data.file_path,
      }
    }),

  parse: protectedProcedure
    .input(parseResumeInputSchema)
    .output(parseResumeOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx
      const openAiKey = Deno.env.get('OPENAI_API_KEY')?.trim()
      const openAiConfigured = Boolean(openAiKey)
      const parseStart = performance.now()

      console.log(
        '[resume] parse:start',
        JSON.stringify({
          resumeId: input.resumeId,
          userId: user.id,
          sections: input.sections,
          openAiConfigured,
        })
      )

      await updateResumeParsingStatus(supabase, input.resumeId, 'processing')

      try {
        const resume = await getResumeUploadForUser(supabase, input.resumeId, user.id)

        const downloadStartedAt = performance.now()
        const fileBytes = await downloadResumeFile(supabase, resume.file_path)

        console.log(
          '[resume] parse:downloaded',
          JSON.stringify({
            resumeId: input.resumeId,
            bytes: fileBytes.length,
            downloadDurationMs: Math.round(performance.now() - downloadStartedAt),
            mimeType: resume.mime_type,
          })
        )

        const resumeText = await extractResumeText(fileBytes, resume.mime_type ?? 'application/pdf')

        if (!resumeText || resumeText.trim().length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Unable to process resume. Please try again or contact support.',
          })
        }

        if (!openAiConfigured) {
          console.warn(
            '[resume] OpenAI API key is not configured; skipping AI-driven resume parsing.'
          )
        }

        const openAiStart = performance.now()
        const parsed = openAiKey
          ? await callOpenAIForResume(resumeText, openAiKey)
          : parsedResumeSchema.parse({})
        const openAiDuration = performance.now() - openAiStart

        console.log(
          '[resume] parse:ai_completed',
          JSON.stringify({
            resumeId: input.resumeId,
            openAiDurationMs: Math.round(openAiDuration),
            parsedSections: Object.keys(parsed ?? {}).length,
          })
        )

        const skillMatches = parsed.skills
          ? await Promise.all(
              parsed.skills.map(async (skill) => await matchSkillTaxonomies(supabase, skill.name))
            )
          : []

        console.log(
          '[resume] parse:skills_matched',
          JSON.stringify({
            resumeId: input.resumeId,
            skillsRequested: parsed.skills?.length ?? 0,
            matchesComputed: skillMatches.length,
            elapsedMs: Math.round(performance.now() - parseStart),
          })
        )

        const errors: Array<z.infer<typeof parseErrorSchema>> = []
        const missingSectionMessage = (section: ResumeSection): string =>
          openAiConfigured
            ? `No ${section} information found in resume.`
            : 'Resume parsing is disabled because the OpenAI API key is not configured. Please fill in this section manually.'

        const parsedData: z.infer<typeof parsedResumeSchema> = {
          ...parsed,
          skills: parsed.skills?.map((skill, index) => ({
            name: skillMatches[index]?.name ?? skill.name,
            confidence: skill.confidence ?? undefined,
            csiMatch: skillMatches[index]?.csiMatch,
            onetMatch: skillMatches[index]?.onetMatch,
          })) as unknown as Array<z.infer<typeof parsedSkillSchema>>,
        }

        for (const section of input.sections) {
          if (
            (section === 'general' && !parsedData.general?.length) ||
            (section === 'experience' && !parsedData.experience?.length) ||
            (section === 'education' && !parsedData.education?.length) ||
            (section === 'skills' && !parsedData.skills?.length) ||
            (section === 'certifications' && !parsedData.certifications?.length) ||
            (section === 'employment' && !parsedData.employment)
          ) {
            errors.push({
              section,
              message: missingSectionMessage(section),
            })
          }
        }

        await ensureWizardState(supabase, user.id, input.resumeId, parsedData, errors)

        console.log(
          '[resume] parse:wizard_state_ensure',
          JSON.stringify({
            resumeId: input.resumeId,
            userId: user.id,
            errorsCount: errors.length,
          })
        )

        await updateResumeParsingStatus(
          supabase,
          input.resumeId,
          errors.length > 0 ? 'completed' : 'completed',
          errors
        )

        console.log(
          '[resume] parse:completed',
          JSON.stringify({
            resumeId: input.resumeId,
            userId: user.id,
            elapsedMs: Math.round(performance.now() - parseStart),
            hasWarnings: errors.length > 0,
          })
        )

        return {
          success: true,
          parsedData,
          errors: errors.length > 0 ? errors : undefined,
        }
      } catch (error) {
        await updateResumeParsingStatus(supabase, input.resumeId, 'failed')
        console.error(
          '[resume] parse:failed',
          JSON.stringify({
            resumeId: input.resumeId,
            userId: user.id,
            elapsedMs: Math.round(performance.now() - parseStart),
            message: error instanceof Error ? error.message : String(error),
          })
        )
        if (error instanceof TRPCError) throw error
        console.error('[resume] parsing error', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Unable to process resume. Please try again.',
        })
      }
    }),

  getWizardState: protectedProcedure
    .input(getWizardStateInputSchema)
    .output(wizardStateSchema.nullable())
    .query(async ({ ctx, input }) => {
      const { supabase, user } = ctx

      const { data, error } = await supabase
        .schema('core')
        .from('resume_wizard_state')
        .select('*')
        .eq('resume_id', input.resumeId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to load wizard state: ${error.message}`,
        })
      }

      if (!data) {
        return null
      }

      return {
        id: data.id,
        userId: data.user_id,
        resumeId: data.resume_id,
        currentStep: data.current_step ?? 0,
        completedSteps: data.completed_steps ?? [],
        parsedData: data.parsed_data as z.infer<typeof parsedResumeSchema>,
        errors: data.errors as Array<z.infer<typeof parseErrorSchema>> | undefined,
        startedAt: data.started_at,
        updatedAt: data.updated_at,
        completedAt: data.completed_at ?? null,
      }
    }),

  saveSection: protectedProcedure.input(saveSectionInputSchema).mutation(async ({ ctx, input }) => {
    const { supabase, user } = ctx
    const mergeStrategy = input.mergeStrategy?.mode ?? 'replace'

    const { data: wizardState, error: wizardError } = await supabase
      .schema('core')
      .from('resume_wizard_state')
      .select('*')
      .eq('resume_id', input.wizardState.resumeId)
      .eq('user_id', user.id)
      .single()

    if (wizardError) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Wizard state not found for resume',
      })
    }

    switch (input.section) {
      case 'general': {
        const generalPayload = profileGeneralInputSchema.partial().parse(input.data)
        // biome-ignore lint/suspicious/noExplicitAny: Complex type inference from Supabase query
        await upsertProfileGeneral(supabase, user.id, generalPayload as any)
        break
      }
      case 'employment': {
        const employmentPayload = profileEmploymentInputSchema.parse(input.data ?? {})
        await upsertEmploymentPreferences(supabase, user.id, employmentPayload)
        break
      }
      case 'experience': {
        const experienceArray = z.array(parsedExperienceSchema).parse(input.data)
        await upsertExperienceEntries(supabase, user.id, experienceArray, mergeStrategy)
        break
      }
      case 'education': {
        const educationArray = z.array(parsedEducationSchema).parse(input.data)
        await upsertEducationEntries(supabase, user.id, educationArray, mergeStrategy)
        break
      }
      case 'certifications': {
        const certArray = z.array(parsedCertificationSchema).parse(input.data)
        await upsertCertifications(supabase, user.id, certArray, mergeStrategy)
        break
      }
      case 'skills': {
        const skillArray = z
          .array(
            parsedSkillSchema.extend({
              csiMatch: z
                .object({
                  id: z.string(),
                  code: z.string().nullable(),
                })
                .optional(),
              onetMatch: z
                .object({
                  id: z.string(),
                  title: z.string().nullable(),
                })
                .optional(),
            })
          )
          .parse(input.data)
        await upsertSkills(
          supabase,
          user.id,
          skillArray.map((skill) => ({
            name: skill.name,
            csiMatch: skill.csiMatch,
            onetMatch: skill.onetMatch,
          })),
          mergeStrategy
        )
        break
      }
      default:
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Unsupported section ${input.section}`,
        })
    }

    const completedSet = new Set([
      ...(wizardState.completed_steps ?? []),
      input.wizardState.currentStep,
    ])

    const { error: updateWizardError } = await supabase
      .schema('core')
      .from('resume_wizard_state')
      .update({
        current_step: input.wizardState.currentStep + 1,
        completed_steps: Array.from(completedSet).sort((a, b) => a - b),
        updated_at: new Date().toISOString(),
      })
      .eq('id', wizardState.id)

    if (updateWizardError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to update wizard progress: ${updateWizardError.message}`,
      })
    }

    return { success: true }
  }),

  updateProgress: protectedProcedure
    .input(updateProgressInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx

      const { error } = await supabase
        .schema('core')
        .from('resume_wizard_state')
        .update({
          current_step: input.currentStep,
          completed_steps: input.completedSteps ?? [],
          updated_at: new Date().toISOString(),
        })
        .eq('resume_id', input.resumeId)
        .eq('user_id', user.id)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to update wizard state: ${error.message}`,
        })
      }

      return { success: true }
    }),

  hasUploaded: protectedProcedure.output(hasUploadedOutputSchema).query(async ({ ctx }) => {
    const { supabase, user } = ctx

    const { data, error } = await supabase
      .schema('core')
      .from('resume_uploads')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to load resume uploads: ${error.message}`,
      })
    }

    return { hasUploaded: Boolean(data) }
  }),
})
