import { Briefcase, Building2, Clock, DollarSign, MapPin } from 'lucide-react-native'
import type { ComponentRef } from 'react'
import { forwardRef, memo } from 'react'
import { Paragraph, Text, Row, useThemeContext } from '@scaffald/ui'
import {
  CardActions,
  CardBadges,
  CardHeader,
  CardMetadata,
  SelectableCard,
  type BadgeConfig,
  type MetadataItem,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

/**
 * Job card organization data
 */
export interface JobOrganization {
  id: string
  name: string
  slug: string
}

/**
 * Job card props
 */
export interface JobCardProps {
  id: string
  title: string
  description?: string
  organization?: JobOrganization
  location?: string
  employmentType?: string
  remoteOption?: string
  payRangeMin?: number
  payRangeMax?: number
  payRangeType?: string
  postedAt?: string
  certifications?: Array<{ id: string; name: string }>
  skills?: Array<{ id: string; name: string }>
  hasApplied?: boolean
  isSelected?: boolean
  onSelect?: (id: string) => void
  onViewDetails: () => void
}

/**
 * Format pay range for display
 */
function formatPayRange(min?: number, max?: number, type?: string): string {
  if (!min || !max || !type) return ''

  const formatCurrency = (cents: number) => {
    const dollars = cents / 100
    return `$${dollars.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`
  }

  const range = `${formatCurrency(min)} - ${formatCurrency(max)}`

  switch (type) {
    case 'hourly':
      return `${range}/hr`
    case 'salary':
      return `${range}/yr`
    case 'contract':
      return `${range} contract`
    default:
      return range
  }
}

/**
 * Format employment type for display
 */
function formatEmploymentType(type?: string): string {
  if (!type) return ''
  const typeMap: Record<string, string> = {
    full_time: 'Full-Time',
    part_time: 'Part-Time',
    contract: 'Contract',
    temp: 'Temporary',
    intern: 'Internship',
  }
  return typeMap[type] || type
}

/**
 * Format relative time (e.g., "2 days ago")
 */
function formatRelativeTime(dateString?: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return `${Math.floor(diffDays / 30)} months ago`
}

/**
 * JobCard - Displays job listing information
 *
 * Supports both internal and external jobs with consistent styling.
 *
 * @example
 * ```tsx
 * <JobCard
 *   id="job-1"
 *   title="Senior Engineer"
 *   organization={{ id: '1', name: 'Acme Corp', slug: 'acme' }}
 *   location="San Francisco, CA"
 *   employmentType="full_time"
 *   remoteOption="hybrid"
 *   payRangeMin={12000000}
 *   payRangeMax={18000000}
 *   payRangeType="salary"
 *   onViewDetails={() => router.push(ROUTES.DASHBOARD.DISCOVER.JOBS.path)}
 * />
 * ```
 */
export const JobCard = memo(
  forwardRef<ComponentRef<typeof SelectableCard>, JobCardProps>(
    (
      {
        id,
        title,
        description,
        organization,
        location,
        employmentType,
        remoteOption,
        payRangeMin,
        payRangeMax,
        payRangeType,
        postedAt,
        certifications = [],
        skills = [],
        hasApplied = false,
        isSelected = false,
        onSelect,
        onViewDetails,
      },
      forwardedRef
    ) => {
      const { theme } = useThemeContext()
      const t = theme === 'dark' ? 'dark' : 'light'
      const payRange = formatPayRange(payRangeMin, payRangeMax, payRangeType)
      const employment = formatEmploymentType(employmentType)
      const postedTime = formatRelativeTime(postedAt)

      // Build metadata items
      const metadataItems: MetadataItem[] = []

      if (location) {
        metadataItems.push({
          key: 'location',
          icon: <MapPin size="md" color={isSelected ? colors.text[t].inverse : colors.text[t].secondary} />,
          label: location,
        })
      }

      if (employment) {
        metadataItems.push({
          key: 'employment',
          icon: <Briefcase size="md" color={isSelected ? colors.text[t].inverse : colors.text[t].secondary} />,
          label: employment,
        })
      }

      if (postedTime) {
        metadataItems.push({
          key: 'posted',
          icon: <Clock size="md" color={isSelected ? colors.text[t].inverse : colors.text[t].tertiary} />,
          label: postedTime,
        })
      }

      // Build badges for certifications and skills
      const badges: BadgeConfig[] = [
        ...certifications.slice(0, 3).map((cert) => ({
          key: cert.id,
          label: cert.name,
          backgroundColor: t === 'dark' ? colors.error[300] : colors.error[600],
          color: colors.text[t].inverse,
        })),
        ...skills.slice(0, 2).map((skill) => ({
          key: skill.id,
          label: skill.name,
          backgroundColor: t === 'dark' ? colors.blue[300] : colors.blue[600],
          color: colors.text[t].inverse,
        })),
      ]

      return (
        <SelectableCard
          ref={forwardedRef}
          id={id}
          isSelected={isSelected}
          onPress={onSelect ? () => onSelect(id) : onViewDetails}
          selection={
            onSelect
              ? {
                  enabled: true,
                  selectedBorderColor: t === 'dark' ? colors.blue[400] : colors.blue[500],
                  selectedBgColor: colors.bg[t].muted,
                  selectedShadow: '0 4px 8px rgba(35, 156, 178, 0.2)',
                }
              : undefined
          }
        >
          {/* Header */}
          <Row justify="space-between" align="center">
            <CardHeader
              title={title}
              subtitle={organization?.name}
              children={undefined}
              action={
                <>
                  {hasApplied && (
                    <Row
                      backgroundColor={t === 'dark' ? colors.green[300] : colors.green[600]}
                      paddingHorizontal={8}
                      paddingVertical={4}
                      borderRadius={8}
                    >
                      <Text color={colors.text[t].inverse}>Applied</Text>
                    </Row>
                  )}
                  {organization && (
                    <Row gap={8} align="center">
                      <Building2 size="lg" color={isSelected ? colors.text[t].inverse : colors.text[t].primary} />
                      <Text color={isSelected ? colors.text[t].inverse : colors.text[t].primary}>{organization.name}</Text>
                    </Row>
                  )}
                </>
              }
            />
          </Row>

          {/* Remote option chip */}
          {remoteOption && (
            <Row gap={8}>
              <Row
                backgroundColor={t === 'dark' ? colors.blue[300] : colors.blue[600]}
                paddingHorizontal={8}
                paddingVertical={4}
                borderRadius={8}
              >
                <Text color={colors.text[t].inverse}>
                  {remoteOption === 'on_site'
                    ? 'On-site'
                    : remoteOption === 'hybrid'
                      ? 'Hybrid'
                      : 'Remote'}
                </Text>
              </Row>
            </Row>
          )}

          {/* Description */}
          {description && (
            <Paragraph size="sm" color={isSelected ? colors.text[t].inverse : colors.text[t].primary}>
              {description}
            </Paragraph>
          )}

          {/* Metadata */}
          {metadataItems.length > 0 && (
            <CardMetadata items={metadataItems} isSelected={isSelected} />
          )}

          {/* Pay range */}
          {payRange && (
            <Row gap={6} align="center">
              <DollarSign size="lg" color={t === 'dark' ? colors.green[300] : colors.green[600]} />
              <Text color={t === 'dark' ? colors.green[300] : colors.green[600]}>{payRange}</Text>
            </Row>
          )}

          {/* Certifications and Skills */}
          {badges.length > 0 && <CardBadges badges={badges} maxBadges={5} />}

          {/* Actions - Only show when card is used for selection, not navigation */}
          {onSelect && (
            <CardActions
              actions={[
                {
                  key: 'view',
                  label: hasApplied ? 'View Application' : 'View Details',
                  onPress: onViewDetails,
                  color: 'primary',
                  variant: 'filled',
                },
              ]}
            />
          )}
        </SelectableCard>
      )
    }
  )
)

JobCard.displayName = 'JobCard'
