import React, { ReactNode } from 'react';
import { YStack, XStack, Text, styled } from '@unicornlove/ui';

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  label?: ReactNode;
  className?: string;
}

const VerticalDivider = styled(YStack, {
  name: 'VerticalDivider',
  display: 'inline-block',
  height: '100%',
  width: 1, // w-px
  backgroundColor: '$borderColor',
});

const HorizontalDivider = styled(YStack, {
  name: 'HorizontalDivider',
  borderTopWidth: 1,
  borderTopColor: '$borderColor',
});

const LabeledDividerContainer = styled(XStack, {
  name: 'LabeledDividerContainer',
  position: 'relative',
  alignItems: 'center',
});

const DividerLine = styled(YStack, {
  name: 'DividerLine',
  flex: 1,
  borderTopWidth: 1,
  borderTopColor: '$borderColor',
});

const DividerLabel = styled(Text, {
  name: 'DividerLabel',
  flexShrink: 0,
  marginHorizontal: '$4',
  fontSize: '$2',
  color: '$color9',
});

export default function Divider({
  orientation = 'horizontal',
  label,
  className = '',
}: DividerProps) {
  if (orientation === 'vertical') {
    return <VerticalDivider className={className} />;
  }

  if (label) {
    return (
      <LabeledDividerContainer className={className}>
        <DividerLine />
        <DividerLabel>{label}</DividerLabel>
        <DividerLine />
      </LabeledDividerContainer>
    );
  }

  return <HorizontalDivider as="hr" className={className} />;
}
