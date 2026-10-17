/**
 * Cells shared by the CMS lists under /office/cms.
 *
 * The ui Table wraps a bare string in its own <Text> with no line limit, so a
 * long title or organization wrapped to three lines and set the height of the
 * whole row (#1204). `CellText` is one line with an ellipsis.
 *
 * `CmsRowMenu` is the visible ⋯ on every row. The rows used to rely on a
 * click-to-open overlay (`RowActionOverlay`) that nothing mounted any more, so
 * a row's actions were neither visible nor reachable by keyboard. Built like
 * the pipeline's MoveMenu: on `Popover`, which closes on Escape, with every
 * item a real Pressable carrying a role, so it is in the tab order and
 * Enter/Space activate it on web. `Dropdown` has no key handling at all.
 */

import { useState } from 'react'
import { type GestureResponderEvent, Pressable, StyleSheet, View } from 'react-native'
import { MoreHorizontal } from 'lucide-react-native'
import { Popover, PopoverContent, Text, useThemeContext } from '@scaffald/ui'
import { colors, fontSize, fontWeight, radius, spacing } from '@scaffald/ui/tokens'

type Tone = 'primary' | 'secondary' | 'tertiary'

export function CellText({
  children,
  tone = 'primary',
  strong = false,
  tabular = false,
}: {
  children: string | null | undefined
  tone?: Tone
  /** The row's name — bold, as the prototype sets the first column. */
  strong?: boolean
  /** Figures that should line up down the column: pay, dates. */
  tabular?: boolean
}) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const empty = !children
  return (
    <Text
      numberOfLines={1}
      ellipsizeMode="tail"
      style={{
        color: empty ? colors.text[t].tertiary : colors.text[t][tone],
        fontWeight: strong && !empty ? fontWeight.semibold : undefined,
        fontVariant: tabular ? ['tabular-nums'] : undefined,
        minWidth: 0,
      }}
    >
      {empty ? '—' : children}
    </Text>
  )
}

export interface CmsRowAction {
  label: string
  onPress: () => void
  disabled?: boolean
}

/** Keep a press inside the menu from also opening the row. */
function stop(event?: GestureResponderEvent) {
  event?.stopPropagation?.()
}

export function CmsRowMenu({
  actions,
  itemName,
}: {
  actions: CmsRowAction[]
  /** Named in the trigger's accessible label so a screen reader knows which row. */
  itemName: string
}) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const [open, setOpen] = useState(false)

  if (actions.length === 0) return null

  return (
    <Popover
      placement="bottom-end"
      trigger="manual"
      open={open}
      onOpenChange={setOpen}
      offset={4}
      showArrow={false}
      content={
        <PopoverContent>
          <View accessibilityRole="menu" style={styles.menu}>
            {actions.map((action) => (
              <Pressable
                key={action.label}
                disabled={action.disabled}
                onPress={(event) => {
                  stop(event)
                  setOpen(false)
                  action.onPress()
                }}
                accessibilityRole="menuitem"
                accessibilityLabel={`${action.label}: ${itemName}`}
                accessibilityState={{ disabled: action.disabled }}
                style={({ pressed }) => [
                  styles.item,
                  pressed && { backgroundColor: colors.bg[t].muted },
                  action.disabled && { opacity: 0.5 },
                ]}
              >
                <Text
                  style={{
                    fontSize: fontSize.md,
                    color: colors.text[t].primary,
                  }}
                >
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </PopoverContent>
      }
    >
      <Pressable
        onPress={(event) => {
          stop(event)
          setOpen((value) => !value)
        }}
        // No button role: the Table draws each row as a <button>, and a role
        // here renders a second <button> inside it — invalid nesting React
        // warns about. The Pressable stays focusable, Enter opens it, and the
        // label plus aria-haspopup tell a screen reader what it is.
        focusable
        accessibilityLabel={`Actions for ${itemName}`}
        accessibilityState={{ expanded: open }}
        aria-haspopup="menu"
        hitSlop={8}
        style={({ pressed }) => [
          styles.trigger,
          (open || pressed) && { backgroundColor: colors.bg[t].muted },
        ]}
      >
        <MoreHorizontal size={16} color={colors.text[t].secondary} />
      </Pressable>
    </Popover>
  )
}

const styles = StyleSheet.create({
  trigger: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: radius.md,
    alignSelf: 'flex-end',
  },
  menu: {
    minWidth: 160,
  },
  item: {
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[12],
  },
})
