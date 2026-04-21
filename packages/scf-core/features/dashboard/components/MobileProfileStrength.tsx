import { useProfileCompletion } from '@scf/core/features/dashboard/completion/useProfileCompletion'
import { Button, Row, Stack, Text, useResponsive, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useRouter } from 'expo-router'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Pressable, View } from 'react-native'

export function MobileProfileStrength() {
  const { isMobile } = useResponsive()
  const { theme } = useThemeContext()
  const { completionData, isLoading } = useProfileCompletion()
  const router = useRouter()
  const [index, setIndex] = useState(0)
  const fadeAnim = useRef(new Animated.Value(1)).current

  const incompleteItems = useMemo(
    () => completionData?.items.filter((item) => !item.complete) ?? [],
    [completionData]
  )

  const goToIndex = useCallback(
    (newIndex: number) => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setIndex(newIndex)
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start()
      })
    },
    [fadeAnim]
  )

  useEffect(() => {
    if (incompleteItems.length <= 1) return
    const id = setInterval(() => {
      goToIndex((index + 1) % incompleteItems.length)
    }, 8000)
    return () => clearInterval(id)
  }, [index, incompleteItems.length, goToIndex])

  if (!isMobile || isLoading || !completionData || incompleteItems.length === 0) {
    return null
  }

  const safeIndex = index % incompleteItems.length
  const card = incompleteItems[safeIndex]
  if (!card) return null

  const handleCTA = () => {
    if (card.actionRoute) router.push(card.actionRoute)
  }

  const showArrows = incompleteItems.length > 1

  return (
    <View
      style={{
        backgroundColor: colors.bg[theme].default,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        borderWidth: 1,
        borderColor: colors.border[theme].subtle,
      }}
    >
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: '700',
            color: colors.text[theme].primary,
          }}
        >
          Profile strength
        </Text>

        {showArrows ? (
          <Row gap={4} style={{ alignItems: 'center' }}>
            <Pressable
              onPress={() =>
                goToIndex((safeIndex - 1 + incompleteItems.length) % incompleteItems.length)
              }
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressed ? 0.4 : 0.7, padding: 2 })}
            >
              <ChevronLeft size={20} color={colors.icon[theme].default} />
            </Pressable>
            <Pressable
              onPress={() => goToIndex((safeIndex + 1) % incompleteItems.length)}
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressed ? 0.4 : 0.7, padding: 2 })}
            >
              <ChevronRight size={20} color={colors.icon[theme].default} />
            </Pressable>
          </Row>
        ) : null}
      </Row>

      <Animated.View style={{ opacity: fadeAnim, marginTop: 8 }}>
        <Stack gap={6}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: colors.text[theme].primary,
            }}
          >
            {card.title}
          </Text>
          <Text
            size="sm"
            style={{
              color: colors.text[theme].secondary,
              lineHeight: 20,
            }}
          >
            {card.description}
          </Text>
        </Stack>
      </Animated.View>

      <Button
        variant="filled"
        color="primary"
        fullWidth
        onPress={handleCTA}
        style={{ marginTop: 16 }}
      >
        {card.actionLabel ?? `Complete ${card.title}`}
      </Button>

      {showArrows ? (
        <Row
          style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}
        >
          <Row gap={6}>
            {incompleteItems.map((_, i) => (
              <Pressable
                key={i}
                onPress={() => goToIndex(i)}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor:
                    i === safeIndex
                      ? colors.primary[500]
                      : colors.border[theme].default,
                }}
              />
            ))}
          </Row>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '600',
              color: colors.text[theme].tertiary,
            }}
          >
            {safeIndex + 1} / {incompleteItems.length}
          </Text>
        </Row>
      ) : null}
    </View>
  )
}
