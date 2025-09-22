import { Button, Paragraph, SizableText, YStack } from '@my/ui'

import { redirect } from '../../../../../utils/redirect'

import { DashboardCard, SectionHeading } from '../primitives'

export type ResourceItem = {
  id: string
  title: string
  description: string
  href?: string
  ctaLabel?: string
}

export type ResourceListCardProps = {
  title: string
  subtitle?: string
  resources: ResourceItem[]
}

export const ResourceListCard = ({ title, subtitle, resources }: ResourceListCardProps) => {
  return (
    <DashboardCard gap="$4">
      <SectionHeading title={title} subtitle={subtitle} />
      <YStack gap="$3">
        {resources.map((resource) => (
          <YStack key={resource.id} gap="$1" p="$3" br="$4" bg="$color2">
            <SizableText size="$3" fontWeight="600">
              {resource.title}
            </SizableText>
            {resource.description ? (
              <Paragraph size="$2" color="$gray11">
                {resource.description}
              </Paragraph>
            ) : null}
            {resource.href ? (
              <Button
                size="$2"
                onPress={() => {
                  redirect(resource.href!)
                }}
                alignSelf="flex-start"
                mt="$2"
              >
                {resource.ctaLabel ?? 'View resource'}
              </Button>
            ) : null}
          </YStack>
        ))}
      </YStack>
    </DashboardCard>
  )
}
