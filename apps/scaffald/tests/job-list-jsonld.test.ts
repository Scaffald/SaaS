/**
 * The ItemList is the only crawlable copy of the /jobs listing — the rows
 * themselves arrive through react-query after hydration — so its URLs are
 * load-bearing for whether the public job pages get discovered at all.
 *
 * Lives here rather than beside the component because this is the suite that
 * demonstrably runs in CI, and a test that does not run is the failure mode
 * this repo keeps re-learning (#469, #553, #592).
 */
import { describe, expect, it } from 'vitest'
import { buildJobListSchema } from '@scf/core/features/discover/components/JobListJsonLd'

const ORIGIN = 'https://scaffald.com'

describe('buildJobListSchema', () => {
  it('points each entry at the job detail page, numbered from one', () => {
    const schema = buildJobListSchema(
      [
        { slug: 'pipe-welder-fabricator-apex', title: 'Pipe Welder / Fabricator' },
        { slug: 'scaffold-foreman-apex', title: 'Scaffold Foreman' },
      ],
      ORIGIN
    )

    expect(schema['@type']).toBe('ItemList')
    expect(schema.itemListElement).toEqual([
      {
        '@type': 'ListItem',
        position: 1,
        url: `${ORIGIN}/jobs/pipe-welder-fabricator-apex`,
        name: 'Pipe Welder / Fabricator',
      },
      {
        '@type': 'ListItem',
        position: 2,
        url: `${ORIGIN}/jobs/scaffold-foreman-apex`,
        name: 'Scaffold Foreman',
      },
    ])
  })

  it('produces absolute URLs on the same origin as the canonical', () => {
    const schema = buildJobListSchema([{ slug: 'welder', title: 'Welder' }], ORIGIN)
    // A relative or cross-origin URL here silently drops the entry from
    // Google's carousel eligibility.
    for (const item of schema.itemListElement) {
      expect(item.url.startsWith(`${ORIGIN}/jobs/`)).toBe(true)
    }
  })

  it('stays valid for an empty list', () => {
    const schema = buildJobListSchema([], ORIGIN)
    expect(schema['@type']).toBe('ItemList')
    expect(schema.itemListElement).toEqual([])
  })
})
