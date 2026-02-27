/**
 * SettingsTeamTable Storybook stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { SettingsTeamTable } from '../../../components/SettingsTeamTable'
import type { TeamMember } from '../../../components/SettingsTeamTable'
import { useState } from 'react'

const meta: Meta<typeof SettingsTeamTable> = {
  title: 'Components/SettingsTeamTable',
  component: SettingsTeamTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof SettingsTeamTable>

const sampleMembers: TeamMember[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    dateAdded: '2024-01-15',
    role: 'Owner',
    selected: false,
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    dateAdded: '2024-01-20',
    role: 'Admin',
    selected: false,
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob.johnson@example.com',
    dateAdded: '2024-02-01',
    role: 'Member',
    selected: false,
  },
  {
    id: '4',
    name: 'Alice Williams',
    email: 'alice.williams@example.com',
    dateAdded: '2024-02-10',
    role: 'Member',
    selected: false,
  },
]

export const Default: Story = {
  render: () => {
    const [members, setMembers] = useState<TeamMember[]>(sampleMembers)

    const handleSelectionChange = (selectedIds: string[]) => {
      setMembers((prev) =>
        prev.map((member) => ({
          ...member,
          selected: selectedIds.includes(member.id),
        }))
      )
    }

    const handleEdit = (memberId: string) => {
      console.log('Edit member:', memberId)
    }

    const handleDelete = (memberId: string) => {
      setMembers((prev) => prev.filter((member) => member.id !== memberId))
    }

    return (
      <SettingsTeamTable
        members={members}
        onSelectionChange={handleSelectionChange}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    )
  },
}

export const Empty: Story = {
  render: () => <SettingsTeamTable members={[]} />,
}
