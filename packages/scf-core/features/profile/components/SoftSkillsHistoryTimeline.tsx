import { useSoftSkillsHistory, useSoftSkills } from '@scf/core/utils/profile-skills-sdk-hooks'
import { SkillsChart } from '@unicornlove/beyond-ui'
import { Calendar, TrendingUp } from 'lucide-react-native'
import { Button } from '@unicornlove/beyond-ui'
import { useMemo, useState, type FC } from 'react'
import { ScrollView, Separator, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'
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
    isPending: isLoading,
    error,
  } = useSoftSkillsHistory({
    enabled: true,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

  // Fetch current version for comparison
  const { data: currentData } = useSoftSkills(userId ? { userId } : undefined, {
    enabled: !!userId || !userId, // Always fetch current user's data
    staleTime: 5 * 60 * 1000,
  })

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
      <Stack gap={16} align="center" justify="center" padding={16}>
        <Spinner size="lg" color="$blue10" />
        <Text color="gray">Loading version history...</Text>
      </Stack>
    )
  }

  if (error) {
    return (
      <Stack gap={8} padding={16}>
        <Text color="$red11">Error loading history</Text>
        <Text color="gray">{error.message || 'Failed to load version history'}</Text>
      </Stack>
    )
  }

  if (versions.length === 0) {
    return (
      <Stack gap={8} padding={16} align="center">
        <Text color="gray">No History Yet</Text>
        <Text color="gray" style={{ textAlign: 'center' }}>
          Complete your first soft skills assessment to start tracking your progress over time.
        </Text>
      </Stack>
    )
  }

  if (versions.length === 1) {
    return (
      <Stack gap={12} padding={16}>
        <Text color="gray">Assessment History</Text>
        <Text color="gray">
          This is your first assessment. Complete another assessment to see progression tracking.
        </Text>
        <Stack
          gap={8}
          padding={12}
          backgroundColor="$blue2"
          borderRadius={12}
          borderWidth={1}
          borderColor="$blue7"
        >
          <Row gap={8} align="center">
            <Calendar size={16} color="$blue10" />
            <Text color="$blue11">Version {versions[0].version}</Text>
            {versions[0].selfAssessedAt && (
              <Text color="$blue10">• {formatDate(versions[0].selfAssessedAt)}</Text>
            )}
          </Row>
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
        </Stack>
      </Stack>
    )
  }

  return (
    <ScrollView flex={1} showsVerticalScrollIndicator={false}>
      <Stack gap={16} padding={16}>
        <Text color="gray">Assessment History</Text>
        <Text color="gray">
          View your soft skills assessments over time and track your progress.
        </Text>

        {/* Timeline */}
        <Stack gap={12}>
          {versions.map((version, index) => {
            const isCurrent = version.version === currentVersion
            const isSelected = selectedVersion === version.version
            const daysAgo = getDaysAgo(version.selfAssessedAt)

            return (
              <Stack key={version.version}>
                {/* Version Card */}
                <Button
                  unstyled
                  onPress={() => setSelectedVersion(isSelected ? null : version.version)}
                  pressStyle={{ opacity: 0.8 }}
                >
                  <Stack
                    gap={12}
                    padding={16}
                    backgroundColor={isSelected ? '$blue2' : isCurrent ? '$green2' : '$color2'}
                    borderRadius={16}
                    borderWidth={2}
                    borderColor={isSelected ? '$blue9' : isCurrent ? '$green9' : '$borderColor'}
                  >
                    <Row align="center" justify="space-between" flexWrap="wrap" gap={8}>
                      <Row gap={12} align="center">
                        <Stack
                          width={40}
                          height={40}
                          borderRadius="$12"
                          backgroundColor={isCurrent ? '$green9' : '$blue9'}
                          align="center"
                          justify="center"
                        >
                          <Text color="gray">V{version.version}</Text>
                        </Stack>
                        <Stack gap={4}>
                          <Row gap={8} align="center">
                            <Text color="gray">
                              Version {version.version}
                              {isCurrent && (
                                <Text color="$green11" marginLeft={8}>
                                  (Current)
                                </Text>
                              )}
                            </Text>
                          </Row>
                          {version.selfAssessedAt && (
                            <Row gap={8} align="center">
                              <Calendar size={14} color="gray" />
                              <Text color="gray">
                                {formatDate(version.selfAssessedAt)}
                                {daysAgo && ` • ${daysAgo}`}
                              </Text>
                            </Row>
                          )}
                        </Stack>
                      </Row>
                      {isSelected && <TrendingUp size={20} color="$blue10" />}
                    </Row>

                    {/* Category Averages */}
                    <Row gap={12} flexWrap="wrap">
                      {Object.entries(version.categoryAverages).map(([category, average]) => (
                        <Stack key={category} gap={4} style={{ minWidth: 120 }}>
                          <Text color="gray" textTransform="capitalize">
                            {category}
                          </Text>
                          <Text color="gray">{average.toFixed(1)}/5</Text>
                        </Stack>
                      ))}
                    </Row>

                    {/* Selected Version Radar Chart */}
                    {isSelected && selectedVersionData && !(!isCurrent && currentVersionData) && (
                      <>
                        <Separator />
                        <Stack gap={8} align="center">
                          <Text color="$blue11">Version {version.version} Radar Chart</Text>
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
                        </Stack>
                      </>
                    )}

                    {/* Comparison with Current */}
                    {isSelected && !isCurrent && currentVersionData && selectedVersionData && (
                      <>
                        <Separator />
                        <Stack gap={12} align="center">
                          <Text color="gray">
                            Comparison: Version {version.version} vs Current (Version{' '}
                            {currentVersion})
                          </Text>

                          <Row gap={16} flexWrap="wrap" justify="center">
                            <Stack flex={1} style={{ minWidth: 250 }}>
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
                            </Stack>
                          </Row>

                          {/* Legend */}
                          <Row gap={16} align="center" justify="center" paddingVertical={8}>
                            <Row gap={8} align="center">
                              <Stack width={20} height={3} backgroundColor="$blue9" />
                              <Text color="gray">Version {version.version}</Text>
                            </Row>
                            <Row gap={8} align="center">
                              <Stack width={20} height={3} backgroundColor="$green9" />
                              <Text color="gray">Current</Text>
                            </Row>
                          </Row>
                        </Stack>
                      </>
                    )}
                  </Stack>
                </Button>

                {/* Timeline Connector */}
                {index < versions.length - 1 && (
                  <Stack align="center" paddingVertical={8}>
                    <Stack width={2} height={20} backgroundColor="$borderColor" />
                  </Stack>
                )}
              </Stack>
            )
          })}
        </Stack>
      </Stack>
    </ScrollView>
  )
}
