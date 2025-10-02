import { DiscoverJobsLeft } from './discover-jobs-left'
import { DiscoverJobsRight } from './discover-jobs-right'

/**
 * Discover Jobs Screen Component
 * Main screen component that combines left and right panels
 */
export function DiscoverJobsScreen() {
  return {
    left: <DiscoverJobsLeft />,
    right: <DiscoverJobsRight />,
  }
}
