import type { MapMouseEvent } from 'mapbox-gl'
import mapboxgl from 'mapbox-gl'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { PinMarker } from './PinMarker'
import { getPinColor } from './pinColors'
import type { MapPin } from './types'

interface CustomMarkerOptions {
  pin: MapPin
  onClick?: (pinId: string) => void
  onHover?: (pinId: string | null) => void
  zoom?: number
}

/**
 * Custom marker class that extends mapboxgl.Marker
 * Uses the PinMarker SVG component for consistent styling
 */
export class CustomMarker extends mapboxgl.Marker {
  private _handleClick?: () => void
  public pin: MapPin

  constructor(options: CustomMarkerOptions) {
    const { pin, onClick, onHover, zoom = 0 } = options

    // Create a div element for the marker
    const el = document.createElement('div')
    el.className = 'custom-map-marker'

    // Render the PinMarker component to HTML
    const color = getPinColor(pin)

    // Only show tooltip when zoomed in very close (>= 12)
    // For users and orgs, show only the name (title), not subtitle
    let tooltip: string | undefined
    if (zoom >= 12) {
      if (pin.organization === 'Individual' || pin.organization === 'Organization') {
        // Show only name for users and orgs
        tooltip = pin.title
      } else {
        // For jobs, show title (job title)
        tooltip = pin.title
      }
    }

    el.innerHTML = renderToString(createElement(PinMarker, { color, tooltip }))

    // Add click handler
    if (onClick) {
      el.style.cursor = 'pointer'
      el.addEventListener('click', () => {
        onClick(pin.id)
      })
    }

    // Add hover handlers (only for worker and organization pins)
    if (onHover && (pin.organization === 'Individual' || pin.organization === 'Organization')) {
      el.addEventListener('mouseenter', () => {
        onHover(pin.id)
      })
      el.addEventListener('mouseleave', () => {
        onHover(null)
      })
    }

    // Add selected state styling
    if (pin.selected) {
      el.style.filter = 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.8))'
      el.style.zIndex = '1000'
    }

    super({ element: el, anchor: 'bottom' })

    this.pin = pin
    this._handleClick = onClick ? () => onClick(pin.id) : undefined
  }

  /**
   * Handle map click events to detect marker clicks
   */
  override _onMapClick(e: MapMouseEvent): void {
    const targetElement = e.originalEvent.target as Node
    const element = this.getElement()

    if (element && (targetElement === element || element.contains(targetElement))) {
      this._handleClick?.()
    }
  }
}
