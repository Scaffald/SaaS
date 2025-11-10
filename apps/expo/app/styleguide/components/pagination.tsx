// @ts-nocheck
import React, { useState } from 'react'
import { Button, XStack, YStack } from '@app/ui'
import { ChevronLeft, ChevronRight } from '@tamagui/lucide-icons'
import { StyleguidePage } from '@app/styleguide'
import { AnchorHeading } from '@app/styleguide'
import { ExampleCard } from '@app/styleguide'

const pages = [1, 2, 3, 4, 5]

export default function PaginationPage() {
  const [current, setCurrent] = useState(2)

  return (
    <StyleguidePage
      title="Pagination"
      description="Offset pagination controls with icon buttons and ellipsis support."
    >
      <YStack gap="$6">
        <AnchorHeading
          id="pagination-default"
          title="Default"
          description="Use Buttons arranged in XStack with consistent spacing."
        />
        <ExampleCard
          title="Pager"
          description="Icon buttons plus numbered pages."
          code={`<XStack gap="$2">
  <Button icon={ChevronLeft} disabled={current === 1} />
  {pages.map((page) => (
    <Button key={page} bg={page === current ? '$color9' : '$color2'}>
      {page}
    </Button>
  ))}
  <Button icon={ChevronRight} />
</XStack>`}
        >
          <XStack gap="$2" alignItems="center">
            <Button
              icon={ChevronLeft}
              disabled={current === 1}
              onPress={() => setCurrent(Math.max(1, current - 1))}
            />
            {pages.map((page) => (
              <Button
                key={page}
                bg={page === current ? '$color9' : '$color2'}
                color={page === current ? '$color1' : '$color11'}
                onPress={() => setCurrent(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              icon={ChevronRight}
              disabled={current === pages.length}
              onPress={() => setCurrent(Math.min(pages.length, current + 1))}
            />
          </XStack>
        </ExampleCard>
      </YStack>
    </StyleguidePage>
  )
}
