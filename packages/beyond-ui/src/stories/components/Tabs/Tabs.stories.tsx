/**
 * Tabs component stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Tabs } from '../../../components/Tabs'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'
import { typography } from '../../../tokens/typography'

const meta = {
  title: 'Components/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

// Example icon components
const SettingsIcon = ({ size, color }: { size: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" role="img" aria-label="Settings icon">
    <circle cx="12" cy="12" r="2" fill={color} />
    <path
      d="M12 4V2M12 22V20M4 12H2M22 12H20M19.07 4.93L17.66 6.34M6.34 17.66L4.93 19.07M19.07 19.07L17.66 17.66M6.34 6.34L4.93 4.93"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
)

const HomeIcon = ({ size, color }: { size: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" role="img" aria-label="Home icon">
    <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 22V12H15V22" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const UserIcon = ({ size, color }: { size: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" role="img" aria-label="User icon">
    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" />
  </svg>
)

// Basic tabs (uncontrolled)
export const Default: Story = {
  render: () => (
    <View style={styles.container}>
      <Tabs defaultValue="tab1">
        <Tabs.Item value="tab1">
          <Tabs.Trigger>Summary</Tabs.Trigger>
          <Tabs.Content>Summary content goes here. This is the default tab.</Tabs.Content>
        </Tabs.Item>
        <Tabs.Item value="tab2">
          <Tabs.Trigger>Transactions</Tabs.Trigger>
          <Tabs.Content>Transactions content goes here. View all your transaction history.</Tabs.Content>
        </Tabs.Item>
        <Tabs.Item value="tab3">
          <Tabs.Trigger>Orders History</Tabs.Trigger>
          <Tabs.Content>Orders history content goes here. Track all your orders.</Tabs.Content>
        </Tabs.Item>
      </Tabs>
    </View>
  ),
}

// Controlled mode
export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState<string>('tab1')

    return (
      <View style={styles.container}>
        <Tabs value={value} onValueChange={setValue}>
          <Tabs.Item value="tab1">
            <Tabs.Trigger>Tab 1</Tabs.Trigger>
            <Tabs.Content>Content for tab 1</Tabs.Content>
          </Tabs.Item>
          <Tabs.Item value="tab2">
            <Tabs.Trigger>Tab 2</Tabs.Trigger>
            <Tabs.Content>Content for tab 2</Tabs.Content>
          </Tabs.Item>
          <Tabs.Item value="tab3">
            <Tabs.Trigger>Tab 3</Tabs.Trigger>
            <Tabs.Content>Content for tab 3</Tabs.Content>
          </Tabs.Item>
        </Tabs>
        <Text style={styles.debug}>Current value: {value}</Text>
      </View>
    )
  },
}

// Type variants
export const TypeVariants: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.variantTitle}>Default Type</Text>
      <Text style={styles.variantDescription}>
        Background color changes on selection with border indicator
      </Text>
      <Tabs type="default" defaultValue="tab1">
        <Tabs.Item value="tab1">
          <Tabs.Trigger>Tab 1</Tabs.Trigger>
          <Tabs.Content>Default type content</Tabs.Content>
        </Tabs.Item>
        <Tabs.Item value="tab2">
          <Tabs.Trigger>Tab 2</Tabs.Trigger>
          <Tabs.Content>Default type content 2</Tabs.Content>
        </Tabs.Item>
      </Tabs>

      <View style={{ marginTop: spacing[32] }} />

      <Text style={styles.variantTitle}>Line Type</Text>
      <Text style={styles.variantDescription}>Border/underline indicator only, no background changes</Text>
      <Tabs type="line" defaultValue="tab1">
        <Tabs.Item value="tab1">
          <Tabs.Trigger>Tab 1</Tabs.Trigger>
          <Tabs.Content>Line type content</Tabs.Content>
        </Tabs.Item>
        <Tabs.Item value="tab2">
          <Tabs.Trigger>Tab 2</Tabs.Trigger>
          <Tabs.Content>Line type content 2</Tabs.Content>
        </Tabs.Item>
      </Tabs>

      <View style={{ marginTop: spacing[32] }} />

      <Text style={styles.variantTitle}>Shadow Type</Text>
      <Text style={styles.variantDescription}>Box shadow for selected tab</Text>
      <Tabs type="shadow" defaultValue="tab1">
        <Tabs.Item value="tab1">
          <Tabs.Trigger>Tab 1</Tabs.Trigger>
          <Tabs.Content>Shadow type content</Tabs.Content>
        </Tabs.Item>
        <Tabs.Item value="tab2">
          <Tabs.Trigger>Tab 2</Tabs.Trigger>
          <Tabs.Content>Shadow type content 2</Tabs.Content>
        </Tabs.Item>
      </Tabs>
    </View>
  ),
}

// Color variants
export const ColorVariants: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.variantTitle}>Gray (Base Gray)</Text>
      <Tabs color="gray" defaultValue="tab1">
        <Tabs.Item value="tab1">
          <Tabs.Trigger>Tab 1</Tabs.Trigger>
          <Tabs.Content>Gray color content</Tabs.Content>
        </Tabs.Item>
        <Tabs.Item value="tab2">
          <Tabs.Trigger>Tab 2</Tabs.Trigger>
          <Tabs.Content>Gray color content 2</Tabs.Content>
        </Tabs.Item>
      </Tabs>

      <View style={{ marginTop: spacing[32] }} />

      <Text style={styles.variantTitle}>Primary (Brand)</Text>
      <Tabs color="primary" defaultValue="tab1">
        <Tabs.Item value="tab1">
          <Tabs.Trigger>Tab 1</Tabs.Trigger>
          <Tabs.Content>Primary color content</Tabs.Content>
        </Tabs.Item>
        <Tabs.Item value="tab2">
          <Tabs.Trigger>Tab 2</Tabs.Trigger>
          <Tabs.Content>Primary color content 2</Tabs.Content>
        </Tabs.Item>
      </Tabs>
    </View>
  ),
}

// Size variants
export const Sizes: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.variantTitle}>Small</Text>
      <Tabs size="sm" defaultValue="tab1">
        <Tabs.Item value="tab1">
          <Tabs.Trigger>Tab 1</Tabs.Trigger>
          <Tabs.Content>Small size content</Tabs.Content>
        </Tabs.Item>
        <Tabs.Item value="tab2">
          <Tabs.Trigger>Tab 2</Tabs.Trigger>
          <Tabs.Content>Small size content 2</Tabs.Content>
        </Tabs.Item>
      </Tabs>

      <View style={{ marginTop: spacing[32] }} />

      <Text style={styles.variantTitle}>Medium (Default)</Text>
      <Tabs size="md" defaultValue="tab1">
        <Tabs.Item value="tab1">
          <Tabs.Trigger>Tab 1</Tabs.Trigger>
          <Tabs.Content>Medium size content</Tabs.Content>
        </Tabs.Item>
        <Tabs.Item value="tab2">
          <Tabs.Trigger>Tab 2</Tabs.Trigger>
          <Tabs.Content>Medium size content 2</Tabs.Content>
        </Tabs.Item>
      </Tabs>

      <View style={{ marginTop: spacing[32] }} />

      <Text style={styles.variantTitle}>Large</Text>
      <Tabs size="lg" defaultValue="tab1">
        <Tabs.Item value="tab1">
          <Tabs.Trigger>Tab 1</Tabs.Trigger>
          <Tabs.Content>Large size content</Tabs.Content>
        </Tabs.Item>
        <Tabs.Item value="tab2">
          <Tabs.Trigger>Tab 2</Tabs.Trigger>
          <Tabs.Content>Large size content 2</Tabs.Content>
        </Tabs.Item>
      </Tabs>
    </View>
  ),
}

// Orientation variants
export const Orientations: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.variantTitle}>Horizontal (Default)</Text>
      <Tabs orientation="horizontal" defaultValue="tab1">
        <Tabs.Item value="tab1">
          <Tabs.Trigger>Tab 1</Tabs.Trigger>
          <Tabs.Content>Horizontal orientation content</Tabs.Content>
        </Tabs.Item>
        <Tabs.Item value="tab2">
          <Tabs.Trigger>Tab 2</Tabs.Trigger>
          <Tabs.Content>Horizontal orientation content 2</Tabs.Content>
        </Tabs.Item>
        <Tabs.Item value="tab3">
          <Tabs.Trigger>Tab 3</Tabs.Trigger>
          <Tabs.Content>Horizontal orientation content 3</Tabs.Content>
        </Tabs.Item>
      </Tabs>

      <View style={{ marginTop: spacing[32] }} />

      <Text style={styles.variantTitle}>Vertical</Text>
      <View style={styles.verticalContainer}>
        <Tabs orientation="vertical" defaultValue="tab1">
          <Tabs.Item value="tab1">
            <Tabs.Trigger>Tab 1</Tabs.Trigger>
            <Tabs.Content>Vertical orientation content</Tabs.Content>
          </Tabs.Item>
          <Tabs.Item value="tab2">
            <Tabs.Trigger>Tab 2</Tabs.Trigger>
            <Tabs.Content>Vertical orientation content 2</Tabs.Content>
          </Tabs.Item>
          <Tabs.Item value="tab3">
            <Tabs.Trigger>Tab 3</Tabs.Trigger>
            <Tabs.Content>Vertical orientation content 3</Tabs.Content>
          </Tabs.Item>
        </Tabs>
      </View>
    </View>
  ),
}

// With icons
export const WithIcons: Story = {
  render: () => (
    <View style={styles.container}>
      <Tabs defaultValue="tab1">
        <Tabs.Item value="tab1">
          <Tabs.Trigger iconStart={HomeIcon}>Home</Tabs.Trigger>
          <Tabs.Content>Home content goes here</Tabs.Content>
        </Tabs.Item>
        <Tabs.Item value="tab2">
          <Tabs.Trigger iconStart={UserIcon}>Profile</Tabs.Trigger>
          <Tabs.Content>Profile content goes here</Tabs.Content>
        </Tabs.Item>
        <Tabs.Item value="tab3">
          <Tabs.Trigger iconStart={SettingsIcon}>Settings</Tabs.Trigger>
          <Tabs.Content>Settings content goes here</Tabs.Content>
        </Tabs.Item>
      </Tabs>
    </View>
  ),
}

// Icon-only tabs
export const IconOnly: Story = {
  render: () => (
    <View style={styles.container}>
      <Tabs defaultValue="tab1">
        <Tabs.Item value="tab1">
          <Tabs.Trigger iconStart={HomeIcon} iconOnly />
          <Tabs.Content>Home content</Tabs.Content>
        </Tabs.Item>
        <Tabs.Item value="tab2">
          <Tabs.Trigger iconStart={UserIcon} iconOnly />
          <Tabs.Content>Profile content</Tabs.Content>
        </Tabs.Item>
        <Tabs.Item value="tab3">
          <Tabs.Trigger iconStart={SettingsIcon} iconOnly />
          <Tabs.Content>Settings content</Tabs.Content>
        </Tabs.Item>
      </Tabs>
    </View>
  ),
}

// Disabled state
export const Disabled: Story = {
  render: () => (
    <View style={styles.container}>
      <Tabs defaultValue="tab1">
        <Tabs.Item value="tab1">
          <Tabs.Trigger>Active Tab</Tabs.Trigger>
          <Tabs.Content>This tab is active and can be clicked.</Tabs.Content>
        </Tabs.Item>
        <Tabs.Item value="tab2" disabled>
          <Tabs.Trigger>Disabled Tab</Tabs.Trigger>
          <Tabs.Content>This tab is disabled and cannot be clicked.</Tabs.Content>
        </Tabs.Item>
        <Tabs.Item value="tab3">
          <Tabs.Trigger>Another Active Tab</Tabs.Trigger>
          <Tabs.Content>This tab is also active.</Tabs.Content>
        </Tabs.Item>
      </Tabs>
    </View>
  ),
}

// All disabled
export const AllDisabled: Story = {
  render: () => (
    <View style={styles.container}>
      <Tabs disabled defaultValue="tab1">
        <Tabs.Item value="tab1">
          <Tabs.Trigger>Tab 1</Tabs.Trigger>
          <Tabs.Content>Content 1</Tabs.Content>
        </Tabs.Item>
        <Tabs.Item value="tab2">
          <Tabs.Trigger>Tab 2</Tabs.Trigger>
          <Tabs.Content>Content 2</Tabs.Content>
        </Tabs.Item>
      </Tabs>
    </View>
  ),
}

// Full width
export const FullWidth: Story = {
  render: () => (
    <View style={styles.fullWidthContainer}>
      <Tabs fullWidth defaultValue="tab1">
        <Tabs.Item value="tab1">
          <Tabs.Trigger>Summary</Tabs.Trigger>
          <Tabs.Content>Full width tab content</Tabs.Content>
        </Tabs.Item>
        <Tabs.Item value="tab2">
          <Tabs.Trigger>Transactions</Tabs.Trigger>
          <Tabs.Content>Full width tab content 2</Tabs.Content>
        </Tabs.Item>
        <Tabs.Item value="tab3">
          <Tabs.Trigger>Settings</Tabs.Trigger>
          <Tabs.Content>Full width tab content 3</Tabs.Content>
        </Tabs.Item>
      </Tabs>
    </View>
  ),
}

// Multiple tabs (like Figma example)
export const MultipleTabs: Story = {
  render: () => (
    <View style={styles.container}>
      <Tabs type="default" size="md" defaultValue="tab1">
        <Tabs.Item value="tab1">
          <Tabs.Trigger>Summary</Tabs.Trigger>
          <Tabs.Content>Summary content</Tabs.Content>
        </Tabs.Item>
        <Tabs.Item value="tab2">
          <Tabs.Trigger>Transactions</Tabs.Trigger>
          <Tabs.Content>Transactions content</Tabs.Content>
        </Tabs.Item>
        <Tabs.Item value="tab3">
          <Tabs.Trigger>Orders History</Tabs.Trigger>
          <Tabs.Content>Orders history content</Tabs.Content>
        </Tabs.Item>
        <Tabs.Item value="tab4">
          <Tabs.Trigger>Services</Tabs.Trigger>
          <Tabs.Content>Services content</Tabs.Content>
        </Tabs.Item>
        <Tabs.Item value="tab5">
          <Tabs.Trigger>Settings</Tabs.Trigger>
          <Tabs.Content>Settings content</Tabs.Content>
        </Tabs.Item>
        <Tabs.Item value="tab6">
          <Tabs.Trigger>Hidden Lists</Tabs.Trigger>
          <Tabs.Content>Hidden lists content</Tabs.Content>
        </Tabs.Item>
        <Tabs.Item value="tab7">
          <Tabs.Trigger>Add More</Tabs.Trigger>
          <Tabs.Content>Add more content</Tabs.Content>
        </Tabs.Item>
      </Tabs>
    </View>
  ),
}

// Bordered content variant
export const BorderedContent: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.variantTitle}>Bordered Content Variant</Text>
      <Text style={styles.variantDescription}>
        Content is styled with border, padding, and background for visual grouping
      </Text>
      <Tabs contentVariant="bordered" defaultValue="tab1">
        <Tabs.Item value="tab1">
          <Tabs.Trigger>Summary</Tabs.Trigger>
          <Tabs.Content>
            <View>
              <Text style={styles.contentTitle}>Summary Overview</Text>
              <Text style={styles.contentText}>
                This is the summary content with bordered styling. The border, padding, and background
                help visually group the content with its tab.
              </Text>
            </View>
          </Tabs.Content>
        </Tabs.Item>
        <Tabs.Item value="tab2">
          <Tabs.Trigger>Transactions</Tabs.Trigger>
          <Tabs.Content>
            <View>
              <Text style={styles.contentTitle}>Transaction History</Text>
              <Text style={styles.contentText}>
                View all your transactions here. The bordered content variant makes it clear this
                content belongs to the selected tab.
              </Text>
            </View>
          </Tabs.Content>
        </Tabs.Item>
        <Tabs.Item value="tab3">
          <Tabs.Trigger>Settings</Tabs.Trigger>
          <Tabs.Content>
            <View>
              <Text style={styles.contentTitle}>Settings Panel</Text>
              <Text style={styles.contentText}>
                Configure your preferences. The bordered variant provides visual separation and
                grouping for the tab content.
              </Text>
            </View>
          </Tabs.Content>
        </Tabs.Item>
      </Tabs>
    </View>
  ),
}

// Trigger sizing variants
export const TriggerSizing: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.variantTitle}>Auto (Content-based width)</Text>
      <Text style={styles.variantDescription}>
        Tabs size based on their content. Tab widths are independent of content width.
      </Text>
      <Tabs triggerSizing="auto" defaultValue="tab1">
        <Tabs.Item value="tab1">
          <Tabs.Trigger>Short</Tabs.Trigger>
          <Tabs.Content>This is a short tab with minimal content.</Tabs.Content>
        </Tabs.Item>
        <Tabs.Item value="tab2">
          <Tabs.Trigger>Medium Length Tab</Tabs.Trigger>
          <Tabs.Content>
            This is a medium length tab with much more extensive content that demonstrates that the
            tab trigger width is completely independent of the content width.
          </Tabs.Content>
        </Tabs.Item>
        <Tabs.Item value="tab3">
          <Tabs.Trigger>Tab 3</Tabs.Trigger>
          <Tabs.Content>Another tab with different content length.</Tabs.Content>
        </Tabs.Item>
      </Tabs>

      <View style={{ marginTop: spacing[32] }} />

      <Text style={styles.variantTitle}>Equal (All tabs same width)</Text>
      <Text style={styles.variantDescription}>
        All tabs have equal width, distributed evenly across the container.
      </Text>
      <Tabs triggerSizing="equal" defaultValue="tab1" fullWidth>
        <Tabs.Item value="tab1">
          <Tabs.Trigger>Short</Tabs.Trigger>
          <Tabs.Content>Short tab content.</Tabs.Content>
        </Tabs.Item>
        <Tabs.Item value="tab2">
          <Tabs.Trigger>Medium Length Tab</Tabs.Trigger>
          <Tabs.Content>Medium tab with longer content.</Tabs.Content>
        </Tabs.Item>
        <Tabs.Item value="tab3">
          <Tabs.Trigger>Tab 3</Tabs.Trigger>
          <Tabs.Content>Tab 3 content.</Tabs.Content>
        </Tabs.Item>
      </Tabs>

      <View style={{ marginTop: spacing[32] }} />

      <Text style={styles.variantTitle}>Fixed (Fixed width based on size)</Text>
      <Text style={styles.variantDescription}>
        All tabs have a fixed width based on the size variant.
      </Text>
      <Tabs triggerSizing="fixed" size="lg" defaultValue="tab1">
        <Tabs.Item value="tab1">
          <Tabs.Trigger>Short</Tabs.Trigger>
          <Tabs.Content>Short tab content.</Tabs.Content>
        </Tabs.Item>
        <Tabs.Item value="tab2">
          <Tabs.Trigger>Medium Length Tab</Tabs.Trigger>
          <Tabs.Content>Medium tab with longer content.</Tabs.Content>
        </Tabs.Item>
        <Tabs.Item value="tab3">
          <Tabs.Trigger>Tab 3</Tabs.Trigger>
          <Tabs.Content>Tab 3 content.</Tabs.Content>
        </Tabs.Item>
      </Tabs>
    </View>
  ),
}

// Interactive playground
export const Playground: Story = {
  render: () => {
    const [value, setValue] = useState<string>('tab1')

    return (
      <View style={styles.playgroundContainer}>
        <Text style={styles.playgroundTitle}>Tabs Playground</Text>
        <Text style={styles.playgroundDescription}>
          Try different combinations of type, color, size, and orientation
        </Text>

        <Tabs
          type="default"
          color="gray"
          size="md"
          orientation="horizontal"
          value={value}
          onValueChange={setValue}
          defaultValue="tab1"
        >
          <Tabs.Item value="tab1">
            <Tabs.Trigger iconStart={HomeIcon}>Home</Tabs.Trigger>
            <Tabs.Content>
              <View style={styles.contentBox}>
                <Text style={styles.contentTitle}>Home</Text>
                <Text style={styles.contentText}>Welcome to the home tab. This is where you'll find your dashboard and overview.</Text>
              </View>
            </Tabs.Content>
          </Tabs.Item>
          <Tabs.Item value="tab2">
            <Tabs.Trigger iconStart={UserIcon}>Profile</Tabs.Trigger>
            <Tabs.Content>
              <View style={styles.contentBox}>
                <Text style={styles.contentTitle}>Profile</Text>
                <Text style={styles.contentText}>Manage your profile settings and preferences here.</Text>
              </View>
            </Tabs.Content>
          </Tabs.Item>
          <Tabs.Item value="tab3">
            <Tabs.Trigger iconStart={SettingsIcon}>Settings</Tabs.Trigger>
            <Tabs.Content>
              <View style={styles.contentBox}>
                <Text style={styles.contentTitle}>Settings</Text>
                <Text style={styles.contentText}>Configure your application settings and preferences.</Text>
              </View>
            </Tabs.Content>
          </Tabs.Item>
        </Tabs>

        <Text style={styles.debug}>Current value: {value}</Text>
      </View>
    )
  },
}

const styles = StyleSheet.create({
  container: {
    minWidth: 500,
    gap: spacing[16],
  },
  verticalContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 300,
  },
  fullWidthContainer: {
    width: 800,
    padding: spacing[16],
  },
  debug: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.small.fontSize,
    color: colors.text.light.tertiary,
    marginTop: spacing[16],
  },
  variantTitle: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    color: colors.text.light.primary,
    marginBottom: spacing[8],
  },
  variantDescription: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.small.fontSize,
    color: colors.text.light.secondary,
    marginBottom: spacing[16],
  },
  playgroundContainer: {
    minWidth: 600,
    gap: spacing[24],
  },
  playgroundTitle: {
    fontFamily: typography.h6.fontFamily,
    fontSize: typography.h6.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    color: colors.text.light.primary,
  },
  playgroundDescription: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.small.fontSize,
    color: colors.text.light.secondary,
  },
  contentBox: {
    padding: spacing[16],
    backgroundColor: colors.bg.light.default,
    borderRadius: 8,
    marginTop: spacing[16],
  },
  contentTitle: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    color: colors.text.light.primary,
    marginBottom: spacing[8],
  },
  contentText: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.small.fontSize,
    color: colors.text.light.secondary,
    lineHeight: typography.small.lineHeight * 1.5,
  },
})

