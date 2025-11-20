// Re-export types and enums from luscher-test package
import { MainColor } from 'luscher-test'
export { MainColor, type MainColor as MainColorType }

// Standard Luscher Color Hex values (official Luscher test colors)
const COLOR_HEX_MAP: Record<string, string> = {
  BLUE: '#0F4C81', // Deep calm, satisfaction, tenderness, tranquility
  GREEN: '#3B7A57', // Perseverance, self-assertion, willpower
  RED: '#B4202A', // Excitement, desire, energy, drive
  YELLOW: '#F6BE00', // Expansion, hope, openness, future orientation
  PURPLE: '#7E4A9E', // Sensitivity, identification, emotional fantasy (Violet)
  BROWN: '#7B5544', // Physical comfort, sensual security, groundedness
  BLACK: '#000000', // Refusal, boundary, negation, renunciation
  GRAY: '#808080', // Neutrality, non-involvement, detachment
} as const

type ColorKey = keyof typeof MainColor

export interface Color {
  key: ColorKey
  hex: string
  value: MainColor
  selected: boolean
}

export type ColorHex = (typeof COLOR_HEX_MAP)[keyof typeof COLOR_HEX_MAP]

/**
 * Get all color choices in default order
 */
export function colorChoices(): Color[] {
  const arr: Color[] = []

  // MainColor enum has both numeric keys (0-7) and string keys (BLUE, GREEN, etc.)
  // We only want the string keys that map to numbers
  const stringKeys: ColorKey[] = [
    'GRAY',
    'BLUE',
    'GREEN',
    'RED',
    'YELLOW',
    'PURPLE',
    'BROWN',
    'BLACK',
  ]

  for (const key of stringKeys) {
    const value = MainColor[key]
    const hex = COLOR_HEX_MAP[key]
    if (value !== undefined && typeof value === 'number' && hex) {
      arr.push({ key, hex, value, selected: false })
    }
  }

  return arr
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Get color choices shuffled in random order
 * Colors should always render in random order for the test
 */
export function shuffleColors(): Color[] {
  return shuffleArray(colorChoices())
}
