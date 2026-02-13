/**
 * Modal component stories
 */

import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { View, Text, StyleSheet } from 'react-native'
import {
  Modal,
  ModalHeader,
  ModalActions,
  ModalContent,
  ConfirmationModal,
  EcommerceShippingModal,
  EcommerceCartPreviewModal,
  WorkspaceMembersModal,
} from '../../../components/Modal'
import { Button } from '../../../components/Button'
import { Checkbox } from '../../../components/Checkbox'
import { ThemeProvider } from '../../../theme'
import { CheckCircle } from 'lucide-react-native'
import { spacing } from '../../../tokens/spacing'

const meta = {
  title: 'Components/Modal',
  component: Modal,
  decorators: [
    (Story) => (
      <ThemeProvider>
        <View style={{ padding: 24, minHeight: 400 }}>
          <Story />
        </View>
      </ThemeProvider>
    ),
  ],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Modal component system with overlay, header, content, and actions. Supports multiple variants for different use cases.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Modal>

export default meta
type Story = StoryObj<typeof meta>

const styles = StyleSheet.create({
  container: {
    width: 600,
    padding: spacing[20],
  },
  button: {
    marginBottom: spacing[16],
  },
})

// Basic Modal
export const Default: Story = {
  render: () => {
    const [visible, setVisible] = useState(false)

    return (
      <View style={styles.container}>
        <Button onPress={() => setVisible(true)} style={styles.button}>
          Open Modal
        </Button>
        <Modal visible={visible} onClose={() => setVisible(false)}>
          <ModalHeader
            title="Modal Title"
            description="This is a modal description"
            onClose={() => setVisible(false)}
          />
          <ModalContent>
            <Text>This is the modal content area.</Text>
          </ModalContent>
          <ModalActions
            primaryAction={{ label: 'Save', onPress: () => setVisible(false) }}
            secondaryAction={{ label: 'Cancel', onPress: () => setVisible(false) }}
          />
        </Modal>
      </View>
    )
  },
}

// Modal with Center Header
export const CenterHeader: Story = {
  render: () => {
    const [visible, setVisible] = useState(false)

    return (
      <View style={styles.container}>
        <Button onPress={() => setVisible(true)} style={styles.button}>
          Open Modal with Center Header
        </Button>
        <Modal visible={visible} onClose={() => setVisible(false)}>
          <ModalHeader
            title="Modal Title"
            description="This is a centered modal description"
            orientation="center"
            onClose={() => setVisible(false)}
          />
          <ModalContent>
            <Text>Content here</Text>
          </ModalContent>
          <ModalActions
            primaryAction={{ label: 'Save', onPress: () => setVisible(false) }}
            secondaryAction={{ label: 'Cancel', onPress: () => setVisible(false) }}
          />
        </Modal>
      </View>
    )
  },
}

// Modal with Right Actions
export const RightActions: Story = {
  render: () => {
    const [visible, setVisible] = useState(false)

    return (
      <View style={styles.container}>
        <Button onPress={() => setVisible(true)} style={styles.button}>
          Open Modal with Right Actions
        </Button>
        <Modal visible={visible} onClose={() => setVisible(false)}>
          <ModalHeader
            title="Modal Title"
            onClose={() => setVisible(false)}
          />
          <ModalContent>
            <Text>Content here</Text>
          </ModalContent>
          <ModalActions
            orientation="right"
            primaryAction={{ label: 'Save', onPress: () => setVisible(false) }}
            secondaryAction={{ label: 'Cancel', onPress: () => setVisible(false) }}
          />
        </Modal>
      </View>
    )
  },
}

// Modal with Sub-actions
export const WithSubActions: Story = {
  render: () => {
    const [visible, setVisible] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)

    return (
      <View style={styles.container}>
        <Button onPress={() => setVisible(true)} style={styles.button}>
          Open Modal with Sub-actions
        </Button>
        <Modal visible={visible} onClose={() => setVisible(false)}>
          <ModalHeader
            title="Modal Title"
            onClose={() => setVisible(false)}
          />
          <ModalContent>
            <Text>Content here</Text>
          </ModalContent>
          <ModalActions
            primaryAction={{ label: 'Save', onPress: () => setVisible(false) }}
            secondaryAction={{ label: 'Cancel', onPress: () => setVisible(false) }}
            subActions={
              <Checkbox
                label="Remember this choice"
                checked={rememberMe}
                onChange={setRememberMe}
              />
            }
          />
        </Modal>
      </View>
    )
  },
}

// Confirmation Modal
export const Confirmation: Story = {
  render: () => {
    const [visible, setVisible] = useState(false)

    return (
      <View style={styles.container}>
        <Button onPress={() => setVisible(true)} style={styles.button}>
          Open Confirmation Modal
        </Button>
        <Modal visible={visible} onClose={() => setVisible(false)}>
          <ModalHeader
            title="Success"
            orientation="center"
            showCloseButton={false}
          />
          <ModalContent>
            <ConfirmationModal message="Your changes have been saved." />
          </ModalContent>
          <ModalActions
            orientation="center"
            primaryAction={{ label: 'OK', onPress: () => setVisible(false) }}
          />
        </Modal>
      </View>
    )
  },
}

// Ecommerce Shipping Modal
export const Shipping: Story = {
  render: () => {
    const [visible, setVisible] = useState(false)
    const [selectedId, setSelectedId] = useState<string>('free')

    const shippingOptions = [
      {
        id: 'free',
        title: 'Free Shipping',
        description: '7-10 days for delivery',
      },
      {
        id: 'express',
        title: 'Express Shipping',
        description: '1 day delivery for additional $29',
        price: '$29',
      },
      {
        id: 'overnight',
        title: 'Overnight Shipping',
        description: 'Next day delivery for additional $49',
        price: '$49',
      },
    ]

    return (
      <View style={styles.container}>
        <Button onPress={() => setVisible(true)} style={styles.button}>
          Open Shipping Modal
        </Button>
        <Modal visible={visible} onClose={() => setVisible(false)}>
          <ModalHeader
            title="Select Shipping Option"
            onClose={() => setVisible(false)}
          />
          <ModalContent>
            <EcommerceShippingModal
              options={shippingOptions}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </ModalContent>
          <ModalActions
            primaryAction={{ label: 'Continue', onPress: () => setVisible(false) }}
            secondaryAction={{ label: 'Cancel', onPress: () => setVisible(false) }}
          />
        </Modal>
      </View>
    )
  },
}

// Ecommerce Cart Preview Modal
export const CartPreview: Story = {
  render: () => {
    const [visible, setVisible] = useState(false)

    const cartItems = [
      {
        id: '1',
        title: 'iPhone 15 Pro',
        description: 'Alpine Green - 1TB',
        quantity: 1,
        price: 999.0,
      },
      {
        id: '2',
        title: 'AirPods Pro',
        description: 'White',
        quantity: 2,
        price: 249.0,
      },
    ]

    const handleQuantityChange = (id: string, quantity: number) => {
      console.log(`Quantity changed for ${id}: ${quantity}`)
    }

    return (
      <View style={styles.container}>
        <Button onPress={() => setVisible(true)} style={styles.button}>
          Open Cart Preview Modal
        </Button>
        <Modal visible={visible} onClose={() => setVisible(false)}>
          <ModalHeader
            title="Cart"
            onClose={() => setVisible(false)}
          />
          <ModalContent>
            <EcommerceCartPreviewModal
              items={cartItems}
              onQuantityChange={handleQuantityChange}
              subtotal={1497.0}
              tax={120.0}
              total={1617.0}
            />
          </ModalContent>
          <ModalActions
            primaryAction={{ label: 'Checkout', onPress: () => setVisible(false) }}
            secondaryAction={{ label: 'Continue Shopping', onPress: () => setVisible(false) }}
          />
        </Modal>
      </View>
    )
  },
}

// Workspace Members Modal
export const Members: Story = {
  render: () => {
    const [visible, setVisible] = useState(false)
    const [activeTab, setActiveTab] = useState('members')

    const members = [
      {
        id: '1',
        name: 'Edward Smith',
        username: '@ediesmith',
        avatar: 'https://i.pravatar.cc/48?img=1',
        avatarType: 'photo' as const,
      },
      {
        id: '2',
        name: 'Jane Doe',
        username: '@janedoe',
        avatar: 'https://i.pravatar.cc/48?img=2',
        avatarType: 'photo' as const,
      },
      {
        id: '3',
        name: 'Bob Johnson',
        username: '@bobjohnson',
        avatar: 'https://i.pravatar.cc/48?img=3',
        avatarType: 'photo' as const,
      },
    ]

    return (
      <View style={styles.container}>
        <Button onPress={() => setVisible(true)} style={styles.button}>
          Open Members Modal
        </Button>
        <Modal visible={visible} onClose={() => setVisible(false)} width={600}>
          <ModalHeader
            title="Workspace Members"
            onClose={() => setVisible(false)}
          />
          <ModalContent>
            <WorkspaceMembersModal
              members={members}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onSearch={(query) => console.log('Search:', query)}
              onAddMember={() => console.log('Add member')}
              searchPlaceholder="Search members..."
              searchHelperText="Helper text"
            />
          </ModalContent>
          <ModalActions
            primaryAction={{ label: 'Done', onPress: () => setVisible(false) }}
          />
        </Modal>
      </View>
    )
  },
}

// Custom Width Modal
export const CustomWidth: Story = {
  render: () => {
    const [visible, setVisible] = useState(false)

    return (
      <View style={styles.container}>
        <Button onPress={() => setVisible(true)} style={styles.button}>
          Open Custom Width Modal
        </Button>
        <Modal visible={visible} onClose={() => setVisible(false)} width={800}>
          <ModalHeader
            title="Wide Modal"
            onClose={() => setVisible(false)}
          />
          <ModalContent>
            <Text>This modal has a custom width of 800px</Text>
          </ModalContent>
          <ModalActions
            primaryAction={{ label: 'Close', onPress: () => setVisible(false) }}
          />
        </Modal>
      </View>
    )
  },
}

// No Close on Backdrop
export const NoBackdropClose: Story = {
  render: () => {
    const [visible, setVisible] = useState(false)

    return (
      <View style={styles.container}>
        <Button onPress={() => setVisible(true)} style={styles.button}>
          Open Modal (No Backdrop Close)
        </Button>
        <Modal
          visible={visible}
          onClose={() => setVisible(false)}
          closeOnBackdropPress={false}
        >
          <ModalHeader
            title="Modal Title"
            onClose={() => setVisible(false)}
          />
          <ModalContent>
            <Text>This modal cannot be closed by clicking the backdrop.</Text>
          </ModalContent>
          <ModalActions
            primaryAction={{ label: 'Close', onPress: () => setVisible(false) }}
          />
        </Modal>
      </View>
    )
  },
}

// Modal with Icon in Header
export const WithIcon: Story = {
  render: () => {
    const [visible, setVisible] = useState(false)

    return (
      <View style={styles.container}>
        <Button onPress={() => setVisible(true)} style={styles.button}>
          Open Modal with Icon
        </Button>
        <Modal visible={visible} onClose={() => setVisible(false)}>
          <ModalHeader
            title="Success"
            description="Your action was completed successfully"
            icon={<CheckCircle size={48} color="#10b978" />}
            onClose={() => setVisible(false)}
          />
          <ModalContent>
            <Text>Content here</Text>
          </ModalContent>
          <ModalActions
            primaryAction={{ label: 'OK', onPress: () => setVisible(false) }}
          />
        </Modal>
      </View>
    )
  },
}

// Long Content Modal (Scrollable)
export const LongContent: Story = {
  render: () => {
    const [visible, setVisible] = useState(false)

    return (
      <View style={styles.container}>
        <Button onPress={() => setVisible(true)} style={styles.button}>
          Open Modal with Long Content
        </Button>
        <Modal visible={visible} onClose={() => setVisible(false)}>
          <ModalHeader
            title="Long Content Modal"
            onClose={() => setVisible(false)}
          />
          <ModalContent>
            {Array.from({ length: 20 }, (_, i) => (
              <Text key={i} style={{ marginBottom: 16 }}>
                This is paragraph {i + 1}. Modal content can be scrollable when it
                exceeds the available space. This allows users to view all content
                without the modal becoming too large.
              </Text>
            ))}
          </ModalContent>
          <ModalActions
            primaryAction={{ label: 'Close', onPress: () => setVisible(false) }}
          />
        </Modal>
      </View>
    )
  },
}

// Dark Theme Modal
export const DarkTheme: Story = {
  decorators: [
    (Story) => (
      <ThemeProvider defaultTheme="dark">
        <View style={{ padding: 24, minHeight: 400, backgroundColor: '#0a0e14' }}>
          <Story />
        </View>
      </ThemeProvider>
    ),
  ],
  render: () => {
    const [visible, setVisible] = useState(false)

    return (
      <View style={styles.container}>
        <Button onPress={() => setVisible(true)} style={styles.button}>
          Open Dark Theme Modal
        </Button>
        <Modal visible={visible} onClose={() => setVisible(false)}>
          <ModalHeader
            title="Dark Theme Modal"
            description="This modal uses dark theme styling"
            onClose={() => setVisible(false)}
          />
          <ModalContent>
            <Text>Content here</Text>
          </ModalContent>
          <ModalActions
            primaryAction={{ label: 'Save', onPress: () => setVisible(false) }}
            secondaryAction={{ label: 'Cancel', onPress: () => setVisible(false) }}
          />
        </Modal>
      </View>
    )
  },
}

// Modal with Loading Actions
export const LoadingActions: Story = {
  render: () => {
    const [visible, setVisible] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSave = () => {
      setLoading(true)
      setTimeout(() => {
        setLoading(false)
        setVisible(false)
      }, 2000)
    }

    return (
      <View style={styles.container}>
        <Button onPress={() => setVisible(true)} style={styles.button}>
          Open Modal with Loading Actions
        </Button>
        <Modal visible={visible} onClose={() => setVisible(false)}>
          <ModalHeader
            title="Save Changes"
            onClose={() => setVisible(false)}
          />
          <ModalContent>
            <Text>Click Save to see loading state</Text>
          </ModalContent>
          <ModalActions
            primaryAction={{
              label: 'Save',
              onPress: handleSave,
              loading: loading,
            }}
            secondaryAction={{
              label: 'Cancel',
              onPress: () => setVisible(false),
              disabled: loading,
            }}
          />
        </Modal>
      </View>
    )
  },
}
