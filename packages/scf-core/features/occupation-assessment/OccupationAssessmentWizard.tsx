import { AssessmentWizard, useAssessmentSave, toError } from '@scf/core/features/assessments'
import { OccupationSearch } from '@scf/core/features/career-assessment/components/OccupationSearch'
import { useOccupationStatus, useSaveCareerAssessmentMutation } from '@scf/core/utils/onet-sdk-hooks'
import { ROUTES } from '@scf/core/constants/routes'
import { DashboardLayout } from '@scf/core/components/layouts'
import { Plus, X, Briefcase, Target, Search, Zap } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import {
  AssessmentHeader,
  AssessmentProgressBar,
  Button,
  Card,
  Text,
  Row,
  Stack,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useRouter } from 'expo-router'

const INFO_CARDS = [
  {
    icon: Briefcase,
    title: 'Current Role',
    description: 'Tell us about your current or most recent occupation',
  },
  {
    icon: Target,
    title: 'Target Careers',
    description: 'Add occupations you are interested in pursuing',
  },
  {
    icon: Search,
    title: '1,000+ Occupations',
    description: 'Search from the O*NET occupation database',
  },
  {
    icon: Zap,
    title: 'Earn XP',
    description: 'Gain Compass XP for completing your profile',
  },
]

/**
 * OccupationAssessmentWizard - Two-column Pulse-style wizard for Occupation Preferences
 */
export function OccupationAssessmentWizard() {
  const { theme } = useThemeContext()
  const router = useRouter()

  const { data: status, isLoading, error } = useOccupationStatus()
  const [currentOccupation, setCurrentOccupation] = useState<string>('')
  const [targetOccupations, setTargetOccupations] = useState<string[]>([])

  useEffect(() => {
    if (status) {
      const s = status as { currentOccupationCode?: string; targetOccupationCodes?: string[] }
      setCurrentOccupation(s.currentOccupationCode || '')
      setTargetOccupations(s.targetOccupationCodes || [])
    }
  }, [status])

  const saveMutation = useAssessmentSave({
    queryKeys: [['scaffald', 'onet', 'occupation', 'status']],
    successTitle: 'Saved',
    successMessage: 'Your occupation preferences have been saved!',
    useMutation: useSaveCareerAssessmentMutation,
    errorFallback: 'Failed to save preferences. Please try again.',
  })

  const handleComplete = () => {
    saveMutation.mutate({
      riasec_scores: undefined,
      selected_occupations:
        currentOccupation || targetOccupations.length > 0
          ? [currentOccupation, ...targetOccupations].filter(Boolean)
          : undefined,
    })
  }

  const handleAddTarget = () => {
    setTargetOccupations([...targetOccupations, ''])
  }

  const handleRemoveTarget = (index: number) => {
    setTargetOccupations(targetOccupations.filter((_, i) => i !== index))
  }

  const handleTargetChange = (index: number, value: string) => {
    const updated = [...targetOccupations]
    updated[index] = value
    setTargetOccupations(updated)
  }

  const hasAnyOccupation = currentOccupation || targetOccupations.some((occ) => occ)
  const completionScore = status?.isCompleted ? 100 : hasAnyOccupation ? 50 : 0

  const iconBgColor = useMemo(
    () => (theme === 'dark' ? 'rgba(29, 114, 130, 0.15)' : 'rgba(29, 114, 130, 0.08)'),
    [theme]
  )

  const wizardContent = (
    <AssessmentWizard
      steps={[
        { id: 'current', label: 'Current Occupation', order: 1 },
        { id: 'targets', label: 'Target Occupations', order: 2 },
      ]}
      currentStep="current"
      completionScore={completionScore}
      isLoading={isLoading}
      error={toError(error)}
      showNext={false}
      showHeader={false}
    >
      <Stack padding="md" paddingBottom="xs">
        <AssessmentProgressBar value={completionScore} height={4} />
      </Stack>

      <Stack
        gap={28}
        maxWidth={800}
        width="100%"
        padding="md"
        style={{ marginHorizontal: 'auto' }}
      >
        <AssessmentHeader
          category="Career Assessment"
          title="Occupation Preferences"
          subtitle="Tell us about your current and target occupations to personalize your experience"
        />

        {/* Info cards */}
        {!status?.isCompleted && (
          <Row gap={12} wrap>
            {INFO_CARDS.map((card) => (
              <Stack key={card.title} style={{ flex: 1, minWidth: 200 }}>
                <Card variant="outlined" padding="md" radius="xl">
                  <Stack gap={12}>
                    <Stack
                      width={40}
                      height={40}
                      borderRadius={12}
                      align="center"
                      justify="center"
                      style={{ backgroundColor: iconBgColor }}
                    >
                      <card.icon size={20} color={colors.primary[500]} />
                    </Stack>
                    <Stack gap={4}>
                      <Text style={{ fontWeight: '600', color: colors.text[theme].primary }}>
                        {card.title}
                      </Text>
                      <Text
                        style={{ fontSize: 13, color: colors.text[theme].secondary, lineHeight: 18 }}
                      >
                        {card.description}
                      </Text>
                    </Stack>
                  </Stack>
                </Card>
              </Stack>
            ))}
          </Row>
        )}

        {/* Current Occupation */}
        <Stack gap={12}>
          <Stack gap={4}>
            <Text style={{ fontWeight: '600', color: colors.text[theme].primary }}>
              Current Occupation (Optional)
            </Text>
            <Text style={{ color: colors.text[theme].secondary }}>
              What is your current or most recent job?
            </Text>
          </Stack>
          <OccupationSearch
            value={currentOccupation}
            onChange={(code) => setCurrentOccupation(code)}
            placeholder="Search for your occupation..."
            disabled={saveMutation.isPending}
          />
        </Stack>

        {/* Target Occupations */}
        <Stack gap={12}>
          <Stack gap={4}>
            <Text style={{ fontWeight: '600', color: colors.text[theme].primary }}>
              Target Occupations (Optional)
            </Text>
            <Text style={{ color: colors.text[theme].secondary }}>
              What occupations are you interested in pursuing?
            </Text>
          </Stack>
          {targetOccupations.map((occupation, index) => (
            <Row
              key={`target-occupation-${index}-${occupation || 'empty'}`}
              gap={8}
              align="center"
            >
              <Stack flex={1}>
                <OccupationSearch
                  value={occupation}
                  onChange={(code) => handleTargetChange(index, code)}
                  placeholder={`Target occupation ${index + 1}...`}
                  disabled={saveMutation.isPending}
                />
              </Stack>
              <Button
                size="sm"
                variant="outline"
                iconStart={X}
                onPress={() => handleRemoveTarget(index)}
                disabled={saveMutation.isPending}
              />
            </Row>
          ))}
          <Button
            size="md"
            variant="outline"
            iconStart={Plus}
            onPress={handleAddTarget}
            disabled={saveMutation.isPending}
          >
            Add Target Occupation
          </Button>
        </Stack>

        <Button
          size="lg"
          variant="light"
          color="primary"
          onPress={handleComplete}
          disabled={saveMutation.isPending}
        >
          Save Preferences
        </Button>
      </Stack>
    </AssessmentWizard>
  )

  const railContent = (
    <Stack gap={20} padding="xs">
      <Stack gap={4}>
        <Text style={{ fontWeight: '600', color: colors.text[theme].primary }}>
          Occupation Preferences
        </Text>
        <Text style={{ fontSize: 13, color: colors.text[theme].secondary, lineHeight: 20 }}>
          Your occupation preferences help us personalize job recommendations and career guidance.
        </Text>
      </Stack>

      {/* Tips */}
      <Card variant="outlined" padding="md" radius="xl">
        <Stack gap={8}>
          <Text style={{ fontWeight: '600', fontSize: 14, color: colors.text[theme].primary }}>
            Tips
          </Text>
          <Text style={{ fontSize: 13, color: colors.text[theme].secondary, lineHeight: 20 }}>
            Search by job title or keyword. You can add multiple target occupations to broaden your
            career exploration.
          </Text>
        </Stack>
      </Card>

      {/* Career Explorer link */}
      <Card variant="outlined" padding="md" radius="xl">
        <Stack gap={8}>
          <Text style={{ fontWeight: '600', fontSize: 14, color: colors.text[theme].primary }}>
            Explore Careers
          </Text>
          <Text style={{ fontSize: 13, color: colors.text[theme].secondary, lineHeight: 20 }}>
            Browse 1,000+ occupations and discover career paths that match your interests.
          </Text>
          <Button
            size="sm"
            variant="outline"
            color="primary"
            onPress={() => router.push(ROUTES.ASSESSMENTS.CAREER_EXPLORER.path)}
          >
            Open Career Explorer
          </Button>
        </Stack>
      </Card>
    </Stack>
  )

  return (
    <DashboardLayout
      leftContent={wizardContent}
      rightContent={railContent}
      breadcrumbItems={[
        { label: 'Assessments', href: '/dashboard/assessments' },
        { label: 'Occupation Preferences' },
      ]}
    />
  )
}
