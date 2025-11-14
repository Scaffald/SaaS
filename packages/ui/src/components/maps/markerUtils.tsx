/**
 * Get the color for a pin type
 */
export function getTypeColor(type: 'worker' | 'organization' | 'job'): string {
  switch (type) {
    case 'worker':
      return '#EC4899' // Pink
    case 'organization':
      return '#A855F7' // Purple
    case 'job':
      return '#FBBF24' // Yellow
    default:
      return '#EC4899'
  }
}

/**
 * Get full SVG for icon (including all paths)
 */
function getIconSvg(type: 'worker' | 'organization' | 'job', size = 24): string {
  const iconSize = size
  const viewBox = '0 0 24 24'

  switch (type) {
    case 'worker':
      // User icon - full SVG
      return `<svg width="${iconSize}" height="${iconSize}" viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>`
    case 'organization':
      // Building2 icon - full SVG
      return `<svg width="${iconSize}" height="${iconSize}" viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"></path>
        <path d="M6 12h4"></path>
        <path d="M6 8h4"></path>
        <path d="M6 16h4"></path>
        <path d="M14 12h4"></path>
        <path d="M14 8h4"></path>
        <path d="M14 16h4"></path>
      </svg>`
    case 'job':
      // Briefcase icon - full SVG
      return `<svg width="${iconSize}" height="${iconSize}" viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
        <rect x="8" y="6" width="8" height="4"></rect>
        <path d="M8 10h8"></path>
        <path d="M8 14h8"></path>
        <path d="M8 18h8"></path>
      </svg>`
    default:
      return `<svg width="${iconSize}" height="${iconSize}" viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>`
  }
}

/**
 * Create HTML for a cluster marker
 */
export function createClusterMarkerHTML(
  workerCount: number,
  orgCount: number,
  jobCount: number,
  totalCount: number,
  size = 60
): string {
  // Determine dominant type
  const dominantType: 'worker' | 'organization' | 'job' =
    workerCount > orgCount && workerCount > jobCount
      ? 'worker'
      : orgCount > jobCount
        ? 'organization'
        : 'job'

  const color = getTypeColor(dominantType)
  const iconSize = Math.max(20, size * 0.4) // Icon is 40% of marker size
  const iconSvg = getIconSvg(dominantType, iconSize)

  // Format count (abbreviate if needed)
  const countText = totalCount > 99 ? '99+' : totalCount.toString()

  return `
    <div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background-color: ${color};
      border: 3px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      cursor: pointer;
      position: relative;
      overflow: hidden;
    ">
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
      ">
        ${iconSvg.replace('currentColor', 'white')}
      </div>
      <div style="
        position: absolute;
        bottom: 4px;
        right: 4px;
        background-color: rgba(0,0,0,0.6);
        color: white;
        border-radius: 10px;
        padding: 2px 6px;
        font-size: ${Math.max(10, size * 0.2)}px;
        font-weight: bold;
        line-height: 1;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        ${countText}
      </div>
    </div>
  `
}

/**
 * Create HTML for an individual pin marker
 */
export function createPinMarkerHTML(
  type: 'worker' | 'organization' | 'job',
  selected: boolean,
  size = 48
): string {
  const color = selected ? '#3B82F6' : getTypeColor(type)
  const iconSize = Math.max(20, size * 0.5) // Icon is 50% of marker size
  const iconSvg = getIconSvg(type, iconSize)
  const borderWidth = selected ? 3 : 2

  return `
    <div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background-color: ${color};
      border: ${borderWidth}px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      cursor: pointer;
      position: relative;
    ">
      <div style="
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
      ">
        ${iconSvg.replace('currentColor', 'white')}
      </div>
    </div>
  `
}

/**
 * Determine dominant type from cluster properties
 */
export function getDominantType(
  workerCount: number,
  orgCount: number,
  jobCount: number
): 'worker' | 'organization' | 'job' {
  if (workerCount > orgCount && workerCount > jobCount) {
    return 'worker'
  }
  if (orgCount > jobCount) {
    return 'organization'
  }
  return 'job'
}
