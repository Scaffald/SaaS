import { ShieldCheck } from 'lucide-react-native'
import { EmptyState } from '@scaffald/ui'

/**
 * What both order screens show while checks cannot be ordered here yet
 * (#1267): the screening provider is not connected, and taking real money for
 * a check nothing would run is worse than not offering it.
 */
export function OrderingClosedNotice() {
  return (
    <EmptyState
      icon={ShieldCheck}
      title="Background checks open soon"
      description="We're finishing the connection to our screening partner. Nothing has been charged, and you'll be able to order a check here once it's ready."
    />
  )
}
