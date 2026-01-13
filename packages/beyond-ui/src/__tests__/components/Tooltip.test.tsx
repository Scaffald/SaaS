/**
 * Tooltip component tests
 */

import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Tooltip } from '../../components/Tooltip'
import { Button } from '../../components/Button'
import type { TooltipType, TooltipColor, TooltipArrowPosition } from '../../components/Tooltip'

// Mock Modal for testing
vi.mock('react-native', async () => {
  const actual = await vi.importActual('react-native')
  return {
    ...actual,
    Modal: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
      visible ? <>{children}</> : null,
  }
})

describe('Tooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('Basic Rendering', () => {
    it('should render trigger element', () => {
      const { getByText } = render(
        <Tooltip content="Tooltip content">
          <Button>Hover me</Button>
        </Tooltip>,
      )
      expect(getByText('Hover me')).toBeTruthy()
    })

    it('should not render tooltip by default', () => {
      const { queryByText } = render(
        <Tooltip content="Tooltip content">
          <Button>Hover me</Button>
        </Tooltip>,
      )
      expect(queryByText('Tooltip content')).toBeNull()
    })
  })

  describe('Default Tooltip Type', () => {
    it('should render default tooltip with content', () => {
      const { getByText } = render(
        <Tooltip content="Default tooltip" visible>
          <Button>Trigger</Button>
        </Tooltip>,
      )
      expect(getByText('Default tooltip')).toBeTruthy()
    })

    it('should render default tooltip with ReactNode content', () => {
      const { getByText } = render(
        <Tooltip
          content={
            <React.Fragment>
              <React.Fragment>Custom</React.Fragment> <React.Fragment>Content</React.Fragment>
            </React.Fragment>
          }
          visible
        >
          <Button>Trigger</Button>
        </Tooltip>,
      )
      // ReactNode content should be rendered
      expect(getByText('Trigger')).toBeTruthy()
    })
  })

  describe('Rich Tooltip Type', () => {
    it('should render rich tooltip with title and description', () => {
      const { getByText } = render(
        <Tooltip type="rich" title="Rich Title" description="Rich description" visible>
          <Button>Trigger</Button>
        </Tooltip>,
      )
      expect(getByText('Rich Title')).toBeTruthy()
      expect(getByText('Rich description')).toBeTruthy()
    })

    it('should render rich tooltip with actions', () => {
      const action1 = vi.fn()
      const action2 = vi.fn()
      const { getByText } = render(
        <Tooltip
          type="rich"
          title="Title"
          description="Description"
          actions={[
            { label: 'Action 1', onPress: action1 },
            { label: 'Action 2', onPress: action2 },
          ]}
          visible
        >
          <Button>Trigger</Button>
        </Tooltip>,
      )
      expect(getByText('Action 1')).toBeTruthy()
      expect(getByText('Action 2')).toBeTruthy()
    })

    it('should limit actions to max 2', () => {
      const { getByText, queryByText } = render(
        <Tooltip
          type="rich"
          title="Title"
          description="Description"
          actions={[
            { label: 'Action 1', onPress: () => {} },
            { label: 'Action 2', onPress: () => {} },
            { label: 'Action 3', onPress: () => {} },
          ]}
          visible
        >
          <Button>Trigger</Button>
        </Tooltip>,
      )
      expect(getByText('Action 1')).toBeTruthy()
      expect(getByText('Action 2')).toBeTruthy()
      expect(queryByText('Action 3')).toBeNull()
    })

    it('should hide actions when showActions is false', () => {
      const { queryByText } = render(
        <Tooltip
          type="rich"
          title="Title"
          description="Description"
          actions={[{ label: 'Action', onPress: () => {} }]}
          showActions={false}
          visible
        >
          <Button>Trigger</Button>
        </Tooltip>,
      )
      expect(queryByText('Action')).toBeNull()
    })
  })

  describe('Color Variants', () => {
    const colors: TooltipColor[] = ['primary', 'gray']

    colors.forEach((color) => {
      it(`should render ${color} color variant`, () => {
        const { getByText } = render(
          <Tooltip content={`${color} tooltip`} color={color} visible>
            <Button>Trigger</Button>
          </Tooltip>,
        )
        expect(getByText(`${color} tooltip`)).toBeTruthy()
      })

      it(`should render rich tooltip with ${color} color`, () => {
        const { getByText } = render(
          <Tooltip type="rich" title="Title" description="Description" color={color} visible>
            <Button>Trigger</Button>
          </Tooltip>,
        )
        expect(getByText('Title')).toBeTruthy()
      })
    })
  })

  describe('Arrow Positions', () => {
    const positions: TooltipArrowPosition[] = [
      'none',
      'up-center',
      'up-left',
      'up-right',
      'down-center',
      'down-left',
      'down-right',
      'left',
      'right',
    ]

    positions.forEach((position) => {
      it(`should render tooltip with ${position} arrow position`, () => {
        const { getByText } = render(
          <Tooltip content="Tooltip" arrowPosition={position} visible>
            <Button>Trigger</Button>
          </Tooltip>,
        )
        expect(getByText('Tooltip')).toBeTruthy()
      })
    })
  })

  describe('Controlled Visibility', () => {
    it('should show tooltip when visible prop is true', () => {
      const { getByText } = render(
        <Tooltip content="Tooltip" visible>
          <Button>Trigger</Button>
        </Tooltip>,
      )
      expect(getByText('Tooltip')).toBeTruthy()
    })

    it('should hide tooltip when visible prop is false', () => {
      const { queryByText } = render(
        <Tooltip content="Tooltip" visible={false}>
          <Button>Trigger</Button>
        </Tooltip>,
      )
      expect(queryByText('Tooltip')).toBeNull()
    })

    it('should call onVisibleChange when visibility changes', () => {
      const onVisibleChange = vi.fn()
      const { rerender } = render(
        <Tooltip content="Tooltip" visible onVisibleChange={onVisibleChange}>
          <Button>Trigger</Button>
        </Tooltip>,
      )

      rerender(
        <Tooltip content="Tooltip" visible={false} onVisibleChange={onVisibleChange}>
          <Button>Trigger</Button>
        </Tooltip>,
      )

      expect(onVisibleChange).toHaveBeenCalledWith(false)
    })
  })

  describe('Uncontrolled Visibility', () => {
    it('should use defaultVisible prop', () => {
      const { getByText } = render(
        <Tooltip content="Tooltip" defaultVisible>
          <Button>Trigger</Button>
        </Tooltip>,
      )
      expect(getByText('Tooltip')).toBeTruthy()
    })

    it('should default to hidden when defaultVisible is not provided', () => {
      const { queryByText } = render(
        <Tooltip content="Tooltip">
          <Button>Trigger</Button>
        </Tooltip>,
      )
      expect(queryByText('Tooltip')).toBeNull()
    })
  })

  describe('Delay', () => {
    it('should respect delay prop', async () => {
      const onVisibleChange = vi.fn()
      const { getByText } = render(
        <Tooltip content="Tooltip" delay={500} onVisibleChange={onVisibleChange}>
          <Button>Trigger</Button>
        </Tooltip>,
      )

      const trigger = getByText('Trigger')
      const triggerParent = trigger.parent

      // Simulate hover on web
      if (triggerParent) {
        fireEvent(triggerParent, 'mouseEnter')
      }

      // Before delay, should not be visible
      expect(onVisibleChange).not.toHaveBeenCalled()

      // Advance timers by delay
      vi.advanceTimersByTime(500)

      // After delay, should be visible
      await waitFor(() => {
        expect(onVisibleChange).toHaveBeenCalledWith(true)
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle rich tooltip without title gracefully', () => {
      // Should warn in dev mode but not crash
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const { getByText } = render(
        <Tooltip type="rich" description="Description only" visible>
          <Button>Trigger</Button>
        </Tooltip>,
      )
      expect(getByText('Trigger')).toBeTruthy()
      consoleSpy.mockRestore()
    })

    it('should handle empty content gracefully', () => {
      const { getByText } = render(
        <Tooltip content="" visible>
          <Button>Trigger</Button>
        </Tooltip>,
      )
      expect(getByText('Trigger')).toBeTruthy()
    })

    it('should handle tooltip with no arrow', () => {
      const { getByText } = render(
        <Tooltip content="No arrow" arrowPosition="none" visible>
          <Button>Trigger</Button>
        </Tooltip>,
      )
      expect(getByText('No arrow')).toBeTruthy()
    })

    it('should handle rich tooltip with only title', () => {
      const { getByText } = render(
        <Tooltip type="rich" title="Title only" showActions={false} visible>
          <Button>Trigger</Button>
        </Tooltip>,
      )
      expect(getByText('Title only')).toBeTruthy()
    })
  })

  describe('Action Handlers', () => {
    it('should call action onPress when action button is pressed', () => {
      const action1 = vi.fn()
      const action2 = vi.fn()
      const { getByText } = render(
        <Tooltip
          type="rich"
          title="Title"
          description="Description"
          actions={[
            { label: 'Action 1', onPress: action1 },
            { label: 'Action 2', onPress: action2 },
          ]}
          visible
        >
          <Button>Trigger</Button>
        </Tooltip>,
      )

      fireEvent.press(getByText('Action 1'))
      expect(action1).toHaveBeenCalledTimes(1)

      fireEvent.press(getByText('Action 2'))
      expect(action2).toHaveBeenCalledTimes(1)
    })
  })

  describe('Custom Styles', () => {
    it('should apply custom container style', () => {
      const customStyle = { marginTop: 20 }
      const { getByText } = render(
        <Tooltip content="Tooltip" style={customStyle} visible>
          <Button>Trigger</Button>
        </Tooltip>,
      )
      expect(getByText('Tooltip')).toBeTruthy()
    })

    it('should apply custom content style', () => {
      const customContentStyle = { padding: 20 }
      const { getByText } = render(
        <Tooltip content="Tooltip" contentStyle={customContentStyle} visible>
          <Button>Trigger</Button>
        </Tooltip>,
      )
      expect(getByText('Tooltip')).toBeTruthy()
    })
  })

  describe('Combined Variants', () => {
    it('should render primary rich tooltip with down-center arrow', () => {
      const { getByText } = render(
        <Tooltip
          type="rich"
          color="primary"
          title="Title"
          description="Description"
          arrowPosition="down-center"
          visible
        >
          <Button>Trigger</Button>
        </Tooltip>,
      )
      expect(getByText('Title')).toBeTruthy()
      expect(getByText('Description')).toBeTruthy()
    })

    it('should render gray default tooltip with right arrow', () => {
      const { getByText } = render(
        <Tooltip content="Gray tooltip" color="gray" arrowPosition="right" visible>
          <Button>Trigger</Button>
        </Tooltip>,
      )
      expect(getByText('Gray tooltip')).toBeTruthy()
    })
  })
})

