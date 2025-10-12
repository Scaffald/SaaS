import { DiscoverJobDetailLeft } from './discover-job-detail-left'
import { DiscoverJobDetailRight } from './discover-job-detail-right'

interface DiscoverJobDetailScreenProps {
  jobId: string
}

/**
 * Discover Job Detail Screen Component
 * Main screen for viewing job details and applying
 */
export function DiscoverJobDetailScreen({ jobId }: DiscoverJobDetailScreenProps) {
  return {
    left: <DiscoverJobDetailLeft jobId={jobId} />,
    right: <DiscoverJobDetailRight jobId={jobId} />,
  }
}
