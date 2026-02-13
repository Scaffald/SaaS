/**
 * CommandMenu stories
 * Comprehensive examples demonstrating all CommandMenu features
 */

import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { View } from 'react-native'
import { CommandMenu } from '../../../components/CommandMenu'
import { Button } from '../../../components/Button'
import type { CommandMenuItemData } from '../../../components/CommandMenu'
import {
  FileText,
  Folder,
  Puzzle,
  Settings,
  Search,
  Home,
  Mail,
  Calendar,
  Bell,
  HelpCircle,
  LogOut,
} from 'lucide-react-native'

const meta = {
  title: 'CommandMenu/CommandMenu',
  component: CommandMenu,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CommandMenu>

export default meta
type Story = StoryObj<typeof meta>

// Mock data for different scenarios
const memberItems: CommandMenuItemData[] = [
  {
    id: '1',
    type: 'Avatar',
    title: 'Anna Taylor',
    subtitle: '@annataylor',
    avatar: { src: 'https://i.pravatar.cc/150?img=1', size: 32 },
    tab: 'members',
    shortcut: ['⌘', '1'],
  },
  {
    id: '2',
    type: 'Avatar',
    title: 'Theresa Webb',
    subtitle: '@theresawebb',
    avatar: { src: 'https://i.pravatar.cc/150?img=2', size: 32 },
    tab: 'members',
    shortcut: ['⌘', '2'],
  },
  {
    id: '3',
    type: 'Avatar',
    title: 'Kristin Watson',
    subtitle: '@kristinwa',
    avatar: { src: 'https://i.pravatar.cc/150?img=3', size: 32 },
    tab: 'members',
  },
  {
    id: '4',
    type: 'Avatar',
    title: 'Jacob Jones',
    subtitle: '@jacobjones',
    avatar: { src: 'https://i.pravatar.cc/150?img=4', size: 32 },
    tab: 'members',
  },
  {
    id: '5',
    type: 'Avatar',
    title: 'Eleanor Pena',
    subtitle: '@eleanorpena',
    avatar: { src: 'https://i.pravatar.cc/150?img=5', size: 32 },
    tab: 'members',
  },
  {
    id: '6',
    type: 'Avatar',
    title: 'Ronald Richards',
    subtitle: '@ronaldrrichards',
    avatar: { src: 'https://i.pravatar.cc/150?img=6', size: 32 },
    tab: 'members',
  },
  {
    id: '7',
    type: 'Avatar',
    title: 'Courtney Henry',
    subtitle: '@countneyhenry',
    avatar: { src: 'https://i.pravatar.cc/150?img=7', size: 32 },
    tab: 'members',
  },
]

const fileItems: CommandMenuItemData[] = [
  {
    id: 'f1',
    type: 'Icon',
    title: 'Document.pdf',
    subtitle: 'Documents • 2.4 MB',
    icon: FileText,
    tab: 'files',
    shortcut: ['⌘', 'F'],
  },
  {
    id: 'f2',
    type: 'Icon',
    title: 'Presentation.pptx',
    subtitle: 'Documents • 5.8 MB',
    icon: FileText,
    tab: 'files',
  },
  {
    id: 'f3',
    type: 'Icon',
    title: 'Spreadsheet.xlsx',
    subtitle: 'Documents • 1.2 MB',
    icon: FileText,
    tab: 'files',
  },
  {
    id: 'f4',
    type: 'Icon',
    title: 'Project Folder',
    subtitle: 'Workspace • 15 items',
    icon: Folder,
    tab: 'files',
  },
]

const projectItems: CommandMenuItemData[] = [
  {
    id: 'p1',
    type: 'Icon',
    title: 'Website Redesign',
    subtitle: 'Design Team • Active',
    icon: Folder,
    tab: 'projects',
  },
  {
    id: 'p2',
    type: 'Icon',
    title: 'Mobile App',
    subtitle: 'Development • In Progress',
    icon: Folder,
    tab: 'projects',
  },
  {
    id: 'p3',
    type: 'Icon',
    title: 'Marketing Campaign',
    subtitle: 'Marketing • Planning',
    icon: Folder,
    tab: 'projects',
  },
]

const integrationItems: CommandMenuItemData[] = [
  {
    id: 'i1',
    type: 'Icon',
    title: 'GitHub',
    subtitle: 'Connected • 3 repos',
    icon: Puzzle,
    tab: 'integrations',
  },
  {
    id: 'i2',
    type: 'Icon',
    title: 'Slack',
    subtitle: 'Connected • #general',
    icon: Puzzle,
    tab: 'integrations',
  },
  {
    id: 'i3',
    type: 'Icon',
    title: 'Jira',
    subtitle: 'Connected • 12 issues',
    icon: Puzzle,
    tab: 'integrations',
  },
]

const allItems = [...memberItems, ...fileItems, ...projectItems, ...integrationItems]

const commandItems: CommandMenuItemData[] = [
  {
    id: 'cmd1',
    type: 'Icon',
    title: 'Go to Home',
    subtitle: 'Navigate to home page',
    icon: Home,
    shortcut: ['⌘', 'H'],
  },
  {
    id: 'cmd2',
    type: 'Icon',
    title: 'Search',
    subtitle: 'Open search dialog',
    icon: Search,
    shortcut: ['⌘', 'K'],
  },
  {
    id: 'cmd3',
    type: 'Icon',
    title: 'Messages',
    subtitle: 'View your messages',
    icon: Mail,
    shortcut: ['⌘', 'M'],
  },
  {
    id: 'cmd4',
    type: 'Icon',
    title: 'Calendar',
    subtitle: 'Open calendar',
    icon: Calendar,
    shortcut: ['⌘', 'C'],
  },
  {
    id: 'cmd5',
    type: 'Icon',
    title: 'Notifications',
    subtitle: 'View notifications',
    icon: Bell,
    shortcut: ['⌘', 'N'],
  },
  {
    id: 'cmd6',
    type: 'Icon',
    title: 'Settings',
    subtitle: 'Open settings',
    icon: Settings,
    shortcut: ['⌘', ','],
  },
  {
    id: 'cmd7',
    type: 'Icon',
    title: 'Help',
    subtitle: 'Get help',
    icon: HelpCircle,
    shortcut: ['⌘', '/'],
  },
  {
    id: 'cmd8',
    type: 'Icon',
    title: 'Sign Out',
    subtitle: 'Sign out of your account',
    icon: LogOut,
  },
]

// Wrapper component for interactive stories
const CommandMenuWithToggle = (args: any) => {
  const [open, setOpen] = useState(false)
  return (
    <View style={{ alignItems: 'center', gap: 20 }}>
      <Button onPress={() => setOpen(!open)}>{open ? 'Close Menu' : 'Open Menu'}</Button>
      <CommandMenu {...args} open={open} onOpenChange={setOpen} />
    </View>
  )
}

export const WithTabs: Story = {
  render: (args) => {
    const [open, setOpen] = useState(true)
    return (
      <CommandMenu
        {...args}
        open={open}
        onOpenChange={setOpen}
        items={allItems}
        tabs={[
          { value: 'members', label: 'Members' },
          { value: 'files', label: 'Files' },
          { value: 'projects', label: 'Projects' },
          { value: 'integrations', label: 'Integrations' },
        ]}
        onItemSelect={(item) => {
          console.log('Selected:', item)
          setOpen(false)
        }}
      />
    )
  },
  args: {
    placeholder: 'Search...',
    helperText: 'Type to search members, files, projects, and integrations',
    defaultTab: 'members',
  },
}

export const WithoutTabs: Story = {
  render: (args) => {
    const [open, setOpen] = useState(true)
    return (
      <CommandMenu
        {...args}
        open={open}
        onOpenChange={setOpen}
        items={commandItems}
        tabs={[]}
        onItemSelect={(item) => {
          console.log('Selected:', item)
          setOpen(false)
        }}
      />
    )
  },
  args: {
    placeholder: 'Search commands...',
  },
}

export const MembersOnly: Story = {
  render: (args) => {
    const [open, setOpen] = useState(true)
    return (
      <CommandMenu
        {...args}
        open={open}
        onOpenChange={setOpen}
        items={memberItems}
        tabs={[{ value: 'members', label: 'Members' }]}
        onItemSelect={(item) => {
          console.log('Selected member:', item)
          setOpen(false)
        }}
      />
    )
  },
  args: {
    placeholder: 'Search members...',
    helperText: 'Find team members by name or username',
  },
}

export const Interactive: Story = {
  render: CommandMenuWithToggle,
  args: {
    items: allItems,
    tabs: [
      { value: 'members', label: 'Members' },
      { value: 'files', label: 'Files' },
      { value: 'projects', label: 'Projects' },
      { value: 'integrations', label: 'Integrations' },
    ],
    placeholder: 'Search...',
    onItemSelect: (item: CommandMenuItemData) => {
      alert(`Selected: ${item.title}`)
    },
  },
}

export const EmptyState: Story = {
  render: (args) => {
    const [open, setOpen] = useState(true)
    return (
      <CommandMenu
        {...args}
        open={open}
        onOpenChange={setOpen}
        items={[]}
        placeholder="Search..."
      />
    )
  },
}

export const WithSearch: Story = {
  render: (args) => {
    const [open, setOpen] = useState(true)
    const [search, setSearch] = useState('anna')
    return (
      <CommandMenu
        {...args}
        open={open}
        onOpenChange={setOpen}
        searchValue={search}
        onSearchChange={setSearch}
        items={allItems}
        tabs={[
          { value: 'members', label: 'Members' },
          { value: 'files', label: 'Files' },
          { value: 'projects', label: 'Projects' },
          { value: 'integrations', label: 'Integrations' },
        ]}
      />
    )
  },
  args: {
    placeholder: 'Search...',
    helperText: 'Pre-filled search example',
  },
}

export const CustomWidth: Story = {
  render: (args) => {
    const [open, setOpen] = useState(true)
    return (
      <CommandMenu
        {...args}
        open={open}
        onOpenChange={setOpen}
        items={allItems}
        tabs={[
          { value: 'members', label: 'Members' },
          { value: 'files', label: 'Files' },
        ]}
        style={{ width: 800 }}
      />
    )
  },
  args: {
    placeholder: 'Search...',
  },
}
