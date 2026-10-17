import { ExternalLink, MapPin } from 'lucide-react-native'
import type { JSONContent } from '@tiptap/core'
import { Card, Text, Stack, extractPlainText, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { textSmall, MetricRow } from '@scf/core/components/ui'
import { type EmployerAddress, formatEmployerPlace, formatOpenRoles } from '../utils/employerFacts'

export interface Employer {
  id: string
  name: string
  slug: string
  description: JSONContent | string | null
  website_url: string | null
  employee_count_range: string | null
  annual_revenue_range: string | null
  address: EmployerAddress | null
  industries: {
    id: string
    name: string
  } | null
  /** Jobs with status 'open', counted by GET /v1/employers (#1185). */
  open_roles_count?: number | null
  created_at: string
}

interface EmployerCardProps {
  employer: Employer
  onViewDetails: (employer: Employer) => void
}

/**
 * Employer Card — the directory's Cards view, behind the List/Cards switch.
 *
 * The card led with an off-palette purple Building2 tile and printed the bare
 * street address, so a worker could not tell which town an employer was in
 * (#1185). It now leads with the name, and the place is city and state.
 */
export function EmployerCard({ employer, onViewDetails }: EmployerCardProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  const place = formatEmployerPlace(employer.address)
  const openRoles = formatOpenRoles(employer.open_roles_count)

  const descriptionText = employer.description
    ? typeof employer.description === 'string'
      ? employer.description
      : extractPlainText(employer.description as JSONContent)
    : null

  return (
    <Card
      pressable
      onPress={() => onViewDetails(employer)}
      padding="md"
      variant="glass"
      glassMaterial="thin"
    >
      <Stack gap={12}>
        <Stack gap={2}>
          <Text style={{ fontWeight: '600', fontSize: 15 }} numberOfLines={1}>
            {employer.name}
          </Text>
          {employer.industries?.name ? (
            <Text style={{ ...textSmall, color: colors.text[t].tertiary }} numberOfLines={1}>
              {employer.industries.name}
            </Text>
          ) : null}
        </Stack>

        {descriptionText && (
          <Text style={{ ...textSmall, color: colors.text[t].secondary }} numberOfLines={3}>
            {descriptionText}
          </Text>
        )}

        <Stack gap={6}>
          {place && <MetricRow icon={MapPin} text={place} theme={t} />}

          {employer.website_url && (
            <MetricRow
              icon={ExternalLink}
              text={employer.website_url.replace(/^https?:\/\//, '')}
              color={colors.text[t].emphasis}
              theme={t}
            />
          )}

          {openRoles ? (
            <Text style={{ ...textSmall, color: colors.text[t].secondary }}>{openRoles}</Text>
          ) : null}
        </Stack>
      </Stack>
    </Card>
  )
}
