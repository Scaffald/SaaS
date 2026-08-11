import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@scaffald/ui', async () => {
  const actual = await vi.importActual('@scaffald/ui')

  const Stack = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  const Text = ({ children }: { children?: ReactNode }) => <span>{children}</span>
  const Card = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  const H2 = ({ children }: { children?: ReactNode }) => <h2>{children}</h2>
  const Button = ({
    children,
    onPress,
    disabled,
  }: {
    children?: ReactNode
    onPress?: () => void
    disabled?: boolean
  }) => (
    <button type="button" onClick={onPress} disabled={disabled}>
      {children}
    </button>
  )

  const TabsItem = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  const Tabs = Object.assign(({ children }: { children?: ReactNode }) => <div>{children}</div>, {
    Item: TabsItem,
    Trigger: ({ children }: { children?: ReactNode }) => <button type="button">{children}</button>,
    Content: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  })

  return {
    ...actual,
    Stack,
    Row: Stack,
    Text,
    Card,
    H2,
    Button,
    Tabs,
  }
})

const reportQuery: {
  data: unknown
  isLoading: boolean
  isError: boolean
  error: Error | null
} = { data: undefined, isLoading: false, isError: false, error: null }

vi.mock('@scf/core/utils/compliance-sdk-hooks', () => ({
  useEEOReport: () => reportQuery,
}))

const { EEOReportScreen, countAdverseImpactFlags } = await import('../EEOReportScreen')

function category(overrides: Record<string, unknown> = {}) {
  return {
    category: 'white',
    applications: 10,
    interviewed: 6,
    offers: 3,
    hired: 5,
    withdrawn: 0,
    selectionRate: 0.5,
    impactRatio: 1,
    suppressed: false,
    ...overrides,
  }
}

function report(overrides: Record<string, unknown> = {}) {
  return {
    jobGroups: [
      {
        jobGroup: 'professionals',
        totalApplications: 20,
        totalHired: 7,
        categories: [
          category(),
          category({
            category: 'black',
            applications: 10,
            hired: 2,
            selectionRate: 0.2,
            impactRatio: 0.4,
          }),
        ],
      },
    ],
    gender: [
      category({ category: 'male' }),
      category({ category: 'declined', applications: 2, hired: 0, selectionRate: 0, impactRatio: null, suppressed: true }),
    ],
    veteranStatus: [category({ category: 'non_veteran' })],
    disabilityStatus: [category({ category: 'no' })],
    totals: {
      applications: 20,
      hired: 7,
      withdrawn: 1,
      jobGroups: 1,
      selfIdentified: 22,
    },
    minCellSize: 5,
    coverage: { totalApplications: 60, selfIdentified: 22, uncategorizedJobs: 2 },
    periodStart: '2026-01-01',
    periodEnd: '2026-08-11',
    ...overrides,
  }
}

beforeEach(() => {
  reportQuery.data = report()
  reportQuery.isLoading = false
  reportQuery.isError = false
  reportQuery.error = null
})

/**
 * These replace the sample-data assertions this file used to hold. The screen
 * now reads /v1/employer/eeo-report; every figure below comes from that
 * response rather than a constant.
 */
describe('EEOReportScreen — real figures', () => {
  it('renders counts from the API', () => {
    render(<EEOReportScreen />)

    expect(screen.getByText('20')).toBeInTheDocument() // total applications
    expect(screen.getByText('7')).toBeInTheDocument() // total hired
  })

  it('renders the database category vocabulary as human labels', () => {
    render(<EEOReportScreen />)

    // The API returns `black`, not "Black or African American". It appears in
    // both the EEO-1 table and the applicant-flow table, hence getAllByText.
    expect(screen.getAllByText(/Black or African American/).length).toBeGreaterThan(0)
    expect(screen.queryByText(/^black$/)).not.toBeInTheDocument()
  })

  it('shows a null impact ratio as an em dash, never as a passing badge', () => {
    // This is the bug the previous screen shipped: it divided by the highest
    // selection rate unconditionally, so 0/0 produced NaN and the badge read
    // "NaN% ✓ Pass" — a false all-clear on a filing.
    // Every ratio null, so no badge should render anywhere on the screen.
    const allNull = category({ selectionRate: null, impactRatio: null })
    reportQuery.data = report({
      jobGroups: [
        {
          jobGroup: 'professionals',
          totalApplications: 0,
          totalHired: 0,
          categories: [allNull],
        },
      ],
      gender: [category({ category: 'male', selectionRate: null, impactRatio: null })],
      veteranStatus: [category({ category: 'non_veteran', selectionRate: null, impactRatio: null })],
      disabilityStatus: [category({ category: 'no', selectionRate: null, impactRatio: null })],
    })
    render(<EEOReportScreen />)

    const bodyText = document.body.textContent ?? ''
    expect(bodyText).not.toMatch(/NaN/)
    // Neither verdict may appear: null is "not computed", not a pass and not
    // a flag. Rendering 0% would read as adverse impact that was never found.
    expect(bodyText).not.toMatch(/⚠ Flag/)
    expect(bodyText).not.toMatch(/✓ Pass/)
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('flags a ratio below four fifths and passes one at or above it', () => {
    render(<EEOReportScreen />)

    // black: 0.4 -> 40% flag. white: 1.0 -> 100% pass. The badge interpolates
    // two children, so the text is split across nodes — match on the rendered
    // textContent rather than a single text node.
    const badgeText = (needle: string) =>
      screen.getAllByText((_, element) => element?.textContent?.includes(needle) ?? false)

    expect(badgeText('40% ⚠ Flag').length).toBeGreaterThan(0)
    expect(badgeText('100% ✓ Pass').length).toBeGreaterThan(0)
  })

  it('counts adverse-impact flags across every dimension, not only gender', () => {
    // The tile previously read only the three gender ratios, so a flag against
    // an ethnicity — the thing an EEO-1 exists to surface — never reached the
    // summary. Here the single flag comes from the ethnicity table.
    render(<EEOReportScreen />)

    // "Adverse Impact" is both the metric tile label and a tab trigger.
    expect(screen.getAllByText(/Adverse Impact/).length).toBeGreaterThan(0)

    // Asserted directly rather than by matching a bare number in the DOM.
    // In this fixture gender contributes no flag (male 1.0, declined null) and
    // ethnicity contributes exactly one (black 0.4) — so a count that ignored
    // ethnicity would read 0.
    expect(countAdverseImpactFlags(report() as never)).toBe(1)
    expect(countAdverseImpactFlags(undefined)).toBe(0)

    // A null ratio is not a flag.
    expect(
      countAdverseImpactFlags({
        jobGroups: [{ categories: [{ impactRatio: null }] }],
        gender: [{ impactRatio: null }],
        veteranStatus: [],
        disabilityStatus: [],
      })
    ).toBe(0)

    // Every dimension is counted, not just ethnicity and gender.
    expect(
      countAdverseImpactFlags({
        jobGroups: [{ categories: [{ impactRatio: 0.5 }] }],
        gender: [{ impactRatio: 0.5 }],
        veteranStatus: [{ impactRatio: 0.5 }],
        disabilityStatus: [{ impactRatio: 0.5 }],
      })
    ).toBe(4)
  })

  it('marks suppressed cells rather than publishing them', () => {
    render(<EEOReportScreen />)
    expect(screen.getAllByText(/\(suppressed\)/).length).toBeGreaterThan(0)
  })

  it('renders Declined to State, which the mock dropped entirely', () => {
    // Declined respondents are in the denominator. Omitting them made the
    // gender table not add up to the applicant count.
    render(<EEOReportScreen />)
    expect(screen.getAllByText(/Declined to State/).length).toBeGreaterThan(0)
  })

  it('states the self-identification coverage, so a ratio is not read as universal', () => {
    render(<EEOReportScreen />)
    expect(screen.getByText(/22 of 60 applicants self-identified/)).toBeInTheDocument()
    expect(screen.getByText(/2 jobs have no EEO job category/)).toBeInTheDocument()
  })

  it('says so when nobody has self-identified rather than implying a clean report', () => {
    reportQuery.data = report({
      jobGroups: [],
      totals: { applications: 0, hired: 0, withdrawn: 0, jobGroups: 0, selfIdentified: 0 },
      coverage: { totalApplications: 40, selfIdentified: 0, uncategorizedJobs: 0 },
    })
    render(<EEOReportScreen />)

    expect(screen.getByText(/No EEO self-identification has been collected/)).toBeInTheDocument()
    // And no NaN in the hire-rate tile.
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument()
    expect(screen.getByText(/no applicants/)).toBeInTheDocument()
  })

  it('surfaces a load failure instead of rendering zeroes as fact', () => {
    reportQuery.data = undefined
    reportQuery.isError = true
    reportQuery.error = new Error('boom')
    render(<EEOReportScreen />)

    expect(screen.getByText(/Could not load the report/)).toBeInTheDocument()
  })
})

describe('EEOReportScreen — claims it must not make', () => {
  it('does not claim an active compliance status or a filing deadline', () => {
    render(<EEOReportScreen />)

    expect(screen.queryByText(/compliance status: active/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/next filing deadline/i)).not.toBeInTheDocument()
  })

  it('keeps export disabled, because there is still no export implementation', () => {
    render(<EEOReportScreen />)

    const exportButton = screen.getByRole('button', { name: /export/i })
    expect(exportButton).toBeDisabled()
  })

  it('does not invent a SOC code for a job group', () => {
    // The mock rendered "SOC 15-1252". `jobs.eeo_job_category` is a group
    // name; no SOC code is stored, so printing one is fabrication.
    render(<EEOReportScreen />)
    expect(screen.queryByText(/SOC /)).not.toBeInTheDocument()
  })
})
