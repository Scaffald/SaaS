/**
 * Market Trending Widget component
 * Displays trending cryptocurrencies
 *
 * @example
 * ```tsx
 * <MarketTrendingWidget
 *   cryptocurrencies={[
 *     { symbol: 'BTC', price: 45000, change: '+5.2%', changeType: 'positive' },
 *   ]}
 * />
 * ```
 */

import { View, Text, StyleSheet, ScrollView } from 'react-native'
import type { MarketTrendingWidgetProps } from './CryptoWidget.types'
import { CryptoStockWidget } from './CryptoStockWidget'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'
import { typographyVariants } from '../../../tokens/typography'
import { useThemeContext } from '../../../theme'
import type { ResolvedThemeMode } from '../../../tokens/colors'

export function MarketTrendingWidget({ cryptocurrencies = [], style }: MarketTrendingWidgetProps) {
  const { theme } = useThemeContext()
  const styles = getStyles(theme)
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>Trending</Text>

      <ScrollView style={styles.scrollView}>
        {cryptocurrencies.length === 0 ? (
          <Text style={styles.emptyText}>No trending cryptocurrencies</Text>
        ) : (
          cryptocurrencies.map((crypto, index) => (
            <CryptoStockWidget
              key={index}
              variant="Crypto Stock 02"
              symbol={crypto.symbol}
              name={crypto.name}
              price={crypto.price}
              change={crypto.change}
              changeType={crypto.changeType}
              chartData={crypto.chartData}
            />
          ))
        )}
      </ScrollView>
    </View>
  )
}

function getStyles(theme: ResolvedThemeMode) {
  return StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: spacing[12],
    width: 367,
    height: 236,
    padding: spacing[16],
    backgroundColor: colors.bg[theme].default,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border[theme].default,
  },
  title: {
    ...typographyVariants.paragraphMMedium,
    color: colors.text[theme].primary,
  },
  scrollView: {
    flex: 1,
  },
  emptyText: {
    ...typographyVariants.paragraphSRegular,
    color: colors.text[theme].tertiary,
    textAlign: 'center',
    paddingVertical: spacing[24],
  },
})
}
