import React, { InputHTMLAttributes, forwardRef } from 'react';
import { YStack, XStack, Text, styled } from '@unicornlove/ui';

export interface SwitchProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SwitchContainer = styled(YStack, {
  name: 'SwitchContainer',
});

const SwitchWrapper = styled(XStack, {
  name: 'SwitchWrapper',
  alignItems: 'center',
  justifyContent: 'space-between',
});

const SwitchInputWrapper = styled(XStack, {
  name: 'SwitchInputWrapper',
  alignItems: 'center',
});

const SwitchTrack = styled(XStack, {
  name: 'SwitchTrack',
  backgroundColor: '$gray7',
  borderRadius: '$full',
  position: 'relative',
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
  variants: {
    size: {
      sm: { width: 36, height: 20 }, // w-9 h-5
      md: { width: 44, height: 24 }, // w-11 h-6
      lg: { width: 56, height: 28 }, // w-14 h-7
    },
    checked: {
      true: {
        backgroundColor: '$primary9',
      },
      false: {
        backgroundColor: '$gray7',
      },
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

const SwitchThumb = styled(XStack, {
  name: 'SwitchThumb',
  backgroundColor: '$color1',
  borderRadius: '$full',
  position: 'absolute',
  left: 2, // left-0.5
  top: 2, // top-0.5
  transition: 'transform 0.2s ease-in-out',
  variants: {
    size: {
      sm: { width: 16, height: 16 },
      md: { width: 20, height: 20 },
      lg: { width: 24, height: 24 },
    },
  } as const,
});

const SwitchLabel = styled(Text, {
  name: 'SwitchLabel',
  marginLeft: '$3',
  fontSize: '$2',
  fontWeight: '500',
  color: '$color11',
  cursor: 'pointer',
});

const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, helperText, size = 'md', className = '', id, ...props }, ref) => {
    const switchId = id || `switch-${Math.random().toString(36).substr(2, 9)}`;
    const isChecked = props.checked ?? props.defaultChecked ?? false;

    // Calculate thumb translation based on size
    const thumbTranslation = {
      sm: 16,
      md: 20,
      lg: 28,
    };

    return (
      <SwitchContainer className={className}>
        <SwitchWrapper>
          <SwitchInputWrapper>
            <XStack position="relative" display="inline-block">
              <input
                ref={ref}
                id={switchId}
                type="checkbox"
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                {...props}
              />
              <SwitchTrack
                size={size}
                checked={isChecked}
                disabled={props.disabled}
                as="label"
                htmlFor={switchId}
              >
                <SwitchThumb
                  size={size}
                  style={{
                    transform: isChecked ? `translateX(${thumbTranslation[size]}px)` : 'translateX(0)'
                  }}
                />
              </SwitchTrack>
            </XStack>
            {label && (
              <SwitchLabel as="label" htmlFor={switchId}>
                {label}
                {props.required && <Text color="$red9" marginLeft="$1">*</Text>}
              </SwitchLabel>
            )}
          </SwitchInputWrapper>
        </SwitchWrapper>
        {helperText && (
          <Text fontSize="$2" color="$color9" marginTop="$1.5">
            {helperText}
          </Text>
        )}
      </SwitchContainer>
    );
  }
);

Switch.displayName = 'Switch';

export default Switch;
