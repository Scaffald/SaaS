import { memo, useState, type CSSProperties, type MouseEvent } from 'react'
import { PIN_COLORS, type MapPinCategory } from '../pinColors'
import {
  AVATAR_BORDER_WIDTH,
  AVATAR_SIZE,
  CAPSULE_FONT_FAMILY,
  CAPSULE_FONT_SIZE,
  CAPSULE_HEIGHT,
  CAPSULE_PADDING_X,
  ICON_GAP,
  ICON_SIZE,
  determinePinType,
  getCapsuleLabel,
  isAvatarPin,
  type MapPinData,
} from './MapPin.shared'

interface MapPinProps {
  pin: MapPinData
  theme: 'light' | 'dark'
  onPress?: (id: string) => void
  onHoverEnter?: (id: string) => void
  onHoverLeave?: (id: string) => void
}

function PinIcon({ type, size, color }: { type: MapPinCategory; size: number; color: string }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: color,
    stroke: color,
    'aria-hidden': true,
  } as const
  if (type === 'worker') {
    return (
      // biome-ignore lint/a11y/noSvgWithoutTitle: decorative icon, aria-hidden provided via spread
      <svg {...common} aria-hidden strokeWidth={0}>
        <circle cx={12} cy={8} r={4} />
        <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
      </svg>
    )
  }
  if (type === 'organization') {
    return (
      // biome-ignore lint/a11y/noSvgWithoutTitle: decorative icon, aria-hidden provided via spread
      <svg {...common} aria-hidden strokeWidth={0}>
        <path d="M4 21V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v16H4Zm14 0V9h2a1 1 0 0 1 1 1v11h-3ZM8 8h2v2H8V8Zm0 4h2v2H8v-2Zm4-4h2v2h-2V8Zm0 4h2v2h-2v-2Z" />
      </svg>
    )
  }
  // job
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: decorative icon, aria-hidden provided via spread
    <svg {...common} aria-hidden strokeWidth={0}>
      <path d="M9 3h6a2 2 0 0 1 2 2v2h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3V5a2 2 0 0 1 2-2Zm0 4h6V5H9v2Z" />
    </svg>
  )
}

function CapsulePin({ pin, theme, onPress, onHoverEnter, onHoverLeave }: MapPinProps) {
  const type = determinePinType(pin)
  const color = PIN_COLORS[theme][type]
  const label = getCapsuleLabel(pin) ?? ''

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation()
    onPress?.(pin.id)
  }

  const containerStyle: CSSProperties = {
    height: CAPSULE_HEIGHT,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: CAPSULE_PADDING_X,
    paddingRight: CAPSULE_PADDING_X,
    borderRadius: CAPSULE_HEIGHT / 2,
    backgroundColor: color,
    border: '1.5px solid rgba(255,255,255,0.9)',
    boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: ICON_GAP,
    color: '#ffffff',
    cursor: 'pointer',
    userSelect: 'none',
    fontFamily: CAPSULE_FONT_FAMILY,
    fontSize: CAPSULE_FONT_SIZE,
    fontWeight: 700,
    lineHeight: 1,
    whiteSpace: 'nowrap',
    pointerEvents: 'auto',
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => onHoverEnter?.(pin.id)}
      onMouseLeave={() => onHoverLeave?.(pin.id)}
      style={containerStyle}
    >
      <PinIcon type={type} size={ICON_SIZE} color="rgba(255,255,255,0.95)" />
      {label && <span>{label}</span>}
    </button>
  )
}

function AvatarPin({ pin, theme, onPress, onHoverEnter, onHoverLeave }: MapPinProps) {
  const type = determinePinType(pin)
  const color = PIN_COLORS[theme][type]
  const [imgError, setImgError] = useState(false)

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation()
    onPress?.(pin.id)
  }

  const wrapStyle: CSSProperties = {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    padding: 0,
    borderRadius: '50%',
    backgroundColor: color,
    border: `${AVATAR_BORDER_WIDTH}px solid #ffffff`,
    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
    overflow: 'hidden',
    cursor: 'pointer',
    pointerEvents: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => onHoverEnter?.(pin.id)}
      onMouseLeave={() => onHoverLeave?.(pin.id)}
      style={wrapStyle}
    >
      {pin.avatarUrl && !imgError ? (
        <img
          src={pin.avatarUrl}
          alt=""
          onError={() => setImgError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <PinIcon type="worker" size={22} color="rgba(255,255,255,0.95)" />
      )}
    </button>
  )
}

export const MapPin = memo(function MapPin(props: MapPinProps) {
  return isAvatarPin(props.pin) ? <AvatarPin {...props} /> : <CapsulePin {...props} />
})
