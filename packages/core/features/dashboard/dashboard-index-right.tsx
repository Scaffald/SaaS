import { ScrollView } from 'tamagui'
import { NewsWidget } from '@app/core/features/news'

export function DashboardIndexRight() {
  return <NewsWidget industry="construction" maxItems={5} showFeedSelector={true} />
}
