import { ROUTES } from '@scf/core/constants/routes'
import { formatEffectiveDate } from '@scf/core/utils/legal/fetchLegalDocuments'
import { useAcceptLegalMutation, usePrerequisitesCheck } from '@scf/core/utils/prerequisites-sdk-hooks'
import { useTranslation } from '@scf/core/utils/useTranslation'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Pressable } from 'react-native'
import { Button, Card, H5, Paragraph, Spinner, Stack, useThemeContext } from '@scaffald/ui'
import { colors, spacing } from '@scaffald/ui/tokens'

/**
 * Blocking legal re-acceptance screen (SC-110 / migration 342).
 *
 * Shown when a new Terms of Service / Privacy Policy version is published
 * after the user onboarded: the (protected)/(admin) layouts redirect here
 * whenever /v1/prerequisites/check reports needsLegalAcceptance. A single
 * "Agree and continue" click covers both documents; the server stamps the
 * current versions and writes the consent_records audit rows.
 *
 * Un-onboarded users never see this screen — their acceptance happens via
 * the checkboxes in the onboarding form.
 */
export default function LegalUpdateScreen() {
  const router = useRouter()
  const { t } = useTranslation()
  const { theme } = useThemeContext()
  const queryClient = useQueryClient()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { data: statusData, isLoading } = usePrerequisitesCheck()

  const acceptLegal = useAcceptLegalMutation({
    onSuccess: async () => {
      // Prefix invalidation covers both ['prerequisites','check'] (scf-core)
      // and ['prerequisites'] (@scaffald/sdk/react).
      await queryClient.invalidateQueries({ queryKey: ['prerequisites'] })
      router.replace(ROUTES.DASHBOARD.path)
    },
    onError: () => {
      setErrorMessage(t('auth.legal.acceptError'))
    },
  })

  // Nothing stale (direct navigation, or already accepted) → back to the app.
  useEffect(() => {
    if (statusData && !statusData.needsLegalAcceptance) {
      router.replace(ROUTES.DASHBOARD.path)
    }
  }, [statusData, router])

  const docs = statusData?.legal?.documents
  const staleDocs = [
    { key: 'terms' as const, state: docs?.terms_of_service, label: t('auth.legal.viewTerms'), testID: 'legal-update-terms-link' },
    { key: 'privacy' as const, state: docs?.privacy_policy, label: t('auth.legal.viewPrivacy'), testID: 'legal-update-privacy-link' },
  ]

  if (isLoading || !statusData) {
    return (
      <Stack justify="center" align="center" style={{ flex: 1 }}>
        <Spinner size="lg" />
      </Stack>
    )
  }

  return (
    <Stack justify="center" align="center" padding={spacing[20]} style={{ flex: 1 }}>
      <Card
        variant="glass"
        radius="lg"
        elevation="md"
        padding="lg"
        style={{ width: '100%', maxWidth: 480 }}
      >
        <Stack gap={spacing[16]}>
          <H5 serif weight="regular" style={{ color: colors.text.light.primary }}>
            {t('auth.legal.updateTitle')}
          </H5>
          <Paragraph size="sm" style={{ color: colors.text.light.secondary }}>
            {t('auth.legal.updateBody')}
          </Paragraph>

          <Stack gap={spacing[8]}>
            {staleDocs.map(({ key, state, label, testID }) => (
              <Pressable
                key={key}
                testID={testID}
                accessibilityRole="link"
                accessibilityLabel={label}
                onPress={() => state?.url && router.push(state.url)}
              >
                <Paragraph
                  size="sm"
                  style={{ color: colors.primary[700], textDecorationLine: 'underline' }}
                >
                  {label}
                  {state?.effectiveAt
                    ? ` — ${t('auth.legal.effective', {
                        date: formatEffectiveDate(state.effectiveAt, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        }),
                      })}`
                    : ''}
                </Paragraph>
              </Pressable>
            ))}
          </Stack>

          {errorMessage && (
            <Paragraph
              size="xs"
              accessibilityRole="alert"
              style={{ color: colors.fg[theme === 'dark' ? 'dark' : 'light'].error }}
            >
              {errorMessage}
            </Paragraph>
          )}

          <Button
            testID="legal-update-accept-button"
            loading={acceptLegal.isPending}
            disabled={acceptLegal.isPending}
            onPress={() => {
              setErrorMessage(null)
              acceptLegal.mutate({
                accepts_terms_of_service: true,
                accepts_privacy_policy: true,
              })
            }}
          >
            {t('auth.legal.acceptButton')}
          </Button>
        </Stack>
      </Card>
    </Stack>
  )
}
