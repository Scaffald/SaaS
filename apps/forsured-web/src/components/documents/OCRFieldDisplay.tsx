/**
 * OCRFieldDisplay Component (REQ-167)
 * Displays OCR extracted field with confidence indicator and edit capability
 */

import React from 'react';
import { Stack, Row, Text } from '@unicornlove/beyond-ui';
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

const getConfidenceProps = (level: string): React.CSSProperties => {
  if (level === 'high') {
    return {
      backgroundColor: 'var(--color-green-2)',
      color: 'var(--color-green-11)',
    };
  }
  if (level === 'medium') {
    return {
      backgroundColor: 'var(--color-yellow-2)',
      color: 'var(--color-yellow-11)',
    };
  }
  return {
    backgroundColor: 'var(--color-red-2)',
    color: 'var(--color-red-11)',
  };
};

export const OCRFieldDisplay: React.FC<OCRFieldDisplayProps> = ({
  label,
  field,
  onChange,
  onRevert,
  error,
  disabled = false,
  type = 'text',
}) => {
  const confidenceProps = getConfidenceProps(field.confidence.level);

  return (
    <Stack gap="xs">
      <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Row style={{ alignItems: 'center', gap: '8px' }}>
          <Text
            as="label"
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--color-gray-11)',
            }}
          >
            {label}
          </Text>
          {field.reviewRequired && (
            <Text
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                paddingLeft: '8px',
                paddingRight: '8px',
                paddingTop: '2px',
                paddingBottom: '2px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 500,
                backgroundColor: 'var(--color-red-2)',
                color: 'var(--color-red-11)',
              }}
            >
              Review Required
            </Text>
          )}
          {field.edited && (
            <Text
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                paddingLeft: '8px',
                paddingRight: '8px',
                paddingTop: '2px',
                paddingBottom: '2px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 500,
                backgroundColor: 'var(--color-blue-2)',
                color: 'var(--color-blue-11)',
              }}
            >
              Edited
            </Text>
          )}
        </Row>
        <Text
          data-testid="confidence-indicator"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            paddingLeft: '8px',
            paddingRight: '8px',
            paddingTop: '4px',
            paddingBottom: '4px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 500,
            ...confidenceProps,
          }}
        >
          {field.confidence.score}%
        </Text>
      </Row>

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
        <Text id={`${label}-error`} style={{ fontSize: '14px', color: 'var(--color-red-10)' }}>
          {error}
        </Text>
      )}

      {field.edited && onRevert && (
        <button
          type="button"
          onClick={onRevert}
          disabled={disabled}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            fontSize: '14px',
            color: 'var(--color-teal-9)',
            textDecoration: 'underline',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
          }}
        >
          Revert to Original
        </button>
      )}
    </Stack>
  );
};
