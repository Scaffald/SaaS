import { ROUTES } from '@app/core/constants/routes'
import { api } from '@app/core/utils/api'
import {
  SoftSkillsCategoryTabs,
  type SoftSkillCategory,
} from '../components/SoftSkillsCategoryTabs'
import type { SoftSkill } from '../components/SoftSkillsCategoryTabs'
import { SoftSkillsHistoryTimeline } from '../components/SoftSkillsHistoryTimeline'
import { SoftSkillsProgressionChart } from '../components/SoftSkillsProgressionChart'
import { SoftSkillsRadarGrid } from '@app/core/components/ui'
import {
  DashboardWidget,
  EmptyState,
  Heading,
  LoadingState,
  ResponsiveModal,
  SkillsChart,
  spacing,
  Tab,
  TabGroup,
  UIButton,
  type SkillsChartDataset,
} from '@scaffald/neue-ui'
import { CheckCircle } from '@tamagui/lucide-icons'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Separator, Text, XStack, YStack } from 'tamagui'
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
  const { data, isLoading, error, refetch, isFetching } = api.profile.widgets.getSkills.useQuery(
    { userId },
    {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  )

  // Fetch soft skills
  const {
    data: softSkillsData,
    isLoading: isLoadingSoftSkills,
    error: softSkillsError,
  } = api.profile.skills.getSoftSkills.useQuery(userId ? { userId } : undefined, {
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
  }, [softSkills, activeCategory, categoryLabels])

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
        <YStack gap="$4" items="center" py="$8">
          <Text color="$red10">Failed to load skills</Text>
          <Text color="$color11" fontSize="$2">
            {error.message}
          </Text>
          <UIButton
            variant="primary"
            size="$2"
            onPress={() => {
              void refetch()
            }}
            disabled={isFetching}
          >
            Retry
          </UIButton>
        </YStack>
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
      <YStack gap={spacing.md}>
        {/* Header */}
        <XStack justify="space-between" items="center">
          <Heading variant="h4">Skills</Heading>
          {showEdit && (
            <UIButton
              variant="outlined"
              size="$2"
              onPress={() => {
                router.push(ROUTES.DASHBOARD.PROFILE.SKILLS.path)
              }}
            >
              Edit
            </UIButton>
          )}
        </XStack>

        {/* Tabs */}
        <TabGroup
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'technical' | 'soft-skills')}
        >
          <Tab value="technical" label="Technical Skills" />
          <Tab value="soft-skills" label="Soft Skills" />
        </TabGroup>

        <Separator />

        {/* Technical Skills Tab Content */}
        {activeTab === 'technical' &&
          (isLoadingSkills ? (
            <LoadingState message="Loading skills..." />
          ) : error ? (
            <YStack gap="$4" items="center" py="$8">
              <Text color="$red10">Failed to load skills</Text>
              <Text color="$color11" fontSize="$2">
                {(error as unknown as Record<string, unknown>).message}
              </Text>
              <UIButton
                variant="primary"
                size="$2"
                onPress={() => {
                  void (refetch as unknown as () => Promise<unknown>)()
                }}
                disabled={isFetching}
              >
                Retry
              </UIButton>
            </YStack>
          ) : skills.length === 0 ? (
            <EmptyState
              title="No skills added yet"
              description="Add your skills to showcase your expertise"
              action={
                showEdit ? (
                  <UIButton
                    variant="primary"
                    onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.SKILLS.path)}
                  >
                    Add Skills
                  </UIButton>
                ) : undefined
              }
            />
          ) : (
            <YStack gap="$4">
              {sortedTaxonomies.slice(0, showCompact ? 1 : undefined).map((taxonomy) => (
                <YStack key={taxonomy} gap="$2">
                  {/* Taxonomy Header */}
                  <Text fontSize="$3" fontWeight="600" color="$color11" textTransform="uppercase">
                    {taxonomy === 'onet' ? 'O*NET' : taxonomy === 'csi' ? 'CSI' : taxonomy}
                  </Text>

                  {/* Skills in this taxonomy */}
                  <XStack gap="$2" flexWrap="wrap">
                    {groupedSkills[taxonomy]
                      .slice(0, showCompact ? 5 : undefined)
                      .map((skill: EnrichedUserSkill) => (
                        <XStack
                          key={skill.id}
                          bg="$blue2"
                          px="$3"
                          py="$2"
                          rounded="$3"
                          borderWidth={1}
                          borderColor={skill.verified ? '$blue7' : '$blue5'}
                          gap="$2"
                          items="center"
                        >
                          {skill.verified && <CheckCircle size={14} color="$blue11" />}
                          <YStack gap="$0.5">
                            <Text fontSize="$2" fontWeight="500" color="$blue11">
                              {skill.name}
                            </Text>
                            {!showCompact && (
                              <XStack gap="$2">
                                {skill.proficiency > 0 && (
                                  <Text fontSize="$1" color="$blue10">
                                    {getProficiencyLabel(skill.proficiency)}
                                  </Text>
                                )}
                                {skill.yearsExperience !== null && skill.yearsExperience > 0 && (
                                  <Text fontSize="$1" color="$blue10">
                                    • {skill.yearsExperience}y
                                  </Text>
                                )}
                              </XStack>
                            )}
                          </YStack>
                        </XStack>
                      ))}
                  </XStack>
                </YStack>
              ))}

              {/* Show More link for compact view */}
              {showCompact && skills.length > 5 && (
                <Text
                  color="$blue7"
                  fontSize="$3"
                  fontWeight="600"
                  cursor="pointer"
                  hoverStyle={{ color: '$blue8' }}
                  pressStyle={{ color: '$blue9' }}
                  onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.SKILLS.path)}
                >
                  View all {skills.length} skills →
                </Text>
              )}
            </YStack>
          ))}

        {/* Soft Skills Tab Content */}
        {activeTab === 'soft-skills' &&
          (isLoadingSoftSkills ? (
            <LoadingState message="Loading soft skills..." />
          ) : softSkillsError ? (
            <YStack gap="$4" items="center" py="$8">
              <Text color="$red10">Failed to load soft skills</Text>
              <Text color="$color11" fontSize="$2">
                {softSkillsError.message}
              </Text>
              <UIButton
                variant="primary"
                size="$2"
                onPress={() => {
                  router.push(ROUTES.DASHBOARD.PROFILE.SKILLS.path)
                }}
              >
                Complete Assessment
              </UIButton>
            </YStack>
          ) : softSkills.length === 0 ? (
            <EmptyState
              title="No soft skills assessment"
              description="Complete your soft skills assessment to see your profile"
              action={
                showEdit ? (
                  <UIButton
                    variant="primary"
                    onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.SKILLS.path)}
                  >
                    Start Assessment
                  </UIButton>
                ) : undefined
              }
            />
          ) : (
            <YStack gap="$4">
              {/* Category Tabs */}
              <SoftSkillsCategoryTabs
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
              />

              <Separator />

              {/* Skills Chart for Active Category */}
              {categoryChartData && categoryChartData.length > 0 && (
                <YStack gap="$2" items="center">
                  <Text fontSize="$4" fontWeight="600" color="$color12">
                    {categoryLabels[activeCategory]} Skills
                  </Text>
                  <SkillsChart
                    datasets={categoryChartData}
                    height={variant === 'compact' ? 200 : 300}
                    radius={variant === 'compact' ? 80 : 120}
                    maxValue={100}
                    isAnimated={true}
                  />
                  <Text fontSize="$2" color="$color10" style={{ textAlign: 'center' }}>
                    Individual skill ratings in {categoryLabels[activeCategory]}
                  </Text>
                </YStack>
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
                <XStack justify="flex-end" gap="$2" pt="$2" flexWrap="wrap">
                  <UIButton variant="outlined" size="$3" onPress={() => setShowHistoryModal(true)}>
                    View History
                  </UIButton>
                  <UIButton
                    variant="primary"
                    size="$3"
                    onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.SKILLS.path)}
                  >
                    Update Assessment
                  </UIButton>
                </XStack>
              )}
            </YStack>
          ))}
      </YStack>

      {/* History Modal */}
      <ResponsiveModal
        open={showHistoryModal}
        onOpenChange={setShowHistoryModal}
        title="Soft Skills History"
        size="large"
        showCloseButton={true}
      >
        <YStack gap="$4" p="$4">
          {/* View Toggle */}
          <XStack gap="$2" justify="center">
            <UIButton
              variant={historyView === 'timeline' ? 'primary' : 'outlined'}
              size="$3"
              onPress={() => setHistoryView('timeline')}
            >
              Timeline
            </UIButton>
            <UIButton
              variant={historyView === 'progression' ? 'primary' : 'outlined'}
              size="$3"
              onPress={() => setHistoryView('progression')}
            >
              Progression
            </UIButton>
          </XStack>

          {/* History Content */}
          {historyView === 'timeline' ? (
            <SoftSkillsHistoryTimeline userId={userId} />
          ) : (
            <SoftSkillsProgressionChart userId={userId} />
          )}
        </YStack>
      </ResponsiveModal>
    </DashboardWidget>
  )
}
