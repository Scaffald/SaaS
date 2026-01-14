/**
 * ValidationFeedback Component (REQ-167)
 * Displays real-time validation feedback for OCR fields
 */

import React from 'react';
import { Stack, Row, Text, Card } from '@unicornlove/beyond-ui';
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
        style={{
          borderRadius: '8px',
          backgroundColor: 'var(--color-green-2)',
          padding: '16px',
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: 'var(--color-green-6)',
        }}
        role="alert"
      >
        <Row>
          <CheckCircle size={20} color="var(--color-green-10)" aria-hidden="true" />
          <Stack style={{ marginLeft: '12px' }}>
            <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-green-12)' }}>
              All fields are valid
            </Text>
            <Text style={{ fontSize: '14px', color: 'var(--color-green-11)', marginTop: '4px' }}>
              You can save these changes and trigger compliance re-evaluation.
            </Text>
          </Stack>
        </Row>
      </Card>
    );
  }

  return (
    <Stack gap="md">
      {/* Errors Section */}
      {errors.length > 0 && (
        <Card
          data-testid="error-section"
          style={{
            borderRadius: '8px',
            backgroundColor: 'var(--color-red-2)',
            padding: '16px',
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: 'var(--color-red-6)',
          }}
          role="alert"
          aria-live="polite"
        >
          <Row>
            <AlertCircle size={20} color="var(--color-red-10)" aria-hidden="true" />
            <Stack style={{ flex: 1, marginLeft: '12px' }}>
              <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-red-12)' }}>
                {errors.length} {errors.length === 1 ? 'error' : 'errors'} found
              </Text>
              <Stack style={{ marginTop: '8px', fontSize: '14px', color: 'var(--color-red-11)', gap: '4px' }}>
                {errors.map((error, index) => (
                  <Text key={`${error.field}-${index}`}>• {error.message}</Text>
                ))}
              </Stack>
            </Stack>
          </Row>
        </Card>
      )}

      {/* Warnings Section */}
      {warnings.length > 0 && (
        <Card
          data-testid="warning-section"
          style={{
            borderRadius: '8px',
            backgroundColor: 'var(--color-yellow-2)',
            padding: '16px',
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: 'var(--color-yellow-6)',
          }}
          role="alert"
          aria-live="polite"
        >
          <Row>
            <AlertTriangle size={20} color="var(--color-yellow-10)" aria-hidden="true" />
            <Stack style={{ flex: 1, marginLeft: '12px' }}>
              <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-yellow-12)' }}>
                {warnings.length} {warnings.length === 1 ? 'warning' : 'warnings'}
              </Text>
              <Stack style={{ marginTop: '8px', fontSize: '14px', color: 'var(--color-yellow-11)', gap: '4px' }}>
                {warnings.map((warning, index) => (
                  <Text key={`${warning.field}-${index}`}>• {warning.message}</Text>
                ))}
              </Stack>
            </Stack>
          </Row>
        </Card>
      )}
    </Stack>
  );
};
