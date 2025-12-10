/**
 * GCProfileHeader - Header component for General Contractor profile pages
 * REQ-288: Tamagui UI Component Library
 */

import { styled, YStack, XStack, Text, View, type YStackProps } from 'tamagui'
import {
  Building,
  MapPin,
  Phone,
  Mail,
  Globe,
  Shield,
  Users,
  FileText,
  Calendar,
  ChevronLeft,
} from '@tamagui/lucide-icons'

export type ComplianceLevel = 'compliant' | 'warning' | 'critical' | 'unknown'

export interface GCProfileHeaderProps extends Omit<YStackProps, 'children'> {
  /** GC company name */
  name: string
  /** Company logo URL */
  logoUrl?: string
  /** Company address */
  address?: string
  /** Contact phone */
  phone?: string
  /** Contact email */
  email?: string
  /** Website URL */
  website?: string
  /** Overall compliance level */
  complianceLevel?: ComplianceLevel
  /** Compliance score (0-100) */
  complianceScore?: number
  /** Number of active subcontractors */
  activeSubcontractors?: number
  /** Number of active projects */
  activeProjects?: number
  /** Number of active policies */
  activePolicies?: number
  /** Member since date */
  memberSince?: string
  /** Back navigation handler */
  onBack?: () => void
  /** Edit handler */
  onEdit?: () => void
}

const complianceConfig: Record<ComplianceLevel, { label: string; color: string; bgColor: string }> = {
  compliant: { label: 'Compliant', color: '$green11', bgColor: '$green3' },
  warning: { label: 'Warning', color: '$yellow11', bgColor: '$yellow3' },
  critical: { label: 'Critical', color: '$red11', bgColor: '$red3' },
  unknown: { label: 'Unknown', color: '$gray11', bgColor: '$gray3' },
}

const HeaderContainer = styled(YStack, {
  name: 'GCProfileHeader',
  backgroundColor: '$background',
  borderBottomWidth: 1,
  borderBottomColor: '$borderColor',
})

const TopBar = styled(XStack, {
  name: 'GCProfileHeaderTopBar',
  padding: '$3',
  alignItems: 'center',
  justifyContent: 'space-between',
})

const BackButton = styled(XStack, {
  name: 'GCProfileHeaderBackButton',
  alignItems: 'center',
  gap: '$1',
  padding: '$2',
  borderRadius: '$md',
  cursor: 'pointer',

  hoverStyle: {
    backgroundColor: '$color3',
  },

  pressStyle: {
    backgroundColor: '$color4',
  },
})

const BackText = styled(Text, {
  name: 'GCProfileHeaderBackText',
  fontSize: '$3',
  color: '$color11',
})

const MainContent = styled(XStack, {
  name: 'GCProfileHeaderMain',
  padding: '$4',
  paddingTop: '$2',
  gap: '$4',
  flexWrap: 'wrap',
})

const LogoContainer = styled(View, {
  name: 'GCProfileHeaderLogo',
  width: 80,
  height: 80,
  borderRadius: '$lg',
  backgroundColor: '$blue3',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
})

const InfoContainer = styled(YStack, {
  name: 'GCProfileHeaderInfo',
  flex: 1,
  minWidth: 250,
  gap: '$2',
})

const CompanyName = styled(Text, {
  name: 'GCProfileHeaderName',
  fontSize: '$7',
  fontWeight: '700',
  color: '$color12',
})

const ContactRow = styled(XStack, {
  name: 'GCProfileHeaderContact',
  gap: '$4',
  flexWrap: 'wrap',
})

const ContactItem = styled(XStack, {
  name: 'GCProfileHeaderContactItem',
  alignItems: 'center',
  gap: '$2',
})

const ContactText = styled(Text, {
  name: 'GCProfileHeaderContactText',
  fontSize: '$3',
  color: '$color10',
})

const ContactLink = styled(Text, {
  name: 'GCProfileHeaderContactLink',
  fontSize: '$3',
  color: '$blue10',
  cursor: 'pointer',

  hoverStyle: {
    textDecorationLine: 'underline',
  },
})

const StatsContainer = styled(XStack, {
  name: 'GCProfileHeaderStats',
  padding: '$4',
  paddingTop: 0,
  gap: '$4',
  flexWrap: 'wrap',
})

const StatCard = styled(YStack, {
  name: 'GCProfileHeaderStatCard',
  padding: '$3',
  backgroundColor: '$color2',
  borderRadius: '$md',
  minWidth: 120,
  gap: '$1',
})

const StatValue = styled(Text, {
  name: 'GCProfileHeaderStatValue',
  fontSize: '$6',
  fontWeight: '700',
  color: '$color12',
})

const StatLabel = styled(Text, {
  name: 'GCProfileHeaderStatLabel',
  fontSize: '$2',
  color: '$color9',
})

const ComplianceBadge = styled(XStack, {
  name: 'GCProfileHeaderComplianceBadge',
  paddingHorizontal: '$3',
  paddingVertical: '$2',
  borderRadius: '$md',
  alignItems: 'center',
  gap: '$2',
})

const ComplianceText = styled(Text, {
  name: 'GCProfileHeaderComplianceText',
  fontSize: '$4',
  fontWeight: '600',
})

export function GCProfileHeader({
  name,
  logoUrl,
  address,
  phone,
  email,
  website,
  complianceLevel = 'unknown',
  complianceScore,
  activeSubcontractors,
  activeProjects,
  activePolicies,
  memberSince,
  onBack,
  onEdit,
  ...props
}: GCProfileHeaderProps) {
  const compliance = complianceConfig[complianceLevel]

  return (
    <HeaderContainer {...props}>
      {onBack && (
        <TopBar>
          <BackButton onPress={onBack}>
            <ChevronLeft size={16} color="$color11" />
            <BackText>Back</BackText>
          </BackButton>
        </TopBar>
      )}

      <MainContent>
        <LogoContainer>
          {logoUrl ? (
            <View
              width="100%"
              height="100%"
              // Image would go here in actual implementation
            />
          ) : (
            <Building size={40} color="$blue10" />
          )}
        </LogoContainer>

        <InfoContainer>
          <XStack alignItems="center" gap="$3" flexWrap="wrap">
            <CompanyName>{name}</CompanyName>
            <ComplianceBadge backgroundColor={compliance.bgColor}>
              <Shield size={14} color={compliance.color} />
              <ComplianceText color={compliance.color}>
                {complianceScore !== undefined ? `${complianceScore}%` : compliance.label}
              </ComplianceText>
            </ComplianceBadge>
          </XStack>

          <ContactRow>
            {address && (
              <ContactItem>
                <MapPin size={14} color="$color9" />
                <ContactText>{address}</ContactText>
              </ContactItem>
            )}
            {phone && (
              <ContactItem>
                <Phone size={14} color="$color9" />
                <ContactText>{phone}</ContactText>
              </ContactItem>
            )}
            {email && (
              <ContactItem>
                <Mail size={14} color="$color9" />
                <ContactLink>{email}</ContactLink>
              </ContactItem>
            )}
            {website && (
              <ContactItem>
                <Globe size={14} color="$color9" />
                <ContactLink>{website}</ContactLink>
              </ContactItem>
            )}
          </ContactRow>

          {memberSince && (
            <ContactRow>
              <ContactItem>
                <Calendar size={14} color="$color9" />
                <ContactText>Member since {memberSince}</ContactText>
              </ContactItem>
            </ContactRow>
          )}
        </InfoContainer>
      </MainContent>

      <StatsContainer>
        {activeSubcontractors !== undefined && (
          <StatCard>
            <XStack alignItems="center" gap="$2">
              <Users size={16} color="$blue10" />
              <StatValue>{activeSubcontractors}</StatValue>
            </XStack>
            <StatLabel>Active Subcontractors</StatLabel>
          </StatCard>
        )}
        {activeProjects !== undefined && (
          <StatCard>
            <XStack alignItems="center" gap="$2">
              <Building size={16} color="$purple10" />
              <StatValue>{activeProjects}</StatValue>
            </XStack>
            <StatLabel>Active Projects</StatLabel>
          </StatCard>
        )}
        {activePolicies !== undefined && (
          <StatCard>
            <XStack alignItems="center" gap="$2">
              <FileText size={16} color="$green10" />
              <StatValue>{activePolicies}</StatValue>
            </XStack>
            <StatLabel>Active Policies</StatLabel>
          </StatCard>
        )}
      </StatsContainer>
    </HeaderContainer>
  )
}
