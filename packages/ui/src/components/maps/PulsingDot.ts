import type mapboxgl from 'mapbox-gl'

/**
 * Creates an animated pulsing dot image for Mapbox maps
 * Implements the StyleImageInterface specification
 *
 * Based on: https://docs.mapbox.com/mapbox-gl-js/example/add-image-animated/
 */
export function createPulsingDot(
  map: mapboxgl.Map,
  options: {
    size?: number
    innerColor?: string
    outerColor?: string
    duration?: number
  } = {}
): mapboxgl.StyleImageInterface {
  const {
    size = 200,
    innerColor = 'rgba(59, 130, 246, 1)', // Blue-500 to match selection styling
    outerColor = 'rgba(59, 130, 246, 0.4)', // Lighter blue for outer pulse
    duration = 1000, // 1 second animation cycle
  } = options

  const pulsingDot: mapboxgl.StyleImageInterface & { context?: CanvasRenderingContext2D | null } = {
    width: size,
    height: size,
    data: new Uint8Array(size * size * 4),

    // When the layer is added to the map,
    // get the rendering context for the map canvas.
    onAdd: function () {
      const canvas = document.createElement('canvas')
      canvas.width = this.width
      canvas.height = this.height
      this.context = canvas.getContext('2d')
    },

    // Call once before every frame where the icon will be used.
    render: function () {
      const t = (performance.now() % duration) / duration

      const radius = (size / 2) * 0.3
      const outerRadius = (size / 2) * 0.7 * t + radius
      const context = this.context

      if (!context) {
        return false
      }

      // Draw the outer circle (pulsing effect)
      context.clearRect(0, 0, this.width, this.height)
      context.beginPath()
      context.arc(this.width / 2, this.height / 2, outerRadius, 0, Math.PI * 2)
      // Calculate opacity for outer circle (fades from outerColor opacity to 0)
      // Extract base opacity from rgba string (e.g., "rgba(59, 130, 246, 0.4)" -> 0.4)
      const rgbaMatch = outerColor.match(/rgba?\([^)]+,\s*([\d.]+)\)/)
      const baseOpacity = rgbaMatch ? Number.parseFloat(rgbaMatch[1]) : 0.4
      const currentOpacity = baseOpacity * (1 - t)
      // Reconstruct rgba with new opacity
      const rgbaParts = outerColor.match(/rgba?\(([^)]+)\)/)
      if (rgbaParts) {
        const colorParts = rgbaParts[1].split(',').map((s) => s.trim())
        colorParts[3] = String(currentOpacity)
        context.fillStyle = `rgba(${colorParts.join(', ')})`
      } else {
        context.fillStyle = outerColor
      }
      context.fill()

      // Draw the inner circle (static center)
      context.beginPath()
      context.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2)
      context.fillStyle = innerColor
      context.strokeStyle = 'white'
      context.lineWidth = 2 + 4 * (1 - t)
      context.fill()
      context.stroke()

      // Update this image's data with data from the canvas.
      this.data = context.getImageData(0, 0, this.width, this.height).data

      // Continuously repaint the map, resulting
      // in the smooth animation of the dot.
      map.triggerRepaint()

      // Return `true` to let the map know that the image was updated.
      return true
    },
  }
  return pulsingDot
}
