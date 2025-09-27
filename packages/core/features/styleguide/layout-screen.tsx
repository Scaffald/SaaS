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
  Separator,
  View,
  Stack,
} from '@app/ui'

/**
 * Layout Section of Styleguide
 * Showcases spacing, layout components, and structural elements
 */
export function LayoutScreen() {
  return (
    <ScrollView>
      <YStack f={1} p="$4" gap="$6" maw={1200} mx="auto">
        {/* Header */}
        <YStack gap="$2">
          <H1>Layout & Spacing</H1>
          <Paragraph color="$gray11" size="$5">
            Layout components, spacing utilities, and structural elements for organizing content.
          </Paragraph>
        </YStack>

        {/* Stack Layouts */}
        <Card p="$4" gap="$4">
          <H2>Stack Layouts</H2>
          <YStack gap="$4">
            <YStack gap="$3">
              <H3>Vertical Stack (YStack)</H3>
              <Text size="$3" color="$gray11">
                YStack arranges children vertically with configurable spacing.
              </Text>
              <YStack gap="$2" p="$3" bg="$gray3" br="$3">
                <View h={40} bg="$blue5" br="$2" ai="center" jc="center">
                  <Text color="$blue11" fontWeight="600">
                    Item 1
                  </Text>
                </View>
                <View h={40} bg="$green5" br="$2" ai="center" jc="center">
                  <Text color="$green11" fontWeight="600">
                    Item 2
                  </Text>
                </View>
                <View h={40} bg="$purple5" br="$2" ai="center" jc="center">
                  <Text color="$purple11" fontWeight="600">
                    Item 3
                  </Text>
                </View>
              </YStack>
            </YStack>

            <YStack gap="$3">
              <H3>Horizontal Stack (XStack)</H3>
              <Text size="$3" color="$gray11">
                XStack arranges children horizontally with configurable spacing.
              </Text>
              <XStack gap="$2" p="$3" bg="$gray3" br="$3">
                <View w={80} h={40} bg="$blue5" br="$2" ai="center" jc="center">
                  <Text color="$blue11" fontWeight="600">
                    Item 1
                  </Text>
                </View>
                <View w={80} h={40} bg="$green5" br="$2" ai="center" jc="center">
                  <Text color="$green11" fontWeight="600">
                    Item 2
                  </Text>
                </View>
                <View w={80} h={40} bg="$purple5" br="$2" ai="center" jc="center">
                  <Text color="$purple11" fontWeight="600">
                    Item 3
                  </Text>
                </View>
              </XStack>
            </YStack>

            <YStack gap="$3">
              <H3>Nested Stacks</H3>
              <Text size="$3" color="$gray11">
                Stacks can be nested to create complex layouts.
              </Text>
              <YStack gap="$3" p="$3" bg="$gray3" br="$3">
                <XStack gap="$2">
                  <View flex={1} h={60} bg="$blue5" br="$2" ai="center" jc="center">
                    <Text color="$blue11" fontWeight="600">
                      Header Left
                    </Text>
                  </View>
                  <View flex={1} h={60} bg="$green5" br="$2" ai="center" jc="center">
                    <Text color="$green11" fontWeight="600">
                      Header Right
                    </Text>
                  </View>
                </XStack>
                <View h={80} bg="$purple5" br="$2" ai="center" jc="center">
                  <Text color="$purple11" fontWeight="600">
                    Content Area
                  </Text>
                </View>
                <XStack gap="$2">
                  <View w={100} h={40} bg="$orange5" br="$2" ai="center" jc="center">
                    <Text color="$orange11" fontWeight="600">
                      Footer 1
                    </Text>
                  </View>
                  <View flex={1} h={40} bg="$red5" br="$2" ai="center" jc="center">
                    <Text color="$red11" fontWeight="600">
                      Footer 2
                    </Text>
                  </View>
                  <View w={100} h={40} bg="$pink5" br="$2" ai="center" jc="center">
                    <Text color="$pink11" fontWeight="600">
                      Footer 3
                    </Text>
                  </View>
                </XStack>
              </YStack>
            </YStack>
          </YStack>
        </Card>

        {/* Spacing System */}
        <Card p="$4" gap="$4">
          <H2>Spacing System</H2>
          <YStack gap="$4">
            <YStack gap="$3">
              <H3>Gap Spacing</H3>
              <Text size="$3" color="$gray11">
                Consistent spacing between elements using the gap prop.
              </Text>

              <YStack gap="$2">
                <Text size="$2" fontWeight="600">
                  gap="$1" (4px)
                </Text>
                <XStack gap="$1" p="$2" bg="$gray2" br="$2">
                  <View w={30} h={30} bg="$blue9" br="$1" />
                  <View w={30} h={30} bg="$blue9" br="$1" />
                  <View w={30} h={30} bg="$blue9" br="$1" />
                </XStack>
              </YStack>

              <YStack gap="$2">
                <Text size="$2" fontWeight="600">
                  gap="$2" (8px)
                </Text>
                <XStack gap="$2" p="$2" bg="$gray2" br="$2">
                  <View w={30} h={30} bg="$green9" br="$1" />
                  <View w={30} h={30} bg="$green9" br="$1" />
                  <View w={30} h={30} bg="$green9" br="$1" />
                </XStack>
              </YStack>

              <YStack gap="$2">
                <Text size="$2" fontWeight="600">
                  gap="$4" (16px)
                </Text>
                <XStack gap="$4" p="$2" bg="$gray2" br="$2">
                  <View w={30} h={30} bg="$purple9" br="$1" />
                  <View w={30} h={30} bg="$purple9" br="$1" />
                  <View w={30} h={30} bg="$purple9" br="$1" />
                </XStack>
              </YStack>

              <YStack gap="$2">
                <Text size="$2" fontWeight="600">
                  gap="$6" (24px)
                </Text>
                <XStack gap="$6" p="$2" bg="$gray2" br="$2">
                  <View w={30} h={30} bg="$red9" br="$1" />
                  <View w={30} h={30} bg="$red9" br="$1" />
                  <View w={30} h={30} bg="$red9" br="$1" />
                </XStack>
              </YStack>
            </YStack>

            <YStack gap="$3">
              <H3>Padding Spacing</H3>
              <Text size="$3" color="$gray11">
                Internal spacing using padding props.
              </Text>

              <XStack gap="$3" flexWrap="wrap">
                <YStack ai="center" gap="$2">
                  <Text size="$2" fontWeight="600">
                    p="$2"
                  </Text>
                  <View bg="$blue3" br="$2">
                    <View p="$2" bg="$blue9" br="$2">
                      <Text color="white" size="$2">
                        Content
                      </Text>
                    </View>
                  </View>
                </YStack>

                <YStack ai="center" gap="$2">
                  <Text size="$2" fontWeight="600">
                    p="$4"
                  </Text>
                  <View bg="$green3" br="$2">
                    <View p="$4" bg="$green9" br="$2">
                      <Text color="white" size="$2">
                        Content
                      </Text>
                    </View>
                  </View>
                </YStack>

                <YStack ai="center" gap="$2">
                  <Text size="$2" fontWeight="600">
                    p="$6"
                  </Text>
                  <View bg="$purple3" br="$2">
                    <View p="$6" bg="$purple9" br="$2">
                      <Text color="white" size="$2">
                        Content
                      </Text>
                    </View>
                  </View>
                </YStack>
              </XStack>
            </YStack>

            <YStack gap="$3">
              <H3>Margin Spacing</H3>
              <Text size="$3" color="$gray11">
                External spacing using margin props.
              </Text>

              <View bg="$gray2" p="$4" br="$3">
                <XStack gap="$0">
                  <View bg="$red3" br="$2">
                    <View m="$2" p="$3" bg="$red9" br="$2">
                      <Text color="white" size="$2">
                        m="$2"
                      </Text>
                    </View>
                  </View>
                  <View bg="$green3" br="$2">
                    <View m="$4" p="$3" bg="$green9" br="$2">
                      <Text color="white" size="$2">
                        m="$4"
                      </Text>
                    </View>
                  </View>
                  <View bg="$blue3" br="$2">
                    <View m="$6" p="$3" bg="$blue9" br="$2">
                      <Text color="white" size="$2">
                        m="$6"
                      </Text>
                    </View>
                  </View>
                </XStack>
              </View>
            </YStack>
          </YStack>
        </Card>

        {/* Alignment */}
        <Card p="$4" gap="$4">
          <H2>Alignment</H2>
          <YStack gap="$4">
            <YStack gap="$3">
              <H3>Horizontal Alignment</H3>
              <Text size="$3" color="$gray11">
                Justify content alignment in horizontal stacks.
              </Text>

              <YStack gap="$3">
                <YStack gap="$1">
                  <Text size="$2" fontWeight="600">
                    jc="flex-start" (default)
                  </Text>
                  <XStack jc="flex-start" p="$3" bg="$gray3" br="$2">
                    <View w={60} h={30} bg="$blue9" br="$1" />
                    <View w={60} h={30} bg="$green9" br="$1" />
                  </XStack>
                </YStack>

                <YStack gap="$1">
                  <Text size="$2" fontWeight="600">
                    jc="center"
                  </Text>
                  <XStack jc="center" p="$3" bg="$gray3" br="$2">
                    <View w={60} h={30} bg="$blue9" br="$1" />
                    <View w={60} h={30} bg="$green9" br="$1" />
                  </XStack>
                </YStack>

                <YStack gap="$1">
                  <Text size="$2" fontWeight="600">
                    jc="flex-end"
                  </Text>
                  <XStack jc="flex-end" p="$3" bg="$gray3" br="$2">
                    <View w={60} h={30} bg="$blue9" br="$1" />
                    <View w={60} h={30} bg="$green9" br="$1" />
                  </XStack>
                </YStack>

                <YStack gap="$1">
                  <Text size="$2" fontWeight="600">
                    jc="space-between"
                  </Text>
                  <XStack jc="space-between" p="$3" bg="$gray3" br="$2">
                    <View w={60} h={30} bg="$blue9" br="$1" />
                    <View w={60} h={30} bg="$green9" br="$1" />
                    <View w={60} h={30} bg="$purple9" br="$1" />
                  </XStack>
                </YStack>
              </YStack>
            </YStack>

            <YStack gap="$3">
              <H3>Vertical Alignment</H3>
              <Text size="$3" color="$gray11">
                Align items vertically in stacks.
              </Text>

              <XStack gap="$3">
                <YStack gap="$1" flex={1}>
                  <Text size="$2" fontWeight="600">
                    ai="flex-start"
                  </Text>
                  <XStack ai="flex-start" h={80} p="$3" bg="$gray3" br="$2">
                    <View w={40} h={20} bg="$blue9" br="$1" />
                    <View w={40} h={40} bg="$green9" br="$1" />
                    <View w={40} h={30} bg="$purple9" br="$1" />
                  </XStack>
                </YStack>

                <YStack gap="$1" flex={1}>
                  <Text size="$2" fontWeight="600">
                    ai="center"
                  </Text>
                  <XStack ai="center" h={80} p="$3" bg="$gray3" br="$2">
                    <View w={40} h={20} bg="$blue9" br="$1" />
                    <View w={40} h={40} bg="$green9" br="$1" />
                    <View w={40} h={30} bg="$purple9" br="$1" />
                  </XStack>
                </YStack>

                <YStack gap="$1" flex={1}>
                  <Text size="$2" fontWeight="600">
                    ai="flex-end"
                  </Text>
                  <XStack ai="flex-end" h={80} p="$3" bg="$gray3" br="$2">
                    <View w={40} h={20} bg="$blue9" br="$1" />
                    <View w={40} h={40} bg="$green9" br="$1" />
                    <View w={40} h={30} bg="$purple9" br="$1" />
                  </XStack>
                </YStack>
              </XStack>
            </YStack>
          </YStack>
        </Card>

        {/* Separators */}
        <Card p="$4" gap="$4">
          <H2>Separators</H2>
          <YStack gap="$4">
            <YStack gap="$3">
              <H3>Horizontal Separators</H3>
              <Text size="$3" color="$gray11">
                Horizontal lines to separate content sections.
              </Text>

              <YStack gap="$3">
                <Text>Content above separator</Text>
                <Separator />
                <Text>Content below separator</Text>
                <Separator borderColor="$blue7" />
                <Text>Content with colored separator</Text>
              </YStack>
            </YStack>

            <YStack gap="$3">
              <H3>Vertical Separators</H3>
              <Text size="$3" color="$gray11">
                Vertical lines in horizontal layouts.
              </Text>

              <XStack h={60} ai="center" gap="$3" p="$3" bg="$gray2" br="$3">
                <Text>Left content</Text>
                <Separator vertical />
                <Text>Middle content</Text>
                <Separator vertical borderColor="$green7" />
                <Text>Right content</Text>
              </XStack>
            </YStack>
          </YStack>
        </Card>

        {/* Flexbox Properties */}
        <Card p="$4" gap="$4">
          <H2>Flexbox Properties</H2>
          <YStack gap="$4">
            <YStack gap="$3">
              <H3>Flex Growth</H3>
              <Text size="$3" color="$gray11">
                Using flex properties to control space distribution.
              </Text>

              <XStack gap="$2" p="$3" bg="$gray3" br="$3">
                <View h={40} bg="$blue5" br="$2" ai="center" jc="center" minWidth={80}>
                  <Text color="$blue11" size="$2">
                    Fixed
                  </Text>
                </View>
                <View flex={1} h={40} bg="$green5" br="$2" ai="center" jc="center">
                  <Text color="$green11" size="$2">
                    flex={1}
                  </Text>
                </View>
                <View flex={2} h={40} bg="$purple5" br="$2" ai="center" jc="center">
                  <Text color="$purple11" size="$2">
                    flex={2}
                  </Text>
                </View>
              </XStack>
            </YStack>

            <YStack gap="$3">
              <H3>Flex Wrap</H3>
              <Text size="$3" color="$gray11">
                Wrapping content when it exceeds container width.
              </Text>

              <XStack flexWrap="wrap" gap="$2" p="$3" bg="$gray3" br="$3">
                {Array.from({ length: 8 }, (_, i) => (
                  <View key={i} w={80} h={40} bg="$orange5" br="$2" ai="center" jc="center">
                    <Text color="$orange11" size="$2">
                      Item {i + 1}
                    </Text>
                  </View>
                ))}
              </XStack>
            </YStack>
          </YStack>
        </Card>

        {/* Responsive Layout */}
        <Card p="$4" gap="$4">
          <H2>Responsive Layout</H2>
          <YStack gap="$4">
            <YStack gap="$3">
              <H3>Breakpoint-based Layout</H3>
              <Text size="$3" color="$gray11">
                Layout that adapts to different screen sizes using media queries.
              </Text>

              <XStack
                gap="$3"
                flexWrap="wrap"
                $sm={{ flexDirection: 'column' }}
                p="$3"
                bg="$gray3"
                br="$3"
              >
                <View flex={1} h={60} bg="$blue5" br="$2" ai="center" jc="center" minWidth={200}>
                  <Text color="$blue11" fontWeight="600">
                    Main Content
                  </Text>
                </View>
                <View
                  w={200}
                  h={60}
                  bg="$green5"
                  br="$2"
                  ai="center"
                  jc="center"
                  $sm={{ width: '100%' }}
                >
                  <Text color="$green11" fontWeight="600">
                    Sidebar
                  </Text>
                </View>
              </XStack>

              <Text size="$2" color="$gray11">
                On small screens, this layout switches to a vertical stack.
              </Text>
            </YStack>

            <YStack gap="$3">
              <H3>Conditional Display</H3>
              <Text size="$3" color="$gray11">
                Show/hide elements based on screen size.
              </Text>

              <XStack gap="$3" p="$3" bg="$gray3" br="$3">
                <View flex={1} h={40} bg="$purple5" br="$2" ai="center" jc="center">
                  <Text color="$purple11" fontWeight="600">
                    Always Visible
                  </Text>
                </View>
                <View
                  w={150}
                  h={40}
                  bg="$red5"
                  br="$2"
                  ai="center"
                  jc="center"
                  $sm={{ display: 'none' }}
                >
                  <Text color="$red11" fontWeight="600">
                    Desktop Only
                  </Text>
                </View>
              </XStack>

              <Text size="$2" color="$gray11">
                The red box is hidden on small screens using $sm={{ display: 'none' }}.
              </Text>
            </YStack>
          </YStack>
        </Card>
      </YStack>
    </ScrollView>
  )
}
