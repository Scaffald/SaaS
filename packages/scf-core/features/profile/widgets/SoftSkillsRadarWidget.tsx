import { ROUTES } from '@scf/core/constants/routes'
import { api } from '@scf/core/utils/api'
import { SoftSkillsRadarGrid } from '@scf/core/components/ui'
import {
  SoftSkillsCategoryTabs,
  type SoftSkillCategory,
} from '../components/SoftSkillsCategoryTabs'
import type { SoftSkill } from '../components/SoftSkillsCategoryTabs'
import {
  Button,
  DashboardWidget,
  EmptyState,
  Heading,
  LoadingState,
  ResponsiveModal,
  spacing,
} from '@unicornlove/beyond-ui'
import { Download } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { useToast } from '@unicornlove/beyond-ui'
import { useCallback, useMemo, useState, type FC } from 'react'
import { Separator, Text, Row, Stack } from '@unicornlove/beyond-ui'
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
  const toast = useToast()
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
    toast.show({
          title: 'Export',
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
        <Stack gap="$4" alignItems="center" paddingVertical="$8">
          <Text color="$red10">Failed to load soft skills</Text>
          <Text color="$color11" fontSize="$2">
            {error.message}
          </Text>
        </Stack>
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
      <Stack gap={spacing.md}>
        {/* Header */}
        <Row justifyContent="space-between" alignItems="center">
          <Heading variant="h4">Soft Skills</Heading>
          <Row gap="$2" alignItems="center">
            {!showCompact && (
              <Button
                variant="outlined"
                size="$2"
                icon={Download}
                onPress={handleExport}
                testID="soft-skills-export-button"
              >
                Export
              </Button>
            )}
            {showEdit && (
              <Button
                variant="outlined"
                size="$2"
                onPress={() => {
                  router.push(ROUTES.DASHBOARD.PROFILE.SKILLS.path)
                }}
              >
                Edit
              </Button>
            )}
          </Row>
        </Row>

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
          <Stack gap="$4" padding="$4">
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
          </Stack>
        </ResponsiveModal>
      </Stack>
    </DashboardWidget>
  )
}
