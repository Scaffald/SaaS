/**
 * SaaSNavigation Component Stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { SaaSNavigation } from '../../../components/SaaSNavigation'
import { View, StyleSheet } from 'react-native'
import { spacing } from '../../../tokens/spacing'
import { Dashboard } from 'lucide-react-native'
import { Tabs } from '../../../components/Tabs'

const meta: Meta<typeof SaaSNavigation> = {
  title: 'Components/SaaSNavigation',
  component: SaaSNavigation,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Main navigation header component with variants for different use cases.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['main', 'finance-banking', 'left-side-links', 'footer', 'onboarding'],
      description: 'Navigation variant',
    },
    showTabs: {
      control: 'boolean',
      description: 'Whether to show tabs below navigation',
    },
    showNotifications: {
      control: 'boolean',
      description: 'Whether to show notifications',
    },
    showAvatar: {
      control: 'boolean',
      description: 'Whether to show avatar',
    },
  },
}

export default meta
type Story = StoryObj<typeof SaaSNavigation>

export const Default: Story = {
  args: {
    variant: 'main',
    pageTitle: 'Page Title',
    description: 'Description is going here',
    featuredIcon: Dashboard,
    showNotifications: true,
    notificationBadge: 5,
    onNotificationPress: () => {},
    onSearchPress: () => {},
    showCta: true,
    ctaActions: [
      { label: 'Secondary CTA', variant: 'secondary', onPress: () => {} },
      { label: 'Main CTA', variant: 'primary', onPress: () => {} },
    ],
    avatarSrc: 'https://i.pravatar.cc/150?img=1',
  },
}

export const WithBreadcrumbs: Story = {
  args: {
    variant: 'main',
    pageTitle: 'Analytics',
    description: 'View detailed analytics',
    featuredIcon: Dashboard,
    showBreadcrumbs: true,
    breadcrumbItems: [
      { label: 'Home' },
      { label: 'Analytics' },
    ],
    breadcrumbCurrentIndex: 1,
    showNotifications: true,
    avatarSrc: 'https://i.pravatar.cc/150?img=2',
  },
}

export const WithTabs: Story = {
  args: {
    variant: 'main',
    pageTitle: 'Page Title',
    description: 'Description is going here',
    featuredIcon: Dashboard,
    showTabs: true,
    tabs: (
      <Tabs defaultValue="summary" size="md">
        <Tabs.Item value="summary">
          <Tabs.Trigger>Summary</Tabs.Trigger>
        </Tabs.Item>
        <Tabs.Item value="transactions">
          <Tabs.Trigger>Transactions</Tabs.Trigger>
        </Tabs.Item>
        <Tabs.Item value="orders">
          <Tabs.Trigger>Orders History</Tabs.Trigger>
        </Tabs.Item>
        <Tabs.Item value="services">
          <Tabs.Trigger>Services</Tabs.Trigger>
        </Tabs.Item>
        <Tabs.Item value="settings">
          <Tabs.Trigger>Settings</Tabs.Trigger>
        </Tabs.Item>
        <Tabs.Item value="hidden">
          <Tabs.Trigger>Hidden Lists</Tabs.Trigger>
        </Tabs.Item>
        <Tabs.Item value="more">
          <Tabs.Trigger>Add More</Tabs.Trigger>
        </Tabs.Item>
      </Tabs>
    ),
    showNotifications: true,
    notificationBadge: 5,
    showCta: true,
    ctaActions: [
      { label: 'Secondary CTA', variant: 'secondary', onPress: () => {} },
      { label: 'Main CTA', variant: 'primary', onPress: () => {} },
    ],
    avatarSrc: 'https://i.pravatar.cc/150?img=3',
  },
}

export const WithCTAs: Story = {
  args: {
    variant: 'main',
    pageTitle: 'Settings',
    description: 'Manage your account settings',
    featuredIcon: Dashboard,
    showCta: true,
    ctaActions: [
      { label: 'Save', variant: 'primary', onPress: () => {} },
      { label: 'Cancel', variant: 'secondary', onPress: () => {} },
    ],
    showNotifications: true,
    avatarSrc: 'https://i.pravatar.cc/150?img=4',
  },
}

export const WithAvatarGroup: Story = {
  args: {
    variant: 'main',
    pageTitle: 'Team',
    description: 'Manage your team members',
    featuredIcon: Dashboard,
    showAvatarGroup: true,
    showAvatar: false,
    avatarGroupItems: [
      { src: 'https://i.pravatar.cc/150?img=1' },
      { src: 'https://i.pravatar.cc/150?img=2' },
      { src: 'https://i.pravatar.cc/150?img=3' },
      { src: 'https://i.pravatar.cc/150?img=4' },
      { src: 'https://i.pravatar.cc/150?img=5' },
    ],
    showNotifications: true,
  },
}

export const FinanceBanking: Story = {
  args: {
    variant: 'finance-banking',
    pageTitle: 'Banking',
    description: 'Financial overview',
    featuredIcon: Dashboard,
    showBreadcrumbs: true,
    breadcrumbItems: [
      { label: 'Home' },
      { label: 'Finance' },
      { label: 'Banking' },
    ],
    breadcrumbCurrentIndex: 2,
  },
}

export const Footer: Story = {
  args: {
    variant: 'footer',
    pageTitle: 'Footer Navigation',
  },
}

export const Onboarding: Story = {
  args: {
    variant: 'onboarding',
    pageTitle: 'Welcome',
  },
}

export const LeftSideLinks: Story = {
  args: {
    variant: 'left-side-links',
    pageTitle: 'Navigation Links',
  },
}

export const AllVariants: Story = {
  render: () => (
    <View style={styles.container}>
      <SaaSNavigation
        variant="main"
        pageTitle="Main Navigation"
        description="Main navigation with all features"
        featuredIcon={Dashboard}
        showNotifications
        notificationBadge={5}
        avatarSrc="https://i.pravatar.cc/150?img=1"
      />
      <SaaSNavigation
        variant="finance-banking"
        pageTitle="Finance Banking"
        description="Financial overview"
        featuredIcon={Dashboard}
      />
      <SaaSNavigation variant="footer" pageTitle="Footer" />
      <SaaSNavigation variant="onboarding" pageTitle="Onboarding" />
      <SaaSNavigation variant="left-side-links" pageTitle="Left Side Links" />
    </View>
  ),
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: spacing[24],
    padding: spacing[16],
    width: '100%',
  },
})