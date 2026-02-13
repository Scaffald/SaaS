import { useEffect, useMemo, useRef, useState } from 'react'
import { View, ScrollView, Modal, Pressable } from 'react-native'
import { X } from 'lucide-react-native'
import { Stack } from '../Layout'
import { Row } from '../Layout'
import { Button } from '../Button'
import { Toggle } from '../Toggle'
import { Heading } from '../Typography'
import { Paragraph } from '../Typography'
import { useCookieConsent } from './CookieConsentProvider'
import type { CookieConsentCategory, CookieConsentSelections } from './CookieConsent.types'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { useThemeContext } from '../../theme'

const REQUIRED_COPY = 'Always on — required for the site to work properly.'

function RequiredCategoryRow({ category }: { category: CookieConsentCategory }) {
  const { theme } = useThemeContext()
  const labelColor = colors.text[theme].primary
  const descColor = colors.text[theme].secondary
  const hintColor = colors.text[theme].tertiary
  const rowBg = colors.bg[theme].subtle

  return (
    <View
      style={{
        padding: spacing[4],
        backgroundColor: rowBg,
        borderRadius: 16,
        gap: spacing[2],
      }}
    >
      <Paragraph size="md" weight="semibold" style={{ color: labelColor }}>
        {category.label}
      </Paragraph>
      <Paragraph size="sm" style={{ color: descColor }}>
        {category.description}
      </Paragraph>
      <Paragraph size="xs" style={{ color: hintColor }}>
        {REQUIRED_COPY}
      </Paragraph>
    </View>
  )
}

function OptionalCategoryRow({
  category,
  value,
  onChange,
}: {
  category: CookieConsentCategory
  value: boolean
  onChange: (next: boolean) => void
}) {
  const { theme } = useThemeContext()
  const rowBg = value
    ? theme === 'light'
      ? colors.primary[50]
      : colors.primary[900]
    : colors.bg[theme].subtle
  const labelColor = colors.text[theme].primary
  const descColor = colors.text[theme].secondary

  return (
    <View
      style={{
        padding: spacing[4],
        backgroundColor: rowBg,
        borderRadius: 16,
        gap: spacing[2],
      }}
    >
      <Row justify="space-between" align="center" style={{ gap: spacing[4] }}>
        <Paragraph size="md" weight="semibold" style={{ color: labelColor, flex: 1 }}>
          {category.label}
        </Paragraph>
        <Toggle checked={value} onChange={onChange} size="md" color="primary" />
      </Row>
      <Paragraph size="sm" style={{ color: descColor }}>
        {category.description}
      </Paragraph>
    </View>
  )
}

export function CookiePreferencesDialog() {
  const {
    categories,
    selections,
    isPreferencesOpen,
    closePreferences,
    saveSelections,
    rejectAll,
  } = useCookieConsent()
  const { theme } = useThemeContext()

  const initialDraft = useMemo(() => selections, [selections])
  const [draft, setDraft] = useState<CookieConsentSelections>(initialDraft)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const wasOpenRef = useRef(false)

  useEffect(() => {
    if (isPreferencesOpen && !wasOpenRef.current) {
      setDraft(initialDraft)
      setIsSubmitting(false)
    }
    wasOpenRef.current = isPreferencesOpen
  }, [initialDraft, isPreferencesOpen])

  const handleToggle = (categoryId: string, isEnabled: boolean) => {
    setDraft((prev) => ({ ...prev, [categoryId]: isEnabled }))
  }

  const handleSave = async () => {
    setIsSubmitting(true)
    try {
      await saveSelections(draft)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRejectAll = async () => {
    setIsSubmitting(true)
    try {
      await rejectAll()
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isPreferencesOpen) return null

  const overlayBg = colors.bg[theme].overlay
  const contentBg = colors.bg[theme].default
  const borderColor = colors.border[theme].default
  const descColor = colors.text[theme].secondary

  return (
    <Modal
      visible={isPreferencesOpen}
      transparent
      animationType="fade"
      onRequestClose={closePreferences}
      statusBarTranslucent
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: overlayBg,
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing[6],
        }}
        onPress={closePreferences}
      >
        <Pressable
          style={{ maxWidth: 520, width: '100%', maxHeight: '90%' }}
          onPress={(e) => e.stopPropagation()}
        >
          <View
            style={{
              backgroundColor: contentBg,
              borderRadius: 16,
              padding: spacing[6],
              maxHeight: 600,
              borderWidth: 1,
              borderColor,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Row
              justify="space-between"
              align="center"
              style={{ marginBottom: spacing[4], paddingBottom: spacing[4], borderBottomWidth: 1, borderBottomColor: borderColor }}
            >
              <Heading level={5} style={{ color: colors.text[theme].primary }}>
                Manage Cookies
              </Heading>
              <Button
                size="sm"
                variant="text"
                color="gray"
                iconStart={X}
                iconOnly
                onPress={closePreferences}
              />
            </Row>

            <Paragraph
              size="md"
              style={{ color: descColor, marginBottom: spacing[5] }}
            >
              Choose which categories of cookies to allow. Not all cookies can be turned off — some
              are required for the site to work properly.
            </Paragraph>

            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              <Stack gap={spacing[4]}>
                {categories.map((category) =>
                  category.required ? (
                    <RequiredCategoryRow key={category.id} category={category} />
                  ) : (
                    <OptionalCategoryRow
                      key={category.id}
                      category={category}
                      value={Boolean(draft[category.id])}
                      onChange={(next) => handleToggle(category.id, next)}
                    />
                  )
                )}
              </Stack>
            </ScrollView>
            <View
              style={{
                marginTop: spacing[5],
                paddingTop: spacing[5],
                borderTopWidth: 1,
                borderTopColor: borderColor,
              }}
            >
              <Row gap={spacing[3]} justify="flex-end" align="center" style={{ flexWrap: 'wrap' }}>
                <Button color="success" variant="filled" onPress={handleSave} disabled={isSubmitting}>
                  Save
                </Button>
                <Button
                  variant="outline"
                  color="gray"
                  onPress={() => {
                    setDraft(initialDraft)
                    closePreferences()
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  color="error"
                  variant="outline"
                  onPress={handleRejectAll}
                  disabled={isSubmitting}
                >
                  Reject All
                </Button>
              </Row>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
