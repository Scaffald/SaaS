/**
 * Chart utility functions
 * Helper functions for chart data processing, normalization, and calculations
 */

import type {
  DonutChartData,
  ChartSize,
  CircleChartSize,
  HalfPieChartSize,
  ChartColorScheme,
  ChartPeriod,
} from './Chart.types'
import { colors } from '../../tokens/colors'

/**
 * Normalize data to fit within chart bounds
 */
export function normalizeData(
  data: number[],
  min: number = 0,
  max: number = 100
): number[] {
  const dataMin = Math.min(...data)
  const dataMax = Math.max(...data)
  const range = dataMax - dataMin || 1

  return data.map((value) => {
    const normalized = ((value - dataMin) / range) * (max - min) + min
    return Math.max(min, Math.min(max, normalized))
  })
}

/**
 * Get chart colors based on color scheme
 */
export function getChartColors(
  scheme: ChartColorScheme,
  count: number
): string[] {
  if (scheme === 'primary') {
    // Primary brand colors
    const primaryColors = [
      colors.primary[600],
      colors.primary[500],
      colors.primary[400],
      colors.primary[300],
      colors.primary[700],
    ]
    return Array.from({ length: count }, (_, i) => primaryColors[i % primaryColors.length] || colors.primary[600])
  }

  // Colorful scheme
  const colorfulColors = [
    colors.blue[500],
    colors.green[500],
    colors.yellow[500],
    colors.orange[500],
    colors.error[500],
    colors.purple[500],
    colors.pink[500],
    colors.indigo[500],
  ]
  return Array.from({ length: count }, (_, i) => colorfulColors[i % colorfulColors.length] || colors.blue[500])
}

/**
 * Generate SVG path for line chart
 */
export function generateLinePath(
  points: { x: number; y: number }[],
  width: number,
  height: number,
  smooth: boolean = false
): string {
  if (points.length === 0) return ''

  // Normalize points to chart coordinates
  const minX = Math.min(...points.map((p) => p.x))
  const maxX = Math.max(...points.map((p) => p.x))
  const minY = Math.min(...points.map((p) => p.y))
  const maxY = Math.max(...points.map((p) => p.y))
  const xRange = maxX - minX || 1
  const yRange = maxY - minY || 1

  const normalizedPoints = points.map((point) => ({
    x: ((point.x - minX) / xRange) * width,
    y: height - ((point.y - minY) / yRange) * height,
  }))

  if (normalizedPoints.length === 1) {
    const p = normalizedPoints[0]
    return `M ${p.x} ${p.y}`
  }

  if (smooth && normalizedPoints.length > 2) {
    // Generate smooth curve using quadratic bezier curves
    let path = `M ${normalizedPoints[0].x} ${normalizedPoints[0].y}`
    for (let i = 1; i < normalizedPoints.length; i++) {
      const prev = normalizedPoints[i - 1]
      const curr = normalizedPoints[i]
      const next = normalizedPoints[i + 1] || curr

      const cp1x = prev.x + (curr.x - prev.x) / 2
      const cp1y = prev.y
      const cp2x = curr.x - (next.x - curr.x) / 2
      const cp2y = curr.y

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`
    }
    return path
  }

  // Generate straight line path
  let path = `M ${normalizedPoints[0].x} ${normalizedPoints[0].y}`
  for (let i = 1; i < normalizedPoints.length; i++) {
    path += ` L ${normalizedPoints[i].x} ${normalizedPoints[i].y}`
  }
  return path
}

/**
 * Calculate percentage for donut/circle charts
 */
export function calculatePercentage(
  value: number,
  total: number
): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

/**
 * Calculate angles for pie/donut chart segments
 */
export function calculatePieAngles(data: DonutChartData[]): Array<{
  startAngle: number
  endAngle: number
  value: number
  label: string
  color: string
}> {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  let currentAngle = -90 // Start at top (-90 degrees)

  return data.map((item) => {
    const percentage = (item.value / total) * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + percentage

    currentAngle = endAngle

    return {
      startAngle,
      endAngle,
      value: item.value,
      label: item.label,
      color: item.color || colors.primary[600],
    }
  })
}

/**
 * Get chart size dimensions
 * Matches Figma specifications exactly
 */
export function getChartSize(size: ChartSize): { width: number; height: number } {
  const sizeMap: Record<ChartSize, { width: number; height: number }> = {
    '3x-small': { width: 40, height: 40 }, // 3X Small from Figma
    '2x-small': { width: 64, height: 64 }, // 2X Small from Figma
    xs: { width: 80, height: 80 }, // Extra Small from Figma
    sm: { width: 96, height: 96 }, // Small from Figma
    md: { width: 120, height: 120 }, // Medium from Figma
    lg: { width: 160, height: 160 }, // Large from Figma
    xl: { width: 200, height: 200 }, // Extra Large from Figma
    '2x-large': { width: 240, height: 240 }, // 2X Large from Figma
  }
  return sizeMap[size] || sizeMap.md
}

/**
 * Get circle chart size dimensions
 * Matches Figma specifications exactly: small (140px), medium (160px), large (180px), extra-large (220px)
 */
export function getCircleChartSize(size: CircleChartSize): {
  width: number
  height: number
  radius: number
} {
  const sizeMap: Record<CircleChartSize, { width: number; height: number; radius: number }> = {
    sm: { width: 140, height: 140, radius: 60 }, // small from Figma
    md: { width: 160, height: 160, radius: 70 }, // medium from Figma
    lg: { width: 180, height: 180, radius: 80 }, // large from Figma
    xl: { width: 220, height: 220, radius: 100 }, // extra-large from Figma
  }
  return sizeMap[size] || sizeMap.md
}

/**
 * Get half pie chart size dimensions
 * Matches Figma specifications exactly: Small (102x50), Medium (124x62), Large (152x75)
 */
export function getHalfPieChartSize(size: HalfPieChartSize): {
  width: number
  height: number
  radius: number
} {
  const sizeMap: Record<HalfPieChartSize, { width: number; height: number; radius: number }> = {
    sm: { width: 102, height: 50, radius: 50 }, // Small from Figma
    md: { width: 124, height: 62, radius: 62 }, // Medium from Figma
    lg: { width: 152, height: 75, radius: 75 }, // Large from Figma
  }
  return sizeMap[size] || sizeMap.md
}

/**
 * Get small circle chart size dimensions
 * Matches Figma specifications exactly: 2x-small (40px), extra-small (44px), small (48px), 
 * medium (56px), large (64px), extra-large (72px), 2x-large (80px)
 */
export function getSmallCircleChartSize(size: ChartSize): {
  width: number
  height: number
  radius: number
} {
  const sizeMap: Partial<Record<ChartSize, { width: number; height: number; radius: number }>> = {
    '2x-small': { width: 40, height: 40, radius: 16 }, // 2x-small from Figma
    xs: { width: 44, height: 44, radius: 18 }, // extra-small from Figma
    sm: { width: 48, height: 48, radius: 20 }, // small from Figma
    md: { width: 56, height: 56, radius: 24 }, // medium from Figma
    lg: { width: 64, height: 64, radius: 28 }, // large from Figma
    xl: { width: 72, height: 72, radius: 32 }, // extra-large from Figma
    '2x-large': { width: 80, height: 80, radius: 36 }, // 2x-large from Figma
  }
  return sizeMap[size] || sizeMap.md || { width: 56, height: 56, radius: 24 }
}

/**
 * Get default colors for bar chart variants
 */
export function getBarChartColors(variant: '1' | '2' | '3'): string[] {
  switch (variant) {
    case '1':
      return [colors.blue[500], colors.info[400], colors.indigo[500]]
    case '2':
      return [colors.blue[500], colors.info[400], colors.indigo[500]]
    case '3':
      return [colors.blue[500], colors.info[400], colors.indigo[500]]
    default:
      return [colors.blue[500], colors.info[400], colors.indigo[500]]
  }
}

/**
 * Get x-axis labels for period
 */
export function getPeriodLabels(period: ChartPeriod): string[] {
  switch (period) {
    case 'week':
      return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    case 'month':
      return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    case 'year':
      return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Avg', 'Sep', 'Oct', 'Nov', 'Dec']
    case 'last-days':
      return ['T 13', 'W 14', 'T 15', 'F 16', 'S 17', ' S 18', 'M 19']
    default:
      return []
  }
}

/**
 * Convert angle from degrees to radians
 */
export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/**
 * Convert radians to degrees
 */
export function radiansToDegrees(radians: number): number {
  return (radians * 180) / Math.PI
}

/**
 * Get arc path for pie/donut chart segment
 */
export function getArcPath(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  innerRadius: number = 0
): string {
  const startRad = degreesToRadians(startAngle)
  const endRad = degreesToRadians(endAngle)

  const x1 = centerX + radius * Math.cos(startRad)
  const y1 = centerY + radius * Math.sin(startRad)
  const x2 = centerX + radius * Math.cos(endRad)
  const y2 = centerY + radius * Math.sin(endRad)

  const x3 = centerX + innerRadius * Math.cos(endRad)
  const y3 = centerY + innerRadius * Math.sin(endRad)
  const x4 = centerX + innerRadius * Math.cos(startRad)
  const y4 = centerY + innerRadius * Math.sin(startRad)

  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0

  if (innerRadius === 0) {
    // Full pie segment
    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
  }

  // Donut segment
  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`
}
