import React, { ReactNode } from 'react';
import { Tooltip as TamaguiTooltip } from '@unicornlove/ui';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  content: ReactNode;
  position?: TooltipPosition;
  children: ReactNode;
  delay?: number;
  className?: string;
}

// Map our position prop to Tamagui's side prop
const positionMap: Record<TooltipPosition, 'top' | 'bottom' | 'left' | 'right'> = {
  top: 'top',
  bottom: 'bottom',
  left: 'left',
  right: 'right',
};

export default function Tooltip({
  content,
  position = 'top',
  children,
  delay = 200,
  className = '',
}: TooltipProps) {
  return (
    <TamaguiTooltip
      content={content}
      side={positionMap[position]}
      delay={delay}
      className={className}
    >
      {children}
    </TamaguiTooltip>
  );
}
