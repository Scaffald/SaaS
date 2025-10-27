import { Button, XStack, YStack } from '@app/ui'
import {
  AnchorHeading,
  ApiTable,
  DoDontList,
  ExampleBlock,
  StyleguidePage,
  TodoCallout,
} from '../_components'

const apiRows = [
  {
    name: 'theme',
    type: '"primary" | "success" | "warning" | "danger" | "neutral"',
    description: 'Sets semantic color pairing pulled from Tamagui themes.',
  },
  {
    name: 'size',
    type: 'SizeTokens',
    description: 'Adjusts horizontal padding and typography scale.',
    defaultValue: '$4',
  },
  {
    name: 'loading',
    type: 'boolean',
    description: 'Displays spinner overlay and disables interaction.',
    defaultValue: 'false',
  },
]

export default function ButtonsPage() {
  return (
    <StyleguidePage
      title="Buttons"
      description="Semantic, size-aware buttons styled like Bootstrap 2 but rendered with Tamagui primitives."
    >
      <YStack gap="$6">
        <AnchorHeading description="Primary, secondary, and contextual treatments are available via the theme prop.">
          Variants
        </AnchorHeading>
        <ExampleBlock
          title="Semantic button set"
          code={`<XStack gap="$3">\n  <Button theme="primary">Primary</Button>\n  <Button theme="success">Success</Button>\n  <Button theme="warning">Warning</Button>\n  <Button theme="danger">Danger</Button>\n</XStack>`}
        >
          <XStack gap="$3" flexWrap="wrap">
            <Button theme="primary">Primary</Button>
            <Button theme="success">Success</Button>
            <Button theme="warning">Warning</Button>
            <Button theme="danger">Danger</Button>
          </XStack>
        </ExampleBlock>

        <AnchorHeading description="Support small + large sizes for toolbar use cases.">
          Sizes
        </AnchorHeading>
        <ExampleBlock
          title="Size scale"
          code={`<XStack gap="$3">\n  <Button size="$3">Small</Button>\n  <Button size="$4">Default</Button>\n  <Button size="$5">Large</Button>\n</XStack>`}
        >
          <XStack gap="$3" flexWrap="wrap">
            <Button size="$3">Small</Button>
            <Button size="$4">Default</Button>
            <Button size="$5">Large</Button>
          </XStack>
        </ExampleBlock>

        <AnchorHeading description="API surface extracted from Tamagui button props." id="api">
          API
        </AnchorHeading>
        <ApiTable rows={apiRows} />
        <TodoCallout
          id="todo-prop-docs"
          title="Automate prop documentation"
          description="The table above is seeded manually. Hook it up to react-docgen-typescript to ensure parity with @app/ui."
          suggestion="Add a build step that emits JSON for Button props and import it here."
        />

        <AnchorHeading description="Best practices for usage.">
          Usage guidelines
        </AnchorHeading>
        <DoDontList
          items={[
            { do: 'Pair primary buttons with the strongest action on the page.', dont: 'Stack more than one primary button in a row.' },
            { do: 'Use danger for irreversible operations.', dont: 'Use semantic colors purely for aesthetics.' },
          ]}
        />
      </YStack>
    </StyleguidePage>
  )
}
