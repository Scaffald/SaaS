import { api } from '@app/core/utils/api'
import { SkillsChart } from '@unicornlove/ui'
import { Calendar, TrendingUp } from '@tamagui/lucide-icons'
import { Button } from '@unicornlove/ui'
import { useMemo, useState, type FC } from 'react'
import { ScrollView, Separator, Spinner, Text, XStack, YStack } from '@unicornlove/ui'
import type { SoftSkillCategory } from './SoftSkillsCategoryTabs'

interface SoftSkillsHistoryTimelineProps {
  userId?: string
}

/**
 * SoftSkillsHistoryTimeline component
 *
 * Displays a timeline of all soft skills assessment versions with
 * the ability to view radar charts and compare versions.
 */
export const SoftSkillsHistoryTimeline: FC<SoftSkillsHistoryTimelineProps> = ({ userId }) => {
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null)

  // Fetch version history
  const {
    data: historyData,
    isLoading,
    error,
  } = api.profile.skills.getSoftSkillsHistory.useQuery(undefined, {
    enabled: true,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

  // Fetch current version for comparison
  const { data: currentData } = api.profile.skills.getSoftSkills.useQuery(
    userId ? { userId } : undefined,
    {
      enabled: !!userId || !userId, // Always fetch current user's data
      staleTime: 5 * 60 * 1000,
    }
  )

  const versions = historyData?.versions || []
  const currentVersion = currentData?.version ?? null

  // Prepare radar chart data for selected version
  const selectedVersionData = useMemo(() => {
    if (selectedVersion === null) return null
    const version = versions.find((v) => v.version === selectedVersion)
    if (!version) return null

    const categoryLabels: Record<SoftSkillCategory, string> = {
      reliability: 'Reliability',
      collaboration: 'Collaboration',
      professionalism: 'Professionalism',
      technical: 'Technical',
    }

    return Object.entries(version.categoryAverages).map(([category, average]) => ({
      value: Math.round(average * 20), // Convert 1-5 scale to 0-100
      label: categoryLabels[category as SoftSkillCategory],
    }))
  }, [selectedVersion, versions])

  // Prepare current version radar chart data
  const currentVersionData = useMemo(() => {
    if (!currentData || !currentData.categoryAverages) return null

    const categoryLabels: Record<SoftSkillCategory, string> = {
      reliability: 'Reliability',
      collaboration: 'Collaboration',
      professionalism: 'Professionalism',
      technical: 'Technical',
    }

    return Object.entries(currentData.categoryAverages).map(([category, average]) => ({
      value: Math.round(average * 20), // Convert 1-5 scale to 0-100
      label: categoryLabels[category as SoftSkillCategory],
    }))
  }, [currentData])

  // Format date for display
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'Date unknown'

    // Handle both string and Date object inputs
    const date = dateString instanceof Date ? dateString : new Date(dateString)

    // Validate the date is valid
    if (Number.isNaN(date.getTime())) {
      return 'Invalid date'
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Calculate days between versions
  const getDaysAgo = (dateString: string | Date | null) => {
    if (!dateString) return null

    // Handle both string and Date object inputs
    const date = dateString instanceof Date ? dateString : new Date(dateString)

    // Validate the date is valid
    if (Number.isNaN(date.getTime())) {
      return null
    }

    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }

  if (isLoading) {
    return (
      <YStack gap="$4" alignItems="center" justifyContent="center" padding="$4">
        <Spinner size="large" color="$blue10" />
        <Text color="$color11">Loading version history...</Text>
      </YStack>
    )
  }

  if (error) {
    return (
      <YStack gap="$2" padding="$4">
        <Text fontSize="$5" fontWeight="600" color="$red11">
          Error loading history
        </Text>
        <Text fontSize="$3" color="$color11">
          {error.message || 'Failed to load version history'}
        </Text>
      </YStack>
    )
  }

  if (versions.length === 0) {
    return (
      <YStack gap="$2" padding="$4" alignItems="center">
        <Text fontSize="$5" fontWeight="600" color="$color12">
          No History Yet
        </Text>
        <Text fontSize="$3" color="$color11" style={{ textAlign: 'center' }}>
          Complete your first soft skills assessment to start tracking your progress over time.
        </Text>
      </YStack>
    )
  }

  if (versions.length === 1) {
    return (
      <YStack gap="$3" padding="$4">
        <Text fontSize="$5" fontWeight="600" color="$color12">
          Assessment History
        </Text>
        <Text fontSize="$3" color="$color11">
          This is your first assessment. Complete another assessment to see progression tracking.
        </Text>
        <YStack
          gap="$2"
          padding="$3"
          backgroundColor="$blue2"
          borderRadius="$3"
          borderWidth={1}
          borderColor="$blue7"
        >
          <XStack gap="$2" alignItems="center">
            <Calendar size={16} color="$blue10" />
            <Text fontSize="$4" fontWeight="600" color="$blue11">
              Version {versions[0].version}
            </Text>
            {versions[0].selfAssessedAt && (
              <Text fontSize="$3" color="$blue10">
                • {formatDate(versions[0].selfAssessedAt)}
              </Text>
            )}
          </XStack>
          {currentVersionData && (
            <SkillsChart
              datasets={[
                {
                  label: 'Current',
                  data: currentVersionData,
                  fillColor: '$blue4',
                  strokeColor: '$blue9',
                  strokeWidth: 2,
                  fillOpacity: 0.02,
                  gradient: {
                    startColor: '$blue8',
                    endColor: '$blue4',
                  },
                },
              ]}
              height={250}
              radius={100}
              maxValue={100}
              isAnimated
              showDots
            />
          )}
        </YStack>
      </YStack>
    )
  }

  return (
    <ScrollView flex={1} showsVerticalScrollIndicator={false}>
      <YStack gap="$4" padding="$4">
        <Text fontSize="$6" fontWeight="600" color="$color12">
          Assessment History
        </Text>
        <Text fontSize="$3" color="$color11">
          View your soft skills assessments over time and track your progress.
        </Text>

        {/* Timeline */}
        <YStack gap="$3">
          {versions.map((version, index) => {
            const isCurrent = version.version === currentVersion
            const isSelected = selectedVersion === version.version
            const daysAgo = getDaysAgo(version.selfAssessedAt)

            return (
              <YStack key={version.version}>
                {/* Version Card */}
                <Button
                  unstyled
                  onPress={() => setSelectedVersion(isSelected ? null : version.version)}
                  pressStyle={{ opacity: 0.8 }}
                >
                  <YStack
                    gap="$3"
                    padding="$4"
                    backgroundColor={isSelected ? '$blue2' : isCurrent ? '$green2' : '$color2'}
                    borderRadius="$4"
                    borderWidth={2}
                    borderColor={isSelected ? '$blue9' : isCurrent ? '$green9' : '$borderColor'}
                  >
                    <XStack
                      alignItems="center"
                      justifyContent="space-between"
                      flexWrap="wrap"
                      gap="$2"
                    >
                      <XStack gap="$3" alignItems="center">
                        <YStack
                          width={40}
                          height={40}
                          borderRadius="$12"
                          backgroundColor={isCurrent ? '$green9' : '$blue9'}
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Text fontSize="$4" fontWeight="700" color="$color1">
                            V{version.version}
                          </Text>
                        </YStack>
                        <YStack gap="$1">
                          <XStack gap="$2" alignItems="center">
                            <Text fontSize="$4" fontWeight="600" color="$color12">
                              Version {version.version}
                              {isCurrent && (
                                <Text fontSize="$3" color="$green11" marginLeft="$2">
                                  (Current)
                                </Text>
                              )}
                            </Text>
                          </XStack>
                          {version.selfAssessedAt && (
                            <XStack gap="$2" alignItems="center">
                              <Calendar size={14} color="$color10" />
                              <Text fontSize="$2" color="$color10">
                                {formatDate(version.selfAssessedAt)}
                                {daysAgo && ` • ${daysAgo}`}
                              </Text>
                            </XStack>
                          )}
                        </YStack>
                      </XStack>
                      {isSelected && <TrendingUp size={20} color="$blue10" />}
                    </XStack>

                    {/* Category Averages */}
                    <XStack gap="$3" flexWrap="wrap">
                      {Object.entries(version.categoryAverages).map(([category, average]) => (
                        <YStack key={category} gap="$1" style={{ minWidth: 120 }}>
                          <Text fontSize="$2" color="$color10" textTransform="capitalize">
                            {category}
                          </Text>
                          <Text fontSize="$4" fontWeight="600" color="$color12">
                            {average.toFixed(1)}/5
                          </Text>
                        </YStack>
                      ))}
                    </XStack>

                    {/* Selected Version Radar Chart */}
                    {isSelected && selectedVersionData && !(!isCurrent && currentVersionData) && (
                      <>
                        <Separator />
                        <YStack gap="$2" alignItems="center">
                          <Text fontSize="$4" fontWeight="600" color="$blue11">
                            Version {version.version} Radar Chart
                          </Text>
                          <SkillsChart
                            datasets={[
                              {
                                label: `Version ${version.version}`,
                                data: selectedVersionData,
                                fillColor: '$blue4',
                                strokeColor: '$blue9',
                                strokeWidth: 2,
                                fillOpacity: 0.02,
                                gradient: {
                                  startColor: '$blue8',
                                  endColor: '$blue4',
                                },
                              },
                            ]}
                            height={250}
                            radius={100}
                            maxValue={100}
                            isAnimated
                            showDots
                          />
                        </YStack>
                      </>
                    )}

                    {/* Comparison with Current */}
                    {isSelected && !isCurrent && currentVersionData && selectedVersionData && (
                      <>
                        <Separator />
                        <YStack gap="$3" alignItems="center">
                          <Text fontSize="$4" fontWeight="600" color="$color12">
                            Comparison: Version {version.version} vs Current (Version{' '}
                            {currentVersion})
                          </Text>

                          <XStack gap="$4" flexWrap="wrap" justifyContent="center">
                            <YStack flex={1} style={{ minWidth: 250 }}>
                              <SkillsChart
                                datasets={[
                                  {
                                    label: `Version ${version.version}`,
                                    data: selectedVersionData,
                                    fillColor: '$blue4',
                                    strokeColor: '$blue9',
                                    strokeWidth: 2,
                                    fillOpacity: 0.02,
                                  },
                                  {
                                    label: `Current (V${currentVersion})`,
                                    data: currentVersionData,
                                    fillColor: '$green4',
                                    strokeColor: '$green9',
                                    strokeWidth: 2,
                                    fillOpacity: 0.02,
                                  },
                                ]}
                                height={250}
                                radius={100}
                                maxValue={100}
                                isAnimated
                                showDots
                              />
                            </YStack>
                          </XStack>

                          {/* Legend */}
                          <XStack
                            gap="$4"
                            alignItems="center"
                            justifyContent="center"
                            paddingVertical="$2"
                          >
                            <XStack gap="$2" alignItems="center">
                              <YStack width={20} height={3} backgroundColor="$blue9" />
                              <Text fontSize="$2" color="$color11">
                                Version {version.version}
                              </Text>
                            </XStack>
                            <XStack gap="$2" alignItems="center">
                              <YStack width={20} height={3} backgroundColor="$green9" />
                              <Text fontSize="$2" color="$color11">
                                Current
                              </Text>
                            </XStack>
                          </XStack>
                        </YStack>
                      </>
                    )}
                  </YStack>
                </Button>

                {/* Timeline Connector */}
                {index < versions.length - 1 && (
                  <YStack alignItems="center" paddingVertical="$2">
                    <YStack width={2} height={20} backgroundColor="$borderColor" />
                  </YStack>
                )}
              </YStack>
            )
          })}
        </YStack>
      </YStack>
    </ScrollView>
  )
}
