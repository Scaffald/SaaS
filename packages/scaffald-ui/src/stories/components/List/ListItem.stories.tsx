/**
 * ListItem component stories
 * Comprehensive examples showcasing all 11 ListItem variants
 */

import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { View, StyleSheet } from 'react-native'
import { ListItem } from '../../../components/ListItem'
import { spacing } from '../../../tokens/spacing'

const meta: Meta<typeof ListItem> = {
  title: 'Components/ListItem',
  component: ListItem,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof ListItem>

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

// User Profile Variants
export const UserProfile01: Story = {
  render: () => (
    <View style={styles.wideContainer}>
      <ListItem
        variant="user-profile-01"
        name="Tina Hernandez"
        username="@tinahernan90"
        description="Passionate Senior Product Designer @beyond_ui 🚀 | Crafting delightful user experiences that go beyond expectations"
        avatarSrc="https://i.pravatar.cc/150?img=1"
        showVerified
        onFollowPress={() => console.log('Follow pressed')}
      />
    </View>
  ),
}

export const UserProfile01WithoutDescription: Story = {
  render: () => (
    <View style={styles.wideContainer}>
      <ListItem
        variant="user-profile-01"
        name="Alex Chen"
        username="@alexchen"
        avatarSrc="https://i.pravatar.cc/150?img=2"
        onFollowPress={() => console.log('Follow pressed')}
      />
    </View>
  ),
}

export const UserProfile02: Story = {
  render: () => (
    <View style={styles.wideContainer}>
      <ListItem
        variant="user-profile-02"
        name="Tina Hernandez"
        username="@tinahernan90"
        subscriptionDate="March 25, 2024"
        avatarSrc="https://i.pravatar.cc/150?img=1"
        onViewProfilePress={() => console.log('View profile pressed')}
      />
    </View>
  ),
}

// Product Variant
export const Product: Story = {
  render: () => (
    <View style={styles.wideContainer}>
      <ListItem
        variant="product"
        name="Flux Co."
        tags={['UX Design', 'Design Systems']}
        count={16}
        onActionPress={() => console.log('Action pressed')}
      />
    </View>
  ),
}

export const ProductWithManyTags: Story = {
  render: () => (
    <View style={styles.wideContainer}>
      <ListItem
        variant="product"
        name="Pulse Tech"
        tags={['SaaS', 'Enterprise', 'Cloud', 'AI', 'Analytics']}
        count={42}
        onActionPress={() => console.log('Action pressed')}
      />
    </View>
  ),
}

export const ProductWithoutCount: Story = {
  render: () => (
    <View style={styles.wideContainer}>
      <ListItem
        variant="product"
        name="Stella Design"
        tags={['Branding', 'Marketing']}
        onActionPress={() => console.log('Action pressed')}
      />
    </View>
  ),
}

// Search Result Variants
export const SearchResult01: Story = {
  render: () => (
    <View style={styles.wideContainer}>
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
        onReadMorePress={() => console.log('Read more pressed')}
      />
    </View>
  ),
}

export const SearchResult01WithoutBreadcrumbs: Story = {
  render: () => (
    <View style={styles.wideContainer}>
      <ListItem
        variant="search-result-01"
        title="Account Security"
        timestamp="March 20, 2024 10:30AM"
        description="Learn how to secure your account with two-factor authentication and strong passwords."
        onReadMorePress={() => console.log('Read more pressed')}
      />
    </View>
  ),
}

export const SearchResult02: Story = {
  render: () => (
    <View style={styles.wideContainer}>
      <ListItem
        variant="search-result-02"
        title="Personal Settings"
        description="Unlock a world of personalization with our comprehensive suite of personal settings. Tailor every detail of your experience, from preferences to security, effortlessly. Your journey, your choices. Elevate your interaction and make our platform uniquely yours."
        authorName="Tina Hernandez"
        authorAvatarSrc="https://i.pravatar.cc/150?img=1"
        updatedText="Updated over a week ago"
      />
    </View>
  ),
}

export const SearchResult02WithoutAuthor: Story = {
  render: () => (
    <View style={styles.wideContainer}>
      <ListItem
        variant="search-result-02"
        title="Getting Started Guide"
        description="Welcome to our platform! This comprehensive guide will help you get started with all the features and tools available to you. Learn the basics, explore advanced features, and make the most of your experience."
        updatedText="Updated 2 days ago"
      />
    </View>
  ),
}

export const SearchResult03: Story = {
  render: () => (
    <View style={styles.wideContainer}>
      <ListItem
        variant="search-result-03"
        title="Personal Settings"
        description="Unlock a world of personalization with our comprehensive suite of personal settings. Tailor every detail of your experience..."
      />
    </View>
  ),
}

// Task Variant
export const Task: Story = {
  render: () => (
    <View style={styles.container}>
      <ListItem
        variant="task"
        title="Opportunity 4"
        metadata="Opportunity Pipeline"
        updatedText="Updated 10 min ago"
        iconColor="success"
      />
    </View>
  ),
}

export const TaskAllColors: Story = {
  render: () => (
    <View style={styles.container}>
      <ListItem
        variant="task"
        title="Task Success"
        metadata="Pipeline"
        updatedText="Updated 10 min ago"
        iconColor="success"
      />
      <ListItem
        variant="task"
        title="Task Error"
        metadata="Pipeline"
        updatedText="Updated 14 min ago"
        iconColor="error"
      />
      <ListItem
        variant="task"
        title="Task Warning"
        metadata="Pipeline"
        updatedText="Updated 18 min ago"
        iconColor="warning"
      />
      <ListItem
        variant="task"
        title="Task Info"
        metadata="Pipeline"
        updatedText="Updated 20 min ago"
        iconColor="info"
      />
    </View>
  ),
}

// All Variants Showcase - matches Figma "Lists Base Elements" design
export const AllVariantsShowcase: Story = {
  render: () => (
    <View style={styles.wideContainer}>
      <ListItem
        variant="user-profile-01"
        name="Tina Hernandez"
        username="@tinahernan90"
        description="Passionate Senior Product Designer @beyond_ui 🚀 | Crafting delightful user experiences that go beyond expectations"
        avatarSrc="https://i.pravatar.cc/150?img=1"
        showVerified
        onFollowPress={() => console.log('Follow pressed')}
      />
      <ListItem
        variant="user-profile-02"
        name="Tina Hernandez"
        username="@tinahernan90"
        subscriptionDate="March 25, 2024"
        avatarSrc="https://i.pravatar.cc/150?img=1"
        onViewProfilePress={() => console.log('View profile pressed')}
      />
      <ListItem
        variant="product"
        name="Flux Co."
        tags={['UX Design', 'Design Systems']}
        count={16}
        onActionPress={() => console.log('Action pressed')}
      />
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
        onReadMorePress={() => console.log('Read more pressed')}
      />
      <ListItem
        variant="search-result-02"
        title="Personal Settings"
        description="Unlock a world of personalization with our comprehensive suite of personal settings. Tailor every detail of your experience, from preferences to security, effortlessly. Your journey, your choices. Elevate your interaction and make our platform uniquely yours."
        authorName="Tina Hernandez"
        authorAvatarSrc="https://i.pravatar.cc/150?img=1"
        updatedText="Updated over a week ago"
      />
      <ListItem
        variant="search-result-03"
        title="Personal Settings"
        description="Unlock a world of personalization with our comprehensive suite of personal settings. Tailor every detail of your experience..."
      />
      <ListItem
        variant="task"
        title="Opportunity 4"
        metadata="Opportunity Pipeline"
        updatedText="Updated 10 min ago"
        iconColor="success"
      />
      <ListItem
        variant="song-title"
        title="Auto Layout (feat. DJ Rectangle)"
        type="Single"
        artist="Beyond UI"
        year="2024"
        imageSrc="https://via.placeholder.com/50"
      />
      <ListItem
        variant="cloud-file"
        name="Request Files"
        service="Boxdrop"
        size="24MB"
      />
      <ListItem
        variant="phone-number"
        countryCode="+1"
        countryName="United States"
      />
      <ListItem
        variant="integration"
        name="Figma"
        onPress={() => console.log('Integration pressed')}
      />
    </View>
  ),
}

export const TaskMinimal: Story = {
  render: () => (
    <View style={styles.container}>
      <ListItem
        variant="task"
        title="Simple Task"
        iconColor="success"
      />
    </View>
  ),
}

// Song Title Variant
export const SongTitle: Story = {
  render: () => (
    <View style={styles.container}>
      <ListItem
        variant="song-title"
        title="Auto Layout (feat. DJ Rectangle)"
        type="Single"
        artist="Beyond UI"
        year="2024"
      />
    </View>
  ),
}

export const SongTitleMinimal: Story = {
  render: () => (
    <View style={styles.container}>
      <ListItem
        variant="song-title"
        title="Song Title Only"
      />
    </View>
  ),
}

// Cloud File Variant
export const CloudFile: Story = {
  render: () => (
    <View style={styles.container}>
      <ListItem
        variant="cloud-file"
        name="Request Files"
        service="Boxdrop"
        size="24MB"
      />
    </View>
  ),
}

export const CloudFileDifferentServices: Story = {
  render: () => (
    <View style={styles.container}>
      <ListItem
        variant="cloud-file"
        name="Project Documents"
        service="Google Drive"
        size="156MB"
      />
      <ListItem
        variant="cloud-file"
        name="Design Assets"
        service="Dropbox"
        size="89MB"
      />
      <ListItem
        variant="cloud-file"
        name="Code Repository"
        service="GitHub"
        size="2.3GB"
      />
    </View>
  ),
}

// Phone Number Variant
export const PhoneNumber: Story = {
  render: () => (
    <View style={styles.container}>
      <ListItem
        variant="phone-number"
        countryCode="+1"
        countryName="United States"
      />
    </View>
  ),
}

export const PhoneNumberMultiple: Story = {
  render: () => (
    <View style={styles.container}>
      <ListItem
        variant="phone-number"
        countryCode="+1"
        countryName="United States"
      />
      <ListItem
        variant="phone-number"
        countryCode="+44"
        countryName="United Kingdom"
      />
      <ListItem
        variant="phone-number"
        countryCode="+33"
        countryName="France"
      />
      <ListItem
        variant="phone-number"
        countryCode="+49"
        countryName="Germany"
      />
    </View>
  ),
}

// Integration Variant
export const Integration: Story = {
  render: () => (
    <View style={styles.container}>
      <ListItem
        variant="integration"
        name="Figma"
        onPress={() => console.log('Integration pressed')}
      />
    </View>
  ),
}

export const IntegrationMultiple: Story = {
  render: () => (
    <View style={styles.container}>
      <ListItem
        variant="integration"
        name="Figma"
        onPress={() => console.log('Figma pressed')}
      />
      <ListItem
        variant="integration"
        name="Slack"
        onPress={() => console.log('Slack pressed')}
      />
      <ListItem
        variant="integration"
        name="GitHub"
        onPress={() => console.log('GitHub pressed')}
      />
      <ListItem
        variant="integration"
        name="Notion"
        onPress={() => console.log('Notion pressed')}
      />
    </View>
  ),
}

// Interactive Examples
export const Interactive: Story = {
  render: () => {
    const [followed, setFollowed] = useState(false)

    return (
      <View style={styles.wideContainer}>
        <ListItem
          variant="user-profile-01"
          name="Tina Hernandez"
          username="@tinahernan90"
          description="Click Follow to toggle state"
          avatarSrc="https://i.pravatar.cc/150?img=1"
          showVerified
          onFollowPress={() => {
            setFollowed(!followed)
            console.log(followed ? 'Unfollowed' : 'Followed')
          }}
        />
      </View>
    )
  },
}

// All Variants Showcase
export const AllVariants: Story = {
  render: () => (
    <View style={styles.wideContainer}>
      <ListItem
        variant="user-profile-01"
        name="Tina Hernandez"
        username="@tinahernan90"
        description="User profile with Follow button"
        avatarSrc="https://i.pravatar.cc/150?img=1"
        showVerified
        onFollowPress={() => console.log('Follow')}
      />
      <ListItem
        variant="user-profile-02"
        name="Sarah Johnson"
        username="@sarahj"
        subscriptionDate="March 25, 2024"
        avatarSrc="https://i.pravatar.cc/150?img=3"
        onViewProfilePress={() => console.log('View Profile')}
      />
      <ListItem
        variant="product"
        name="Flux Co."
        tags={['UX Design', 'Design Systems']}
        count={16}
        onActionPress={() => console.log('Action')}
      />
      <ListItem
        variant="search-result-01"
        title="Personal Settings"
        timestamp="March 25, 2024 04:53PM"
        breadcrumbs={[
          { label: 'Help Center' },
          { label: 'Manage my account' },
        ]}
        description="Search result with breadcrumbs"
        onReadMorePress={() => console.log('Read more')}
      />
      <ListItem
        variant="search-result-02"
        title="Account Security"
        description="Search result with author info"
        authorName="Tina Hernandez"
        authorAvatarSrc="https://i.pravatar.cc/150?img=1"
        updatedText="Updated over a week ago"
      />
      <ListItem
        variant="search-result-03"
        title="Notification Preferences"
        description="Search result with icon"
      />
      <ListItem
        variant="task"
        title="Opportunity 4"
        metadata="Opportunity Pipeline"
        updatedText="Updated 10 min ago"
        iconColor="success"
      />
      <ListItem
        variant="song-title"
        title="Auto Layout (feat. DJ Rectangle)"
        type="Single"
        artist="Beyond UI"
        year="2024"
      />
      <ListItem
        variant="cloud-file"
        name="Request Files"
        service="Boxdrop"
        size="24MB"
      />
      <ListItem
        variant="phone-number"
        countryCode="+1"
        countryName="United States"
      />
      <ListItem
        variant="integration"
        name="Figma"
        onPress={() => console.log('Integration')}
      />
    </View>
  ),
}
