import { Button, Paragraph, Text, YStack } from 'tamagui'
import { StyleguidePage, AnchorHeading, ExampleBlock } from './_components'
import { Link } from 'expo-router'

export default function StyleguideHome() {
  return (
    <StyleguidePage
      title="Bootstrap-style Component Library"
      description="A Tamagui-powered documentation hub for Scaffald’s reusable building blocks."
    >
      <YStack gap="$6">
        <AnchorHeading description="Start with the Scaffald workspace and expose the styleguide at /styleguide on web builds.">
          Getting started
        </AnchorHeading>
        <Paragraph>
          Run <Text fontFamily="monospace">pnpm --filter expo-app styleguide:audit</Text> anytime to refresh the audit
          metadata used throughout this guide. Then launch the Expo web runtime with{' '}
          <Text fontFamily="monospace">pnpm --filter expo-app web</Text> and navigate to{' '}
          <Text fontFamily="monospace">/styleguide</Text>.
        </Paragraph>

        <ExampleBlock
          title="Primary button"
          description="Buttons reuse @app/ui primitives so the styleguide stays honest."
          code={`import { Button } from '@app/ui'\n\nexport function PrimaryButton() {\n  return <Button theme="primary">Save changes</Button>\n}`}
        >
          <Button theme="primary">Save changes</Button>
        </ExampleBlock>

        <AnchorHeading level={2} description="Review all outstanding decisions before shipping updates.">
          Approval queue
        </AnchorHeading>
        <Paragraph>
          Track missing assets and implementation details in the{' '}
          <Link href="/styleguide/approval-queue">Approval Queue</Link>. Every{' '}
          <Text fontFamily="monospace">{"//TODO"}</Text>{' '}block links back to that dashboard for quick triage.
        </Paragraph>
      </YStack>
    </StyleguidePage>
  )
}
