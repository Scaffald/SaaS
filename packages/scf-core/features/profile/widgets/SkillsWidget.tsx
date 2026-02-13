import { ROUTES } from '@scf/core/constants/routes'
import { useSoftSkills, useSkillsLegacy } from '@scf/core/utils/profile-skills-sdk-hooks'
import {
  SoftSkillsCategoryTabs,
  type SoftSkillCategory,
} from '../components/SoftSkillsCategoryTabs'
import type { SoftSkill } from '../components/SoftSkillsCategoryTabs'
import { SoftSkillsHistoryTimeline } from '../components/SoftSkillsHistoryTimeline'
import { SoftSkillsProgressionChart } from '../components/SoftSkillsProgressionChart'
import { SoftSkillsRadarGrid } from '@scf/core/components/ui'
import {
  Button,
  DashboardWidget,
  EmptyState,
  Heading,
  LoadingState,
  ResponsiveModal,
  SkillsChart,
  spacing,
  Tabs,
  type SkillsChartDataset,
} from '@scaffald/ui'
import { CheckCircle } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Separator, Text, Row, Stack } from '@scaffald/ui'
import { getProficiencyLabel } from '../constants/proficiency-levels'
import type { ProfileWidgetProps } from './types'

// EnrichedUserSkill type from skill-enrichment.ts
interface EnrichedUserSkill {
  id: string
  taxonomy: 'csi' | 'onet'
  name: string
  label: string
  displayCode: string | null
  proficiency: number
  yearsExperience: number | null
  verified: boolean
  metadata: Record<string, unknown> | null
}

/**
 * SkillsWidget
 * Displays user's skills grouped by taxonomy
 *
 * @param userId - User ID to display (defaults to current user)
 * @param showEdit - Show edit button for own profile
 * @param variant - Display variant (compact or full)
 */
export function SkillsWidget({ userId, showEdit = false, variant = 'full' }: ProfileWidgetProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'technical' | 'soft-skills'>('technical')
  const [activeCategory, setActiveCategory] = useState<SoftSkillCategory>('reliability')
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [historyView, setHistoryView] = useState<'timeline' | 'progression'>('timeline')

  // Fetch technical skills
  const {
    data,
    isPending: isLoading,
    error,
    refetch,
    isFetching,
  } = useSkillsLegacy({
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

  // Fetch soft skills
  const {
    data: softSkillsData,
    isPending: isLoadingSoftSkills,
    error: softSkillsError,
  } = useSoftSkills(userId ? { userId } : undefined, {
    enabled: !!userId && activeTab === 'soft-skills',
    staleTime: 5 * 60 * 1000,
  })

  // Note: Peer comparison data would be fetched here if needed for individual skill displays
  // For now, we only show self-assessments in the skills widget

  // Prepare soft skills for display
  const softSkills = useMemo<SoftSkill[]>(() => {
    if (!softSkillsData) return []

    return softSkillsData.skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      category: skill.category,
      selfRating: skill.rating ?? 0,
      peerRating: undefined, // Individual peer ratings not available
      versionHistory: undefined, // Not needed for widget
    }))
  }, [softSkillsData])

  // Category labels for display
  const categoryLabels: Record<SoftSkillCategory, string> = {
    reliability: 'Reliability',
    collaboration: 'Collaboration',
    professionalism: 'Professionalism',
    technical: 'Technical',
  }

  // Calculate skills chart data for the active category
  const categoryChartData = useMemo<SkillsChartDataset[] | null>(() => {
    if (!softSkills || softSkills.length === 0) return null

    // Filter skills by active category
    const categorySkills = softSkills.filter((skill) => skill.category === activeCategory)

    if (categorySkills.length === 0) return null

    // Create skills chart dataset: each skill becomes a point
    // Convert 1-5 scale to 0-100 for better visualization
    const chartData = categorySkills.map((skill) => ({
      label: skill.name,
      value: Math.round(skill.selfRating * 20), // Convert 1-5 to 0-100 scale
    }))

    return [
      {
        label: categoryLabels[activeCategory],
        data: chartData,
        fillColor: '$blue3',
        strokeColor: '#1B6B93',
        strokeWidth: 2,
        fillOpacity: 0.3,
      },
    ]
  }, [softSkills, activeCategory])

  if (isLoading) {
    return (
      <DashboardWidget>
        <LoadingState message="Loading skills..." />
      </DashboardWidget>
    )
  }

  if (error) {
    return (
      <DashboardWidget>
        <Stack gap={16} align="center" paddingVertical={32}>
          <Text color="$red10">Failed to load skills</Text>
          <Text color="$gray11">{error.message}</Text>
          <Button
            variant="filled" color="primary"
            size="xs"
            onPress={() => {
              void refetch()
            }}
            disabled={isFetching}
          >
            Retry
          </Button>
        </Stack>
      </DashboardWidget>
    )
  }

  const skills = (data || []) as EnrichedUserSkill[]
  const showCompact = variant === 'compact'

  // Group skills by taxonomy
  const groupedSkills = skills.reduce(
    (acc: Record<string, EnrichedUserSkill[]>, skill: EnrichedUserSkill) => {
      const taxonomy = skill.taxonomy || 'Other'
      if (!acc[taxonomy]) {
        acc[taxonomy] = []
      }
      acc[taxonomy].push(skill)
      return acc
    },
    {}
  )

  const taxonomyOrder = ['onet', 'csi', 'Other']
  const sortedTaxonomies = Object.keys(groupedSkills).sort((a, b) => {
    const aIndex = taxonomyOrder.indexOf(a)
    const bIndex = taxonomyOrder.indexOf(b)
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b)
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })

  const isLoadingSkills = isLoading && activeTab === 'technical'

  return (
    <DashboardWidget>
      <Stack gap={spacing.md}>
        {/* Header */}
        <Row justify="space-between" align="center">
          <Heading variant="h4">Skills</Heading>
          {showEdit && (
            <Button
              variant="outline"
              size="xs"
              onPress={() => {
                router.push(ROUTES.DASHBOARD.PROFILE.SKILLS.path)
              }}
            >
              Edit
            </Button>
          )}
        </Row>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'technical' | 'soft-skills')}
          type="line"
        >
          <Tabs.Item value="technical">
            <Tabs.Trigger>Technical Skills</Tabs.Trigger>
          </Tabs.Item>
          <Tabs.Item value="soft-skills">
            <Tabs.Trigger>Soft Skills</Tabs.Trigger>
          </Tabs.Item>
        </Tabs>

        <Separator />

        {/* Technical Skills Tab Content */}
        {activeTab === 'technical' &&
          (isLoadingSkills ? (
            <LoadingState message="Loading skills..." />
          ) : error ? (
            <Stack gap={16} align="center" paddingVertical={32}>
              <Text color="$red10">Failed to load skills</Text>
              <Text color="$gray11">{(error as unknown as Record<string, unknown>).message}</Text>
              <Button
                variant="filled" color="primary"
                size="xs"
                onPress={() => {
                  void (refetch as unknown as () => Promise<unknown>)()
                }}
                disabled={isFetching}
              >
                Retry
              </Button>
            </Stack>
          ) : skills.length === 0 ? (
            <EmptyState
              title="No skills added yet"
              description="Add your skills to showcase your expertise"
              action={
                showEdit ? (
                  <Button
                    variant="filled" color="primary"
                    onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.SKILLS.path)}
                  >
                    Add Skills
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <Stack gap={16}>
              {sortedTaxonomies.slice(0, showCompact ? 1 : undefined).map((taxonomy) => (
                <Stack key={taxonomy} gap={8}>
                  {/* Taxonomy Header */}
                  <Text color="$gray11" textTransform="uppercase">
                    {taxonomy === 'onet' ? 'O*NET' : taxonomy === 'csi' ? 'CSI' : taxonomy}
                  </Text>

                  {/* Skills in this taxonomy */}
                  <Row gap={8} flexWrap="wrap">
                    {groupedSkills[taxonomy]
                      .slice(0, showCompact ? 5 : undefined)
                      .map((skill: EnrichedUserSkill) => (
                        <Row
                          key={skill.id}
                          backgroundColor="$blue2"
                          paddingHorizontal={12}
                          paddingVertical={8}
                          borderRadius={12}
                          borderWidth={1}
                          borderColor={skill.verified ? '$blue7' : '$blue5'}
                          gap={8}
                          align="center"
                        >
                          {skill.verified && <CheckCircle size="md" color="$blue11" />}
                          <Stack gap={2}>
                            <Text color="$blue11">{skill.name}</Text>
                            {!showCompact && (
                              <Row gap={8}>
                                {skill.proficiency > 0 && (
                                  <Text color="$blue10">
                                    {getProficiencyLabel(skill.proficiency)}
                                  </Text>
                                )}
                                {skill.yearsExperience !== null && skill.yearsExperience > 0 && (
                                  <Text color="$blue10">• {skill.yearsExperience}y</Text>
                                )}
                              </Row>
                            )}
                          </Stack>
                        </Row>
                      ))}
                  </Row>
                </Stack>
              ))}

              {/* Show More link for compact view */}
              {showCompact && skills.length > 5 && (
                <Text
                  color="$blue7"
                  cursor="pointer"
                  hoverStyle={{ color: '$blue8' }}
                  pressStyle={{ color: '$blue9' }}
                  onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.SKILLS.path)}
                >
                  View all {skills.length} skills →
                </Text>
              )}
            </Stack>
          ))}

        {/* Soft Skills Tab Content */}
        {activeTab === 'soft-skills' &&
          (isLoadingSoftSkills ? (
            <LoadingState message="Loading soft skills..." />
          ) : softSkillsError ? (
            <Stack gap={16} align="center" paddingVertical={32}>
              <Text color="$red10">Failed to load soft skills</Text>
              <Text color="$gray11">{softSkillsError.message}</Text>
              <Button
                variant="filled" color="primary"
                size="xs"
                onPress={() => {
                  router.push(ROUTES.DASHBOARD.PROFILE.SKILLS.path)
                }}
              >
                Complete Assessment
              </Button>
            </Stack>
          ) : softSkills.length === 0 ? (
            <EmptyState
              title="No soft skills assessment"
              description="Complete your soft skills assessment to see your profile"
              action={
                showEdit ? (
                  <Button
                    variant="filled" color="primary"
                    onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.SKILLS.path)}
                  >
                    Start Assessment
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <Stack gap={16}>
              {/* Category Tabs */}
              <SoftSkillsCategoryTabs
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
              />

              <Separator />

              {/* Skills Chart for Active Category */}
              {categoryChartData && categoryChartData.length > 0 && (
                <Stack gap={8} align="center">
                  <Text color="$gray11">{categoryLabels[activeCategory]} Skills</Text>
                  <SkillsChart
                    datasets={categoryChartData}
                    height={variant === 'compact' ? 200 : 300}
                    radius={variant === 'compact' ? 80 : 120}
                    maxValue={100}
                    isAnimated={true}
                  />
                  <Text color="$gray11" style={{ textAlign: 'center' }}>
                    Individual skill ratings in {categoryLabels[activeCategory]}
                  </Text>
                </Stack>
              )}

              <Separator />

              {/* Skills Grid */}
              <SoftSkillsRadarGrid
                skills={softSkills}
                activeCategory={activeCategory}
                isLoading={false}
              />

              {/* Action Buttons */}
              {showEdit && (
                <Row justify="flex-end" gap={8} paddingTop={8} flexWrap="wrap">
                  <Button variant="outline" size="sm" onPress={() => setShowHistoryModal(true)}>
                    View History
                  </Button>
                  <Button
                    variant="filled" color="primary"
                    size="sm"
                    onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.SKILLS.path)}
                  >
                    Update Assessment
                  </Button>
                </Row>
              )}
            </Stack>
          ))}
      </Stack>

      {/* History Modal */}
      <ResponsiveModal
        open={showHistoryModal}
        onOpenChange={setShowHistoryModal}
        title="Soft Skills History"
        size="lg"
        showCloseButton={true}
      >
        <Stack gap={16} padding="md">
          {/* View Toggle */}
          <Row gap={8} justify="center">
            <Button
              variant={historyView === 'timeline' ? 'primary' : 'outlined'}
              size="sm"
              onPress={() => setHistoryView('timeline')}
            >
              Timeline
            </Button>
            <Button
              variant={historyView === 'progression' ? 'primary' : 'outlined'}
              size="sm"
              onPress={() => setHistoryView('progression')}
            >
              Progression
            </Button>
          </Row>

          {/* History Content */}
          {historyView === 'timeline' ? (
            <SoftSkillsHistoryTimeline userId={userId} />
          ) : (
            <SoftSkillsProgressionChart userId={userId} />
          )}
        </Stack>
      </ResponsiveModal>
    </DashboardWidget>
  )
}
