import { useRef } from 'react'
import { ScrollView, View } from 'react-native'
import { Benefits } from '../components/Benefits'
import { ContactSection } from '../components/ContactSection'
import { FAQ } from '../components/FAQ'
import { Hero } from '../components/Hero'
import { HowItWorks } from '../components/HowItWorks'
import { MarketingFooter } from '../components/MarketingFooter'
import { MarketingNav } from '../components/MarketingNav'
import { SkipToContent } from '../components/SkipToContent'
import { brand } from '../theme'

/** Sections are also real `#fragment` targets via each component's nativeID. */
const SECTION_KEYS = ['how-it-works', 'benefits', 'faq'] as const
type SectionKey = (typeof SECTION_KEYS)[number]

export function LandingScreen() {
  const scrollRef = useRef<ScrollView>(null)
  const offsets = useRef<Record<string, number>>({})

  /**
   * Smooth-scrolls within the ScrollView. The nav links carry real hrefs, so
   * this is an enhancement — navigation still works with JS disabled.
   */
  const scrollTo = (id: string) => {
    const y = offsets.current[id]
    if (y !== undefined) scrollRef.current?.scrollTo({ y, animated: true })
  }

  const measure = (key: SectionKey) => (event: { nativeEvent: { layout: { y: number } } }) => {
    offsets.current[key] = event.nativeEvent.layout.y
  }

  return (
    <View style={{ flex: 1, backgroundColor: brand.surface }}>
      <SkipToContent targetId="main-content" />
      <MarketingNav onNavigate={scrollTo} />
      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        <View nativeID="main-content">
          <Hero />
        </View>
        <View onLayout={measure('how-it-works')}>
          <HowItWorks />
        </View>
        <View onLayout={measure('benefits')}>
          <Benefits />
        </View>
        <View onLayout={measure('faq')}>
          <FAQ />
        </View>
        <ContactSection />
        <MarketingFooter />
      </ScrollView>
    </View>
  )
}
