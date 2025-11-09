import { useEffect, useMemo, useState } from 'react'
import { Button, Input, Text, XStack, YStack, Paragraph, Card } from 'tamagui'
import { StepNavigation } from '../StepNavigation'
import type { WizardStepComponentProps } from './types'
import type { CertificationEntry, CertificationsStepData } from '../../hooks/useProfileWizard'

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

  useEffect(() => {
    if (initialData?.certifications) {
      setCertifications(initialData.certifications)
    }
  }, [initialData])

  const hasMinimum = certifications.length > 0

  useEffect(() => {
    const payload: CertificationsStepData = {
      certifications,
    }
    onStepStateChange?.({
      data: payload,
      isValid: true,
      isDirty: true,
    })
  }, [certifications, onStepStateChange])

  const addCertification = () => {
    if (!name.trim()) return
    const entry: CertificationEntry = {
      id: `${name.trim().toLowerCase()}-${issuer.trim().toLowerCase()}`,
      name: name.trim(),
      issuer: issuer.trim(),
    }
    setCertifications((prev) => [...prev, entry])
    setName('')
    setIssuer('')
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
        <Button onPress={addCertification} disabled={!name.trim()}>
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


