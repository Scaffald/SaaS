import { ScrollView } from 'tamagui'
import { NewsWidget } from '@app/core/features/news'

export function DashboardIndexRight() {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <NewsWidget industry="construction" maxItems={5} showFeedSelector={true} />
    </ScrollView>
  )
}
