import { ResponsiveSelect, Text, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import type { ApplicationStatus } from '../types'
import { SCORE_BANDS, STATUS_FILTER_OPTIONS } from '../filters'

export interface ApplicationFilterState {
  jobId: string | null
  status: ApplicationStatus | null
  minScore: number
}

interface ApplicationsFiltersProps {
  filters: ApplicationFilterState
  onFiltersChange: (filters: ApplicationFilterState) => void
  jobs: Array<{
    id: string
    title: string
    company: string
  }>
}

/**
 * The body of the pipeline's "Filters & sort" flyout.
 *
 * Was a loose row of selects sitting on the screen beside the board — one of
 * the two competing filter idioms the prototype's design audit named. It is
 * now the flyout's content, so this screen presents filters the same way every
 * other list screen does.
 *
 * Two of the controls here did not exist before:
 *
 *   §12 #4  the status list was missing `inquired` and `withdrawn`. `inquired`
 *           is a full column on the board, so a whole stage of the pipeline
 *           could not be filtered to.
 *   §12 #5  `minScore` was in state and was sent to the API on every request,
 *           but nothing rendered it. A dead filter: permanently 0, with no way
 *           to change it.
 */
export const ApplicationsFilters = ({
  filters,
  onFiltersChange,
  jobs,
}: ApplicationsFiltersProps) => {
  const { theme } = useThemeContext()
  const labelStyle = { marginBottom: 8, color: colors.text[theme].secondary }

  return (
    <Stack gap={16} style={{ minWidth: 260 }}>
      <Stack>
        <Text style={labelStyle}>Job</Text>
        <ResponsiveSelect
          value={filters.jobId || 'all'}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, jobId: value === 'all' ? null : value })
          }
          placeholder="All jobs"
          options={[
            { value: 'all', label: 'All jobs' },
            ...jobs.map((job) => ({ value: job.id, label: job.title })),
          ]}
        />
      </Stack>

      <Stack>
        <Text style={labelStyle}>Stage</Text>
        <ResponsiveSelect
          value={filters.status || 'all'}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              status: value === 'all' ? null : (value as ApplicationStatus),
            })
          }
          placeholder="All stages"
          options={STATUS_FILTER_OPTIONS}
        />
      </Stack>

      <Stack>
        <Text style={labelStyle}>Minimum score</Text>
        <ResponsiveSelect
          value={String(filters.minScore ?? 0)}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, minScore: Number(value) || 0 })
          }
          placeholder="Any score"
          // Bands rather than a slider: an employer thinks in "80 and up", not
          // in one-point increments, and a band is far easier to operate by
          // keyboard than a drag target.
          options={SCORE_BANDS.map((band) => ({
            value: String(band.value),
            label: band.label,
          }))}
        />
      </Stack>
    </Stack>
  )
}
