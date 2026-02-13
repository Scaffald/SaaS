/**
 * Toast Components Stories
 * Demonstrates Toast, ToastProvider, ToastContainer components
 */

import type { Meta, StoryObj } from '@storybook/react'
import { View, StyleSheet } from 'react-native'
import { Toast, ToastProvider, ToastContainer, useToast } from '../../../components/Toast'
import { Button } from '../../../components/Button'
import { Stack, Row } from '../../../components/Layout'
import { Text, H4 } from '../../../components/Typography'
import { spacing } from '../../../tokens/spacing'

const meta: Meta = {
  title: 'Components/Toast',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Toast is a notification system for showing temporary messages to users. Supports multiple variants, positions, and actions.',
      },
    },
  },
  decorators: [
    (Story) => (
      <ToastProvider>
        <View style={styles.container}>
          <Story />
        </View>
        <ToastContainer position="top-right" />
      </ToastProvider>
    ),
  ],
}

export default meta

// ============================================================================
// Helper Components
// ============================================================================

function ToastTriggerExample() {
  const toast = useToast()

  return (
    <Stack gap={16}>
      <H4>Toast Triggers</H4>
      <Row gap={12} style={styles.wrap}>
        <Button onPress={() => toast.info('This is an info message')}>Info Toast</Button>
        <Button color="success" onPress={() => toast.success('Operation completed successfully!')}>
          Success Toast
        </Button>
        <Button
          color="warning"
          onPress={() => toast.warning('Please review your settings')}
        >
          Warning Toast
        </Button>
        <Button color="error" onPress={() => toast.error('An error occurred')}>
          Error Toast
        </Button>
      </Row>
    </Stack>
  )
}

function ToastWithTitleExample() {
  const toast = useToast()

  return (
    <Stack gap={16}>
      <H4>Toast with Title</H4>
      <Row gap={12} style={styles.wrap}>
        <Button
          onPress={() =>
            toast.show({
              title: 'Information',
              message: 'Here is some detailed information about the process.',
              variant: 'info',
            })
          }
        >
          With Title
        </Button>
        <Button
          color="success"
          onPress={() =>
            toast.show({
              title: 'Success!',
              message: 'Your changes have been saved successfully.',
              variant: 'success',
            })
          }
        >
          Success with Title
        </Button>
      </Row>
    </Stack>
  )
}

function ToastWithActionExample() {
  const toast = useToast()

  return (
    <Stack gap={16}>
      <H4>Toast with Action</H4>
      <Button
        onPress={() =>
          toast.show({
            title: 'File deleted',
            message: 'The file has been moved to trash.',
            variant: 'info',
            action: {
              label: 'Undo',
              onPress: () => toast.success('File restored!'),
            },
          })
        }
      >
        With Undo Action
      </Button>
    </Stack>
  )
}

function ToastDurationExample() {
  const toast = useToast()

  return (
    <Stack gap={16}>
      <H4>Custom Duration</H4>
      <Row gap={12} style={styles.wrap}>
        <Button
          onPress={() =>
            toast.show({
              message: 'This disappears in 2 seconds',
              variant: 'info',
              duration: 2000,
            })
          }
        >
          2 seconds
        </Button>
        <Button
          onPress={() =>
            toast.show({
              message: 'This disappears in 10 seconds',
              variant: 'info',
              duration: 10000,
            })
          }
        >
          10 seconds
        </Button>
        <Button
          onPress={() =>
            toast.show({
              message: 'This must be dismissed manually',
              variant: 'warning',
              duration: 0,
            })
          }
        >
          No auto-dismiss
        </Button>
      </Row>
    </Stack>
  )
}

function ToastMultipleExample() {
  const toast = useToast()

  return (
    <Stack gap={16}>
      <H4>Multiple Toasts</H4>
      <Row gap={12} style={styles.wrap}>
        <Button
          onPress={() => {
            toast.info('First notification')
            setTimeout(() => toast.success('Second notification'), 500)
            setTimeout(() => toast.warning('Third notification'), 1000)
          }}
        >
          Show Multiple
        </Button>
        <Button variant="outline" onPress={() => toast.dismissAll()}>
          Dismiss All
        </Button>
      </Row>
    </Stack>
  )
}

// ============================================================================
// Stories
// ============================================================================

export const InteractiveDemo: StoryObj = {
  name: 'Interactive Demo',
  render: () => (
    <Stack gap={32}>
      <ToastTriggerExample />
      <ToastWithTitleExample />
      <ToastWithActionExample />
      <ToastDurationExample />
      <ToastMultipleExample />
    </Stack>
  ),
}

export const ToastVariants: StoryObj = {
  name: 'Variants (Static)',
  render: () => (
    <Stack gap={16} style={styles.staticContainer}>
      <Text size="sm" color="secondary">
        Static examples of each toast variant:
      </Text>

      <Toast
        id="info-example"
        variant="info"
        title="Information"
        message="This is an informational message for the user."
        onDismiss={() => {}}
      />

      <Toast
        id="success-example"
        variant="success"
        title="Success"
        message="Your operation completed successfully."
        onDismiss={() => {}}
      />

      <Toast
        id="warning-example"
        variant="warning"
        title="Warning"
        message="Please review your settings before continuing."
        onDismiss={() => {}}
      />

      <Toast
        id="error-example"
        variant="error"
        title="Error"
        message="An error occurred while processing your request."
        onDismiss={() => {}}
      />
    </Stack>
  ),
}

export const ToastWithAction: StoryObj = {
  name: 'With Action Button',
  render: () => (
    <Stack gap={16} style={styles.staticContainer}>
      <Toast
        id="action-example"
        variant="info"
        title="File deleted"
        message="The file has been moved to trash."
        action={{
          label: 'Undo',
          onPress: () => console.log('Undo clicked'),
        }}
        onDismiss={() => {}}
      />
    </Stack>
  ),
}

export const ToastSimpleMessage: StoryObj = {
  name: 'Simple Message (No Title)',
  render: () => (
    <Stack gap={16} style={styles.staticContainer}>
      <Toast
        id="simple-info"
        variant="info"
        message="New message received"
        onDismiss={() => {}}
      />

      <Toast
        id="simple-success"
        variant="success"
        message="Saved successfully!"
        onDismiss={() => {}}
      />
    </Stack>
  ),
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    minHeight: 400,
    padding: spacing[16],
  },
  wrap: {
    flexWrap: 'wrap',
  },
  staticContainer: {
    maxWidth: 400,
  },
})
