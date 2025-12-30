/**
 * Textarea - Tamagui-based textarea component
 */
import React, { forwardRef, TextareaHTMLAttributes } from 'react';
import { YStack, XStack, Text, styled } from '@unicornlove/ui';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

const StyledTextarea = styled('textarea', {
  name: 'Textarea',
  borderWidth: 1,
  borderColor: '$borderColor',
  borderRadius: '$3',
  paddingHorizontal: '$3',
  paddingVertical: '$2',
  fontSize: '$4',
  backgroundColor: '$background',
  color: '$color11',
  minHeight: 100,
  
  focusStyle: {
    borderColor: '$blue7',
    outlineColor: '$blue7',
    outlineWidth: 2,
    outlineStyle: 'solid',
  },
  
  hoverStyle: {
    borderColor: '$borderColorHover',
  },
});

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
    // If textAlign is needed, it should be passed via style prop
    const {
      textAlign: _textAlign,
      ...cleanProps
    } = props as TextareaHTMLAttributes<HTMLTextAreaElement> & { textAlign?: string };
    
    return (
      <YStack gap="$1.5" width={fullWidth ? '100%' : undefined}>
        {label && (
          <XStack gap="$1" alignItems="center">
            <Text fontSize="$3" fontWeight="500" color="$color11">
              {label}
            </Text>
            {props.required && (
              <Text fontSize="$3" color="$red9">
                *
              </Text>
            )}
          </XStack>
        )}
        <StyledTextarea
          ref={ref}
          rows={rows}
          borderColor={error ? '$red8' : '$borderColor'}
          disabled={props.disabled}
          {...cleanProps}
        />
        {error && (
          <Text fontSize="$2" color="$red9">
            {error}
          </Text>
        )}
        {helperText && !error && (
          <Text fontSize="$2" color="$color10">
            {helperText}
          </Text>
        )}
      </YStack>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
