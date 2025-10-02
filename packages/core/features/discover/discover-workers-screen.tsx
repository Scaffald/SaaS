import { DiscoverWorkersLeft } from './discover-workers-left'
import { DiscoverWorkersRight } from './discover-workers-right'

/**
 * Discover Workers Screen Component
 * Main screen component that combines left and right panels
 */
export function DiscoverWorkersScreen() {
  return {
    left: <DiscoverWorkersLeft />,
    right: <DiscoverWorkersRight />,
  }
}
