import React, { InputHTMLAttributes, forwardRef } from 'react';
import { YStack, XStack, Text, styled } from '@unicornlove/ui';

export interface RadioProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
}

const RadioContainer = styled(YStack, {
  name: 'RadioContainer',
});

const RadioWrapper = styled(XStack, {
  name: 'RadioWrapper',
  alignItems: 'flex-start',
});

const RadioInputWrapper = styled(XStack, {
  name: 'RadioInputWrapper',
  alignItems: 'center',
  height: 20, // h-5
});

const RadioButton = styled(XStack, {
  name: 'RadioButton',
  borderWidth: 2,
  borderRadius: '$full',
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
        borderColor: '$primary9',
      },
      false: {
        borderColor: '$borderColor',
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

const RadioDot = styled(XStack, {
  name: 'RadioDot',
  borderRadius: '$full',
  backgroundColor: '$primary9',
  variants: {
    size: {
      sm: { width: 8, height: 8 },
      md: { width: 10, height: 10 },
      lg: { width: 12, height: 12 },
    },
    checked: {
      true: {
        scale: 1,
      },
      false: {
        scale: 0,
      },
    },
  } as const,
  transition: 'transform 0.2s ease-in-out',
});

const RadioLabel = styled(Text, {
  name: 'RadioLabel',
  marginLeft: '$3',
  fontSize: '$2',
  cursor: 'pointer',
  fontWeight: '500',
  color: '$color11',
});

const Radio = forwardRef<HTMLInputElement, RadioProps>(
  (
    { label, error, helperText, size = 'md', className = '', id, ...props },
    ref
  ) => {
    const radioId = id || `radio-${Math.random().toString(36).substr(2, 9)}`;
    const isChecked = props.checked || false;

    return (
      <RadioContainer className={className}>
        <RadioWrapper>
          <RadioInputWrapper>
            <XStack position="relative" alignItems="center">
              <input
                ref={ref}
                id={radioId}
                type="radio"
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                {...props}
              />
              <RadioButton
                size={size}
                checked={isChecked}
                error={!!error}
                disabled={props.disabled}
                as="label"
                htmlFor={radioId}
              >
                <RadioDot size={size} checked={isChecked} />
              </RadioButton>
            </XStack>
          </RadioInputWrapper>
          {label && (
            <RadioLabel as="label" htmlFor={radioId}>
              {label}
              {props.required && <Text color="$red9" marginLeft="$1">*</Text>}
            </RadioLabel>
          )}
        </RadioWrapper>
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
      </RadioContainer>
    );
  }
);

Radio.displayName = 'Radio';

export default Radio;
