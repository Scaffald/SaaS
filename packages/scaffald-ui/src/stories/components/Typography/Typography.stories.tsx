/**
 * Typography Components Stories
 * Demonstrates Heading, Paragraph, Label, Text, and Caption components
 */

import type { Meta, StoryObj } from '@storybook/react'
import { View, StyleSheet } from 'react-native'
import { H1, H2, H3, H4, H5, H6, Paragraph, Label, Text, Caption } from '../../../components/Typography'
import { Stack, Row, Separator } from '../../../components/Layout'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'

const meta: Meta = {
  title: 'Components/Typography',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Typography components for consistent text styling (Heading, Paragraph, Label, Text, Caption).',
      },
    },
  },
}

export default meta

// ============================================================================
// Heading Stories (H1-H6)
// ============================================================================

export const HeadingLevels: StoryObj = {
  name: 'Heading - All Levels',
  render: () => (
    <Stack gap={16}>
      <H1>Heading 1 - 72px Bold</H1>
      <H2>Heading 2 - 60px Bold</H2>
      <H3>Heading 3 - 48px SemiBold</H3>
      <H4>Heading 4 - 36px SemiBold</H4>
      <H5>Heading 5 - 28px SemiBold</H5>
      <H6>Heading 6 - 24px Medium</H6>
    </Stack>
  ),
}

export const HeadingWeights: StoryObj = {
  name: 'Heading - Weights',
  render: () => (
    <Stack gap={12}>
      <View style={styles.labelRow}>
        <Text size="sm" color="secondary">
          weight="bold" (default for H1-H2)
        </Text>
      </View>
      <H3 weight="bold">Bold Heading</H3>

      <View style={styles.labelRow}>
        <Text size="sm" color="secondary">
          weight="semibold" (default for H3-H5)
        </Text>
      </View>
      <H3 weight="semibold">SemiBold Heading</H3>

      <View style={styles.labelRow}>
        <Text size="sm" color="secondary">
          weight="medium" (default for H6)
        </Text>
      </View>
      <H3 weight="medium">Medium Heading</H3>

      <View style={styles.labelRow}>
        <Text size="sm" color="secondary">
          weight="regular"
        </Text>
      </View>
      <H3 weight="regular">Regular Heading</H3>
    </Stack>
  ),
}

export const HeadingColors: StoryObj = {
  name: 'Heading - Colors',
  render: () => (
    <Stack gap={12}>
      <H4 color="primary">Primary Color (default)</H4>
      <H4 color="secondary">Secondary Color</H4>
      <H4 color="tertiary">Tertiary Color</H4>
      <H4 color="disabled">Disabled Color</H4>
      <H4 color="error">Error Color</H4>
      <H4 color="success">Success Color</H4>
      <H4 color="warning">Warning Color</H4>
      <H4 color="#8B5CF6">Custom Color (#8B5CF6)</H4>
    </Stack>
  ),
}

export const HeadingSerif: StoryObj = {
  name: 'Heading - Serif Font',
  render: () => (
    <Stack gap={12}>
      <H2>Sans-serif Heading (default)</H2>
      <H2 serif>Serif Heading</H2>
    </Stack>
  ),
}

// ============================================================================
// Paragraph Stories
// ============================================================================

export const ParagraphSizes: StoryObj = {
  name: 'Paragraph - Sizes',
  render: () => (
    <Stack gap={16}>
      <View>
        <Text size="sm" color="secondary" style={styles.label}>
          size="lg" (18px)
        </Text>
        <Paragraph size="lg">
          Large paragraph text. Great for introductions or lead paragraphs that need extra emphasis.
        </Paragraph>
      </View>

      <View>
        <Text size="sm" color="secondary" style={styles.label}>
          size="md" (16px - default)
        </Text>
        <Paragraph size="md">
          Medium paragraph text. The default size for body content throughout the application.
        </Paragraph>
      </View>

      <View>
        <Text size="sm" color="secondary" style={styles.label}>
          size="sm" (14px)
        </Text>
        <Paragraph size="sm">
          Small paragraph text. Useful for secondary content or helper text below form fields.
        </Paragraph>
      </View>

      <View>
        <Text size="sm" color="secondary" style={styles.label}>
          size="xs" (12px)
        </Text>
        <Paragraph size="xs">
          Extra small paragraph. Good for fine print, legal text, or timestamps.
        </Paragraph>
      </View>
    </Stack>
  ),
}

export const ParagraphWeights: StoryObj = {
  name: 'Paragraph - Weights',
  render: () => (
    <Stack gap={12}>
      <Paragraph weight="regular">Regular weight paragraph (default)</Paragraph>
      <Paragraph weight="medium">Medium weight paragraph</Paragraph>
      <Paragraph weight="semibold">SemiBold weight paragraph</Paragraph>
      <Paragraph weight="bold">Bold weight paragraph</Paragraph>
    </Stack>
  ),
}

export const ParagraphColors: StoryObj = {
  name: 'Paragraph - Colors',
  render: () => (
    <Stack gap={12}>
      <Paragraph color="primary">Primary text (default)</Paragraph>
      <Paragraph color="secondary">Secondary text - for less important content</Paragraph>
      <Paragraph color="tertiary">Tertiary text - for subtle information</Paragraph>
      <Paragraph color="disabled">Disabled text</Paragraph>
      <Paragraph color="error">Error message text</Paragraph>
      <Paragraph color="success">Success message text</Paragraph>
    </Stack>
  ),
}

// ============================================================================
// Label Stories
// ============================================================================

export const LabelBasic: StoryObj = {
  name: 'Label - Basic',
  render: () => (
    <Stack gap={16}>
      <View>
        <Label htmlFor="email">Email Address</Label>
        <View style={styles.inputPlaceholder}>
          <Text size="sm" color="tertiary">
            Input field placeholder
          </Text>
        </View>
      </View>

      <View>
        <Label htmlFor="name" required>
          Full Name
        </Label>
        <View style={styles.inputPlaceholder}>
          <Text size="sm" color="tertiary">
            Required field
          </Text>
        </View>
      </View>

      <View>
        <Label htmlFor="disabled" disabled>
          Disabled Field
        </Label>
        <View style={[styles.inputPlaceholder, styles.inputDisabled]}>
          <Text size="sm" color="disabled">
            Disabled input
          </Text>
        </View>
      </View>
    </Stack>
  ),
}

export const LabelSizes: StoryObj = {
  name: 'Label - Sizes',
  render: () => (
    <Stack gap={12}>
      <Label size="sm">Small Label (12px)</Label>
      <Label size="md">Medium Label (14px - default)</Label>
      <Label size="lg">Large Label (16px)</Label>
    </Stack>
  ),
}

// ============================================================================
// Text Stories (SizableText replacement)
// ============================================================================

export const TextSizes: StoryObj = {
  name: 'Text - Sizes',
  render: () => (
    <Stack gap={8}>
      <Text size="2xl">2XL Text (22px)</Text>
      <Text size="xl">XL Text (20px)</Text>
      <Text size="lg">Large Text (18px)</Text>
      <Text size="md">Medium Text (16px - default)</Text>
      <Text size="sm">Small Text (14px)</Text>
      <Text size="xs">Extra Small Text (12px)</Text>
    </Stack>
  ),
}

export const TextWeights: StoryObj = {
  name: 'Text - Weights',
  render: () => (
    <Stack gap={8}>
      <Text weight="regular">Regular weight</Text>
      <Text weight="medium">Medium weight</Text>
      <Text weight="semibold">SemiBold weight</Text>
      <Text weight="bold">Bold weight</Text>
    </Stack>
  ),
}

export const TextFontFamilies: StoryObj = {
  name: 'Text - Font Families',
  render: () => (
    <Stack gap={12}>
      <Text>Sans-serif (default)</Text>
      <Text serif>Serif font</Text>
      <Text mono>Monospace font - const x = 42;</Text>
    </Stack>
  ),
}

// ============================================================================
// Caption Stories
// ============================================================================

export const CaptionBasic: StoryObj = {
  name: 'Caption - Basic',
  render: () => (
    <Stack gap={8}>
      <Caption>Last updated 2 hours ago</Caption>
      <Caption weight="medium">3 items selected</Caption>
      <Caption color="primary">Important caption</Caption>
      <Caption color="error">Error caption</Caption>
      <Caption color="success">Success caption</Caption>
    </Stack>
  ),
}

// ============================================================================
// API Example
// ============================================================================

export const TypographyAPIExample: StoryObj = {
  name: 'Typography - API Example',
  render: () => (
    <Stack gap={24}>
      <View>
        <Text size="sm" color="secondary" style={styles.label}>
          Usage:
        </Text>
        <Stack gap={8} style={styles.demoBox}>
          <H1>Page Title</H1>
          <H3>Section Title</H3>
          <Paragraph>Body text</Paragraph>
          <Text size="lg">Flexible text</Text>
        </Stack>
        <Text mono size="sm" style={styles.codeBlock}>
          {'<H1>Page Title</H1>\n<H3>Section Title</H3>\n<Paragraph>Body text</Paragraph>\n<Text size="lg">Flexible text</Text>'}
        </Text>
      </View>
    </Stack>
  ),
}

export const CompleteExample: StoryObj = {
  name: 'Combined - Article Layout',
  render: () => (
    <View style={styles.articleContainer}>
      <H1>Getting Started with Beyond UI</H1>
      <Row gap={8} style={styles.meta}>
        <Caption>Published Jan 10, 2026</Caption>
        <Text color="secondary">|</Text>
        <Caption>5 min read</Caption>
      </Row>

      <Separator marginVertical={16} />

      <Paragraph size="lg" weight="medium">
        Beyond UI is a modern React Native component library designed for cross-platform applications.
      </Paragraph>

      <H3 style={styles.sectionHeading}>Typography System</H3>
      <Paragraph>
        The typography system provides a complete set of components for text rendering, including headings,
        paragraphs, labels, and flexible text components. All components use the design system tokens for
        consistent styling.
      </Paragraph>

      <H4 style={styles.sectionHeading}>Key Features</H4>
      <Paragraph size="sm" color="secondary" style={styles.listItem}>
        - Semantic heading levels (H1-H6) with proper accessibility
      </Paragraph>
      <Paragraph size="sm" color="secondary" style={styles.listItem}>
        - Flexible size and weight variants
      </Paragraph>
      <Paragraph size="sm" color="secondary" style={styles.listItem}>
        - Multiple font family support (sans, serif, mono)
      </Paragraph>
      <Paragraph size="sm" color="secondary" style={styles.listItem}>
        - Consistent color semantics
      </Paragraph>

      <Separator marginVertical={16} />

      <Caption>Last updated: January 13, 2026</Caption>
    </View>
  ),
}

const styles = StyleSheet.create({
  labelRow: {
    marginTop: spacing[8],
  },
  label: {
    marginBottom: spacing[4],
  },
  inputPlaceholder: {
    padding: spacing[12],
    backgroundColor: colors.gray[50],
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.gray[200],
    marginTop: spacing[4],
  },
  inputDisabled: {
    backgroundColor: colors.gray[100],
  },
  codeBlock: {
    backgroundColor: colors.gray[100],
    padding: spacing[12],
    borderRadius: 6,
    marginTop: spacing[4],
  },
  demoBox: {
    backgroundColor: colors.gray[50],
    padding: spacing[16],
    borderRadius: 8,
    marginTop: spacing[8],
  },
  articleContainer: {
    maxWidth: 600,
    padding: spacing[16],
  },
  meta: {
    marginTop: spacing[8],
  },
  sectionHeading: {
    marginTop: spacing[24],
    marginBottom: spacing[8],
  },
  listItem: {
    marginLeft: spacing[8],
    marginBottom: spacing[4],
  },
})
