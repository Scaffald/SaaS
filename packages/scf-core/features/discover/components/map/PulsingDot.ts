import type mapboxgl from 'mapbox-gl'

/**
 * Creates an animated pulsing ring image for selected map pins.
 * Renders only an expanding ring with no filled centre so the pin capsule
 * remains fully visible underneath.
 */
export function createPulsingRing(
  map: mapboxgl.Map,
  options: {
    size?: number
    duration?: number
  } = {}
): mapboxgl.StyleImageInterface {
  const { size = 200, duration = 1300 } = options

  const ring: mapboxgl.StyleImageInterface & { context?: CanvasRenderingContext2D | null } = {
    width: size,
    height: size,
    data: new Uint8Array(size * size * 4),

    onAdd() {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      this.context = canvas.getContext('2d')
    },

    render() {
      const ctx = this.context
      if (!ctx) return false
      ctx.clearRect(0, 0, size, size)

      const cx = size / 2
      const cy = size / 2
      // Ring starts just outside the capsule (~18% of half-size) and expands to ~46%
      const minR = size * 0.18
      const maxR = size * 0.46

      // Two overlapping waves offset by half a period for a smooth continuous pulse
      for (let wave = 0; wave < 2; wave++) {
        const t = ((performance.now() / duration) + wave * 0.5) % 1
        const r = minR + (maxR - minR) * t
        const opacity = (1 - t) * 0.75

        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`
        ctx.lineWidth = Math.max(1.5, 3.5 * (1 - t))
        ctx.stroke()
      }

      this.data = ctx.getImageData(0, 0, size, size).data
      map.triggerRepaint()
      return true
    },
  }
  return ring
}

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
    innerColor = 'rgba(59, 130, 246, 1)',
    outerColor = 'rgba(59, 130, 246, 0.4)',
    duration = 1000,
  } = options

  const pulsingDot: mapboxgl.StyleImageInterface & { context?: CanvasRenderingContext2D | null } = {
    width: size,
    height: size,
    data: new Uint8Array(size * size * 4),

    onAdd: function () {
      const canvas = document.createElement('canvas')
      canvas.width = this.width
      canvas.height = this.height
      this.context = canvas.getContext('2d')
    },

    render: function () {
      const t = (performance.now() % duration) / duration

      const radius = (size / 2) * 0.3
      const outerRadius = (size / 2) * 0.7 * t + radius
      const context = this.context

      if (!context) {
        return false
      }

      context.clearRect(0, 0, this.width, this.height)
      context.beginPath()
      context.arc(this.width / 2, this.height / 2, outerRadius, 0, Math.PI * 2)

      const rgbaMatch = outerColor.match(/rgba?\([^)]+,\s*([\d.]+)\)/)
      const baseOpacity = rgbaMatch ? Number.parseFloat(rgbaMatch[1]) : 0.4
      const currentOpacity = baseOpacity * (1 - t)
      const rgbaParts = outerColor.match(/rgba?\(([^)]+)\)/)
      if (rgbaParts) {
        const colorParts = rgbaParts[1].split(',').map((s) => s.trim())
        colorParts[3] = String(currentOpacity)
        context.fillStyle = `rgba(${colorParts.join(', ')})`
      } else {
        context.fillStyle = outerColor
      }
      context.fill()

      context.beginPath()
      context.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2)
      context.fillStyle = innerColor
      context.strokeStyle = 'white'
      context.lineWidth = 2 + 4 * (1 - t)
      context.fill()
      context.stroke()

      this.data = context.getImageData(0, 0, this.width, this.height).data

      map.triggerRepaint()

      return true
    },
  }
  return pulsingDot
}
