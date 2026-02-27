/**
 * EcommerceShippingModal component
 * Modal content variant for selecting shipping options
 * Displays a list of radio button shipping options
 * Mapped from Figma Forsured Design System
 *
 * @example
 * ```tsx
 * import { EcommerceShippingModal } from '@scaffald/ui'
 *
 * <EcommerceShippingModal
 *   options={[
 *     {
 *       id: 'free',
 *       title: 'Free Shipping',
 *       description: '7-10 days for delivery',
 *       icon: <TruckIcon />,
 *     },
 *     {
 *       id: 'express',
 *       title: 'Express Shipping',
 *       description: '1 day delivery for additional $29',
 *       price: '$29',
 *     },
 *   ]}
 *   selectedId={selectedId}
 *   onSelect={setSelectedId}
 * />
 * ```
 */

import { View, StyleSheet } from 'react-native'
import type { EcommerceShippingModalProps } from './EcommerceShippingModal.types'
import { useThemeContext } from '../../../theme'
import { spacing } from '../../../tokens/spacing'
import { SelectionCard } from '../../SelectionCard'

export function EcommerceShippingModal({
  options,
  selectedId,
  onSelect,
  style,
}: EcommerceShippingModalProps) {
  const { theme } = useThemeContext()

  return (
    <View style={[localStyles.container, style]}>
      {options.map((option) => {
        const isSelected = selectedId === option.id

        return (
          <SelectionCard
            key={option.id}
            type="radio"
            title={option.title}
            description={option.description}
            selected={isSelected}
            onChange={() => onSelect(option.id)}
            leadingContent={option.icon}
            size="md"
            color="primary"
          />
        )
      })}
    </View>
  )
}

const localStyles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: spacing[8],
    paddingVertical: spacing[8],
  },
})
