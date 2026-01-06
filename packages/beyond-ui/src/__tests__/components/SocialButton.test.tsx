/**
 * SocialButton component tests
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { describe, it, expect, vi } from 'vitest'
import { SocialButton } from '../../components/SocialButton'
import type { SocialBrand, SocialButtonStyle } from '../../components/SocialButton'

// Mock icon component for testing
const MockIcon = ({ size, color }: { size: number; color: string }) => <></>

describe('SocialButton', () => {
  describe('Basic Rendering', () => {
    it('should render button with default text for brand', () => {
      const { getByText } = render(<SocialButton brand="apple" />)
      expect(getByText('Continue with Apple')).toBeTruthy()
    })

    it('should render all brand variants', () => {
      const brands: SocialBrand[] = ['apple', 'google', 'microsoft', 'facebook', 'x', 'dribbble', 'figma']

      brands.forEach((brand) => {
        const { getByRole, unmount } = render(<SocialButton brand={brand} />)
        expect(getByRole('button')).toBeTruthy()
        unmount()
      })
    })
  })

  describe('Custom Text', () => {
    it('should use custom text when provided', () => {
      const { getByText } = render(<SocialButton brand="google" text="Sign in with Google" />)
      expect(getByText('Sign in with Google')).toBeTruthy()
    })

    it('should override default text', () => {
      const { getByText, queryByText } = render(<SocialButton brand="apple" text="Custom Apple Text" />)
      expect(getByText('Custom Apple Text')).toBeTruthy()
      expect(queryByText('Continue with Apple')).toBeNull()
    })
  })

  describe('Style Variants', () => {
    const styles: SocialButtonStyle[] = ['filled', 'outline', 'outlineGray']

    styles.forEach((buttonStyle) => {
      it(`should render ${buttonStyle} style`, () => {
        const { getByRole, unmount } = render(<SocialButton brand="apple" buttonStyle={buttonStyle} />)
        expect(getByRole('button')).toBeTruthy()
        unmount()
      })
    })
  })

  describe('Custom Icon', () => {
    it('should accept custom icon component', () => {
      const { getByRole } = render(<SocialButton brand="apple" icon={MockIcon} />)
      expect(getByRole('button')).toBeTruthy()
    })
  })

  describe('Icon Only Mode', () => {
    it('should render icon-only button', () => {
      const { queryByText, getByRole } = render(<SocialButton brand="apple" icon={MockIcon} iconOnly />)
      expect(getByRole('button')).toBeTruthy()
      expect(queryByText('Continue with Apple')).toBeNull()
    })
  })

  describe('User Interactions', () => {
    it('should call onPress when clicked', () => {
      const onPress = vi.fn()
      const { getByRole } = render(<SocialButton brand="google" onPress={onPress} />)

      fireEvent.press(getByRole('button'))
      expect(onPress).toHaveBeenCalledTimes(1)
    })

    it('should not call onPress when disabled', () => {
      const onPress = vi.fn()
      const { getByRole } = render(<SocialButton brand="facebook" onPress={onPress} disabled />)

      fireEvent.press(getByRole('button'))
      expect(onPress).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should be accessible as a button', () => {
      const { getByRole } = render(<SocialButton brand="apple" />)
      expect(getByRole('button')).toBeTruthy()
    })

    it('should support accessibility label', () => {
      const { getByLabelText } = render(
        <SocialButton brand="google" accessibilityLabel="Sign in with Google account" />,
      )
      expect(getByLabelText('Sign in with Google account')).toBeTruthy()
    })
  })

  describe('Combined Variants', () => {
    it('should render filled style with custom text', () => {
      const { getByText } = render(
        <SocialButton brand="microsoft" buttonStyle="filled" text="Login with Microsoft" />,
      )
      expect(getByText('Login with Microsoft')).toBeTruthy()
    })

    it('should render outline style with custom icon', () => {
      const { getByRole } = render(
        <SocialButton brand="x" buttonStyle="outline" icon={MockIcon} />,
      )
      expect(getByRole('button')).toBeTruthy()
    })
  })
})
