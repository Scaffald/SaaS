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
import { borderRadius } from '../../tokens/borders'
import { shadows } from '../../tokens/shadows'
import { useThemeContext } from '../../theme'

const REQUIRED_COPY = 'Always on — required for the site to work properly.'

function RequiredCategoryRow({ category }: { category: CookieConsentCategory }) {
  const { theme } = useThemeContext()

  return (
    <View
      style={{
        padding: spacing[12],
        backgroundColor: colors.bg[theme].subtle,
        borderRadius: borderRadius.xl,
        gap: spacing[8],
      }}
    >
      <Paragraph size="md" weight="semibold" style={{ color: colors.text[theme].primary }}>
        {category.label}
      </Paragraph>
      <Paragraph size="sm" style={{ color: colors.text[theme].secondary }}>
        {category.description}
      </Paragraph>
      <Paragraph size="xs" style={{ color: colors.text[theme].tertiary }}>
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

  return (
    <Pressable onPress={() => onChange(!value)}>
      <View
        style={{
          padding: spacing[12],
          backgroundColor: rowBg,
          borderRadius: borderRadius.xl,
          gap: spacing[8],
        }}
      >
        <Row justify="space-between" align="center" style={{ gap: spacing[8] }}>
          <Paragraph size="md" weight="semibold" style={{ color: colors.text[theme].primary, flex: 1 }}>
            {category.label}
          </Paragraph>
          <Toggle checked={value} onChange={onChange} size="md" color="primary" />
        </Row>
        <Paragraph size="sm" style={{ color: colors.text[theme].secondary }}>
          {category.description}
        </Paragraph>
      </View>
    </Pressable>
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

  const borderColor = colors.border[theme].default

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
          backgroundColor: colors.bg[theme].overlay,
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing[16],
        }}
        onPress={closePreferences}
      >
        <Pressable
          style={{ maxWidth: 520, width: '100%', maxHeight: '90%' }}
          onPress={(e) => e.stopPropagation()}
        >
          <View
            style={{
              backgroundColor: colors.bg[theme].default,
              borderRadius: borderRadius.xl,
              padding: spacing[16],
              maxHeight: 600,
              borderWidth: 1,
              borderColor,
              ...shadows.m,
            }}
          >
            <Row
              justify="space-between"
              align="center"
              style={{
                marginBottom: spacing[12],
                paddingBottom: spacing[12],
                borderBottomWidth: 1,
                borderBottomColor: borderColor,
              }}
            >
              <Heading level={6} style={{ color: colors.text[theme].primary }}>
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
              style={{ color: colors.text[theme].secondary, marginBottom: spacing[12] }}
            >
              Choose which categories of cookies to allow. Not all cookies can be turned off — some
              are required for the site to work properly.
            </Paragraph>

            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              <Stack gap={spacing[12]}>
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
                marginTop: spacing[12],
                paddingTop: spacing[12],
                borderTopWidth: 1,
                borderTopColor: borderColor,
              }}
            >
              <Row gap={spacing[8]} justify="flex-end" align="center" style={{ flexWrap: 'wrap' }}>
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
