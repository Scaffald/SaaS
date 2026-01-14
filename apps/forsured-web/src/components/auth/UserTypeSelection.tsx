/**
 * User Type Selection Component
 * REQ-4: Multi-Industry User Set Type System with Configurable Lexicon
 *
 * Displays role options (Manager/Contractor) with dynamic lexicon labels
 */
import { Stack, Row, Text, Button } from '@unicornlove/beyond-ui'
import { Building2, HardHat, ChevronLeft, Loader2 } from 'lucide-react'
import type { UserSetType } from './IndustrySelection'

export type UserType = 'manager' | 'subcontractor'

export interface UserTypeSelectionProps {
  userSetType: UserSetType
  selectedType: UserType | null
  onSelect: (type: UserType) => void
  onBack: () => void
  isLoading: boolean
}

interface UserTypeCardProps {
  selected: boolean
  disabled: boolean
  onClick: () => void
  children: React.ReactNode
  'data-testid'?: string
}

function UserTypeCard({ selected, disabled, onClick, children, 'data-testid': testId }: UserTypeCardProps) {
  const baseStyle: React.CSSProperties = {
    position: 'relative',
    backgroundColor: 'var(--color-background)',
    borderRadius: '8px',
    boxShadow: '0 2px 4px var(--color-shadow)',
    padding: '24px',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: selected ? 'var(--color-blue9)' : 'transparent',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    flex: 1,
    minWidth: '280px',
  }

  return (
    <Stack
      as="button"
      onPress={disabled ? undefined : onClick}
      style={baseStyle}
      data-testid={testId}
    >
      {children}
    </Stack>
  )
}

export function UserTypeSelection({
  userSetType,
  selectedType,
  onSelect,
  onBack,
  isLoading,
}: UserTypeSelectionProps) {
  return (
    <>
      {/* Back button */}
      <Button onPress={onBack} variant="ghost" data-testid="back-to-industry">
        <Row style={{ alignItems: 'center', gap: '8px' }}>
          <ChevronLeft size={16} />
          <Text>Back to industry selection</Text>
        </Row>
      </Button>

      <Text style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-color12)', marginBottom: '16px' }}>
        How will you use ForSured?
      </Text>

      <Row style={{ flexDirection: 'row', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
        {/* Manager Card - uses lexicon labels */}
        <UserTypeCard
          onPress={() => onSelect('manager')}
          disabled={isLoading}
          selected={selectedType === 'manager'}
          data-testid="user-type-manager"
        >
          <Row style={{ alignItems: 'flex-start', gap: '16px' }}>
            <Row
              style={{
                width: '48px',
                height: '48px',
                backgroundColor: 'var(--color-blue3)',
                borderRadius: '8px',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Building2 size={24} color="currentColor" />
            </Row>
            <Stack style={{ gap: '4px' }}>
              <Text style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-color12)' }}>
                {userSetType.managerLabelSingular}
              </Text>
              <Text style={{ fontSize: '12px', color: 'var(--color-color10)', marginTop: '4px' }}>
                I hire {userSetType.contractorLabelPlural.toLowerCase()} and manage projects
              </Text>
            </Stack>
          </Row>
          {isLoading && selectedType === 'manager' && (
            <Stack
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
              }}
            >
              <Loader2 className="animate-spin" />
            </Stack>
          )}
        </UserTypeCard>

        {/* Contractor Card - uses lexicon labels */}
        <UserTypeCard
          onPress={() => onSelect('subcontractor')}
          disabled={isLoading}
          selected={selectedType === 'subcontractor'}
          data-testid="user-type-contractor"
        >
          <Row style={{ alignItems: 'flex-start', gap: '16px' }}>
            <Row
              style={{
                width: '48px',
                height: '48px',
                backgroundColor: 'var(--color-yellow3)',
                borderRadius: '8px',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <HardHat size={24} color="currentColor" />
            </Row>
            <Stack style={{ gap: '4px' }}>
              <Text style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-color12)' }}>
                {userSetType.contractorLabelSingular}
              </Text>
              <Text style={{ fontSize: '12px', color: 'var(--color-color10)', marginTop: '4px' }}>
                I work on projects for {userSetType.managerLabelPlural.toLowerCase()}
              </Text>
            </Stack>
          </Row>
          {isLoading && selectedType === 'subcontractor' && (
            <Stack
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
              }}
            >
              <Loader2 className="animate-spin" />
            </Stack>
          )}
        </UserTypeCard>
      </Row>
    </>
  )
}
