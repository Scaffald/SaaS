import { useSoftSkillsHistory, useSoftSkills } from '@scf/core/utils/profile-skills-sdk-hooks'
import { Calendar, TrendingUp } from 'lucide-react-native'
import { Button, useThemeContext } from '@scaffald/ui'
import { useMemo, useState, type FC } from 'react'
import { ScrollView, Separator, Spinner, Text, Row, Stack } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
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
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
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
      <Stack gap={16} align="center" justify="center" padding="md">
        <Spinner size="lg" color="primary" />
        <Text style={{ color: colors.text[t].secondary }}>Loading version history...</Text>
      </Stack>
    )
  }

  if (error) {
    return (
      <Stack gap={8} padding="md">
        <Text style={{ color: colors.error[600] }}>Error loading history</Text>
        <Text style={{ color: colors.text[t].secondary }}>{error.message || 'Failed to load version history'}</Text>
      </Stack>
    )
  }

  if (versions.length === 0) {
    return (
      <Stack gap={8} padding="md" align="center">
        <Text style={{ color: colors.text[t].secondary }}>No History Yet</Text>
        <Text style={{ color: colors.text[t].secondary, textAlign: 'center' }}>
          Complete your first soft skills assessment to start tracking your progress over time.
        </Text>
      </Stack>
    )
  }

  if (versions.length === 1) {
    return (
      <Stack gap={12} padding="md">
        <Text style={{ color: colors.text[t].secondary }}>Assessment History</Text>
        <Text style={{ color: colors.text[t].secondary }}>
          This is your first assessment. Complete another assessment to see progression tracking.
        </Text>
        <Stack
          gap={8}
          padding="sm"
          borderRadius={12}
          borderWidth={1}
          style={{ backgroundColor: t === 'dark' ? colors.info[900] : colors.info[50], borderColor: colors.border[t].info }}
        >
          <Row gap={8} align="center">
            <Calendar size="md" color={colors.fg[t].info} />
            <Text style={{ color: colors.info[600] }}>Version {versions[0].version}</Text>
            {versions[0].selfAssessedAt && (
              <Text style={{ color: colors.fg[t].info }}>• {formatDate(versions[0].selfAssessedAt)}</Text>
            )}
          </Row>
          {currentVersionData && (
            <Stack gap={8}>
              {currentVersionData.map((item) => (
                <Row key={item.label} gap={8} align="center" justify="space-between">
                  <Text style={{ color: colors.info[600] }}>{item.label}</Text>
                  <Text style={{ color: colors.info[600] }}>{item.value}</Text>
                </Row>
              ))}
            </Stack>
          )}
        </Stack>
      </Stack>
    )
  }

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <Stack gap={16} padding="md">
        <Text style={{ color: colors.text[t].secondary }}>Assessment History</Text>
        <Text style={{ color: colors.text[t].secondary }}>
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
                  variant="text"
                  onPress={() => setSelectedVersion(isSelected ? null : version.version)}
                >
                  <Stack
                    gap={12}
                    padding="md"
                    style={{
                      backgroundColor: isSelected ? (t === 'dark' ? colors.info[900] : colors.info[50]) : isCurrent ? (t === 'dark' ? colors.success[900] : colors.success[50]) : colors.bg[t].muted,
                      borderColor: isSelected ? colors.border[t].info : isCurrent ? colors.border[t].success : colors.border[t].default,
                    }}
                    borderRadius={16}
                    borderWidth={2}
                  >
                    <Row align="center" justify="space-between" wrap gap={8}>
                      <Row gap={12} align="center">
                        <Stack
                          width={40}
                          height={40}
                          borderRadius={12}
                          style={{ backgroundColor: isCurrent ? colors.fg[t].success : colors.fg[t].info }}
                          align="center"
                          justify="center"
                        >
                          <Text style={{ color: t === 'dark' ? '#16110d' : '#ffffff' }}>V{version.version}</Text>
                        </Stack>
                        <Stack gap={4}>
                          <Row gap={8} align="center">
                            <Text style={{ color: colors.text[t].secondary }}>
                              Version {version.version}
                              {isCurrent && (
                                <Text style={{ color: colors.success[600], marginLeft: 8 }}>
                                  (Current)
                                </Text>
                              )}
                            </Text>
                          </Row>
                          {version.selfAssessedAt && (
                            <Row gap={8} align="center">
                              <Calendar size="md" color={colors.icon[t].subtle} />
                              <Text style={{ color: colors.text[t].secondary }}>
                                {formatDate(version.selfAssessedAt)}
                                {daysAgo && ` • ${daysAgo}`}
                              </Text>
                            </Row>
                          )}
                        </Stack>
                      </Row>
                      {isSelected && <TrendingUp size="lg" color={colors.fg[t].info} />}
                    </Row>

                    {/* Category Averages */}
                    <Row gap={12} wrap>
                      {Object.entries(version.categoryAverages).map(([category, average]) => (
                        <Stack key={category} gap={4} style={{ minWidth: 120 }}>
                          <Text style={{ color: colors.text[t].secondary, textTransform: 'capitalize' }}>
                            {category}
                          </Text>
                          <Text style={{ color: colors.text[t].secondary }}>{average.toFixed(1)}/5</Text>
                        </Stack>
                      ))}
                    </Row>

                    {/* Selected Version Radar Chart */}
                    {isSelected && selectedVersionData && !(!isCurrent && currentVersionData) && (
                      <>
                        <Separator />
                        <Stack gap={8} align="center">
                          <Text style={{ color: colors.info[600] }}>Version {version.version} Radar Chart</Text>
                          <Stack gap={8}>
                            {selectedVersionData.map((item) => (
                              <Row key={item.label} gap={8} align="center" justify="space-between">
                                <Text style={{ color: colors.info[600] }}>{item.label}</Text>
                                <Text style={{ color: colors.info[600] }}>{item.value}</Text>
                              </Row>
                            ))}
                          </Stack>
                        </Stack>
                      </>
                    )}

                    {/* Comparison with Current */}
                    {isSelected && !isCurrent && currentVersionData && selectedVersionData && (
                      <>
                        <Separator />
                        <Stack gap={12} align="center">
                          <Text style={{ color: colors.text[t].secondary }}>
                            Comparison: Version {version.version} vs Current (Version{' '}
                            {currentVersion})
                          </Text>

                          <Row gap={16} wrap justify="center">
                            <Stack flex={1} style={{ minWidth: 250 }}>
                              <Stack gap={8}>
                                {selectedVersionData.map((item, i) => (
                                  <Row key={item.label} gap={8} align="center" justify="space-between">
                                    <Text style={{ color: colors.info[600] }}>{item.label}</Text>
                                    <Row gap={8}>
                                      <Text style={{ color: colors.fg[t].info }}>V{version.version}: {item.value}</Text>
                                      <Text style={{ color: colors.fg[t].success }}>Current: {currentVersionData[i]?.value ?? '-'}</Text>
                                    </Row>
                                  </Row>
                                ))}
                              </Stack>
                            </Stack>
                          </Row>

                          {/* Legend */}
                          <Row gap={16} align="center" justify="center" paddingVertical={8}>
                            <Row gap={8} align="center">
                              <Stack width={20} height={3} style={{ backgroundColor: colors.fg[t].info }} />
                              <Text style={{ color: colors.text[t].secondary }}>Version {version.version}</Text>
                            </Row>
                            <Row gap={8} align="center">
                              <Stack width={20} height={3} style={{ backgroundColor: colors.fg[t].success }} />
                              <Text style={{ color: colors.text[t].secondary }}>Current</Text>
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
                    <Stack width={2} height={20} style={{ backgroundColor: colors.border[t].default }} />
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
