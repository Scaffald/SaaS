import { Platform } from 'react-native'
import type { Job, ExternalJob } from '@scaffald/sdk'

/**
 * Schema.org JobPosting JSON-LD generator for Google for Jobs integration.
 * Renders a <script type="application/ld+json"> tag on web only.
 *
 * @see https://developers.google.com/search/docs/appearance/structured-data/job-posting
 * @see Issue #80
 */

interface JobPostingJsonLdProps {
  job: Job | ExternalJob
  /** Full canonical URL for this job listing */
  canonicalUrl?: string
}

/** Map internal employment_type values to Schema.org BLS values */
function mapEmploymentType(type?: string | null): string | undefined {
  if (!type) return undefined
  const map: Record<string, string> = {
    full_time: 'FULL_TIME',
    part_time: 'PART_TIME',
    contract: 'CONTRACTOR',
    temporary: 'TEMPORARY',
    temp: 'TEMPORARY',
    intern: 'INTERN',
  }
  return map[type] || undefined
}

/** Map pay_range_type to Schema.org unitText */
function mapPayUnit(type?: string | null): string | undefined {
  if (!type) return undefined
  const map: Record<string, string> = {
    hourly: 'HOUR',
    salary: 'YEAR',
    contract: 'YEAR',
    project: 'YEAR',
  }
  return map[type] || undefined
}

/** Map education level to Schema.org educationRequirements */
function mapEducationLevel(level?: string | null): string | undefined {
  if (!level || level === 'none') return undefined
  const map: Record<string, string> = {
    high_school: 'high school',
    associate: 'associate degree',
    bachelor: 'bachelor degree',
    master: 'master degree',
    phd: 'doctoral degree',
  }
  return map[level] || undefined
}

/** Extract plain text from a TipTap JSON content object */
function extractPlainText(content: unknown): string {
  if (!content) return ''
  if (typeof content === 'string') return content
  if (typeof content === 'object' && content !== null) {
    const node = content as { text?: string; content?: unknown[] }
    if (node.text) return node.text
    if (Array.isArray(node.content)) {
      return node.content.map(extractPlainText).join(' ')
    }
  }
  return ''
}

/** Format location for Schema.org Place */
function buildJobLocation(job: Job | ExternalJob) {
  // Internal job with structured location
  if ('location' in job && job.location && typeof job.location === 'object' && 'city' in job.location) {
    const loc = job.location as { city?: string; state?: string; zip_code?: string; country?: string }
    return {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        ...(loc.city && { addressLocality: loc.city }),
        ...(loc.state && { addressRegion: loc.state }),
        ...(loc.zip_code && { postalCode: loc.zip_code }),
        ...(loc.country && { addressCountry: loc.country }),
      },
    }
  }

  // String location
  const locationStr =
    ('location' in job && typeof job.location === 'string' && job.location) ||
    ('job_location' in job && typeof job.job_location === 'string' && job.job_location) ||
    null

  if (locationStr) {
    return {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        streetAddress: locationStr,
      },
    }
  }

  return undefined
}

/** Build the full Schema.org JobPosting JSON-LD object */
function buildJobPostingSchema(job: Job | ExternalJob, canonicalUrl?: string) {
  const isInternal = 'organization' in job && job.organization
  const description = typeof job.description === 'string'
    ? job.description
    : extractPlainText(job.description)

  const hiringOrganization = isInternal && job.organization
    ? {
        '@type': 'Organization',
        name: job.organization.name,
        ...(job.organization.logo && { logo: job.organization.logo }),
      }
    : 'company_name' in job && job.company_name
      ? {
          '@type': 'Organization',
          name: job.company_name,
          ...('company_logo' in job && job.company_logo && { logo: job.company_logo }),
        }
      : undefined

  const jobLocation = buildJobLocation(job)

  // Remote option → applicantLocationRequirements
  const remoteOption = 'remote_option' in job ? job.remote_option : undefined
  const isRemote = remoteOption === 'remote'

  // Pay range → baseSalary
  const minCents = job.pay_range_min_cents
  const maxCents = job.pay_range_max_cents
  const payType = job.pay_range_type
  const baseSalary =
    minCents && maxCents && payType
      ? {
          '@type': 'MonetaryAmount',
          currency: 'USD',
          value: {
            '@type': 'QuantitativeValue',
            minValue: minCents / 100,
            maxValue: maxCents / 100,
            unitText: mapPayUnit(payType),
          },
        }
      : undefined

  const employmentType = mapEmploymentType(job.employment_type)

  // Dates
  const datePosted =
    ('published_at' in job && job.published_at) ||
    ('posted_date' in job && job.posted_date) ||
    ('created_at' in job && job.created_at) ||
    undefined

  // Validity — default to 60 days from posting if no explicit deadline
  const validThrough =
    ('application_deadline' in job && (job as { application_deadline?: string }).application_deadline) ||
    (datePosted
      ? new Date(new Date(datePosted).getTime() + 60 * 24 * 60 * 60 * 1000).toISOString()
      : undefined)

  // Education requirements
  const educationLevel = 'minimum_education_level' in job
    ? mapEducationLevel(job.minimum_education_level)
    : undefined

  // Experience requirements
  const experienceMonths = 'minimum_years_experience' in job && job.minimum_years_experience
    ? job.minimum_years_experience * 12
    : undefined

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org/',
    '@type': 'JobPosting',
    title: job.title,
    description: description || 'No description available',
    ...(hiringOrganization && { hiringOrganization }),
    ...(jobLocation && { jobLocation }),
    ...(employmentType && { employmentType }),
    ...(baseSalary && { baseSalary }),
    ...(datePosted && { datePosted }),
    ...(validThrough && { validThrough }),
    ...(canonicalUrl && { url: canonicalUrl }),
    ...(isRemote && {
      jobLocationType: 'TELECOMMUTE',
      applicantLocationRequirements: {
        '@type': 'Country',
        name: 'US',
      },
    }),
    ...(educationLevel && {
      educationRequirements: {
        '@type': 'EducationalOccupationalCredential',
        credentialCategory: educationLevel,
      },
    }),
    ...(experienceMonths && {
      experienceRequirements: {
        '@type': 'OccupationalExperienceRequirements',
        monthsOfExperience: experienceMonths,
      },
    }),
  }

  return schema
}

/**
 * Renders Schema.org JobPosting JSON-LD for Google for Jobs.
 * Only renders on web (no-op on native).
 */
export function JobPostingJsonLd({ job, canonicalUrl }: JobPostingJsonLdProps) {
  // Only render on web
  if (Platform.OS !== 'web') return null

  const schema = buildJobPostingSchema(job, canonicalUrl)

  // On web, inject script tag via dangerouslySetInnerHTML
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

/** Export builder for testing or use outside React */
export { buildJobPostingSchema }
