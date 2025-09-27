import React from 'react'
import { YStack, XStack, H1, H2, H3, Text, Paragraph, Card, ScrollView, View } from '@app/ui'

/**
 * Typography Section of Styleguide
 * Showcases text components, headings, and color swatches
 */
export function TypographyScreen() {
  return (
    <ScrollView>
      <YStack f={1} p="$4" gap="$6" maw={1200} mx="auto">
        {/* Header */}
        <YStack gap="$2">
          <H1>Typography</H1>
          <Paragraph color="$gray11" size="$5">
            Text components, headings, and color themes used throughout the application.
          </Paragraph>
        </YStack>

        {/* Typography Section */}
        <Card p="$4" gap="$4">
          <H2>Text Components</H2>
          <YStack gap="$3">
            <H1>Heading 1 - Main Title</H1>
            <H2>Heading 2 - Section Title</H2>
            <H3>Heading 3 - Subsection Title</H3>
            <Text fontSize="$6" fontWeight="600">
              Large Text - Important content
            </Text>
            <Text fontSize="$4">Regular Text - Body content</Text>
            <Text fontSize="$3" color="$gray11">
              Small Text - Secondary information
            </Text>
            <Paragraph>
              This is a paragraph component with multiple lines of text. It's useful for longer
              content that needs proper line spacing and formatting. The paragraph component handles
              text flow and maintains consistent spacing throughout the application.
            </Paragraph>
          </YStack>
        </Card>

        {/* Color Swatches */}
        <Card p="$4" gap="$4">
          <H2>Theme Colors</H2>
          <XStack gap="$3" flexWrap="wrap">
            {(['blue', 'red', 'green', 'purple', 'pink', 'yellow', 'orange', 'gray'] as const).map(
              (color) => (
                <YStack key={color} ai="center" gap="$2">
                  <View
                    w={60}
                    h={60}
                    br="$4"
                    theme={color}
                    bg="$color9"
                    borderWidth={1}
                    borderColor="$borderColor"
                  />
                  <Text size="$2" tt="capitalize">
                    {color}
                  </Text>
                </YStack>
              )
            )}
          </XStack>
        </Card>

        {/* Text Sizes */}
        <Card p="$4" gap="$4">
          <H2>Text Sizes</H2>
          <YStack gap="$3">
            <Text fontSize="$1">Size $1 - Extra small text</Text>
            <Text fontSize="$2">Size $2 - Small text</Text>
            <Text fontSize="$3">Size $3 - Regular text</Text>
            <Text fontSize="$4">Size $4 - Medium text</Text>
            <Text fontSize="$5">Size $5 - Large text</Text>
            <Text fontSize="$6">Size $6 - Extra large text</Text>
            <Text fontSize="$7">Size $7 - Heading text</Text>
            <Text fontSize="$8">Size $8 - Large heading</Text>
            <Text fontSize="$9">Size $9 - Extra large heading</Text>
            <Text fontSize="$10">Size $10 - Display text</Text>
          </YStack>
        </Card>

        {/* Font Weights */}
        <Card p="$4" gap="$4">
          <H2>Font Weights</H2>
          <YStack gap="$3">
            <Text fontWeight="100">Weight 100 - Thin</Text>
            <Text fontWeight="200">Weight 200 - Extra Light</Text>
            <Text fontWeight="300">Weight 300 - Light</Text>
            <Text fontWeight="400">Weight 400 - Regular</Text>
            <Text fontWeight="500">Weight 500 - Medium</Text>
            <Text fontWeight="600">Weight 600 - Semi Bold</Text>
            <Text fontWeight="700">Weight 700 - Bold</Text>
            <Text fontWeight="800">Weight 800 - Extra Bold</Text>
            <Text fontWeight="900">Weight 900 - Black</Text>
          </YStack>
        </Card>

        {/* Color Variations */}
        <Card p="$4" gap="$4">
          <H2>Text Colors</H2>
          <YStack gap="$3">
            <Text color="$color12">Primary text color ($color12)</Text>
            <Text color="$color11">Secondary text color ($color11)</Text>
            <Text color="$color10">Muted text color ($color10)</Text>
            <Text color="$gray12">Gray text ($gray12)</Text>
            <Text color="$gray11">Gray secondary ($gray11)</Text>
            <Text color="$gray10">Gray muted ($gray10)</Text>
            <Text color="$blue11" theme="blue">
              Blue themed text
            </Text>
            <Text color="$green11" theme="green">
              Green themed text
            </Text>
            <Text color="$red11" theme="red">
              Red themed text
            </Text>
            <Text color="$purple11" theme="purple">
              Purple themed text
            </Text>
          </YStack>
        </Card>
      </YStack>
    </ScrollView>
  )
}
