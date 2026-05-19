import { Platform } from 'react-native'
import { setDocumentTitle } from '@scf/core/utils/platform'
import type { Job, ExternalJob } from '@scaffald/sdk'

/**
 * SEO meta tags for job detail pages (web only).
 * Sets title, description, and Open Graph tags for social sharing.
 *
 * @see Issue #80
 */

interface JobSeoHeadProps {
  job: Job | ExternalJob
  canonicalUrl?: string
}

/** Extract plain text from TipTap JSON */
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

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return `${text.substring(0, maxLen - 3)}...`
}

export function JobSeoHead({ job, canonicalUrl }: JobSeoHeadProps) {
  if (Platform.OS !== 'web') return null

  const title = job.title || 'Job Opening'
  const orgName =
    ('organization' in job && job.organization?.name) ||
    ('company_name' in job && job.company_name) ||
    'Scaffald'
  const pageTitle = `${title} at ${orgName} | Scaffald`

  const descriptionText = typeof job.description === 'string'
    ? job.description
    : extractPlainText(job.description)
  const metaDescription = truncate(descriptionText || `Apply for ${title} at ${orgName}`, 160)

  const location =
    typeof job.location === 'string'
      ? job.location
      : job.location && typeof job.location === 'object' && 'city' in job.location
        ? [job.location.city, job.location.state].filter(Boolean).join(', ')
        : ''

  setDocumentTitle(pageTitle)

  return (
    <>
      <meta name="description" content={metaDescription} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content="website" />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={metaDescription} />
      {location && <meta name="geo.placename" content={location} />}
    </>
  )
}
