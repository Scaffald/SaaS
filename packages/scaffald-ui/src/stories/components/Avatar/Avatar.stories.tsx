/**
 * Avatar component stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { View, StyleSheet, Text } from 'react-native'
import { Avatar, AvatarGroup, AddAvatar } from '../../../components/Avatar'
import { ThemeComparison } from '../../../playground'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'
import { typography } from '../../../tokens/typography'

const meta = {
  title: 'Components/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

// Sample icon component
function UserIcon({ size, color }: { size: number; color: string }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: 4,
      }}
    />
  )
}

// Basic avatar with initials
export const Default: Story = {
  args: {
    initials: 'JD',
    size: 40,
  },
}

// Photo avatar
export const Photo: Story = {
  args: {
    src: 'https://i.pravatar.cc/150?img=1',
    alt: 'User avatar',
    size: 40,
  },
}

// All sizes
export const AllSizes: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <Text style={styles.sectionTitle}>Avatar Sizes</Text>
      <View style={styles.sizesRow}>
        <View style={styles.sizeItem}>
          <Avatar initials="JD" size={16} />
          <Text style={styles.sizeLabel}>16px</Text>
        </View>
        <View style={styles.sizeItem}>
          <Avatar initials="JD" size={20} />
          <Text style={styles.sizeLabel}>20px</Text>
        </View>
        <View style={styles.sizeItem}>
          <Avatar initials="JD" size={24} />
          <Text style={styles.sizeLabel}>24px</Text>
        </View>
        <View style={styles.sizeItem}>
          <Avatar initials="JD" size={32} />
          <Text style={styles.sizeLabel}>32px</Text>
        </View>
        <View style={styles.sizeItem}>
          <Avatar initials="JD" size={36} />
          <Text style={styles.sizeLabel}>36px</Text>
        </View>
        <View style={styles.sizeItem}>
          <Avatar initials="JD" size={40} />
          <Text style={styles.sizeLabel}>40px</Text>
        </View>
      </View>
      <View style={styles.sizesRow}>
        <View style={styles.sizeItem}>
          <Avatar initials="JD" size={48} />
          <Text style={styles.sizeLabel}>48px</Text>
        </View>
        <View style={styles.sizeItem}>
          <Avatar initials="JD" size={56} />
          <Text style={styles.sizeLabel}>56px</Text>
        </View>
        <View style={styles.sizeItem}>
          <Avatar initials="JD" size={64} />
          <Text style={styles.sizeLabel}>64px</Text>
        </View>
        <View style={styles.sizeItem}>
          <Avatar initials="JD" size={72} />
          <Text style={styles.sizeLabel}>72px</Text>
        </View>
        <View style={styles.sizeItem}>
          <Avatar initials="JD" size={80} />
          <Text style={styles.sizeLabel}>80px</Text>
        </View>
      </View>
    </View>
  ),
}

// All colors
export const AllColors: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <Text style={styles.sectionTitle}>Avatar Colors</Text>
      <View style={styles.colorsRow}>
        <View style={styles.colorItem}>
          <Avatar initials="JD" color="gray" size={48} />
          <Text style={styles.colorLabel}>Gray</Text>
        </View>
        <View style={styles.colorItem}>
          <Avatar initials="JD" color="primary" size={48} />
          <Text style={styles.colorLabel}>Primary</Text>
        </View>
        <View style={styles.colorItem}>
          <Avatar initials="JD" color="info" size={48} />
          <Text style={styles.colorLabel}>Info</Text>
        </View>
        <View style={styles.colorItem}>
          <Avatar initials="JD" color="success" size={48} />
          <Text style={styles.colorLabel}>Success</Text>
        </View>
        <View style={styles.colorItem}>
          <Avatar initials="JD" color="warning" size={48} />
          <Text style={styles.colorLabel}>Warning</Text>
        </View>
        <View style={styles.colorItem}>
          <Avatar initials="JD" color="error" size={48} />
          <Text style={styles.colorLabel}>Error</Text>
        </View>
      </View>
    </View>
  ),
}

// Avatar types
export const AvatarTypes: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <Text style={styles.sectionTitle}>Avatar Types</Text>
      <View style={styles.typesRow}>
        <View style={styles.typeItem}>
          <Avatar src="https://i.pravatar.cc/150?img=2" size={56} />
          <Text style={styles.typeLabel}>Photo</Text>
        </View>
        <View style={styles.typeItem}>
          <Avatar initials="AB" color="primary" size={56} />
          <Text style={styles.typeLabel}>Initials</Text>
        </View>
        <View style={styles.typeItem}>
          <Avatar icon={<UserIcon size={24} color={colors.gray[600]} />} size={56} />
          <Text style={styles.typeLabel}>Icon</Text>
        </View>
        <View style={styles.typeItem}>
          <Avatar
            icon={<UserIcon size={32} color={colors.primary[600]} />}
            color="primary"
            size={56}
          />
          <Text style={styles.typeLabel}>Logo</Text>
        </View>
      </View>
    </View>
  ),
}

// With ring
export const WithRing: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <Text style={styles.sectionTitle}>Avatars With Ring</Text>
      <View style={styles.row}>
        <Avatar initials="JD" showRing size={48} />
        <Avatar initials="AB" color="primary" showRing size={48} />
        <Avatar initials="CD" color="success" showRing size={48} />
        <Avatar src="https://i.pravatar.cc/150?img=3" showRing size={48} />
      </View>
    </View>
  ),
}

// Status indicators
export const StatusIndicators: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <Text style={styles.sectionTitle}>Status Indicators</Text>
      <View style={styles.row}>
        <View style={styles.statusItem}>
          <Avatar initials="JD" status="online" size={56} />
          <Text style={styles.statusLabel}>Online</Text>
        </View>
        <View style={styles.statusItem}>
          <Avatar initials="AB" status="offline" size={56} />
          <Text style={styles.statusLabel}>Offline</Text>
        </View>
        <View style={styles.statusItem}>
          <Avatar initials="CD" status="busy" size={56} />
          <Text style={styles.statusLabel}>Busy</Text>
        </View>
        <View style={styles.statusItem}>
          <Avatar initials="EF" status="away" size={56} />
          <Text style={styles.statusLabel}>Away</Text>
        </View>
      </View>
    </View>
  ),
}

// Badge variants
export const BadgeVariants: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <Text style={styles.sectionTitle}>Badge Variants</Text>
      <View style={styles.row}>
        <View style={styles.badgeItem}>
          <Avatar initials="JD" verified size={56} />
          <Text style={styles.badgeLabel}>Verified</Text>
        </View>
        <View style={styles.badgeItem}>
          <Avatar initials="AB" star size={56} />
          <Text style={styles.badgeLabel}>Star</Text>
        </View>
        <View style={styles.badgeItem}>
          <Avatar
            initials="CD"
            badge={
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: colors.purple[500],
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontSize: 10 }}>🏢</Text>
              </View>
            }
            size={56}
          />
          <Text style={styles.badgeLabel}>Custom</Text>
        </View>
      </View>
    </View>
  ),
}

// Avatar group
export const GroupExample: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <Text style={styles.sectionTitle}>Avatar Group</Text>
      <AvatarGroup size={40} max={5}>
        <Avatar src="https://i.pravatar.cc/150?img=1" />
        <Avatar initials="AB" color="primary" />
        <Avatar initials="CD" color="success" />
        <Avatar src="https://i.pravatar.cc/150?img=4" />
        <Avatar initials="EF" color="warning" />
        <Avatar initials="GH" color="error" />
        <Avatar initials="IJ" color="info" />
      </AvatarGroup>

      <Text style={[styles.sectionTitle, { marginTop: spacing[24] }]}>Different Sizes</Text>
      <View style={styles.groupSizesContainer}>
        <AvatarGroup size={32} max={4}>
          <Avatar initials="AB" color="primary" />
          <Avatar initials="CD" color="success" />
          <Avatar initials="EF" color="warning" />
          <Avatar initials="GH" color="error" />
          <Avatar initials="IJ" color="info" />
        </AvatarGroup>

        <AvatarGroup size={48} max={3}>
          <Avatar src="https://i.pravatar.cc/150?img=5" />
          <Avatar initials="AB" color="primary" />
          <Avatar initials="CD" color="success" />
          <Avatar initials="EF" color="warning" />
        </AvatarGroup>
      </View>
    </View>
  ),
}

// Add avatar button
export const AddAvatarButton: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <Text style={styles.sectionTitle}>Add Avatar Button</Text>
      <View style={styles.row}>
        <AddAvatar size={40} onPress={() => console.log('Add avatar clicked')} />
        <AddAvatar size={48} onPress={() => console.log('Add avatar clicked')} />
        <AddAvatar size={56} onPress={() => console.log('Add avatar clicked')} />
      </View>

      <Text style={[styles.sectionTitle, { marginTop: spacing[24] }]}>In Avatar Group</Text>
      <AvatarGroup size={40}>
        <Avatar initials="AB" color="primary" />
        <Avatar initials="CD" color="success" />
        <Avatar initials="EF" color="warning" />
        <AddAvatar onPress={() => console.log('Add avatar clicked')} />
      </AvatarGroup>
    </View>
  ),
}

// Clickable avatars
export const Clickable: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <Text style={styles.sectionTitle}>Clickable Avatars</Text>
      <View style={styles.row}>
        <Avatar initials="JD" size={48} onPress={() => console.log('Avatar clicked')} />
        <Avatar
          src="https://i.pravatar.cc/150?img=6"
          size={48}
          onPress={() => console.log('Avatar clicked')}
        />
        <Avatar
          initials="AB"
          color="primary"
          verified
          size={48}
          onPress={() => console.log('Avatar clicked')}
        />
      </View>
    </View>
  ),
}

// Theme variants
export const ThemeVariants: Story = {
  render: () => (
    <ThemeComparison>
      {() => (
        <View style={styles.variantsContainer}>
          <View style={styles.row}>
            <Avatar initials="JD" size={48} />
            <Avatar initials="AB" color="primary" size={48} />
            <Avatar src="https://i.pravatar.cc/150?img=7" status="online" size={48} />
            <Avatar initials="CD" verified size={48} />
          </View>
          <AvatarGroup size={40} max={4} containerStyle={{ marginTop: spacing[16] }}>
            <Avatar initials="AB" color="primary" />
            <Avatar initials="CD" color="success" />
            <Avatar initials="EF" color="warning" />
            <Avatar initials="GH" color="error" />
            <Avatar initials="IJ" color="info" />
          </AvatarGroup>
        </View>
      )}
    </ThemeComparison>
  ),
}

// Complex example
export const ComplexExample: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <Text style={styles.sectionTitle}>Complex Example</Text>
      <View style={styles.complexContainer}>
        <Avatar
          src="https://i.pravatar.cc/150?img=8"
          size={80}
          showRing
          color="primary"
          status="online"
          verified
        />
        <View style={styles.complexInfo}>
          <Text style={styles.complexName}>John Doe</Text>
          <Text style={styles.complexRole}>Product Designer</Text>
          <Text style={styles.complexStatus}>● Online</Text>
        </View>
      </View>

      <View style={[styles.complexContainer, { marginTop: spacing[24] }]}>
        <Avatar initials="AB" size={64} showRing color="success" status="busy" star />
        <View style={styles.complexInfo}>
          <Text style={styles.complexName}>Alice Brown</Text>
          <Text style={styles.complexRole}>Engineering Lead</Text>
          <Text style={styles.complexStatus}>● Busy</Text>
        </View>
      </View>
    </View>
  ),
}

const styles = StyleSheet.create({
  variantsContainer: {
    gap: spacing[16],
    padding: spacing[16],
    width: 600,
  },
  sectionTitle: {
    fontFamily: typography.h6.fontFamily,
    fontSize: typography.h6.fontSize,
    fontWeight: typography.h6.fontWeight,
    lineHeight: typography.h6.lineHeight,
    color: colors.text.light.primary,
    marginBottom: spacing[8],
  },
  sizesRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing[16],
    flexWrap: 'wrap',
  },
  sizeItem: {
    alignItems: 'center',
    gap: spacing[8],
  },
  sizeLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: typography.caption.fontSize,
    color: colors.text.light.secondary,
  },
  colorsRow: {
    flexDirection: 'row',
    gap: spacing[16],
    flexWrap: 'wrap',
  },
  colorItem: {
    alignItems: 'center',
    gap: spacing[8],
  },
  colorLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: typography.caption.fontSize,
    color: colors.text.light.secondary,
  },
  typesRow: {
    flexDirection: 'row',
    gap: spacing[16],
    flexWrap: 'wrap',
  },
  typeItem: {
    alignItems: 'center',
    gap: spacing[8],
  },
  typeLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: typography.caption.fontSize,
    color: colors.text.light.secondary,
  },
  row: {
    flexDirection: 'row',
    gap: spacing[16],
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  statusItem: {
    alignItems: 'center',
    gap: spacing[8],
  },
  statusLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: typography.caption.fontSize,
    color: colors.text.light.secondary,
  },
  badgeItem: {
    alignItems: 'center',
    gap: spacing[8],
  },
  badgeLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: typography.caption.fontSize,
    color: colors.text.light.secondary,
  },
  groupSizesContainer: {
    gap: spacing[16],
  },
  complexContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[16],
  },
  complexInfo: {
    gap: spacing[4],
  },
  complexName: {
    fontFamily: typography.h6.fontFamily,
    fontSize: typography.h6.fontSize,
    fontWeight: typography.h6.fontWeight,
    color: colors.text.light.primary,
  },
  complexRole: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    color: colors.text.light.secondary,
  },
  complexStatus: {
    fontFamily: typography.caption.fontFamily,
    fontSize: typography.caption.fontSize,
    color: colors.green[600],
  },
})
