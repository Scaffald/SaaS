/**
 * ValidationFeedback Component (REQ-167)
 * Displays real-time validation feedback for OCR fields
 */

import { YStack, XStack, Text, Card } from '@unicornlove/ui';
import { ValidationResult } from '../../types/ocr.types';
import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';

interface ValidationFeedbackProps {
  validationResult: ValidationResult | null;
}

export const ValidationFeedback: React.FC<ValidationFeedbackProps> = ({ validationResult }) => {
  if (!validationResult) {
    return null;
  }

  const { isValid, errors, warnings } = validationResult;

  // Success state: valid with no warnings
  if (isValid && warnings.length === 0) {
    return (
      <Card
        data-testid="success-section"
        borderRadius="$4"
        backgroundColor="$green2"
        padding="$4"
        borderWidth={1}
        borderColor="$green6"
        role="alert"
      >
        <XStack>
          <CheckCircle size={20} color="$green10" aria-hidden="true" />
          <YStack marginLeft="$3">
            <Text fontSize="$3" fontWeight="500" color="$green12">
              All fields are valid
            </Text>
            <Text fontSize="$3" color="$green11" marginTop="$1">
              You can save these changes and trigger compliance re-evaluation.
            </Text>
          </YStack>
        </XStack>
      </Card>
    );
  }

  return (
    <YStack gap="$4">
      {/* Errors Section */}
      {errors.length > 0 && (
        <Card
          data-testid="error-section"
          borderRadius="$4"
          backgroundColor="$red2"
          padding="$4"
          borderWidth={1}
          borderColor="$red6"
          role="alert"
          aria-live="polite"
        >
          <XStack>
            <AlertCircle size={20} color="$red10" aria-hidden="true" />
            <YStack flex={1} marginLeft="$3">
              <Text fontSize="$3" fontWeight="500" color="$red12">
                {errors.length} {errors.length === 1 ? 'error' : 'errors'} found
              </Text>
              <YStack marginTop="$2" fontSize="$3" color="$red11" gap="$1">
                {errors.map((error, index) => (
                  <Text key={`${error.field}-${index}`}>• {error.message}</Text>
                ))}
              </YStack>
            </YStack>
          </XStack>
        </Card>
      )}

      {/* Warnings Section */}
      {warnings.length > 0 && (
        <Card
          data-testid="warning-section"
          borderRadius="$4"
          backgroundColor="$yellow2"
          padding="$4"
          borderWidth={1}
          borderColor="$yellow6"
          role="alert"
          aria-live="polite"
        >
          <XStack>
            <AlertTriangle size={20} color="$yellow10" aria-hidden="true" />
            <YStack flex={1} marginLeft="$3">
              <Text fontSize="$3" fontWeight="500" color="$yellow12">
                {warnings.length} {warnings.length === 1 ? 'warning' : 'warnings'}
              </Text>
              <YStack marginTop="$2" fontSize="$3" color="$yellow11" gap="$1">
                {warnings.map((warning, index) => (
                  <Text key={`${warning.field}-${index}`}>• {warning.message}</Text>
                ))}
              </YStack>
            </YStack>
          </XStack>
        </Card>
      )}
    </YStack>
  );
};
