/**
 * NotificationListItem Component Stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { NotificationListItem } from '../../../components/NotificationListItem'
import { View, Text, StyleSheet } from 'react-native'
import { spacing } from '../../../tokens/spacing'

const meta: Meta<typeof NotificationListItem> = {
  title: 'Components/NotificationListItem',
  component: NotificationListItem,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Notification list item with avatar, content, and actions.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['double-cta', 'single-cta', 'double-link', 'single-text', 'file'],
      description: 'Notification variant',
    },
    state: {
      control: 'select',
      options: ['new', 'read', 'hover'],
      description: 'Notification state',
    },
  },
}

export default meta
type Story = StoryObj<typeof NotificationListItem>

export const Default: Story = {
  args: {
    variant: 'single-text',
    state: 'read',
    avatarSrc: 'https://i.pravatar.cc/150?img=1',
    content: (
      <>
        <Text style={{ fontWeight: '500' }}>Tina Hernandez</Text>
        {' replied to your comment in '}
        <Text style={{ fontWeight: '500' }}>Generic posts</Text>
      </>
    ),
    timestamp: '5 min ago',
  },
}

export const NewState: Story = {
  args: {
    variant: 'single-text',
    state: 'new',
    avatarSrc: 'https://i.pravatar.cc/150?img=2',
    avatarIndicatorColor: '#34d399',
    content: (
      <>
        <Text style={{ fontWeight: '500' }}>John Doe</Text>
        {' mentioned you in a comment'}
      </>
    ),
    timestamp: '2 min ago',
  },
}

export const DoubleCTA: Story = {
  args: {
    variant: 'double-cta',
    state: 'read',
    avatarSrc: 'https://i.pravatar.cc/150?img=3',
    content: 'Sarah Wilson replied to your comment in Generic posts',
    timestamp: '10 min ago',
    actions: [
      { label: 'Reply', variant: 'primary', onPress: () => {} },
      { label: 'View', variant: 'secondary', onPress: () => {} },
    ],
  },
}

export const SingleCTA: Story = {
  args: {
    variant: 'single-cta',
    state: 'read',
    avatarSrc: 'https://i.pravatar.cc/150?img=4',
    content: 'Mike Johnson shared a new document with you',
    timestamp: '1 hour ago',
    actions: [{ label: 'View Document', variant: 'primary', onPress: () => {} }],
  },
}

export const DoubleLink: Story = {
  args: {
    variant: 'double-link',
    state: 'read',
    avatarSrc: 'https://i.pravatar.cc/150?img=5',
    content: 'Your subscription will expire in 3 days',
    timestamp: '2 hours ago',
    links: [
      { label: 'Renew', onPress: () => {} },
      { label: 'Learn More', onPress: () => {} },
    ],
  },
}

export const FileVariant: Story = {
  args: {
    variant: 'file',
    state: 'read',
    avatarSrc: 'https://i.pravatar.cc/150?img=6',
    content: 'New file shared with you',
    timestamp: '3 hours ago',
    file: {
      name: 'Quarterly Report.pdf',
      size: '2.4 MB',
    },
  },
}

export const AllVariants: Story = {
  render: () => (
    <View style={styles.container}>
      <NotificationListItem
        variant="single-text"
        state="new"
        avatarSrc="https://i.pravatar.cc/150?img=1"
        avatarIndicatorColor="#34d399"
        content={
          <>
            <Text style={{ fontWeight: '500' }}>Tina Hernandez</Text>
            {' replied to your comment'}
          </>
        }
        timestamp="5 min ago"
      />
      <NotificationListItem
        variant="double-cta"
        state="read"
        avatarSrc="https://i.pravatar.cc/150?img=2"
        content="John Doe mentioned you in a comment"
        timestamp="10 min ago"
        actions={[
          { label: 'Reply', variant: 'primary', onPress: () => {} },
          { label: 'View', variant: 'secondary', onPress: () => {} },
        ]}
      />
      <NotificationListItem
        variant="single-cta"
        state="read"
        avatarSrc="https://i.pravatar.cc/150?img=3"
        content="New document shared with you"
        timestamp="1 hour ago"
        actions={[{ label: 'View', variant: 'primary', onPress: () => {} }]}
      />
      <NotificationListItem
        variant="file"
        state="read"
        avatarSrc="https://i.pravatar.cc/150?img=4"
        content="File uploaded"
        timestamp="2 hours ago"
        file={{ name: 'Report.pdf', size: '2.4 MB' }}
      />
    </View>
  ),
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: spacing[12],
    padding: spacing[16],
    width: 400,
  },
})