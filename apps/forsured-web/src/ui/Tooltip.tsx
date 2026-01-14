/**
 * Tooltip wrapper - migrated from Tamagui to Beyond UI
 * Provides backwards-compatible API for existing code
 */
import React, { ReactNode } from 'react';
import { Tooltip as BeyondTooltip, type TooltipArrowPosition } from '@unicornlove/beyond-ui';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  content: ReactNode;
  position?: TooltipPosition;
  children: ReactNode;
  delay?: number;
  className?: string;
}

// Map our position prop to Beyond UI's arrowPosition prop
// Arrow position is opposite to where tooltip appears (tooltip at top = arrow pointing down)
const positionToArrowMap: Record<TooltipPosition, TooltipArrowPosition> = {
  top: 'down-center',    // Tooltip at top, arrow points down
  bottom: 'up-center',   // Tooltip at bottom, arrow points up
  left: 'right',         // Tooltip at left, arrow points right
  right: 'left',         // Tooltip at right, arrow points left
};

export default function Tooltip({
  content,
  position = 'top',
  children,
  delay = 200,
  className = '',
}: TooltipProps) {
  return (
    <BeyondTooltip
      content={content}
      arrowPosition={positionToArrowMap[position]}
      delay={delay}
    >
      {children}
    </BeyondTooltip>
  );
}
