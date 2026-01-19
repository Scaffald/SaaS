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
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100vw',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        backgroundColor: 'var(--color-background)',
      }}
    >
      <Spinner size="lg" />
    </Stack>
  );
}

export default LoadingSpinner;
