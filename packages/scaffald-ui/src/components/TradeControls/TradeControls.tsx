/**
 * TradeControls component
 * Buy/sell controls for trading interface with inputs and actions
 *
 * @example
 * ```tsx
 * import { TradeControls } from '@scaffald/ui'
 *
 * <TradeControls
 *   mode="buy"
 *   asset={{ symbol: 'BTC', name: 'Bitcoin', price: 45234.50 }}
 *   amount="0.5"
 *   price="45234.50"
 *   availableBalance={1.25}
 *   availableBalanceUSD={56543.13}
 *   onSubmit={(mode, amount, price) => console.log('Trade', mode, amount, price)}
 * />
 * ```
 */

import { View, Text, StyleSheet } from 'react-native'
import type { TradeControlsProps } from './TradeControls.types'
import { getContainerStyles } from './TradeControls.styles'
import { useThemeContext } from '../../theme'
import { Input } from '../Input'
import { Button } from '../Button'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { typographyVariants } from '../../tokens/typography'

export function TradeControls({
  mode = 'buy',
  asset,
  amount = '',
  price = '',
  total,
  availableBalance,
  availableBalanceUSD,
  onAmountChange,
  onPriceChange,
  onSubmit,
  disabled = false,
  style,
}: TradeControlsProps) {
  const { theme } = useThemeContext()
  const containerStyles = getContainerStyles(theme)

  const isBuy = mode === 'buy'
  const buttonColor = isBuy ? 'primary' : 'gray'
  const buttonText = isBuy ? `Buy ${asset?.symbol || ''}` : `Sell ${asset?.symbol || ''}`

  // Calculate total if not provided
  const calculatedTotal =
    total ||
    (amount && price
      ? (parseFloat(amount) * parseFloat(price)).toFixed(2)
      : undefined)

  const handleSubmit = () => {
    if (onSubmit && amount && price) {
      onSubmit(mode, amount, price)
    }
  }

  return (
    <View style={[containerStyles, styles.container, style]}>
      <View style={styles.header}>
        <Text
          style={[
            typographyVariants.h6SemiBold,
            {
              color: theme === 'light' ? colors.text.light.primary : colors.text.dark.primary,
            },
          ]}
        >
          {isBuy ? 'Buy' : 'Sell'} {asset?.symbol || ''}
        </Text>
        {asset && (
          <Text
            style={[
              typographyVariants.paragraphSRegular,
              {
                color: theme === 'light' ? colors.text.light.secondary : colors.text.dark.secondary,
              },
            ]}
          >
            ${asset.price.toLocaleString()}
          </Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Input
          label="Amount"
          placeholder="0.00"
          value={amount}
          onChangeText={onAmountChange}
          disabled={disabled}
          keyboardType="numeric"
        />
        <Input
          label="Price"
          placeholder="0.00"
          value={price}
          onChangeText={onPriceChange}
          disabled={disabled}
          keyboardType="numeric"
        />
        {calculatedTotal && (
          <View style={styles.balanceInfo}>
            <Text
              style={[
                typographyVariants.paragraphSRegular,
                {
                  color:
                    theme === 'light' ? colors.text.light.secondary : colors.text.dark.secondary,
                },
              ]}
            >
              Total
            </Text>
            <Text
              style={[
                typographyVariants.paragraphMMedium,
                {
                  color: theme === 'light' ? colors.text.light.primary : colors.text.dark.primary,
                },
              ]}
            >
              ${calculatedTotal}
            </Text>
          </View>
        )}
      </View>

      {availableBalance !== undefined && (
        <View style={styles.balanceInfo}>
          <Text
            style={[
              typographyVariants.paragraphSRegular,
              {
                color: theme === 'light' ? colors.text.light.secondary : colors.text.dark.secondary,
              },
            ]}
          >
            Available
          </Text>
          <View style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
            <Text
              style={[
                typographyVariants.paragraphSMedium,
                {
                  color: theme === 'light' ? colors.text.light.primary : colors.text.dark.primary,
                },
              ]}
            >
              {availableBalance.toFixed(8)} {asset?.symbol || ''}
            </Text>
            {availableBalanceUSD !== undefined && (
              <Text
                style={[
                  typographyVariants.paragraphSRegular,
                  {
                    color:
                      theme === 'light' ? colors.text.light.tertiary : colors.text.dark.tertiary,
                  },
                ]}
              >
                ${availableBalanceUSD.toLocaleString()}
              </Text>
            )}
          </View>
        </View>
      )}

      <View style={styles.actions}>
        <Button
          color={buttonColor}
          variant="filled"
          size="lg"
          fullWidth
          onPress={handleSubmit}
          disabled={disabled || !amount || !price}
        >
          {buttonText}
        </Button>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: spacing[16],
    padding: spacing[24],
    borderRadius: 12,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[8],
  },
  inputGroup: {
    flexDirection: 'column',
    gap: spacing[12],
  },
  balanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing[8],
    paddingBottom: spacing[8],
  },
  actions: {
    flexDirection: 'column',
    gap: spacing[12],
    marginTop: spacing[8],
  },
})
