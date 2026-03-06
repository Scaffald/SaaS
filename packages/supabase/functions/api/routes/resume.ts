/**
 * Resume REST API
 * Manages resume uploads, AI-powered parsing, and the wizard state
 * Migrated from: packages/supabase/functions/trpc/routers/resume.router.ts
 */

import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.ts'
import { extractTextFromPdf } from '../../_shared/pdf/extract-text.ts'

const app = new Hono()

app.use('*', authMiddleware)

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

// biome-ignore lint/suspicious/noExplicitAny: Dynamic import for optional dependency
let mammothModule: any | null = null

// biome-ignore lint/suspicious/noExplicitAny: Dynamic import for optional dependency
async function getMammoth(): Promise<any> {
  if (!mammothModule) {
    mammothModule = await import('mammoth')
  }
  return mammothModule
}

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
    throw new Error(
      `Failed to decode file: ${error instanceof Error ? error.message : String(error)}`
    )
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

async function extractTextFromDocLike(bytes: Uint8Array): Promise<string> {
  try {
    const mammoth = await getMammoth()
    // Pass Uint8Array (Deno edge runtime has no node:buffer; mammoth accepts buffer-like)
    const result = await mammoth.extractRawText({ buffer: bytes })
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
    const { text } = await extractTextFromPdf(bytes, { namespace: 'resume' })
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

function extractJsonPayloadFromOpenAI(content: unknown): string | null {
  if (!content) return null
  const str = typeof content === 'string' ? content : JSON.stringify(content)
  const fencedMatch = str.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fencedMatch) return fencedMatch[1].trim()
  if ((str.startsWith('{') && str.endsWith('}')) || (str.startsWith('[') && str.endsWith(']')))
    return str
  const firstBrace = str.indexOf('{')
  const lastBrace = str.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace)
    return str.slice(firstBrace, lastBrace + 1).trim()
  return str
}

// ============================================================================
// GET /has-uploaded
// ============================================================================

app.get('/has-uploaded', async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')

  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { data, error } = await supabase
    .schema('core')
    .from('resume_uploads')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    return c.json({ error: 'Failed to check resume uploads', message: error.message }, 500)
  }

  return c.json({ hasUploaded: Boolean(data) })
})

// ============================================================================
// POST /upload
// ============================================================================

app.post('/upload', async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')

  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  // biome-ignore lint/suspicious/noExplicitAny: Request body
  let body: any
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const { fileData, fileName, fileSize, mimeType } = body ?? {}

  if (!fileData || !fileName || !fileSize || !mimeType) {
    return c.json({ error: 'Missing required fields: fileData, fileName, fileSize, mimeType' }, 400)
  }

  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return c.json({ error: 'Please upload a PDF or Word document' }, 400)
  }

  if (fileSize > MAX_FILE_SIZE_BYTES) {
    return c.json({ error: 'File size exceeds 1MB limit. Please upload a smaller file.' }, 400)
  }

  let bytes: Uint8Array
  try {
    bytes = decodeBase64File(fileData)
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Failed to decode file' }, 400)
  }

  if (bytes.byteLength > MAX_FILE_SIZE_BYTES) {
    return c.json({ error: 'File size exceeds 1MB limit. Please upload a smaller file.' }, 400)
  }

  const filePath = buildResumePath(user.id, fileName)
  const { error: uploadError } = await supabase.storage
    .from(RESUME_BUCKET_ID)
    .upload(filePath, bytes, { contentType: mimeType, upsert: false })

  if (uploadError) {
    console.error('[resume] upload failure', uploadError)
    return c.json({ error: 'Failed to upload file. Please try again.' }, 500)
  }

  const { data, error } = await supabase
    .schema('core')
    .from('resume_uploads')
    .insert({
      user_id: user.id,
      file_path: filePath,
      file_name: fileName,
      file_size: bytes.byteLength,
      mime_type: mimeType,
      parsing_status: 'processing',
    })
    .select()
    .single()

  if (error || !data) {
    console.error('[resume] failed to persist upload', error)
    return c.json({ error: 'Failed to store resume metadata.' }, 500)
  }

  return c.json({ success: true, resumeId: data.id, filePath: data.file_path })
})

// ============================================================================
// POST /parse
// ============================================================================

app.post('/parse', async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')

  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  // biome-ignore lint/suspicious/noExplicitAny: Request body
  let body: any
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const resumeId: string = body?.resumeId
  const sections: ResumeSection[] = body?.sections ?? [...RESUME_SECTIONS]

  if (!resumeId) {
    return c.json({ error: 'resumeId is required' }, 400)
  }

  const openAiKey = Deno.env.get('OPENAI_API_KEY')?.trim()

  // Update status to processing
  await supabase
    .schema('core')
    .from('resume_uploads')
    .update({ parsing_status: 'processing', updated_at: new Date().toISOString() })
    .eq('id', resumeId)

  try {
    // Fetch the upload record
    const { data: resume, error: fetchError } = await supabase
      .schema('core')
      .from('resume_uploads')
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !resume) {
      return c.json({ error: 'Resume upload not found' }, 404)
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(RESUME_BUCKET_ID)
      .download(resume.file_path)

    if (downloadError || !fileData) {
      return c.json({ error: 'Failed to download resume file' }, 500)
    }

    const arrayBuffer = await (fileData as Blob).arrayBuffer()
    const fileBytes = new Uint8Array(arrayBuffer)

    const resumeText = await extractResumeText(fileBytes, resume.mime_type ?? 'application/pdf')
    if (!resumeText || resumeText.trim().length === 0) {
      await supabase
        .schema('core')
        .from('resume_uploads')
        .update({ parsing_status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', resumeId)
      return c.json({ error: 'Unable to process resume. Please try again or contact support.' }, 400)
    }

    // Call OpenAI if configured
    // biome-ignore lint/suspicious/noExplicitAny: Dynamic parsed data
    let parsed: any = {}
    if (openAiKey) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${openAiKey}`, 'Content-Type': 'application/json' },
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
            { role: 'user', content: buildParsingPrompt(resumeText) },
          ],
        }),
      })

      if (response.ok) {
        const completion = await response.json()
        const rawContent = completion?.choices?.[0]?.message?.content
        const jsonStr = extractJsonPayloadFromOpenAI(rawContent)
        if (jsonStr) {
          try {
            parsed = JSON.parse(jsonStr)
          } catch {
            console.warn('[resume] failed to parse OpenAI response')
          }
        }
      } else {
        console.warn('[resume] OpenAI request failed', response.status)
      }
    }

    // Build errors for missing sections
    const errors: Array<{ section: ResumeSection; message: string }> = []
    const missingSectionMessage = (section: ResumeSection) =>
      openAiKey
        ? `No ${section} information found in resume.`
        : 'Resume parsing is disabled because the OpenAI API key is not configured. Please fill in this section manually.'

    for (const section of sections) {
      const hasData =
        (section === 'employment' && parsed.employment) ||
        (section !== 'employment' && Array.isArray(parsed[section]) && parsed[section].length > 0)
      if (!hasData) {
        errors.push({ section, message: missingSectionMessage(section) })
      }
    }

    const parsedData = parsed

    // Upsert wizard state
    const { data: existingWizard } = await supabase
      .schema('core')
      .from('resume_wizard_state')
      .select('id')
      .eq('resume_id', resumeId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingWizard) {
      await supabase
        .schema('core')
        .from('resume_wizard_state')
        .update({
          parsed_data: parsedData,
          errors,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingWizard.id)
    } else {
      await supabase
        .schema('core')
        .from('resume_wizard_state')
        .insert({
          user_id: user.id,
          resume_id: resumeId,
          current_step: 0,
          completed_steps: [],
          parsed_data: parsedData,
          errors,
          started_at: new Date().toISOString(),
        })
    }

    // Update parsing status
    await supabase
      .schema('core')
      .from('resume_uploads')
      .update({
        parsing_status: 'completed',
        parsed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...(errors.length > 0 ? { parsing_errors: errors } : {}),
      })
      .eq('id', resumeId)

    return c.json({
      success: true,
      parsedData,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (err) {
    console.error('[resume] parse error', err)
    await supabase
      .schema('core')
      .from('resume_uploads')
      .update({ parsing_status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', resumeId)
    return c.json(
      { error: err instanceof Error ? err.message : 'Unable to process resume. Please try again.' },
      500
    )
  }
})

// ============================================================================
// GET /wizard-state
// ============================================================================

app.get('/wizard-state', async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')

  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const resumeId = c.req.query('resumeId')
  if (!resumeId) return c.json({ error: 'resumeId query param is required' }, 400)

  const { data, error } = await supabase
    .schema('core')
    .from('resume_wizard_state')
    .select('*')
    .eq('resume_id', resumeId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    return c.json({ error: 'Failed to load wizard state', message: error.message }, 500)
  }

  if (!data) return c.json(null)

  return c.json({
    id: data.id,
    userId: data.user_id,
    resumeId: data.resume_id,
    currentStep: data.current_step ?? 0,
    completedSteps: data.completed_steps ?? [],
    parsedData: data.parsed_data ?? undefined,
    errors: data.errors ?? undefined,
    startedAt: data.started_at,
    updatedAt: data.updated_at,
    completedAt: data.completed_at ?? null,
  })
})

// ============================================================================
// POST /wizard-state/save-section
// ============================================================================

app.post('/wizard-state/save-section', async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')

  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  // biome-ignore lint/suspicious/noExplicitAny: Request body
  let body: any
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const { section, data: sectionData, wizardState: ws, mergeStrategy } = body ?? {}

  if (!section || !ws?.resumeId) {
    return c.json({ error: 'section and wizardState.resumeId are required' }, 400)
  }

  const mergeMode: 'replace' | 'append' | 'keepExisting' = mergeStrategy?.mode ?? 'replace'

  // Fetch wizard row
  const { data: wizardRow, error: wizardError } = await supabase
    .schema('core')
    .from('resume_wizard_state')
    .select('*')
    .eq('resume_id', ws.resumeId)
    .eq('user_id', user.id)
    .single()

  if (wizardError || !wizardRow) {
    return c.json({ error: 'Wizard state not found for resume' }, 400)
  }

  // Apply section data to profile tables
  try {
    switch (section as ResumeSection) {
      case 'general': {
        // biome-ignore lint/suspicious/noExplicitAny: Dynamic section data
        const d = sectionData as any
        const now = new Date().toISOString()
        const userUpdate: Record<string, unknown> = { updated_at: now }
        if (d?.about !== undefined) userUpdate.about = d.about
        if (d?.avatar_path !== undefined) userUpdate.avatar_path = d.avatar_path
        if (d?.first_name !== undefined || d?.last_name !== undefined) {
          const displayName = [d?.first_name ?? '', d?.last_name ?? ''].join(' ').trim()
          if (displayName) userUpdate.display_name = displayName
        }
        if (d?.about !== undefined || d?.avatar_path !== undefined) {
          await supabase.schema('core').from('users').update(userUpdate).eq('id', user.id)
        }
        const privateUpdate: Record<string, unknown> = { user_id: user.id, updated_at: now }
        if (d?.first_name !== undefined) privateUpdate.first_name = d.first_name
        if (d?.last_name !== undefined) privateUpdate.last_name = d.last_name
        if (d?.address !== undefined) privateUpdate.address = d.address ?? null
        if (d?.phone !== undefined) privateUpdate.phone = d.phone ?? null
        await supabase
          .schema('core')
          .from('profile')
          .upsert(privateUpdate as never, { onConflict: 'user_id' })
        break
      }
      case 'employment': {
        // biome-ignore lint/suspicious/noExplicitAny: Dynamic section data
        const d = sectionData as any
        const hourlyRateCents =
          d?.hourly_rate !== undefined && d?.hourly_rate !== null
            ? Math.round(d.hourly_rate * 100)
            : null
        await supabase
          .schema('core')
          .from('profile')
          .update({
            updated_at: new Date().toISOString(),
            preferred_work_locations: d?.preferred_work_locations ?? null,
            open_to_travel: d?.open_to_travel ?? null,
            travel_distance_miles: d?.travel_distance_miles ?? null,
            availability: d?.availability ?? null,
            hourly_rate_cents: hourlyRateCents,
            us_resident: d?.us_resident ?? null,
            authorized_countries: d?.authorized_countries ?? null,
            us_passport: d?.us_passport ?? null,
            drivers_license_classes: d?.drivers_license_classes ?? null,
            military_status: d?.military_status ?? null,
          })
          .eq('user_id', user.id)
        break
      }
      case 'experience': {
        if (mergeMode === 'keepExisting') break
        if (mergeMode === 'replace') {
          await supabase
            .schema('core')
            .from('user_experience')
            .delete()
            .eq('user_id', user.id)
        }
        const entries = Array.isArray(sectionData) ? sectionData : []
        const payload = entries
          // biome-ignore lint/suspicious/noExplicitAny: Dynamic entry
          .filter((e: any) => e.title && e.company)
          // biome-ignore lint/suspicious/noExplicitAny: Dynamic entry
          .map((e: any) => ({
            user_id: user.id,
            job_title: e.title ?? '',
            company_name: e.company ?? '',
            start_date: e.startDate ?? null,
            end_date: e.endDate ?? null,
            is_current: e.isCurrent ?? false,
            description: e.summary ?? null,
          }))
        if (payload.length > 0) {
          await supabase.schema('core').from('user_experience').insert(payload)
        }
        break
      }
      case 'education': {
        if (mergeMode === 'keepExisting') break
        if (mergeMode === 'replace') {
          await supabase
            .schema('core')
            .from('user_education')
            .delete()
            .eq('user_id', user.id)
        }
        const entries = Array.isArray(sectionData) ? sectionData : []
        const payload = entries
          // biome-ignore lint/suspicious/noExplicitAny: Dynamic entry
          .filter((e: any) => e.school)
          // biome-ignore lint/suspicious/noExplicitAny: Dynamic entry
          .map((e: any) => ({
            user_id: user.id,
            school: e.school ?? '',
            degree: e.degree ?? null,
            field_of_study: e.fieldOfStudy ?? null,
            start_date: e.startDate ?? null,
            end_date: e.endDate ?? null,
          }))
        if (payload.length > 0) {
          await supabase.schema('core').from('user_education').insert(payload)
        }
        break
      }
      case 'certifications': {
        if (mergeMode === 'replace') {
          await supabase
            .schema('core')
            .from('user_certifications')
            .delete()
            .eq('user_id', user.id)
        }
        // Skip inserting certifications (free-form data doesn't match taxonomy)
        break
      }
      case 'skills': {
        if (mergeMode === 'keepExisting') break
        if (mergeMode === 'replace') {
          await supabase
            .schema('core')
            .from('user_skills')
            .delete()
            .eq('user_id', user.id)
        }
        const skills = Array.isArray(sectionData) ? sectionData : []
        const inserts = skills
          // biome-ignore lint/suspicious/noExplicitAny: Dynamic entry
          .filter((s: any) => s.name && (s.csiMatch?.id || s.onetMatch?.id))
          // biome-ignore lint/suspicious/noExplicitAny: Dynamic entry
          .map((s: any) => ({
            user_id: user.id,
            skill_taxonomy: s.csiMatch?.id ? 'csi' : 'onet',
            csi_skill_id: s.csiMatch?.id ?? null,
            onet_occupation_id: s.csiMatch?.id ? null : (s.onetMatch?.id ?? null),
            proficiency_level: 3,
          }))
        if (inserts.length > 0) {
          await supabase.schema('core').from('user_skills').insert(inserts)
        }
        break
      }
      default:
        return c.json({ error: `Unsupported section: ${section}` }, 400)
    }
  } catch (err) {
    console.error('[resume] save-section error', section, err)
    return c.json({ error: 'Failed to save section data', message: String(err) }, 500)
  }

  // Advance wizard progress
  const completedSet = new Set<number>([...(wizardRow.completed_steps ?? []), ws.currentStep])
  await supabase
    .schema('core')
    .from('resume_wizard_state')
    .update({
      current_step: ws.currentStep + 1,
      completed_steps: Array.from(completedSet).sort((a, b) => a - b),
      updated_at: new Date().toISOString(),
    })
    .eq('id', wizardRow.id)

  return c.json({ success: true })
})

// ============================================================================
// POST /wizard-state/update-progress
// ============================================================================

app.post('/wizard-state/update-progress', async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')

  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  // biome-ignore lint/suspicious/noExplicitAny: Request body
  let body: any
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const { resumeId, currentStep, completedSteps } = body ?? {}

  if (!resumeId || currentStep === undefined) {
    return c.json({ error: 'resumeId and currentStep are required' }, 400)
  }

  const { error } = await supabase
    .schema('core')
    .from('resume_wizard_state')
    .update({
      current_step: currentStep,
      completed_steps: completedSteps ?? [],
      updated_at: new Date().toISOString(),
    })
    .eq('resume_id', resumeId)
    .eq('user_id', user.id)

  if (error) {
    return c.json({ error: 'Failed to update wizard progress', message: error.message }, 500)
  }

  return c.json({ success: true })
})

export default app
