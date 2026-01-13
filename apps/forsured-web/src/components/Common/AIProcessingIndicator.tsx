/**
 * AIProcessingIndicator - AI processing indicator using Beyond UI
 * Migrated from Tamagui to Beyond UI
 */
import { Row, Stack, Text, Spinner } from '@unicornlove/beyond-ui';
import { CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

export type AIProcessingState = 'analyzing' | 'processing' | 'complete' | 'error';

interface AIProcessingIndicatorProps {
  state: AIProcessingState;
  message?: string;
  progress?: number; // 0-100
}

const stateStyles = {
  analyzing: {
    backgroundColor: 'var(--color-blue-2)',
    borderColor: 'var(--color-blue-6)',
  },
  processing: {
    backgroundColor: 'var(--color-blue-2)',
    borderColor: 'var(--color-blue-6)',
  },
  complete: {
    backgroundColor: 'var(--color-green-2)',
    borderColor: 'var(--color-green-6)',
  },
  error: {
    backgroundColor: 'var(--color-red-2)',
    borderColor: 'var(--color-red-6)',
  },
};

const textColors = {
  analyzing: 'var(--color-blue-11)',
  processing: 'var(--color-blue-11)',
  complete: 'var(--color-green-11)',
  error: 'var(--color-red-11)',
};

export default function AIProcessingIndicator({
  state,
  message,
  progress,
}: AIProcessingIndicatorProps) {
  const getDefaultMessage = () => {
    switch (state) {
      case 'analyzing':
        return 'AI analyzing...';
      case 'processing':
        return 'AI processing...';
      case 'complete':
        return 'Analysis complete';
      case 'error':
        return 'Analysis failed, please retry';
    }
  };

  const displayMessage = message || getDefaultMessage();

  return (
    <Stack
      padding={16}
      style={{
        borderRadius: 12,
        border: '1px solid',
        ...stateStyles[state],
      }}
    >
      <Row alignItems="center" gap={12}>
        {state === 'analyzing' && (
          <Stack style={{ position: 'relative', width: 20, height: 20 }}>
            <Sparkles size={20} />
            <Stack style={{ position: 'absolute', top: 0, left: 0 }}>
              <Spinner size="sm" />
            </Stack>
          </Stack>
        )}
        {state === 'processing' && <Spinner size="sm" />}
        {state === 'complete' && <CheckCircle size={20} />}
        {state === 'error' && <AlertCircle size={20} />}

        <Stack flex={1} gap={8}>
          <Text
            size="sm"
            weight="medium"
            style={{ color: textColors[state] }}
          >
            {displayMessage}
          </Text>
          {state === 'processing' && progress !== undefined && (
            <Stack
              style={{
                width: '100%',
                backgroundColor: 'var(--color-background-hover)',
                borderRadius: 20,
                height: 8,
                overflow: 'hidden',
              }}
            >
              <Stack
                style={{
                  height: 8,
                  backgroundColor: 'var(--color-blue-9)',
                  borderRadius: 20,
                  width: `${progress}%`,
                  transition: 'width 300ms',
                }}
              />
            </Stack>
          )}
        </Stack>
      </Row>
    </Stack>
  );
}
