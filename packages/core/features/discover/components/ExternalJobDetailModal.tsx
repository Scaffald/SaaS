/**
 * @deprecated This modal component is deprecated in favor of the route-based job detail flow.
 * Use the router navigation to /dashboard/discover/jobs/[id] instead.
 * This component is kept for backward compatibility but will be removed in a future version.
 */
import { YStack, XStack, Text, Button, Separator, ScrollView, Dialog } from 'tamagui'
import {
  Building2,
  MapPin,
  Clock,
  DollarSign,
  ExternalLink,
  X,
  Briefcase,
} from '@tamagui/lucide-icons'
import { Linking } from 'react-native'
import type { ExternalJob } from './ExternalJobCard'

interface ExternalJobDetailModalProps {
  job: ExternalJob | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onApply?: (jobId: string) => void
}

export function ExternalJobDetailModal({
  job,
  open,
  onOpenChange,
  onApply,
}: ExternalJobDetailModalProps) {
  if (!job) return null

  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatCompensation = () => {
    const currency = job.compensation_currency || 'USD'
    const symbol = currency === 'USD' ? '$' : currency

    if (job.compensation_min && job.compensation_max) {
      return `${symbol}${job.compensation_min.toLocaleString()} - ${symbol}${job.compensation_max.toLocaleString()}`
    }
    if (job.compensation_min) {
      return `${symbol}${job.compensation_min.toLocaleString()}+`
    }
    return null
  }

  const handleOpenLink = (url: string) => {
    Linking.openURL(url)
  }

  const handleApply = () => {
    onApply?.(job.id)
    handleOpenLink(job.application_url)
  }

  const compensation = formatCompensation()
  const postedDate = formatDate(job.posted_date)

  return (
    <Dialog modal open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          animation="quick"
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Dialog.Content
          bordered
          elevate
          key="content"
          animateOnly={['transform', 'opacity']}
          animation={[
            'quick',
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
          enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
          exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <YStack gap="$4" p="$4">
              {/* Header */}
              <XStack justify="space-between" items="flex-start">
                <XStack gap="$3" flex={1}>
                  {job.company_logo ? (
                    <YStack width={64} height={64} rounded="$3" overflow="hidden" bg="$color3">
                      <img
                        src={job.company_logo}
                        alt={job.company_name || 'Company'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </YStack>
                  ) : (
                    <YStack
                      width={64}
                      height={64}
                      rounded="$3"
                      bg="$blue4"
                      items="center"
                      justify="center"
                    >
                      <Building2 size={32} color="$blue10" />
                    </YStack>
                  )}

                  <YStack flex={1} gap="$2">
                    <Text fontSize="$7" fontWeight="700" color="$color12">
                      {job.title}
                    </Text>
                    {job.company_name && (
                      <Text fontSize="$5" color="$color11" fontWeight="600">
                        {job.company_name}
                      </Text>
                    )}
                  </YStack>
                </XStack>

                <Dialog.Close asChild>
                  <Button size="$3" circular icon={X} chromeless />
                </Dialog.Close>
              </XStack>

              {/* Meta Info */}
              <XStack gap="$4" flexWrap="wrap">
                {job.job_location && (
                  <XStack gap="$2" items="center">
                    <MapPin size={18} color="$color10" />
                    <Text fontSize="$4" color="$color11">
                      {job.job_location}
                    </Text>
                  </XStack>
                )}

                {job.job_type && (
                  <XStack gap="$2" items="center">
                    <Briefcase size={18} color="$color10" />
                    <Text fontSize="$4" color="$color11">
                      {job.job_type}
                    </Text>
                  </XStack>
                )}

                {compensation && (
                  <XStack gap="$2" items="center">
                    <DollarSign size={18} color="$color10" />
                    <Text fontSize="$4" color="$color11">
                      {compensation}
                    </Text>
                  </XStack>
                )}

                {postedDate && (
                  <XStack gap="$2" items="center">
                    <Clock size={18} color="$color10" />
                    <Text fontSize="$4" color="$color11">
                      Posted {postedDate}
                    </Text>
                  </XStack>
                )}
              </XStack>

              <Separator />

              {/* Description */}
              {job.description && (
                <YStack gap="$2">
                  <Text fontSize="$5" fontWeight="600" color="$color12">
                    Job Description
                  </Text>
                  <Text fontSize="$4" color="$color11" lineHeight="$1">
                    {job.description}
                  </Text>
                </YStack>
              )}

              {/* Responsibilities */}
              {job.responsibilities && job.responsibilities.length > 0 && (
                <YStack gap="$2">
                  <Text fontSize="$5" fontWeight="600" color="$color12">
                    Responsibilities
                  </Text>
                  <YStack gap="$2" pl="$2">
                    {job.responsibilities.map((resp) => (
                      <XStack key={`resp-${resp.substring(0, 50)}`} gap="$2">
                        <Text fontSize="$4" color="$color11">
                          •
                        </Text>
                        <Text fontSize="$4" color="$color11" flex={1} lineHeight="$1">
                          {resp}
                        </Text>
                      </XStack>
                    ))}
                  </YStack>
                </YStack>
              )}

              {/* Requirements */}
              {job.requirements && job.requirements.length > 0 && (
                <YStack gap="$2">
                  <Text fontSize="$5" fontWeight="600" color="$color12">
                    Requirements
                  </Text>
                  <YStack gap="$2" pl="$2">
                    {job.requirements.map((req) => (
                      <XStack key={`req-${req.substring(0, 50)}`} gap="$2">
                        <Text fontSize="$4" color="$color11">
                          •
                        </Text>
                        <Text fontSize="$4" color="$color11" flex={1} lineHeight="$1">
                          {req}
                        </Text>
                      </XStack>
                    ))}
                  </YStack>
                </YStack>
              )}

              {/* Benefits */}
              {job.benefits && job.benefits.length > 0 && (
                <YStack gap="$2">
                  <Text fontSize="$5" fontWeight="600" color="$color12">
                    Benefits & Perks
                  </Text>
                  <YStack gap="$2" pl="$2">
                    {job.benefits.map((benefit) => (
                      <XStack key={`benefit-${benefit.substring(0, 50)}`} gap="$2">
                        <Text fontSize="$4" color="$green11">
                          ✓
                        </Text>
                        <Text fontSize="$4" color="$color11" flex={1} lineHeight="$1">
                          {benefit}
                        </Text>
                      </XStack>
                    ))}
                  </YStack>
                </YStack>
              )}

              {/* Tags */}
              <XStack gap="$2" flexWrap="wrap">
                {job.industries?.map((industry) => (
                  <YStack key={industry.industry_name} px="$3" py="$2" rounded="$3" bg="$blue3">
                    <Text fontSize="$3" color="$blue11" fontWeight="600">
                      {industry.industry_name}
                    </Text>
                  </YStack>
                ))}
                {job.job_category && (
                  <YStack px="$3" py="$2" rounded="$3" bg="$color3">
                    <Text fontSize="$3" color="$color11">
                      {job.job_category}
                    </Text>
                  </YStack>
                )}
              </XStack>

              <Separator />

              {/* Actions */}
              <XStack gap="$3" justify="flex-end">
                <Button
                  size="$4"
                  variant="outlined"
                  iconAfter={<ExternalLink size={18} />}
                  onPress={() => handleOpenLink(job.external_url)}
                >
                  View on Site
                </Button>

                <Button size="$4" theme="blue" onPress={handleApply}>
                  Apply Now
                </Button>
              </XStack>
            </YStack>
          </ScrollView>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
