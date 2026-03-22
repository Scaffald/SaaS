import {
  Stack,
  Row,
  Text,
  Paragraph,
  H4,
  H5,
  useThemeContext,
  useResponsive,
  ResponsiveSelect,
  ScrollView,
} from '@scaffald/ui'
import { colors, spacing } from '@scaffald/ui/tokens'
import { Stack as RouterStack, useRouter } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { useCallback, useRef, useState } from 'react'
import type { LayoutChangeEvent } from 'react-native'
import { Platform, Pressable, View } from 'react-native'
import type { ViewStyle } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const SIDEBAR_WIDTH = 220
const CONTENT_PADDING = spacing[24]

export interface LegalSection {
  id: string
  heading: string
  content: ReactNode
}

export interface LegalDocumentLayoutProps {
  title: string
  subtitle: string
  sections: LegalSection[]
}

export function LegalDocumentLayout({
  title,
  subtitle,
  sections,
}: LegalDocumentLayoutProps) {
  const router = useRouter()
  const { theme } = useThemeContext()
  const { isDesktop } = useResponsive()
  const scrollRef = useRef<ScrollView>(null)
  const sectionOffsetsRef = useRef<Record<string, number>>({})
  const [jumpToValue, setJumpToValue] = useState<string>('')

  const handleSectionLayout = useCallback(
    (id: string) => (event: LayoutChangeEvent) => {
      const { layout } = event.nativeEvent
      sectionOffsetsRef.current[id] = CONTENT_PADDING + layout.y
    },
    []
  )

  const scrollToSection = useCallback((id: string) => {
    const y = sectionOffsetsRef.current[id]
    if (y !== undefined && scrollRef.current) {
      scrollRef.current.scrollTo({ y, animated: true })
    }
    setJumpToValue(id)
  }, [])

  const jumpToOptions = sections.map((s) => ({ value: s.id, label: s.heading }))

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg[theme].default }}>
      <RouterStack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <Row
        align="center"
        gap={spacing[12]}
        style={{
          paddingHorizontal: spacing[16],
          paddingVertical: spacing[12],
          borderBottomWidth: 1,
          borderBottomColor: colors.border[theme].default,
        }}
      >
        <Pressable onPress={() => router.back()}>
          <Row align="center" gap={spacing[8]}>
            <ArrowLeft size={20} color={colors.text[theme].primary} />
            <Text style={{ color: colors.text[theme].primary }}>Back</Text>
          </Row>
        </Pressable>
      </Row>

      <Row style={{ flex: 1, minWidth: 0 }}>
        {/* Desktop: sticky left sidebar */}
        {isDesktop && (
          <View
            style={[
              {
                width: SIDEBAR_WIDTH,
                borderRightWidth: 1,
                borderRightColor: colors.border[theme].default,
                paddingVertical: spacing[24],
                paddingHorizontal: spacing[16],
              },
              Platform.OS === 'web' && ({
                position: 'sticky',
                top: 0,
                alignSelf: 'flex-start',
              } as unknown as ViewStyle),
            ]}
          >
            <Stack gap={spacing[8]}>
              {sections.map((section) => (
                <Pressable
                  key={section.id}
                  onPress={() => scrollToSection(section.id)}
                  style={({ pressed }) => ({
                    paddingVertical: spacing[8],
                    paddingHorizontal: spacing[12],
                    borderRadius: 8,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text
                    size="sm"
                    style={{
                      color: colors.text[theme].secondary,
                    }}
                    numberOfLines={2}
                  >
                    {section.heading}
                  </Text>
                </Pressable>
              ))}
            </Stack>
          </View>
        )}

        {/* Content area */}
        <View style={{ flex: 1, minWidth: 0 }}>
          {!isDesktop && (
            <View style={{ paddingHorizontal: CONTENT_PADDING, paddingTop: spacing[16] }}>
              <ResponsiveSelect
                label="Jump to"
                placeholder="Jump to section"
                options={jumpToOptions}
                value={jumpToValue}
                onValueChange={(value) => {
                  setJumpToValue(value)
                  scrollToSection(value)
                }}
                sheetTitle="Jump to section"
              />
            </View>
          )}

          <ScrollView
            ref={scrollRef}
            contentContainerStyle={{ padding: CONTENT_PADDING }}
            showsVerticalScrollIndicator
          >
            <Stack gap={spacing[24]}>
              <Stack gap={spacing[8]}>
                <H4>{title}</H4>
                <Paragraph size="sm" style={{ color: colors.text[theme].tertiary }}>
                  {subtitle}
                </Paragraph>
              </Stack>

              {sections.map((section) => (
                <View
                  key={section.id}
                  onLayout={handleSectionLayout(section.id)}
                  nativeID={section.id}
                >
                  <Stack gap={spacing[12]}>
                    <H5>{section.heading}</H5>
                    {section.content}
                  </Stack>
                </View>
              ))}
            </Stack>
          </ScrollView>
        </View>
      </Row>
    </SafeAreaView>
  )
}

/** Default export for Expo Router (prevents "missing default export" warning). */
export default function LegalDocumentLayoutRoute() {
  return null
}
