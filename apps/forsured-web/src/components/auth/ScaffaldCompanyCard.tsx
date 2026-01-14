/**
 * Scaffald Company Card Component
 * REQ-126: User Signup with Scaffald Integration
 *
 * Displays the user's Scaffald company and allows connection toggle
 */
import { Stack, Row, Text, Checkbox } from '@unicornlove/beyond-ui'
import { Building2, Loader2 } from 'lucide-react'

export interface Address {
  street: string
  city: string
  state: string
  zip: string
}

export interface ScaffaldCompany {
  id: string
  name: string
  address?: Address
}

export interface ScaffaldCompanyCardProps {
  company: ScaffaldCompany | null
  isLoading: boolean
  connectCompany: boolean
  onToggleConnect: (connect: boolean) => void
}

const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-background)',
  borderRadius: '8px',
  boxShadow: '0 2px 4px var(--color-shadow)',
  padding: '24px',
  gap: '16px',
}

export function ScaffaldCompanyCard({
  company,
  isLoading,
  connectCompany,
  onToggleConnect,
}: ScaffaldCompanyCardProps) {
  if (isLoading) {
    return (
      <Stack style={{ ...cardStyle, gap: '12px' }}>
        <Row style={{ alignItems: 'center', gap: '12px' }}>
          <Loader2 className="animate-spin" size={16} />
          <Text style={{ color: 'var(--color-color10)' }}>Checking for existing company...</Text>
        </Row>
      </Stack>
    )
  }

  if (!company) {
    return null
  }

  return (
    <Stack style={cardStyle}>
      <Row style={{ alignItems: 'flex-start', gap: '16px' }}>
        <Building2 size={32} color="currentColor" />
        <Stack style={{ flex: 1, gap: '4px' }}>
          <Text style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-color12)' }}>
            {company.name}
          </Text>
          {company.address && (
            <Text style={{ fontSize: '12px', color: 'var(--color-color10)', marginTop: '4px' }}>
              {company.address.street}, {company.address.city}, {company.address.state}{' '}
              {company.address.zip}
            </Text>
          )}
          <Row style={{ alignItems: 'center', marginTop: '16px', gap: '8px' }}>
            <Checkbox
              checked={connectCompany}
              onCheckedChange={(checked) => onToggleConnect(!!checked)}
              data-testid="connect-company-checkbox"
            />
            <Text style={{ fontSize: '12px', color: 'var(--color-color11)' }}>
              Connect this company to ForSured
            </Text>
          </Row>
        </Stack>
      </Row>
    </Stack>
  )
}
