/**
 * Textarea - Textarea component using Beyond UI
 * Migrated from Tamagui to Beyond UI
 */
import React, { forwardRef, TextareaHTMLAttributes } from 'react';
import { Stack, Row, Text } from '@unicornlove/beyond-ui';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      rows = 4,
      ...props
    },
    ref
  ) => {
    // Filter out textAlign from props to prevent React warnings
    const {
      textAlign: _textAlign,
      ...cleanProps
    } = props as TextareaHTMLAttributes<HTMLTextAreaElement> & { textAlign?: string };

    return (
      <Stack gap={6} style={{ width: fullWidth ? '100%' : undefined }}>
        {label && (
          <Row gap={4} alignItems="center">
            <Text size="sm" weight="medium">
              {label}
            </Text>
            {props.required && (
              <Text size="sm" style={{ color: 'var(--color-red-9)' }}>
                *
              </Text>
            )}
          </Row>
        )}
        <textarea
          ref={ref}
          rows={rows}
          style={{
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: error ? 'var(--color-red-8)' : 'var(--color-border)',
            borderRadius: 8,
            paddingLeft: 12,
            paddingRight: 12,
            paddingTop: 8,
            paddingBottom: 8,
            fontSize: 14,
            backgroundColor: 'var(--color-background)',
            color: 'var(--color-text)',
            minHeight: 100,
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'inherit',
          }}
          {...cleanProps}
        />
        {error && (
          <Text size="xs" style={{ color: 'var(--color-red-9)' }}>
            {error}
          </Text>
        )}
        {helperText && !error && (
          <Text size="xs" muted>
            {helperText}
          </Text>
        )}
      </Stack>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
