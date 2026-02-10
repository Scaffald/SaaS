/**
 * OAuth Callback Page - Using Beyond UI
 * OAuth 2.0 + RBAC Authentication System
 */
import type React from 'react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Stack, Row, Text, Button } from '@unicornlove/beyond-ui'
import { CheckCircle, AlertTriangle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import type { AuthError } from '../../lib/auth/types'

const pageContainerStyle: React.CSSProperties = {
  minHeight: '100vh',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'var(--color-background)',
}

const cardContainerStyle: React.CSSProperties = {
  maxWidth: '448px',
  width: '100%',
  gap: '32px',
  padding: '40px',
  backgroundColor: 'var(--color-backgroundHover)',
  borderRadius: '12px',
  boxShadow: '0 10px 20px var(--color-shadow)',
}

const spinnerContainerStyle: React.CSSProperties = {
  position: 'relative',
  width: '64px',
  height: '64px',
}

export const CallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { handleCallback } = useAuth()
  const [error, setError] = useState<AuthError | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    processCallback()
  }, [])

  const processCallback = async () => {
    try {
      const code = searchParams.get('code')
      const state = searchParams.get('state')

      if (!code || !state) {
        throw new Error('Missing authorization code or state parameter')
      }

      await handleCallback(code, state)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      console.error('Callback processing failed:', err)
      setError(err as AuthError)
      setIsProcessing(false)
    }
  }

  const handleRetry = () => {
    navigate('/login', { replace: true })
  }

  if (isProcessing && !error) {
    return (
      <Stack style={pageContainerStyle}>
        <Stack style={{ ...cardContainerStyle, textAlign: 'center' }}>
          {/* Loading Animation */}
          <Stack style={{ alignItems: 'center', gap: '24px' }}>
            <Stack style={spinnerContainerStyle}>
              <Stack
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '24px',
                  borderWidth: '4px',
                  borderStyle: 'solid',
                  borderColor: 'var(--color-blue6)',
                }}
              />
              <Stack
                className="animate-spin"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '64px',
                  height: '64px',
                  borderRadius: '24px',
                  borderWidth: '4px',
                  borderStyle: 'solid',
                  borderColor: 'var(--color-blue9)',
                  borderTopColor: 'transparent',
                }}
              />
            </Stack>
            <Text style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-color12)' }}>
              Completing Sign In
            </Text>
            <Text style={{ fontSize: '12px', color: 'var(--color-color10)' }}>
              Please wait while we authenticate your account...
            </Text>
          </Stack>

          {/* Progress Steps */}
          <Stack style={{ gap: '12px', marginTop: '32px', alignItems: 'flex-start' }}>
            <Row style={{ alignItems: 'center', gap: '12px' }}>
              <CheckCircle size={20} color="currentColor" />
              <Text style={{ fontSize: '12px', color: 'var(--color-color11)' }}>
                Authenticated with Scaffald
              </Text>
            </Row>
            <Row style={{ alignItems: 'center', gap: '12px' }}>
              <div
                className="animate-pulse"
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-blue9)',
                }}
              />
              <Text style={{ fontSize: '12px', color: 'var(--color-color11)' }}>
                Exchanging authorization code
              </Text>
            </Row>
            <Row style={{ alignItems: 'center', gap: '12px', opacity: 0.5 }}>
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  borderWidth: '2px',
                  borderStyle: 'solid',
                  borderColor: 'var(--color-border)',
                }}
              />
              <Text style={{ fontSize: '12px', color: 'var(--color-color10)' }}>
                Creating secure session
              </Text>
            </Row>
          </Stack>
        </Stack>
      </Stack>
    )
  }

  if (error) {
    return (
      <Stack style={pageContainerStyle}>
        <Stack style={cardContainerStyle}>
          {/* Error Icon */}
          <Stack style={{ alignItems: 'center', gap: '24px' }}>
            <Stack
              style={{
                width: '64px',
                height: '64px',
                backgroundColor: 'var(--color-red3)',
                borderRadius: '24px',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={40} color="currentColor" />
            </Stack>
            <Text style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-color12)' }}>
              Authentication Failed
            </Text>
            <Text style={{ fontSize: '12px', color: 'var(--color-color10)' }}>
              We encountered an error while signing you in
            </Text>
          </Stack>

          {/* Error Details */}
          <Stack
            style={{
              backgroundColor: 'var(--color-red2)',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'var(--color-red6)',
              borderRadius: '8px',
              padding: '16px',
              gap: '4px',
            }}
          >
            <Text style={{ fontSize: '12px', color: 'var(--color-red11)' }}>
              <Text style={{ fontWeight: 600 }}>Error:</Text> {error.message}
            </Text>
            {error.code && (
              <Text style={{ fontSize: '10px', color: 'var(--color-red10)', marginTop: '4px' }}>
                Code: {error.code}
              </Text>
            )}
          </Stack>

          {/* Actions */}
          <Stack style={{ gap: '12px' }}>
            <Button onPress={handleRetry} variant="primary" fullWidth>
              Try Again
            </Button>
            <Button onPress={() => navigate('/')} variant="outlined" fullWidth>
              Go Home
            </Button>
          </Stack>
        </Stack>
      </Stack>
    )
  }

  return null
}
