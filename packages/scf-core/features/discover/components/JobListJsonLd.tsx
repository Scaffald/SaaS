import { Platform } from 'react-native'

/**
 * Schema.org ItemList JSON-LD for the public `/jobs` listing.
 *
 * The listing itself is a react-query surface: its rows arrive after
 * hydration, so a crawler that does not execute JavaScript sees an empty
 * list no matter how the page is rendered. Emitting the same rows as
 * structured data from the route loader gives the crawler the content in a
 * form it is guaranteed to read, without a second render path that could
 * disagree with the client tree — the hydration hazard behind #679/#681.
 *
 * Each entry points at the job's own `/jobs/<slug>` page, which is
 * server-rendered with a full JobPosting schema (#734). This list's job is to
 * be the route between them, not to restate them.
 *
 * @see https://developers.google.com/search/docs/appearance/structured-data/carousel
 */

export interface JobListItem {
  slug: string
  title: string
}

interface JobListJsonLdProps {
  jobs: JobListItem[]
  /** Absolute origin, e.g. https://scaffald.com */
  origin: string
}

export function buildJobListSchema(jobs: JobListItem[], origin: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: jobs.map((job, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${origin}/jobs/${job.slug}`,
      name: job.title,
    })),
  }
}

export function JobListJsonLd({ jobs, origin }: JobListJsonLdProps) {
  // Web-only: native has no document head to inject into.
  if (Platform.OS !== 'web') return null
  if (jobs.length === 0) return null

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJobListSchema(jobs, origin)) }}
    />
  )
}
