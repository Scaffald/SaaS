/**
 * Expo Linear Gradient shim for web builds using Vite
 * On web, we use CSS gradients instead of native gradient components.
 */

import React from 'react';

interface LinearGradientProps {
  colors: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  locations?: number[];
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export const LinearGradient: React.FC<LinearGradientProps> = ({
  colors,
  start = { x: 0, y: 0 },
  end = { x: 0, y: 1 },
  locations,
  style,
  children,
}) => {
  // Calculate angle from start/end points
  const angle = Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI) + 90;

  // Build CSS gradient stops
  const colorStops = colors
    .map((color, index) => {
      const position = locations?.[index] ?? (index / (colors.length - 1)) * 100;
      return `${color} ${position * 100}%`;
    })
    .join(', ');

  const gradientStyle: React.CSSProperties = {
    ...style,
    background: `linear-gradient(${angle}deg, ${colorStops})`,
  };

  return <div style={gradientStyle}>{children}</div>;
};

export default LinearGradient;
