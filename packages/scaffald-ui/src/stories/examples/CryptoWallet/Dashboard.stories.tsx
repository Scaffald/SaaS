/**
 * Crypto Wallet Dashboard Story
 * Static example of the crypto wallet dashboard
 */

import type { Meta, StoryObj } from '@storybook/react'
import { View, StyleSheet, Text, ScrollView } from 'react-native'
import { CryptoWalletLayout } from '../../../components/CryptoWalletLayout'
import { Sidebar, SidebarHeader, SidebarMenuItem, SidebarFooter } from '../../../components/Sidebar'
import { SaaSNavigation } from '../../../components/SaaSNavigation'
import { CryptoBalanceWidget, CryptoStockWidget } from '../../../components/Widgets/Crypto'
import { CryptoAssetCard } from '../../../components/CryptoAssetCard'
import { Avatar } from '../../../components/Avatar'
import { spacing } from '../../../tokens/spacing'
import { colors } from '../../../tokens/colors'
import { typographyVariants } from '../../../tokens/typography'
import { useThemeContext } from '../../../theme'
import { portfolio, cryptoAssets } from './mockData'
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  Settings,
  Bell,
  MessageCircle,
  ArrowUpRight,
} from 'lucide-react-native'

const meta: Meta = {
  title: 'Examples/CryptoWallet/Dashboard',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Static example of the crypto wallet dashboard with portfolio overview, widgets, and navigation.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

function DashboardView() {
  const { theme } = useThemeContext()
  const isLight = theme === 'light'

  const sidebarContent = (
    <Sidebar
      variant="crypto"
      collapsed={false}
      header={<SidebarHeader title="CryptoWallet" collapsed={false} onCollapse={() => {}} />}
      footer={
        <SidebarFooter
          user={{
            name: 'John Doe',
            email: 'john@example.com',
            avatar: <Avatar initials="JD" size={32} />,
          }}
          actions={[
            { icon: MessageCircle, onPress: () => {}, label: 'Messages' },
            { icon: Bell, onPress: () => {}, badge: 3 },
            { icon: Settings, onPress: () => {} },
          ]}
        />
      }
    >
      <SidebarMenuItem
        icon={LayoutDashboard}
        label="Dashboard"
        state="active"
        onPress={() => {}}
      />
      <SidebarMenuItem icon={Wallet} label="Wallet" state="default" onPress={() => {}} />
      <SidebarMenuItem icon={TrendingUp} label="Trading" state="default" onPress={() => {}} />
      <SidebarMenuItem icon={Settings} label="Settings" state="default" onPress={() => {}} />
    </Sidebar>
  )

  return (
    <CryptoWalletLayout sidebarContent={sidebarContent} variant="dashboard">
      <View
        style={[
          styles.container,
          { backgroundColor: isLight ? colors.bg.light.default : colors.bg.dark.default },
        ]}
      >
        <SaaSNavigation
          variant="main"
          pageTitle="Dashboard"
          description="Portfolio overview"
          featuredIcon={LayoutDashboard}
          showNotifications
          notificationBadge={3}
          avatarSrc="https://i.pravatar.cc/150?img=1"
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Portfolio Summary */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  typographyVariants.h5SemiBold,
                  { color: isLight ? colors.text.light.primary : colors.text.dark.primary },
                ]}
              >
                Portfolio
              </Text>
              <View style={styles.changeIndicator}>
                <ArrowUpRight size={16} color={colors.success[500]} />
                <Text
                  style={[
                    typographyVariants.paragraphSMedium,
                    { color: colors.success[500] },
                  ]}
                >
                  {portfolio.totalChange}
                </Text>
              </View>
            </View>
            <Text
              style={[
                typographyVariants.h3SemiBold,
                styles.totalBalance,
                { color: isLight ? colors.text.light.primary : colors.text.dark.primary },
              ]}
            >
              ${portfolio.totalBalanceUSD.toLocaleString()}
            </Text>
          </View>

          {/* Balance Widgets */}
          <View style={styles.widgetsGrid}>
            {portfolio.balances.slice(0, 4).map((balance) => {
              const _asset = cryptoAssets.find((a) => a.symbol === balance.symbol)
              return (
                <CryptoBalanceWidget
                  key={balance.symbol}
                  symbol={balance.symbol}
                  balance={balance.balance}
                  balanceUSD={balance.balanceUSD}
                />
              )
            })}
          </View>

          {/* Market Overview */}
          <View style={styles.section}>
            <Text
              style={[
                typographyVariants.h5SemiBold,
                styles.sectionTitle,
                { color: isLight ? colors.text.light.primary : colors.text.dark.primary },
              ]}
            >
              Market Overview
            </Text>
            <View style={styles.stockWidgetsGrid}>
              {cryptoAssets.slice(0, 4).map((asset) => (
                <CryptoStockWidget
                  key={asset.symbol}
                  variant="Crypto Stock 01"
                  symbol={asset.symbol}
                  name={asset.name}
                  price={asset.price}
                  change={asset.change}
                  changeType={asset.changeType}
                  chartData={[asset.price * 0.9, asset.price * 0.95, asset.price]}
                />
              ))}
            </View>
          </View>

          {/* Asset List */}
          <View style={styles.section}>
            <Text
              style={[
                typographyVariants.h5SemiBold,
                styles.sectionTitle,
                { color: isLight ? colors.text.light.primary : colors.text.dark.primary },
              ]}
            >
              Your Assets
            </Text>
            <View style={styles.assetList}>
              {portfolio.balances.map((balance) => {
                const asset = cryptoAssets.find((a) => a.symbol === balance.symbol)
                if (!asset) return null
                return (
                  <CryptoAssetCard
                    key={balance.symbol}
                    symbol={asset.symbol}
                    name={asset.name}
                    price={asset.price}
                    change={asset.change}
                    changeType={asset.changeType}
                    balance={balance.balance}
                    balanceUSD={balance.balanceUSD}
                  />
                )
              })}
            </View>
          </View>
        </ScrollView>
      </View>
    </CryptoWalletLayout>
  )
}

export const Dashboard: Story = {
  render: () => <DashboardView />,
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
    gap: spacing[32],
  },
  section: {
    flexDirection: 'column',
    gap: spacing[16],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    marginBottom: spacing[8],
  },
  totalBalance: {
    marginTop: spacing[8],
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  widgetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[16],
  },
  stockWidgetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[16],
  },
  assetList: {
    flexDirection: 'column',
    gap: spacing[12],
  },
})
