/**
 * ClientCard - Card component for displaying client information
 * REQ-288: Tamagui UI Component Library
 */

import { styled, YStack, XStack, Text, View, type YStackProps } from 'tamagui'
import {
  Building,
  User,
  Mail,
  Phone,
  Shield,
  AlertTriangle,
  ChevronRight,
} from '@tamagui/lucide-icons'

export type ClientType = 'general_contractor' | 'subcontractor' | 'owner' | 'vendor'
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type ClientStatus = 'active' | 'inactive' | 'pending' | 'suspended'

export interface ClientCardProps extends Omit<YStackProps, 'children'> {
  /** Client ID */
  id: string
  /** Company/Client name */
  name: string
  /** Client type */
  type: ClientType
  /** Client status */
  status?: ClientStatus
  /** Risk level */
  riskLevel?: RiskLevel
  /** Compliance score (0-100) */
  complianceScore?: number
  /** Contact email */
  email?: string
  /** Contact phone */
  phone?: string
  /** Address */
  address?: string
  /** Primary contact name */
  primaryContact?: string
  /** Number of active projects */
  activeProjects?: number
  /** Click handler */
  onPress?: () => void
  /** Variant style */
  variant?: 'default' | 'compact'
}

const typeConfig: Record<ClientType, { label: string; color: string; bgColor: string }> = {
  general_contractor: {
    label: 'General Contractor',
    color: '$blue11',
    bgColor: '$blue3',
  },
  subcontractor: {
    label: 'Subcontractor',
    color: '$purple11',
    bgColor: '$purple3',
  },
  owner: {
    label: 'Owner',
    color: '$green11',
    bgColor: '$green3',
  },
  vendor: {
    label: 'Vendor',
    color: '$orange11',
    bgColor: '$orange3',
  },
}

const riskConfig: Record<RiskLevel, { label: string; color: string; bgColor: string }> = {
  low: { label: 'Low Risk', color: '$green11', bgColor: '$green3' },
  medium: { label: 'Medium Risk', color: '$yellow11', bgColor: '$yellow3' },
  high: { label: 'High Risk', color: '$orange11', bgColor: '$orange3' },
  critical: { label: 'Critical Risk', color: '$red11', bgColor: '$red3' },
}

const statusConfig: Record<ClientStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: '$green10' },
  inactive: { label: 'Inactive', color: '$gray10' },
  pending: { label: 'Pending', color: '$yellow10' },
  suspended: { label: 'Suspended', color: '$red10' },
}

const CardContainer = styled(YStack, {
  name: 'ClientCard',
  padding: '$4',
  backgroundColor: '$background',
  borderRadius: '$lg',
  borderWidth: 1,
  borderColor: '$borderColor',
  gap: '$3',

  variants: {
    variant: {
      default: {},
      compact: {
        padding: '$3',
        gap: '$2',
      },
    },
    pressable: {
      true: {
        cursor: 'pointer',
        hoverStyle: {
          borderColor: '$color7',
          backgroundColor: '$color2',
        },
        pressStyle: {
          backgroundColor: '$color3',
        },
      },
    },
  } as const,

  defaultVariants: {
    variant: 'default',
  },
})

const HeaderRow = styled(XStack, {
  name: 'ClientCardHeader',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '$3',
})

const ClientInfo = styled(XStack, {
  name: 'ClientCardInfo',
  alignItems: 'center',
  gap: '$3',
  flex: 1,
})

const Avatar = styled(View, {
  name: 'ClientCardAvatar',
  width: 48,
  height: 48,
  borderRadius: '$full',
  alignItems: 'center',
  justifyContent: 'center',
})

const NameContainer = styled(YStack, {
  name: 'ClientCardName',
  flex: 1,
  gap: '$1',
})

const ClientName = styled(Text, {
  name: 'ClientCardClientName',
  fontSize: '$5',
  fontWeight: '600',
  color: '$color12',
})

const TypeBadge = styled(XStack, {
  name: 'ClientCardTypeBadge',
  paddingHorizontal: '$2',
  paddingVertical: '$1',
  borderRadius: '$sm',
  alignItems: 'center',
  gap: '$1',
})

const BadgeText = styled(Text, {
  name: 'ClientCardBadgeText',
  fontSize: '$2',
  fontWeight: '500',
})

const StatsRow = styled(XStack, {
  name: 'ClientCardStats',
  gap: '$4',
  flexWrap: 'wrap',
})

const StatItem = styled(XStack, {
  name: 'ClientCardStatItem',
  alignItems: 'center',
  gap: '$2',
})

const StatLabel = styled(Text, {
  name: 'ClientCardStatLabel',
  fontSize: '$2',
  color: '$color9',
})

const StatValue = styled(Text, {
  name: 'ClientCardStatValue',
  fontSize: '$3',
  fontWeight: '600',
})

const ContactRow = styled(XStack, {
  name: 'ClientCardContact',
  gap: '$4',
  flexWrap: 'wrap',
})

const ContactItem = styled(XStack, {
  name: 'ClientCardContactItem',
  alignItems: 'center',
  gap: '$1',
})

const ContactText = styled(Text, {
  name: 'ClientCardContactText',
  fontSize: '$2',
  color: '$color10',
})

function getComplianceColor(score: number): string {
  if (score >= 80) return '$green11'
  if (score >= 60) return '$yellow11'
  return '$red11'
}

export function ClientCard({
  id,
  name,
  type,
  status = 'active',
  riskLevel,
  complianceScore,
  email,
  phone,
  address,
  primaryContact,
  activeProjects,
  onPress,
  variant = 'default',
  ...props
}: ClientCardProps) {
  const typeInfo = typeConfig[type]
  const riskInfo = riskLevel ? riskConfig[riskLevel] : null
  const statusInfo = statusConfig[status]

  return (
    <CardContainer
      variant={variant}
      pressable={!!onPress}
      onPress={onPress}
      {...props}
    >
      <HeaderRow>
        <ClientInfo>
          <Avatar backgroundColor={typeInfo.bgColor}>
            <Building size={24} color={typeInfo.color} />
          </Avatar>
          <NameContainer>
            <XStack alignItems="center" gap="$2">
              <ClientName>{name}</ClientName>
              {onPress && <ChevronRight size={16} color="$color9" />}
            </XStack>
            <XStack gap="$2" flexWrap="wrap">
              <TypeBadge backgroundColor={typeInfo.bgColor}>
                <BadgeText color={typeInfo.color}>{typeInfo.label}</BadgeText>
              </TypeBadge>
              {riskInfo && (
                <TypeBadge backgroundColor={riskInfo.bgColor}>
                  <AlertTriangle size={10} color={riskInfo.color} />
                  <BadgeText color={riskInfo.color}>{riskInfo.label}</BadgeText>
                </TypeBadge>
              )}
            </XStack>
          </NameContainer>
        </ClientInfo>
      </HeaderRow>

      {variant === 'default' && (
        <>
          <StatsRow>
            {complianceScore !== undefined && (
              <StatItem>
                <Shield size={14} color={getComplianceColor(complianceScore)} />
                <StatLabel>Compliance</StatLabel>
                <StatValue color={getComplianceColor(complianceScore)}>
                  {complianceScore}%
                </StatValue>
              </StatItem>
            )}
            {activeProjects !== undefined && (
              <StatItem>
                <Building size={14} color="$color9" />
                <StatLabel>Active Projects</StatLabel>
                <StatValue color="$color12">{activeProjects}</StatValue>
              </StatItem>
            )}
            <StatItem>
              <View
                width={8}
                height={8}
                borderRadius="$full"
                backgroundColor={statusInfo.color}
              />
              <StatLabel>{statusInfo.label}</StatLabel>
            </StatItem>
          </StatsRow>

          {(email || phone || primaryContact) && (
            <ContactRow>
              {primaryContact && (
                <ContactItem>
                  <User size={12} color="$color9" />
                  <ContactText>{primaryContact}</ContactText>
                </ContactItem>
              )}
              {email && (
                <ContactItem>
                  <Mail size={12} color="$color9" />
                  <ContactText>{email}</ContactText>
                </ContactItem>
              )}
              {phone && (
                <ContactItem>
                  <Phone size={12} color="$color9" />
                  <ContactText>{phone}</ContactText>
                </ContactItem>
              )}
            </ContactRow>
          )}
        </>
      )}
    </CardContainer>
  )
}
