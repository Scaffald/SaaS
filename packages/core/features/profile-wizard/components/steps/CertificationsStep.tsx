import { useEffect, useMemo, useState } from 'react'
import { Button, Input, Text, XStack, YStack, Paragraph, Card } from 'tamagui'
import { StepNavigation } from '../StepNavigation'
import type { WizardStepComponentProps } from './types'
import type { CertificationEntry, CertificationsStepData } from '../../hooks/useProfileWizard'
import { MonthYearPicker } from '@app/ui'
import { randomUUID } from 'expo-crypto'

export function CertificationsStep({
  initialData,
  isSaving,
  isLastStep,
  onBack,
  onContinue,
  onSaveForLater,
  onSkip,
  onStepStateChange,
}: WizardStepComponentProps<'certifications'>) {
  const [certifications, setCertifications] = useState<CertificationEntry[]>(initialData?.certifications ?? [])
  const [name, setName] = useState('')
  const [issuer, setIssuer] = useState('')
  const [issuedOn, setIssuedOn] = useState<Date | null>(null)
  const [expiresOn, setExpiresOn] = useState<Date | null>(null)

  useEffect(() => {
    if (initialData?.certifications) {
      setCertifications(initialData.certifications)
    }
  }, [initialData])

  const hasMinimum = certifications.length > 0

  const baselineKey = useMemo(
    () => serializeCertifications(initialData?.certifications ?? []),
    [initialData?.certifications],
  )
  const currentKey = useMemo(() => serializeCertifications(certifications), [certifications])
  const isDirty = baselineKey !== currentKey

  useEffect(() => {
    const payload: CertificationsStepData = {
      certifications,
    }
    onStepStateChange?.({
      data: payload,
      isValid: true,
      isDirty,
    })
  }, [certifications, isDirty, onStepStateChange])

  const addCertification = () => {
    if (!name.trim() || !issuer.trim()) return

    const entry: CertificationEntry = {
      id: randomUUID(),
      name: name.trim(),
      issuer: issuer.trim(),
      issuedOn: issuedOn ? formatWizardDate(issuedOn) : null,
      expiresOn: expiresOn ? formatWizardDate(expiresOn) : null,
    }
    setCertifications((prev) => [...prev, entry])
    setName('')
    setIssuer('')
    setIssuedOn(null)
    setExpiresOn(null)
  }

  const removeCertification = (id?: string) => {
    if (!id) return
    setCertifications((prev) => prev.filter((cert) => cert.id !== id))
  }

  const handleContinue = async () => {
    await onContinue({ certifications })
  }

  const handleSaveForLater = async () => {
    await onSaveForLater?.({ certifications })
  }

  const handleSkip = async () => {
    await onSkip?.()
  }

  const helperCopy = useMemo(() => {
    if (hasMinimum) {
      return 'Looking great! Keep adding relevant licenses or credentials.'
    }
    return 'Optional but recommended—add any professional certifications or licenses you hold.'
  }, [hasMinimum])

  return (
    <YStack gap="$4">
      <YStack gap="$2">
        <Text fontSize="$6" fontWeight="700">
          Add certifications & licenses
        </Text>
        <Paragraph color="$color11">{helperCopy}</Paragraph>
      </YStack>

      <YStack gap="$3">
        {certifications.map((cert) => (
          <Card key={cert.id ?? cert.name} bordered bg="$color2">
            <Card.Header padded gap="$2">
              <XStack justify="space-between" items="center">
                <YStack gap="$1">
                  <Text fontWeight="600">{cert.name}</Text>
                  {cert.issuer && (
                    <Text fontSize="$2" color="$color10">
                      {cert.issuer}
                    </Text>
                  )}
                  <XStack gap="$2">
                    {cert.issuedOn && (
                      <Text fontSize="$2" color="$color10">
                        Issued {formatDisplayDate(cert.issuedOn)}
                      </Text>
                    )}
                    {cert.expiresOn && (
                      <Text fontSize="$2" color="$color10">
                        • Expires {formatDisplayDate(cert.expiresOn)}
                      </Text>
                    )}
                  </XStack>
                </YStack>
                <Button size="$2" variant="outlined" onPress={() => removeCertification(cert.id)}>
                  Remove
                </Button>
              </XStack>
            </Card.Header>
          </Card>
        ))}
      </YStack>

      <YStack gap="$3">
        <YStack gap="$2">
          <Text fontWeight="600">Certification name</Text>
          <Input placeholder="OSHA 30-Hour Construction Safety" value={name} onChangeText={setName} />
        </YStack>
        <YStack gap="$2">
          <Text fontWeight="600">Issuing organization</Text>
          <Input placeholder="Occupational Safety and Health Administration" value={issuer} onChangeText={setIssuer} />
        </YStack>
        <XStack gap="$3">
          <YStack flex={1} gap="$2">
            <MonthYearPicker
              label="Issued on"
              value={issuedOn}
              onChange={setIssuedOn}
            />
          </YStack>
          <YStack flex={1} gap="$2">
            <MonthYearPicker
              label="Expires on"
              value={expiresOn}
              onChange={setExpiresOn}
            />
          </YStack>
        </XStack>
        <Button onPress={addCertification} disabled={!name.trim() || !issuer.trim()}>
          Add Certification
        </Button>
      </YStack>

      <StepNavigation
        canGoBack
        canGoNext
        isLastStep={isLastStep}
        isSaving={isSaving}
        onBack={onBack}
        onNext={handleContinue}
        onSkip={onSkip ? handleSkip : undefined}
        onSaveForLater={onSaveForLater ? handleSaveForLater : undefined}
        nextLabel="Next: Preferences"
        skipLabel="Skip Certifications"
      />
    </YStack>
  )
}

function serializeCertifications(items: CertificationEntry[]): string {
  return items
    .map((item) => `${item.id ?? item.name}:${item.issuer}:${item.issuedOn ?? ''}:${item.expiresOn ?? ''}`)
    .sort()
    .join('|')
}

function formatWizardDate(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  return `${year}-${month}-01`
}

function formatDisplayDate(value: string): string {
  const [year, month] = value.split('-')
  if (!year || !month) return value
  const date = new Date(Number.parseInt(year, 10), Number.parseInt(month, 10) - 1, 1)
  return date.toLocaleString(undefined, {
    month: 'long',
    year: 'numeric',
  })
}


