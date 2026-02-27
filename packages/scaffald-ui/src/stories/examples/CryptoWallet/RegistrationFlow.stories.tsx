/**
 * Crypto Wallet Registration Flow Stories
 * Static examples of the registration flow screens
 */

import type { Meta, StoryObj } from '@storybook/react'
import { View, StyleSheet, Text, ScrollView } from 'react-native'
import { Input } from '../../../components/Input'
import { Button } from '../../../components/Button'
import { Checkbox } from '../../../components/Checkbox'
import { spacing } from '../../../tokens/spacing'
import { colors } from '../../../tokens/colors'
import { typographyVariants } from '../../../tokens/typography'
import { useThemeContext } from '../../../theme'

const meta: Meta = {
  title: 'Examples/CryptoWallet/RegistrationFlow',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Static examples of the crypto wallet registration flow screens.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

// Registration Step 1: Email/Password Form
function RegistrationStep1() {
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
      <View style={styles.formContainer}>
        <Text
          style={[
            typographyVariants.h4SemiBold,
            styles.title,
            { color: isLight ? colors.text.light.primary : colors.text.dark.primary },
          ]}
        >
          Create Account
        </Text>
        <Text
          style={[
            typographyVariants.paragraphMRegular,
            styles.subtitle,
            { color: isLight ? colors.text.light.secondary : colors.text.dark.secondary },
          ]}
        >
          Sign up to start trading cryptocurrencies
        </Text>

        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="Enter your email"
            value=""
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="Password"
            placeholder="Create a password"
            value=""
            secureTextEntry
          />
          <Input
            label="Confirm Password"
            placeholder="Confirm your password"
            value=""
            secureTextEntry
          />

          <Checkbox
            checked={false}
            label="I agree to the Terms of Service and Privacy Policy"
            onChange={() => {}}
          />

          <View style={styles.buttonContainer}>
            <Button color="primary" variant="filled" size="lg" fullWidth onPress={() => {}}>
              Create Account
            </Button>
          </View>

          <View style={styles.footer}>
            <Text
              style={[
                typographyVariants.paragraphSRegular,
                { color: isLight ? colors.text.light.secondary : colors.text.dark.secondary },
              ]}
            >
              Already have an account?{' '}
              <Text
                style={[
                  typographyVariants.paragraphSMedium,
                  { color: colors.primary[500] },
                ]}
              >
                Sign in
              </Text>
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

// Registration Step 2: Confirmation Screen
function RegistrationConfirmation() {
  const { theme } = useThemeContext()
  const isLight = theme === 'light'

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isLight ? colors.bg.light.default : colors.bg.dark.default },
      ]}
    >
      <View style={styles.confirmationContainer}>
        <View style={styles.iconContainer}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: colors.success[100] },
            ]}
          >
            <Text style={styles.checkmark}>✓</Text>
          </View>
        </View>
        <Text
          style={[
            typographyVariants.h4SemiBold,
            styles.title,
            { color: isLight ? colors.text.light.primary : colors.text.dark.primary },
          ]}
        >
          Check Your Email
        </Text>
        <Text
          style={[
            typographyVariants.paragraphMRegular,
            styles.subtitle,
            styles.confirmationText,
            { color: isLight ? colors.text.light.secondary : colors.text.dark.secondary },
          ]}
        >
          We've sent a confirmation link to your email address. Please check your inbox and click the
          link to verify your account.
        </Text>
        <View style={styles.buttonContainer}>
          <Button color="primary" variant="filled" size="lg" fullWidth onPress={() => {}}>
            Resend Email
          </Button>
        </View>
      </View>
    </View>
  )
}

// Registration Step 3: Location Selection
function LocationSelection() {
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
      <View style={styles.formContainer}>
        <Text
          style={[
            typographyVariants.h4SemiBold,
            styles.title,
            { color: isLight ? colors.text.light.primary : colors.text.dark.primary },
          ]}
        >
          Select Your Location
        </Text>
        <Text
          style={[
            typographyVariants.paragraphMRegular,
            styles.subtitle,
            { color: isLight ? colors.text.light.secondary : colors.text.dark.secondary },
          ]}
        >
          Choose your country to continue
        </Text>

        <View style={styles.form}>
          <Input
            label="Country"
            placeholder="Select your country"
            value=""
          />
          <Input
            label="State/Province"
            placeholder="Select your state or province"
            value=""
          />
          <Input
            label="City"
            placeholder="Enter your city"
            value=""
          />

          <View style={styles.buttonContainer}>
            <Button color="primary" variant="filled" size="lg" fullWidth onPress={() => {}}>
              Continue
            </Button>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

// Registration Step 4: Buy Crypto Deposit
function BuyCryptoDeposit() {
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
      <View style={styles.formContainer}>
        <Text
          style={[
            typographyVariants.h4SemiBold,
            styles.title,
            { color: isLight ? colors.text.light.primary : colors.text.dark.primary },
          ]}
        >
          Buy Crypto
        </Text>
        <Text
          style={[
            typographyVariants.paragraphMRegular,
            styles.subtitle,
            { color: isLight ? colors.text.light.secondary : colors.text.dark.secondary },
          ]}
        >
          Make your first deposit to start trading
        </Text>

        <View style={styles.form}>
          <Input
            label="Amount"
            placeholder="0.00"
            value=""
            keyboardType="numeric"
          />
          <Input
            label="Payment Method"
            placeholder="Select payment method"
            value=""
          />

          <View
            style={[
              styles.infoBox,
              {
                backgroundColor: isLight ? colors.bg.light[100] : colors.bg.dark[100],
                borderColor: isLight ? colors.border.light.default : colors.border.dark.default,
              },
            ]}
          >
            <Text
              style={[
                typographyVariants.paragraphSRegular,
                { color: isLight ? colors.text.light.secondary : colors.text.dark.secondary },
              ]}
            >
              Minimum deposit: $10.00
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <Button color="primary" variant="filled" size="lg" fullWidth onPress={() => {}}>
              Continue to Payment
            </Button>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

export const RegistrationStep1Story: Story = {
  render: () => <RegistrationStep1 />,
}

export const RegistrationConfirmationStory: Story = {
  render: () => <RegistrationConfirmation />,
}

export const LocationSelectionStory: Story = {
  render: () => <LocationSelection />,
}

export const BuyCryptoDepositStory: Story = {
  render: () => <BuyCryptoDeposit />,
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    minHeight: '100vh',
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[24],
  },
  formContainer: {
    width: '100%',
    maxWidth: 480,
    flexDirection: 'column',
    gap: spacing[24],
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  form: {
    flexDirection: 'column',
    gap: spacing[16],
  },
  buttonContainer: {
    marginTop: spacing[8],
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing[16],
  },
  confirmationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[24],
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  iconContainer: {
    marginBottom: spacing[24],
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 48,
    color: colors.success[600],
    fontWeight: '600',
  },
  confirmationText: {
    textAlign: 'center',
    marginTop: spacing[16],
    marginBottom: spacing[24],
  },
  infoBox: {
    padding: spacing[16],
    borderRadius: 8,
    borderWidth: 1,
  },
})
