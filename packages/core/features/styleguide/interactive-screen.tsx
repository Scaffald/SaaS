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
  AlertDialog,
  Dialog,
  Popover,
  Sheet,
} from '@app/ui'

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
 * Interactive Section of Styleguide
 * Showcases interactive components like dialogs, cards, overlays, and icons
 */
export function InteractiveScreen() {
  const [showDialog, setShowDialog] = React.useState(false)
  const [showAlert, setShowAlert] = React.useState(false)
  const [showPopover, setShowPopover] = React.useState(false)
  const [showSheet, setShowSheet] = React.useState(false)

  return (
    <ScrollView>
      <YStack f={1} p="$4" gap="$6" maw={1200} mx="auto">
        {/* Header */}
        <YStack gap="$2">
          <H1>Interactive Components</H1>
          <Paragraph color="$gray11" size="$5">
            Interactive UI components including dialogs, overlays, cards, and icon libraries.
          </Paragraph>
        </YStack>

        {/* Cards and Containers */}
        <Card p="$4" gap="$4">
          <H2>Cards and Containers</H2>
          <YStack gap="$4">
            <YStack gap="$3">
              <H3>Basic Cards</H3>
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

                <Card p="$4" maw={200} theme="green">
                  <YStack gap="$2">
                    <H3>Green Card</H3>
                    <Paragraph>This card uses a green theme.</Paragraph>
                    <Button size="$3" theme="green">
                      Action
                    </Button>
                  </YStack>
                </Card>
              </XStack>
            </YStack>

            <YStack gap="$3">
              <H3>Interactive Cards</H3>
              <XStack gap="$3" flexWrap="wrap">
                <Card
                  p="$4"
                  maw={200}
                  pressStyle={{ scale: 0.98 }}
                  hoverStyle={{ bg: '$gray2' }}
                  cursor="pointer"
                >
                  <YStack gap="$2">
                    <XStack ai="center" gap="$2">
                      <Heart size={20} />
                      <H3>Clickable Card</H3>
                    </XStack>
                    <Paragraph>This card has hover and press effects.</Paragraph>
                  </YStack>
                </Card>

                <Card
                  p="$4"
                  maw={200}
                  theme="purple"
                  pressStyle={{ scale: 0.98 }}
                  hoverStyle={{ bg: '$purple3' }}
                  cursor="pointer"
                >
                  <YStack gap="$2">
                    <XStack ai="center" gap="$2">
                      <Star size={20} />
                      <H3>Purple Card</H3>
                    </XStack>
                    <Paragraph>Themed interactive card with animations.</Paragraph>
                  </YStack>
                </Card>
              </XStack>
            </YStack>
          </YStack>
        </Card>

        {/* Dialogs and Overlays */}
        <Card p="$4" gap="$4">
          <H2>Dialogs and Overlays</H2>
          <YStack gap="$4">
            <YStack gap="$3">
              <H3>Dialog Components</H3>
              <XStack gap="$3" flexWrap="wrap">
                <Dialog modal open={showDialog} onOpenChange={setShowDialog}>
                  <Dialog.Trigger asChild>
                    <Button>Open Dialog</Button>
                  </Dialog.Trigger>

                  <Dialog.Portal>
                    <Dialog.Overlay
                      key="overlay"
                      animation="slow"
                      opacity={0.5}
                      enterStyle={{ opacity: 0 }}
                      exitStyle={{ opacity: 0 }}
                    />
                    <Dialog.Content
                      bordered
                      elevate
                      key="content"
                      animateOnly={['transform', 'opacity']}
                      animation={[
                        'quicker',
                        {
                          opacity: {
                            overshootClamping: true,
                          },
                        },
                      ]}
                      enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
                      exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
                      gap="$4"
                    >
                      <Dialog.Title>Dialog Title</Dialog.Title>
                      <Dialog.Description>
                        This is a dialog component that can contain any content.
                      </Dialog.Description>

                      <XStack gap="$3" jc="flex-end">
                        <Dialog.Close displayWhenAdapted asChild>
                          <Button variant="outlined">Cancel</Button>
                        </Dialog.Close>
                        <Dialog.Close displayWhenAdapted asChild>
                          <Button theme="blue">Confirm</Button>
                        </Dialog.Close>
                      </XStack>
                    </Dialog.Content>
                  </Dialog.Portal>
                </Dialog>

                <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
                  <AlertDialog.Trigger asChild>
                    <Button theme="red">Open Alert</Button>
                  </AlertDialog.Trigger>

                  <AlertDialog.Portal>
                    <AlertDialog.Overlay
                      key="overlay"
                      animation="slow"
                      opacity={0.5}
                      enterStyle={{ opacity: 0 }}
                      exitStyle={{ opacity: 0 }}
                    />
                    <AlertDialog.Content
                      bordered
                      elevate
                      key="content"
                      x={0}
                      scale={1}
                      opacity={1}
                      y={0}
                      animateOnly={['transform', 'opacity']}
                      animation={[
                        'quicker',
                        {
                          opacity: {
                            overshootClamping: true,
                          },
                        },
                      ]}
                      enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
                      exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
                      gap="$4"
                    >
                      <AlertDialog.Title>Are you sure?</AlertDialog.Title>
                      <AlertDialog.Description>
                        This action cannot be undone. This will permanently delete your data.
                      </AlertDialog.Description>

                      <XStack gap="$3" jc="flex-end">
                        <AlertDialog.Cancel asChild>
                          <Button>Cancel</Button>
                        </AlertDialog.Cancel>
                        <AlertDialog.Action asChild>
                          <Button theme="red">Delete</Button>
                        </AlertDialog.Action>
                      </XStack>
                    </AlertDialog.Content>
                  </AlertDialog.Portal>
                </AlertDialog>
              </XStack>
            </YStack>

            <YStack gap="$3">
              <H3>Popover and Sheet</H3>
              <XStack gap="$3" flexWrap="wrap">
                <Popover
                  size="$5"
                  allowFlip
                  placement="bottom"
                  open={showPopover}
                  onOpenChange={setShowPopover}
                >
                  <Popover.Trigger asChild>
                    <Button>Open Popover</Button>
                  </Popover.Trigger>

                  <Popover.Content
                    borderWidth={1}
                    borderColor="$borderColor"
                    enterStyle={{ y: -10, opacity: 0 }}
                    exitStyle={{ y: -10, opacity: 0 }}
                    elevate
                    animation={[
                      'quick',
                      {
                        opacity: {
                          overshootClamping: true,
                        },
                      },
                    ]}
                  >
                    <Popover.Arrow borderWidth={1} borderColor="$borderColor" />
                    <YStack gap="$3" p="$4">
                      <Text fontWeight="600">Popover Content</Text>
                      <Text size="$3">This is content inside a popover component.</Text>
                      <Button size="$3" onPress={() => setShowPopover(false)}>
                        Close
                      </Button>
                    </YStack>
                  </Popover.Content>
                </Popover>

                <Sheet
                  forceRemoveScrollEnabled={showSheet}
                  modal={true}
                  open={showSheet}
                  onOpenChange={setShowSheet}
                  snapPoints={[85, 50, 25]}
                  dismissOnSnapToBottom
                  position={0}
                  zIndex={100_000}
                  animation="medium"
                >
                  <Sheet.Trigger asChild>
                    <Button>Open Sheet</Button>
                  </Sheet.Trigger>

                  <Sheet.Overlay
                    animation="lazy"
                    enterStyle={{ opacity: 0 }}
                    exitStyle={{ opacity: 0 }}
                  />

                  <Sheet.Handle />

                  <Sheet.Frame padding="$4" gap="$4">
                    <Sheet.ScrollView>
                      <YStack gap="$4">
                        <H3>Sheet Content</H3>
                        <Text>This is a sheet component that slides up from the bottom.</Text>
                        <Button onPress={() => setShowSheet(false)}>Close Sheet</Button>
                      </YStack>
                    </Sheet.ScrollView>
                  </Sheet.Frame>
                </Sheet>
              </XStack>
            </YStack>
          </YStack>
        </Card>

        {/* Toast Notifications */}
        <Card p="$4" gap="$4">
          <H2>Toast Notifications</H2>
          <YStack gap="$3">
            <H3>Toast Components</H3>
            <XStack gap="$3" flexWrap="wrap">
              <Button>Show Success Toast</Button>
              <Button theme="red">Show Error Toast</Button>
              <Button theme="yellow">Show Warning Toast</Button>
              <Button theme="blue">Show Info Toast</Button>
            </XStack>
            <Text color="$gray11" size="$3">
              Toast functionality is available via useToastController hook. These buttons
              demonstrate the different toast types that can be triggered programmatically.
            </Text>
          </YStack>
        </Card>

        {/* Icons Showcase */}
        <Card p="$4" gap="$4">
          <H2>Icon Library</H2>
          <YStack gap="$4">
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

            <YStack gap="$3">
              <H3>Action Icons</H3>
              <XStack gap="$4" flexWrap="wrap">
                {[
                  { icon: Check, name: 'Check' },
                  { icon: X, name: 'Close' },
                  { icon: Save, name: 'Save' },
                  { icon: Send, name: 'Send' },
                  { icon: Lock, name: 'Lock' },
                  { icon: Eye, name: 'Eye' },
                  { icon: EyeOff, name: 'EyeOff' },
                  { icon: AlertCircle, name: 'Alert' },
                  { icon: Info, name: 'Info' },
                  { icon: MapPin, name: 'MapPin' },
                ].map(({ icon: Icon, name }) => (
                  <YStack key={name} ai="center" gap="$2" p="$2">
                    <Icon size={24} />
                    <Text size="$2">{name}</Text>
                  </YStack>
                ))}
              </XStack>
            </YStack>

            <YStack gap="$3">
              <H3>Icon Sizes</H3>
              <XStack gap="$4" ai="center" flexWrap="wrap">
                <YStack ai="center" gap="$2">
                  <Heart size={12} />
                  <Text size="$2">12px</Text>
                </YStack>
                <YStack ai="center" gap="$2">
                  <Heart size={16} />
                  <Text size="$2">16px</Text>
                </YStack>
                <YStack ai="center" gap="$2">
                  <Heart size={20} />
                  <Text size="$2">20px</Text>
                </YStack>
                <YStack ai="center" gap="$2">
                  <Heart size={24} />
                  <Text size="$2">24px</Text>
                </YStack>
                <YStack ai="center" gap="$2">
                  <Heart size={32} />
                  <Text size="$2">32px</Text>
                </YStack>
                <YStack ai="center" gap="$2">
                  <Heart size={48} />
                  <Text size="$2">48px</Text>
                </YStack>
              </XStack>
            </YStack>

            <YStack gap="$3">
              <H3>Themed Icons</H3>
              <XStack gap="$4" ai="center" flexWrap="wrap">
                <YStack ai="center" gap="$2" theme="blue">
                  <Star size={32} color="$blue11" />
                  <Text size="$2" color="$blue11">
                    Blue
                  </Text>
                </YStack>
                <YStack ai="center" gap="$2" theme="green">
                  <Heart size={32} color="$green11" />
                  <Text size="$2" color="$green11">
                    Green
                  </Text>
                </YStack>
                <YStack ai="center" gap="$2" theme="red">
                  <AlertCircle size={32} color="$red11" />
                  <Text size="$2" color="$red11">
                    Red
                  </Text>
                </YStack>
                <YStack ai="center" gap="$2" theme="purple">
                  <Settings size={32} color="$purple11" />
                  <Text size="$2" color="$purple11">
                    Purple
                  </Text>
                </YStack>
              </XStack>
            </YStack>
          </YStack>
        </Card>

        {/* Interactive Examples */}
        <Card p="$4" gap="$4">
          <H2>Interactive Examples</H2>
          <YStack gap="$4">
            <YStack gap="$3">
              <H3>Hover Effects</H3>
              <XStack gap="$3" flexWrap="wrap">
                <Button hoverStyle={{ bg: '$blue6', scale: 1.05 }} pressStyle={{ scale: 0.95 }}>
                  Hover Scale
                </Button>
                <Button
                  theme="green"
                  hoverStyle={{ bg: '$green7', borderColor: '$green8' }}
                  pressStyle={{ bg: '$green8' }}
                >
                  Hover Color
                </Button>
                <Button
                  theme="purple"
                  hoverStyle={{ rotate: '5deg' }}
                  pressStyle={{ rotate: '-5deg' }}
                >
                  Hover Rotate
                </Button>
              </XStack>
            </YStack>

            <YStack gap="$3">
              <H3>Press Effects</H3>
              <XStack gap="$3" flexWrap="wrap">
                <Button pressStyle={{ scale: 0.9, bg: '$gray6' }} animation="bouncy">
                  Press Scale
                </Button>
                <Button theme="red" pressStyle={{ y: 2, bg: '$red8' }} animation="quick">
                  Press Push
                </Button>
                <Button
                  theme="orange"
                  pressStyle={{ opacity: 0.7, borderWidth: 3 }}
                  animation="medium"
                >
                  Press Fade
                </Button>
              </XStack>
            </YStack>
          </YStack>
        </Card>
      </YStack>
    </ScrollView>
  )
}
