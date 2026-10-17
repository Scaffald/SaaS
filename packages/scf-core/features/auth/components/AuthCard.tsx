import { ScaffaldLogo } from '@scf/core/assets'
import { H2, Text, useCookieConsent, useResponsive, useThemeContext } from '@scaffald/ui'
import { colors, fontScale, quietPanel } from '@scaffald/ui/tokens'
import { type ReactNode, useEffect, useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AUTH_SLIDE_INTERVAL_MS, AUTH_SLIDES, nextSlideIndex } from '../auth-entry'

/** The dark value-prop panel is the same near-black in both themes, as in the prototype. */
const PANEL_BG = colors.gray[900]
const PANEL_TEXT = colors.text.dark.primary
const PANEL_BODY = colors.text.dark.secondary
const PANEL_ACCENT = colors.primary[300]

// Fallback space reserved beneath the card while the cookie consent banner
// measures itself, so the banner never sits over the form's last controls
// (SC-82; carried over from the welcome carousel this card replaces).
const ESTIMATED_COOKIE_BANNER_INSET = 220

/**
 * The prototype's numbered value-prop slides (#1210): ordinal, kicker, title,
 * one sentence, and a row of dashes to pick a slide. Advances on a timer;
 * picking a slide restarts the timer from there.
 */
function AuthValuePanel() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(
      () => setIndex((i) => nextSlideIndex(i, AUTH_SLIDES.length)),
      AUTH_SLIDE_INTERVAL_MS
    )
    return () => clearInterval(id)
  }, [index])

  const slide = AUTH_SLIDES[index] ?? AUTH_SLIDES[0]

  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        backgroundColor: PANEL_BG,
        paddingTop: 34,
        paddingHorizontal: 36,
        paddingBottom: 28,
      }}
      testID="auth-value-panel"
    >
      <ScaffaldLogo
        width={132}
        height={22}
        primaryColor={PANEL_TEXT}
        secondaryColor={PANEL_TEXT}
        gradientStart={PANEL_TEXT}
        gradientEnd={PANEL_TEXT}
      />
      <View
        style={{ flex: 1, justifyContent: 'center', paddingVertical: 30 }}
        accessibilityLiveRegion="polite"
      >
        <Text
          style={{
            fontSize: fontScale.display,
            lineHeight: fontScale.display,
            color: PANEL_ACCENT,
            opacity: 0.45,
            fontVariant: ['tabular-nums'],
          }}
        >
          {slide.n}
        </Text>
        <Text
          style={{
            marginTop: 18,
            fontSize: fontScale.step1,
            letterSpacing: 1.6,
            textTransform: 'uppercase',
            color: PANEL_ACCENT,
          }}
        >
          {slide.kicker}
        </Text>
        <H2 weight="regular" style={{ marginTop: 10, color: PANEL_TEXT }}>
          {slide.title}
        </H2>
        <Text
          style={{
            marginTop: 14,
            fontSize: fontScale.step3,
            lineHeight: 24,
            color: PANEL_BODY,
            maxWidth: 380,
          }}
        >
          {slide.body}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }} accessibilityRole="tablist">
        {AUTH_SLIDES.map((s, i) => (
          <Pressable
            key={s.n}
            onPress={() => setIndex(i)}
            accessibilityRole="tab"
            accessibilityState={{ selected: i === index }}
            accessibilityLabel={`${s.n}: ${s.title}`}
            hitSlop={10}
          >
            <View
              style={{
                width: 22,
                height: 3,
                backgroundColor: i === index ? PANEL_ACCENT : 'rgba(255,255,255,0.28)',
              }}
            />
          </Pressable>
        ))}
      </View>
    </View>
  )
}

/**
 * The /auth and /auth/verify frame (#1210): one centred card on a quiet
 * ground. From the `sm` breakpoint it is the prototype's two-panel card —
 * value-prop slides on the left, the form on the right. Below it the card is
 * just the form under the logo, so a phone opens straight onto the email
 * field; the old full-screen testimonial carousel, which a first-time phone
 * visitor had to Continue or Skip past, is gone.
 */
export function AuthCard({ children }: { children: ReactNode }) {
  const { theme } = useThemeContext()
  const { atLeast } = useResponsive()
  const twoPanel = atLeast('sm')

  const { shouldShowBanner, bannerHeight } = useCookieConsent()
  const bannerInset = shouldShowBanner
    ? bannerHeight > 0
      ? bannerHeight + 12
      : ESTIMATED_COOKIE_BANNER_INSET
    : 0

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bg[theme].subtle }}
      edges={['top', 'bottom', 'left', 'right']}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: 24,
          paddingBottom: 24 + bannerInset,
        }}
      >
        <View
          style={[
            quietPanel(theme),
            {
              width: '100%',
              maxWidth: twoPanel ? 880 : 440,
              flexDirection: 'row',
              overflow: 'hidden',
            },
          ]}
          testID="auth-card"
        >
          {twoPanel ? <AuthValuePanel /> : null}
          <View
            style={{
              flex: 1,
              minWidth: 0,
              paddingVertical: twoPanel ? 34 : 28,
              paddingHorizontal: twoPanel ? 36 : 22,
            }}
          >
            {twoPanel ? null : (
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                {/* The default teal wordmark is ~3:1 on the dark card; lift it there. */}
                <ScaffaldLogo
                  width={132}
                  height={22}
                  {...(theme === 'dark'
                    ? { primaryColor: colors.primary[300], secondaryColor: colors.primary[300] }
                    : {})}
                />
              </View>
            )}
            {children}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
