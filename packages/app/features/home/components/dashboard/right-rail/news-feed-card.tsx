import { ArrowRight } from '@tamagui/lucide-icons'
import { Button, Image, Paragraph, SizableText, YStack } from '@app/ui'

import { DashboardCard, SectionHeading } from '../primitives'

export type NewsArticle = {
  id: string
  title: string
  excerpt: string
  imageUrl: string
}

export type NewsFeedCardProps = {
  articles: NewsArticle[]
}

export const NewsFeedCard = ({ articles }: NewsFeedCardProps) => {
  return (
    <DashboardCard gap="$4">
      <SectionHeading
        title="News"
        action={
          <Button chromeless size="$2" iconAfter={ArrowRight}>
            View more
          </Button>
        }
      />
      <YStack gap="$3">
        {articles.map((article) => (
          <YStack key={article.id} gap="$2">
            <Image
              source={{ uri: article.imageUrl }}
              resizeMode="cover"
              style={{ width: '100%', height: 120, borderRadius: 12 }}
            />
            <YStack gap="$1">
              <SizableText size="$3" fontWeight="600">
                {article.title}
              </SizableText>
              <Paragraph size="$2" color="$gray11">
                {article.excerpt}
              </Paragraph>
            </YStack>
          </YStack>
        ))}
      </YStack>
    </DashboardCard>
  )
}
