import type { MapPinCategory } from '../pinColors'

export const CAPSULE_HEIGHT = 28
export const CAPSULE_PADDING_X = 10
export const CAPSULE_FONT_SIZE = 12
export const CAPSULE_FONT_FAMILY = '"DIN Offc Pro", "Inter", system-ui, sans-serif'
export const CAPSULE_FONT = `bold ${CAPSULE_FONT_SIZE}px ${CAPSULE_FONT_FAMILY}`
export const ICON_SIZE = 12
export const ICON_GAP = 4
export const AVATAR_SIZE = 48
export const AVATAR_BORDER_WIDTH = 3
export const AVATAR_OFFSET_Y = 6

export interface MapPinData {
  id: string
  coordinate: [number, number]
  title?: string
  subtitle?: string
  score?: number
  hourlyRate?: number
  payLabel?: string
  availability?: string
  organization?: string
  color?: string
  pinType?: MapPinCategory
  avatarUrl?: string | null
  selected?: boolean
}

export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return `${text.slice(0, maxLen - 1)}…`
}

export function determinePinType(pin: MapPinData): MapPinCategory {
  if (pin.pinType) return pin.pinType
  if (pin.organization === 'Organization') return 'organization'
  if (pin.organization === 'Job') return 'job'
  return 'worker'
}

/** True when the pin renders as an avatar instead of a capsule. */
export function isAvatarPin(pin: MapPinData): boolean {
  return determinePinType(pin) === 'worker' && !!pin.avatarUrl
}

/** Returns the label shown inside the capsule, or null if there isn't one (avatar pins). */
export function getCapsuleLabel(pin: MapPinData): string | null {
  const type = determinePinType(pin)
  if (type === 'worker') {
    if (pin.avatarUrl) return null
    if (pin.score != null) return String(pin.score)
    return null
  }
  if (type === 'organization') {
    return truncate(pin.title ?? '', 14)
  }
  return pin.payLabel ?? (pin.hourlyRate ? `$${pin.hourlyRate}/hr` : truncate(pin.title ?? '', 12))
}
