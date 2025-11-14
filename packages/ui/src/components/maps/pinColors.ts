import type { MapPin } from './types'

/**
 * Pin colors mapping based on organization type and availability
 * Matches the color scheme from the current implementation
 */
export const PIN_COLORS: Record<string, string> = {
  Individual: '#22C55E', // Green for available workers
  Organization: '#A855F7', // Purple for organizations
  Job: '#FFD700', // Yellow for jobs
  unavailable: '#EF4444', // Red for unavailable workers
}

/**
 * Get pin color for a given pin
 */
export function getPinColor(pin: MapPin): string {
  // Custom color takes precedence
  if (pin.color) {
    return pin.color
  }

  // Check availability for workers
  if (pin.organization === 'Individual' && pin.availability === 'unavailable') {
    return PIN_COLORS.unavailable
  }

  // Return color based on organization type
  return PIN_COLORS[pin.organization || 'Individual'] || PIN_COLORS.Individual
}
