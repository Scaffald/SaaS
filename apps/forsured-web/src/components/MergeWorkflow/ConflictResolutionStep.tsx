/**
 * ConflictResolutionStep - Side-by-side profile comparison for merge conflicts
 * Merge conflict resolution step
 * Merge workflow conflict resolution step
 *
 * Shows side-by-side comparison of Scaffald profile vs manual user data
 * with radio buttons for selecting which value to keep.
 */
import { useState, useCallback, useMemo } from 'react'
import { Stack, Row, Text, H2, Card } from '@scaffald/ui'
import { User, Building, Check, Loader2 } from 'lucide-react'
import Button from '../Common/Button'

interface Conflict {
  field: string
  manualValue: string
  scaffaldValue: string
}

interface ConflictResolution {
  field: string
  selectedValue: 'manual' | 'scaffald'
}

interface ConflictResolutionStepProps {
  conflicts: Conflict[]
  manualUserName: string
  onComplete: (resolutions: ConflictResolution[]) => void
  onBack: () => void
  isLoading?: boolean
}

/**
 * Format field name for display
 */
function formatFieldName(field: string): string {
  const fieldMap: Record<string, string> = {
    name: 'Full Name',
    email: 'Email Address',
    phone: 'Phone Number',
    company: 'Company Name',
    title: 'Job Title',
    address: 'Address',
    city: 'City',
    state: 'State',
    zip: 'ZIP Code',
    license_number: 'License Number',
  }

  return (
    fieldMap[field] ||
    field
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  )
}

export function ConflictResolutionStep({
  conflicts,
  manualUserName,
  onComplete,
  onBack,
  isLoading = false,
}: ConflictResolutionStepProps) {
  // Initialize with empty selections
  const [selections, setSelections] = useState<Record<string, 'manual' | 'scaffald'>>({})

  // Calculate resolved count
  const resolvedCount = Object.keys(selections).length
  const totalConflicts = conflicts.length
  const allResolved = resolvedCount === totalConflicts

  // Handle selection change
  const handleSelect = useCallback((field: string, value: 'manual' | 'scaffald') => {
    setSelections((prev) => ({
      ...prev,
      [field]: value,
    }))
  }, [])

  // Handle Accept All shortcuts
  const handleAcceptAllScaffald = useCallback(() => {
    const newSelections: Record<string, 'manual' | 'scaffald'> = {}
    conflicts.forEach((c) => {
      newSelections[c.field] = 'scaffald'
    })
    setSelections(newSelections)
  }, [conflicts])

  const handleAcceptAllManual = useCallback(() => {
    const newSelections: Record<string, 'manual' | 'scaffald'> = {}
    conflicts.forEach((c) => {
      newSelections[c.field] = 'manual'
    })
    setSelections(newSelections)
  }, [conflicts])

  // Handle continue
  const handleContinue = useCallback(() => {
    const resolutions: ConflictResolution[] = Object.entries(selections).map(
      ([field, selectedValue]) => ({
        field,
        selectedValue,
      })
    )
    onComplete(resolutions)
  }, [selections, onComplete])

  // If no conflicts, skip this step
  if (conflicts.length === 0) {
    return (
      <Stack alignItems="center" gap={24}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: 'var(--color-green-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Check size={32} style={{ color: 'var(--color-green-10)' }} />
        </div>
        <Stack alignItems="center" gap={8}>
          <H2 style={{ fontSize: 24, fontWeight: 700 }}>No Conflicts Found</H2>
          <Text size="md" muted style={{ textAlign: 'center' }}>
            Your profile information matches perfectly. You can proceed to the next step.
          </Text>
        </Stack>
        <Button variant="primary" onPress={() => onComplete([])} size="lg">
          Continue
        </Button>
      </Stack>
    )
  }

  return (
    <Stack gap={24}>
      {/* Header */}
      <Stack gap={8}>
        <H2 style={{ fontSize: 28, fontWeight: 700 }}>Resolve Profile Conflicts</H2>
        <Text size="md" muted>
          We found some differences between your Scaffald profile and the information provided by{' '}
          {manualUserName}. Please choose which values to keep for each field.
        </Text>
      </Stack>

      {/* Progress indicator */}
      <Card
        style={{
          padding: 16,
          backgroundColor: 'var(--color-blue-2)',
          borderRadius: 12,
        }}
      >
        <Row alignItems="center" justifyContent="space-between">
          <Text size="sm" weight="medium" style={{ color: 'var(--color-blue-11)' }}>
            {resolvedCount} of {totalConflicts} conflicts resolved
          </Text>
          <Row gap={8}>
            <Button
              variant="ghost"
              size="sm"
              onPress={handleAcceptAllScaffald}
              disabled={isLoading}
            >
              Accept All Mine
            </Button>
            <Button variant="ghost" size="sm" onPress={handleAcceptAllManual} disabled={isLoading}>
              Accept All Theirs
            </Button>
          </Row>
        </Row>
      </Card>

      {/* Conflict cards */}
      <Stack gap={16}>
        {conflicts.map((conflict) => {
          const selected = selections[conflict.field]
          const isScaffaldSelected = selected === 'scaffald'
          const isManualSelected = selected === 'manual'

          return (
            <Card
              key={conflict.field}
              style={{
                padding: 0,
                borderRadius: 12,
                overflow: 'hidden',
                border: '1px solid var(--color-border)',
              }}
            >
              {/* Field header */}
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'var(--color-gray-2)',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <Text
                  size="sm"
                  weight="semibold"
                  style={{ textTransform: 'uppercase', letterSpacing: '0.02em' }}
                >
                  {formatFieldName(conflict.field)}
                </Text>
              </div>

              {/* Side-by-side options */}
              <Row style={{ borderBottom: selected ? '1px solid var(--color-border)' : undefined }}>
                {/* Scaffald value */}
                <button
                  type="button"
                  onClick={() => handleSelect(conflict.field, 'scaffald')}
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    padding: 16,
                    background: isScaffaldSelected ? 'var(--color-blue-2)' : 'transparent',
                    border: 'none',
                    borderRight: '1px solid var(--color-border)',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    opacity: isLoading ? 0.5 : 1,
                  }}
                  aria-pressed={isScaffaldSelected}
                >
                  <Stack gap={8}>
                    <Row alignItems="center" gap={8}>
                      <User size={16} style={{ color: 'var(--color-blue-10)' }} />
                      <Text size="xs" weight="medium" style={{ color: 'var(--color-blue-10)' }}>
                        Your Profile
                      </Text>
                      {isScaffaldSelected && (
                        <Check
                          size={14}
                          style={{ color: 'var(--color-blue-10)', marginLeft: 'auto' }}
                        />
                      )}
                    </Row>
                    <Text size="md" weight={isScaffaldSelected ? 'semibold' : 'normal'}>
                      {conflict.scaffaldValue || '(empty)'}
                    </Text>
                  </Stack>
                </button>

                {/* Manual value */}
                <button
                  type="button"
                  onClick={() => handleSelect(conflict.field, 'manual')}
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    padding: 16,
                    background: isManualSelected ? 'var(--color-orange-2)' : 'transparent',
                    border: 'none',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    opacity: isLoading ? 0.5 : 1,
                  }}
                  aria-pressed={isManualSelected}
                >
                  <Stack gap={8}>
                    <Row alignItems="center" gap={8}>
                      <Building size={16} style={{ color: 'var(--color-orange-10)' }} />
                      <Text size="xs" weight="medium" style={{ color: 'var(--color-orange-10)' }}>
                        From {manualUserName}
                      </Text>
                      {isManualSelected && (
                        <Check
                          size={14}
                          style={{ color: 'var(--color-orange-10)', marginLeft: 'auto' }}
                        />
                      )}
                    </Row>
                    <Text size="md" weight={isManualSelected ? 'semibold' : 'normal'}>
                      {conflict.manualValue || '(empty)'}
                    </Text>
                  </Stack>
                </button>
              </Row>

              {/* Selection indicator */}
              {selected && (
                <div
                  style={{
                    padding: '8px 16px',
                    backgroundColor: isScaffaldSelected
                      ? 'var(--color-blue-2)'
                      : 'var(--color-orange-2)',
                  }}
                >
                  <Text
                    size="xs"
                    style={{
                      color: isScaffaldSelected ? 'var(--color-blue-11)' : 'var(--color-orange-11)',
                    }}
                  >
                    Selected:{' '}
                    {isScaffaldSelected ? 'Your profile value' : `Value from ${manualUserName}`}
                  </Text>
                </div>
              )}
            </Card>
          )
        })}
      </Stack>

      {/* Navigation buttons */}
      <Row gap={12} style={{ marginTop: 16 }}>
        <Button variant="ghost" onPress={onBack} disabled={isLoading} style={{ flex: 1 }}>
          Skip for Now
        </Button>
        <Button
          variant="primary"
          onPress={handleContinue}
          disabled={!allResolved || isLoading}
          style={{ flex: 2 }}
        >
          {isLoading ? (
            <Row alignItems="center" gap={8}>
              <Loader2 size={16} className="animate-spin" />
              <span>Saving...</span>
            </Row>
          ) : (
            'Continue'
          )}
        </Button>
      </Row>
    </Stack>
  )
}

export default ConflictResolutionStep
