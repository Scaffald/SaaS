/**
 * Screening answers, written and read through one table.
 *
 * The apply form offers years of experience as buckets but stores a number.
 * Writing and reading used two different tables, so "5+ years" was saved as 5
 * and read back as "3-5" (#1415). The table below is the only place a bucket
 * meets its number; both directions go through it.
 */

export type YearsExperienceBucket = '0-1' | '1-3' | '3-5' | '5+'

/** Bucket → the number stored in `screening_answers.years_experience`. */
export const YEARS_EXPERIENCE_BUCKETS: ReadonlyArray<{
  value: YearsExperienceBucket
  label: string
  years: number
}> = [
  { value: '0-1', label: '0-1 years', years: 0 },
  { value: '1-3', label: '1-3 years', years: 2 },
  { value: '3-5', label: '3-5 years', years: 4 },
  { value: '5+', label: '5+ years', years: 5 },
]

export function bucketToYears(bucket: string): number | undefined {
  return YEARS_EXPERIENCE_BUCKETS.find((b) => b.value === bucket)?.years
}

/**
 * A stored number → its bucket. Thresholds sit on the stored values, so every
 * bucket round-trips and a free-typed number lands in the bucket it belongs to.
 */
export function yearsToBucket(years: number | null | undefined): YearsExperienceBucket | undefined {
  if (years == null || Number.isNaN(years)) return undefined
  if (years >= 5) return '5+'
  if (years >= 3) return '3-5'
  if (years >= 1) return '1-3'
  return '0-1'
}

/**
 * "5+ yrs" for anything at the top bucket, "2 yrs", "1 yr", "0 yrs". The top
 * bucket is open-ended, so printing the bare 5 understated it.
 */
export function formatYearsExperience(years: number | null | undefined): string {
  if (years == null || Number.isNaN(years)) return ''
  if (years >= 5) return '5+ yrs'
  return `${years} yr${years === 1 ? '' : 's'}`
}

const TRAILING_COUNTRY = /,\s*(United States( of America)?|USA|U\.S\.A?\.?|US)\s*$/i

/**
 * A free-text location without a trailing "United States" / "USA". Every
 * applicant is in the US, and the suffix is what pushed the applicant summary
 * line off a phone screen (#1417).
 */
export function formatScreeningLocation(location: string | null | undefined): string {
  if (!location) return ''
  return location.replace(TRAILING_COUNTRY, '').trim()
}

export interface CustomQuestionAnswer {
  question?: string | null
  answer?: string | boolean | string[] | null
}

export function formatCustomAnswer(answer: CustomQuestionAnswer['answer']): string {
  if (typeof answer === 'boolean') return answer ? 'Yes' : 'No'
  if (Array.isArray(answer)) return answer.filter(Boolean).join(', ')
  return typeof answer === 'string' ? answer.trim() : ''
}

const SCREENING_LABELS: Record<string, string> = {
  current_location: 'Location',
  willing_to_relocate: 'Willing to Relocate',
  years_experience: 'Years of Experience',
  is_authorized_to_work: 'Authorized to Work in US',
  earliest_start_date: 'Earliest Start Date',
}

export interface ScreeningRow {
  key: string
  label: string
  value: string
}

function isEmpty(value: unknown): boolean {
  return (
    value == null ||
    (typeof value === 'string' && value.trim() === '') ||
    (Array.isArray(value) && value.length === 0)
  )
}

/**
 * The rows a worker sees under "Your Screening Answers": the fixed answers in
 * label order, then each custom question as question → answer. Empty answers
 * are skipped, and `custom_question_answers` is never printed as its own row
 * (#1416: it showed as a stray "custom question answers" line).
 */
export function screeningAnswerRows(screening: Record<string, unknown> | null | undefined): ScreeningRow[] {
  if (!screening) return []
  const rows: ScreeningRow[] = []

  for (const [key, label] of Object.entries(SCREENING_LABELS)) {
    const value = screening[key]
    if (isEmpty(value)) continue
    let display: string
    if (typeof value === 'boolean') display = value ? 'Yes' : 'No'
    else if (key === 'years_experience' && typeof value === 'number') {
      display = formatYearsExperience(value)
    } else display = String(value)
    if (display) rows.push({ key, label, value: display })
  }

  const custom = screening.custom_question_answers
  if (Array.isArray(custom)) {
    custom.forEach((qa: CustomQuestionAnswer, i) => {
      const question = qa?.question?.trim()
      const value = formatCustomAnswer(qa?.answer)
      if (!question || !value) return
      rows.push({ key: `custom_${i}`, label: question, value })
    })
  }

  return rows
}
