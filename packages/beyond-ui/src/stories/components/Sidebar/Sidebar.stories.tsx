/**
 * Sidebar Component Stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Sidebar, SidebarMenuItem, SidebarHeader, SidebarFooter, SidebarWidget, SidebarItemGroup } from '../../../components/Sidebar'
import { View, StyleSheet } from 'react-native'
import { spacing } from '../../../tokens/spacing'
import { Avatar } from '../../../components/Avatar'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  Bell, 
  MessageCircle, 
  Home,
  Calendar,
} from 'lucide-react-native'

const meta: Meta<typeof Sidebar> = {
  title: 'Components/Sidebar',
  component: Sidebar,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Sidebar navigation component with collapsed/expanded states, menu items, widgets, and theming variants.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['main', 'finance', 'management', 'banking', 'crypto'],
      description: 'Theme variant',
    },
    collapsed: {
      control: 'boolean',
      description: 'Whether sidebar is collapsed',
    },
  },
}

export default meta
type Story = StoryObj<typeof Sidebar>

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: '100vh',
  },
  content: {
    flex: 1,
    padding: spacing[24],
  },
})

export const Default: Story = {
  render: () => {
    const [collapsed, setCollapsed] = useState(false)
    const [activeItem, setActiveItem] = useState('dashboard')

    return (
      <View style={styles.container}>
        <Sidebar
          variant="main"
          collapsed={collapsed}
          onCollapseChange={setCollapsed}
          header={
            <SidebarHeader
              title="Forsured"
              collapsed={collapsed}
              onCollapse={() => setCollapsed(!collapsed)}
            />
          }
          footer={
            <SidebarFooter
              user={{
                name: 'John Doe',
                email: 'john@example.com',
                avatar: <Avatar initials="JD" size={32} />,
              }}
              actions={[
                { icon: MessageCircle, onPress: () => {}, label: 'Messages' },
                { icon: Bell, onPress: () => {}, badge: 3 },
                { icon: Settings, onPress: () => {} },
              ]}
            />
          }
        >
          <SidebarMenuItem
            icon={LayoutDashboard}
            label="Dashboard"
            state={activeItem === 'dashboard' ? 'active' : 'default'}
            onPress={() => setActiveItem('dashboard')}
          />
          <SidebarMenuItem
            icon={Users}
            label="Clients"
            badge={5}
            state={activeItem === 'clients' ? 'active' : 'default'}
            onPress={() => setActiveItem('clients')}
          />
          <SidebarMenuItem
            icon={FileText}
            label="Documents"
            state={activeItem === 'documents' ? 'active' : 'default'}
            onPress={() => setActiveItem('documents')}
          />
        </Sidebar>
        <View style={styles.content}>
          {/* Main content area */}
        </View>
      </View>
    )
  },
}

export const WithGroups: Story = {
  render: () => {
    const [collapsed, setCollapsed] = useState(false)
    const [activeItem, setActiveItem] = useState('dashboard')

    return (
      <View style={styles.container}>
        <Sidebar
          variant="main"
          collapsed={collapsed}
          onCollapseChange={setCollapsed}
          header={<SidebarHeader title="Forsured" collapsed={collapsed} onCollapse={() => setCollapsed(!collapsed)} />}
        >
          <SidebarItemGroup heading="Main" showDivider>
            <SidebarMenuItem
              icon={LayoutDashboard}
              label="Dashboard"
              state={activeItem === 'dashboard' ? 'active' : 'default'}
              onPress={() => setActiveItem('dashboard')}
            />
            <SidebarMenuItem
              icon={Users}
              label="Clients"
              state={activeItem === 'clients' ? 'active' : 'default'}
              onPress={() => setActiveItem('clients')}
            />
          </SidebarItemGroup>

          <SidebarItemGroup heading="Reports">
            <SidebarMenuItem
              icon={FileText}
              label="Documents"
              state={activeItem === 'documents' ? 'active' : 'default'}
              onPress={() => setActiveItem('documents')}
            />
            <SidebarMenuItem
              icon={Calendar}
              label="Calendar"
              state={activeItem === 'calendar' ? 'active' : 'default'}
              onPress={() => setActiveItem('calendar')}
            />
          </SidebarItemGroup>
        </Sidebar>
        <View style={styles.content} />
      </View>
    )
  },
}

export const WithNestedItems: Story = {
  render: () => {
    const [collapsed, setCollapsed] = useState(false)
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
    const [activeItem, setActiveItem] = useState('dashboard')

    const toggleExpand = (item: string) => {
      const newExpanded = new Set(expandedItems)
      if (newExpanded.has(item)) {
        newExpanded.delete(item)
      } else {
        newExpanded.add(item)
      }
      setExpandedItems(newExpanded)
    }

    return (
      <View style={styles.container}>
        <Sidebar
          variant="main"
          collapsed={collapsed}
          onCollapseChange={setCollapsed}
          header={<SidebarHeader title="Forsured" collapsed={collapsed} onCollapse={() => setCollapsed(!collapsed)} />}
        >
          <SidebarMenuItem
            icon={LayoutDashboard}
            label="Dashboard"
            state={activeItem === 'dashboard' ? 'active' : 'default'}
            onPress={() => setActiveItem('dashboard')}
          />
          <SidebarMenuItem
            icon={Users}
            label="Clients"
            showExpandIcon
            expanded={expandedItems.has('clients')}
            onExpand={() => toggleExpand('clients')}
          >
            <SidebarMenuItem
              type="child"
              icon={Home}
              label="All Clients"
              state={activeItem === 'all-clients' ? 'active' : 'default'}
              onPress={() => setActiveItem('all-clients')}
            />
            <SidebarMenuItem
              type="child"
              icon={Users}
              label="Active Clients"
              state={activeItem === 'active-clients' ? 'active' : 'default'}
              onPress={() => setActiveItem('active-clients')}
            />
          </SidebarMenuItem>
          <SidebarMenuItem
            icon={FileText}
            label="Documents"
            state={activeItem === 'documents' ? 'active' : 'default'}
            onPress={() => setActiveItem('documents')}
          />
        </Sidebar>
        <View style={styles.content} />
      </View>
    )
  },
}

export const WithWidgets: Story = {
  render: () => {
    const [collapsed, setCollapsed] = useState(false)
    const [activeItem, setActiveItem] = useState('dashboard')

    return (
      <View style={styles.container}>
        <Sidebar
          variant="main"
          collapsed={collapsed}
          onCollapseChange={setCollapsed}
          header={<SidebarHeader title="Forsured" collapsed={collapsed} onCollapse={() => setCollapsed(!collapsed)} />}
        >
          <SidebarMenuItem
            icon={LayoutDashboard}
            label="Dashboard"
            state={activeItem === 'dashboard' ? 'active' : 'default'}
            onPress={() => setActiveItem('dashboard')}
          />
          <SidebarMenuItem
            icon={Users}
            label="Clients"
            state={activeItem === 'clients' ? 'active' : 'default'}
            onPress={() => setActiveItem('clients')}
          />

          <SidebarWidget
            type="progress-horizontal"
            label="Storage used"
            value={178}
            max={445}
            valueText="178MB of 445MB"
          />

          <SidebarWidget
            type="message-horizontal"
            message="7 days left in trial"
            buttonText="Upgrade"
            onButtonPress={() => {}}
          />
        </Sidebar>
        <View style={styles.content} />
      </View>
    )
  },
}

export const WithToggle: Story = {
  render: () => {
    const [collapsed, setCollapsed] = useState(false)
    const [darkMode, setDarkMode] = useState(false)

    return (
      <View style={styles.container}>
        <Sidebar
          variant="main"
          collapsed={collapsed}
          onCollapseChange={setCollapsed}
          header={<SidebarHeader title="Forsured" collapsed={collapsed} onCollapse={() => setCollapsed(!collapsed)} />}
        >
          <SidebarMenuItem
            icon={LayoutDashboard}
            label="Dashboard"
            onPress={() => {}}
          />
          <SidebarMenuItem
            icon={Settings}
            label="Dark Mode"
            showToggle
            toggleValue={darkMode}
            onToggleChange={setDarkMode}
          />
        </Sidebar>
        <View style={styles.content} />
      </View>
    )
  },
}

export const AllVariants: Story = {
  render: () => {
    const [variant, setVariant] = useState<'main' | 'finance' | 'management' | 'banking' | 'crypto'>('main')
    const [collapsed, setCollapsed] = useState(false)

    return (
      <View style={styles.container}>
        <Sidebar
          variant={variant}
          collapsed={collapsed}
          onCollapseChange={setCollapsed}
          header={<SidebarHeader title="Forsured" collapsed={collapsed} onCollapse={() => setCollapsed(!collapsed)} />}
        >
          <SidebarMenuItem icon={LayoutDashboard} label="Dashboard" state="active" onPress={() => {}} />
          <SidebarMenuItem icon={Users} label="Clients" onPress={() => {}} />
          <SidebarMenuItem icon={FileText} label="Documents" onPress={() => {}} />
        </Sidebar>
        <View style={[styles.content, { gap: spacing[16] }]}>
          <View style={{ flexDirection: 'row', gap: spacing[8] }}>
            {(['main', 'finance', 'management', 'banking', 'crypto'] as const).map((v) => (
              <View
                key={v}
                onTouchEnd={() => setVariant(v)}
                style={{
                  padding: spacing[8],
                  backgroundColor: variant === v ? '#e0e0e0' : '#f5f5f5',
                  borderRadius: 4,
                }}
              >
                  {/* @ts-expect-error - web-specific */}
                  <span style={{ textTransform: 'capitalize' }}>{v}</span>
              </View>
            ))}
          </View>
        </View>
      </View>
    )
  },
}

export const AllItemTypes: Story = {
  render: () => {
    const [collapsed, setCollapsed] = useState(false)

    return (
      <View style={styles.container}>
        <Sidebar
          variant="main"
          collapsed={collapsed}
          onCollapseChange={setCollapsed}
          header={<SidebarHeader title="Forsured" collapsed={collapsed} onCollapse={() => setCollapsed(!collapsed)} />}
        >
          <SidebarMenuItem type="heading" label="Navigation" />
          <SidebarMenuItem icon={LayoutDashboard} label="Dashboard" state="active" onPress={() => {}} />
          <SidebarMenuItem icon={Users} label="Clients" badge={5} onPress={() => {}} />
          <SidebarMenuItem
            icon={FileText}
            label="Document"
            supportingText="Supporting text"
            type="double"
            onPress={() => {}}
          />
          <SidebarMenuItem
            type="cta"
            label="Upgrade"
            buttonText="Upgrade Now"
            onPress={() => {}}
          />
          <SidebarMenuItem type="divider" />
          <SidebarMenuItem
            type="child"
            icon={Home}
            label="Child Item"
            onPress={() => {}}
          />
        </Sidebar>
        <View style={styles.content} />
      </View>
    )
  },
}

export const AllStates: Story = {
  render: () => {
    const [collapsed, setCollapsed] = useState(false)

    return (
      <View style={styles.container}>
        <Sidebar
          variant="main"
          collapsed={collapsed}
          onCollapseChange={setCollapsed}
          header={<SidebarHeader title="Forsured" collapsed={collapsed} onCollapse={() => setCollapsed(!collapsed)} />}
        >
          <SidebarMenuItem icon={LayoutDashboard} label="Default State" onPress={() => {}} />
          <SidebarMenuItem icon={Users} label="Active State" state="active" onPress={() => {}} />
          <SidebarMenuItem icon={FileText} label="Disabled State" state="disabled" />
        </Sidebar>
        <View style={styles.content} />
      </View>
    )
  },
}

export const Collapsed: Story = {
  render: () => {
    return (
      <View style={styles.container}>
        <Sidebar
          variant="main"
          collapsed={true}
          header={<SidebarHeader title="Forsured" collapsed={true} />}
          footer={
            <SidebarFooter
              user={{
                name: 'John Doe',
                avatar: <Avatar initials="JD" size={32} />,
              }}
              actions={[
                { icon: MessageCircle, onPress: () => {} },
                { icon: Bell, onPress: () => {}, badge: 3 },
                { icon: Settings, onPress: () => {} },
              ]}
            />
          }
        >
          <SidebarMenuItem icon={LayoutDashboard} label="Dashboard" state="active" onPress={() => {}} />
          <SidebarMenuItem icon={Users} label="Clients" badge={5} onPress={() => {}} />
          <SidebarMenuItem icon={FileText} label="Documents" onPress={() => {}} />
        </Sidebar>
        <View style={styles.content} />
      </View>
    )
  },
}

