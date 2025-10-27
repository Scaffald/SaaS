import { Paragraph, Text, YStack } from 'tamagui'
import { StyleguidePage, AnchorHeading, TodoCallout } from '../_components'

export default function GettingStartedPage() {
  return (
    <StyleguidePage
      title="Getting Started"
      description="Spin up the documentation workspace locally and understand how it integrates with the Expo app."
    >
      <YStack gap="$6">
        <AnchorHeading description="Generate the audit JSON and launch the Expo dev server.">Run the tooling</AnchorHeading>
        <Paragraph>
          Install dependencies with <Text fontFamily="monospace">pnpm install</Text>, then refresh the audit snapshot via{' '}
          <Text fontFamily="monospace">pnpm --filter expo-app styleguide:audit</Text>. Start the styleguide using{' '}
          <Text fontFamily="monospace">pnpm --filter expo-app web</Text> and visit{' '}
          <Text fontFamily="monospace">http://localhost:8081/styleguide</Text>.
        </Paragraph>

        <AnchorHeading description="Make the docs site available in production builds.">
          Deploying
        </AnchorHeading>
        <Paragraph>
          The styleguide ships alongside the Expo web export. Netlify pipelines defined in{' '}
          <Text fontFamily="monospace">netlify.toml</Text> will pick up the generated pages. Confirm whether the route should be
          wrapped in the same Supabase auth guard used in <Text fontFamily="monospace">app/_layout.tsx</Text>.
        </Paragraph>

        <TodoCallout
          id="todo-robots"
          title="Add robots.txt rules"
          description="Confirm whether the styleguide is internal-only before the next release."
          suggestion="Block /styleguide via robots.txt unless APP_ENV is production with approved visibility."
        />
      </YStack>
    </StyleguidePage>
  )
}
