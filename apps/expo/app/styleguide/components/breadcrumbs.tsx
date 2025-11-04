// @ts-nocheck
import React from 'react'
import { ChevronRight } from '@tamagui/lucide-icons'
import { Text, XStack, YStack } from '@app/ui'
import { StyleguidePage } from '../_components/StyleguidePage'
import { AnchorHeading } from '../_components/AnchorHeading'
import { ExampleCard } from '../_components/ExampleCard'

const trail = ['Home', 'Teams', 'Compliance', 'Training']

export default function BreadcrumbsPage() {
  return (
    <StyleguidePage title="Breadcrumbs" description="Hierarchy trails with responsive truncation.">
      <YStack gap="$6">
        <AnchorHeading
          id="breadcrumbs-basic"
          title="Basic breadcrumb"
          description="Use XStack with separators for Bootstrap-style breadcrumbs."
        />
        <ExampleCard
          title="Trail"
          description="Simple crumb trail with chevron icons."
          code={`<XStack alignItems="center">
  {trail.map((item, index) => (
    <Fragment key={item}>
      <Text>{item}</Text>
      {index < trail.length - 1 ? <ChevronRight size={14} /> : null}
    </Fragment>
  ))}
</XStack>`}
        >
          <BreadcrumbTrail items={trail} />
        </ExampleCard>
      </YStack>
    </StyleguidePage>
  )
}

type BreadcrumbTrailProps = {
  items: string[]
}

const BreadcrumbTrail = ({ items }: BreadcrumbTrailProps) => (
  <XStack alignItems="center" gap="$2" flexWrap="wrap">
    {items.map((item, index) => (
      <React.Fragment key={item}>
        <Text fontSize={12} color={index === items.length - 1 ? '$color11' : '$color10'}>
          {item}
        </Text>
        {index < items.length - 1 ? <ChevronRight size={12} color="var(--color8)" /> : null}
      </React.Fragment>
    ))}
  </XStack>
)
