/**
 * List component stories
 * Comprehensive examples showcasing List container with various ListItem variants
 */

import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { View, StyleSheet } from 'react-native'
import { List } from '../../../components/List'
import { ListItem } from '../../../components/ListItem'
import { spacing } from '../../../tokens/spacing'

const meta: Meta<typeof List> = {
  title: 'Components/List',
  component: List,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof List>

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 600,
    padding: spacing[16],
  },
  wideContainer: {
    width: '100%',
    maxWidth: 800,
    padding: spacing[16],
  },
})

// Basic list with tasks (from Figma "List - Master Component" design)
export const Basic: Story = {
  render: () => (
    <View style={styles.container}>
      <List title="List title">
        <ListItem
          variant="task"
          title="Opportunity 1"
          metadata="Opportunity Pipeline"
          updatedText="Updated 10 min ago"
          iconColor="success"
        />
        <ListItem
          variant="task"
          title="Opportunity 2"
          metadata="Opportunity Pipeline"
          updatedText="Updated 14 min ago"
          iconColor="error"
        />
        <ListItem
          variant="task"
          title="Opportunity 3"
          metadata="Opportunity Pipeline"
          updatedText="Updated 18 min ago"
          iconColor="warning"
        />
        <ListItem
          variant="task"
          title="Opportunity 4"
          metadata="Opportunity Pipeline"
          updatedText="Updated 17 min ago"
          iconColor="info"
        />
      </List>
    </View>
  ),
}

// List matching Figma "List - Master Component" design exactly
export const FigmaMasterComponent: Story = {
  render: () => (
    <View style={styles.container}>
      <List title="List title" gap={10}>
        <ListItem
          variant="task"
          title="Opportunity 1"
          metadata="Opportunity Pipeline"
          updatedText="Updated 10 min ago"
          iconColor="success"
        />
        <ListItem
          variant="task"
          title="Opportunity 2"
          metadata="Opportunity Pipeline"
          updatedText="Updated 14 min ago"
          iconColor="error"
        />
        <ListItem
          variant="task"
          title="Opportunity 3"
          metadata="Opportunity Pipeline"
          updatedText="Updated 18 min ago"
          iconColor="warning"
        />
        <ListItem
          variant="task"
          title="Opportunity 4"
          metadata="Opportunity Pipeline"
          updatedText="Updated 17 min ago"
          iconColor="info"
        />
      </List>
    </View>
  ),
}

// List without title
export const WithoutTitle: Story = {
  render: () => (
    <View style={styles.container}>
      <List>
        <ListItem
          variant="task"
          title="Task 1"
          metadata="Pipeline"
          updatedText="Updated 10 min ago"
          iconColor="success"
        />
        <ListItem
          variant="task"
          title="Task 2"
          metadata="Pipeline"
          updatedText="Updated 14 min ago"
          iconColor="error"
        />
      </List>
    </View>
  ),
}

// List with custom gap spacing
export const WithGap: Story = {
  render: () => (
    <View style={styles.container}>
      <List title="List with spacing" gap={16}>
        <ListItem
          variant="task"
          title="Task 1"
          metadata="Pipeline"
          updatedText="Updated 10 min ago"
          iconColor="success"
        />
        <ListItem
          variant="task"
          title="Task 2"
          metadata="Pipeline"
          updatedText="Updated 14 min ago"
          iconColor="error"
        />
      </List>
    </View>
  ),
}

// User profiles list
export const UserProfiles: Story = {
  render: () => (
    <View style={styles.wideContainer}>
      <List title="Team Members">
        <ListItem
          variant="user-profile-01"
          name="Tina Hernandez"
          username="@tinahernan90"
          description="Passionate Senior Product Designer @beyond_ui 🚀 | Crafting delightful user experiences that go beyond expectations"
          avatarSrc="https://i.pravatar.cc/150?img=1"
          showVerified
          onFollowPress={() => console.log('Follow Tina')}
        />
        <ListItem
          variant="user-profile-01"
          name="Alex Chen"
          username="@alexchen"
          description="Full-stack developer passionate about building scalable applications"
          avatarSrc="https://i.pravatar.cc/150?img=2"
          onFollowPress={() => console.log('Follow Alex')}
        />
        <ListItem
          variant="user-profile-02"
          name="Sarah Johnson"
          username="@sarahj"
          subscriptionDate="March 25, 2024"
          avatarSrc="https://i.pravatar.cc/150?img=3"
          onViewProfilePress={() => console.log('View Sarah profile')}
        />
      </List>
    </View>
  ),
}

// Products/Companies list
export const Products: Story = {
  render: () => (
    <View style={styles.wideContainer}>
      <List title="Featured Companies">
        <ListItem
          variant="product"
          name="Flux Co."
          tags={['UX Design', 'Design Systems']}
          count={16}
          onActionPress={() => console.log('View Flux Co.')}
        />
        <ListItem
          variant="product"
          name="Pulse Tech"
          tags={['SaaS', 'Enterprise']}
          count={42}
          onActionPress={() => console.log('View Pulse Tech')}
        />
        <ListItem
          variant="product"
          name="Stella Design"
          tags={['Branding', 'Marketing']}
          count={8}
          onActionPress={() => console.log('View Stella Design')}
        />
      </List>
    </View>
  ),
}

// Search results list
export const SearchResults: Story = {
  render: () => (
    <View style={styles.wideContainer}>
      <List title="Search Results">
        <ListItem
          variant="search-result-01"
          title="Personal Settings"
          timestamp="March 25, 2024 04:53PM"
          breadcrumbs={[
            { label: 'Help Center' },
            { label: 'Manage my account' },
            { label: 'Account billing & payment' },
          ]}
          description="Customize your experience effortlessly with personal settings. Tailor it your way"
          onReadMorePress={() => console.log('Read more')}
        />
        <ListItem
          variant="search-result-02"
          title="Account Security"
          description="Learn how to secure your account with two-factor authentication, strong passwords, and security best practices. Protect your data and privacy with our comprehensive security features."
          authorName="Tina Hernandez"
          authorAvatarSrc="https://i.pravatar.cc/150?img=1"
          updatedText="Updated over a week ago"
        />
        <ListItem
          variant="search-result-03"
          title="Notification Preferences"
          description="Configure how and when you receive notifications. Manage email, push, and in-app notification settings to stay informed without being overwhelmed."
        />
      </List>
    </View>
  ),
}

// Mixed variants list
export const MixedVariants: Story = {
  render: () => (
    <View style={styles.wideContainer}>
      <List title="Recent Activity">
        <ListItem
          variant="task"
          title="Opportunity 4"
          metadata="Opportunity Pipeline"
          updatedText="Updated 10 min ago"
          iconColor="success"
        />
        <ListItem
          variant="integration"
          name="Figma"
          onPress={() => console.log('Open Figma')}
        />
        <ListItem
          variant="cloud-file"
          name="Request Files"
          service="Boxdrop"
          size="24MB"
        />
        <ListItem
          variant="song-title"
          title="Auto Layout (feat. DJ Rectangle)"
          type="Single"
          artist="Beyond UI"
          year="2024"
        />
      </List>
    </View>
  ),
}

// Interactive list with state
export const Interactive: Story = {
  render: () => {
    const [selectedItems, setSelectedItems] = useState<string[]>([])

    const toggleSelection = (id: string) => {
      setSelectedItems((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      )
    }

    return (
      <View style={styles.container}>
        <List title={`Selected: ${selectedItems.length} items`}>
          <ListItem
            variant="task"
            title="Task 1"
            metadata="Pipeline"
            updatedText="Updated 10 min ago"
            iconColor="success"
            onPress={() => toggleSelection('task-1')}
            style={{
              opacity: selectedItems.includes('task-1') ? 0.6 : 1,
            }}
          />
          <ListItem
            variant="task"
            title="Task 2"
            metadata="Pipeline"
            updatedText="Updated 14 min ago"
            iconColor="error"
            onPress={() => toggleSelection('task-2')}
            style={{
              opacity: selectedItems.includes('task-2') ? 0.6 : 1,
            }}
          />
          <ListItem
            variant="task"
            title="Task 3"
            metadata="Pipeline"
            updatedText="Updated 18 min ago"
            iconColor="warning"
            onPress={() => toggleSelection('task-3')}
            style={{
              opacity: selectedItems.includes('task-3') ? 0.6 : 1,
            }}
          />
        </List>
      </View>
    )
  },
}

// Empty state example
export const EmptyState: Story = {
  render: () => (
    <View style={styles.container}>
      <List title="No Items">
        {/* Empty list - demonstrates container styling */}
      </List>
    </View>
  ),
}

// Long list example
export const LongList: Story = {
  render: () => (
    <View style={styles.container}>
      <List title="All Opportunities" gap={8}>
        {Array.from({ length: 10 }, (_, i) => (
          <ListItem
            key={i}
            variant="task"
            title={`Opportunity ${i + 1}`}
            metadata="Opportunity Pipeline"
            updatedText={`Updated ${(i + 1) * 5} min ago`}
            iconColor={i % 4 === 0 ? 'success' : i % 4 === 1 ? 'error' : i % 4 === 2 ? 'warning' : 'info'}
          />
        ))}
      </List>
    </View>
  ),
}
