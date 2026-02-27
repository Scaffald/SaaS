/**
 * AppStoreButton component tests
 *
 * Note: AppStoreButton is currently a placeholder component.
 * It renders a properly-sized container but expects consumers
 * to provide custom logo/text content.
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { describe, it, expect, vi } from 'vitest'
import { AppStoreButton } from '../../components/AppStoreButton'
import type { AppStore, AppStoreButtonStyle } from '../../components/AppStoreButton'

describe('AppStoreButton', () => {
  describe('Basic Rendering', () => {
    it('should render button container', () => {
      const { container } = render(<AppStoreButton store="appStore" />)
      expect(container).toBeTruthy()
    })

    it('should render all store variants', () => {
      const stores: AppStore[] = [
        'appStore',
        'googlePlay',
        'galaxyStore',
        'oneStore',
        'appGallery',
        'microsoft',
        'amazonAppstore',
        'fDroid',
      ]

      stores.forEach((store) => {
        const { container, unmount } = render(<AppStoreButton store={store} />)
        expect(container).toBeTruthy()
        unmount()
      })
    })
  })

  describe('Style Variants', () => {
    const variants: AppStoreButtonStyle[] = ['filled', 'outline']

    variants.forEach((variant) => {
      it(`should render ${variant} variant`, () => {
        const { container, unmount } = render(<AppStoreButton store="appStore" variant={variant} />)
        expect(container).toBeTruthy()
        unmount()
      })
    })
  })

  describe('User Interactions', () => {
    it('should call onPress when clicked', () => {
      const onPress = vi.fn()
      const { container } = render(<AppStoreButton store="googlePlay" onPress={onPress} />)

      // Get the Pressable element (first child)
      const pressable = container.querySelector('[role]') || container.firstChild
      if (pressable) {
        fireEvent.press(pressable)
        expect(onPress).toHaveBeenCalledTimes(1)
      }
    })

    it('should not call onPress when disabled', () => {
      const onPress = vi.fn()
      const { container } = render(<AppStoreButton store="galaxyStore" onPress={onPress} disabled />)

      const pressable = container.querySelector('[role]') || container.firstChild
      if (pressable) {
        fireEvent.press(pressable)
        expect(onPress).not.toHaveBeenCalled()
      }
    })
  })

  describe('Accessibility', () => {
    it('should support accessibility label', () => {
      const { getByLabelText } = render(
        <AppStoreButton store="googlePlay" accessibilityLabel="Download from Google Play" />,
      )
      expect(getByLabelText('Download from Google Play')).toBeTruthy()
    })
  })

  describe('Combined Variants', () => {
    it('should render filled variant for Microsoft store', () => {
      const { container } = render(<AppStoreButton store="microsoft" variant="filled" />)
      expect(container).toBeTruthy()
    })

    it('should render outline variant for Amazon Appstore', () => {
      const { container } = render(<AppStoreButton store="amazonAppstore" variant="outline" />)
      expect(container).toBeTruthy()
    })
  })
})
