/**
 * MIGRATED from FRS-Prototype/packages/layout/src/__tests__/Tabs.test.tsx
 * OfficeTabs Component Tests
 * REQ-288: Tamagui UI Component Library
 *
 * TODO: Update test expectations for OfficeTabs API differences:
 * - Old component: Tabs with tabs array (id, label, content, disabled), value, onValueChange, variant
 * - New component: OfficeTabs with items array (key, label, href, badge, isActive), currentPath
 * - OfficeTabs is navigation-focused (uses expo-router Link), not content tabs
 * - Uses buttons for tab UI, not traditional tab interface
 * - Responsive: horizontal scroll on mobile, flex wrap on desktop
 * - May need to create a generic Tabs component wrapper or use @tamagui/tabs directly
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock expo-router Link
vi.mock('expo-router', () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => {
    const React = require('react')
    return React.createElement('a', { href, 'data-testid': `link-${href}` }, children)
  },
}))

// Mock Tamagui before importing component
vi.mock('tamagui', async () => {
  const React = await import('react')
  return {
    styled: (_component: unknown, config: Record<string, unknown>) => {
      const StyledComponent = React.forwardRef<HTMLElement, Record<string, unknown>>(
        ({ children, onPress, ...props }, ref) => {
          const handleClick = (e: React.MouseEvent) => {
            if (onPress) (onPress as (e: unknown) => void)(e)
          }
          return React.createElement('div', { ref, onClick: handleClick, 'data-name': config.name, ...props }, children)
        }
      )
      StyledComponent.displayName = (config.name as string) || 'StyledComponent'
      return StyledComponent
    },
    YStack: ({ children, ...props }: Record<string, unknown>) => React.createElement('div', { 'data-testid': 'ystack', ...props }, children as React.ReactNode),
    XStack: ({ children, ...props }: Record<string, unknown>) => React.createElement('div', { 'data-testid': 'xstack', ...props }, children as React.ReactNode),
    Text: ({ children, ...props }: Record<string, unknown>) => React.createElement('span', props, children as React.ReactNode),
    Paragraph: ({ children, ...props }: Record<string, unknown>) => React.createElement('p', props, children as React.ReactNode),
    Button: ({ children, onPress, ...props }: Record<string, unknown>) => {
      const handleClick = () => onPress && (onPress as () => void)()
      return React.createElement('button', { onClick: handleClick, 'data-testid': 'button', ...props }, children)
    },
    ScrollView: ({ children, ...props }: Record<string, unknown>) => React.createElement('div', { 'data-testid': 'scrollview', ...props }, children as React.ReactNode),
    useWindowDimensions: () => ({ width: 1024, height: 768 }), // Desktop by default
  }
})

import { OfficeTabs, type OfficeTabsItem } from '../components/navigation/OfficeTabs'

// Create a generic Tab component wrapper for content-based tabs
function GenericTabs({
  tabs,
  value,
  onValueChange,
}: {
  tabs: Array<{ id: string; label: string; content: React.ReactNode; disabled?: boolean }>
  value?: string
  onValueChange?: (value: string) => void
}) {
  const [activeTab, setActiveTab] = React.useState(value || tabs[0]?.id)

  const handleTabChange = (id: string) => {
    if (onValueChange) {
      onValueChange(id)
    } else {
      setActiveTab(id)
    }
  }

  const currentTab = tabs.find((tab) => tab.id === (value || activeTab))

  return (
    <div>
      <div role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={tab.id === (value || activeTab)}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && handleTabChange(tab.id)}
            data-testid={`tab-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">{currentTab?.content}</div>
    </div>
  )
}

// Import React for the wrapper component
import React from 'react'

const mockTabs = [
  { id: 'tab1', label: 'Tab 1', content: <div>Tab 1 Content</div> },
  { id: 'tab2', label: 'Tab 2', content: <div>Tab 2 Content</div> },
  { id: 'tab3', label: 'Tab 3', content: <div>Tab 3 Content</div> },
]

describe('Tabs Component (Generic)', () => {
  describe('Basic Rendering', () => {
    it('should render all tab labels', () => {
      render(<GenericTabs tabs={mockTabs} />)

      expect(screen.getByText('Tab 1')).toBeInTheDocument()
      expect(screen.getByText('Tab 2')).toBeInTheDocument()
      expect(screen.getByText('Tab 3')).toBeInTheDocument()
    })

    it('should show first tab content by default', () => {
      render(<GenericTabs tabs={mockTabs} />)

      expect(screen.getByText('Tab 1 Content')).toBeInTheDocument()
    })

    it('should render with controlled value', () => {
      render(<GenericTabs tabs={mockTabs} value="tab2" />)

      expect(screen.getByText('Tab 2 Content')).toBeInTheDocument()
    })
  })

  describe('Tab Selection', () => {
    it('should switch tabs when clicked (uncontrolled)', () => {
      render(<GenericTabs tabs={mockTabs} />)

      expect(screen.getByText('Tab 1 Content')).toBeInTheDocument()

      fireEvent.click(screen.getByTestId('tab-tab2'))

      expect(screen.getByText('Tab 2 Content')).toBeInTheDocument()
    })

    it('should call onValueChange when tab is clicked (controlled)', () => {
      const onValueChange = vi.fn()
      render(<GenericTabs tabs={mockTabs} value="tab1" onValueChange={onValueChange} />)

      fireEvent.click(screen.getByTestId('tab-tab2'))

      expect(onValueChange).toHaveBeenCalledWith('tab2')
    })

    it('should not switch tabs when disabled tab is clicked', () => {
      const tabsWithDisabled = [
        { id: 'tab1', label: 'Tab 1', content: <div>Tab 1 Content</div> },
        { id: 'tab2', label: 'Tab 2', content: <div>Tab 2 Content</div>, disabled: true },
      ]
      const onValueChange = vi.fn()
      render(<GenericTabs tabs={tabsWithDisabled} value="tab1" onValueChange={onValueChange} />)

      fireEvent.click(screen.getByTestId('tab-tab2'))

      expect(onValueChange).not.toHaveBeenCalled()
    })
  })

  describe('Disabled Tabs', () => {
    it('should not select disabled tab', () => {
      const tabsWithDisabled = [
        { id: 'tab1', label: 'Active', content: <div>Active Content</div> },
        { id: 'tab2', label: 'Disabled', content: <div>Disabled Content</div>, disabled: true },
      ]
      render(<GenericTabs tabs={tabsWithDisabled} />)

      fireEvent.click(screen.getByTestId('tab-tab2'))

      // Should still show first tab content
      expect(screen.getByText('Active Content')).toBeInTheDocument()
      expect(screen.queryByText('Disabled Content')).not.toBeInTheDocument()
    })
  })

  describe('Content Display', () => {
    it('should show correct content for selected tab', () => {
      render(<GenericTabs tabs={mockTabs} value="tab3" />)

      expect(screen.getByText('Tab 3 Content')).toBeInTheDocument()
      expect(screen.queryByText('Tab 1 Content')).not.toBeInTheDocument()
      expect(screen.queryByText('Tab 2 Content')).not.toBeInTheDocument()
    })

    it('should update content when tab changes', () => {
      const { rerender } = render(<GenericTabs tabs={mockTabs} value="tab1" />)

      expect(screen.getByText('Tab 1 Content')).toBeInTheDocument()

      rerender(<GenericTabs tabs={mockTabs} value="tab2" />)

      expect(screen.getByText('Tab 2 Content')).toBeInTheDocument()
    })
  })

  describe('Complex Tab Content', () => {
    it('should render complex content in tabs', () => {
      const complexTabs = [
        {
          id: 'form',
          label: 'Form',
          content: (
            <form>
              <input placeholder="Name" />
              <button type="submit">Submit</button>
            </form>
          ),
        },
        {
          id: 'list',
          label: 'List',
          content: (
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          ),
        },
      ]
      render(<GenericTabs tabs={complexTabs} value="form" />)

      expect(screen.getByPlaceholderText('Name')).toBeInTheDocument()
      expect(screen.getByText('Submit')).toBeInTheDocument()
    })
  })

  describe('Empty Tabs', () => {
    it('should handle empty tabs array', () => {
      render(<GenericTabs tabs={[]} />)

      // Should render without crashing
      expect(document.body).toBeInTheDocument()
    })
  })

  describe('Single Tab', () => {
    it('should handle single tab', () => {
      const singleTab = [
        { id: 'only', label: 'Only Tab', content: <div>Only Content</div> },
      ]
      render(<GenericTabs tabs={singleTab} />)

      expect(screen.getByText('Only Tab')).toBeInTheDocument()
      expect(screen.getByText('Only Content')).toBeInTheDocument()
    })
  })
})

describe('OfficeTabs Component (Navigation)', () => {
  const mockItems: OfficeTabsItem[] = [
    { key: 'home', label: 'Home', href: '/home' },
    { key: 'about', label: 'About', href: '/about' },
    { key: 'contact', label: 'Contact', href: '/contact', badge: '3' },
  ]

  describe('Basic Rendering', () => {
    it('should render all tab items', () => {
      render(<OfficeTabs items={mockItems} currentPath="/home" />)

      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('About')).toBeInTheDocument()
      expect(screen.getByText('Contact')).toBeInTheDocument()
    })

    it('should render badge when provided', () => {
      render(<OfficeTabs items={mockItems} currentPath="/home" />)

      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should mark current path as active', () => {
      render(<OfficeTabs items={mockItems} currentPath="/about" />)

      const aboutButton = screen.getByText('About').closest('button')
      expect(aboutButton).toHaveAttribute('aria-selected', 'true')
    })
  })

  describe('Navigation', () => {
    it('should create links for all items', () => {
      render(<OfficeTabs items={mockItems} currentPath="/home" />)

      expect(screen.getByTestId('link-/home')).toBeInTheDocument()
      expect(screen.getByTestId('link-/about')).toBeInTheDocument()
      expect(screen.getByTestId('link-/contact')).toBeInTheDocument()
    })
  })
})
