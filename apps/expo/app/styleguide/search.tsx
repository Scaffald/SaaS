import { Paragraph, Text, YStack } from 'tamagui'
import { AnchorHeading, StyleguidePage, TodoCallout } from './_components'

export default function SearchDocsPage() {
  return (
    <StyleguidePage
      title="Search"
      description="Client-side search over navigation items and design tokens."
    >
      <YStack gap="$6">
        <AnchorHeading description="Press / to focus the search input from any page.">
          Keyboard shortcuts
        </AnchorHeading>
        <Paragraph>
          The search bar currently indexes navigation metadata. Future iterations should include headings and token names for
          deeper coverage.
        </Paragraph>

        <TodoCallout
          id="todo-search"
          title="Finalize full-text search"
          description="Upgrade the search index to include headings, content text, and design tokens with weighting."
          suggestion="Use FlexSearch to generate a static index during build and hydrate in the client."
        />
      </YStack>
    </StyleguidePage>
  )
}
