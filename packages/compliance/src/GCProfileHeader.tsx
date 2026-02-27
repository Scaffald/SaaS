/**
 * GCProfileHeader - Header component for General Contractor profile pages.
 * Beyond UI component.
 */

import { Stack, Row, Text } from '@scaffald/ui'
import { colors, spacing, borderRadius } from '@scaffald/ui/tokens'
import type { StackProps } from '@scaffald/ui'
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
} from 'lucide-react-native'
import { Pressable, View } from 'react-native'

export type ComplianceLevel = 'compliant' | 'warning' | 'critical' | 'unknown'

export interface GCProfileHeaderProps extends Omit<StackProps, 'children'> {
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
  compliant: { label: 'Compliant', color: colors.green[700], bgColor: colors.green[100] },
  warning: { label: 'Warning', color: colors.yellow[700], bgColor: colors.yellow[100] },
  critical: { label: 'Critical', color: colors.error[700], bgColor: colors.error[100] },
  unknown: { label: 'Unknown', color: colors.gray[700], bgColor: colors.gray[100] },
}

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
    <Stack
      style={{
        backgroundColor: colors.bg.light.default,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light.default,
      }}
      {...props}
    >
      {onBack && (
        <Row padding={spacing[4]} align="center" justify="space-between">
          <Pressable
            onPress={onBack}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing[2],
              padding: spacing[2],
              borderRadius: borderRadius.m,
              backgroundColor: pressed ? colors.gray[100] : 'transparent',
            })}
          >
            <ChevronLeft size={16} color={colors.gray[700]} />
            <Text size="sm" style={{ color: colors.gray[700] }}>
              Back
            </Text>
          </Pressable>
        </Row>
      )}

      <Row
        padding={spacing[4]}
        paddingTop={spacing[2]}
        gap={spacing[4]}
        wrap
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: borderRadius.l,
            backgroundColor: colors.blue[100],
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {logoUrl ? (
            <View style={{ width: '100%', height: '100%' }} />
          ) : (
            <Building size={40} color={colors.blue[600]} />
          )}
        </View>

        <Stack flex={1} minWidth={250} gap={spacing[2]}>
          <Row align="center" gap={spacing[4]} wrap>
            <Text size="xl" weight="bold" style={{ color: colors.gray[900] }}>
              {name}
            </Text>
            <Row
              paddingHorizontal={spacing[4]}
              paddingVertical={spacing[2]}
              borderRadius={borderRadius.m}
              align="center"
              gap={spacing[2]}
              style={{ backgroundColor: compliance.bgColor }}
            >
              <Shield size={14} color={compliance.color} />
              <Text size="sm" weight="semibold" style={{ color: compliance.color }}>
                {complianceScore !== undefined ? `${complianceScore}%` : compliance.label}
              </Text>
            </Row>
          </Row>

          <Row gap={spacing[4]} wrap>
            {address && (
              <Row align="center" gap={spacing[2]}>
                <MapPin size={14} color={colors.gray[500]} />
                <Text size="sm" style={{ color: colors.gray[600] }}>
                  {address}
                </Text>
              </Row>
            )}
            {phone && (
              <Row align="center" gap={spacing[2]}>
                <Phone size={14} color={colors.gray[500]} />
                <Text size="sm" style={{ color: colors.gray[600] }}>
                  {phone}
                </Text>
              </Row>
            )}
            {email && (
              <Row align="center" gap={spacing[2]}>
                <Mail size={14} color={colors.gray[500]} />
                <Text size="sm" style={{ color: colors.blue[600] }}>
                  {email}
                </Text>
              </Row>
            )}
            {website && (
              <Row align="center" gap={spacing[2]}>
                <Globe size={14} color={colors.gray[500]} />
                <Text size="sm" style={{ color: colors.blue[600] }}>
                  {website}
                </Text>
              </Row>
            )}
          </Row>

          {memberSince && (
            <Row gap={spacing[4]} wrap>
              <Row align="center" gap={spacing[2]}>
                <Calendar size={14} color={colors.gray[500]} />
                <Text size="sm" style={{ color: colors.gray[600] }}>
                  Member since {memberSince}
                </Text>
              </Row>
            </Row>
          )}
        </Stack>
      </Row>

      <Row padding={spacing[4]} paddingTop={0} gap={spacing[4]} wrap>
        {activeSubcontractors !== undefined && (
          <Stack
            padding={spacing[4]}
            style={{
              backgroundColor: colors.gray[50],
              borderRadius: borderRadius.m,
              minWidth: 120,
            }}
            gap={spacing[2]}
          >
            <Row align="center" gap={spacing[2]}>
              <Users size={16} color={colors.blue[600]} />
              <Text size="lg" weight="bold" style={{ color: colors.gray[900] }}>
                {activeSubcontractors}
              </Text>
            </Row>
            <Text size="xs" style={{ color: colors.gray[500] }}>
              Active Subcontractors
            </Text>
          </Stack>
        )}
        {activeProjects !== undefined && (
          <Stack
            padding={spacing[4]}
            style={{
              backgroundColor: colors.gray[50],
              borderRadius: borderRadius.m,
              minWidth: 120,
            }}
            gap={spacing[2]}
          >
            <Row align="center" gap={spacing[2]}>
              <Building size={16} color={colors.violet[600]} />
              <Text size="lg" weight="bold" style={{ color: colors.gray[900] }}>
                {activeProjects}
              </Text>
            </Row>
            <Text size="xs" style={{ color: colors.gray[500] }}>
              Active Projects
            </Text>
          </Stack>
        )}
        {activePolicies !== undefined && (
          <Stack
            padding={spacing[4]}
            style={{
              backgroundColor: colors.gray[50],
              borderRadius: borderRadius.m,
              minWidth: 120,
            }}
            gap={spacing[2]}
          >
            <Row align="center" gap={spacing[2]}>
              <FileText size={16} color={colors.green[600]} />
              <Text size="lg" weight="bold" style={{ color: colors.gray[900] }}>
                {activePolicies}
              </Text>
            </Row>
            <Text size="xs" style={{ color: colors.gray[500] }}>
              Active Policies
            </Text>
          </Stack>
        )}
      </Row>
    </Stack>
  )
}
