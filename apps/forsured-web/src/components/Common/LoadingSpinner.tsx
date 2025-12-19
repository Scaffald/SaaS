/**
 * LoadingSpinner - CSS-based loading spinner for web compatibility
 */
import { YStack } from '@unicornlove/ui';

/**
 * Simple CSS spinner that works on web without react-native-reanimated
 */
function LoadingSpinner() {
  return (
    <YStack
      flex={1}
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: '4px solid #e5e7eb',
          borderTopColor: '#3b82f6',
          animation: 'spin 1s linear infinite',
        }}
      />
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </YStack>
  );
}

export default LoadingSpinner;
