/**
 * One notification, on a hairline — the row the notifications centre and the
 * drawer feed both render.
 *
 * Unread dot, the record's title, one line of context, a relative time, and an
 * arrow when the row goes somewhere. A row with no `ctaUrl` is not pressable:
 * it renders the same content with an empty arrow slot, so a tap that would do
 * nothing is not offered and the time column still lines up.
 */
import { Pressable, StyleSheet, View } from 'react-native'
import { ArrowRight } from 'lucide-react-native'
import { Text, useThemeContext } from '@scaffald/ui'
import { colors, fontSize, fontWeight, lineHeight } from '@scaffald/ui/tokens'
import type { NotificationListItem } from '../normalize'

const DOT_SIZE = 8

export function formatNotificationTime(value: string): string {
  if (!value) return ''
  const date = new Date(value)
  const min = Math.floor((Date.now() - date.getTime()) / 60_000)
  if (min < 1) return 'now'
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}d ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function NotificationRow({
  item,
  onPress,
  compact = false,
  last = false,
}: {
  item: NotificationListItem
  onPress: (item: NotificationListItem) => void
  /** The drawer feed: smaller type, a single-line title. */
  compact?: boolean
  /** Drops the bottom rule, for a list inside a bordered container. */
  last?: boolean
}) {
  const { theme } = useThemeContext()
  const pressable = Boolean(item.ctaUrl)
  const titleSize = compact ? fontSize.sm : fontSize.md
  const titleLeading = compact ? lineHeight.sm : lineHeight.md
  const arrowSize = compact ? 14 : 16

  const content = (
    <View style={[styles.row, compact && styles.rowCompact]}>
      <View
        style={[
          styles.dot,
          {
            marginTop: (titleLeading - DOT_SIZE) / 2,
            backgroundColor: item.read ? colors.text[theme].disabled : colors.text[theme].attention,
          },
        ]}
      />
      <View style={styles.body}>
        <Text
          numberOfLines={compact ? 1 : 2}
          style={{
            fontSize: titleSize,
            lineHeight: titleLeading,
            fontWeight: item.read ? fontWeight.regular : fontWeight.medium,
            color: item.read ? colors.text[theme].tertiary : colors.text[theme].primary,
          }}
        >
          {item.title}
        </Text>
        {item.preview ? (
          <Text
            numberOfLines={1}
            style={{
              fontSize: compact ? fontSize.xs : fontSize.sm,
              lineHeight: compact ? lineHeight.xs : lineHeight.sm,
              color: colors.text[theme].tertiary,
            }}
          >
            {item.preview}
          </Text>
        ) : null}
      </View>
      <Text
        style={{
          ...styles.time,
          fontSize: fontSize.xs,
          lineHeight: titleLeading,
          color: colors.text[theme].tertiary,
        }}
      >
        {formatNotificationTime(item.createdAt)}
      </Text>
      <View style={{ width: arrowSize, height: titleLeading, justifyContent: 'center' }}>
        {pressable ? <ArrowRight size={arrowSize} color={colors.text[theme].attention} /> : null}
      </View>
    </View>
  )

  const rule = last ? { borderBottomWidth: 0 } : { borderBottomColor: colors.border[theme].default }
  const label = `${item.title}${item.read ? '' : ', unread'}`

  if (!pressable) {
    return (
      <View style={[styles.rule, rule]} accessible accessibilityLabel={label}>
        {content}
      </View>
    )
  }

  return (
    <Pressable
      onPress={() => onPress(item)}
      accessibilityRole="link"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.rule,
        rule,
        { backgroundColor: pressed ? colors.bg[theme].subtle : 'transparent' },
      ]}
    >
      {content}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  rule: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 16,
  },
  rowCompact: {
    gap: 10,
    paddingVertical: 10,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    flexShrink: 0,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  time: {
    flexShrink: 0,
    fontVariant: ['tabular-nums'],
  },
})
