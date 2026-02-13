/**
 * ClientCard - Card component for displaying client information.
 * Beyond UI component.
 */

import { Stack, Row, Text, Box } from '@scaffald/ui'
import { colors, spacing, borderRadius } from '@scaffald/ui/tokens'
import type { StackProps } from '@scaffald/ui'
import {
  Building,
  User,
  Mail,
  Phone,
  Shield,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react-native'
import { Pressable, View } from 'react-native'

export type ClientType = 'general_contractor' | 'subcontractor' | 'owner' | 'vendor'
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type ClientStatus = 'active' | 'inactive' | 'pending' | 'suspended'

export interface ClientCardProps extends Omit<StackProps, 'children'> {
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
    color: colors.blue[700],
    bgColor: colors.blue[100],
  },
  subcontractor: {
    label: 'Subcontractor',
    color: colors.violet[700],
    bgColor: colors.violet[100],
  },
  owner: {
    label: 'Owner',
    color: colors.green[700],
    bgColor: colors.green[100],
  },
  vendor: {
    label: 'Vendor',
    color: colors.orange[700],
    bgColor: colors.orange[100],
  },
}

const riskConfig: Record<RiskLevel, { label: string; color: string; bgColor: string }> = {
  low: { label: 'Low Risk', color: colors.green[700], bgColor: colors.green[100] },
  medium: { label: 'Medium Risk', color: colors.yellow[700], bgColor: colors.yellow[100] },
  high: { label: 'High Risk', color: colors.orange[700], bgColor: colors.orange[100] },
  critical: { label: 'Critical Risk', color: colors.error[700], bgColor: colors.error[100] },
}

const statusConfig: Record<ClientStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: colors.green[600] },
  inactive: { label: 'Inactive', color: colors.gray[600] },
  pending: { label: 'Pending', color: colors.yellow[600] },
  suspended: { label: 'Suspended', color: colors.error[600] },
}

function getComplianceColor(score: number): string {
  if (score >= 80) return colors.green[700]
  if (score >= 60) return colors.yellow[700]
  return colors.error[700]
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

  const content = (
    <>
      <Row align="flex-start" justify="space-between" gap={spacing[4]}>
        <Row align="center" gap={spacing[4]} flex={1}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 9999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: typeInfo.bgColor,
            }}
          >
            <Building size={24} color={typeInfo.color} />
          </View>
          <Stack flex={1} gap={spacing[2]}>
            <Row align="center" gap={spacing[2]}>
              <Text size="md" weight="semibold" style={{ color: colors.gray[900] }}>
                {name}
              </Text>
              {onPress && <ChevronRight size={16} color={colors.gray[500]} />}
            </Row>
            <Row gap={spacing[2]} wrap>
              <Row
                paddingHorizontal={spacing[2]}
                paddingVertical={spacing[2]}
                borderRadius={borderRadius.s}
                align="center"
                gap={spacing[2]}
                style={{ backgroundColor: typeInfo.bgColor }}
              >
                <Text size="xs" weight="medium" style={{ color: typeInfo.color }}>
                  {typeInfo.label}
                </Text>
              </Row>
              {riskInfo && (
                <Row
                  paddingHorizontal={spacing[2]}
                  paddingVertical={spacing[2]}
                  borderRadius={borderRadius.s}
                  align="center"
                  gap={spacing[2]}
                  style={{ backgroundColor: riskInfo.bgColor }}
                >
                  <AlertTriangle size={10} color={riskInfo.color} />
                  <Text size="xs" weight="medium" style={{ color: riskInfo.color }}>
                    {riskInfo.label}
                  </Text>
                </Row>
              )}
            </Row>
          </Stack>
        </Row>
      </Row>

      {variant === 'default' && (
        <>
          <Row gap={spacing[4]} wrap>
            {complianceScore !== undefined && (
              <Row align="center" gap={spacing[2]}>
                <Shield size={14} color={getComplianceColor(complianceScore)} />
                <Text size="xs" style={{ color: colors.gray[500] }}>
                  Compliance
                </Text>
                <Text size="sm" weight="semibold" style={{ color: getComplianceColor(complianceScore) }}>
                  {complianceScore}%
                </Text>
              </Row>
            )}
            {activeProjects !== undefined && (
              <Row align="center" gap={spacing[2]}>
                <Building size={14} color={colors.gray[500]} />
                <Text size="xs" style={{ color: colors.gray[500] }}>
                  Active Projects
                </Text>
                <Text size="sm" weight="semibold" style={{ color: colors.gray[900] }}>
                  {activeProjects}
                </Text>
              </Row>
            )}
            <Row align="center" gap={spacing[2]}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: statusInfo.color,
                }}
              />
              <Text size="xs" style={{ color: colors.gray[500] }}>
                {statusInfo.label}
              </Text>
            </Row>
          </Row>

          {(email || phone || primaryContact) && (
            <Row gap={spacing[4]} wrap>
              {primaryContact && (
                <Row align="center" gap={spacing[2]}>
                  <User size={12} color={colors.gray[500]} />
                  <Text size="xs" style={{ color: colors.gray[600] }}>
                    {primaryContact}
                  </Text>
                </Row>
              )}
              {email && (
                <Row align="center" gap={spacing[2]}>
                  <Mail size={12} color={colors.gray[500]} />
                  <Text size="xs" style={{ color: colors.gray[600] }}>
                    {email}
                  </Text>
                </Row>
              )}
              {phone && (
                <Row align="center" gap={spacing[2]}>
                  <Phone size={12} color={colors.gray[500]} />
                  <Text size="xs" style={{ color: colors.gray[600] }}>
                    {phone}
                  </Text>
                </Row>
              )}
            </Row>
          )}
        </>
      )}
    </>
  )

  const cardStyle = {
    padding: spacing[variant === 'compact' ? 4 : 6],
    backgroundColor: colors.bg.light.default,
    borderRadius: borderRadius.l,
    borderWidth: 1,
    borderColor: colors.border.light.default,
    gap: spacing[variant === 'compact' ? 2 : 4],
  }

  if (onPress) {
    return (
      <Pressable onPress={onPress} {...props}>
        <Box style={cardStyle}>{content}</Box>
      </Pressable>
    )
  }

  return (
    <Box style={cardStyle} {...props}>
      {content}
    </Box>
  )
}
