/**
 * OCRFieldDisplay Component (REQ-167)
 * Displays OCR extracted field with confidence indicator and edit capability
 */

import { YStack, XStack, Text } from '@unicornlove/ui';
import Input from '../Common/Input';
import { OCRField } from '../../types/ocr.types';

interface OCRFieldDisplayProps {
  label: string;
  field: OCRField<string>;
  onChange: (value: string) => void;
  onRevert?: () => void;
  error?: string;
  disabled?: boolean;
  type?: 'text' | 'date' | 'number';
}

export const OCRFieldDisplay: React.FC<OCRFieldDisplayProps> = ({
  label,
  field,
  onChange,
  onRevert,
  error,
  disabled = false,
  type = 'text',
}) => {
  const getConfidenceProps = () => {
    if (field.confidence.level === 'high')
      return { bg: '$green2', text: '$green11', border: '$green6' };
    if (field.confidence.level === 'medium')
      return { bg: '$yellow2', text: '$yellow11', border: '$yellow6' };
    return { bg: '$red2', text: '$red11', border: '$red6' };
  };

  const confidenceProps = getConfidenceProps();

  return (
    <YStack gap="$2">
      <XStack alignItems="center" justifyContent="space-between">
        <XStack alignItems="center" gap="$2">
          <Text as="label" display="block" fontSize="$3" fontWeight="500" color="$color11">
            {label}
          </Text>
          {field.reviewRequired && (
            <Text
              display="inline-flex"
              alignItems="center"
              paddingHorizontal="$2"
              paddingVertical="$0.5"
              borderRadius="$2"
              fontSize="$1"
              fontWeight="500"
              backgroundColor="$red2"
              color="$red11"
            >
              Review Required
            </Text>
          )}
          {field.edited && (
            <Text
              display="inline-flex"
              alignItems="center"
              paddingHorizontal="$2"
              paddingVertical="$0.5"
              borderRadius="$2"
              fontSize="$1"
              fontWeight="500"
              backgroundColor="$blue2"
              color="$blue11"
            >
              Edited
            </Text>
          )}
        </XStack>
        <Text
          data-testid="confidence-indicator"
          display="inline-flex"
          alignItems="center"
          paddingHorizontal="$2"
          paddingVertical="$1"
          borderRadius="$2"
          fontSize="$1"
          fontWeight="500"
          backgroundColor={confidenceProps.bg}
          color={confidenceProps.text}
        >
          {field.confidence.score}%
        </Text>
      </XStack>

      <Input
        type={type}
        value={field.value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        error={error}
        style={{
          borderWidth: '2px',
          borderColor: error
            ? 'var(--color-red-6)'
            : `var(--color-${field.confidence.level === 'high' ? 'green' : field.confidence.level === 'medium' ? 'yellow' : 'red'}-6)`,
        }}
        aria-label={label}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${label}-error` : undefined}
      />

      {error && (
        <Text id={`${label}-error`} fontSize="$3" color="$red10">
          {error}
        </Text>
      )}

      {field.edited && onRevert && (
        <Text
          as="button"
          type="button"
          onClick={onRevert}
          fontSize="$3"
          color="$teal9"
          hoverStyle={{ color: '$teal11' }}
          textDecorationLine="underline"
          disabled={disabled}
          disabledStyle={{ opacity: 0.5, cursor: 'not-allowed' }}
          cursor="pointer"
        >
          Revert to Original
        </Text>
      )}
    </YStack>
  );
};
