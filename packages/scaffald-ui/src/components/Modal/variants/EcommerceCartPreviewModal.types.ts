/**
 * EcommerceCartPreviewModal component type definitions
 */

import type { ViewStyle } from 'react-native'

export interface CartItem {
  /**
   * Unique identifier for the cart item
   */
  id: string

  /**
   * Product image URL
   */
  image?: string

  /**
   * Product title
   */
  title: string

  /**
   * Product description/variant
   */
  description?: string

  /**
   * Product quantity
   */
  quantity: number

  /**
   * Product price per unit
   */
  price: number
}

export interface EcommerceCartPreviewModalProps {
  /**
   * List of cart items
   */
  items: CartItem[]

  /**
   * Callback when item quantity changes
   */
  onQuantityChange: (id: string, quantity: number) => void

  /**
   * Optional callback when item is removed
   */
  onRemove?: (id: string) => void

  /**
   * Optional callback when coupon code is applied
   */
  onApplyCoupon?: (code: string) => void

  /**
   * Subtotal amount
   */
  subtotal: number

  /**
   * Tax amount
   */
  tax: number

  /**
   * Total amount
   */
  total: number

  /**
   * Custom style for the container
   */
  style?: ViewStyle
}
