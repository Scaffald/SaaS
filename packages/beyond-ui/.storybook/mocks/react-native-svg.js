// Mock for react-native-svg on web
// This provides stub exports for any remaining react-native-svg imports
// The actual icons should use .web.tsx versions with plain SVG

// Export common react-native-svg components as no-ops or simple wrappers
module.exports = {
  Svg: function Svg() { return null },
  Circle: function Circle() { return null },
  Ellipse: function Ellipse() { return null },
  G: function G() { return null },
  Text: function Text() { return null },
  TSpan: function TSpan() { return null },
  TextPath: function TextPath() { return null },
  Path: function Path() { return null },
  Polygon: function Polygon() { return null },
  Polyline: function Polyline() { return null },
  Line: function Line() { return null },
  Rect: function Rect() { return null },
  Use: function Use() { return null },
  Image: function Image() { return null },
  Symbol: function Symbol() { return null },
  Defs: function Defs() { return null },
  LinearGradient: function LinearGradient() { return null },
  RadialGradient: function RadialGradient() { return null },
  Stop: function Stop() { return null },
  ClipPath: function ClipPath() { return null },
  Pattern: function Pattern() { return null },
  Mask: function Mask() { return null },
  Marker: function Marker() { return null },
  ForeignObject: function ForeignObject() { return null },
  default: function SvgDefault() { return null }
}
