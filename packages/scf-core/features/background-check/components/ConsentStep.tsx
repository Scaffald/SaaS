import { memo, useMemo } from 'react'
import { Platform } from 'react-native'
import { Button, ScrollView, Switch, Text, TextArea, Row, Stack } from '@unicornlove/beyond-ui'

import type { ConsentDetails } from '../hooks/useBackgroundCheckForm'

interface ConsentStepProps {
  consent: ConsentDetails
  onChange: (updates: Partial<ConsentDetails>) => void
  onContinue: () => void
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

export const ConsentStep = memo(function ConsentStep({
  consent,
  onChange,
  onContinue,
}: ConsentStepProps) {
  const canContinue = consent.acceptsDisclosure && consent.signature.trim().length > 1

  const signaturePlaceholder = useMemo(() => {
    const now = new Date()
    const localeDate = now.toLocaleDateString()
    return `Type your full name (${localeDate})`
  }, [])

  return (
    <Stack gap={16} flex={1}>
      <Stack gap={8}>
        <Text color="$gray11">Consent & Disclosures</Text>
        <Text color="$gray11">
          Please review the disclosure and confirm your consent to continue with the background
          check.
        </Text>
      </Stack>

      <ScrollView flex={1}>
        <Stack gap={16} paddingBottom={24}>
          <Stack gap={8} backgroundColor="$color2" padding="md" borderRadius={16}>
            <Text color="$gray11">FCRA Disclosure</Text>
            <Text color="$gray11">{FCRA_DISCLOSURE.trim()}</Text>
          </Stack>

          <Stack gap={8} backgroundColor="$color2" padding="md" borderRadius={16}>
            <Text color="$gray11">Summary of Rights</Text>
            <Text color="$gray11">{SUMMARY_OF_RIGHTS.trim()}</Text>
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
              >
                <Switch.Thumb />
              </Switch>
              <Text color="$gray11">I have read and authorize the background check.</Text>
            </Row>

            <Stack gap={8}>
              <Text color="$gray11">Electronic Signature</Text>
              <TextArea
                size="md"
                value={consent.signature}
                onChangeText={(value) =>
                  onChange({
                    signature: value,
                    signedAt: value ? new Date().toISOString() : undefined,
                    ipAddress: consent.ipAddress ?? 'unknown',
                    userAgent:
                      consent.userAgent ??
                      (typeof navigator !== 'undefined'
                        ? navigator.userAgent
                        : `app/${Platform.OS}`),
                  })
                }
                placeholder={signaturePlaceholder}
                autoCapitalize="words"
              />
              <Text color="$gray11">
                Type your full name as it appears on government-issued identification.
              </Text>
            </Stack>
          </Stack>
        </Stack>
      </ScrollView>

      <Button size="md" color="primary" disabled={!canContinue} onPress={onContinue}>
        Continue
      </Button>
    </Stack>
  )
})
