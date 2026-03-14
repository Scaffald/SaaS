import { Building2, ExternalLink, MapPin, Users } from 'lucide-react-native'
import type { JSONContent } from '@tiptap/core'
import { Card, Text, Stack, extractPlainText, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { orgPalette, textSmall, CardHeader, MetricRow } from '@scf/core/components/ui'

export interface Employer {
  id: string
  name: string
  slug: string
  description: JSONContent | string | null
  website_url: string | null
  employee_count_range: string | null
  annual_revenue_range: string | null
  address: {
    street?: string
    zipCode?: string
  } | null
  industries: {
    id: string
    name: string
  } | null
  created_at: string
}

interface EmployerCardProps {
  employer: Employer
  onViewDetails: (employer: Employer) => void
}

/**
 * Employer Card — uses shared card primitives for consistency.
 * Header: purple icon + name + industry
 * Metrics: location, employee count, website
 */
export function EmployerCard({ employer, onViewDetails }: EmployerCardProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const pal = orgPalette[t]

  const location = employer.address?.street || employer.address?.zipCode || null

  const descriptionText = employer.description
    ? typeof employer.description === 'string'
      ? employer.description
      : extractPlainText(employer.description as JSONContent)
    : null

  return (
    <Card pressable onPress={() => onViewDetails(employer)} padding="md" variant="surface">
      <Stack gap={12}>
        <CardHeader
          icon={Building2}
          iconBg={pal.iconBg}
          iconColor={pal.iconFg}
          title={employer.name}
          subtitle={employer.industries?.name}
          theme={t}
        />

        {/* Description */}
        {descriptionText && (
          <Text style={{ ...textSmall, color: colors.text[t].secondary }} numberOfLines={3}>
            {descriptionText}
          </Text>
        )}

        {/* Metrics */}
        <Stack gap={6}>
          {location && <MetricRow icon={MapPin} text={location} theme={t} />}

          {employer.employee_count_range && (
            <MetricRow
              icon={Users}
              text={`${employer.employee_count_range} employees`}
              theme={t}
            />
          )}

          {employer.website_url && (
            <MetricRow
              icon={ExternalLink}
              text={employer.website_url.replace(/^https?:\/\//, '')}
              color={colors.primary[500]}
              theme={t}
            />
          )}
        </Stack>
      </Stack>
    </Card>
  )
}
