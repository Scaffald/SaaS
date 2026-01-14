/**
 * LoadingSpinner - Loading spinner using Beyond UI
 * Migrated from Tamagui to Beyond UI
 */
import { Stack, Spinner } from '@unicornlove/beyond-ui';

/**
 * Full-screen loading spinner
 */
function LoadingSpinner() {
  return (
    <Stack
      flex={1}
      alignItems="center"
      justifyContent="center"
      style={{ minHeight: '100vh' }}
    >
      <Spinner size="lg" />
    </Stack>
  );
}

export default LoadingSpinner;
