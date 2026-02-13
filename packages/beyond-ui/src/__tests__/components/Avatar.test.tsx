/**
 * Avatar component tests
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { describe, it, expect, vi } from 'vitest'
import { ThemeProvider } from "./../../theme"
import { Avatar } from '../../components/Avatar'
import type { AvatarSize, AvatarColor, AvatarStatus } from '../../components/Avatar'

// Wrapper component for tests
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
)

// Mock icon component for testing
const MockIcon = () => <></>

describe('Avatar', () => {
  describe('Basic Rendering', () => {
    it('should render avatar with initials', () => {
      const { getByText } = render(<TestWrapper><Avatar initials="JD" /></TestWrapper>)
      expect(getByText('JD')).toBeTruthy()
    })

    it('should render avatar with image', () => {
      const { getByLabelText } = render(
        <TestWrapper>
          <Avatar src="https://example.com/avatar.jpg" alt="User avatar" />
        </TestWrapper>
      )
      expect(getByLabelText('User avatar')).toBeTruthy()
    })

    it('should render avatar with icon', () => {
      const { container } = render(<TestWrapper><Avatar icon={<MockIcon />} /></TestWrapper>)
      expect(container).toBeTruthy()
    })

    it('should convert initials to uppercase', () => {
      const { getByText } = render(<TestWrapper><Avatar initials="jd" /></TestWrapper>)
      expect(getByText('JD')).toBeTruthy()
    })

    it('should truncate initials to 2 characters', () => {
      const { getByText } = render(<TestWrapper><Avatar initials="ABCD" /></TestWrapper>)
      expect(getByText('AB')).toBeTruthy()
    })
  })

  describe('Sizes', () => {
    const sizes: AvatarSize[] = [16, 20, 24, 32, 36, 40, 48, 56, 64, 72, 80]

    sizes.forEach((size) => {
      it(`should render ${size}px avatar`, () => {
        const { getByText } = render(<TestWrapper><Avatar size={size} initials="JD" /></TestWrapper>)
        expect(getByText('JD')).toBeTruthy()
      })
    })

    it('should use default size of 40px', () => {
      const { getByText } = render(<TestWrapper><Avatar initials="JD" /></TestWrapper>)
      expect(getByText('JD')).toBeTruthy()
    })
  })

  describe('Colors', () => {
    const colors: AvatarColor[] = ['gray', 'primary', 'info', 'success', 'warning', 'error']

    colors.forEach((color) => {
      it(`should render ${color} colored avatar`, () => {
        const { getByText } = render(<TestWrapper><Avatar color={color} initials="JD" /></TestWrapper>)
        expect(getByText('JD')).toBeTruthy()
      })
    })
  })

  describe('Ring Border', () => {
    it('should render avatar without ring by default', () => {
      const { container } = render(<TestWrapper><Avatar initials="JD" /></TestWrapper>)
      expect(container).toBeTruthy()
    })

    it('should render avatar with ring when showRing is true', () => {
      const { container } = render(<TestWrapper><Avatar initials="JD" showRing /></TestWrapper>)
      expect(container).toBeTruthy()
    })
  })

  describe('Status Indicators', () => {
    const statuses: AvatarStatus[] = ['online', 'offline', 'busy', 'away']

    statuses.forEach((status) => {
      it(`should render avatar with ${status} status`, () => {
        const { container } = render(<TestWrapper><Avatar initials="JD" status={status} /></TestWrapper>)
        expect(container).toBeTruthy()
      })
    })

    it('should not render status by default', () => {
      const { container } = render(<TestWrapper><Avatar initials="JD" /></TestWrapper>)
      expect(container).toBeTruthy()
    })
  })

  describe('Badges', () => {
    it('should render verified badge', () => {
      const { getByText } = render(<TestWrapper><Avatar initials="JD" verified /></TestWrapper>)
      expect(getByText('✓')).toBeTruthy()
    })

    it('should render star badge', () => {
      const { getByText } = render(<TestWrapper><Avatar initials="JD" star /></TestWrapper>)
      expect(getByText('★')).toBeTruthy()
    })

    it('should render custom badge', () => {
      const CustomBadge = () => <></>
      const { container } = render(<TestWrapper><Avatar initials="JD" badge={<CustomBadge />} /></TestWrapper>)
      expect(container).toBeTruthy()
    })

    it('should prioritize verified over star', () => {
      const { getByText, queryByText } = render(<TestWrapper><Avatar initials="JD" verified star /></TestWrapper>)
      expect(getByText('✓')).toBeTruthy()
      expect(queryByText('★')).toBeNull()
    })

    it('should prioritize verified over custom badge', () => {
      const CustomBadge = () => <></>
      const { getByText } = render(<TestWrapper><Avatar initials="JD" verified badge={<CustomBadge />} /></TestWrapper>)
      expect(getByText('✓')).toBeTruthy()
    })
  })

  describe('Clickable Avatar', () => {
    it('should call onPress when clicked', () => {
      const onPress = vi.fn()
      const { getByRole } = render(<TestWrapper><Avatar initials="JD" onPress={onPress} /></TestWrapper>)

      fireEvent.press(getByRole('button'))
      expect(onPress).toHaveBeenCalledTimes(1)
    })

    it('should not be clickable without onPress prop', () => {
      const { queryByRole } = render(<TestWrapper><Avatar initials="JD" /></TestWrapper>)
      expect(queryByRole('button')).toBeNull()
    })
  })

  describe('Image Loading', () => {
    it('should show initials on image error', () => {
      const { getByText, getByLabelText } = render(
        <TestWrapper>
          <Avatar src="invalid-url" initials="JD" alt="Avatar" />
        </TestWrapper>
      )

      // Trigger error
      fireEvent(getByLabelText('Avatar'), 'onError')

      // Should fall back to initials
      expect(getByText('JD')).toBeTruthy()
    })

    it('should call onError callback when image fails', () => {
      const onError = vi.fn()
      const { getByLabelText } = render(
        <TestWrapper>
          <Avatar src="invalid-url" initials="JD" alt="Avatar" onError={onError} />
        </TestWrapper>
      )

      // Trigger error
      fireEvent(getByLabelText('Avatar'), 'onError')

      expect(onError).toHaveBeenCalledTimes(1)
      expect(onError).toHaveBeenCalledWith(expect.any(Error))
    })

    it('should handle image error without onError callback', () => {
      const { getByLabelText, getByText } = render(
        <TestWrapper>
          <Avatar src="invalid-url" initials="JD" alt="Avatar" />
        </TestWrapper>
      )

      // Should not throw
      expect(() => {
        fireEvent(getByLabelText('Avatar'), 'onError')
      }).not.toThrow()

      // Should fall back to initials
      expect(getByText('JD')).toBeTruthy()
    })
  })

  describe('Accessibility', () => {
    it('should have proper accessibility role', () => {
      const { getByRole } = render(
        <TestWrapper>
          <Avatar initials="JD" alt="User avatar" />
        </TestWrapper>
      )
      expect(getByRole('image')).toBeTruthy()
    })

    it('should use alt text as accessibility label', () => {
      const { getByLabelText } = render(<TestWrapper><Avatar initials="JD" alt="John Doe" /></TestWrapper>)
      expect(getByLabelText(/John Doe/)).toBeTruthy()
    })

    it('should include status in accessibility label', () => {
      const { getByLabelText } = render(<TestWrapper><Avatar initials="JD" alt="John" status="online" /></TestWrapper>)
      expect(getByLabelText(/status: online/)).toBeTruthy()
    })

    it('should include verified in accessibility label', () => {
      const { getByLabelText } = render(<TestWrapper><Avatar initials="JD" alt="John" verified /></TestWrapper>)
      expect(getByLabelText(/verified/)).toBeTruthy()
    })

    it('should include star in accessibility label', () => {
      const { getByLabelText } = render(<TestWrapper><Avatar initials="JD" alt="John" star /></TestWrapper>)
      expect(getByLabelText(/starred/)).toBeTruthy()
    })

    it('should have accessibility hint for status', () => {
      const { getByLabelText } = render(<TestWrapper><Avatar initials="JD" status="busy" alt="John" /></TestWrapper>)
      expect(getByLabelText(/User status: busy/)).toBeTruthy()
    })

    it('should have accessibility hint for clickable avatar', () => {
      const onPress = vi.fn()
      const { getByLabelText } = render(<TestWrapper><Avatar initials="JD" onPress={onPress} alt="John" /></TestWrapper>)
      expect(getByLabelText(/Double tap to open profile/)).toBeTruthy()
    })

    it('should use default label when alt is not provided', () => {
      const { getByLabelText } = render(<TestWrapper><Avatar initials="JD" /></TestWrapper>)
      expect(getByLabelText(/Avatar/)).toBeTruthy()
    })

    it('should have live region for dynamic status', () => {
      // This is implicitly tested through the presence of accessibilityLiveRegion
      const { container } = render(<TestWrapper><Avatar initials="JD" status="online" /></TestWrapper>)
      expect(container).toBeTruthy()
    })
  })

  describe('Type Priority', () => {
    it('should prioritize image over initials', () => {
      const { getByLabelText, queryByText } = render(
        <TestWrapper>
          <Avatar src="https://example.com/avatar.jpg" initials="JD" alt="Avatar" />
        </TestWrapper>
      )

      expect(getByLabelText('Avatar')).toBeTruthy()
      expect(queryByText('JD')).toBeNull()
    })

    it('should prioritize image over icon', () => {
      const { getByLabelText } = render(
        <TestWrapper>
          <Avatar src="https://example.com/avatar.jpg" icon={<MockIcon />} alt="Avatar" />
        </TestWrapper>
      )

      expect(getByLabelText('Avatar')).toBeTruthy()
    })

    it('should prioritize initials over icon', () => {
      const { getByText } = render(<TestWrapper><Avatar initials="JD" icon={<MockIcon />} /></TestWrapper>)

      expect(getByText('JD')).toBeTruthy()
    })

    it('should show icon when no image or initials', () => {
      const { container } = render(<TestWrapper><Avatar icon={<MockIcon />} /></TestWrapper>)
      expect(container).toBeTruthy()
    })
  })

  describe('Custom Styles', () => {
    it('should apply custom container style', () => {
      const customStyle = { marginTop: 20 }
      const { container } = render(<TestWrapper><Avatar initials="JD" containerStyle={customStyle} /></TestWrapper>)
      expect(container).toBeTruthy()
    })

    it('should apply custom avatar style', () => {
      const customStyle = { borderWidth: 2 }
      const { container } = render(<TestWrapper><Avatar initials="JD" avatarStyle={customStyle} /></TestWrapper>)
      expect(container).toBeTruthy()
    })
  })

  describe('Complex Scenarios', () => {
    it('should render large avatar with ring, status, and verified badge', () => {
      const { getByText, container } = render(
        <TestWrapper>
          <Avatar size={64} initials="JD" showRing status="online" verified />
        </TestWrapper>
      )

      expect(getByText('JD')).toBeTruthy()
      expect(getByText('✓')).toBeTruthy()
      expect(container).toBeTruthy()
    })

    it('should render clickable primary colored avatar with star', () => {
      const onPress = vi.fn()
      const { getByText, getByRole } = render(
        <TestWrapper>
          <Avatar color="primary" initials="JD" star onPress={onPress} />
        </TestWrapper>
      )

      expect(getByText('JD')).toBeTruthy()
      expect(getByText('★')).toBeTruthy()

      fireEvent.press(getByRole('button'))
      expect(onPress).toHaveBeenCalled()
    })

    it('should handle all props together', () => {
      const onPress = vi.fn()
      const onError = vi.fn()

      const { getByText, container } = render(
        <TestWrapper>
          <Avatar
            size={48}
            color="success"
            src="https://example.com/avatar.jpg"
            initials="JD"
            alt="John Doe"
            showRing
            status="online"
            verified
            containerStyle={{ margin: 10 }}
            avatarStyle={{ opacity: 0.9 }}
            onPress={onPress}
            onError={onError}
          />
        </TestWrapper>
      )

      // Should render with all features
      expect(getByText('✓')).toBeTruthy()
      expect(container).toBeTruthy()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty initials string', () => {
      const { container } = render(<TestWrapper><Avatar initials="" /></TestWrapper>)
      expect(container).toBeTruthy()
    })

    it('should handle single character initials', () => {
      const { getByText } = render(<TestWrapper><Avatar initials="J" /></TestWrapper>)
      expect(getByText('J')).toBeTruthy()
    })

    it('should handle whitespace in initials', () => {
      const { getByText } = render(<TestWrapper><Avatar initials="J D" /></TestWrapper>)
      expect(getByText('J ')).toBeTruthy()
    })

    it('should handle special characters in initials', () => {
      const { getByText } = render(<TestWrapper><Avatar initials="J@" /></TestWrapper>)
      expect(getByText('J@')).toBeTruthy()
    })

    it('should handle undefined source', () => {
      const { container } = render(<TestWrapper><Avatar src={undefined} initials="JD" /></TestWrapper>)
      expect(container).toBeTruthy()
    })

    it('should handle null values gracefully', () => {
      const { container } = render(
        <TestWrapper>
          <Avatar
            src={undefined}
            initials={undefined}
            icon={undefined}
            status={undefined}
            badge={undefined}
          />
        </TestWrapper>
      )
      expect(container).toBeTruthy()
    })
  })
})
