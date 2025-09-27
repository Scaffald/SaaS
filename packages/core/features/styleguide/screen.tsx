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
} from '@app/ui'

// Import custom components
import { AnimatedButton } from '@app/ui/src/components/AnimatedButton'

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
              <H3>Custom Animated Buttons</H3>
              <XStack gap="$3" flexWrap="wrap">
                <AnimatedButton variant="primary">Animated Primary</AnimatedButton>
                <AnimatedButton variant="secondary">Animated Secondary</AnimatedButton>
                <Button theme="blue" size="$4">
                  Submit Button
                </Button>
              </XStack>
            </YStack>
          </YStack>
        </Card>

        {/* Bento Button Components */}
        <Card p="$4" gap="$4">
          <H2>Bento Button Collections</H2>

          <YStack gap="$6">
            <YStack gap="$3">
              <H3>Buttons with Left Icons</H3>
              <Text color="$gray11">Interactive button components with icon variations</Text>
            </YStack>

            <YStack gap="$3">
              <H3>Buttons with Loaders</H3>
              <Text color="$gray11">Button components with loading states and animations</Text>
            </YStack>

            <YStack gap="$3">
              <H3>Rounded Buttons</H3>
              <Text color="$gray11">
                Additional button variations available in Bento components
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
