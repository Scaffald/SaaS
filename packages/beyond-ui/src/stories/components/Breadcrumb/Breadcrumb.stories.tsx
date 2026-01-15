/**
 * Breadcrumb component Storybook stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { View, Text } from 'react-native'
import { Breadcrumb } from '../../../components/Breadcrumb'
import { ThemeProvider } from '../../../theme'

const meta: Meta<typeof Breadcrumb> = {
  title: 'Components/Breadcrumb',
  component: Breadcrumb,
  decorators: [
    (Story) => (
      <ThemeProvider>
        <View style={{ padding: 24 }}>
          <Story />
        </View>
      </ThemeProvider>
    ),
  ],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Breadcrumb navigation component showing hierarchical page location with interactive links.',
      },
    },
  },
  argTypes: {
    interactive: {
      control: 'boolean',
      description: 'Make breadcrumbs clickable',
    },
    showHomeIcon: {
      control: 'boolean',
      description: 'Show home icon on first item',
    },
    showSeparator: {
      control: 'boolean',
      description: 'Show chevron separators',
    },
  },
}

export default meta
type Story = StoryObj<typeof Breadcrumb>

/**
 * Default breadcrumb with 3 items
 */
export const Default: Story = {
  args: {
    items: [
      { label: 'Home' },
      { label: 'Products' },
      { label: 'Current Page' },
    ],
    currentIndex: 2,
  },
}

/**
 * With home icon on first item
 */
export const WithHomeIcon: Story = {
  args: {
    items: [
      { label: 'Home' },
      { label: 'Products' },
      { label: 'Category' },
      { label: 'Current' },
    ],
    currentIndex: 3,
    showHomeIcon: true,
  },
}

/**
 * Without home icon (text only)
 */
export const WithoutHomeIcon: Story = {
  args: {
    items: [
      { label: 'Home' },
      { label: 'Products' },
      { label: 'Category' },
      { label: 'Current' },
    ],
    currentIndex: 3,
    showHomeIcon: false,
  },
}

/**
 * Interactive breadcrumb with navigation
 */
export const Interactive: Story = {
  render: () => {
    const [currentIndex, setCurrentIndex] = useState(3)

    const items = [
      { label: 'Home', href: '/' },
      { label: 'About Us', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Join Our Team', href: '/careers/join' },
    ]

    return (
      <View>
        <Breadcrumb
          items={items}
          currentIndex={currentIndex}
          interactive
          onItemPress={(index) => {
            console.log('Navigate to:', items[index].href)
            setCurrentIndex(index)
          }}
        />
        <Text style={{ marginTop: 16, fontSize: 14, color: '#637083' }}>
          Click any breadcrumb to navigate. Current: {items[currentIndex].label}
        </Text>
      </View>
    )
  },
}

/**
 * Non-interactive breadcrumb (display only)
 */
export const NonInteractive: Story = {
  args: {
    items: [
      { label: 'Home' },
      { label: 'Products' },
      { label: 'Category' },
      { label: 'Current' },
    ],
    currentIndex: 3,
    interactive: false,
  },
}

/**
 * Long path with many items
 */
export const LongPath: Story = {
  args: {
    items: [
      { label: 'Home' },
      { label: 'Products' },
      { label: 'Electronics' },
      { label: 'Computers' },
      { label: 'Laptops' },
      { label: 'Gaming Laptops' },
    ],
    currentIndex: 5,
  },
}

/**
 * Custom separator (slash instead of chevron)
 */
export const CustomSeparator: Story = {
  args: {
    items: [
      { label: 'Home' },
      { label: 'Products' },
      { label: 'Category' },
      { label: 'Current' },
    ],
    currentIndex: 3,
    separator: <Text style={{ color: '#ced2da', fontSize: 14 }}>/</Text>,
  },
}

/**
 * Custom separator (dot)
 */
export const DotSeparator: Story = {
  args: {
    items: [
      { label: 'Home' },
      { label: 'Products' },
      { label: 'Category' },
      { label: 'Current' },
    ],
    currentIndex: 3,
    separator: <Text style={{ color: '#ced2da', fontSize: 14 }}>•</Text>,
  },
}

/**
 * With disabled items
 */
export const WithDisabledItems: Story = {
  args: {
    items: [
      { label: 'Home' },
      { label: 'Products', disabled: true },
      { label: 'Category' },
      { label: 'Current' },
    ],
    currentIndex: 3,
    interactive: true,
  },
}

/**
 * Different active positions
 */
export const DifferentActivePositions: Story = {
  render: () => {
    const items = [
      { label: 'Home' },
      { label: 'Products' },
      { label: 'Category' },
      { label: 'Current' },
    ]

    return (
      <View style={{ gap: 24 }}>
        <View>
          <Text style={{ marginBottom: 8, fontSize: 12, color: '#637083' }}>
            Active: Home (index 0)
          </Text>
          <Breadcrumb items={items} currentIndex={0} />
        </View>

        <View>
          <Text style={{ marginBottom: 8, fontSize: 12, color: '#637083' }}>
            Active: Products (index 1)
          </Text>
          <Breadcrumb items={items} currentIndex={1} />
        </View>

        <View>
          <Text style={{ marginBottom: 8, fontSize: 12, color: '#637083' }}>
            Active: Category (index 2)
          </Text>
          <Breadcrumb items={items} currentIndex={2} />
        </View>

        <View>
          <Text style={{ marginBottom: 8, fontSize: 12, color: '#637083' }}>
            Active: Current (index 3)
          </Text>
          <Breadcrumb items={items} currentIndex={3} />
        </View>
      </View>
    )
  },
}

/**
 * Responsive wrapping on narrow screens
 */
export const ResponsiveWrapping: Story = {
  decorators: [
    (Story) => (
      <ThemeProvider>
        <View style={{ padding: 24, maxWidth: 400 }}>
          <Story />
        </View>
      </ThemeProvider>
    ),
  ],
  args: {
    items: [
      { label: 'Home' },
      { label: 'Products' },
      { label: 'Electronics' },
      { label: 'Computers' },
      { label: 'Laptops' },
      { label: 'Gaming Laptops' },
    ],
    currentIndex: 5,
  },
}

/**
 * Without separators
 */
export const WithoutSeparators: Story = {
  args: {
    items: [
      { label: 'Home' },
      { label: 'Products' },
      { label: 'Category' },
      { label: 'Current' },
    ],
    currentIndex: 3,
    showSeparator: false,
  },
}

/**
 * Dark theme
 */
export const DarkTheme: Story = {
  decorators: [
    (Story) => (
      <ThemeProvider defaultTheme="dark">
        <View style={{ padding: 24, backgroundColor: '#0a0e14' }}>
          <Story />
        </View>
      </ThemeProvider>
    ),
  ],
  args: {
    items: [
      { label: 'Home' },
      { label: 'About Us' },
      { label: 'Careers' },
      { label: 'Join Our Team' },
    ],
    currentIndex: 3,
  },
}

/**
 * All states visual reference
 */
export const AllStates: Story = {
  render: () => {
    return (
      <View style={{ gap: 24 }}>
        <View>
          <Text style={{ marginBottom: 8, fontSize: 12, fontWeight: '600', color: '#141c25' }}>
            Default State (tertiary color, regular weight)
          </Text>
          <Breadcrumb
            items={[
              { label: 'Home' },
              { label: 'Products' },
              { label: 'Current' },
            ]}
            currentIndex={2}
          />
        </View>

        <View>
          <Text style={{ marginBottom: 8, fontSize: 12, fontWeight: '600', color: '#141c25' }}>
            Active State (primary color, semi-bold weight)
          </Text>
          <Breadcrumb
            items={[
              { label: 'Previous' },
              { label: 'Current Page' },
            ]}
            currentIndex={1}
          />
        </View>

        <View>
          <Text style={{ marginBottom: 8, fontSize: 12, fontWeight: '600', color: '#141c25' }}>
            With Home Icon
          </Text>
          <Breadcrumb
            items={[
              { label: 'Home' },
              { label: 'Products' },
              { label: 'Current' },
            ]}
            currentIndex={2}
            showHomeIcon
          />
        </View>

        <View>
          <Text style={{ marginBottom: 8, fontSize: 12, fontWeight: '600', color: '#141c25' }}>
            Interactive (hover over non-active items on web)
          </Text>
          <Breadcrumb
            items={[
              { label: 'Home' },
              { label: 'Products' },
              { label: 'Current' },
            ]}
            currentIndex={2}
            interactive
            onItemPress={(index) => console.log('Clicked:', index)}
          />
        </View>
      </View>
    )
  },
}

/**
 * Playground for testing
 */
export const Playground: Story = {
  args: {
    items: [
      { label: 'Home' },
      { label: 'Products' },
      { label: 'Category' },
      { label: 'Current Page' },
    ],
    currentIndex: 3,
    interactive: true,
    showHomeIcon: true,
    showSeparator: true,
  },
}
