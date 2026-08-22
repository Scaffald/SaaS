/**
 * "Move ▾" — the non-drag path for moving a candidate between stages.
 *
 * This replaces one button per legal target. Three buttons under every card
 * was more discoverable, but at a dozen cards the board carried thirty-six
 * controls and read as noise; the prototype uses a single compact menu, and
 * the board is the screen where density matters most.
 *
 * The accessibility that §12 #12 established had to survive the change — a
 * menu that cannot be operated by keyboard would simply move the barrier
 * rather than remove it. Two things make that true here:
 *
 *   - it is built on `Popover`, which already closes on Escape
 *   - every item is a real `Pressable` with an explicit role, so it lands in
 *     the tab order and Enter/Space activates it on web
 *
 * `@scaffald/ui`'s `Dropdown` was the obvious candidate and is deliberately
 * NOT used: it has no key handling of any kind — no Escape, no arrow keys, no
 * roles — so adopting it would have regressed the board back to pointer-only
 * behind a nicer-looking trigger. Worth fixing there eventually; not worth
 * blocking this on.
 */

import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { ChevronDown } from 'lucide-react-native'
import { Popover, PopoverContent, Text, useThemeContext } from '@scaffald/ui'
import { colors, radius, spacing } from '@scaffald/ui/tokens'
import type { ApplicationStatus } from '../types'

export interface MoveMenuProps {
  /** Legal targets for THIS candidate. Rendering with none is a no-op. */
  targets: ApplicationStatus[]
  labels: Record<ApplicationStatus, string>
  /** Named in the trigger's accessible label so a screen reader knows who. */
  candidateName: string
  onMove: (toStatus: ApplicationStatus) => void
  disabled?: boolean
}

export const MoveMenu = ({
  targets,
  labels,
  candidateName,
  onMove,
  disabled = false,
}: MoveMenuProps) => {
  const { theme } = useThemeContext()
  const [open, setOpen] = useState(false)

  // A terminal candidate has nowhere to go. Rendering a menu that opens onto
  // nothing is worse than rendering no menu.
  if (targets.length === 0) return null

  const trigger = (
    <Pressable
      onPress={() => setOpen((v) => !v)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ expanded: open, disabled }}
      accessibilityLabel={`Move ${candidateName} to another stage`}
      aria-haspopup="menu"
      style={[
        styles.trigger,
        {
          borderColor: open ? colors.border[theme].active : colors.border[theme].default,
          backgroundColor: colors.bg[theme].default,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <Text style={{ fontSize: 13, color: colors.text[theme].primary }}>Move</Text>
      <ChevronDown size={14} color={colors.text[theme].tertiary} />
    </Pressable>
  )

  return (
    <Popover
      placement="bottom"
      trigger="manual"
      open={open}
      onOpenChange={setOpen}
      offset={4}
      content={
        <PopoverContent>
          <View accessibilityRole="menu" style={styles.menu}>
            {targets.map((target) => (
              <Pressable
                key={target}
                onPress={() => {
                  onMove(target)
                  setOpen(false)
                }}
                accessibilityRole="menuitem"
                accessibilityLabel={`Move ${candidateName} to ${labels[target] ?? target}`}
                style={styles.item}
              >
                <Text style={{ fontSize: 14, color: colors.text[theme].primary }}>
                  {labels[target] ?? target}
                </Text>
              </Pressable>
            ))}
          </View>
        </PopoverContent>
      }
    >
      {trigger}
    </Popover>
  )
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[8],
    borderWidth: 1,
    borderRadius: radius.md,
    alignSelf: 'flex-start',
  },
  menu: {
    minWidth: 160,
  },
  item: {
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[12],
  },
})
