/**
 * Skeleton Components Stories
 * Demonstrates Skeleton, SkeletonText, SkeletonAvatar, SkeletonCard, SkeletonGroup
 */

import type { Meta, StoryObj } from '@storybook/react'
import { View, StyleSheet } from 'react-native'
import {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonGroup,
} from '../../../components/Skeleton'
import { Stack, Row } from '../../../components/Layout'
import { Text, } from '../../../components/Typography'
import { Card, CardContent, } from '../../../components/Card'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'

const meta: Meta = {
  title: 'Components/Skeleton',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Skeleton components provide loading placeholders that show the structure of content while it loads.',
      },
    },
  },
}

export default meta

// ============================================================================
// Basic Skeleton Stories
// ============================================================================

export const BasicSkeleton: StoryObj = {
  name: 'Basic Shapes',
  render: () => (
    <Stack gap={24}>
      <View>
        <Text size="sm" color="secondary" style={styles.label}>
          Rectangle (default)
        </Text>
        <Skeleton width={200} height={40} />
      </View>

      <View>
        <Text size="sm" color="secondary" style={styles.label}>
          Circle
        </Text>
        <Skeleton width={64} height={64} shape="circle" />
      </View>

      <View>
        <Text size="sm" color="secondary" style={styles.label}>
          Text line
        </Text>
        <Skeleton width="80%" height={16} shape="text" />
      </View>

      <View>
        <Text size="sm" color="secondary" style={styles.label}>
          Full width
        </Text>
        <Skeleton height={100} />
      </View>
    </Stack>
  ),
}

export const SkeletonAnimations: StoryObj = {
  name: 'Animations',
  render: () => (
    <Stack gap={24}>
      <View>
        <Text size="sm" color="secondary" style={styles.label}>
          animation="pulse" (default)
        </Text>
        <Skeleton width={200} height={40} animation="pulse" />
      </View>

      <View>
        <Text size="sm" color="secondary" style={styles.label}>
          animation="none"
        </Text>
        <Skeleton width={200} height={40} animation="none" />
      </View>
    </Stack>
  ),
}

// ============================================================================
// SkeletonText Stories
// ============================================================================

export const TextSkeleton: StoryObj = {
  name: 'Text Lines',
  render: () => (
    <Stack gap={24} style={styles.container}>
      <View>
        <Text size="sm" color="secondary" style={styles.label}>
          3 lines (default)
        </Text>
        <SkeletonText />
      </View>

      <View>
        <Text size="sm" color="secondary" style={styles.label}>
          5 lines
        </Text>
        <SkeletonText lines={5} />
      </View>

      <View>
        <Text size="sm" color="secondary" style={styles.label}>
          Single line
        </Text>
        <SkeletonText lines={1} />
      </View>

      <View>
        <Text size="sm" color="secondary" style={styles.label}>
          Last line 80% width
        </Text>
        <SkeletonText lines={3} lastLineWidth="80%" />
      </View>
    </Stack>
  ),
}

// ============================================================================
// SkeletonAvatar Stories
// ============================================================================

export const AvatarSkeleton: StoryObj = {
  name: 'Avatar Sizes',
  render: () => (
    <Stack gap={24}>
      <Text size="sm" color="secondary" style={styles.label}>
        Various avatar sizes
      </Text>
      <Row gap={16} align="center">
        <View style={styles.avatarItem}>
          <SkeletonAvatar size={32} />
          <Text size="xs" color="tertiary">
            32px
          </Text>
        </View>
        <View style={styles.avatarItem}>
          <SkeletonAvatar size={40} />
          <Text size="xs" color="tertiary">
            40px
          </Text>
        </View>
        <View style={styles.avatarItem}>
          <SkeletonAvatar size={48} />
          <Text size="xs" color="tertiary">
            48px
          </Text>
        </View>
        <View style={styles.avatarItem}>
          <SkeletonAvatar size={64} />
          <Text size="xs" color="tertiary">
            64px
          </Text>
        </View>
        <View style={styles.avatarItem}>
          <SkeletonAvatar size={96} />
          <Text size="xs" color="tertiary">
            96px
          </Text>
        </View>
      </Row>
    </Stack>
  ),
}

// ============================================================================
// SkeletonCard Stories
// ============================================================================

export const CardSkeleton: StoryObj = {
  name: 'Card Variants',
  render: () => (
    <Stack gap={24}>
      <View style={styles.cardContainer}>
        <Text size="sm" color="secondary" style={styles.label}>
          Basic card
        </Text>
        <SkeletonCard />
      </View>

      <View style={styles.cardContainer}>
        <Text size="sm" color="secondary" style={styles.label}>
          With media
        </Text>
        <SkeletonCard hasMedia />
      </View>

      <View style={styles.cardContainer}>
        <Text size="sm" color="secondary" style={styles.label}>
          With avatar and media
        </Text>
        <SkeletonCard hasMedia hasAvatar />
      </View>

      <View style={styles.cardContainer}>
        <Text size="sm" color="secondary" style={styles.label}>
          Minimal (2 lines, no media)
        </Text>
        <SkeletonCard textLines={2} />
      </View>
    </Stack>
  ),
}

// ============================================================================
// SkeletonGroup Stories
// ============================================================================

export const GroupSkeleton: StoryObj = {
  name: 'Skeleton Group',
  render: () => (
    <Stack gap={24}>
      <View style={styles.container}>
        <Text size="sm" color="secondary" style={styles.label}>
          Column layout (default)
        </Text>
        <SkeletonGroup gap={12}>
          <Skeleton height={20} />
          <Skeleton height={20} />
          <Skeleton height={20} />
        </SkeletonGroup>
      </View>

      <View>
        <Text size="sm" color="secondary" style={styles.label}>
          Row layout
        </Text>
        <SkeletonGroup gap={16} direction="row">
          <Skeleton width={100} height={100} />
          <Skeleton width={100} height={100} />
          <Skeleton width={100} height={100} />
        </SkeletonGroup>
      </View>
    </Stack>
  ),
}

// ============================================================================
// Real-World Examples
// ============================================================================

export const ListItemSkeleton: StoryObj = {
  name: 'Example - List Items',
  render: () => (
    <Stack gap={16} style={styles.container}>
      <Text size="sm" color="secondary" style={styles.label}>
        User list loading state
      </Text>
      {[1, 2, 3].map((i) => (
        <Row key={i} gap={12} align="center" style={styles.listItem}>
          <SkeletonAvatar size={40} />
          <View style={styles.listItemContent}>
            <Skeleton width={120} height={14} shape="text" />
            <Skeleton width={180} height={12} shape="text" />
          </View>
        </Row>
      ))}
    </Stack>
  ),
}

export const ProfileSkeleton: StoryObj = {
  name: 'Example - Profile Header',
  render: () => (
    <Card style={styles.profileContainer}>
      <CardContent>
        <Stack gap={16} align="center">
          <SkeletonAvatar size={80} />
          <Skeleton width={150} height={24} />
          <Skeleton width={200} height={14} shape="text" />
          <Row gap={24} style={styles.statsRow}>
            <View style={styles.statItem}>
              <Skeleton width={40} height={20} />
              <Skeleton width={50} height={12} shape="text" />
            </View>
            <View style={styles.statItem}>
              <Skeleton width={40} height={20} />
              <Skeleton width={60} height={12} shape="text" />
            </View>
            <View style={styles.statItem}>
              <Skeleton width={40} height={20} />
              <Skeleton width={55} height={12} shape="text" />
            </View>
          </Row>
        </Stack>
      </CardContent>
    </Card>
  ),
}

export const ArticleSkeleton: StoryObj = {
  name: 'Example - Article',
  render: () => (
    <Card style={styles.articleContainer}>
      <Skeleton height={200} borderRadius={0} />
      <CardContent>
        <Stack gap={16}>
          <Row gap={8} align="center">
            <SkeletonAvatar size={32} />
            <Skeleton width={100} height={12} shape="text" />
            <Skeleton width={80} height={12} shape="text" />
          </Row>
          <Skeleton width="80%" height={24} />
          <SkeletonText lines={4} />
        </Stack>
      </CardContent>
    </Card>
  ),
}

export const GridSkeleton: StoryObj = {
  name: 'Example - Grid',
  render: () => (
    <View style={styles.grid}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <View key={i} style={styles.gridItem}>
          <SkeletonCard hasMedia mediaHeight={120} textLines={2} />
        </View>
      ))}
    </View>
  ),
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    maxWidth: 400,
  },
  label: {
    marginBottom: spacing[8],
  },
  avatarItem: {
    alignItems: 'center',
    gap: spacing[4],
  },
  cardContainer: {
    maxWidth: 320,
  },
  listItem: {
    padding: spacing[12],
    backgroundColor: colors.bg.light.subtle,
    borderRadius: 8,
  },
  listItemContent: {
    flex: 1,
    gap: spacing[4],
  },
  profileContainer: {
    maxWidth: 320,
  },
  statsRow: {
    marginTop: spacing[8],
    paddingTop: spacing[16],
    borderTopWidth: 1,
    borderTopColor: colors.border.light.subtle,
  },
  statItem: {
    alignItems: 'center',
    gap: spacing[4],
  },
  articleContainer: {
    maxWidth: 400,
    overflow: 'hidden',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[16],
  },
  gridItem: {
    width: 180,
  },
})
