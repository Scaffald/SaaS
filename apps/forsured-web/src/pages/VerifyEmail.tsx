/**
 * Verify Email Page - Shows success message after magic link is sent
 * Similar to Scaffald's MagicLinkPending but simpler for web
 */
import { useSearchParams } from 'react-router-dom';
import { YStack, Text, XStack } from '@unicornlove/ui';
import { Mail } from '@tamagui/lucide-icons';

function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || 'your email address';

  return (
    <YStack
      minHeight="100vh"
      alignItems="center"
      justifyContent="center"
      backgroundColor="$blue2"
      padding="$4"
    >
      <YStack
        maxWidth={448}
        width="100%"
        gap="$8"
        padding="$10"
        backgroundColor="$background"
        borderRadius="$5"
        shadowColor="$shadowColor"
        shadowRadius={20}
        shadowOffset={{ width: 0, height: 8 }}
        alignItems="center"
      >
        {/* Success Icon */}
        <YStack
          width={80}
          height={80}
          borderRadius="$12"
          backgroundColor="$green2"
          borderWidth={2}
          borderColor="$green9"
          alignItems="center"
          justifyContent="center"
        >
          <Mail size={48} color="$green10" />
        </YStack>

        {/* Header */}
        <YStack gap="$4" alignItems="center">
          <Text fontSize="$9" fontWeight="700" color="$color12" textAlign="center">
            Check Your Email
          </Text>

          <XStack gap="$2" alignItems="center" justifyContent="center">
            <Text fontSize="$4" color="$color11" textAlign="center">
              We sent a magic link to
            </Text>
            <Text fontSize="$4" fontWeight="600" color="$color12">
              {email}
            </Text>
          </XStack>

          <Text fontSize="$3" color="$color10" textAlign="center" marginTop="$2">
            Open the link in your email to sign in. The link will expire in 1 hour.
          </Text>
        </YStack>

        {/* Instructions */}
        <YStack gap="$2" alignItems="center" marginTop="$4">
          <Text fontSize="$2" color="$color10" textAlign="center">
            Didn't receive the email? Check your spam folder or try again.
          </Text>
        </YStack>
      </YStack>
    </YStack>
  );
}

export default VerifyEmailPage;

