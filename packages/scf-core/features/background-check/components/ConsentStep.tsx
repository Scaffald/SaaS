import { memo, useMemo } from 'react'
import { Platform } from 'react-native'
import { Button, ScrollView, Switch, Text, TextArea, XStack, YStack } from '@unicornlove/ui'

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
    <YStack gap="$4" flex={1}>
      <YStack gap="$2">
        <Text fontSize="$6" fontWeight="bold" color="$color12">
          Consent & Disclosures
        </Text>
        <Text fontSize="$3" color="$color11">
          Please review the disclosure and confirm your consent to continue with the background
          check.
        </Text>
      </YStack>

      <ScrollView flex={1}>
        <YStack gap="$4" paddingBottom="$6">
          <YStack gap="$2" backgroundColor="$color2" padding="$4" borderRadius="$4">
            <Text fontSize="$4" fontWeight="bold" color="$color12">
              FCRA Disclosure
            </Text>
            <Text fontSize="$3" color="$color11">
              {FCRA_DISCLOSURE.trim()}
            </Text>
          </YStack>

          <YStack gap="$2" backgroundColor="$color2" padding="$4" borderRadius="$4">
            <Text fontSize="$4" fontWeight="bold" color="$color12">
              Summary of Rights
            </Text>
            <Text fontSize="$3" color="$color11">
              {SUMMARY_OF_RIGHTS.trim()}
            </Text>
          </YStack>

          <YStack gap="$3">
            <XStack gap="$3" alignItems="center">
              <Switch
                size="$3"
                checked={consent.acceptsDisclosure}
                onCheckedChange={(checked) => {
                  onChange({
                    acceptsDisclosure: checked,
                  })
                }}
              >
                <Switch.Thumb />
              </Switch>
              <Text fontSize="$3" color="$color12">
                I have read and authorize the background check.
              </Text>
            </XStack>

            <YStack gap="$2">
              <Text fontSize="$2" color="$color11">
                Electronic Signature
              </Text>
              <TextArea
                size="$4"
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
              <Text fontSize="$2" color="$color9">
                Type your full name as it appears on government-issued identification.
              </Text>
            </YStack>
          </YStack>
        </YStack>
      </ScrollView>

      <Button size="$4" theme="blue" disabled={!canContinue} onPress={onContinue}>
        Continue
      </Button>
    </YStack>
  )
})
