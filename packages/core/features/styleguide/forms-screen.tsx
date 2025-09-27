import React from 'react'
import {
  YStack,
  XStack,
  H1,
  H2,
  H3,
  Text,
  Paragraph,
  Card,
  ScrollView,
  Input,
  TextArea,
  Switch,
  Checkbox,
  RadioGroup,
  Slider,
  Progress,
  View,
  Theme,
} from '@app/ui'

// Import custom components
import {
  EnhancedTextField,
  IconTextField,
  HelperTextField,
  CountingTextField,
} from '@app/ui/src/components/EnhancedTextField'
import { CheckboxToggle } from '@app/ui/src/components/CheckboxToggle'
import { TextField } from '@app/ui/src/components/FormFields/TextField'
import { createTsForm, createUniqueFieldSchema } from '@ts-react/form'
import { z } from 'zod'

// Import icons
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Info,
  Search,
  MapPin,
  AlertCircle,
  Check,
  X,
  Bell,
  Star,
  Heart,
} from '@tamagui/lucide-icons'

/**
 * Forms Section of Styleguide
 * Showcases form controls, inputs, and validation components
 */
export function FormsScreen() {
  const [switchValue, setSwitchValue] = React.useState(false)
  const [checkboxValue, setCheckboxValue] = React.useState(false)
  const [radioValue, setRadioValue] = React.useState('option1')
  const [sliderValue, setSliderValue] = React.useState([50])
  const [progressValue] = React.useState(75)
  const [showPassword, setShowPassword] = React.useState(false)

  // CheckboxToggle states
  const [checkboxToggleStates, setCheckboxToggleStates] = React.useState<Record<string, boolean>>({
    'checkbox-basic': false,
    'checkbox-required': false,
    'toggle-basic': false,
    'toggle-icons': true,
    'card-basic': false,
    'minimal-basic': false,
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

  // Create a simple ts-form for testing
  const TestFormSchema = z.object({
    testField: createUniqueFieldSchema(z.string(), 'testField'),
    enhancedTestField: createUniqueFieldSchema(z.string(), 'enhancedTestField'),
  })

  const TestForm = createTsForm([[z.string(), TextField]], {
    FormComponent: ({ children, onSubmit }) => (
      <YStack gap="$4" onSubmit={onSubmit}>
        {children}
      </YStack>
    ),
  })

  return (
    <ScrollView>
      <YStack f={1} p="$4" gap="$6" maw={1200} mx="auto">
        {/* Header */}
        <YStack gap="$2">
          <H1>Form Controls</H1>
          <Paragraph color="$gray11" size="$5">
            Input fields, selection controls, and enhanced form components for user interaction.
          </Paragraph>
        </YStack>

        {/* Basic Form Controls */}
        <Card p="$4" gap="$4">
          <H2>Basic Form Controls</H2>
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

        {/* Enhanced TextField Components */}
        <Card p="$4" gap="$6" borderColor="$green7" borderWidth={2}>
          <YStack gap="$3">
            <H2 color="$green11">Enhanced TextField Components</H2>
            <Paragraph size="$3" color="$green11">
              Enhanced text field components with bento-inspired patterns. Test all variants, icons,
              states, and integrations.
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

          {/* Text Input Testing */}
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

          {/* ts-form Testing */}
          <YStack gap="$3">
            <H3>ts-form Text Inputs (Form Context)</H3>
            <YStack gap="$3" p="$3" backgroundColor="$color2" borderRadius="$4">
              <Text size="$3" color="$orange10">
                Testing ts-form inputs to see if they work with our fix:
              </Text>
              <TestForm
                schema={TestFormSchema}
                onSubmit={(data) => {
                  console.log('Form submitted:', data)
                }}
                renderAfter={() => (
                  <Text size="$2" color="$gray10">
                    Try typing in the fields above. If they work, the ts-form integration is fixed.
                  </Text>
                )}
                props={{
                  testField: {
                    label: 'Basic ts-form Field',
                    placeholder: 'Type in this ts-form field...',
                  },
                }}
              />
            </YStack>
          </YStack>
        </Card>

        {/* CheckboxToggle Component */}
        <Card p="$4" gap="$6" borderColor="$purple7" borderWidth={2}>
          <YStack gap="$3">
            <H2 color="$purple11">CheckboxToggle Component</H2>
            <Paragraph size="$3" color="$purple11">
              Unified checkbox and toggle component with multiple variants, enhanced animations, and
              bento-inspired patterns.
            </Paragraph>
          </YStack>

          {/* Checkbox Variant Testing */}
          <YStack gap="$4">
            <H3>Checkbox Variant</H3>
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
                label="Heart Icon"
                checkedIcon={<Heart size={16} />}
                checked={checkboxToggleStates['checkbox-heart'] || false}
                onCheckedChange={() => toggleCheckboxToggle('checkbox-heart')}
              />
            </YStack>

            <H3>Toggle/Switch Variant</H3>
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
            </YStack>

            <H3>Card Variant</H3>
            <XStack gap="$3" flexWrap="wrap">
              <CheckboxToggle
                variant="card"
                label="Basic Card"
                description="Click anywhere on this card to toggle"
                checked={checkboxToggleStates['card-basic']}
                onCheckedChange={() => toggleCheckboxToggle('card-basic')}
                width={200}
              />
            </XStack>

            <H3>Minimal Variant</H3>
            <YStack gap="$3" p="$3" backgroundColor="$color2" borderRadius="$4">
              <CheckboxToggle
                variant="minimal"
                label="Minimal Checkbox"
                checked={checkboxToggleStates['minimal-basic']}
                onCheckedChange={() => toggleCheckboxToggle('minimal-basic')}
              />
            </YStack>
          </YStack>
        </Card>

        {/* Form Validation Examples */}
        <Card p="$4" gap="$4">
          <H2>Form Validation</H2>
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
        </Card>
      </YStack>
    </ScrollView>
  )
}
