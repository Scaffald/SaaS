import { useMemo } from 'react'
import { PIN_COLORS, type MapPinCategory } from '../pinColors'

const CAPSULE_HEIGHT = 28
const CAPSULE_PADDING_X = 10
const CAPSULE_FONT = 'bold 12px "DIN Offc Pro", "Inter", system-ui, sans-serif'
const ICON_SIZE = 10
const ICON_GAP = 4
const RING_PADDING = 5
const AVATAR_HEIGHT = 53
const AVATAR_OFFSET_Y = 6

const KEYFRAMES_ID = 'scf-pin-ring-keyframes'
function ensureKeyframes() {
  if (typeof document === 'undefined') return
  if (document.getElementById(KEYFRAMES_ID)) return
  const style = document.createElement('style')
  style.id = KEYFRAMES_ID
  style.textContent = `
    @keyframes scf-pin-ring-pulse {
      0%   { transform: scale(1);    opacity: 0.85; }
      70%  { opacity: 0; }
      100% { transform: scale(1.55); opacity: 0; }
    }
  `
  document.head.appendChild(style)
}

let measureCtx: CanvasRenderingContext2D | null = null
function measureLabelWidth(label: string): number {
  if (typeof document === 'undefined') return 0
  if (!measureCtx) {
    const c = document.createElement('canvas')
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
        width: AVATAR_HEIGHT,
        height: AVATAR_HEIGHT,
        offsetY: -(AVATAR_HEIGHT / 2 + AVATAR_OFFSET_Y),
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

/** Re-derive what label the selected pin's capsule shows, mirroring MapAdapter logic. */
export function getSelectedPinLabel(pin: {
  pinType?: MapPinCategory
  organization?: string
  title?: string
  score?: number
  hourlyRate?: number
  payLabel?: string
  avatarUrl?: string | null
}): { label: string | null; isAvatar: boolean } {
  const type: MapPinCategory =
    pin.pinType ??
    (pin.organization === 'Organization' ? 'organization' : pin.organization === 'Job' ? 'job' : 'worker')

  if (type === 'worker') {
    if (pin.avatarUrl) return { label: null, isAvatar: true }
    if (pin.score != null) return { label: String(pin.score), isAvatar: false }
    return { label: null, isAvatar: false }
  }
  if (type === 'organization') {
    return { label: truncate(pin.title ?? '', 14), isAvatar: false }
  }
  // job
  const label = pin.payLabel ?? (pin.hourlyRate ? `$${pin.hourlyRate}/hr` : truncate(pin.title ?? '', 12))
  return { label, isAvatar: false }
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return `${text.slice(0, maxLen - 1)}…`
}
