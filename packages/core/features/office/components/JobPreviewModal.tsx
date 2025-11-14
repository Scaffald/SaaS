import { useState } from 'react'
import { YStack, XStack, Text, Button, Separator, Spinner, ScrollView } from 'tamagui'
import { ResponsiveModal } from '@app/ui'
import {
  MapPin,
  Building2,
  DollarSign,
  Briefcase,
  Clock,
  Calendar,
  Users,
  Award,
} from '@tamagui/lucide-icons'
import { api } from '@app/core/utils/api'
import type { inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from '@app/supabase/client-types'
import { extractPlainText } from '@app/ui/components/rich-text'

type JobOutput = inferRouterOutputs<AppRouter>['office']['getJob']

interface JobPreviewModalProps {
  jobId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Job Preview Modal for Office/Admin View
 * Shows how the job will appear to candidates
 */
export function JobPreviewModal({ jobId, open, onOpenChange }: JobPreviewModalProps) {
  // Fetch job data using office endpoint
  const { data, isLoading } = api.office.getJob.useQuery(
    { id: jobId || '' },
    { enabled: !!jobId && open }
  )

  const job = data?.job

  const formatPayRange = (
    minCents: number | null,
    maxCents: number | null,
    type: string | null
  ) => {
    if (!minCents && !maxCents) return null

    const formatAmount = (cents: number) => {
      const dollars = cents / 100
      if (type === 'hourly') {
        return `$${dollars.toFixed(2)}/hr`
      }
      // For annual, format as K
      if (dollars >= 1000) {
        return `$${(dollars / 1000).toFixed(0)}K`
      }
      return `$${dollars.toFixed(0)}`
    }

    if (minCents && maxCents) {
      return `${formatAmount(minCents)} - ${formatAmount(maxCents)}`
    }
    if (minCents) {
      return `From ${formatAmount(minCents)}`
    }
    if (maxCents) {
      return `Up to ${formatAmount(maxCents)}`
    }
    return null
  }

  const formatEmploymentType = (type: string | null) => {
    if (!type) return null
    return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ')
  }

  const formatRemoteOption = (option: string | null) => {
    if (!option) return null
    return option.charAt(0).toUpperCase() + option.slice(1).replace(/_/g, ' ')
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="Job Preview"
      size="large"
      description="This is how the job will appear to candidates"
    >
      {isLoading ? (
        <YStack py="$8" items="center" justify="center">
          <Spinner size="large" color="$blue10" />
          <Text mt="$4" color="$color11">
            Loading job details...
          </Text>
        </YStack>
      ) : !job ? (
        <YStack py="$8" items="center">
          <Text color="$red10" fontSize="$5" fontWeight="600">
            Job not found
          </Text>
        </YStack>
      ) : (
        <ScrollView maxHeight={600}>
          <YStack gap="$4" p="$4">
            {/* Job Header */}
            <YStack gap="$3" items="center">
              <YStack
                width={80}
                height={80}
                rounded="$6"
                bg="$blue4"
                items="center"
                justify="center"
              >
                <Briefcase size={40} color="$blue10" />
              </YStack>

              <YStack gap="$2" items="center">
                <Text fontSize="$8" fontWeight="700" color="$color12">
                  {job.title}
                </Text>
                {job.organization && (
                  <XStack gap="$2" items="center">
                    <Building2 size={16} color="$color10" />
                    <Text fontSize="$5" color="$color11">
                      {job.organization.name}
                    </Text>
                  </XStack>
                )}
              </YStack>

              {/* Job Type Badge */}
              <XStack gap="$2" flexWrap="wrap" justify="center">
                {formatEmploymentType(job.employment_type) && (
                  <XStack
                    bg="$blue3"
                    px="$3"
                    py="$1"
                    rounded="$3"
                    gap="$2"
                    items="center"
                  >
                    <Briefcase size={14} color="$blue10" />
                    <Text fontSize="$2" color="$blue11" fontWeight="600">
                      {formatEmploymentType(job.employment_type)}
                    </Text>
                  </XStack>
                )}
                {formatRemoteOption(job.remote_option) && (
                  <XStack
                    bg="$green3"
                    px="$3"
                    py="$1"
                    rounded="$3"
                    gap="$2"
                    items="center"
                  >
                    <MapPin size={14} color="$green10" />
                    <Text fontSize="$2" color="$green11" fontWeight="600">
                      {formatRemoteOption(job.remote_option)}
                    </Text>
                  </XStack>
                )}
              </XStack>
            </YStack>

            <Separator />

            {/* Job Metadata */}
            <YStack gap="$3">
              {job.location && (
                <XStack gap="$2" items="center">
                  <MapPin size={16} color="$color10" />
                  <Text fontSize="$3" color="$color11">
                    {job.location}
                  </Text>
                </XStack>
              )}

              {formatPayRange(
                job.pay_range_min_cents,
                job.pay_range_max_cents,
                job.pay_range_type
              ) && (
                <XStack gap="$2" items="center">
                  <DollarSign size={16} color="$color10" />
                  <Text fontSize="$3" color="$color11">
                    {formatPayRange(
                      job.pay_range_min_cents,
                      job.pay_range_max_cents,
                      job.pay_range_type
                    )}
                  </Text>
                </XStack>
              )}

              {job.posted_at && (
                <XStack gap="$2" items="center">
                  <Calendar size={16} color="$color10" />
                  <Text fontSize="$3" color="$color11">
                    Posted {new Date(job.posted_at).toLocaleDateString()}
                  </Text>
                </XStack>
              )}
            </YStack>

            <Separator />

            {/* Description */}
            {job.description && (
              <YStack gap="$2">
                <Text fontSize="$5" fontWeight="600" color="$color12">
                  Job Description
                </Text>
                <Text fontSize="$3" color="$color11" lineHeight="$1">
                  {typeof job.description === 'string'
                    ? job.description
                    : extractPlainText(job.description)}
                </Text>
              </YStack>
            )}

            {/* Skills */}
            {job.job_skills && job.job_skills.length > 0 && (
              <YStack gap="$2">
                <XStack gap="$2" items="center">
                  <Users size={16} color="$color10" />
                  <Text fontSize="$5" fontWeight="600" color="$color12">
                    Required Skills
                  </Text>
                </XStack>
                <XStack gap="$2" flexWrap="wrap">
                  {job.job_skills.map((jobSkill, idx) => {
                    const skillName =
                      jobSkill.csi_skill?.name ||
                      jobSkill.onet_occupation?.title ||
                      'Unknown Skill'
                    return (
                      <XStack
                        key={idx}
                        bg="$blue3"
                        px="$2"
                        py="$1"
                        rounded="$3"
                      >
                        <Text fontSize="$2" color="$blue11">
                          {skillName}
                        </Text>
                      </XStack>
                    )
                  })}
                </XStack>
              </YStack>
            )}

            {/* Certifications */}
            {job.job_certifications && job.job_certifications.length > 0 && (
              <YStack gap="$2">
                <XStack gap="$2" items="center">
                  <Award size={16} color="$color10" />
                  <Text fontSize="$5" fontWeight="600" color="$color12">
                    Required Certifications
                  </Text>
                </XStack>
                <YStack gap="$2">
                  {job.job_certifications.map((jobCert, idx) => (
                    <XStack key={idx} gap="$2" items="center">
                      <Text fontSize="$3" color="$color11">
                        {jobCert.certification?.name || 'Unknown Certification'}
                      </Text>
                      {jobCert.is_required && (
                        <Text fontSize="$2" color="$red10">
                          (Required)
                        </Text>
                      )}
                    </XStack>
                  ))}
                </YStack>
              </YStack>
            )}

            {/* Status Badge */}
            <XStack justify="center">
              <XStack
                bg={
                  job.status === 'open'
                    ? '$green3'
                    : job.status === 'draft'
                      ? '$gray3'
                      : job.status === 'paused'
                        ? '$yellow3'
                        : '$red3'
                }
                px="$3"
                py="$1"
                rounded="$3"
              >
                <Text
                  fontSize="$2"
                  color={
                    job.status === 'open'
                      ? '$green11'
                      : job.status === 'draft'
                        ? '$gray11'
                        : job.status === 'paused'
                          ? '$yellow11'
                          : '$red11'
                  }
                  fontWeight="600"
                >
                  {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                </Text>
              </XStack>
            </XStack>
          </YStack>
        </ScrollView>
      )}
    </ResponsiveModal>
  )
}

