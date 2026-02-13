/**
 * Crypto Stock Widget component
 * Displays cryptocurrency stock information with price and chart
 *
 * @example
 * ```tsx
 * <CryptoStockWidget
 *   variant="Crypto Stock 01"
 *   symbol="BTC"
 *   name="Bitcoin"
 *   price={45000}
 *   change="+5.2%"
 *   changeType="positive"
 *   chartData={[40000, 41000, 42000, 45000]}
 * />
 * ```
 */

import { View, Text, StyleSheet } from 'react-native'
import type { CryptoStockWidgetProps } from './CryptoWidget.types'
import { MiniLinearChart } from '../../Chart'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'
import { typographyVariants } from '../../../tokens/typography'

export function CryptoStockWidget({
  variant = 'Crypto Stock 01',
  symbol,
  name,
  price,
  change,
  changeType = 'positive',
  chartData,
  style,
}: CryptoStockWidgetProps) {
  const priceValue = typeof price === 'number' ? `$${price.toLocaleString()}` : price
  const isCompact = variant === 'Crypto Stock 02'

  return (
    <View style={[styles.container, isCompact && styles.compactContainer, style]}>
      <View style={styles.header}>
        <View style={styles.symbolSection}>
          <Text style={styles.symbol}>{symbol}</Text>
          {name && !isCompact && <Text style={styles.name}>{name}</Text>}
        </View>
        {change && (
          <Text
            style={[
              styles.change,
              changeType === 'positive' ? styles.changePositive : styles.changeNegative,
            ]}
          >
            {change}
          </Text>
        )}
      </View>

      <View style={styles.priceSection}>
        <Text style={styles.price}>{priceValue}</Text>
        {chartData && chartData.length > 0 && !isCompact && (
          <MiniLinearChart
            data={chartData}
            shadow={true}
            color={changeType === 'positive' ? colors.success[500] : colors.error[500]}
          />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: spacing[12],
    padding: spacing[16],
    backgroundColor: colors.bg.light.default,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light.default,
    width: 320,
    minHeight: 294,
  },
  compactContainer: {
    minHeight: 92,
    width: 280,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  symbolSection: {
    flexDirection: 'column',
    gap: spacing[4],
  },
  symbol: {
    ...typographyVariants.paragraphMMedium,
    color: colors.text.primary,
  },
  name: {
    ...typographyVariants.captionRegular,
    color: colors.text.tertiary,
  },
  change: {
    ...typographyVariants.paragraphSMedium,
  },
  changePositive: {
    color: colors.success[500],
  },
  changeNegative: {
    color: colors.error[500],
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    ...typographyVariants.h5SemiBold,
    color: colors.text.primary,
  },
})
