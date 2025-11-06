// @ts-nocheck
import React from 'react'
import { Paragraph, YStack } from '@app/ui'
import { StyleguidePage } from '../_components/StyleguidePage'
import { AnchorHeading } from '../_components/AnchorHeading'
import { TodoCallout } from '../_components/TodoCallout'

export default function SearchUtilityPage() {
  return (
    <StyleguidePage
      title="Search"
      description="Client-side search index powering quick navigation across the styleguide."
    >
      <YStack gap="$6">
        <AnchorHeading
          id="search-keyboard"
          title="Keyboard shortcut"
          description="Press / anywhere in the styleguide to focus the search input."
        />
        <Paragraph fontSize={13} color="$color10">
          The search component lives in TopNav and filters navigation items by title, description,
          and tags.
        </Paragraph>
        <AnchorHeading
          id="search-roadmap"
          title="Roadmap"
          description="Planned enhancements for production."
        />
        <TodoCallout id="search-index" />
      </YStack>
    </StyleguidePage>
  )
}
