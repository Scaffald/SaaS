/**
 * Card Components Stories
 * Demonstrates Card, CardHeader, CardContent, CardFooter, CardMedia components
 */

import type { Meta, StoryObj } from '@storybook/react'
import { View, StyleSheet } from 'react-native'
import { Card, CardHeader, CardContent, CardFooter, CardMedia } from '../../../components/Card'
import { Button } from '../../../components/Button'
import { Stack, Row } from '../../../components/Layout'
import { H4, Paragraph, Text, Caption } from '../../../components/Typography'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'

const meta: Meta = {
  title: 'Components/Card',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Card is a container component for grouping related content with visual separation. Supports elevated, outlined, and filled variants.',
      },
    },
  },
}

export default meta

// ============================================================================
// Basic Card Stories
// ============================================================================

export const BasicCard: StoryObj = {
  name: 'Basic - Elevated',
  render: () => (
    <Stack gap={24}>
      <Card>
        <CardContent>
          <Paragraph>This is a basic elevated card with default styling.</Paragraph>
        </CardContent>
      </Card>
    </Stack>
  ),
}

export const CardVariants: StoryObj = {
  name: 'Variants',
  render: () => (
    <Stack gap={24}>
      <View>
        <Text size="sm" color="secondary" style={styles.label}>
          variant="elevated" (default)
        </Text>
        <Card variant="elevated">
          <CardContent>
            <Paragraph>Elevated card with shadow for depth.</Paragraph>
          </CardContent>
        </Card>
      </View>

      <View>
        <Text size="sm" color="secondary" style={styles.label}>
          variant="outlined"
        </Text>
        <Card variant="outlined">
          <CardContent>
            <Paragraph>Outlined card with border.</Paragraph>
          </CardContent>
        </Card>
      </View>

      <View>
        <Text size="sm" color="secondary" style={styles.label}>
          variant="filled"
        </Text>
        <Card variant="filled">
          <CardContent>
            <Paragraph>Filled card with subtle background.</Paragraph>
          </CardContent>
        </Card>
      </View>
    </Stack>
  ),
}

export const CardElevations: StoryObj = {
  name: 'Elevation Levels',
  render: () => (
    <Stack gap={24}>
      <View>
        <Text size="sm" color="secondary" style={styles.label}>
          elevation="sm" (default)
        </Text>
        <Card elevation="sm">
          <CardContent>
            <Paragraph>Small elevation - subtle shadow.</Paragraph>
          </CardContent>
        </Card>
      </View>

      <View>
        <Text size="sm" color="secondary" style={styles.label}>
          elevation="md"
        </Text>
        <Card elevation="md">
          <CardContent>
            <Paragraph>Medium elevation - more prominent shadow.</Paragraph>
          </CardContent>
        </Card>
      </View>

      <View>
        <Text size="sm" color="secondary" style={styles.label}>
          elevation="lg"
        </Text>
        <Card elevation="lg">
          <CardContent>
            <Paragraph>Large elevation - strong shadow.</Paragraph>
          </CardContent>
        </Card>
      </View>
    </Stack>
  ),
}

export const CardRadii: StoryObj = {
  name: 'Border Radius',
  render: () => (
    <Row gap={16} style={styles.wrap}>
      <Card radius="sm" variant="outlined">
        <CardContent>
          <Text size="sm">sm (8px)</Text>
        </CardContent>
      </Card>

      <Card radius="md" variant="outlined">
        <CardContent>
          <Text size="sm">md (10px)</Text>
        </CardContent>
      </Card>

      <Card radius="lg" variant="outlined">
        <CardContent>
          <Text size="sm">lg (12px)</Text>
        </CardContent>
      </Card>

      <Card radius="xl" variant="outlined">
        <CardContent>
          <Text size="sm">xl (16px)</Text>
        </CardContent>
      </Card>
    </Row>
  ),
}

// ============================================================================
// Card with Header & Footer
// ============================================================================

export const CardWithHeader: StoryObj = {
  name: 'With Header',
  render: () => (
    <Stack gap={24} style={styles.cardContainer}>
      <Card variant="outlined">
        <CardHeader title="Card Title" subtitle="Optional subtitle text" />
        <CardContent>
          <Paragraph>
            This card has a header with title and subtitle. The header provides a consistent layout
            for card titles.
          </Paragraph>
        </CardContent>
      </Card>
    </Stack>
  ),
}

export const CardWithHeaderAction: StoryObj = {
  name: 'With Header Action',
  render: () => (
    <Stack gap={24} style={styles.cardContainer}>
      <Card variant="outlined">
        <CardHeader
          title="Settings"
          subtitle="Manage your preferences"
          action={
            <Button size="sm" variant="ghost">
              Edit
            </Button>
          }
        />
        <CardContent>
          <Paragraph>The header can include an action element on the right side.</Paragraph>
        </CardContent>
      </Card>
    </Stack>
  ),
}

export const CardWithFooter: StoryObj = {
  name: 'With Footer',
  render: () => (
    <Stack gap={24} style={styles.cardContainer}>
      <Card variant="outlined">
        <CardHeader title="Confirm Action" />
        <CardContent>
          <Paragraph>Are you sure you want to proceed with this action?</Paragraph>
        </CardContent>
        <CardFooter>
          <Button variant="ghost" size="sm">
            Cancel
          </Button>
          <Button size="sm">Confirm</Button>
        </CardFooter>
      </Card>
    </Stack>
  ),
}

export const CardFooterAlignments: StoryObj = {
  name: 'Footer Alignments',
  render: () => (
    <Stack gap={24} style={styles.cardContainer}>
      <Card variant="outlined">
        <CardContent padding="sm">
          <Text size="sm">align="left"</Text>
        </CardContent>
        <CardFooter align="left">
          <Button size="sm">Action 1</Button>
          <Button size="sm" variant="ghost">
            Action 2
          </Button>
        </CardFooter>
      </Card>

      <Card variant="outlined">
        <CardContent padding="sm">
          <Text size="sm">align="center"</Text>
        </CardContent>
        <CardFooter align="center">
          <Button size="sm">Action 1</Button>
          <Button size="sm" variant="ghost">
            Action 2
          </Button>
        </CardFooter>
      </Card>

      <Card variant="outlined">
        <CardContent padding="sm">
          <Text size="sm">align="right" (default)</Text>
        </CardContent>
        <CardFooter align="right">
          <Button size="sm" variant="ghost">
            Cancel
          </Button>
          <Button size="sm">Save</Button>
        </CardFooter>
      </Card>

      <Card variant="outlined">
        <CardContent padding="sm">
          <Text size="sm">align="space-between"</Text>
        </CardContent>
        <CardFooter align="space-between">
          <Button size="sm" variant="ghost">
            Delete
          </Button>
          <Row gap={8}>
            <Button size="sm" variant="ghost">
              Cancel
            </Button>
            <Button size="sm">Save</Button>
          </Row>
        </CardFooter>
      </Card>
    </Stack>
  ),
}

// ============================================================================
// Card with Media
// ============================================================================

export const CardWithMedia: StoryObj = {
  name: 'With Media',
  render: () => (
    <Stack gap={24} style={styles.cardContainer}>
      <Card variant="outlined">
        <CardMedia
          source={{ uri: 'https://picsum.photos/400/200' }}
          height={200}
          alt="Sample image"
        />
        <CardContent>
          <H4>Image Card</H4>
          <Paragraph size="sm" color="secondary">
            Cards can include media content like images at the top.
          </Paragraph>
        </CardContent>
      </Card>
    </Stack>
  ),
}

// ============================================================================
// Pressable Cards
// ============================================================================

export const PressableCard: StoryObj = {
  name: 'Pressable',
  render: () => (
    <Stack gap={24} style={styles.cardContainer}>
      <Card pressable onPress={() => console.log('Card pressed!')}>
        <CardContent>
          <H4>Clickable Card</H4>
          <Paragraph size="sm" color="secondary">
            This entire card is clickable. It provides visual feedback on press.
          </Paragraph>
        </CardContent>
      </Card>

      <Card variant="outlined" pressable onPress={() => console.log('Outlined card pressed!')}>
        <CardContent>
          <H4>Outlined Pressable</H4>
          <Paragraph size="sm" color="secondary">
            Outlined variant also supports pressable interaction.
          </Paragraph>
        </CardContent>
      </Card>

      <Card pressable disabled>
        <CardContent>
          <H4>Disabled Card</H4>
          <Paragraph size="sm" color="secondary">
            This card is disabled and cannot be pressed.
          </Paragraph>
        </CardContent>
      </Card>
    </Stack>
  ),
}

// ============================================================================
// Complete Examples
// ============================================================================

export const ProductCard: StoryObj = {
  name: 'Example - Product Card',
  render: () => (
    <View style={styles.productGrid}>
      <Card variant="outlined" style={styles.productCard}>
        <CardMedia
          source={{ uri: 'https://picsum.photos/300/200?random=1' }}
          height={160}
          alt="Product image"
        />
        <CardContent>
          <Caption color="primary">NEW ARRIVAL</Caption>
          <H4 style={styles.productTitle}>Premium Headphones</H4>
          <Paragraph size="sm" color="secondary">
            Wireless noise-canceling headphones with 30-hour battery life.
          </Paragraph>
          <Row justify="space-between" align="center" style={styles.priceRow}>
            <Text weight="bold" size="lg">
              $299.99
            </Text>
            <Button size="sm">Add to Cart</Button>
          </Row>
        </CardContent>
      </Card>
    </View>
  ),
}

export const ProfileCard: StoryObj = {
  name: 'Example - Profile Card',
  render: () => (
    <View style={styles.cardContainer}>
      <Card>
        <CardHeader
          title="John Doe"
          subtitle="Software Engineer"
          action={
            <Button size="sm" variant="outlined">
              Follow
            </Button>
          }
        />
        <CardContent>
          <Paragraph size="sm">
            Passionate about building great user experiences. Currently working on design systems
            and component libraries.
          </Paragraph>
          <Row gap={16} style={styles.statsRow}>
            <View>
              <Text weight="bold">128</Text>
              <Caption>Posts</Caption>
            </View>
            <View>
              <Text weight="bold">1.2K</Text>
              <Caption>Followers</Caption>
            </View>
            <View>
              <Text weight="bold">456</Text>
              <Caption>Following</Caption>
            </View>
          </Row>
        </CardContent>
      </Card>
    </View>
  ),
}

export const NotificationCard: StoryObj = {
  name: 'Example - Notification Card',
  render: () => (
    <Stack gap={12} style={styles.cardContainer}>
      <Card variant="filled" pressable onPress={() => {}}>
        <CardContent padding="sm">
          <Row gap={12}>
            <View style={styles.notificationIcon}>
              <Text>🔔</Text>
            </View>
            <View style={styles.notificationContent}>
              <Text weight="medium">New message received</Text>
              <Text size="sm" color="secondary">
                You have a new message from Sarah
              </Text>
              <Caption>2 minutes ago</Caption>
            </View>
          </Row>
        </CardContent>
      </Card>

      <Card variant="filled" pressable onPress={() => {}}>
        <CardContent padding="sm">
          <Row gap={12}>
            <View style={styles.notificationIcon}>
              <Text>✅</Text>
            </View>
            <View style={styles.notificationContent}>
              <Text weight="medium">Task completed</Text>
              <Text size="sm" color="secondary">
                Your report has been submitted successfully
              </Text>
              <Caption>1 hour ago</Caption>
            </View>
          </Row>
        </CardContent>
      </Card>
    </Stack>
  ),
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  label: {
    marginBottom: spacing[8],
  },
  wrap: {
    flexWrap: 'wrap',
  },
  cardContainer: {
    maxWidth: 400,
  },
  productGrid: {
    maxWidth: 300,
  },
  productCard: {
    width: '100%',
  },
  productTitle: {
    marginTop: spacing[4],
    marginBottom: spacing[8],
  },
  priceRow: {
    marginTop: spacing[12],
  },
  statsRow: {
    marginTop: spacing[16],
    paddingTop: spacing[16],
    borderTopWidth: 1,
    borderTopColor: colors.border.light.subtle,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.light.emphasis,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
  },
})
