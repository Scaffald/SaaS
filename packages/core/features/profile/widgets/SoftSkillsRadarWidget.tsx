import { ROUTES } from '@app/core/constants/routes'
import { api } from '@app/core/utils/api'
import { SoftSkillsRadarGrid } from '@app/ui'
import {
  SoftSkillsCategoryTabs,
  type SoftSkillCategory,
} from '../components/SoftSkillsCategoryTabs'
import type { SoftSkill } from '../components/SoftSkillsCategoryTabs'
import {
  DashboardWidget,
  EmptyState,
  Heading,
  LoadingState,
  ResponsiveModal,
  SkillsChart,
  spacing,
  UIButton,
  type SkillsChartDataset,
} from '@app/ui'
import { Download } from '@tamagui/lucide-icons'
import { useRouter } from 'expo-router'
import { useToastController } from '@tamagui/toast'
import { useCallback, useMemo, useState, type FC } from 'react'
import { Separator, Text, XStack, YStack } from 'tamagui'
import type { ProfileWidgetProps } from './types'

/**
 * SoftSkillsRadarWidget component
 *
 * Main soft skills radar chart widget for profile display.
 * Shows 4-category overview with self/peer overlay and interactive drill-down.
 */
export const SoftSkillsRadarWidget: FC<ProfileWidgetProps> = ({
  userId,
  showEdit = false,
  variant = 'full',
}) => {
  const router = useRouter()
  const toast = useToastController()
  const [drillDownOpen, setDrillDownOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<SoftSkillCategory>('reliability')
  const [activeCategory, setActiveCategory] = useState<SoftSkillCategory>('reliability')

  // Fetch soft skills data
  const { data, isLoading, error } = api.profile.skills.getSoftSkills.useQuery(
    userId ? { userId } : undefined,
    {
      enabled: !!userId,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
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
    return data.skills
      .filter((skill) => skill.rating !== null && skill.rating !== undefined)
      .map((skill) => ({
        id: skill.id,
        name: skill.name,
        category: skill.category,
        selfRating: skill.rating ?? 0,
        peerRating: undefined, // Individual peer ratings not available
        versionHistory: undefined, // Not needed for widget
      }))
  }, [data])

  // Category labels for display
  const categoryLabels: Record<SoftSkillCategory, string> = {
    reliability: 'Reliability',
    collaboration: 'Collaboration',
    professionalism: 'Professionalism',
    technical: 'Technical',
  }

  // Calculate skills chart data for the active category
  const categoryChartData = useMemo<SkillsChartDataset[] | null>(() => {
    if (!data || !skills || skills.length === 0) return null

    // Filter skills by active category
    const categorySkills = skills.filter((skill) => skill.category === activeCategory)

    if (categorySkills.length === 0) return null

    // Create skills chart dataset: each skill becomes a point
    // Convert 1-5 scale to 0-100 for better visualization
    const chartData = categorySkills.map((skill) => ({
      label: skill.name,
      value: Math.round(skill.selfRating * 20), // Convert 1-5 to 0-100 scale
    }))

    const datasets: SkillsChartDataset[] = [
      {
        label: categoryLabels[activeCategory],
        data: chartData,
        fillColor: '$blue3',
        strokeColor: '#1B6B93',
        strokeWidth: 2,
        fillOpacity: 0.3,
      },
    ]

    // Add peer comparison data if available for this category
    if (comparisonData?.peer) {
      // For peer data, we'll show category average as comparison
      // Note: Individual peer skill ratings aren't available, so we use category average
      const peerCategoryAvg = comparisonData.peer[activeCategory] ?? 0
      const categorySkillsCount = categorySkills.length

      // Create peer dataset with category average applied to all skills
      if (categorySkillsCount > 0) {
        const peerChartData = categorySkills.map((skill) => ({
          label: skill.name,
          value: Math.round(peerCategoryAvg * 20), // Convert 1-5 to 0-100 scale
        }))

        datasets.push({
          label: 'Peer Average',
          data: peerChartData,
          fillColor: '$green3',
          strokeColor: '#4CAF50',
          strokeWidth: 2,
          fillOpacity: 0.2,
        })
      }
    }

    return datasets
  }, [data, skills, activeCategory, categoryLabels, comparisonData])

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
  const hasPeerData = !!comparisonData?.peer

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

        {/* Category Tabs */}
        {skills.length > 0 && (
          <>
            <SoftSkillsCategoryTabs
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
            <Separator />
          </>
        )}

        {/* Skills Chart for Active Category */}
        {categoryChartData && categoryChartData.length > 0 && (
          <YStack gap="$2" items="center">
            <Text fontSize="$4" fontWeight="600" color="$color12">
              {categoryLabels[activeCategory]} Skills
            </Text>
            <SkillsChart
              datasets={categoryChartData}
              height={showCompact ? 200 : 300}
              radius={showCompact ? 80 : 120}
              maxValue={100}
              isAnimated={true}
              showSets={categoryChartData.length > 1 ? [0, 1] : [0]}
            />
            {hasPeerData && categoryChartData.length > 1 && (
              <XStack gap="$4" items="center" justify="center" py="$2">
                <XStack gap="$2" items="center">
                  <YStack width={20} height={3} bg="#1B6B93" />
                  <Text fontSize="$2" color="$color11">
                    Self Assessment
                  </Text>
                </XStack>
                <XStack gap="$2" items="center">
                  <YStack width={20} height={3} bg="#4CAF50" />
                  <Text fontSize="$2" color="$color11">
                    Peer Average
                  </Text>
                </XStack>
              </XStack>
            )}
            <Text fontSize="$2" color="$color10" ta="center">
              Individual skill ratings in {categoryLabels[activeCategory]}
            </Text>
          </YStack>
        )}

        {skills.length > 0 && categoryChartData && <Separator />}

        {/* Skills Grid */}
        {skills.length > 0 && (
          <SoftSkillsRadarGrid skills={skills} activeCategory={activeCategory} isLoading={false} />
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
            />

            {/* Skills Grid */}
            <SoftSkillsRadarGrid
              skills={skills}
              activeCategory={selectedCategory}
              isLoading={false}
            />
          </YStack>
        </ResponsiveModal>
      </YStack>
    </DashboardWidget>
  )
}
