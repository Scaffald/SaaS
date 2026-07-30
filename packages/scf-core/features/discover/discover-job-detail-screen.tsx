import { DiscoverJobDetailLeft } from './discover-job-detail-left'
import { DiscoverJobDetailRight } from './discover-job-detail-right'

interface DiscoverJobDetailScreenProps {
  jobId: string
}

/**
 * Discover Job Detail Screen Component
 * Main screen for viewing job details and applying
 *
 * The column assignment is deliberately the opposite of the component names
 * (#392). DashboardLayout puts `leftContent` in the wide 1.618fr column and,
 * at mobile widths, stacks it *above* `rightContent`. So the apply block was
 * taking 62% of the desktop width and opening the mobile page — asking people
 * to apply before they could read what they would be applying to.
 *
 * Job content now goes first and takes the wider column; the apply flow
 * becomes the sidebar. That is the conventional job-board arrangement and it
 * reads correctly at both sizes, which is why this is a swap here rather than
 * a mobile-only reordering.
 *
 * The components keep their historical names — they are imported by name
 * elsewhere, and renaming them would be a wider change than the fix needs.
 */
export function DiscoverJobDetailScreen({ jobId }: DiscoverJobDetailScreenProps) {
  return {
    // Job content: title, company, pay range, description.
    left: <DiscoverJobDetailRight jobId={jobId} />,
    // Apply flow.
    right: <DiscoverJobDetailLeft jobId={jobId} />,
  }
}
