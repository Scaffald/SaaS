import { ROUTES } from '@app/core/constants/routes'
import { api } from '@app/core/utils/api'
import { SoftSkillsRadarGrid } from '@app/ui'
import { SoftSkillsCategoryTabs, type SoftSkillCategory } from '../components/SoftSkillsCategoryTabs'
import type { SoftSkill } from '../components/SoftSkillsCategoryTabs'
import {
  DashboardWidget,
  EmptyState,
  Heading,
  LoadingState,
  RadarChart,
  ResponsiveModal,
  spacing,
  UIButton,
} from '@app/ui'
import { Download } from '@tamagui/lucide-icons'
import { useRouter } from 'expo-router'
import { useToastController } from '@tamagui/toast'
import { useCallback, useMemo, useState, type FC } from 'react'
import { Text, XStack, YStack } from 'tamagui'
import type { ProfileWidgetProps } from './types'

/**
 * SoftSkillsRadarWidget component
 *
 * Main soft skills radar chart widget for profile display.
 * Shows 4-category overview with self/peer overlay and interactive drill-down.
 */
export const SoftSkillsRadarWidget: FC<ProfileWidgetProps> = ({ userId, showEdit = false, variant = 'full' }) => {
  const router = useRouter()
  const toast = useToastController()
  const [drillDownOpen, setDrillDownOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<SoftSkillCategory>('reliability')

  // Fetch soft skills data
  const { data, isLoading, error } = api.profile.skills.getSoftSkills.useQuery(
    userId ? { userId } : undefined,
    {
      enabled: !!userId,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    },
  )

  // Fetch peer comparison data (only for current user's own profile)
  const { data: comparisonData } = api.profile.skills.getSoftSkillsComparison.useQuery(undefined, {
    enabled: !!userId, // Only fetch if viewing a profile
    staleTime: 5 * 60 * 1000,
  })

  // Prepare skills for display
  const skills = useMemo<SoftSkill[]>(() => {
    if (!data) return []

    // Note: getSoftSkillsComparison returns category averages, not individual skill ratings
    // So we only show self ratings in the drill-down grid
    return data.skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      category: skill.category,
      selfRating: skill.rating ?? 0,
      peerRating: undefined, // Individual peer ratings not available
      versionHistory: undefined, // Not needed for widget
    }))
  }, [data])

  // Calculate category averages for radar chart
  const radarChartData = useMemo(() => {
    if (!data) return null

    const categories: SoftSkillCategory[] = ['reliability', 'collaboration', 'professionalism', 'technical']
    const categoryLabels: Record<SoftSkillCategory, string> = {
      reliability: 'Reliability',
      collaboration: 'Collaboration',
      professionalism: 'Professionalism',
      technical: 'Technical',
    }

    // Calculate self-assessment averages
    const selfAverages = categories.map((category) => {
      const categorySkills = data.skills.filter((s) => s.category === category && s.rating)
      if (categorySkills.length === 0) return { value: 0, label: categoryLabels[category] }
      const average =
        categorySkills.reduce((sum, s) => sum + (s.rating ?? 0), 0) / categorySkills.length
      return {
        value: Math.round(average * 20), // Convert 1-5 scale to 0-100
        label: categoryLabels[category],
      }
    })

    // Calculate peer averages if available
    const peerAverages =
      comparisonData?.categoryAverages?.map((avg) => ({
        value: Math.round(avg.average * 20), // Convert 1-5 scale to 0-100
        label: categoryLabels[avg.category as SoftSkillCategory],
      })) ?? null

    return {
      self: selfAverages,
      peer: peerAverages,
    }
  }, [data, comparisonData])

  // Handle category click for drill-down
  const handleCategoryClick = useCallback((index: number) => {
    const categories: SoftSkillCategory[] = ['reliability', 'collaboration', 'professionalism', 'technical']
    setSelectedCategory(categories[index])
    setDrillDownOpen(true)
  }, [])

  // Handle export (placeholder for now)
  const handleExport = useCallback(() => {
    toast.show('Export', {
      message: 'Chart export functionality coming soon!',
    })
  }, [toast])

  if (isLoading) {
    return (
      <DashboardWidget>
        <LoadingState message="Loading soft skills..." />
      </DashboardWidget>
    )
  }

  if (error) {
    return (
      <DashboardWidget>
        <YStack gap="$4" items="center" py="$8">
          <Text color="$red10">Failed to load soft skills</Text>
          <Text color="$color11" fontSize="$2">
            {error.message}
          </Text>
        </YStack>
      </DashboardWidget>
    )
  }

  if (!data || data.skills.length === 0) {
    return (
      <DashboardWidget>
        <EmptyState
          title="No soft skills assessment"
          description="Complete your soft skills assessment to see your profile"
          icon={undefined}
        />
      </DashboardWidget>
    )
  }

  const showCompact = variant === 'compact'
  const hasPeerData = !!comparisonData && comparisonData.categoryAverages.length > 0

  return (
    <DashboardWidget>
      <YStack gap={spacing.md}>
        {/* Header */}
        <XStack justify="space-between" items="center">
          <Heading variant="h4">Soft Skills</Heading>
          <XStack gap="$2" items="center">
            {!showCompact && (
              <UIButton
                variant="outlined"
                size="$2"
                icon={Download}
                onPress={handleExport}
                testID="soft-skills-export-button"
              >
                Export
              </UIButton>
            )}
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
        </XStack>

        {/* Radar Chart */}
        {radarChartData && (
          <YStack gap="$3">
            {hasPeerData && radarChartData.peer ? (
              <YStack gap="$2">
                <RadarChart
                  datasets={[
                    {
                      data: radarChartData.self,
                      label: 'Self Assessment',
                      color: '$blue9',
                      fillColor: '$blue3',
                      strokeColor: '$blue9',
                      fillOpacity: 0.3,
                    },
                    {
                      data: radarChartData.peer,
                      label: 'Peer Review',
                      color: '$green9',
                      fillColor: '$green3',
                      strokeColor: '$green9',
                      fillOpacity: 0.2,
                    },
                  ]}
                  height={showCompact ? 200 : 300}
                  radius={showCompact ? 80 : 120}
                  maxValue={100}
                  noOfSections={5}
                  onPress={handleCategoryClick}
                />
                {/* Legend */}
                <XStack gap="$4" items="center" justify="center" py="$2">
                  <XStack gap="$2" items="center">
                    <YStack width={20} height={3} bg="$blue9" />
                    <Text fontSize="$2" color="$color11">
                      Self Assessment
                    </Text>
                  </XStack>
                  <XStack gap="$2" items="center">
                    <YStack width={20} height={3} bg="$green9" />
                    <Text fontSize="$2" color="$color11">
                      Peer Review
                    </Text>
                  </XStack>
                </XStack>
              </YStack>
            ) : (
              <RadarChart
                data={radarChartData.self}
                height={showCompact ? 200 : 300}
                radius={showCompact ? 80 : 120}
                maxValue={100}
                noOfSections={5}
                color="$blue9"
                onPress={handleCategoryClick}
              />
            )}
            <Text fontSize="$2" color="$color10" ta="center">
              Click on a category to view individual skills
            </Text>
          </YStack>
        )}

        {/* Drill-down Modal */}
        <ResponsiveModal
          open={drillDownOpen}
          onOpenChange={setDrillDownOpen}
          title="Soft Skills Details"
          size="large"
          showCloseButton={true}
        >
          <YStack gap="$4" p="$4">
            {/* Category Tabs */}
            <SoftSkillsCategoryTabs
              activeCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              skills={skills}
            />

            {/* Skills Grid */}
            <SoftSkillsRadarGrid
              skills={skills}
              activeCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              isLoading={false}
            />
          </YStack>
        </ResponsiveModal>
      </YStack>
    </DashboardWidget>
  )
}

