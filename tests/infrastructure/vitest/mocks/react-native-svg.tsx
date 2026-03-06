/**
 * Mock for react-native-svg in jsdom test environments.
 * Renders SVG elements as actual DOM SVG elements so tests can query them.
 */
import React from 'react'

type SvgProps = React.SVGProps<SVGSVGElement> & { [key: string]: unknown }
type PathProps = React.SVGProps<SVGPathElement> & { [key: string]: unknown }
type CommonProps = { [key: string]: unknown; children?: React.ReactNode }

const Svg = ({ children, width, height, viewBox, ...rest }: SvgProps) => (
  <svg width={width} height={height} viewBox={viewBox as string} {...(rest as object)}>
    {children}
  </svg>
)

const Path = (props: PathProps) => <path {...(props as object)} />
const Rect = (props: CommonProps) => <rect {...(props as object)} />
const Circle = (props: CommonProps) => <circle {...(props as object)} />
const Ellipse = (props: CommonProps) => <ellipse {...(props as object)} />
const Line = (props: CommonProps) => <line {...(props as object)} />
const Polygon = (props: CommonProps) => <polygon {...(props as object)} />
const Polyline = (props: CommonProps) => <polyline {...(props as object)} />
const G = ({ children, ...rest }: CommonProps) => <g {...(rest as object)}>{children}</g>
const Text = ({ children, ...rest }: CommonProps) => <text {...(rest as object)}>{children}</text>
const TSpan = ({ children, ...rest }: CommonProps) => <tspan {...(rest as object)}>{children}</tspan>
const Defs = ({ children }: CommonProps) => <defs>{children}</defs>
const ClipPath = ({ children, ...rest }: CommonProps) => <clipPath {...(rest as object)}>{children}</clipPath>
const LinearGradient = ({ children, ...rest }: CommonProps) => <linearGradient {...(rest as object)}>{children}</linearGradient>
const RadialGradient = ({ children, ...rest }: CommonProps) => <radialGradient {...(rest as object)}>{children}</radialGradient>
const Stop = (props: CommonProps) => <stop {...(props as object)} />
const Mask = ({ children, ...rest }: CommonProps) => <mask {...(rest as object)}>{children}</mask>
const Use = (props: CommonProps) => <use {...(props as object)} />
const Symbol = ({ children, ...rest }: CommonProps) => <symbol {...(rest as object)}>{children}</symbol>
const Image = (props: CommonProps) => <image {...(props as object)} />
const ForeignObject = ({ children, ...rest }: CommonProps) => <foreignObject {...(rest as object)}>{children}</foreignObject>
const Marker = ({ children, ...rest }: CommonProps) => <marker {...(rest as object)}>{children}</marker>
const Pattern = ({ children, ...rest }: CommonProps) => <pattern {...(rest as object)}>{children}</pattern>
const TextPath = ({ children, ...rest }: CommonProps) => <textPath {...(rest as object)}>{children}</textPath>

export default Svg
export {
  Svg,
  Path,
  Rect,
  Circle,
  Ellipse,
  Line,
  Polygon,
  Polyline,
  G,
  Text,
  TSpan,
  Defs,
  ClipPath,
  LinearGradient,
  RadialGradient,
  Stop,
  Mask,
  Use,
  Symbol,
  Image,
  ForeignObject,
  Marker,
  Pattern,
  TextPath,
}
