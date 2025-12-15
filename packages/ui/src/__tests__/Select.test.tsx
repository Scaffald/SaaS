/**
 * Select Component Tests
 * REQ-288: Tamagui UI Component Library
 *
 * MIGRATED FROM: FRS-Prototype/packages/forms/src/__tests__/Select.test.tsx
 * Migration Notes:
 * - Updated import path to use ResponsiveSelect from ../components/select/ResponsiveSelect
 * - TODO: Verify ResponsiveSelect API matches original Select API (value, onValueChange, options, etc.)
 * - TODO: ResponsiveSelect may have different mobile/web behavior - update tests as needed
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

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
    View: ({ children, ...props }: Record<string, unknown>) => React.createElement('div', props, children as React.ReactNode),
    Text: ({ children, ...props }: Record<string, unknown>) => React.createElement('span', props, children as React.ReactNode),
  }
})

// Mock lucide icons
vi.mock('@tamagui/lucide-icons', async () => {
  const React = await import('react')
  return {
    ChevronDown: () => React.createElement('svg', { 'data-testid': 'chevron-down-icon' }),
    Check: () => React.createElement('svg', { 'data-testid': 'check-icon' }),
  }
})

// TODO: Update import path once ResponsiveSelect API is verified
import { ResponsiveSelect as Select } from '../components/select/ResponsiveSelect'

const mockOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
]

describe('Select Component', () => {
  describe('Basic Rendering', () => {
    it('should render select trigger', () => {
      render(<Select options={mockOptions} />)

      expect(screen.getByText('Select an option')).toBeInTheDocument()
    })

    it('should render with custom placeholder', () => {
      render(<Select options={mockOptions} placeholder="Choose one" />)

      expect(screen.getByText('Choose one')).toBeInTheDocument()
    })

    it('should render with label', () => {
      render(<Select options={mockOptions} label="Category" />)

      expect(screen.getByText('Category')).toBeInTheDocument()
    })

    it('should render chevron icon', () => {
      render(<Select options={mockOptions} />)

      expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument()
    })
  })

  describe('Selected Value Display', () => {
    it('should display selected option label', () => {
      render(<Select options={mockOptions} value="option2" />)

      expect(screen.getByText('Option 2')).toBeInTheDocument()
    })

    it('should display placeholder when no value', () => {
      render(<Select options={mockOptions} />)

      expect(screen.getByText('Select an option')).toBeInTheDocument()
    })
  })

  describe('Dropdown Behavior', () => {
    it('should not show dropdown initially', () => {
      render(<Select options={mockOptions} />)

      expect(screen.queryByText('Option 1')).not.toBeInTheDocument()
    })

    it('should open dropdown when trigger is clicked', () => {
      render(<Select options={mockOptions} />)

      fireEvent.click(screen.getByText('Select an option'))

      expect(screen.getByText('Option 1')).toBeInTheDocument()
      expect(screen.getByText('Option 2')).toBeInTheDocument()
      expect(screen.getByText('Option 3')).toBeInTheDocument()
    })

    it('should close dropdown when option is selected', () => {
      const onValueChange = vi.fn()
      render(<Select options={mockOptions} onValueChange={onValueChange} />)

      fireEvent.click(screen.getByText('Select an option'))
      fireEvent.click(screen.getByText('Option 2'))

      expect(onValueChange).toHaveBeenCalledWith('option2')
    })

    it('should not open dropdown when disabled', () => {
      render(<Select options={mockOptions} disabled />)

      fireEvent.click(screen.getByText('Select an option'))

      expect(screen.queryByText('Option 1')).not.toBeInTheDocument()
    })
  })

  describe('Option Selection', () => {
    it('should call onValueChange with selected value', () => {
      const onValueChange = vi.fn()
      render(<Select options={mockOptions} onValueChange={onValueChange} />)

      fireEvent.click(screen.getByText('Select an option'))
      fireEvent.click(screen.getByText('Option 1'))

      expect(onValueChange).toHaveBeenCalledWith('option1')
    })

    it('should show check icon for selected option', () => {
      render(<Select options={mockOptions} value="option2" />)

      fireEvent.click(screen.getByText('Option 2'))

      expect(screen.getByTestId('check-icon')).toBeInTheDocument()
    })

    it('should not select disabled option', () => {
      const optionsWithDisabled = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2', disabled: true },
      ]
      const onValueChange = vi.fn()
      render(<Select options={optionsWithDisabled} onValueChange={onValueChange} />)

      fireEvent.click(screen.getByText('Select an option'))
      fireEvent.click(screen.getByText('Option 2'))

      expect(onValueChange).not.toHaveBeenCalled()
    })
  })

  describe('Error State', () => {
    it('should display error message', () => {
      render(<Select options={mockOptions} error="Please select an option" />)

      expect(screen.getByText('Please select an option')).toBeInTheDocument()
    })
  })

  describe('Disabled State', () => {
    it('should not open dropdown when disabled', () => {
      render(<Select options={mockOptions} disabled />)

      fireEvent.click(screen.getByText('Select an option'))

      expect(screen.queryByText('Option 1')).not.toBeInTheDocument()
    })
  })

  describe('Combined Props', () => {
    it('should render with all props', () => {
      render(
        <Select
          options={mockOptions}
          value="option1"
          label="Select Category"
          placeholder="Pick one"
        />
      )

      expect(screen.getByText('Select Category')).toBeInTheDocument()
      expect(screen.getByText('Option 1')).toBeInTheDocument()
    })

    it('should render with label and error', () => {
      render(
        <Select
          options={mockOptions}
          label="Category"
          error="Selection required"
        />
      )

      expect(screen.getByText('Category')).toBeInTheDocument()
      expect(screen.getByText('Selection required')).toBeInTheDocument()
    })
  })

  describe('Multiple Options', () => {
    it('should render many options', () => {
      const manyOptions = Array.from({ length: 10 }, (_, i) => ({
        value: `option${i}`,
        label: `Option ${i}`,
      }))
      render(<Select options={manyOptions} />)

      fireEvent.click(screen.getByText('Select an option'))

      expect(screen.getByText('Option 0')).toBeInTheDocument()
      expect(screen.getByText('Option 9')).toBeInTheDocument()
    })
  })
})
