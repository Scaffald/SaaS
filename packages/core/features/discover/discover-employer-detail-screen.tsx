import { DiscoverEmployerDetailLeft } from './discover-employer-detail-left'
import { DiscoverEmployerDetailRight } from './discover-employer-detail-right'

type DiscoverEmployerDetailScreenProps = {
  employerId: string
}

/**
 * DiscoverEmployerDetailScreen
 * Composes the employer detail view into left and right dashboard columns.
 */
export function DiscoverEmployerDetailScreen({ employerId }: DiscoverEmployerDetailScreenProps) {
  return {
    left: <DiscoverEmployerDetailLeft employerId={employerId} />,
    right: <DiscoverEmployerDetailRight employerId={employerId} />,
  }
}
