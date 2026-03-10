/**
 * Union Status Badge & Detail - Shows union membership info on candidate records.
 * Supports union vs non-union flagging and prevailing wage eligibility.
 *
 * @see Issue #98
 */

import { Award, HardHat, Shield } from 'lucide-react-native'
import { Card, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import type { MockApplication } from '../../mock-data/ats-mock-data'

interface UnionStatusBadgeProps {
  unionStatus: NonNullable<MockApplication['unionStatus']>
  compact?: boolean
}

/** Inline badge for kanban cards */
export function UnionStatusBadge({ unionStatus, compact }: UnionStatusBadgeProps) {
  const { theme } = useThemeContext()

  if (compact) {
    return (
      <Stack
        style={{
          backgroundColor: unionStatus.isUnionMember
            ? `${colors.blue[500]}20`
            : `${colors.gray[400]}20`,
          borderRadius: 4,
          paddingHorizontal: 6,
          paddingVertical: 2,
        }}
      >
        <Text
          style={{
            fontSize: 10,
            fontWeight: '600',
            color: unionStatus.isUnionMember ? colors.blue[600] : colors.gray[500],
          }}
        >
          {unionStatus.isUnionMember ? 'Union' : 'Non-Union'}
        </Text>
      </Stack>
    )
  }

  return (
    <Card
      padding="md"
      style={{
        backgroundColor: colors.bg[theme].default,
        borderWidth: 1,
        borderColor: unionStatus.isUnionMember
          ? `${colors.blue[500]}40`
          : colors.border[theme].default,
      }}
    >
      <Stack gap={12}>
        <Row gap={8} align="center">
          <Stack
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: unionStatus.isUnionMember
                ? `${colors.blue[500]}20`
                : `${colors.gray[400]}20`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <HardHat
              size={18}
              color={unionStatus.isUnionMember ? colors.blue[500] : colors.gray[500]}
            />
          </Stack>
          <Stack style={{ flex: 1 }}>
            <Text style={{ color: colors.text[theme].primary, fontWeight: '600' }}>
              {unionStatus.isUnionMember ? 'Union Member' : 'Non-Union'}
            </Text>
            {unionStatus.unionName && (
              <Text style={{ color: colors.text[theme].secondary, fontSize: 13 }}>
                {unionStatus.unionName}
                {unionStatus.localNumber ? ` Local ${unionStatus.localNumber}` : ''}
              </Text>
            )}
          </Stack>
        </Row>

        {unionStatus.isUnionMember && (
          <Stack gap={8}>
            {/* Membership ID */}
            {unionStatus.membershipId && (
              <Row gap={8} align="center">
                <Shield size={14} color={colors.icon[theme].default} />
                <Text style={{ color: colors.text[theme].secondary, fontSize: 13 }}>
                  Member ID: {unionStatus.membershipId}
                </Text>
              </Row>
            )}

            {/* Journeyman Status */}
            {unionStatus.journeymanStatus && (
              <Row gap={8} align="center">
                <Award size={14} color={colors.icon[theme].default} />
                <Text style={{ color: colors.text[theme].secondary, fontSize: 13 }}>
                  {unionStatus.journeymanStatus.charAt(0).toUpperCase() +
                    unionStatus.journeymanStatus.slice(1)}
                </Text>
                {unionStatus.journeymanStatus === 'journeyman' && (
                  <Stack
                    style={{
                      backgroundColor: `${colors.success[500]}20`,
                      borderRadius: 4,
                      paddingHorizontal: 6,
                      paddingVertical: 1,
                    }}
                  >
                    <Text style={{ fontSize: 10, color: colors.success[500] }}>Certified</Text>
                  </Stack>
                )}
                {unionStatus.journeymanStatus === 'master' && (
                  <Stack
                    style={{
                      backgroundColor: `${colors.warning[500]}20`,
                      borderRadius: 4,
                      paddingHorizontal: 6,
                      paddingVertical: 1,
                    }}
                  >
                    <Text style={{ fontSize: 10, color: colors.warning[500] }}>Master</Text>
                  </Stack>
                )}
              </Row>
            )}

            {/* Prevailing Wage */}
            {unionStatus.prevailingWageEligible !== undefined && (
              <Row gap={8} align="center">
                <Stack
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    backgroundColor: unionStatus.prevailingWageEligible
                      ? colors.success[500]
                      : colors.gray[400],
                  }}
                />
                <Text style={{ color: colors.text[theme].secondary, fontSize: 13 }}>
                  Prevailing wage{' '}
                  {unionStatus.prevailingWageEligible ? 'eligible' : 'not eligible'}
                </Text>
              </Row>
            )}
          </Stack>
        )}
      </Stack>
    </Card>
  )
}
