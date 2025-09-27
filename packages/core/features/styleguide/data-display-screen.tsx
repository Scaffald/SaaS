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
  Avatar,
  Spinner,
  View,
} from '@app/ui'

// Import icons
import { User } from '@tamagui/lucide-icons'

/**
 * Data Display Section of Styleguide
 * Showcases avatars, badges, loading states, and data visualization components
 */
export function DataDisplayScreen() {
  return (
    <ScrollView>
      <YStack f={1} p="$4" gap="$6" maw={1200} mx="auto">
        {/* Header */}
        <YStack gap="$2">
          <H1>Data Display</H1>
          <Paragraph color="$gray11" size="$5">
            Components for displaying data, user information, status indicators, and loading states.
          </Paragraph>
        </YStack>

        {/* Avatars */}
        <Card p="$4" gap="$4">
          <H2>Avatars</H2>
          <YStack gap="$4">
            <YStack gap="$3">
              <H3>Avatar Sizes</H3>
              <XStack gap="$3" ai="center" flexWrap="wrap">
                <Avatar circular size="$2">
                  <Avatar.Image src="https://images.unsplash.com/photo-1548142813-039e6b10a8a9?w=150&h=150&fit=crop&crop=face" />
                  <Avatar.Fallback bc="$blue4" />
                </Avatar>
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
                <Avatar circular size="$6">
                  <Avatar.Image src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face" />
                  <Avatar.Fallback bc="$purple4" />
                </Avatar>
              </XStack>
            </YStack>

            <YStack gap="$3">
              <H3>Avatar Fallbacks</H3>
              <XStack gap="$3" ai="center" flexWrap="wrap">
                <Avatar circular size="$4">
                  <Avatar.Fallback bc="$red4">
                    <User />
                  </Avatar.Fallback>
                </Avatar>
                <Avatar circular size="$4">
                  <Avatar.Fallback bc="$blue4">
                    <Text color="$blue11" fontWeight="600">
                      JD
                    </Text>
                  </Avatar.Fallback>
                </Avatar>
                <Avatar circular size="$4">
                  <Avatar.Fallback bc="$green4">
                    <Text color="$green11" fontWeight="600">
                      AB
                    </Text>
                  </Avatar.Fallback>
                </Avatar>
                <Avatar circular size="$4">
                  <Avatar.Fallback bc="$purple4">
                    <Text color="$purple11" fontWeight="600">
                      XY
                    </Text>
                  </Avatar.Fallback>
                </Avatar>
              </XStack>
            </YStack>

            <YStack gap="$3">
              <H3>Square Avatars</H3>
              <XStack gap="$3" ai="center" flexWrap="wrap">
                <Avatar size="$3">
                  <Avatar.Image src="https://images.unsplash.com/photo-1548142813-039e6b10a8a9?w=150&h=150&fit=crop&crop=face" />
                  <Avatar.Fallback bc="$blue4" />
                </Avatar>
                <Avatar size="$4">
                  <Avatar.Image src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face" />
                  <Avatar.Fallback bc="$green4" />
                </Avatar>
                <Avatar size="$5">
                  <Avatar.Image src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face" />
                  <Avatar.Fallback bc="$purple4" />
                </Avatar>
              </XStack>
            </YStack>
          </YStack>
        </Card>

        {/* Badges and Status */}
        <Card p="$4" gap="$4">
          <H2>Badges and Status Indicators</H2>
          <YStack gap="$4">
            <YStack gap="$3">
              <H3>Basic Badges</H3>
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
              <H3>Status Dots</H3>
              <XStack gap="$4" ai="center" flexWrap="wrap">
                <XStack ai="center" gap="$2">
                  <View w={8} h={8} br="$10" bg="$green9" />
                  <Text size="$3">Online</Text>
                </XStack>
                <XStack ai="center" gap="$2">
                  <View w={8} h={8} br="$10" bg="$yellow9" />
                  <Text size="$3">Away</Text>
                </XStack>
                <XStack ai="center" gap="$2">
                  <View w={8} h={8} br="$10" bg="$red9" />
                  <Text size="$3">Busy</Text>
                </XStack>
                <XStack ai="center" gap="$2">
                  <View w={8} h={8} br="$10" bg="$gray9" />
                  <Text size="$3">Offline</Text>
                </XStack>
              </XStack>
            </YStack>

            <YStack gap="$3">
              <H3>Notification Badges</H3>
              <XStack gap="$4" ai="center" flexWrap="wrap">
                <View position="relative">
                  <View w={40} h={40} bg="$gray5" br="$4" />
                  <View
                    position="absolute"
                    top={-4}
                    right={-4}
                    w={16}
                    h={16}
                    br="$10"
                    bg="$red9"
                    ai="center"
                    jc="center"
                  >
                    <Text size="$1" color="white" fontWeight="600">
                      3
                    </Text>
                  </View>
                </View>
                <View position="relative">
                  <View w={40} h={40} bg="$gray5" br="$4" />
                  <View
                    position="absolute"
                    top={-4}
                    right={-4}
                    w={16}
                    h={16}
                    br="$10"
                    bg="$blue9"
                    ai="center"
                    jc="center"
                  >
                    <Text size="$1" color="white" fontWeight="600">
                      12
                    </Text>
                  </View>
                </View>
                <View position="relative">
                  <View w={40} h={40} bg="$gray5" br="$4" />
                  <View position="absolute" top={-2} right={-2} w={8} h={8} br="$10" bg="$green9" />
                </View>
              </XStack>
            </YStack>
          </YStack>
        </Card>

        {/* Loading States */}
        <Card p="$4" gap="$4">
          <H2>Loading States</H2>
          <YStack gap="$4">
            <YStack gap="$3">
              <H3>Spinners</H3>
              <XStack gap="$4" ai="center" flexWrap="wrap">
                <YStack ai="center" gap="$2">
                  <Spinner />
                  <Text size="$2">Default</Text>
                </YStack>
                <YStack ai="center" gap="$2">
                  <Spinner theme="blue" />
                  <Text size="$2">Blue</Text>
                </YStack>
                <YStack ai="center" gap="$2">
                  <Spinner theme="green" />
                  <Text size="$2">Green</Text>
                </YStack>
                <YStack ai="center" gap="$2">
                  <Spinner size="large" />
                  <Text size="$2">Large</Text>
                </YStack>
                <YStack ai="center" gap="$2">
                  <Spinner theme="purple" size="small" />
                  <Text size="$2">Small Purple</Text>
                </YStack>
              </XStack>
            </YStack>

            <YStack gap="$3">
              <H3>Loading Skeletons</H3>
              <YStack gap="$3">
                <YStack gap="$2">
                  <Text size="$3" fontWeight="600">
                    Text Skeleton
                  </Text>
                  <YStack gap="$2">
                    <View h={16} bg="$gray5" br="$2" animation="slow" />
                    <View h={16} bg="$gray5" br="$2" w="80%" animation="slow" />
                    <View h={16} bg="$gray5" br="$2" w="60%" animation="slow" />
                  </YStack>
                </YStack>

                <YStack gap="$2">
                  <Text size="$3" fontWeight="600">
                    Card Skeleton
                  </Text>
                  <XStack gap="$3" p="$3" borderWidth={1} borderColor="$gray6" br="$4">
                    <View w={60} h={60} bg="$gray5" br="$10" />
                    <YStack gap="$2" flex={1}>
                      <View h={20} bg="$gray5" br="$2" />
                      <View h={16} bg="$gray5" br="$2" w="70%" />
                      <View h={16} bg="$gray5" br="$2" w="50%" />
                    </YStack>
                  </XStack>
                </YStack>
              </YStack>
            </YStack>
          </YStack>
        </Card>

        {/* Data Tables */}
        <Card p="$4" gap="$4">
          <H2>Data Tables</H2>
          <YStack gap="$3">
            <H3>Simple Table</H3>
            <View borderWidth={1} borderColor="$gray6" br="$4" overflow="hidden">
              {/* Table Header */}
              <XStack bg="$gray3" p="$3" borderBottomWidth={1} borderColor="$gray6">
                <Text flex={1} fontWeight="600" size="$3">
                  Name
                </Text>
                <Text flex={1} fontWeight="600" size="$3">
                  Status
                </Text>
                <Text flex={1} fontWeight="600" size="$3">
                  Role
                </Text>
              </XStack>

              {/* Table Rows */}
              {[
                { name: 'John Doe', status: 'Active', role: 'Admin' },
                { name: 'Jane Smith', status: 'Inactive', role: 'User' },
                { name: 'Bob Johnson', status: 'Active', role: 'Editor' },
              ].map((row, index) => (
                <XStack
                  key={index}
                  p="$3"
                  borderBottomWidth={index < 2 ? 1 : 0}
                  borderColor="$gray6"
                  hoverStyle={{ bg: '$gray2' }}
                >
                  <Text flex={1} size="$3">
                    {row.name}
                  </Text>
                  <XStack flex={1} ai="center" gap="$2">
                    <View
                      w={8}
                      h={8}
                      br="$10"
                      bg={row.status === 'Active' ? '$green9' : '$gray9'}
                    />
                    <Text size="$3">{row.status}</Text>
                  </XStack>
                  <Text flex={1} size="$3">
                    {row.role}
                  </Text>
                </XStack>
              ))}
            </View>

            <Text color="$gray11" size="$2">
              More complex table components are available in the Bento collection for advanced data
              display, including sortable tables, data grids, and user listings with pagination and
              filtering.
            </Text>
          </YStack>
        </Card>

        {/* Metrics and Stats */}
        <Card p="$4" gap="$4">
          <H2>Metrics and Statistics</H2>
          <YStack gap="$4">
            <YStack gap="$3">
              <H3>Stat Cards</H3>
              <XStack gap="$3" flexWrap="wrap">
                <Card p="$4" minWidth={150} theme="blue">
                  <YStack ai="center" gap="$2">
                    <Text fontSize="$8" fontWeight="700" color="$blue11">
                      1,234
                    </Text>
                    <Text size="$3" color="$blue11">
                      Total Users
                    </Text>
                  </YStack>
                </Card>
                <Card p="$4" minWidth={150} theme="green">
                  <YStack ai="center" gap="$2">
                    <Text fontSize="$8" fontWeight="700" color="$green11">
                      567
                    </Text>
                    <Text size="$3" color="$green11">
                      Active Now
                    </Text>
                  </YStack>
                </Card>
                <Card p="$4" minWidth={150} theme="purple">
                  <YStack ai="center" gap="$2">
                    <Text fontSize="$8" fontWeight="700" color="$purple11">
                      89%
                    </Text>
                    <Text size="$3" color="$purple11">
                      Satisfaction
                    </Text>
                  </YStack>
                </Card>
              </XStack>
            </YStack>

            <YStack gap="$3">
              <H3>Progress Indicators</H3>
              <YStack gap="$3">
                <YStack gap="$2">
                  <XStack jc="space-between">
                    <Text size="$3">Project Progress</Text>
                    <Text size="$3" color="$gray11">
                      75%
                    </Text>
                  </XStack>
                  <View h={8} bg="$gray5" br="$4">
                    <View h="100%" w="75%" bg="$blue9" br="$4" />
                  </View>
                </YStack>

                <YStack gap="$2">
                  <XStack jc="space-between">
                    <Text size="$3">Storage Used</Text>
                    <Text size="$3" color="$gray11">
                      45%
                    </Text>
                  </XStack>
                  <View h={8} bg="$gray5" br="$4">
                    <View h="100%" w="45%" bg="$green9" br="$4" />
                  </View>
                </YStack>

                <YStack gap="$2">
                  <XStack jc="space-between">
                    <Text size="$3">CPU Usage</Text>
                    <Text size="$3" color="$gray11">
                      92%
                    </Text>
                  </XStack>
                  <View h={8} bg="$gray5" br="$4">
                    <View h="100%" w="92%" bg="$red9" br="$4" />
                  </View>
                </YStack>
              </YStack>
            </YStack>
          </YStack>
        </Card>
      </YStack>
    </ScrollView>
  )
}
