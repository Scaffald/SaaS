/**
 * React Native Linear Gradient shim for web builds using Vite
 * On web, we use CSS gradients instead of native gradient components.
 *
 * This shim is required because react-native-gifted-charts uses a runtime
 * require() to load either 'react-native-linear-gradient' or 'expo-linear-gradient'.
 */

import React from 'react';

interface LinearGradientProps {
  colors: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  locations?: number[];
  style?: React.CSSProperties;
  children?: React.ReactNode;
  // Additional props from react-native-linear-gradient
  useAngle?: boolean;
  angle?: number;
  angleCenter?: { x: number; y: number };
}

export const LinearGradient: React.FC<LinearGradientProps> = ({
  colors,
  start = { x: 0, y: 0 },
  end = { x: 0, y: 1 },
  locations,
  style,
  children,
  useAngle,
  angle,
}) => {
  // Calculate angle from start/end points or use provided angle
  let gradientAngle: number;
  if (useAngle && angle !== undefined) {
    gradientAngle = angle;
  } else {
    gradientAngle = Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI) + 90;
  }

  // Build CSS gradient stops
  const colorStops = colors
    .map((color, index) => {
      const position = locations?.[index] ?? (index / (colors.length - 1)) * 100;
      return `${color} ${typeof position === 'number' && position <= 1 ? position * 100 : position}%`;
    })
    .join(', ');

  const gradientStyle: React.CSSProperties = {
    ...style,
    background: `linear-gradient(${gradientAngle}deg, ${colorStops})`,
  };

  return <div style={gradientStyle}>{children}</div>;
};

export default LinearGradient;
