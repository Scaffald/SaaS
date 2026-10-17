import { memo, useMemo } from 'react'
import { Platform } from 'react-native'
import { H3, ScrollView, Switch, Text, TextArea, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

import type { ConsentDetails } from '../hooks/useBackgroundCheckForm'

interface ConsentStepProps {
  consent: ConsentDetails
  onChange: (updates: Partial<ConsentDetails>) => void
}

const FCRA_DISCLOSURE = `
By proceeding you acknowledge that Scaffolded Trades will obtain a consumer report
(background check) for employment purposes. This report may include information about
your criminal history, driving records, education, employment history, and other
relevant records.`

const SUMMARY_OF_RIGHTS = `
You have the right to request information about the nature and scope of any consumer
report. If any adverse action is taken based on the report, you will receive a summary
of your rights and have the opportunity to dispute inaccurate or incomplete information.`

export const ConsentStep = memo(function ConsentStep({ consent, onChange }: ConsentStepProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  const signaturePlaceholder = useMemo(() => {
    const now = new Date()
    const localeDate = now.toLocaleDateString()
    return `Type your full name (${localeDate})`
  }, [])

  return (
    <Stack gap={16} flex={1}>
      <Stack gap={8}>
        {/* A heading, not body text (#1191). Continue is the wizard's footer;
            its rule is `consentIsComplete` in wizard-steps.ts. */}
        <H3 style={{ color: colors.text[t].primary }}>Consent and disclosures</H3>
        <Text color={colors.text[t].secondary}>
          Please review the disclosure and confirm your consent to continue with the background
          check.
        </Text>
      </Stack>

      <ScrollView style={{ flex: 1 }}>
        <Stack gap={16} paddingBottom={24}>
          <Stack gap={8} backgroundColor={colors.bg[t].muted} padding="md" borderRadius={16}>
            <Text weight="semibold" color={colors.text[t].primary}>
              FCRA disclosure
            </Text>
            <Text color={colors.text[t].secondary}>{FCRA_DISCLOSURE.trim()}</Text>
          </Stack>

          <Stack gap={8} backgroundColor={colors.bg[t].muted} padding="md" borderRadius={16}>
            <Text weight="semibold" color={colors.text[t].primary}>
              Summary of rights
            </Text>
            <Text color={colors.text[t].secondary}>{SUMMARY_OF_RIGHTS.trim()}</Text>
          </Stack>

          <Stack gap={12}>
            <Row gap={12} align="center">
              <Switch
                size="sm"
                checked={consent.acceptsDisclosure}
                onChange={(checked) => {
                  onChange({
                    acceptsDisclosure: checked,
                  })
                }}
              />
              <Text color={colors.text[t].secondary}>
                I have read and authorize the background check.
              </Text>
            </Row>

            <Stack gap={8}>
              <Text color={colors.text[t].secondary}>Electronic Signature</Text>
              <TextArea
                value={consent.signature}
                onChangeText={(value) =>
                  onChange({
                    signature: value,
                    signedAt: value ? new Date().toISOString() : undefined,
                    ipAddress: consent.ipAddress ?? 'unknown',
                    userAgent:
                      consent.userAgent ??
                      (typeof navigator !== 'undefined'
                        ? navigator.userAgent // platform-allow: typeof guard above
                        : `app/${Platform.OS}`),
                  })
                }
                placeholder={signaturePlaceholder}
                autoCapitalize="words"
              />
              <Text color={colors.text[t].secondary}>
                Type your full name as it appears on government-issued identification.
              </Text>
            </Stack>
          </Stack>
        </Stack>
      </ScrollView>
    </Stack>
  )
})
