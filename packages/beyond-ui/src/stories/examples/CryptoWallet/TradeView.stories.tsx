/**
 * Crypto Wallet Trade View Story
 * Static example of the crypto trading interface
 */

import type { Meta, StoryObj } from '@storybook/react'
import { View, StyleSheet, Text, ScrollView } from 'react-native'
import { SaaSNavigation } from '../../../components/SaaSNavigation'
import { Tabs } from '../../../components/Tabs'
import { TradeControls } from '../../../components/TradeControls'
import { Chart, LinearChart } from '../../../components/Chart'
import { spacing } from '../../../tokens/spacing'
import { colors } from '../../../tokens/colors'
import { typographyVariants } from '../../../tokens/typography'
import { useThemeContext } from '../../../theme'
import { getMarketData, getChartData } from './mockData'
import { cryptoAssets } from './mockData'
import { TrendingUp, } from 'lucide-react-native'

const meta: Meta = {
  title: 'Examples/CryptoWallet/TradeView',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Static example of the crypto trading interface with buy/sell controls and price charts.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

function TradeSingleView() {
  const { theme } = useThemeContext()
  const isLight = theme === 'light'

  // Get BTC data for trading
  const asset = cryptoAssets.find((a) => a.symbol === 'BTC')
  const marketData = getMarketData('BTC')
  const chartData = getChartData('BTC', 30)

  if (!asset || !marketData) {
    return null
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isLight ? colors.bg.light.default : colors.bg.dark.default },
      ]}
    >
      <SaaSNavigation
        variant="main"
        pageTitle="Trade"
        description={`${asset.name} (${asset.symbol})`}
        featuredIcon={TrendingUp}
        showNotifications
        avatarSrc="https://i.pravatar.cc/150?img=1"
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Asset Header */}
        <View style={styles.assetHeader}>
          <View style={styles.assetInfo}>
            <Text
              style={[
                typographyVariants.h4SemiBold,
                { color: isLight ? colors.text.light.primary : colors.text.dark.primary },
              ]}
            >
              {asset.symbol}
            </Text>
            <Text
              style={[
                typographyVariants.paragraphMRegular,
                { color: isLight ? colors.text.light.secondary : colors.text.dark.secondary },
              ]}
            >
              {asset.name}
            </Text>
          </View>
          <View style={styles.priceInfo}>
            <Text
              style={[
                typographyVariants.h5SemiBold,
                { color: isLight ? colors.text.light.primary : colors.text.dark.primary },
              ]}
            >
              ${asset.price.toLocaleString()}
            </Text>
            <Text
              style={[
                typographyVariants.paragraphSMedium,
                {
                  color:
                    asset.changeType === 'positive'
                      ? colors.success[500]
                      : colors.error[500],
                },
              ]}
            >
              {asset.change}
            </Text>
          </View>
        </View>

        {/* Chart */}
        <View style={styles.chartSection}>
          <Chart
            xAxisLabels={['1W', '1M', '3M', '6M', '1Y', 'All']}
            yAxisLabels={[40000, 42000, 44000, 46000, 48000]}
            period="month"
            showGrid
            height={300}
            width="100%"
          >
            <LinearChart
              data={chartData}
              color={asset.changeType === 'positive' ? colors.success[500] : colors.error[500]}
            />
          </Chart>
        </View>

        {/* Market Stats */}
        <View style={styles.statsGrid}>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: isLight ? colors.bg.light[100] : colors.bg.dark[100],
                borderColor: isLight ? colors.border.light.default : colors.border.dark.default,
              },
            ]}
          >
            <Text
              style={[
                typographyVariants.paragraphSRegular,
                {
                  color: isLight ? colors.text.light.secondary : colors.text.dark.secondary,
                },
              ]}
            >
              24h High
            </Text>
            <Text
              style={[
                typographyVariants.paragraphMMedium,
                { color: isLight ? colors.text.light.primary : colors.text.dark.primary },
              ]}
            >
              ${marketData.high24h.toLocaleString()}
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: isLight ? colors.bg.light[100] : colors.bg.dark[100],
                borderColor: isLight ? colors.border.light.default : colors.border.dark.default,
              },
            ]}
          >
            <Text
              style={[
                typographyVariants.paragraphSRegular,
                {
                  color: isLight ? colors.text.light.secondary : colors.text.dark.secondary,
                },
              ]}
            >
              24h Low
            </Text>
            <Text
              style={[
                typographyVariants.paragraphMMedium,
                { color: isLight ? colors.text.light.primary : colors.text.dark.primary },
              ]}
            >
              ${marketData.low24h.toLocaleString()}
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: isLight ? colors.bg.light[100] : colors.bg.dark[100],
                borderColor: isLight ? colors.border.light.default : colors.border.dark.default,
              },
            ]}
          >
            <Text
              style={[
                typographyVariants.paragraphSRegular,
                {
                  color: isLight ? colors.text.light.secondary : colors.text.dark.secondary,
                },
              ]}
            >
              24h Change
            </Text>
            <Text
              style={[
                typographyVariants.paragraphMMedium,
                {
                  color:
                    marketData.priceChangePercent24h >= 0
                      ? colors.success[500]
                      : colors.error[500],
                },
              ]}
            >
              {marketData.priceChangePercent24h >= 0 ? '+' : ''}
              {marketData.priceChangePercent24h.toFixed(2)}%
            </Text>
          </View>
        </View>

        {/* Trade Controls with Tabs */}
        <View style={styles.tradeSection}>
          <Tabs defaultValue="buy" type="default" color="gray" size="md">
            <Tabs.Item value="buy">
              <Tabs.Trigger>Buy</Tabs.Trigger>
            </Tabs.Item>
            <Tabs.Item value="sell">
              <Tabs.Trigger>Sell</Tabs.Trigger>
            </Tabs.Item>
          </Tabs>

          <View style={styles.tradeControlsContainer}>
            <TradeControls
              mode="buy"
              asset={{ symbol: asset.symbol, name: asset.name, price: asset.price }}
              amount="0.5"
              price={asset.price.toString()}
              availableBalance={1.25}
              availableBalanceUSD={56543.13}
              onSubmit={() => {}}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export const TradeSingle: Story = {
  render: () => <TradeSingleView />,
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    height: '100vh',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[24],
    gap: spacing[24],
  },
  assetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[8],
  },
  assetInfo: {
    flexDirection: 'column',
    gap: spacing[4],
  },
  priceInfo: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: spacing[4],
  },
  chartSection: {
    marginVertical: spacing[16],
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing[12],
    flexWrap: 'wrap',
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    padding: spacing[16],
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'column',
    gap: spacing[4],
  },
  tradeSection: {
    flexDirection: 'column',
    gap: spacing[16],
    marginTop: spacing[8],
  },
  tradeControlsContainer: {
    marginTop: spacing[8],
  },
})
