/**
 * Verify Email Page - Shows success message after magic link is sent
 * Similar to Scaffald's MagicLinkPending but simpler for web
 */
import { useSearchParams } from 'react-router-dom';
import { Stack, Row, Text, H1 } from '@scaffald/ui';
import { colors, spacing, fontSize, borderRadius, shadows } from '@scaffald/ui';
import { Mail } from 'lucide-react';

function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || 'your email address';

  return (
    <Stack
      style={{
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary[50],
        padding: spacing[16],
      }}
    >
      <Stack
        style={{
          maxWidth: 448,
          width: '100%',
          gap: spacing[32],
          padding: spacing[40],
          backgroundColor: colors.bg.light.default,
          borderRadius: borderRadius.m,
          boxShadow: shadows.l.boxShadow,
          alignItems: 'center',
        }}
      >
        {/* Success Icon */}
        <Stack
          style={{
            width: 80,
            height: 80,
            borderRadius: borderRadius.max,
            backgroundColor: colors.success[50],
            border: `2px solid ${colors.success[500]}`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Mail size={48} color={colors.success[600]} />
        </Stack>

        {/* Header */}
        <Stack style={{ gap: spacing[16], alignItems: 'center' }}>
          <H1
            style={{
              fontSize: fontSize.h3,
              fontWeight: 700,
              color: colors.text.light.primary,
              textAlign: 'center',
            }}
          >
            Check Your Email
          </H1>

          <Row style={{ gap: spacing[8], alignItems: 'center', justifyContent: 'center' }}>
            <Text
              style={{
                fontSize: fontSize.lg,
                color: colors.text.light.secondary,
                textAlign: 'center',
              }}
            >
              We sent a magic link to
            </Text>
            <Text
              style={{
                fontSize: fontSize.lg,
                fontWeight: 600,
                color: colors.text.light.primary,
              }}
            >
              {email}
            </Text>
          </Row>

          <Text
            style={{
              fontSize: fontSize.sm,
              color: colors.text.light.tertiary,
              textAlign: 'center',
              marginTop: spacing[8],
            }}
          >
            Open the link in your email to sign in. The link will expire in 1 hour.
          </Text>
        </Stack>

        {/* Instructions */}
        <Stack style={{ gap: spacing[8], alignItems: 'center', marginTop: spacing[16] }}>
          <Text
            style={{
              fontSize: fontSize.xs,
              color: colors.text.light.tertiary,
              textAlign: 'center',
            }}
          >
            Didn't receive the email? Check your spam folder or try again.
          </Text>
        </Stack>
      </Stack>
    </Stack>
  );
}

export default VerifyEmailPage;
