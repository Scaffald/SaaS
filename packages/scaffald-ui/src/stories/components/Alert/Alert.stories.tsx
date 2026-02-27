/**
 * Alert component stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Alert } from '../../../components/Alert'
import { ThemeComparison } from '../../../playground'
import { spacing } from '../../../tokens/spacing'

const meta = {
  title: 'Components/Alert',
  component: Alert,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

// Basic alert
export const Default: Story = {
  args: {
    title: 'Information',
    description: 'This is an informational message to keep you informed',
  },
}

// All alert types - Linear variant
export const AllTypes: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>All Alert Types (Linear Variant)</Text>
      <Alert
        type="info"
        title="Information"
        description="This is an informational message to keep you informed"
      />
      <Alert
        type="success"
        title="Success"
        description="Your changes have been saved successfully"
      />
      <Alert
        type="warning"
        title="Warning"
        description="Please review this important warning message"
      />
      <Alert
        type="error"
        title="Error"
        description="An error occurred while processing your request"
      />
      <Alert type="ai" title="AI Insight" description="AI has generated recommendations for you" />
    </View>
  ),
}

// All style variants
export const AllVariants: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Info Alert - All Variants</Text>
      <Alert
        type="info"
        variant="linear"
        title="Linear Variant"
        description="White background with colored left border"
      />
      <Alert
        type="info"
        variant="light"
        title="Light Variant"
        description="Tinted background matching alert type"
      />
      <Alert
        type="info"
        variant="filled"
        title="Filled Variant"
        description="Solid colored background with white text"
      />
    </View>
  ),
}

// Success alerts - all variants
export const SuccessVariants: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Success Alert - All Variants</Text>
      <Alert
        type="success"
        variant="linear"
        title="Linear Success"
        description="Your changes have been saved"
      />
      <Alert
        type="success"
        variant="light"
        title="Light Success"
        description="Your changes have been saved"
      />
      <Alert
        type="success"
        variant="filled"
        title="Filled Success"
        description="Your changes have been saved"
      />
    </View>
  ),
}

// Warning alerts - all variants
export const WarningVariants: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Warning Alert - All Variants</Text>
      <Alert
        type="warning"
        variant="linear"
        title="Linear Warning"
        description="Please review this warning"
      />
      <Alert
        type="warning"
        variant="light"
        title="Light Warning"
        description="Please review this warning"
      />
      <Alert
        type="warning"
        variant="filled"
        title="Filled Warning"
        description="Please review this warning"
      />
    </View>
  ),
}

// Error alerts - all variants
export const ErrorVariants: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Error Alert - All Variants</Text>
      <Alert
        type="error"
        variant="linear"
        title="Linear Error"
        description="An error occurred while processing"
      />
      <Alert
        type="error"
        variant="light"
        title="Light Error"
        description="An error occurred while processing"
      />
      <Alert
        type="error"
        variant="filled"
        title="Filled Error"
        description="An error occurred while processing"
      />
    </View>
  ),
}

// With actions - bottom position
export const WithActionsBottom: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Alerts with Actions (Bottom Position)</Text>
      <Alert
        type="info"
        variant="linear"
        title="Update Available"
        description="A new version is available. Update now to get the latest features."
        actions={[
          { label: 'Update now', onPress: () => console.log('Update') },
          { label: 'Learn more', onPress: () => console.log('Learn more') },
        ]}
      />
      <Alert
        type="success"
        variant="light"
        title="Success"
        description="Your file has been uploaded successfully"
        actions={[{ label: 'View file', onPress: () => console.log('View') }]}
      />
      <Alert
        type="warning"
        variant="filled"
        title="Storage Almost Full"
        description="You're running out of storage space"
        actions={[
          { label: 'Upgrade', onPress: () => console.log('Upgrade') },
          { label: 'Manage', onPress: () => console.log('Manage') },
        ]}
      />
    </View>
  ),
}

// With actions - right position
export const WithActionsRight: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Alerts with Actions (Right Position)</Text>
      <Alert
        type="info"
        variant="linear"
        title="Update Available"
        description="A new version is available"
        actionsPosition="right"
        actions={[{ label: 'Update now', onPress: () => console.log('Update') }]}
      />
      <Alert
        type="success"
        variant="light"
        title="Success"
        description="File uploaded"
        actionsPosition="right"
        actions={[{ label: 'View file', onPress: () => console.log('View') }]}
      />
      <Alert
        type="warning"
        variant="filled"
        title="Storage Almost Full"
        actionsPosition="right"
        actions={[{ label: 'Upgrade', onPress: () => console.log('Upgrade') }]}
      />
    </View>
  ),
}

// Without description
export const WithoutDescription: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Alerts Without Description</Text>
      <Alert type="info" variant="linear" title="Information" />
      <Alert type="success" variant="light" title="Success" />
      <Alert type="error" variant="filled" title="Error" />
    </View>
  ),
}

// Controlled dismissible
export const ControlledDismissible: Story = {
  render: () => {
    const [visible, setVisible] = useState(true)

    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Controlled Dismissible Alert</Text>
        {!visible && (
          <Text style={styles.status}>
            Alert dismissed. Refresh to see it again or click button below.
          </Text>
        )}
        <Alert
          type="success"
          title="Success!"
          description="This is a controlled alert. Click the X to dismiss."
          visible={visible}
          onClose={() => setVisible(false)}
        />
        <View style={styles.buttonRow}>
          <Text style={styles.button} onPress={() => setVisible(!visible)}>
            {visible ? 'Hide Alert' : 'Show Alert'}
          </Text>
        </View>
      </View>
    )
  },
}

// Non-dismissible
export const NonDismissible: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Non-Dismissible Alerts</Text>
      <Alert
        type="info"
        title="Information"
        description="This alert cannot be dismissed"
        dismissible={false}
      />
      <Alert
        type="warning"
        variant="filled"
        title="Important Warning"
        description="This alert requires action"
        dismissible={false}
        actions={[{ label: 'Take action', onPress: () => console.log('Action') }]}
      />
    </View>
  ),
}

// Long content
export const LongContent: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Alerts with Long Content</Text>
      <Alert
        type="info"
        title="Very Long Title That Might Wrap to Multiple Lines in Narrow Containers"
        description="This is a very long description that demonstrates how the alert handles longer text content. It should wrap nicely and maintain proper spacing and alignment throughout. The alert component is designed to be flexible and accommodate various content lengths while maintaining readability and visual hierarchy."
      />
      <Alert
        type="warning"
        variant="filled"
        title="Long Title with Actions"
        description="This alert has both long content and action buttons positioned at the bottom. The layout should remain clean and organized even with extended text."
        actions={[
          { label: 'Primary action', onPress: () => console.log('Primary') },
          { label: 'Secondary', onPress: () => console.log('Secondary') },
        ]}
      />
    </View>
  ),
}

// Theme comparison
export const ThemeComparison_: Story = {
  render: () => (
    <ThemeComparison>
      {() => (
        <View style={styles.themeContainer}>
          <Alert
            type="info"
            variant="linear"
            title="Information"
            description="This alert adapts to the current theme"
            actions={[
              { label: 'Action 1', onPress: () => console.log('Action 1') },
              { label: 'Action 2', onPress: () => console.log('Action 2') },
            ]}
          />
          <Alert
            type="success"
            variant="light"
            title="Success"
            description="Light variant in different themes"
          />
          <Alert
            type="warning"
            variant="filled"
            title="Warning"
            description="Filled variant looks consistent across themes"
          />
        </View>
      )}
    </ThemeComparison>
  ),
}

// AI Alert showcase
export const AIAlert: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>AI Alert Type - All Variants</Text>
      <Alert
        type="ai"
        variant="linear"
        title="AI Recommendation"
        description="Based on your usage patterns, we recommend enabling auto-save"
        actions={[
          { label: 'Enable', onPress: () => console.log('Enable') },
          { label: 'Not now', onPress: () => console.log('Not now') },
        ]}
      />
      <Alert
        type="ai"
        variant="light"
        title="AI Insight"
        description="Your productivity has increased by 23% this week"
      />
      <Alert
        type="ai"
        variant="filled"
        title="AI Assistant"
        description="I can help you optimize this workflow"
        actions={[{ label: 'Show me', onPress: () => console.log('Show') }]}
      />
    </View>
  ),
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[16],
    padding: spacing[16],
    maxWidth: 600,
  },
  themeContainer: {
    gap: spacing[16],
    maxWidth: 600,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing[8],
    color: '#344051',
  },
  status: {
    fontSize: 14,
    color: '#637083',
    marginBottom: spacing[8],
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing[12],
  },
  button: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fb612a',
    textDecorationLine: 'underline',
    padding: spacing[8],
  },
  variantsContainer: {
    gap: spacing[16],
  },
})
