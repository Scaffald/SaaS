/**
 * Crypto Wallet Main Story
 * Overview/index story for the crypto wallet examples
 */

import type { Meta, StoryObj } from '@storybook/react'
import { View, StyleSheet, Text, ScrollView, } from 'react-native'
import { spacing } from '../../../tokens/spacing'
import { colors } from '../../../tokens/colors'
import { typographyVariants } from '../../../tokens/typography'
import { useThemeContext } from '../../../theme'
import { Wallet, TrendingUp, UserPlus, } from 'lucide-react-native'

const meta: Meta = {
  title: 'Examples/CryptoWallet',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Complete crypto wallet application examples including registration flow, dashboard, and trading interface.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

function CryptoWalletOverview() {
  const { theme } = useThemeContext()
  const isLight = theme === 'light'

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isLight ? colors.bg.light.default : colors.bg.dark.default },
      ]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Wallet size={48} color={colors.primary[500]} />
        </View>
        <Text
          style={[
            typographyVariants.h3SemiBold,
            styles.title,
            { color: isLight ? colors.text.light.primary : colors.text.dark.primary },
          ]}
        >
          Crypto Wallet Examples
        </Text>
        <Text
          style={[
            typographyVariants.paragraphLRegular,
            styles.subtitle,
            { color: isLight ? colors.text.light.secondary : colors.text.dark.secondary },
          ]}
        >
          Static Storybook examples showcasing a complete crypto wallet application flow
        </Text>
      </View>

      <View style={styles.sections}>
        {/* Registration Flow */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: isLight ? colors.bg.light[100] : colors.bg.dark[100],
              borderColor: isLight ? colors.border.light.default : colors.border.dark.default,
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <UserPlus size={24} color={colors.primary[500]} />
            </View>
            <View style={styles.sectionInfo}>
              <Text
                style={[
                  typographyVariants.h5SemiBold,
                  { color: isLight ? colors.text.light.primary : colors.text.dark.primary },
                ]}
              >
                Registration Flow
              </Text>
              <Text
                style={[
                  typographyVariants.paragraphSRegular,
                  {
                    color: isLight ? colors.text.light.secondary : colors.text.dark.secondary,
                  },
                ]}
              >
                4-step registration process with email verification, location selection, and initial
                deposit
              </Text>
            </View>
          </View>
          <View style={styles.sectionContent}>
            <Text
              style={[
                typographyVariants.paragraphSRegular,
                styles.featureList,
                { color: isLight ? colors.text.light.secondary : colors.text.dark.secondary },
              ]}
            >
              • Email/Password Registration{'\n'}• Email Confirmation{'\n'}• Location Selection{'\n'}•
              Buy Crypto Deposit
            </Text>
          </View>
          <View style={styles.sectionFooter}>
            <Text
              style={[
                typographyVariants.paragraphSMedium,
                { color: colors.primary[500] },
              ]}
            >
              View in Storybook →
            </Text>
          </View>
        </View>

        {/* Dashboard */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: isLight ? colors.bg.light[100] : colors.bg.dark[100],
              borderColor: isLight ? colors.border.light.default : colors.border.dark.default,
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Wallet size={24} color={colors.primary[500]} />
            </View>
            <View style={styles.sectionInfo}>
              <Text
                style={[
                  typographyVariants.h5SemiBold,
                  { color: isLight ? colors.text.light.primary : colors.text.dark.primary },
                ]}
              >
                Dashboard
              </Text>
              <Text
                style={[
                  typographyVariants.paragraphSRegular,
                  {
                    color: isLight ? colors.text.light.secondary : colors.text.dark.secondary,
                  },
                ]}
              >
                Portfolio overview with balance widgets, market data, and asset list
              </Text>
            </View>
          </View>
          <View style={styles.sectionContent}>
            <Text
              style={[
                typographyVariants.paragraphSRegular,
                styles.featureList,
                { color: isLight ? colors.text.light.secondary : colors.text.dark.secondary },
              ]}
            >
              • Portfolio Summary{'\n'}• Balance Widgets{'\n'}• Market Overview{'\n'}• Asset List
            </Text>
          </View>
          <View style={styles.sectionFooter}>
            <Text
              style={[
                typographyVariants.paragraphSMedium,
                { color: colors.primary[500] },
              ]}
            >
              View in Storybook →
            </Text>
          </View>
        </View>

        {/* Trade View */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: isLight ? colors.bg.light[100] : colors.bg.dark[100],
              borderColor: isLight ? colors.border.light.default : colors.border.dark.default,
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <TrendingUp size={24} color={colors.primary[500]} />
            </View>
            <View style={styles.sectionInfo}>
              <Text
                style={[
                  typographyVariants.h5SemiBold,
                  { color: isLight ? colors.text.light.primary : colors.text.dark.primary },
                ]}
              >
                Trade View
              </Text>
              <Text
                style={[
                  typographyVariants.paragraphSRegular,
                  {
                    color: isLight ? colors.text.light.secondary : colors.text.dark.secondary,
                  },
                ]}
              >
                Single asset trading interface with price charts and buy/sell controls
              </Text>
            </View>
          </View>
          <View style={styles.sectionContent}>
            <Text
              style={[
                typographyVariants.paragraphSRegular,
                styles.featureList,
                { color: isLight ? colors.text.light.secondary : colors.text.dark.secondary },
              ]}
            >
              • Price Charts{'\n'}• Market Statistics{'\n'}• Buy/Sell Controls{'\n'}• Trade Tabs
            </Text>
          </View>
          <View style={styles.sectionFooter}>
            <Text
              style={[
                typographyVariants.paragraphSMedium,
                { color: colors.primary[500] },
              ]}
            >
              View in Storybook →
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text
          style={[
            typographyVariants.paragraphSRegular,
            { color: isLight ? colors.text.light.tertiary : colors.text.dark.tertiary },
          ]}
        >
          All examples are static and use mock data for demonstration purposes.
        </Text>
      </View>
    </ScrollView>
  )
}

export const Overview: Story = {
  render: () => <CryptoWalletOverview />,
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  contentContainer: {
    padding: spacing[32],
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing[48],
    gap: spacing[16],
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[8],
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 600,
  },
  sections: {
    flexDirection: 'column',
    gap: spacing[24],
  },
  section: {
    padding: spacing[24],
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'column',
    gap: spacing[16],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[16],
  },
  sectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionInfo: {
    flex: 1,
    flexDirection: 'column',
    gap: spacing[4],
  },
  sectionContent: {
    marginLeft: spacing[64],
  },
  featureList: {
    lineHeight: 24,
  },
  sectionFooter: {
    marginLeft: spacing[64],
    marginTop: spacing[8],
  },
  footer: {
    marginTop: spacing[48],
    alignItems: 'center',
  },
})
