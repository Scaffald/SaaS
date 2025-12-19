/**
 * UnauthorizedPage - 403 page using Tamagui
 */
import { Link } from 'react-router-dom';
import { YStack, Text } from '@unicornlove/ui';
import { Button as CoreButton } from '@unicornlove/ui';

function UnauthorizedPage() {
  return (
    <YStack
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100vh"
      gap="$4"
    >
      <Text fontSize="$10" fontWeight="700">
        403 - Unauthorized
      </Text>
      <Text fontSize="$5">
        You are not authorized to view this page.
      </Text>
      <CoreButton asChild variant="primary">
        <Link to="/">Go to Home</Link>
      </CoreButton>
    </YStack>
  );
}

export default UnauthorizedPage;
