/**
 * Inputs Playground Story
 * Interactive playground matching Figma design with all input examples
 */

import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { View, StyleSheet, Text, Pressable } from 'react-native'
import { Playground } from '../../playground/Playground'
import { PlaygroundSection } from '../../playground/PlaygroundSection'
import { ThemeComparison } from '../../playground/ThemeComparison'
import { Input } from '../../components/Input'
import { InputLabel } from '../../components/Input/InputLabel'
import { PasswordStrengthIndicator } from '../../playground/PasswordStrengthIndicator'
import {
  MailIcon,
  EyeIcon,
  InfoIcon,
  CreditCardIcon,
  CloseIcon,
  ArrowDownIcon,
} from '../../playground/icons'
import { spacing } from '../../tokens/spacing'
import { colors } from '../../tokens/colors'
import { borderRadius } from '../../tokens/borders'
import { typography } from '../../tokens/typography'
import { useThemeContext } from '../../theme'

const meta: Meta = {
  title: 'Playground/Inputs',
  component: Playground,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Interactive input playground showcasing various input field patterns from the Figma design system.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof meta>

// User chip component for "Add Users" input
function UserChip({ name, onRemove }: { name: string; onRemove: () => void }) {
  const { theme } = useThemeContext()
  const borderColor = theme === 'light' ? colors.border.light.default : colors.border.dark.default
  const bgColor = theme === 'light' ? colors.bg.light[100] : colors.bg.dark[100]
  const textColor = theme === 'light' ? colors.text.light.primary : colors.text.dark.primary
  const closeBgColor = theme === 'light' ? colors.bg.light[100] : colors.bg.dark[100]

  return (
    <View
      style={[
        styles.chip,
        {
          borderColor,
          backgroundColor: bgColor,
        },
      ]}
    >
      <View style={styles.chipAvatar} />
      <Text style={[styles.chipText, { color: textColor }]}>{name}</Text>
      <Pressable onPress={onRemove} style={[styles.chipClose, { backgroundColor: closeBgColor }]}>
        <CloseIcon size={10} color={colors.text.light.secondary} />
      </Pressable>
    </View>
  )
}

// Custom "Add Users" input component
function AddUsersInput() {
  const { theme } = useThemeContext()
  const [users, setUsers] = useState(['Anna', 'Mike'])
  const [_value, _setValue] = useState('')

  const removeUser = (name: string) => {
    setUsers(users.filter((u) => u !== name))
  }

  const borderColor = theme === 'light' ? colors.border.light.default : colors.border.dark.default
  const bgColor = theme === 'light' ? colors.bg.light.default : colors.bg.dark.default
  const textColor = theme === 'light' ? colors.text.light.tertiary : colors.text.dark.tertiary

  return (
    <View style={styles.inputContainer}>
      <Text
        style={[
          styles.label,
          { color: theme === 'light' ? colors.text.light.primary : colors.text.dark.primary },
        ]}
      >
        Add Users
        <Text
          style={[
            styles.optionalText,
            { color: theme === 'light' ? colors.text.light.tertiary : colors.text.dark.tertiary },
          ]}
        >
          {' '}
          (optional)
        </Text>
      </Text>
      <View
        style={[
          styles.addUsersInput,
          {
            borderColor,
            backgroundColor: bgColor,
          },
        ]}
      >
        <View style={styles.addUsersContent}>
          {users.map((user) => (
            <UserChip key={user} name={user} onRemove={() => removeUser(user)} />
          ))}
          <Text style={[styles.placeholder, { color: textColor }]}>User...</Text>
        </View>
      </View>
    </View>
  )
}

// Custom "Amount" input with line type
function AmountInput() {
  const [value, setValue] = useState('')

  return (
    <View style={styles.inputContainer}>
      <Input
        label="Amount"
        placeholder="Placeholder"
        type="line"
        value={value}
        onChangeText={setValue}
        iconEnd={ArrowDownIcon}
      />
    </View>
  )
}

const InputExamples = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [link, setLink] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')

  return (
    <View style={styles.container}>
      <PlaygroundSection title="Email Input">
        <Input
          label="Email"
          required
          placeholder="Placeholder"
          value={email}
          onChangeText={setEmail}
          iconStart={MailIcon}
        />
      </PlaygroundSection>

      <PlaygroundSection title="Password Input">
        <View style={styles.passwordContainer}>
          <Input
            label="Password"
            placeholder="Placeholder"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            iconEnd={EyeIcon}
          />
          <View style={styles.passwordStrength}>
            <PasswordStrengthIndicator strength="good" />
          </View>
        </View>
      </PlaygroundSection>

      <PlaygroundSection title="Add Users Input">
        <AddUsersInput />
      </PlaygroundSection>

      <PlaygroundSection title="Link Input">
        <View style={styles.inputContainer}>
          <View style={styles.labelContainer}>
            <InputLabel showInfo infoIcon={InfoIcon}>
              Insert a link
            </InputLabel>
          </View>
          <Input
            placeholder="Placeholder"
            externalAddon="https://"
            value={link}
            onChangeText={setLink}
          />
        </View>
      </PlaygroundSection>

      <PlaygroundSection title="Payment Method Input">
        <Input
          label="Label"
          placeholder="Placeholder"
          iconStart={CreditCardIcon}
          value={paymentMethod}
          onChangeText={setPaymentMethod}
        />
      </PlaygroundSection>

      <PlaygroundSection title="Amount Input">
        <AmountInput />
      </PlaygroundSection>
    </View>
  )
}

export const Default: Story = {
  render: () => (
    <Playground>
      <ThemeComparison>
        <InputExamples />
      </ThemeComparison>
    </Playground>
  ),
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing[40],
    width: '100%',
  },
  inputContainer: {
    width: 400,
    gap: spacing[8],
  },
  labelContainer: {
    marginBottom: spacing[8],
  },
  label: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.small.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    lineHeight: 20,
  },
  optionalText: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.small.fontSize,
    fontWeight: typography.body.fontWeight,
  },
  passwordContainer: {
    width: 400,
    gap: spacing[8],
  },
  passwordStrength: {
    marginTop: spacing[6],
  },
  addUsersInput: {
    width: 400,
    minHeight: 40,
    borderWidth: 1,
    borderRadius: borderRadius.m,
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  addUsersContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[8],
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  chipAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.gray[300],
  },
  chipText: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    lineHeight: 16,
  },
  chipClose: {
    width: 10,
    height: 10,
    borderRadius: 5,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    lineHeight: 24,
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[8],
    borderBottomWidth: 1,
  },
  amountPlaceholder: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    lineHeight: 24,
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  currencyText: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.small.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    lineHeight: 20,
  },
})
