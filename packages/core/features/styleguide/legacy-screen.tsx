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
  Separator,
  ScrollView,
  Avatar,
  Input,
  TextArea,
  Switch,
  Checkbox,
  RadioGroup,
  Select,
  Slider,
  Progress,
  Spinner,
  AlertDialog,
  Dialog,
  Popover,
  Sheet,
  View,
  Theme,
} from '@app/ui'

// Import custom components
import {
  AnimatedButton,
  EnhancedAnimatedButton,
  LoadingButton,
  SuccessButton,
} from '@app/ui/src/components/AnimatedButton'
import {
  EnhancedTextField,
  IconTextField,
  HelperTextField,
  CountingTextField,
} from '@app/ui/src/components/EnhancedTextField'
import { CheckboxToggle } from '@app/ui/src/components/CheckboxToggle'

// Import icons
import {
  Heart,
  Star,
  Home,
  Settings,
  User,
  Mail,
  Phone,
  Calendar,
  Camera,
  Download,
  Upload,
  PenTool,
  Trash2,
  Plus,
  Minus,
  Search,
  Filter,
  Bell,
  Menu,
  Check,
  Save,
  Send,
  X,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Info,
  MapPin,
} from '@tamagui/lucide-icons'

/**
 * Styleguide Screen Component
 * Showcases all primary UI components used throughout the application
 * Works cross-platform (Next.js and Expo)
 */
export function StyleguideScreen() {
  const [switchValue, setSwitchValue] = React.useState(false)
  const [checkboxValue, setCheckboxValue] = React.useState(false)
  const [radioValue, setRadioValue] = React.useState('option1')
  const [sliderValue, setSliderValue] = React.useState([50])
  const [progressValue] = React.useState(75)

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

  // Enhanced text field states
  const [showPassword, setShowPassword] = React.useState(false)

  // CheckboxToggle UAT states
  const [checkboxToggleStates, setCheckboxToggleStates] = React.useState<Record<string, boolean>>({
    'checkbox-basic': false,
    'checkbox-required': false,
    'checkbox-optional': false,
    'checkbox-error': false,
    'toggle-basic': false,
    'toggle-icons': true,
    'toggle-error': false,
    'card-basic': false,
    'card-with-desc': false,
    'card-error': false,
    'minimal-basic': false,
    'minimal-required': false,
  })

  // Text input test states
  const [textInputStates, setTextInputStates] = React.useState<Record<string, string>>({
    'standalone-basic': '',
    'standalone-with-icon': '',
    'standalone-error': '',
    'standalone-disabled': 'Disabled text',
  })

  const toggleCheckboxToggle = (key: string) => {
    setCheckboxToggleStates((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const updateTextInput = (key: string, value: string) => {
    setTextInputStates((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <ScrollView>
      <YStack f={1} p="$4" gap="$6" maw={1200} mx="auto">
        {/* Header */}
        <YStack gap="$2">
          <H1>Component Styleguide</H1>
          <Paragraph color="$gray11" size="$5">
            A comprehensive showcase of all UI components used throughout the application. These
            components are cross-platform compatible and work on both web and mobile.
          </Paragraph>
        </YStack>

        {/* Typography Section */}
        <Card p="$4" gap="$4">
          <H2>Typography</H2>
          <YStack gap="$3">
            <H1>Heading 1 - Main Title</H1>
            <H2>Heading 2 - Section Title</H2>
            <H3>Heading 3 - Subsection Title</H3>
            <Text fontSize="$6" fontWeight="600">
              Large Text - Important content
            </Text>
            <Text fontSize="$4">Regular Text - Body content</Text>
            <Text fontSize="$3" color="$gray11">
              Small Text - Secondary information
            </Text>
            <Paragraph>
              This is a paragraph component with multiple lines of text. It's useful for longer
              content that needs proper line spacing and formatting. The paragraph component handles
              text flow and maintains consistent spacing throughout the application.
            </Paragraph>
          </YStack>
        </Card>

        {/* Color Swatches */}
        <Card p="$4" gap="$4">
          <H2>Theme Colors</H2>
          <XStack gap="$3" flexWrap="wrap">
            {(['blue', 'red', 'green', 'purple', 'pink', 'yellow', 'orange', 'gray'] as const).map(
              (color) => (
                <YStack key={color} ai="center" gap="$2">
                  <View
                    w={60}
                    h={60}
                    br="$4"
                    theme={color}
                    bg="$color9"
                    borderWidth={1}
                    borderColor="$borderColor"
                  />
                  <Text size="$2" tt="capitalize">
                    {color}
                  </Text>
                </YStack>
              )
            )}
          </XStack>
        </Card>

        {/* Buttons Section */}
        <Card p="$4" gap="$4">
          <H2>Buttons</H2>

          <YStack gap="$4">
            <YStack gap="$3">
              <H3>Basic Buttons</H3>
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

            <YStack gap="$3">
              <H3>Enhanced Animated Buttons</H3>
              <Paragraph size="$2" color="$gray11">
                Our upgraded AnimatedButton with bento-inspired patterns. Test all animation
                variants and loading states.
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

                {/* Legacy Comparison */}
                <YStack gap="$2">
                  <Text fontWeight="600" size="$3">
                    Legacy vs Enhanced
                  </Text>
                  <XStack gap="$3" flexWrap="wrap">
                    <AnimatedButton variant="primary">Legacy AnimatedButton</AnimatedButton>
                    <EnhancedAnimatedButton variant="primary">
                      Enhanced AnimatedButton
                    </EnhancedAnimatedButton>
                  </XStack>
                </YStack>
              </YStack>
            </YStack>
          </YStack>
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

          {/* All Variants Row */}
          <YStack gap="$3">
            <H3>All Animation Variants</H3>
            <XStack gap="$2" flexWrap="wrap" ai="center">
              <EnhancedAnimatedButton variant="primary" size="$4">
                Primary
              </EnhancedAnimatedButton>
              <EnhancedAnimatedButton variant="secondary" size="$4">
                Secondary
              </EnhancedAnimatedButton>
              <EnhancedAnimatedButton variant="pulse" size="$4">
                Pulse
              </EnhancedAnimatedButton>
              <EnhancedAnimatedButton variant="bouncy" size="$4">
                Bouncy
              </EnhancedAnimatedButton>
              <EnhancedAnimatedButton variant="lazy" size="$4">
                Lazy
              </EnhancedAnimatedButton>
              <EnhancedAnimatedButton variant="bump" size="$4">
                Bump
              </EnhancedAnimatedButton>
              <EnhancedAnimatedButton variant="success" size="$4">
                Success
              </EnhancedAnimatedButton>
            </XStack>
          </YStack>

          {/* Size Testing */}
          <YStack gap="$3">
            <H3>Size Variations</H3>
            <XStack gap="$2" flexWrap="wrap" ai="center">
              <EnhancedAnimatedButton variant="primary" size="$2">
                XS
              </EnhancedAnimatedButton>
              <EnhancedAnimatedButton variant="primary" size="$3">
                Small
              </EnhancedAnimatedButton>
              <EnhancedAnimatedButton variant="primary" size="$4">
                Medium
              </EnhancedAnimatedButton>
              <EnhancedAnimatedButton variant="primary" size="$5">
                Large
              </EnhancedAnimatedButton>
              <EnhancedAnimatedButton variant="primary" size="$6">
                XL
              </EnhancedAnimatedButton>
            </XStack>
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
              <LoadingButton
                variant="bouncy"
                loading={uatLoadingStates['loading-bouncy']}
                loadingText="Syncing..."
                onPress={() => toggleUATLoading('loading-bouncy')}
              >
                Bouncy Loading
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
              <SuccessButton
                variant="bump"
                showSuccess={uatSuccessStates['success-bump']}
                successIcon={<Star />}
                onPress={() => toggleUATSuccess('success-bump')}
              >
                Rate Item
              </SuccessButton>
            </XStack>
          </YStack>

          {/* Buttons with Icons */}
          <YStack gap="$3">
            <H3>Buttons with Icons</H3>
            <XStack gap="$2" flexWrap="wrap" ai="center">
              <EnhancedAnimatedButton variant="primary">
                <Download size={16} />
                Download
              </EnhancedAnimatedButton>
              <EnhancedAnimatedButton variant="secondary">
                <Upload size={16} />
                Upload
              </EnhancedAnimatedButton>
              <EnhancedAnimatedButton variant="pulse">
                <Send size={16} />
                Send
              </EnhancedAnimatedButton>
              <EnhancedAnimatedButton variant="bouncy">
                <Save size={16} />
                Save
              </EnhancedAnimatedButton>
              <EnhancedAnimatedButton variant="success">
                <Check size={16} />
                Complete
              </EnhancedAnimatedButton>
            </XStack>
          </YStack>

          {/* Theme Integration */}
          <YStack gap="$3">
            <H3>Theme Integration</H3>
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
          </YStack>

          {/* Animation Presets */}
          <YStack gap="$3">
            <H3>Animation Presets</H3>
            <XStack gap="$2" flexWrap="wrap" ai="center">
              <EnhancedAnimatedButton variant="primary" animationPreset="quick">
                Quick
              </EnhancedAnimatedButton>
              <EnhancedAnimatedButton variant="primary" animationPreset="medium">
                Medium
              </EnhancedAnimatedButton>
              <EnhancedAnimatedButton variant="primary" animationPreset="slow">
                Slow
              </EnhancedAnimatedButton>
              <EnhancedAnimatedButton variant="primary" animationPreset="bouncy">
                Bouncy
              </EnhancedAnimatedButton>
              <EnhancedAnimatedButton variant="primary" animationPreset="100ms">
                100ms
              </EnhancedAnimatedButton>
            </XStack>
          </YStack>

          {/* Disabled States */}
          <YStack gap="$3">
            <H3>Disabled States</H3>
            <XStack gap="$2" flexWrap="wrap" ai="center">
              <EnhancedAnimatedButton variant="primary" disabled>
                Disabled Primary
              </EnhancedAnimatedButton>
              <EnhancedAnimatedButton variant="secondary" disabled>
                Disabled Secondary
              </EnhancedAnimatedButton>
              <EnhancedAnimatedButton variant="pulse" disabled>
                Disabled Pulse
              </EnhancedAnimatedButton>
              <LoadingButton loading disabled>
                Disabled Loading
              </LoadingButton>
            </XStack>
          </YStack>

          {/* Complex Combinations */}
          <YStack gap="$3">
            <H3>Complex Combinations</H3>
            <XStack gap="$2" flexWrap="wrap" ai="center">
              <LoadingButton
                variant="bouncy"
                size="$5"
                theme="green"
                loading={uatLoadingStates['complex-1']}
                loadingText="Processing..."
                onPress={() => toggleUATLoading('complex-1')}
              >
                <Save size={20} />
                Large Green Bouncy
              </LoadingButton>

              <SuccessButton
                variant="bump"
                size="$3"
                theme="purple"
                animationPreset="slow"
                showSuccess={uatSuccessStates['complex-2']}
                successIcon={<Heart />}
                onPress={() => toggleUATSuccess('complex-2')}
              >
                <Heart size={14} />
                Small Purple Bump
              </SuccessButton>

              <EnhancedAnimatedButton
                variant="lazy"
                size="$6"
                theme="orange"
                animationPreset="medium"
              >
                <Star size={24} />
                XL Orange Lazy
              </EnhancedAnimatedButton>
            </XStack>
          </YStack>

          {/* UAT Checklist */}
          <YStack gap="$2" p="$4" backgroundColor="$green2" borderRadius="$6">
            <Text fontWeight="700" size="$4" color="$green11">
              ✅ UAT Testing Checklist
            </Text>
            <YStack gap="$1">
              <Text size="$3" color="$green11">
                <Text fontWeight="600">Visual:</Text> All variants display correctly, consistent
                spacing, proper theming
              </Text>
              <Text size="$3" color="$green11">
                <Text fontWeight="600">Interactions:</Text> Press animations feel responsive, hover
                states work on web
              </Text>
              <Text size="$3" color="$green11">
                <Text fontWeight="600">Loading:</Text> Spinners appear/disappear smoothly, text
                changes appropriately
              </Text>
              <Text size="$3" color="$green11">
                <Text fontWeight="600">Success:</Text> Icons center properly, text fades out,
                animations complete
              </Text>
              <Text size="$3" color="$green11">
                <Text fontWeight="600">Cross-platform:</Text> Consistent behavior on web and mobile
              </Text>
              <Text size="$3" color="$green11">
                <Text fontWeight="600">Performance:</Text> No stuttering, smooth 60fps animations
              </Text>
              <Text size="$3" color="$green11">
                <Text fontWeight="600">Accessibility:</Text> Focus states, screen reader
                compatibility
              </Text>
            </YStack>
          </YStack>
        </Card>

        {/* CheckboxToggle Cleanup Complete */}
        <Card p="$4" gap="$4" borderColor="$green7" borderWidth={2}>
          <YStack gap="$2">
            <H2 color="$green11">✅ CheckboxToggle Component Elevation Complete</H2>
            <Paragraph size="$3" color="$green11">
              Successfully elevated bento checkbox and switch patterns to core CheckboxToggle
              component. Deprecated components have been cleaned up.
            </Paragraph>
          </YStack>

          <YStack gap="$4">
            <YStack gap="$2">
              <H3>🗑️ Cleaned Up Bento Components</H3>
              <Text color="$gray11" size="$2">
                ✅ CheckboxCards.tsx - Replaced by CheckboxToggle card variant{'\n'}✅
                CheckboxList.tsx - Replaced by CheckboxToggle variants{'\n'}✅ GroupedCheckbox.tsx -
                Replaced by CheckboxToggle variants{'\n'}✅ HorizontalCheckboxes.tsx - Replaced by
                CheckboxToggle variants{'\n'}✅ HorizontalWithDescriptionCheckboxes.tsx - Replaced
                by CheckboxToggle card variant{'\n'}✅ VerticalWithDescriptionCheckboxes.tsx -
                Replaced by CheckboxToggle card variant{'\n'}✅ SwitchCustomIcons.tsx - Replaced by
                CheckboxToggle toggle variant with icons{'\n'}✅ IconTitleSwitch.tsx - Replaced by
                CheckboxToggle toggle variant{'\n'}✅ DisabledSwitch.tsx - Replaced by
                CheckboxToggle toggle variant with disabled prop
              </Text>
            </YStack>

            <YStack gap="$2">
              <H3>📦 New Unified CheckboxToggle Component</H3>
              <Text color="$gray11" size="$2">
                • CheckboxToggle - Unified component with 4 variants (checkbox, toggle, card,
                minimal){'\n'}• Enhanced animations with 5 presets (quick, medium, slow, bouncy,
                100ms){'\n'}• Custom icon support for both checked/unchecked states{'\n'}• Complete
                state management (error, disabled, required, optional){'\n'}• Cross-platform
                compatibility (web and mobile){'\n'}• Theme integration with all Tamagui themes
                {'\n'}• Proper sizing (16px-24px checkboxes, scaled toggles){'\n'}• Keyboard
                navigation and accessibility support
              </Text>
            </YStack>

            <YStack gap="$2">
              <H3>🔄 Migration Examples</H3>
              <Text color="$gray11" size="$2">
                • SignUpTwoSide.tsx - Successfully migrated from bento Checkboxes to CheckboxToggle
                cards{'\n'}• All bento checkbox patterns now available as CheckboxToggle variants
                {'\n'}• All bento switch patterns now available as CheckboxToggle toggle variant
              </Text>
            </YStack>
          </YStack>

          <YStack gap="$2" p="$3" backgroundColor="$green2" borderRadius="$4">
            <Text fontWeight="600" size="$3" color="$green11">
              🎯 Next Component Candidates
            </Text>
            <Text size="$2" color="$green11">
              • Form Inputs (bento/forms/inputs) - High priority, complex validation patterns{'\n'}•
              Data Tables (bento/elements/tables) - Complex, high value for data display{'\n'}•
              Avatar Components (bento/elements/avatars) - Medium priority, good patterns{'\n'}•
              Navigation Components (bento/shells) - Layout and navigation improvements
            </Text>
          </YStack>
        </Card>

        {/* Button Cleanup Complete (Previous) */}
        <Card p="$4" gap="$4" borderColor="$blue7" borderWidth={2}>
          <YStack gap="$2">
            <H2 color="$blue11">✅ Button Component Elevation Complete (Previous)</H2>
            <Paragraph size="$3" color="$blue11">
              Previously elevated bento button patterns to core AnimatedButton components.
            </Paragraph>
          </YStack>

          <YStack gap="$4">
            <YStack gap="$2">
              <H3>🗑️ Cleaned Up Components</H3>
              <Text color="$gray11" size="$2">
                ✅ ButtonLoading.tsx - Replaced by LoadingButton{'\n'}✅ ButtonPulse.tsx -
                Integrated into EnhancedAnimatedButton variants{'\n'}✅ IconCenterButton.tsx -
                Replaced by SuccessButton
              </Text>
            </YStack>

            <YStack gap="$2">
              <H3>📦 Core Components</H3>
              <Text color="$gray11" size="$2">
                • EnhancedAnimatedButton - Main component with all animation variants{'\n'}•
                LoadingButton - Clean API for loading states{'\n'}• SuccessButton - Icon centering
                success animations{'\n'}• AnimatedButton - Legacy component (preserved for
                compatibility)
              </Text>
            </YStack>
          </YStack>
        </Card>

        {/* Enhanced TextField UAT Testing Section */}
        <Card p="$4" gap="$6" borderColor="$green7" borderWidth={2}>
          <YStack gap="$3">
            <H2 color="$green11">🧪 Enhanced TextField UAT Testing</H2>
            <Paragraph size="$3" color="$green11">
              Complete testing matrix for enhanced text field components with bento-inspired
              patterns. Test all variants, icons, states, and integrations.
            </Paragraph>
          </YStack>

          {/* Basic Enhanced TextField Variants */}
          <YStack gap="$3">
            <H3>Basic Enhanced TextField</H3>
            <YStack gap="$3">
              <EnhancedTextField
                placeholder="Basic enhanced text field"
                helperText="This is a basic enhanced text field with helper text"
              />
              <EnhancedTextField
                placeholder="With character counting"
                showCharacterCount
                helperText="Try typing to see character count"
              />
              <EnhancedTextField
                placeholder="Disabled enhancements (legacy mode)"
                disableEnhancements
                helperText="This should look like the original TextField"
              />
            </YStack>
          </YStack>

          {/* Icon Variations */}
          <YStack gap="$3">
            <H3>Icon Variations</H3>
            <YStack gap="$3">
              <IconTextField icon={<User />} placeholder="Username" helperText="Left icon input" />
              <IconTextField
                icon={<Mail />}
                iconPosition="right"
                placeholder="Email address"
                helperText="Right icon input"
              />
              <IconTextField
                icon={<User />}
                rightIcon={<Info />}
                iconPosition="both"
                placeholder="Username with info"
                helperText="Icons on both sides"
              />
            </YStack>
          </YStack>

          {/* Error States */}
          <YStack gap="$3">
            <H3>Error States</H3>
            <YStack gap="$3">
              <EnhancedTextField
                placeholder="Error state demonstration"
                helperText="Error states work automatically with form validation (ts-form integration)"
                showErrorIcon
              />
              <Text size="$2" color="$gray11">
                Note: Error states are automatically handled when used with ts-form or
                react-hook-form integration. The enhanced text field will show error icons and
                styling based on validation context.
              </Text>
            </YStack>
          </YStack>

          {/* Specialized Components */}
          <YStack gap="$3">
            <H3>Specialized Components</H3>
            <YStack gap="$3">
              <HelperTextField
                placeholder="Email address"
                helperText="We'll never share your email with anyone else"
                icon={<Mail />}
              />
              <CountingTextField
                placeholder="Short description (max 100 chars)"
                helperText="Keep it brief and descriptive"
                maxLength={100}
              />
              <View>
                <IconTextField
                  icon={<Lock />}
                  rightIcon={
                    <View
                      onPress={() => setShowPassword(!showPassword)}
                      cursor="pointer"
                      padding="$1"
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </View>
                  }
                  iconPosition="both"
                  placeholder="Password"
                  secureTextEntry={!showPassword}
                  helperText="Click eye icon to toggle visibility"
                />
              </View>
            </YStack>
          </YStack>

          {/* Size Variations */}
          <YStack gap="$3">
            <H3>Size Variations</H3>
            <YStack gap="$3">
              <IconTextField
                icon={<User />}
                placeholder="Small size"
                size="$2"
                helperText="Size $2"
              />
              <IconTextField
                icon={<User />}
                placeholder="Medium size"
                size="$3"
                helperText="Size $3"
              />
              <IconTextField
                icon={<User />}
                placeholder="Default size"
                size="$4"
                helperText="Size $4 (default)"
              />
              <IconTextField
                icon={<User />}
                placeholder="Large size"
                size="$5"
                helperText="Size $5"
              />
            </YStack>
          </YStack>

          {/* Complex Examples */}
          <YStack gap="$3">
            <H3>Complex Real-World Examples</H3>
            <YStack gap="$3">
              <IconTextField
                icon={<User />}
                placeholder="John Doe"
                helperText="Enter your full name as it appears on official documents"
                showCharacterCount
              />
              <IconTextField
                icon={<Mail />}
                placeholder="john@example.com"
                helperText="We'll send a confirmation email to this address"
                rightIcon={<AlertCircle />}
                iconPosition="both"
              />
              <IconTextField
                icon={<MapPin />}
                placeholder="123 Main St, City, State 12345"
                helperText="Your billing address for payment processing"
                showCharacterCount
              />
            </YStack>
          </YStack>

          {/* Legacy Comparison */}
          <YStack gap="$3">
            <H3>Legacy vs Enhanced Comparison</H3>
            <XStack gap="$4" $sm={{ flexDirection: 'column' }}>
              <YStack gap="$2" flex={1}>
                <Text fontWeight="600" size="$3">
                  Legacy TextField
                </Text>
                <Input placeholder="Legacy input field" />
                <Text size="$2" color="$gray11">
                  Basic Tamagui Input
                </Text>
              </YStack>
              <YStack gap="$2" flex={1}>
                <Text fontWeight="600" size="$3">
                  Enhanced TextField
                </Text>
                <IconTextField
                  icon={<User />}
                  placeholder="Enhanced input field"
                  helperText="With icon and helper text"
                />
                <Text size="$2" color="$gray11">
                  Bento-enhanced with icons
                </Text>
              </YStack>
            </XStack>
          </YStack>

          {/* UAT Checklist */}
          <YStack gap="$2" p="$4" backgroundColor="$blue2" borderRadius="$6">
            <Text fontWeight="700" size="$4" color="$blue11">
              ✅ TextField UAT Testing Checklist
            </Text>
            <YStack gap="$1">
              <Text size="$3" color="$blue11">
                <Text fontWeight="600">Visual:</Text> Icons scale properly, consistent spacing,
                proper theming
              </Text>
              <Text size="$3" color="$blue11">
                <Text fontWeight="600">Functionality:</Text> Focus management, icon clicks, helper
                text display
              </Text>
              <Text size="$3" color="$blue11">
                <Text fontWeight="600">Error States:</Text> Error icons appear, helper text updates,
                validation works
              </Text>
              <Text size="$3" color="$blue11">
                <Text fontWeight="600">Character Count:</Text> Updates in real-time, validates
                against maxLength
              </Text>
              <Text size="$3" color="$blue11">
                <Text fontWeight="600">Cross-platform:</Text> Consistent behavior on web and mobile
              </Text>
              <Text size="$3" color="$blue11">
                <Text fontWeight="600">Integration:</Text> Works with existing forms and validation
              </Text>
              <Text size="$3" color="$blue11">
                <Text fontWeight="600">Accessibility:</Text> Proper labels, focus states, screen
                reader support
              </Text>
            </YStack>
          </YStack>
        </Card>

        {/* Form Controls */}
        <Card p="$4" gap="$4">
          <H2>Form Controls</H2>

          <YStack gap="$4">
            <YStack gap="$3">
              <H3>Input Fields</H3>
              <YStack gap="$3">
                <Input placeholder="Regular input field" />
                <Input placeholder="Input with icon" />
                <TextArea placeholder="Text area for longer content..." minHeight={100} />
              </YStack>
            </YStack>

            <YStack gap="$3">
              <H3>Selection Controls</H3>
              <YStack gap="$3">
                <XStack ai="center" gap="$3">
                  <Switch checked={switchValue} onCheckedChange={setSwitchValue} />
                  <Text>Switch Control</Text>
                </XStack>

                <XStack ai="center" gap="$3">
                  <Checkbox checked={checkboxValue} onCheckedChange={setCheckboxValue} />
                  <Text>Checkbox Control</Text>
                </XStack>

                <RadioGroup value={radioValue} onValueChange={setRadioValue}>
                  <XStack ai="center" gap="$3">
                    <RadioGroup.Item value="option1" id="option1">
                      <RadioGroup.Indicator />
                    </RadioGroup.Item>
                    <Text htmlFor="option1">Radio Option 1</Text>
                  </XStack>
                  <XStack ai="center" gap="$3">
                    <RadioGroup.Item value="option2" id="option2">
                      <RadioGroup.Indicator />
                    </RadioGroup.Item>
                    <Text htmlFor="option2">Radio Option 2</Text>
                  </XStack>
                </RadioGroup>
              </YStack>
            </YStack>

            <YStack gap="$3">
              <H3>Sliders and Progress</H3>
              <YStack gap="$3">
                <YStack gap="$2">
                  <Text>Slider: {sliderValue[0]}</Text>
                  <Slider value={sliderValue} onValueChange={setSliderValue} max={100} step={1}>
                    <Slider.Track>
                      <Slider.TrackActive />
                    </Slider.Track>
                    <Slider.Thumb circular index={0} />
                  </Slider>
                </YStack>

                <YStack gap="$2">
                  <Text>Progress: {progressValue}%</Text>
                  <Progress value={progressValue}>
                    <Progress.Indicator animation="bouncy" />
                  </Progress>
                </YStack>
              </YStack>
            </YStack>
          </YStack>
        </Card>

        {/* Text Input Testing */}
        <Card p="$4" gap="$4" borderColor="$orange7" borderWidth={2}>
          <YStack gap="$3">
            <H2 color="$orange11">🔧 Text Input Testing - Controlled vs Uncontrolled Fix</H2>
            <Paragraph size="$3" color="$orange11">
              Testing text inputs to ensure they work correctly in both standalone and form
              contexts. This should fix the "can't type" issue.
            </Paragraph>
          </YStack>

          <YStack gap="$4">
            <YStack gap="$3">
              <H3>Standalone Text Inputs (Non-Form Context)</H3>
              <YStack gap="$3" p="$3" backgroundColor="$color2" borderRadius="$4">
                <EnhancedTextField
                  label="Basic Text Input"
                  placeholder="Type something here..."
                  value={textInputStates['standalone-basic']}
                  onChangeText={(text) => updateTextInput('standalone-basic', text)}
                />
                <EnhancedTextField
                  label="Input with Icon"
                  placeholder="Search..."
                  icon={<Search size={16} />}
                  value={textInputStates['standalone-with-icon']}
                  onChangeText={(text) => updateTextInput('standalone-with-icon', text)}
                />
                <EnhancedTextField
                  label="Error State"
                  placeholder="This has an error"
                  error="This field is required"
                  value={textInputStates['standalone-error']}
                  onChangeText={(text) => updateTextInput('standalone-error', text)}
                />
                <EnhancedTextField
                  label="Disabled Input"
                  placeholder="Cannot edit this"
                  disabled
                  value={textInputStates['standalone-disabled']}
                  onChangeText={(text) => updateTextInput('standalone-disabled', text)}
                />
              </YStack>
            </YStack>

            <YStack gap="$3">
              <H3>Basic Tamagui Inputs (For Comparison)</H3>
              <YStack gap="$3" p="$3" backgroundColor="$color2" borderRadius="$4">
                <YStack gap="$2">
                  <Text fontWeight="600">Basic Input</Text>
                  <Input placeholder="Regular Tamagui input" />
                </YStack>
                <YStack gap="$2">
                  <Text fontWeight="600">TextArea</Text>
                  <TextArea placeholder="Regular Tamagui textarea" minHeight={100} />
                </YStack>
              </YStack>
            </YStack>

            <YStack gap="$3">
              <H3>Current Values (Debug Info)</H3>
              <YStack gap="$2" p="$3" backgroundColor="$gray2" borderRadius="$4">
                <Text size="$2" fontFamily="$mono">
                  standalone-basic: "{textInputStates['standalone-basic']}" (length:{' '}
                  {textInputStates['standalone-basic'].length})
                </Text>
                <Text size="$2" fontFamily="$mono">
                  standalone-with-icon: "{textInputStates['standalone-with-icon']}" (length:{' '}
                  {textInputStates['standalone-with-icon'].length})
                </Text>
                <Text size="$2" fontFamily="$mono">
                  standalone-error: "{textInputStates['standalone-error']}" (length:{' '}
                  {textInputStates['standalone-error'].length})
                </Text>
                <Text size="$2" fontFamily="$mono">
                  standalone-disabled: "{textInputStates['standalone-disabled']}" (length:{' '}
                  {textInputStates['standalone-disabled'].length})
                </Text>
                <Text size="$2" color="$green10" fontWeight="600">
                  ✅ Fix Applied: Removed optional chaining from field.onChange calls
                </Text>
              </YStack>
            </YStack>
          </YStack>

          <YStack gap="$2" p="$4" backgroundColor="$orange2" borderRadius="$6">
            <Text fontWeight="700" size="$4" color="$orange11">
              ✅ Text Input Fix Checklist
            </Text>
            <YStack gap="$1">
              <Text size="$3" color="$orange11">
                <Text fontWeight="600">Typing Works:</Text> Can type in all standalone text inputs
              </Text>
              <Text size="$3" color="$orange11">
                <Text fontWeight="600">State Updates:</Text> Values update correctly in debug info
              </Text>
              <Text size="$3" color="$orange11">
                <Text fontWeight="600">Icons Display:</Text> Search icon shows properly
              </Text>
              <Text size="$3" color="$orange11">
                <Text fontWeight="600">Error States:</Text> Error styling and messages appear
              </Text>
              <Text size="$3" color="$orange11">
                <Text fontWeight="600">Disabled State:</Text> Disabled input cannot be edited
              </Text>
              <Text size="$3" color="$orange11">
                <Text fontWeight="600">Comparison:</Text> Basic Tamagui inputs work as expected
              </Text>
            </YStack>
          </YStack>
        </Card>

        {/* Enhanced CheckboxToggle Component UAT Testing */}
        <Card p="$4" gap="$6" borderColor="$purple7" borderWidth={2}>
          <YStack gap="$3">
            <H2 color="$purple11">🧪 CheckboxToggle Component - Comprehensive UAT Testing</H2>
            <Paragraph size="$3" color="$purple11">
              Unified checkbox and toggle component with multiple variants, enhanced animations, and
              bento-inspired patterns. Test all combinations of variants, states, sizes, and
              features.
            </Paragraph>
          </YStack>

          {/* Checkbox Variant Testing */}
          <YStack gap="$4">
            <H3>Checkbox Variant</H3>

            <YStack gap="$3">
              <Text fontWeight="600" size="$3">
                Basic Checkbox States
              </Text>
              <YStack gap="$3" p="$3" backgroundColor="$color2" borderRadius="$4">
                <CheckboxToggle
                  variant="checkbox"
                  label="Basic Checkbox"
                  checked={checkboxToggleStates['checkbox-basic']}
                  onCheckedChange={() => toggleCheckboxToggle('checkbox-basic')}
                />
                <CheckboxToggle
                  variant="checkbox"
                  label="Required Field"
                  required
                  checked={checkboxToggleStates['checkbox-required']}
                  onCheckedChange={() => toggleCheckboxToggle('checkbox-required')}
                />
                <CheckboxToggle
                  variant="checkbox"
                  label="Optional Field"
                  optional
                  checked={checkboxToggleStates['checkbox-optional']}
                  onCheckedChange={() => toggleCheckboxToggle('checkbox-optional')}
                />
                <CheckboxToggle
                  variant="checkbox"
                  label="Error State"
                  error
                  checked={checkboxToggleStates['checkbox-error']}
                  onCheckedChange={() => toggleCheckboxToggle('checkbox-error')}
                />
                <CheckboxToggle variant="checkbox" label="Disabled State" disabled checked={true} />
              </YStack>
            </YStack>

            <YStack gap="$3">
              <Text fontWeight="600" size="$3">
                Checkbox Sizes & Animation Presets
              </Text>
              <XStack gap="$3" flexWrap="wrap" p="$3" backgroundColor="$color2" borderRadius="$4">
                <CheckboxToggle
                  variant="checkbox"
                  size="$2"
                  label="Small"
                  animationPreset="quick"
                  checked={checkboxToggleStates['checkbox-small'] || false}
                  onCheckedChange={() => toggleCheckboxToggle('checkbox-small')}
                />
                <CheckboxToggle
                  variant="checkbox"
                  size="$4"
                  label="Medium"
                  animationPreset="medium"
                  checked={checkboxToggleStates['checkbox-medium'] || false}
                  onCheckedChange={() => toggleCheckboxToggle('checkbox-medium')}
                />
                <CheckboxToggle
                  variant="checkbox"
                  size="$6"
                  label="Large"
                  animationPreset="bouncy"
                  checked={checkboxToggleStates['checkbox-large'] || false}
                  onCheckedChange={() => toggleCheckboxToggle('checkbox-large')}
                />
              </XStack>
            </YStack>

            <YStack gap="$3">
              <Text fontWeight="600" size="$3">
                Custom Icons
              </Text>
              <XStack gap="$4" flexWrap="wrap" p="$3" backgroundColor="$color2" borderRadius="$4">
                <CheckboxToggle
                  variant="checkbox"
                  label="Heart Icon"
                  checkedIcon={<Heart size={16} />}
                  checked={checkboxToggleStates['checkbox-heart'] || false}
                  onCheckedChange={() => toggleCheckboxToggle('checkbox-heart')}
                />
                <CheckboxToggle
                  variant="checkbox"
                  label="Star Icon"
                  checkedIcon={<Star size={16} />}
                  checked={checkboxToggleStates['checkbox-star'] || false}
                  onCheckedChange={() => toggleCheckboxToggle('checkbox-star')}
                />
              </XStack>
            </YStack>
          </YStack>

          {/* Toggle Variant Testing */}
          <YStack gap="$4">
            <H3>Toggle/Switch Variant</H3>

            <YStack gap="$3">
              <Text fontWeight="600" size="$3">
                Basic Toggle States
              </Text>
              <YStack gap="$3" p="$3" backgroundColor="$color2" borderRadius="$4">
                <CheckboxToggle
                  variant="toggle"
                  label="Basic Toggle"
                  checked={checkboxToggleStates['toggle-basic']}
                  onCheckedChange={() => toggleCheckboxToggle('toggle-basic')}
                />
                <CheckboxToggle
                  variant="toggle"
                  label="Toggle with Icons"
                  checkedIcon={<Check size={10} />}
                  uncheckedIcon={<X size={10} />}
                  checked={checkboxToggleStates['toggle-icons']}
                  onCheckedChange={() => toggleCheckboxToggle('toggle-icons')}
                />
                <CheckboxToggle
                  variant="toggle"
                  label="Error State"
                  error
                  checked={checkboxToggleStates['toggle-error']}
                  onCheckedChange={() => toggleCheckboxToggle('toggle-error')}
                />
                <CheckboxToggle variant="toggle" label="Disabled State" disabled checked={true} />
              </YStack>
            </YStack>

            <YStack gap="$3">
              <Text fontWeight="600" size="$3">
                Switch with Icons Examples
              </Text>
              <YStack gap="$3" p="$3" backgroundColor="$color2" borderRadius="$4">
                <CheckboxToggle
                  variant="toggle"
                  label="On/Off Switch"
                  checkedIcon={<Check size={10} />}
                  uncheckedIcon={<X size={10} />}
                  checked={checkboxToggleStates['toggle-onoff'] || false}
                  onCheckedChange={() => toggleCheckboxToggle('toggle-onoff')}
                />
                <CheckboxToggle
                  variant="toggle"
                  label="Notifications"
                  checkedIcon={<Bell size={10} />}
                  uncheckedIcon={<Bell size={10} />}
                  checked={checkboxToggleStates['toggle-notifications'] || false}
                  onCheckedChange={() => toggleCheckboxToggle('toggle-notifications')}
                />
                <CheckboxToggle
                  variant="toggle"
                  label="Dark Mode"
                  checkedIcon={<Star size={10} />}
                  uncheckedIcon={<Star size={10} />}
                  checked={checkboxToggleStates['toggle-darkmode'] || false}
                  onCheckedChange={() => toggleCheckboxToggle('toggle-darkmode')}
                />
                <CheckboxToggle
                  variant="toggle"
                  label="Heart/Star Toggle"
                  checkedIcon={<Heart size={10} />}
                  uncheckedIcon={<Star size={10} />}
                  checked={checkboxToggleStates['toggle-hearstar'] || false}
                  onCheckedChange={() => toggleCheckboxToggle('toggle-hearstar')}
                />
              </YStack>
            </YStack>

            <YStack gap="$3">
              <Text fontWeight="600" size="$3">
                Toggle Sizes & Animations
              </Text>
              <XStack
                gap="$4"
                flexWrap="wrap"
                ai="center"
                p="$3"
                backgroundColor="$color2"
                borderRadius="$4"
              >
                <CheckboxToggle
                  variant="toggle"
                  size="$2"
                  label="Small"
                  animationPreset="quick"
                  checked={checkboxToggleStates['toggle-small'] || false}
                  onCheckedChange={() => toggleCheckboxToggle('toggle-small')}
                />
                <CheckboxToggle
                  variant="toggle"
                  size="$4"
                  label="Medium"
                  animationPreset="bouncy"
                  checked={checkboxToggleStates['toggle-medium'] || false}
                  onCheckedChange={() => toggleCheckboxToggle('toggle-medium')}
                />
                <CheckboxToggle
                  variant="toggle"
                  size="$6"
                  label="Large"
                  animationPreset="slow"
                  checked={checkboxToggleStates['toggle-large'] || false}
                  onCheckedChange={() => toggleCheckboxToggle('toggle-large')}
                />
              </XStack>
            </YStack>
          </YStack>

          {/* Card Variant Testing */}
          <YStack gap="$4">
            <H3>Card Variant</H3>

            <YStack gap="$3">
              <Text fontWeight="600" size="$3">
                Card Layouts
              </Text>
              <XStack gap="$3" flexWrap="wrap">
                <CheckboxToggle
                  variant="card"
                  label="Basic Card"
                  description="Click anywhere on this card to toggle"
                  checked={checkboxToggleStates['card-basic']}
                  onCheckedChange={() => toggleCheckboxToggle('card-basic')}
                  width={200}
                />
                <CheckboxToggle
                  variant="card"
                  label="Detailed Card"
                  description="This card has more detailed description text to test text wrapping and layout"
                  checked={checkboxToggleStates['card-with-desc']}
                  onCheckedChange={() => toggleCheckboxToggle('card-with-desc')}
                  width={220}
                />
                <CheckboxToggle
                  variant="card"
                  label="Error Card"
                  description="This card shows error styling"
                  error
                  checked={checkboxToggleStates['card-error']}
                  onCheckedChange={() => toggleCheckboxToggle('card-error')}
                  width={200}
                />
              </XStack>
            </YStack>

            <YStack gap="$3">
              <Text fontWeight="600" size="$3">
                Card Sizes
              </Text>
              <XStack gap="$3" flexWrap="wrap">
                <CheckboxToggle
                  variant="card"
                  size="$2"
                  label="Small Card"
                  description="Compact card layout"
                  checked={checkboxToggleStates['card-small'] || false}
                  onCheckedChange={() => toggleCheckboxToggle('card-small')}
                  width={180}
                />
                <CheckboxToggle
                  variant="card"
                  size="$6"
                  label="Large Card"
                  description="Spacious card layout with more padding"
                  checked={checkboxToggleStates['card-large'] || false}
                  onCheckedChange={() => toggleCheckboxToggle('card-large')}
                  width={240}
                />
              </XStack>
            </YStack>
          </YStack>

          {/* Minimal Variant Testing */}
          <YStack gap="$4">
            <H3>Minimal Variant</H3>

            <YStack gap="$3">
              <Text fontWeight="600" size="$3">
                Minimal Layouts
              </Text>
              <YStack gap="$3" p="$3" backgroundColor="$color2" borderRadius="$4">
                <CheckboxToggle
                  variant="minimal"
                  label="Minimal Checkbox"
                  checked={checkboxToggleStates['minimal-basic']}
                  onCheckedChange={() => toggleCheckboxToggle('minimal-basic')}
                />
                <CheckboxToggle
                  variant="minimal"
                  label="Required Field"
                  required
                  checked={checkboxToggleStates['minimal-required']}
                  onCheckedChange={() => toggleCheckboxToggle('minimal-required')}
                />
                <CheckboxToggle
                  variant="minimal"
                  label="Custom Icon"
                  checkedIcon={<Star size={12} />}
                  checked={checkboxToggleStates['minimal-star'] || false}
                  onCheckedChange={() => toggleCheckboxToggle('minimal-star')}
                />
                <CheckboxToggle variant="minimal" label="Disabled State" disabled checked={true} />
              </YStack>
            </YStack>
          </YStack>

          {/* Theme Integration Testing */}
          <YStack gap="$4">
            <H3>Theme Integration</H3>
            <XStack gap="$3" flexWrap="wrap">
              <Theme name="blue">
                <CheckboxToggle
                  variant="checkbox"
                  label="Blue Theme"
                  checked={checkboxToggleStates['theme-blue'] || false}
                  onCheckedChange={() => toggleCheckboxToggle('theme-blue')}
                />
              </Theme>
              <Theme name="green">
                <CheckboxToggle
                  variant="toggle"
                  label="Green Theme"
                  checked={checkboxToggleStates['theme-green'] || false}
                  onCheckedChange={() => toggleCheckboxToggle('theme-green')}
                />
              </Theme>
              <Theme name="red">
                <CheckboxToggle
                  variant="card"
                  label="Red Theme"
                  description="Themed card variant"
                  checked={checkboxToggleStates['theme-red'] || false}
                  onCheckedChange={() => toggleCheckboxToggle('theme-red')}
                  width={180}
                />
              </Theme>
              <Theme name="purple">
                <CheckboxToggle
                  variant="minimal"
                  label="Purple Theme"
                  checked={checkboxToggleStates['theme-purple'] || false}
                  onCheckedChange={() => toggleCheckboxToggle('theme-purple')}
                />
              </Theme>
            </XStack>
          </YStack>

          {/* Animation Showcase */}
          <YStack gap="$4">
            <H3>Animation Presets Showcase</H3>
            <XStack gap="$3" flexWrap="wrap" ai="center">
              <CheckboxToggle
                variant="checkbox"
                label="Quick"
                animationPreset="quick"
                checked={checkboxToggleStates['anim-quick'] || false}
                onCheckedChange={() => toggleCheckboxToggle('anim-quick')}
              />
              <CheckboxToggle
                variant="toggle"
                label="Medium"
                animationPreset="medium"
                checked={checkboxToggleStates['anim-medium'] || false}
                onCheckedChange={() => toggleCheckboxToggle('anim-medium')}
              />
              <CheckboxToggle
                variant="checkbox"
                label="Slow"
                animationPreset="slow"
                checked={checkboxToggleStates['anim-slow'] || false}
                onCheckedChange={() => toggleCheckboxToggle('anim-slow')}
              />
              <CheckboxToggle
                variant="toggle"
                label="Bouncy"
                animationPreset="bouncy"
                checked={checkboxToggleStates['anim-bouncy'] || false}
                onCheckedChange={() => toggleCheckboxToggle('anim-bouncy')}
              />
              <CheckboxToggle
                variant="minimal"
                label="100ms"
                animationPreset="100ms"
                checked={checkboxToggleStates['anim-100ms'] || false}
                onCheckedChange={() => toggleCheckboxToggle('anim-100ms')}
              />
            </XStack>
          </YStack>

          {/* UAT Checklist */}
          <YStack gap="$2" p="$4" backgroundColor="$purple2" borderRadius="$6">
            <Text fontWeight="700" size="$4" color="$purple11">
              ✅ CheckboxToggle UAT Testing Checklist
            </Text>
            <YStack gap="$1">
              <Text size="$3" color="$purple11">
                <Text fontWeight="600">Visual:</Text> All variants render correctly, consistent
                spacing, proper theming
              </Text>
              <Text size="$3" color="$purple11">
                <Text fontWeight="600">Interactions:</Text> Click/tap to toggle works, keyboard
                navigation (Tab, Space, Enter)
              </Text>
              <Text size="$3" color="$purple11">
                <Text fontWeight="600">States:</Text> Checked/unchecked, disabled, error,
                required/optional indicators
              </Text>
              <Text size="$3" color="$purple11">
                <Text fontWeight="600">Animations:</Text> Smooth transitions, different presets work
                properly
              </Text>
              <Text size="$3" color="$purple11">
                <Text fontWeight="600">Variants:</Text> Checkbox, toggle, card, minimal all function
                correctly
              </Text>
              <Text size="$3" color="$purple11">
                <Text fontWeight="600">Sizes:</Text> Small, medium, large sizes scale appropriately
              </Text>
              <Text size="$3" color="$purple11">
                <Text fontWeight="600">Icons:</Text> Custom icons display correctly, proper sizing
              </Text>
              <Text size="$3" color="$purple11">
                <Text fontWeight="600">Themes:</Text> Color themes apply correctly across variants
              </Text>
              <Text size="$3" color="$purple11">
                <Text fontWeight="600">Cross-platform:</Text> Consistent behavior on web and mobile
              </Text>
              <Text size="$3" color="$purple11">
                <Text fontWeight="600">Accessibility:</Text> Focus states, ARIA attributes, screen
                reader support
              </Text>
            </YStack>
          </YStack>
        </Card>

        {/* Data Display */}
        <Card p="$4" gap="$4">
          <H2>Data Display</H2>

          <YStack gap="$4">
            <YStack gap="$3">
              <H3>Avatars</H3>
              <XStack gap="$3" ai="center" flexWrap="wrap">
                <Avatar circular size="$3">
                  <Avatar.Image src="https://images.unsplash.com/photo-1548142813-039e6b10a8a9?w=150&h=150&fit=crop&crop=face" />
                  <Avatar.Fallback bc="$blue4" />
                </Avatar>
                <Avatar circular size="$4">
                  <Avatar.Image src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face" />
                  <Avatar.Fallback bc="$green4" />
                </Avatar>
                <Avatar circular size="$5">
                  <Avatar.Image src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face" />
                  <Avatar.Fallback bc="$purple4" />
                </Avatar>
                <Avatar circular size="$3">
                  <Avatar.Fallback bc="$red4">
                    <User />
                  </Avatar.Fallback>
                </Avatar>
              </XStack>
            </YStack>

            <YStack gap="$3">
              <H3>Badges and Status</H3>
              <XStack gap="$3" flexWrap="wrap">
                <View px="$3" py="$1" br="$10" bg="$gray5" borderWidth={1} borderColor="$gray7">
                  <Text size="$2" color="$gray12">
                    Default
                  </Text>
                </View>
                <View
                  px="$3"
                  py="$1"
                  br="$10"
                  bg="$blue5"
                  borderWidth={1}
                  borderColor="$blue7"
                  theme="blue"
                >
                  <Text size="$2" color="$blue12">
                    Primary
                  </Text>
                </View>
                <View
                  px="$3"
                  py="$1"
                  br="$10"
                  bg="$green5"
                  borderWidth={1}
                  borderColor="$green7"
                  theme="green"
                >
                  <Text size="$2" color="$green12">
                    Success
                  </Text>
                </View>
                <View
                  px="$3"
                  py="$1"
                  br="$10"
                  bg="$yellow5"
                  borderWidth={1}
                  borderColor="$yellow7"
                  theme="yellow"
                >
                  <Text size="$2" color="$yellow12">
                    Warning
                  </Text>
                </View>
                <View
                  px="$3"
                  py="$1"
                  br="$10"
                  bg="$red5"
                  borderWidth={1}
                  borderColor="$red7"
                  theme="red"
                >
                  <Text size="$2" color="$red12">
                    Error
                  </Text>
                </View>
              </XStack>
            </YStack>

            <YStack gap="$3">
              <H3>Loading States</H3>
              <XStack gap="$3" ai="center" flexWrap="wrap">
                <Spinner />
                <Spinner theme="blue" />
                <Spinner size="large" />
                <Spinner theme="green" size="small" />
              </XStack>
            </YStack>
          </YStack>
        </Card>

        {/* Table Component */}
        <Card p="$4" gap="$4">
          <H2>Data Tables</H2>
          <YStack gap="$3">
            <H3>Table Components</H3>
            <Text color="$gray11">
              Table components are available in the Bento collection for complex data display. These
              include sortable tables, data grids, and user listings.
            </Text>
          </YStack>
        </Card>

        {/* Interactive Components */}
        <Card p="$4" gap="$4">
          <H2>Interactive Components</H2>

          <YStack gap="$4">
            <YStack gap="$3">
              <H3>Toast Notifications</H3>
              <XStack gap="$3" flexWrap="wrap">
                <Button>Show Toast</Button>
                <Text color="$gray11" size="$3">
                  Toast functionality available via useToastController
                </Text>
              </XStack>
            </YStack>

            <YStack gap="$3">
              <H3>Cards and Containers</H3>
              <XStack gap="$3" flexWrap="wrap">
                <Card p="$4" maw={200}>
                  <YStack gap="$2">
                    <H3>Card Title</H3>
                    <Paragraph>This is a card component with some content inside.</Paragraph>
                    <Button size="$3">Action</Button>
                  </YStack>
                </Card>

                <Card p="$4" maw={200} theme="blue">
                  <YStack gap="$2">
                    <H3>Themed Card</H3>
                    <Paragraph>This card uses a blue theme.</Paragraph>
                    <Button size="$3" theme="blue">
                      Action
                    </Button>
                  </YStack>
                </Card>
              </XStack>
            </YStack>
          </YStack>
        </Card>

        {/* Icons Showcase */}
        <Card p="$4" gap="$4">
          <H2>Icons</H2>
          <YStack gap="$3">
            <H3>Common Icons</H3>
            <XStack gap="$4" flexWrap="wrap">
              {[
                { icon: Heart, name: 'Heart' },
                { icon: Star, name: 'Star' },
                { icon: Home, name: 'Home' },
                { icon: Settings, name: 'Settings' },
                { icon: User, name: 'User' },
                { icon: Mail, name: 'Mail' },
                { icon: Phone, name: 'Phone' },
                { icon: Calendar, name: 'Calendar' },
                { icon: Camera, name: 'Camera' },
                { icon: Download, name: 'Download' },
                { icon: Upload, name: 'Upload' },
                { icon: PenTool, name: 'PenTool' },
                { icon: Trash2, name: 'Trash' },
                { icon: Plus, name: 'Plus' },
                { icon: Minus, name: 'Minus' },
                { icon: Search, name: 'Search' },
                { icon: Filter, name: 'Filter' },
                { icon: Bell, name: 'Bell' },
                { icon: Menu, name: 'Menu' },
              ].map(({ icon: Icon, name }) => (
                <YStack key={name} ai="center" gap="$2" p="$2">
                  <Icon size={24} />
                  <Text size="$2">{name}</Text>
                </YStack>
              ))}
            </XStack>
          </YStack>
        </Card>

        {/* Spacing and Layout */}
        <Card p="$4" gap="$4">
          <H2>Spacing and Layout</H2>
          <YStack gap="$3">
            <H3>Stack Layouts</H3>
            <YStack gap="$3">
              <Text>Vertical Stack (YStack):</Text>
              <YStack gap="$2" p="$3" bg="$gray3" br="$3">
                <View h={40} bg="$blue5" br="$2" />
                <View h={40} bg="$green5" br="$2" />
                <View h={40} bg="$purple5" br="$2" />
              </YStack>

              <Text>Horizontal Stack (XStack):</Text>
              <XStack gap="$2" p="$3" bg="$gray3" br="$3">
                <View w={60} h={40} bg="$blue5" br="$2" />
                <View w={60} h={40} bg="$green5" br="$2" />
                <View w={60} h={40} bg="$purple5" br="$2" />
              </XStack>
            </YStack>
          </YStack>
        </Card>

        {/* Separators */}
        <Card p="$4" gap="$4">
          <H2>Separators</H2>
          <YStack gap="$3">
            <Text>Horizontal Separator</Text>
            <Separator />
            <Text>Vertical Separator (in horizontal layout)</Text>
            <XStack h={60} ai="center" gap="$3">
              <Text>Left content</Text>
              <Separator vertical />
              <Text>Right content</Text>
            </XStack>
          </YStack>
        </Card>

        {/* Footer */}
        <Card p="$4">
          <YStack gap="$2" ai="center">
            <H3>End of Styleguide</H3>
            <Paragraph ta="center" color="$gray11">
              This styleguide showcases the primary components used throughout the application. All
              components are built with Tamagui and work cross-platform.
            </Paragraph>
          </YStack>
        </Card>
      </YStack>
    </ScrollView>
  )
}
