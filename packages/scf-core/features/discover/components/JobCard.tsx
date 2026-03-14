import { Card, Text, Row, Stack, Separator } from '@scaffald/ui'
import { Briefcase, DollarSign, MapPin } from 'lucide-react-native'
import type { ComponentRef } from 'react'
import { forwardRef, memo } from 'react'
import { View } from 'react-native'
import type { JobMapPin } from '../hooks/useJobs'

type JobCardProps = {
  job: JobMapPin
  isSelected?: boolean
  onPress?: () => void
  variant?: 'compact' | 'full'
}

function formatSalary(minCents?: number, maxCents?: number, type?: string): string | null {
  if (!minCents && !maxCents) return null
  const fmt = (cents: number) => {
    const dollars = cents / 100
    return dollars >= 1000 ? `$${(dollars / 1000).toFixed(0)}k` : `$${dollars.toFixed(0)}`
  }
  const suffix = type === 'hourly' ? '/hr' : type === 'annual' || type === 'salary' ? '/yr' : ''
  if (minCents && maxCents) return `${fmt(minCents)} – ${fmt(maxCents)}${suffix}`
  if (minCents) return `${fmt(minCents)}+${suffix}`
  if (maxCents) return `Up to ${fmt(maxCents)}${suffix}`
  return null
}

/**
 * Job Card — consistent with ProfileCard layout.
 * Header: icon + title + org name
 * Metrics: location, pay, tags
 */
export const JobCard = memo(
  forwardRef<ComponentRef<typeof View>, JobCardProps>(
    ({ job, isSelected = false, onPress, variant = 'compact' }, ref) => {
      const isCompact = variant === 'compact'
      const salaryRange = formatSalary(job.pay_range_min_cents, job.pay_range_max_cents, job.pay_range_type)
      const tags = [job.employment_type, job.remote_option].filter(Boolean)

      return (
        <View ref={ref}>
          <Card
            pressable={!!onPress}
            onPress={onPress}
            padding="md"
            variant={isSelected ? 'elevated' : 'surface'}
            style={[isSelected && { borderColor: '#d97706', borderWidth: 1 }]}
          >
            <Stack gap={isCompact ? 10 : 12}>
              {/* Header: Icon + Title + Org */}
              <Row gap={12} align="center">
                <View
                  style={{
                    width: isCompact ? 44 : 48,
                    height: isCompact ? 44 : 48,
                    borderRadius: 12,
                    backgroundColor: '#fdf5e6',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Briefcase size={isCompact ? 20 : 22} color="#9a6614" />
                </View>
                <Stack flex={1} gap={2}>
                  <Text
                    style={{ fontWeight: '600', fontSize: isCompact ? 14 : 15 }}
                    numberOfLines={1}
                  >
                    {job.title}
                  </Text>
                  {job.organization_name && (
                    <Text style={{ fontSize: 13, color: '#6e6760' }} numberOfLines={1}>
                      {job.organization_name}
                    </Text>
                  )}
                </Stack>
              </Row>

              {/* Metrics row */}
              <Row gap={6} align="center" wrap>
                {job.location && (
                  <>
                    <MapPin size={14} color="#6e6760" />
                    <Text style={{ fontSize: 13, color: '#6e6760', flex: 1 }} numberOfLines={1}>
                      {job.location}
                    </Text>
                  </>
                )}
              </Row>

              {salaryRange && (
                <Row gap={6} align="center">
                  <DollarSign size={14} color="#9a6614" />
                  <Text style={{ fontSize: 13, color: '#9a6614' }}>{salaryRange}</Text>
                </Row>
              )}

              {/* Tags */}
              {!isCompact && tags.length > 0 && (
                <>
                  <Separator />
                  <Row gap={4} wrap>
                    {tags.map((tag) => (
                      <View
                        key={tag}
                        style={{
                          backgroundColor: '#fdf5e6',
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 6,
                        }}
                      >
                        <Text style={{ fontSize: 12, color: '#92400e' }}>{tag}</Text>
                      </View>
                    ))}
                    {job.position_level && (
                      <View
                        style={{
                          backgroundColor: '#f3f4f6',
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 6,
                        }}
                      >
                        <Text style={{ fontSize: 12, color: '#4b5563' }}>{job.position_level}</Text>
                      </View>
                    )}
                  </Row>
                </>
              )}

              {/* Compact tags */}
              {isCompact && tags.length > 0 && (
                <Row gap={4} wrap>
                  {tags.map((tag) => (
                    <View
                      key={tag}
                      style={{
                        backgroundColor: '#fdf5e6',
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 6,
                      }}
                    >
                      <Text style={{ fontSize: 11, color: '#92400e' }}>{tag}</Text>
                    </View>
                  ))}
                </Row>
              )}
            </Stack>
          </Card>
        </View>
      )
    }
  )
)

JobCard.displayName = 'JobCard'
