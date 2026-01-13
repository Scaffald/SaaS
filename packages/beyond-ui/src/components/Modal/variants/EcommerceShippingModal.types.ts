/**
 * EcommerceShippingModal component type definitions
 */

import type { ViewStyle } from 'react-native'
import type React from 'react'

export interface ShippingOption {
  /**
   * Unique identifier for the shipping option
   */
  id: string

  /**
   * Shipping option title (e.g., "Free Shipping", "Express Shipping")
   */
  title: string

  /**
   * Shipping option description (e.g., "7-10 days for delivery")
   */
  description: string

  /**
   * Optional icon for the shipping option
   */
  icon?: React.ReactNode

  /**
   * Optional price display (e.g., "$29", "Free")
   */
  price?: string
}

export interface EcommerceShippingModalProps {
  /**
   * List of shipping options to display
   */
  options: ShippingOption[]

  /**
   * Currently selected option ID
   */
  selectedId?: string

  /**
   * Callback when an option is selected
   */
  onSelect: (id: string) => void

  /**
   * Custom style for the container
   */
  style?: ViewStyle
}
