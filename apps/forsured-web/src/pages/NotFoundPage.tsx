/**
 * NotFoundPage - 404 page using Tamagui
 */
import { Link } from 'react-router-dom';
import { YStack, Text } from '@unicornlove/ui';
import { Button as CoreButton } from '@unicornlove/ui';

function NotFoundPage() {
  return (
    <YStack
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100vh"
      gap="$4"
    >
      <Text fontSize="$10" fontWeight="700">
        404 - Not Found
      </Text>
      <Text fontSize="$5">
        The page you are looking for does not exist.
      </Text>
      <CoreButton asChild variant="primary">
        <Link to="/">Go to Home</Link>
      </CoreButton>
    </YStack>
  );
}

export default NotFoundPage;
