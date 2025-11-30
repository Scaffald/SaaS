import { ROUTES } from '@app/core/constants/routes'
import { api } from '@app/core/utils/api'
import { SoftSkillsRadarGrid } from '@app/core/components/ui'
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
  spacing,
  UIButton,
} from '@scaffald/neue-ui'
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
