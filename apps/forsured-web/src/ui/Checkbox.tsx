import React, { InputHTMLAttributes, forwardRef } from 'react';
import { Check, Minus } from 'lucide-react';
import { YStack, XStack, Text, styled, useTheme } from '@unicornlove/ui';

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  indeterminate?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const CheckboxContainer = styled(YStack, {
  name: 'CheckboxContainer',
});

const CheckboxWrapper = styled(XStack, {
  name: 'CheckboxWrapper',
  alignItems: 'flex-start',
});

const CheckboxInputWrapper = styled(XStack, {
  name: 'CheckboxInputWrapper',
  alignItems: 'center',
  height: 20, // h-5
});

const CheckboxButton = styled(XStack, {
  name: 'CheckboxButton',
  borderWidth: 2,
  borderRadius: '$2',
  backgroundColor: '$background',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
  variants: {
    size: {
      sm: { width: 16, height: 16 },
      md: { width: 20, height: 20 },
      lg: { width: 24, height: 24 },
    },
    checked: {
      true: {
        backgroundColor: '$primary9',
        borderColor: '$primary9',
      },
      false: {
        borderColor: '$borderColor',
        backgroundColor: '$background',
      },
    },
    error: {
      true: {
        borderColor: '$red9',
      },
      false: {},
    },
    disabled: {
      true: {
        opacity: 0.5,
        cursor: 'not-allowed',
      },
      false: {},
    },
  } as const,
});

const CheckboxLabel = styled(Text, {
  name: 'CheckboxLabel',
  marginLeft: '$3',
  fontSize: '$2',
  cursor: 'pointer',
  fontWeight: '500',
  color: '$color11',
});

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      error,
      helperText,
      indeterminate = false,
      size = 'md',
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const checkboxId =
      id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
    const isChecked = props.checked || false;
    const theme = useTheme();

    const iconSizes = {
      sm: 12,
      md: 14,
      lg: 16,
    };

    return (
      <CheckboxContainer className={className}>
        <CheckboxWrapper>
          <CheckboxInputWrapper>
            <XStack position="relative" alignItems="center">
              <input
                ref={ref}
                id={checkboxId}
                type="checkbox"
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                {...props}
              />
              <CheckboxButton
                size={size}
                checked={isChecked}
                error={!!error}
                disabled={props.disabled}
                as="label"
                htmlFor={checkboxId}
              >
                {isChecked && !indeterminate && (
                  <Check color={theme.color1.val} size={iconSizes[size]} strokeWidth={3} />
                )}
                {indeterminate && (
                  <Minus color={theme.color1.val} size={iconSizes[size]} strokeWidth={3} />
                )}
              </CheckboxButton>
            </XStack>
          </CheckboxInputWrapper>
          {label && (
            <CheckboxLabel as="label" htmlFor={checkboxId}>
              {label}
              {props.required && <Text color="$red9" marginLeft="$1">*</Text>}
            </CheckboxLabel>
          )}
        </CheckboxWrapper>
        {error && (
          <Text fontSize="$2" color="$red9" marginTop="$1.5" marginLeft="$8">
            {error}
          </Text>
        )}
        {helperText && !error && (
          <Text fontSize="$2" color="$color9" marginTop="$1.5" marginLeft="$8">
            {helperText}
          </Text>
        )}
      </CheckboxContainer>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
