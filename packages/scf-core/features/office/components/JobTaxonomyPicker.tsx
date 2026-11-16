import {
  AnchoredOverlay,
  Button,
  Input,
  Row,
  Stack,
  Text,
  getMenuItemStyle,
  useListboxNavigation,
  useThemeContext,
} from '@scaffald/ui'
import { borderRadius, colors } from '@scaffald/ui/tokens'
import { X } from 'lucide-react-native'
import { useEffect, useId, useRef, useState } from 'react'
import { Pressable, View } from 'react-native'

export interface JobTaxonomyItem {
  id: string
  name: string
}

export interface JobTaxonomyPickerProps<T extends JobTaxonomyItem> {
  selectedIds: string[]
  onChange: (ids: string[]) => void
  onSearch: (query: string) => Promise<T[]>
  placeholder: string
  disabled?: boolean
  testID?: string
}

const SEARCH_DEBOUNCE_MS = 300

/**
 * Search-and-add chips for the job form's skills and certificates.
 *
 * Its menu is an AnchoredOverlay, so it draws above the rest of the form
 * instead of under it (#1334). It lives in its own module because, declared
 * inside JobForm, every JobForm render made it a new component type: React
 * remounted it, the query was lost, and the names of the chosen chips with it.
 */
export function JobTaxonomyPicker<T extends JobTaxonomyItem>({
  selectedIds,
  onChange,
  onSearch,
  placeholder,
  disabled,
  testID,
}: JobTaxonomyPickerProps<T>) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<T[]>([])
  const [open, setOpen] = useState(false)
  // Names for the chips: the ids come from the form, the names from searches.
  const [chosen, setChosen] = useState<Map<string, T>>(new Map())
  const anchorRef = useRef<View>(null)
  const listboxId = `job-taxonomy-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

  const onSearchRef = useRef(onSearch)
  onSearchRef.current = onSearch
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const latest = useRef(0)

  useEffect(() => () => clearTimeout(timer.current), [])

  const search = (text: string) => {
    clearTimeout(timer.current)
    if (!text.trim()) {
      setResults([])
      setOpen(false)
      return
    }
    timer.current = setTimeout(async () => {
      const ticket = ++latest.current
      try {
        const found = await onSearchRef.current(text)
        if (ticket !== latest.current) return // a newer query answered first
        setResults(found)
        setOpen(true)
      } catch (error) {
        console.error('Job form search failed:', error)
      }
    }, SEARCH_DEBOUNCE_MS)
  }

  const available = results.filter((item) => !selectedIds.includes(item.id))
  const menuOpen = open && available.length > 0

  const add = (item: T) => {
    if (!selectedIds.includes(item.id)) {
      setChosen((prev) => new Map(prev).set(item.id, item))
      onChange([...selectedIds, item.id])
    }
    setQuery('')
    setResults([])
    setOpen(false)
  }

  const remove = (id: string) => onChange(selectedIds.filter((existing) => existing !== id))

  const nav = useListboxNavigation({
    id: listboxId,
    itemCount: available.length,
    open: menuOpen,
    onSelectIndex: (index) => {
      const item = available[index]
      if (item) add(item)
    },
    onClose: () => setOpen(false),
  })

  const chips = selectedIds
    .map((id) => chosen.get(id))
    .filter((item): item is T => item !== undefined)

  return (
    <Stack gap={8}>
      <View ref={anchorRef}>
        <Input
          placeholder={placeholder}
          value={query}
          onChangeText={(text) => {
            setQuery(text)
            search(text)
          }}
          onFocus={() => query.trim() && results.length > 0 && setOpen(true)}
          disabled={disabled}
          testID={testID}
          {...nav.inputProps}
        />
      </View>
      {chips.length > 0 && (
        <Row gap={8} wrap>
          {chips.map((item) => (
            <Row
              key={item.id}
              style={{ backgroundColor: colors.bg[t].muted }}
              paddingHorizontal={8}
              paddingVertical={4}
              borderRadius={borderRadius.l}
              gap={4}
              align="center"
            >
              <Text>{item.name}</Text>
              <Button
                size="sm"
                variant="text"
                onPress={() => remove(item.id)}
                disabled={disabled}
                aria-label={`Remove ${item.name}`}
              >
                <X size={16} />
              </Button>
            </Row>
          ))}
        </Row>
      )}

      {/* Results menu — portalled above the page on web (#1330, #1334) */}
      <AnchoredOverlay
        anchorRef={anchorRef}
        open={menuOpen}
        onRequestClose={() => setOpen(false)}
        maxHeight={300}
        testID={testID ? `${testID}-results` : undefined}
        {...nav.listboxProps}
      >
        {available.map((item, index) => (
          <Pressable
            key={item.id}
            onPress={() => add(item)}
            {...nav.getOptionProps(index)}
            style={({ pressed }) => getMenuItemStyle(t, { active: nav.activeIndex === index, pressed })}
          >
            <Text size="sm">{item.name}</Text>
          </Pressable>
        ))}
      </AnchoredOverlay>
    </Stack>
  )
}
