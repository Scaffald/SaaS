/**
 * useFilterSheet — returns a filter button config + Sheet component.
 *
 * Supports checkbox-group and range filter controls.
 *
 * @example
 * ```tsx
 * const { filterButton, FilterSheet, values, hasActiveFilters } = useFilterSheet({
 *   controls: [
 *     { key: 'trade', type: 'checkbox-group', label: 'Trade', options: [...] },
 *     { key: 'minScore', type: 'range', label: 'Min Score', min: 0, max: 100 },
 *   ],
 * })
 * ```
 */

import { SlidersHorizontal } from 'lucide-react-native'
import { useCallback, useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
import type { ToolbarButtonConfig } from '../../ToolbarButton'
import { Sheet, SheetHeader, SheetContent } from '../../Sheet'
import { Checkbox } from '../../Checkbox'
import { RangeSlider } from '../../Slider'
import { Text } from '../../Typography'
import { useThemeContext } from '../../../theme'
import { colors } from '../../../tokens/colors'
import type { FilterControl } from '../BottomBar.types'

export interface UseFilterSheetOptions {
  title?: string
  controls: FilterControl[]
  /** External controlled values */
  values?: Record<string, unknown>
  /** External onChange */
  onValuesChange?: (values: Record<string, unknown>) => void
}

function buildInitialValues(controls: FilterControl[]): Record<string, unknown> {
  const init: Record<string, unknown> = {}
  for (const c of controls) {
    if (c.type === 'checkbox-group') init[c.key] = []
    else if (c.type === 'range') init[c.key] = c.min ?? 0
  }
  return init
}

export function useFilterSheet(options: UseFilterSheetOptions) {
  const { title = 'Filters', controls } = options
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  const [internalValues, setInternalValues] = useState(() => buildInitialValues(controls))
  const [isOpen, setIsOpen] = useState(false)

  const values = options.values ?? internalValues
  const { onValuesChange } = options
  const setValues = onValuesChange
    ? (fn: (prev: Record<string, unknown>) => Record<string, unknown>) => {
        const next = fn(values)
        onValuesChange(next)
      }
    : (fn: (prev: Record<string, unknown>) => Record<string, unknown>) => {
        setInternalValues(fn)
      }

  const hasActiveFilters = useMemo(() => {
    for (const c of controls) {
      const v = values[c.key]
      if (c.type === 'checkbox-group' && Array.isArray(v) && v.length > 0) return true
      if (c.type === 'range' && typeof v === 'number' && v > (c.min ?? 0)) return true
    }
    return false
  }, [controls, values])

  const reset = useCallback(() => {
    const init = buildInitialValues(controls)
    if (options.onValuesChange) options.onValuesChange(init)
    else setInternalValues(init)
  }, [controls, options])

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  const activeFilterColor = colors.primary[t === 'dark' ? 300 : 500]

  const filterButton = useMemo<ToolbarButtonConfig>(() => ({
    key: 'filter',
    icon: (
      <SlidersHorizontal
        size={20}
        color={hasActiveFilters ? activeFilterColor : colors.text[t].secondary}
      />
    ),
    label: 'Filter',
    variant: 'icon',
    onPress: open,
    accessibilityLabel: 'Open filters',
  }), [hasActiveFilters, activeFilterColor, t, open])

  const FilterSheet = useMemo(() => {
    return function FilterSheetComponent() {
      return (
        <Sheet visible={isOpen} onClose={close} height="half">
          <SheetHeader title={title} onClose={close} />
          <SheetContent>
            <View style={{ gap: 20 }}>
              {controls.map((control, idx) => (
                <View key={control.key}>
                  {idx > 0 && (
                    <View style={{ height: 1, backgroundColor: colors.border[t].default, marginVertical: 10 }} />
                  )}
                  <View style={{ gap: 12 }}>
                    {control.type === 'checkbox-group' && (
                      <CheckboxGroupControl
                        control={control}
                        value={(values[control.key] as string[]) ?? []}
                        onChange={(next) =>
                          setValues((prev) => ({ ...prev, [control.key]: next }))
                        }
                        theme={t}
                      />
                    )}
                    {control.type === 'range' && (
                      <RangeControl
                        control={control}
                        value={(values[control.key] as number) ?? control.min ?? 0}
                        onChange={(next) =>
                          setValues((prev) => ({ ...prev, [control.key]: next }))
                        }
                        theme={t}
                      />
                    )}
                  </View>
                </View>
              ))}
            </View>
          </SheetContent>
        </Sheet>
      )
    }
  }, [isOpen, close, title, controls, values, setValues, t])

  return {
    values,
    setValues,
    hasActiveFilters,
    reset,
    isOpen,
    open,
    close,
    FilterSheet,
    filterButton,
  }
}

// ---------------------------------------------------------------------------
// Internal control renderers
// ---------------------------------------------------------------------------

function CheckboxGroupControl({
  control,
  value,
  onChange,
  theme,
}: {
  control: FilterControl
  value: string[]
  onChange: (next: string[]) => void
  theme: 'light' | 'dark'
}) {
  return (
    <>
      <Text
        style={{
          fontSize: 13,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 1,
          color: colors.text[theme].tertiary,
        }}
      >
        {control.label}
      </Text>
      <View style={{ gap: 4 }}>
        {control.options?.map((opt) => {
          const isSelected = value.includes(opt.value)
          return (
            <Pressable
              key={opt.value}
              onPress={() => {
                if (isSelected) {
                  onChange(value.filter((v) => v !== opt.value))
                } else {
                  onChange([...value, opt.value])
                }
              }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 10,
                backgroundColor: isSelected
                  ? colors.bg[theme].selected
                  : pressed
                    ? colors.bg[theme].subtle
                    : 'transparent',
              })}
            >
              <Checkbox checked={isSelected} onChange={() => {
                if (isSelected) onChange(value.filter((v) => v !== opt.value))
                else onChange([...value, opt.value])
              }} size="sm" />
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: isSelected ? '600' : '400',
                  color: colors.text[theme].primary,
                }}
              >
                {opt.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </>
  )
}

function RangeControl({
  control,
  value,
  onChange,
  theme,
}: {
  control: FilterControl
  value: number
  onChange: (next: number) => void
  theme: 'light' | 'dark'
}) {
  return (
    <>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: 1,
            color: colors.text[theme].tertiary,
          }}
        >
          {control.label}
        </Text>
        <Text
          style={{
            fontSize: 15,
            fontWeight: '700',
            color: colors.text[theme].primary,
          }}
        >
          {value}
        </Text>
      </View>
      <RangeSlider
        value={value}
        onValueChange={onChange}
        min={control.min ?? 0}
        max={control.max ?? 100}
        step={control.step ?? 1}
      />
    </>
  )
}
