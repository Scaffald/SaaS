/**
 * SettingsNotificationTable Storybook stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { SettingsNotificationTable } from '../../../components/SettingsNotificationTable'
import type { NotificationPreference } from '../../../components/SettingsNotificationTable'
import { useState } from 'react'

const meta: Meta<typeof SettingsNotificationTable> = {
  title: 'Components/SettingsNotificationTable',
  component: SettingsNotificationTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof SettingsNotificationTable>

const samplePreferences: NotificationPreference[] = [
  // Comments category
  { id: '1', name: 'Assigned comments', category: 'Comments', email: true, mobile: false, inbox: false, browser: false },
  { id: '2', name: 'Resolved comments', category: 'Comments', email: true, mobile: true, inbox: false, browser: true },
  { id: '3', name: 'New Comment Notifications', category: 'Comments', email: false, mobile: true, inbox: false, browser: true },
  { id: '4', name: 'Mentions in Comments', category: 'Comments', email: false, mobile: true, inbox: false, browser: true },
  { id: '5', name: 'Thread Activity Notifications', category: 'Comments', email: false, mobile: true, inbox: false, browser: false },
  // Tasks category
  { id: '6', name: 'Task Assignment Notifications', category: 'Tasks', email: true, mobile: true, inbox: false, browser: false },
  { id: '7', name: 'Task Deadline Reminders', category: 'Tasks', email: true, mobile: true, inbox: false, browser: true },
  { id: '8', name: 'Task Completion Acknowledgments', category: 'Tasks', email: true, mobile: true, inbox: false, browser: true },
  { id: '9', name: 'Task Updates and Edits', category: 'Tasks', email: true, mobile: true, inbox: false, browser: true },
  { id: '10', name: 'Task Comment Activity', category: 'Tasks', email: true, mobile: true, inbox: false, browser: true },
  // Sharing category
  { id: '11', name: 'Shared Folder Updates', category: 'Sharing', email: true, mobile: true, inbox: false, browser: false },
  { id: '12', name: 'Shared Calendar Events', category: 'Sharing', email: true, mobile: true, inbox: false, browser: false },
  { id: '13', name: 'Content Shared with You', category: 'Sharing', email: true, mobile: true, inbox: false, browser: false },
  { id: '14', name: 'Access Requests', category: 'Sharing', email: true, mobile: true, inbox: false, browser: false },
  { id: '15', name: 'Collaborator Activity', category: 'Sharing', email: true, mobile: true, inbox: false, browser: false },
  { id: '16', name: 'Shared Workspace Announcements', category: 'Sharing', email: true, mobile: true, inbox: false, browser: false },
  { id: '17', name: 'Expiration Notices', category: 'Sharing', email: true, mobile: true, inbox: true, browser: false },
]

export const Default: Story = {
  render: () => {
    const [preferences, setPreferences] = useState<NotificationPreference[]>(samplePreferences)

    const handlePreferenceChange = (id: string, channel: 'email' | 'mobile' | 'inbox' | 'browser', enabled: boolean) => {
      setPreferences((prev) =>
        prev.map((pref) => (pref.id === id ? { ...pref, [channel]: enabled } : pref))
      )
    }

    return (
      <SettingsNotificationTable
        preferences={preferences}
        onPreferenceChange={handlePreferenceChange}
      />
    )
  },
}

export const Empty: Story = {
  render: () => <SettingsNotificationTable preferences={[]} />,
}
