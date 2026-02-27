/**
 * CryptoAssetCard component
 * Reusable card for displaying crypto assets with icon, name, price, and change
 *
 * @example
 * ```tsx
 * import { CryptoAssetCard } from '@scaffald/ui'
 *
 * <CryptoAssetCard
 *   symbol="BTC"
 *   name="Bitcoin"
 *   price={45234.50}
 *   change="+5.2%"
 *   changeType="positive"
 * />
 * ```
 */

import { View, Text, StyleSheet } from 'react-native'
import type { CryptoAssetCardProps } from './CryptoAssetCard.types'
import {
  getContainerStyles,
  getSymbolStyles,
  getNameStyles,
  getPriceStyles,
  getChangeStyles,
} from './CryptoAssetCard.styles'
import { useThemeContext } from '../../theme'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { typographyVariants } from '../../tokens/typography'

export function CryptoAssetCard({
  symbol,
  name,
  price,
  change,
  changeType = 'positive',
  icon: Icon,
  balance,
  balanceUSD,
  style,
  textStyle,
}: CryptoAssetCardProps) {
  const { theme } = useThemeContext()
  const containerStyles = getContainerStyles(theme)
  const symbolStyles = getSymbolStyles(theme)
  const nameStyles = getNameStyles(theme)
  const priceStyles = getPriceStyles(theme)
  const changeStyles = getChangeStyles(changeType, theme)

  const priceValue = typeof price === 'number' ? `$${price.toLocaleString()}` : price
  const balanceValue = balance !== undefined ? balance.toFixed(8) : undefined
  const balanceUSDValue =
    balanceUSD !== undefined
      ? typeof balanceUSD === 'number'
        ? `$${balanceUSD.toLocaleString()}`
        : balanceUSD
      : undefined

  return (
    <View style={[containerStyles, styles.container, style]}>
      <View style={styles.leftSection}>
        {Icon && (
          <View style={styles.iconContainer}>
            <Icon size={24} color={colors.primary[500]} />
          </View>
        )}
        <View style={styles.infoSection}>
          <Text style={[symbolStyles, textStyle]}>{symbol}</Text>
          <Text style={[nameStyles, textStyle]}>{name}</Text>
          {balance !== undefined && (
            <View style={styles.balanceSection}>
              <Text style={[nameStyles, textStyle]}>{balanceValue}</Text>
              {balanceUSDValue && (
                <Text
                  style={[
                    {
                      ...typographyVariants.paragraphSRegular,
                      color: theme === 'light' ? colors.text.light.tertiary : colors.text.dark.tertiary,
                    },
                    textStyle,
                  ]}
                >
                  {balanceUSDValue}
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
      <View style={styles.rightSection}>
        <Text style={[priceStyles, textStyle]}>{priceValue}</Text>
        {change && <Text style={[changeStyles, textStyle]}>{change}</Text>}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[16],
    borderRadius: 12,
    borderWidth: 1,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSection: {
    flexDirection: 'column',
    gap: spacing[4],
    flex: 1,
  },
  rightSection: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: spacing[4],
  },
  balanceSection: {
    flexDirection: 'column',
    gap: spacing[2],
    marginTop: spacing[4],
  },
})
