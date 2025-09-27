import React from 'react'
import {
  YStack,
  XStack,
  H1,
  H2,
  H3,
  Text,
  Paragraph,
  Button,
  Card,
  ScrollView,
  Theme,
} from '@app/ui'

// Import custom components
import {
  AnimatedButton,
  EnhancedAnimatedButton,
  LoadingButton,
  SuccessButton,
} from '@app/ui/src/components/AnimatedButton'

// Import icons
import {
  Heart,
  Star,
  Download,
  Upload,
  Trash2,
  Plus,
  Send,
  Check,
  Save,
} from '@tamagui/lucide-icons'

/**
 * Buttons Section of Styleguide
 * Showcases all button variants, animations, and states
 */
export function ButtonsScreen() {
  // Enhanced button states for comprehensive UAT
  const [isLoading1, setIsLoading1] = React.useState(false)
  const [isLoading2, setIsLoading2] = React.useState(false)
  const [isLoading3, setIsLoading3] = React.useState(false)
  const [showSuccess1, setShowSuccess1] = React.useState(false)
  const [showSuccess2, setShowSuccess2] = React.useState(false)
  const [showSuccess3, setShowSuccess3] = React.useState(false)

  // UAT testing states
  const [uatLoadingStates, setUatLoadingStates] = React.useState<Record<string, boolean>>({})
  const [uatSuccessStates, setUatSuccessStates] = React.useState<Record<string, boolean>>({})

  const toggleUATLoading = (key: string) => {
    setUatLoadingStates((prev) => ({ ...prev, [key]: !prev[key] }))
    setTimeout(() => {
      setUatLoadingStates((prev) => ({ ...prev, [key]: false }))
    }, 2000)
  }

  const toggleUATSuccess = (key: string) => {
    setUatSuccessStates((prev) => ({ ...prev, [key]: !prev[key] }))
    setTimeout(() => {
      setUatSuccessStates((prev) => ({ ...prev, [key]: false }))
    }, 2000)
  }

  return (
    <ScrollView>
      <YStack f={1} p="$4" gap="$6" maw={1200} mx="auto">
        {/* Header */}
        <YStack gap="$2">
          <H1>Buttons</H1>
          <Paragraph color="$gray11" size="$5">
            Interactive button components with animations, loading states, and various styles.
          </Paragraph>
        </YStack>

        {/* Basic Buttons */}
        <Card p="$4" gap="$4">
          <H2>Basic Buttons</H2>
          <YStack gap="$4">
            <YStack gap="$3">
              <H3>Button Variants</H3>
              <XStack gap="$3" flexWrap="wrap">
                <Button>Default Button</Button>
                <Button theme="blue">Primary Button</Button>
                <Button variant="outlined">Outlined Button</Button>
                <Button chromeless>Chromeless Button</Button>
                <Button disabled>Disabled Button</Button>
              </XStack>
            </YStack>

            <YStack gap="$3">
              <H3>Button Sizes</H3>
              <XStack gap="$3" ai="center" flexWrap="wrap">
                <Button size="$2">Small</Button>
                <Button size="$3">Medium</Button>
                <Button size="$4">Default</Button>
                <Button size="$5">Large</Button>
                <Button size="$6">Extra Large</Button>
              </XStack>
            </YStack>

            <YStack gap="$3">
              <H3>Buttons with Icons</H3>
              <XStack gap="$3" flexWrap="wrap">
                <Button theme="blue">
                  <Button.Icon>
                    <Heart />
                  </Button.Icon>
                  <Button.Text>Like</Button.Text>
                </Button>
                <Button theme="green">
                  <Button.Icon>
                    <Download />
                  </Button.Icon>
                  <Button.Text>Download</Button.Text>
                </Button>
                <Button theme="red" variant="outlined">
                  <Button.Icon>
                    <Trash2 />
                  </Button.Icon>
                  <Button.Text>Delete</Button.Text>
                </Button>
                <Button circular size="$3">
                  <Plus />
                </Button>
              </XStack>
            </YStack>
          </YStack>
        </Card>

        {/* Enhanced Animated Buttons */}
        <Card p="$4" gap="$4">
          <H2>Enhanced Animated Buttons</H2>
          <Paragraph size="$2" color="$gray11">
            Our upgraded AnimatedButton with bento-inspired patterns. Test all animation variants
            and loading states.
          </Paragraph>

          <YStack gap="$4">
            {/* Animation Variants */}
            <YStack gap="$2">
              <Text fontWeight="600" size="$3">
                Animation Variants
              </Text>
              <XStack gap="$3" flexWrap="wrap">
                <EnhancedAnimatedButton variant="primary">Primary</EnhancedAnimatedButton>
                <EnhancedAnimatedButton variant="secondary">Secondary</EnhancedAnimatedButton>
                <EnhancedAnimatedButton variant="pulse" animationPreset="100ms">
                  Pulse
                </EnhancedAnimatedButton>
                <EnhancedAnimatedButton variant="bouncy" animationPreset="bouncy">
                  Bouncy
                </EnhancedAnimatedButton>
                <EnhancedAnimatedButton variant="lazy" animationPreset="medium">
                  Lazy
                </EnhancedAnimatedButton>
                <EnhancedAnimatedButton variant="bump" animationPreset="bouncy">
                  Bump
                </EnhancedAnimatedButton>
              </XStack>
            </YStack>

            {/* Loading States */}
            <YStack gap="$2">
              <Text fontWeight="600" size="$3">
                Loading States
              </Text>
              <XStack gap="$3" flexWrap="wrap">
                <LoadingButton
                  loading={isLoading1}
                  loadingText="Saving..."
                  onPress={() => {
                    setIsLoading1(true)
                    setTimeout(() => setIsLoading1(false), 2000)
                  }}
                >
                  Save Changes
                </LoadingButton>

                <LoadingButton
                  variant="secondary"
                  loading={isLoading2}
                  loadingText="Processing..."
                  onPress={() => {
                    setIsLoading2(true)
                    setTimeout(() => setIsLoading2(false), 3000)
                  }}
                >
                  Process Data
                </LoadingButton>

                <EnhancedAnimatedButton
                  variant="pulse"
                  loading={isLoading3}
                  loadingText="Uploading..."
                  onPress={() => {
                    setIsLoading3(true)
                    setTimeout(() => setIsLoading3(false), 2500)
                  }}
                >
                  <Send size={16} />
                  Upload File
                </EnhancedAnimatedButton>
              </XStack>
            </YStack>

            {/* Success States */}
            <YStack gap="$2">
              <Text fontWeight="600" size="$3">
                Success States
              </Text>
              <XStack gap="$3" flexWrap="wrap">
                <SuccessButton
                  showSuccess={showSuccess1}
                  successIcon={<Check />}
                  onPress={() => {
                    setShowSuccess1(true)
                    setTimeout(() => setShowSuccess1(false), 2000)
                  }}
                >
                  Accept Terms
                </SuccessButton>

                <SuccessButton
                  variant="secondary"
                  showSuccess={showSuccess2}
                  successIcon={<Save />}
                  onPress={() => {
                    setShowSuccess2(true)
                    setTimeout(() => setShowSuccess2(false), 2000)
                  }}
                >
                  Save Draft
                </SuccessButton>

                <SuccessButton
                  variant="bouncy"
                  animationPreset="bouncy"
                  showSuccess={showSuccess3}
                  successIcon={<Heart />}
                  onPress={() => {
                    setShowSuccess3(true)
                    setTimeout(() => setShowSuccess3(false), 2000)
                  }}
                >
                  Add to Favorites
                </SuccessButton>
              </XStack>
            </YStack>
          </YStack>
        </Card>

        {/* Theme Integration */}
        <Card p="$4" gap="$4">
          <H2>Theme Integration</H2>
          <XStack gap="$2" flexWrap="wrap" ai="center">
            <EnhancedAnimatedButton variant="primary" theme="blue">
              Blue Theme
            </EnhancedAnimatedButton>
            <EnhancedAnimatedButton variant="primary" theme="green">
              Green Theme
            </EnhancedAnimatedButton>
            <EnhancedAnimatedButton variant="primary" theme="red">
              Red Theme
            </EnhancedAnimatedButton>
            <EnhancedAnimatedButton variant="primary" theme="purple">
              Purple Theme
            </EnhancedAnimatedButton>
            <EnhancedAnimatedButton variant="primary" theme="orange">
              Orange Theme
            </EnhancedAnimatedButton>
          </XStack>
        </Card>

        {/* Comprehensive UAT Testing Section */}
        <Card p="$4" gap="$6" borderColor="$blue7" borderWidth={2}>
          <YStack gap="$3">
            <H2 color="$blue11">🧪 Comprehensive UAT Testing</H2>
            <Paragraph size="$3" color="$blue11">
              Complete testing matrix for all button variants, states, sizes, and features. Click
              any button to test its functionality.
            </Paragraph>
          </YStack>

          {/* Loading States Testing */}
          <YStack gap="$3">
            <H3>Loading States (Click to Test)</H3>
            <XStack gap="$2" flexWrap="wrap" ai="center">
              <LoadingButton
                variant="primary"
                loading={uatLoadingStates['loading-primary']}
                loadingText="Saving..."
                onPress={() => toggleUATLoading('loading-primary')}
              >
                Primary Loading
              </LoadingButton>
              <LoadingButton
                variant="secondary"
                loading={uatLoadingStates['loading-secondary']}
                loadingText="Processing..."
                onPress={() => toggleUATLoading('loading-secondary')}
              >
                Secondary Loading
              </LoadingButton>
              <LoadingButton
                variant="pulse"
                loading={uatLoadingStates['loading-pulse']}
                loadingText="Uploading..."
                onPress={() => toggleUATLoading('loading-pulse')}
              >
                Pulse Loading
              </LoadingButton>
            </XStack>
          </YStack>

          {/* Success States Testing */}
          <YStack gap="$3">
            <H3>Success States (Click to Test)</H3>
            <XStack gap="$2" flexWrap="wrap" ai="center">
              <SuccessButton
                variant="primary"
                showSuccess={uatSuccessStates['success-primary']}
                successIcon={<Check />}
                onPress={() => toggleUATSuccess('success-primary')}
              >
                Accept Terms
              </SuccessButton>
              <SuccessButton
                variant="secondary"
                showSuccess={uatSuccessStates['success-secondary']}
                successIcon={<Save />}
                onPress={() => toggleUATSuccess('success-secondary')}
              >
                Save Draft
              </SuccessButton>
              <SuccessButton
                variant="bouncy"
                showSuccess={uatSuccessStates['success-bouncy']}
                successIcon={<Heart />}
                onPress={() => toggleUATSuccess('success-bouncy')}
              >
                Add Favorite
              </SuccessButton>
            </XStack>
          </YStack>
        </Card>
      </YStack>
    </ScrollView>
  )
}
