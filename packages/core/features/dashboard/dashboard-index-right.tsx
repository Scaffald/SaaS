import { isWeb, ScrollView } from 'tamagui'
import { NewsWidget } from '@app/core/features/news'

export function DashboardIndexRight() {
  return <NewsWidget industry="construction" maxItems={3} showFeedSelector={isWeb} />
}
