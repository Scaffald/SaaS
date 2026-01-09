/**
 * SaaSSectionHeader Component Stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { SaaSSectionHeader } from '../../../components/SaaSSectionHeader'
import { View, StyleSheet } from 'react-native'
import { spacing } from '../../../tokens/spacing'
import { BarChart, Settings, Search, Calendar } from 'lucide-react-native'
import { Tabs } from '../../../components/Tabs'

const meta: Meta<typeof SaaSSectionHeader> = {
  title: 'Components/SaaSSectionHeader',
  component: SaaSSectionHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Section header for page content areas with optional tabs, actions, and search.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'ctas', 'search', 'time-period', 'tabs', 'sub-header'],
      description: 'Header variant',
    },
    tabsBelow: {
      control: 'boolean',
      description: 'Whether tabs are shown below header',
    },
  },
}

export default meta
type Story = StoryObj<typeof SaaSSectionHeader>

export const Default: Story = {
  args: {
    variant: 'default',
    title: 'Analytics',
    description: 'Optimize usage with analytics insights',
    featuredIcon: BarChart,
    showIcon: true,
    showDescription: true,
  },
}

export const WithCTAs: Story = {
  args: {
    variant: 'ctas',
    title: 'Analytics',
    description: 'Optimize usage with analytics insights',
    featuredIcon: BarChart,
    actions: [
      { label: 'Export', variant: 'secondary', onPress: () => {} },
      { label: 'Settings', variant: 'primary', onPress: () => {} },
    ],
  },
}

export const WithSearch: Story = {
  args: {
    variant: 'search',
    title: 'Users',
    description: 'Manage your team members',
    featuredIcon: Settings,
    searchValue: '',
    searchPlaceholder: 'Search users...',
    onSearchChange: () => {},
  },
}

export const WithTimePeriod: Story = {
  args: {
    variant: 'time-period',
    title: 'Reports',
    description: 'View detailed reports',
    featuredIcon: Calendar,
    selectedTimePeriod: '7d',
    timePeriodOptions: [
      { label: 'Last 7 days', value: '7d' },
      { label: 'Last 30 days', value: '30d' },
      { label: 'Last 90 days', value: '90d' },
    ],
    onTimePeriodChange: () => {},
  },
}

export const WithTabsBelow: Story = {
  args: {
    variant: 'default',
    title: 'Analytics',
    description: 'Optimize usage with analytics insights',
    featuredIcon: BarChart,
    tabsBelow: true,
    tabs: (
      <Tabs defaultValue="overview">
        <Tabs.Item value="overview">
          <Tabs.Trigger>Overview</Tabs.Trigger>
        </Tabs.Item>
        <Tabs.Item value="transactions">
          <Tabs.Trigger>Transactions</Tabs.Trigger>
        </Tabs.Item>
        <Tabs.Item value="reports">
          <Tabs.Trigger>Reports</Tabs.Trigger>
        </Tabs.Item>
      </Tabs>
    ),
  },
}

export const SubHeader: Story = {
  args: {
    variant: 'sub-header',
    title: 'Settings',
  },
}

export const AllVariants: Story = {
  render: () => (
    <View style={styles.container}>
      <SaaSSectionHeader
        variant="default"
        title="Analytics"
        description="Optimize usage with analytics insights"
        featuredIcon={BarChart}
      />
      <SaaSSectionHeader
        variant="ctas"
        title="Analytics"
        featuredIcon={BarChart}
        actions={[
          { label: 'Export', variant: 'secondary', onPress: () => {} },
          { label: 'Settings', variant: 'primary', onPress: () => {} },
        ]}
      />
      <SaaSSectionHeader
        variant="search"
        title="Search"
        featuredIcon={Search}
        searchValue=""
        searchPlaceholder="Search..."
        onSearchChange={() => {}}
      />
      <SaaSSectionHeader variant="sub-header" title="Sub Header" />
    </View>
  ),
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: spacing[24],
    padding: spacing[16],
    width: '100%',
    maxWidth: 800,
  },
})