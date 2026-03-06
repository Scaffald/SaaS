/**
 * Crypto Single Price Widget component
 * Displays single cryptocurrency price with chart
 *
 * @example
 * ```tsx
 * <CryptoSinglePriceWidget
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
import type { CryptoSinglePriceWidgetProps } from './CryptoWidget.types'
import { LinearChart } from '../Charts'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'
import { typographyVariants } from '../../../tokens/typography'
import { useThemeContext } from '../../../theme'
import type { ResolvedThemeMode } from '../../../tokens/colors'

export function CryptoSinglePriceWidget({
  symbol,
  name,
  price,
  change,
  changeType = 'positive',
  chartData,
  style,
}: CryptoSinglePriceWidgetProps) {
  const { theme } = useThemeContext()
  const styles = getStyles(theme)
  const priceValue = typeof price === 'number' ? `$${price.toLocaleString()}` : price

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.symbolSection}>
          <Text style={styles.symbol}>{symbol}</Text>
          {name && <Text style={styles.name}>{name}</Text>}
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

      <Text style={styles.price}>{priceValue}</Text>

      {chartData && chartData.length > 0 && (
        <View style={styles.chartSection}>
          <LinearChart
            variant="small"
            data={chartData.map((value) => ({ value }))}
            showLegend={false}
          />
        </View>
      )}
    </View>
  )
}

function getStyles(theme: ResolvedThemeMode) {
  return StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: spacing[16],
    padding: spacing[24],
    backgroundColor: colors.bg[theme].default,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border[theme].default,
    width: 593,
    minHeight: 375,
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
    color: colors.text[theme].primary,
  },
  name: {
    ...typographyVariants.captionRegular,
    color: colors.text[theme].tertiary,
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
  price: {
    ...typographyVariants.h4SemiBold,
    color: colors.text[theme].primary,
  },
  chartSection: {
    width: '100%',
  },
})
}
