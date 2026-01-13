/**
 * Virtual Cards Widget component
 * Card management interface for virtual cards
 *
 * @example
 * ```tsx
 * <VirtualCardsWidget
 *   cards={[
 *     { id: '1', name: 'Card 1', last4: '1234' },
 *   ]}
 *   onCreateCard={() => console.log('Create card')}
 * />
 * ```
 */

import { View, Text, Pressable, StyleSheet } from 'react-native'
import type { ViewStyle } from 'react-native'
import { CreditCardWidget } from './CreditCardWidget'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'
import { typographyVariants } from '../../../tokens/typography'

export interface VirtualCard {
  id: string
  name: string
  last4: string
  balance?: string
  limit?: string
}

export interface VirtualCardsWidgetProps {
  /**
   * Array of virtual cards
   */
  cards?: VirtualCard[]

  /**
   * Create new card handler
   */
  onCreateCard?: () => void

  /**
   * Custom container style
   */
  style?: ViewStyle
}

export function VirtualCardsWidget({
  cards = [],
  onCreateCard,
  style,
}: VirtualCardsWidgetProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>Virtual Cards</Text>

      <View style={styles.cardsList}>
        {cards.map((card) => (
          <CreditCardWidget
            key={card.id}
            variant="Interactive - Credit Card"
            cardNumber={card.last4}
            balance={card.balance}
            limit={card.limit}
          />
        ))}

        {onCreateCard && (
          <Pressable onPress={onCreateCard} style={styles.createButton}>
            <Text style={styles.createButtonText}>+ Create New Card</Text>
          </Pressable>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: spacing[16],
    width: 320,
    minHeight: 275,
  },
  title: {
    ...typographyVariants.paragraphMMedium,
    color: colors.text.primary,
  },
  cardsList: {
    flexDirection: 'column',
    gap: spacing[12],
  },
  createButton: {
    padding: spacing[16],
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.light.default,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 152,
  },
  createButtonText: {
    ...typographyVariants.paragraphMMedium,
    color: colors.primary[500],
  },
})
