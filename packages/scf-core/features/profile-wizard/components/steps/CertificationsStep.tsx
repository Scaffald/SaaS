import { MonthYearPicker } from '@unicornlove/beyond-ui'
import { randomUUID } from 'expo-crypto'
import { useEffect, useId, useMemo, useState } from 'react'
import { Button, Card, Input, Label, Paragraph, Text, Row, Stack } from '@unicornlove/beyond-ui'
import type { CertificationEntry, CertificationsStepData } from '../../hooks/useProfileWizard'
import { StepNavigation } from '../StepNavigation'
import type { WizardStepComponentProps } from './types'

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
  const [certifications, setCertifications] = useState<CertificationEntry[]>(
    initialData?.certifications ?? []
  )
  const [name, setName] = useState('')
  const [issuer, setIssuer] = useState('')
  const [issuedOn, setIssuedOn] = useState<Date | null>(null)
  const [expiresOn, setExpiresOn] = useState<Date | null>(null)
  const guidanceId = useId()
  const certNameId = useId()
  const issuerId = useId()

  useEffect(() => {
    if (initialData?.certifications) {
      setCertifications(initialData.certifications)
    }
  }, [initialData])

  const hasMinimum = certifications.length > 0

  const baselineKey = useMemo(
    () => serializeCertifications(initialData?.certifications ?? []),
    [initialData?.certifications]
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
    <Stack gap="$4">
      <Stack gap="$2">
        <Text fontSize="$6" fontWeight="700">
          Add certifications & licenses
        </Text>
        <Paragraph id={guidanceId} color="$color11" aria-live="polite">
          {helperCopy}
        </Paragraph>
      </Stack>

      <Stack gap="$3">
        {certifications.map((cert) => (
          <Card key={cert.id ?? cert.name} bordered backgroundColor="$color2">
            <Card.Header padded gap="$2">
              <Row justifyContent="space-between" alignItems="center">
                <Stack gap="$1">
                  <Text fontWeight="600">{cert.name}</Text>
                  {cert.issuer && (
                    <Text fontSize="$2" color="$color10">
                      {cert.issuer}
                    </Text>
                  )}
                  <Row gap="$2">
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
                  </Row>
                </Stack>
                <Button
                  size="$2"
                  variant="outlined"
                  onPress={() => removeCertification(cert.id)}
                  aria-label={`Remove ${cert.name}`}
                >
                  Remove
                </Button>
              </Row>
            </Card.Header>
          </Card>
        ))}
      </Stack>

      <Stack gap="$3">
        <Stack gap="$2">
          <Label htmlFor={certNameId} fontWeight="600">
            Certification name
          </Label>
          <Input
            id={certNameId}
            placeholder="OSHA 30-Hour Construction Safety"
            value={name}
            onChangeText={setName}
          />
        </Stack>
        <Stack gap="$2">
          <Label htmlFor={issuerId} fontWeight="600">
            Issuing organization
          </Label>
          <Input
            id={issuerId}
            placeholder="Occupational Safety and Health Administration"
            value={issuer}
            onChangeText={setIssuer}
          />
        </Stack>
        <Row gap="$3">
          <Stack flex={1} gap="$2">
            <MonthYearPicker label="Issued on" value={issuedOn} onChange={setIssuedOn} />
          </Stack>
          <Stack flex={1} gap="$2">
            <MonthYearPicker label="Expires on" value={expiresOn} onChange={setExpiresOn} />
          </Stack>
        </Row>
        <Button onPress={addCertification} disabled={!name.trim() || !issuer.trim()}>
          Add Certification
        </Button>
      </Stack>

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
    </Stack>
  )
}

function serializeCertifications(items: CertificationEntry[]): string {
  return items
    .map(
      (item) =>
        `${item.id ?? item.name}:${item.issuer}:${item.issuedOn ?? ''}:${item.expiresOn ?? ''}`
    )
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
