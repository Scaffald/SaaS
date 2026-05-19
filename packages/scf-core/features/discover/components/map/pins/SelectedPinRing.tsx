import { useMemo } from 'react'
import { PIN_COLORS, type MapPinCategory } from '../pinColors'
import {
  AVATAR_OFFSET_Y,
  AVATAR_SIZE,
  CAPSULE_FONT,
  CAPSULE_HEIGHT,
  CAPSULE_PADDING_X,
  ICON_GAP,
  ICON_SIZE,
  determinePinType,
  getCapsuleLabel,
  isAvatarPin,
  type MapPinData,
} from './MapPin.shared'

const RING_PADDING = 5

const KEYFRAMES_ID = 'scf-pin-ring-keyframes'
function ensureKeyframes() {
  // platform-allow: only imported by MapAdapter.web.tsx; native bundle never includes this file.
  if (typeof document === 'undefined') return
  if (document.getElementById(KEYFRAMES_ID)) return // platform-allow: web-only
  const style = document.createElement('style') // platform-allow: web-only
  style.id = KEYFRAMES_ID
  style.textContent = `
    @keyframes scf-pin-ring-pulse {
      0%   { transform: scale(1);    opacity: 0.85; }
      70%  { opacity: 0; }
      100% { transform: scale(1.55); opacity: 0; }
    }
  `
  document.head.appendChild(style) // platform-allow: web-only
}

let measureCtx: CanvasRenderingContext2D | null = null
function measureLabelWidth(label: string): number {
  if (typeof document === 'undefined') return 0
  if (!measureCtx) {
    const c = document.createElement('canvas') // platform-allow: only imported by MapAdapter.web.tsx
    measureCtx = c.getContext('2d')
  }
  if (!measureCtx) return 0
  measureCtx.font = CAPSULE_FONT
  return measureCtx.measureText(label).width
}

export interface SelectedPinRingProps {
  label: string | null
  pinType: MapPinCategory
  theme: 'light' | 'dark'
  hasIcon: boolean
  /** True when the worker pin renders as an avatar instead of a capsule. */
  isAvatar?: boolean
}

export function SelectedPinRing({
  label,
  pinType,
  theme,
  hasIcon,
  isAvatar = false,
}: SelectedPinRingProps) {
  ensureKeyframes()
  const color = PIN_COLORS[theme][pinType]

  const { width, height, offsetY } = useMemo(() => {
    if (isAvatar) {
      return {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        offsetY: -(AVATAR_SIZE / 2 + AVATAR_OFFSET_Y),
      }
    }
    const iconW = hasIcon ? ICON_SIZE + ICON_GAP : 0
    const textW = label ? measureLabelWidth(label) : 0
    const w = Math.max(iconW + textW + CAPSULE_PADDING_X * 2, CAPSULE_HEIGHT)
    return { width: w, height: CAPSULE_HEIGHT, offsetY: 0 }
  }, [isAvatar, hasIcon, label])

  const ringW = width + RING_PADDING * 2
  const ringH = height + RING_PADDING * 2
  const radius = ringH / 2

  const baseRing: React.CSSProperties = {
    position: 'absolute',
    left: -ringW / 2,
    top: offsetY - ringH / 2,
    width: ringW,
    height: ringH,
    borderRadius: radius,
    border: `2px solid ${color}`,
    boxSizing: 'border-box',
    pointerEvents: 'none',
    opacity: 0.9,
  }

  const pulse: React.CSSProperties = {
    ...baseRing,
    borderColor: color,
    animation: 'scf-pin-ring-pulse 1.6s ease-out infinite',
  }

  return (
    <div
      aria-hidden
      style={{ position: 'absolute', left: 0, top: 0, width: 0, height: 0, pointerEvents: 'none' }}
    >
      <div style={baseRing} />
      <div style={pulse} />
    </div>
  )
}

/** Derive label + render-mode for the selected pin (shared with MapPin). */
export function getSelectedPinLabel(pin: MapPinData): {
  label: string | null
  isAvatar: boolean
  pinType: MapPinCategory
} {
  return {
    label: getCapsuleLabel(pin),
    isAvatar: isAvatarPin(pin),
    pinType: determinePinType(pin),
  }
}
