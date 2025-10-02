import { DiscoverEmployersLeft } from './discover-employers-left'
import { DiscoverEmployersRight } from './discover-employers-right'

/**
 * Discover Employers Screen Component
 * Main screen component that combines left and right panels
 */
export function DiscoverEmployersScreen() {
  return {
    left: <DiscoverEmployersLeft />,
    right: <DiscoverEmployersRight />,
  }
}
