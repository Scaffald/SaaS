/**
 * Industry Selection Component
 * Multi-Industry User Set Type System with Configurable Lexicon
 *
 * Displays available industries for user selection during signup
 */
import { Stack, Row, Text } from '@scaffald/ui'
import { Factory, Home, Briefcase, Loader2 } from 'lucide-react'

/** User set type data from API */
export interface UserSetType {
  id: string
  name: string
  slug: string
  managerLabelSingular: string
  managerLabelPlural: string
  contractorLabelSingular: string
  contractorLabelPlural: string
  description: string | null
}

export interface IndustrySelectionProps {
  userSetTypes: UserSetType[] | undefined
  isLoading: boolean
  error: Error | null
  selectedId?: string
  onSelect: (userSetType: UserSetType) => void
  disabled?: boolean
}

interface IndustryCardProps {
  selected: boolean
  disabled: boolean
  onClick: () => void
  children: React.ReactNode
  'data-testid'?: string
}

function IndustryCard({ selected, disabled, onClick, children, 'data-testid': testId }: IndustryCardProps) {
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
      onClick={disabled ? undefined : onClick}
      style={baseStyle}
      data-testid={testId}
    >
      {children}
    </Stack>
  )
}

/** Helper to get icon for user set type */
function getIndustryIcon(slug: string) {
  switch (slug) {
    case 'construction':
      return <Factory size={24} color="currentColor" />
    case 'property-management':
      return <Home size={24} color="currentColor" />
    default:
      return <Briefcase size={24} color="currentColor" />
  }
}

/** Helper to get icon background color */
function getIndustryColor(slug: string): React.CSSProperties {
  switch (slug) {
    case 'construction':
      return { backgroundColor: 'var(--color-orange3)' }
    case 'property-management':
      return { backgroundColor: 'var(--color-green3)' }
    default:
      return { backgroundColor: 'var(--color-blue3)' }
  }
}

export function IndustrySelection({
  userSetTypes,
  isLoading,
  error,
  selectedId,
  onSelect,
  disabled = false,
}: IndustrySelectionProps) {
  if (isLoading) {
    return (
      <Stack style={{ alignItems: 'center', padding: '32px' }}>
        <Loader2 className="animate-spin" size={32} />
        <Text style={{ color: 'var(--color-color10)', marginTop: '16px' }}>
          Loading industries...
        </Text>
      </Stack>
    )
  }

  if (error) {
    return (
      <Stack
        data-testid="user-set-types-error"
        style={{
          backgroundColor: 'var(--color-red2)',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: 'var(--color-red6)',
          borderRadius: '8px',
          padding: '16px',
          gap: '8px',
        }}
      >
        <Text style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-red11)' }}>
          Failed to load industries
        </Text>
        <Text style={{ fontSize: '12px', color: 'var(--color-red10)' }}>
          Please refresh the page or contact support if the problem persists.
        </Text>
      </Stack>
    )
  }

  // Ensure userSetTypes is an array before using .map()
  if (!userSetTypes || !Array.isArray(userSetTypes) || userSetTypes.length === 0) {
    return (
      <Stack
        data-testid="no-user-set-types"
        style={{
          backgroundColor: 'var(--color-yellow2)',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: 'var(--color-yellow6)',
          borderRadius: '8px',
          padding: '16px',
          gap: '8px',
        }}
      >
        <Text style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-yellow11)' }}>
          No industries available
        </Text>
        <Text style={{ fontSize: '12px', color: 'var(--color-yellow10)' }}>
          Please contact support to set up your account.
        </Text>
      </Stack>
    )
  }

  return (
    <>
      <Text style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-color12)', marginBottom: '16px' }}>
        What industry are you in?
      </Text>

      <Row style={{ flexDirection: 'row', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
        {userSetTypes.map((ust) => (
          <IndustryCard
            key={ust.id}
            onClick={() => onSelect(ust)}
            disabled={disabled}
            selected={selectedId === ust.id}
            data-testid={`industry-${ust.slug}`}
          >
            <Row style={{ alignItems: 'flex-start', gap: '16px' }}>
              <Row
                style={{
                  width: '48px',
                  height: '48px',
                  ...getIndustryColor(ust.slug),
                  borderRadius: '8px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {getIndustryIcon(ust.slug)}
              </Row>
              <Stack style={{ gap: '4px' }}>
                <Text style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-color12)' }}>
                  {ust.name}
                </Text>
                {ust.description && (
                  <Text style={{ fontSize: '12px', color: 'var(--color-color10)', marginTop: '4px' }}>
                    {ust.description}
                  </Text>
                )}
              </Stack>
            </Row>
          </IndustryCard>
        ))}
      </Row>
    </>
  )
}
