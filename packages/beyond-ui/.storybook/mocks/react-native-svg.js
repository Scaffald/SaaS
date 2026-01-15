// Mock for react-native-svg on web
// Converts react-native-svg components to actual HTML SVG elements for Storybook

import React from 'react'

// Main Svg component
export function Svg({ width, height, viewBox, style, children, ...props }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      style={style}
      {...props}
    >
      {children}
    </svg>
  )
}

export function Circle({ cx, cy, r, fill, stroke, strokeWidth, ...props }) {
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      {...props}
    />
  )
}

export function Ellipse({ cx, cy, rx, ry, fill, stroke, strokeWidth, ...props }) {
  return (
    <ellipse
      cx={cx}
      cy={cy}
      rx={rx}
      ry={ry}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      {...props}
    />
  )
}

export function G({ transform, opacity, children, ...props }) {
  return (
    <g transform={transform} opacity={opacity} {...props}>
      {children}
    </g>
  )
}

export function Text({ x, y, fill, fontSize, fontFamily, fontWeight, textAnchor, children, ...props }) {
  return (
    <text
      x={x}
      y={y}
      fill={fill}
      fontSize={fontSize}
      fontFamily={fontFamily}
      fontWeight={fontWeight}
      textAnchor={textAnchor}
      {...props}
    >
      {children}
    </text>
  )
}

export function TSpan({ x, y, dx, dy, children, ...props }) {
  return (
    <tspan x={x} y={y} dx={dx} dy={dy} {...props}>
      {children}
    </tspan>
  )
}

export function TextPath({ href, startOffset, children, ...props }) {
  return (
    <textPath href={href} startOffset={startOffset} {...props}>
      {children}
    </textPath>
  )
}

export function Path({ d, fill, stroke, strokeWidth, strokeLinecap, strokeLinejoin, fillRule, ...props }) {
  return (
    <path
      d={d}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap={strokeLinecap}
      strokeLinejoin={strokeLinejoin}
      fillRule={fillRule}
      {...props}
    />
  )
}

export function Polygon({ points, fill, stroke, strokeWidth, ...props }) {
  return (
    <polygon
      points={points}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      {...props}
    />
  )
}

export function Polyline({ points, fill, stroke, strokeWidth, strokeLinecap, strokeLinejoin, ...props }) {
  return (
    <polyline
      points={points}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap={strokeLinecap}
      strokeLinejoin={strokeLinejoin}
      {...props}
    />
  )
}

export function Line({ x1, y1, x2, y2, stroke, strokeWidth, strokeLinecap, ...props }) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap={strokeLinecap}
      {...props}
    />
  )
}

export function Rect({ x, y, width, height, rx, ry, fill, stroke, strokeWidth, ...props }) {
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={rx}
      ry={ry}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      {...props}
    />
  )
}

export function Use({ href, x, y, width, height, ...props }) {
  return (
    <use href={href} x={x} y={y} width={width} height={height} {...props} />
  )
}

export function Image({ x, y, width, height, href, preserveAspectRatio, ...props }) {
  return (
    <image
      x={x}
      y={y}
      width={width}
      height={height}
      href={href}
      preserveAspectRatio={preserveAspectRatio}
      {...props}
    />
  )
}

export function Symbol({ id, viewBox, children, ...props }) {
  return (
    <symbol id={id} viewBox={viewBox} {...props}>
      {children}
    </symbol>
  )
}

export function Defs({ children, ...props }) {
  return <defs {...props}>{children}</defs>
}

export function LinearGradient({ id, x1, y1, x2, y2, gradientUnits, children, ...props }) {
  return (
    <linearGradient
      id={id}
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      gradientUnits={gradientUnits}
      {...props}
    >
      {children}
    </linearGradient>
  )
}

export function RadialGradient({ id, cx, cy, r, fx, fy, gradientUnits, children, ...props }) {
  return (
    <radialGradient
      id={id}
      cx={cx}
      cy={cy}
      r={r}
      fx={fx}
      fy={fy}
      gradientUnits={gradientUnits}
      {...props}
    >
      {children}
    </radialGradient>
  )
}

export function Stop({ offset, stopColor, stopOpacity, ...props }) {
  return (
    <stop
      offset={offset}
      stopColor={stopColor}
      stopOpacity={stopOpacity}
      {...props}
    />
  )
}

export function ClipPath({ id, children, ...props }) {
  return (
    <clipPath id={id} {...props}>
      {children}
    </clipPath>
  )
}

export function Pattern({ id, x, y, width, height, patternUnits, patternContentUnits, children, ...props }) {
  return (
    <pattern
      id={id}
      x={x}
      y={y}
      width={width}
      height={height}
      patternUnits={patternUnits}
      patternContentUnits={patternContentUnits}
      {...props}
    >
      {children}
    </pattern>
  )
}

export function Mask({ id, x, y, width, height, children, ...props }) {
  return (
    <mask id={id} x={x} y={y} width={width} height={height} {...props}>
      {children}
    </mask>
  )
}

export function Marker({ id, viewBox, refX, refY, markerWidth, markerHeight, orient, children, ...props }) {
  return (
    <marker
      id={id}
      viewBox={viewBox}
      refX={refX}
      refY={refY}
      markerWidth={markerWidth}
      markerHeight={markerHeight}
      orient={orient}
      {...props}
    >
      {children}
    </marker>
  )
}

export function ForeignObject({ x, y, width, height, children, ...props }) {
  return (
    <foreignObject x={x} y={y} width={width} height={height} {...props}>
      {children}
    </foreignObject>
  )
}

// Default export
export default Svg
