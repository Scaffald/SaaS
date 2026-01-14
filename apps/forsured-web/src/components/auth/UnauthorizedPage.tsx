/**
 * Unauthorized Page - Using Beyond UI
 * REQ-126: OAuth 2.0 + RBAC Authentication System
 */
import type React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Stack, Row, Text, Button, H2 } from '@unicornlove/beyond-ui'
import { colors, spacing, fontSize, borderRadius, shadows } from '@unicornlove/beyond-ui'
import { Lock } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'

const pageContainerStyle: React.CSSProperties = {
  minHeight: '100vh',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: colors.bg.light.default,
}

const cardContainerStyle: React.CSSProperties = {
  maxWidth: '448px',
  width: '100%',
  gap: spacing[32],
  padding: spacing[40],
  backgroundColor: colors.bg.light.hover,
  borderRadius: borderRadius.l,
  boxShadow: shadows.l.boxShadow,
}

const iconContainerStyle: React.CSSProperties = {
  width: 64,
  height: 64,
  backgroundColor: colors.warning[100],
  borderRadius: borderRadius.max,
  alignItems: 'center',
  justifyContent: 'center',
}

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile, logout } = useAuth()
  const { currentRole } = usePermissions()

  const reason = (location.state as any)?.reason || 'insufficient_permissions'
  const from = (location.state as any)?.from?.pathname || '/'

  const handleGoBack = () => {
    navigate(-1)
  }

  const handleGoToDashboard = () => {
    navigate('/dashboard')
  }

  const handleSwitchAccount = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <Stack style={pageContainerStyle}>
      <Stack style={cardContainerStyle}>
        {/* Icon */}
        <Stack style={{ alignItems: 'center', gap: spacing[24] }}>
          <Stack style={iconContainerStyle}>
            <Lock size={40} color={colors.warning[600]} />
          </Stack>
          <H2 style={{ fontSize: fontSize.h4, fontWeight: 700, color: colors.text.light.primary }}>
            Access Denied
          </H2>
          <Text style={{ fontSize: fontSize.xs, color: colors.text.light.tertiary, textAlign: 'center' }}>
            {reason === 'insufficient_role'
              ? "You don't have the required role to access this page"
              : "You don't have permission to access this resource"}
          </Text>
        </Stack>

        {/* User Info */}
        {user && (
          <Stack
            style={{
              backgroundColor: colors.primary[50],
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: colors.primary[300],
              borderRadius: borderRadius.s,
              padding: spacing[16],
              gap: spacing[12],
            }}
          >
            <Row style={{ gap: spacing[12] }}>
              <Stack style={{ flexShrink: 0 }}>
                <Text style={{ fontSize: fontSize.md, color: colors.primary[500] }}>
                  👤
                </Text>
              </Stack>
              <Stack style={{ flex: 1, gap: spacing[4] }}>
                <Text style={{ fontSize: fontSize.xs, color: colors.primary[700] }}>
                  <Text style={{ fontWeight: 600 }}>Current User:</Text> {user.email}
                </Text>
                <Text style={{ fontSize: fontSize.xs, color: colors.primary[700], marginTop: spacing[4] }}>
                  <Text style={{ fontWeight: 600 }}>Role:</Text>{' '}
                  <Text style={{ textTransform: 'capitalize' }}>{currentRole || profile?.user_type || 'Unknown'}</Text>
                </Text>
              </Stack>
            </Row>
          </Stack>
        )}

        {/* Attempted Path */}
        {from && from !== '/' && (
          <Stack
            style={{
              backgroundColor: colors.bg.light.hover,
              borderRadius: borderRadius.s,
              padding: spacing[16],
              gap: spacing[4],
            }}
          >
            <Text style={{ fontSize: fontSize.xs, color: colors.text.light.tertiary }}>
              Attempted to access:
            </Text>
            <Text
              style={{
                fontSize: fontSize.xs,
                color: colors.text.light.secondary,
                fontFamily: 'monospace',
                marginTop: spacing[4],
              }}
            >
              {from}
            </Text>
          </Stack>
        )}

        {/* Actions */}
        <Stack style={{ gap: spacing[12] }}>
          <Button onPress={handleGoToDashboard} variant="filled" color="primary" fullWidth>
            Go to Dashboard
          </Button>
          <Button onPress={handleGoBack} variant="outline" color="gray" fullWidth>
            Go Back
          </Button>
          <Button onPress={handleSwitchAccount} variant="outline" color="gray" fullWidth>
            Switch Account
          </Button>
        </Stack>

        {/* Contact Support */}
        <Stack style={{ marginTop: spacing[24], alignItems: 'center' }}>
          <Text style={{ fontSize: fontSize.xs, color: colors.text.light.tertiary, textAlign: 'center' }}>
            If you believe this is an error, please{' '}
            <a
              href="mailto:support@forsured.com"
              style={{ color: colors.primary[500], cursor: 'pointer' }}
            >
              contact support
            </a>
          </Text>
        </Stack>
      </Stack>
    </Stack>
  )
}
