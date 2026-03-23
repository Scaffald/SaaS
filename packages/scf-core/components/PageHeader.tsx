import { ChevronDown, ChevronUp, RotateCcw, Search, X } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { memo, useState } from 'react'
import { Pressable } from 'react-native'
import type { ViewStyle } from 'react-native'
import {
  Breadcrumb,
  Input,
  Popover,
  PopoverContent,
  Row,
  Stack,
  Text,
  useResponsive,
  useThemeContext,
} from '@scaffald/ui'
import type { BreadcrumbItemData } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import type { ResolvedThemeMode } from '@scaffald/ui/tokens'
import { filterPillGlassStyle } from '@scf/core/components/ui'

// ---------------------------------------------------------------------------
// Filter pill config (data-driven inline filter buttons)
// ---------------------------------------------------------------------------

export type FilterPillConfig = {
  /** Unique key */
  id: string
  /** Display label, e.g. "Trade" */
  label: string
  /** Currently selected value text, e.g. "Construction" */
  value?: string
  /** Callback when pill is pressed (used when no popoverContent) */
  onPress: () => void
  /** Whether the pill is in an "active/filtered" state */
  isActive?: boolean
  /**
   * When provided, the pill becomes a popover trigger (desktop) or
   * toggles an inline expandable panel (mobile). `onPress` is ignored.
   */
  popoverContent?: ReactNode
}

// ---------------------------------------------------------------------------
// PageHeader props
// ---------------------------------------------------------------------------

type PageHeaderProps = {
  // Row 1 — Breadcrumbs & Quick Actions
  breadcrumbItems?: BreadcrumbItemData[]
  actions?: ReactNode

  // Row 2 — Search / Filter / Sort
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  renderSearch?: () => ReactNode
  searchVariant?: 'default' | 'pill'
  filterPills?: FilterPillConfig[]
  resultCount?: number
  resultLabel?: string
  onReset?: () => void
  children?: ReactNode
  style?: ViewStyle
}

// ---------------------------------------------------------------------------
// Internal: FilterPill — desktop uses Popover, mobile uses onPress callback
// ---------------------------------------------------------------------------

function FilterPillDesktop({
  label,
  value,
  onPress,
  isActive = false,
  popoverContent,
  theme,
}: Omit<FilterPillConfig, 'id'> & { theme: ResolvedThemeMode }) {
  const [popoverOpen, setPopoverOpen] = useState(false)

  const pillText = isActive
    ? colors.text[theme].primary
    : colors.text[theme].secondary

  const pillElement = (
    <Pressable
      onPress={popoverContent ? () => setPopoverOpen((v) => !v) : onPress}
      style={filterPillGlassStyle(theme, isActive || popoverOpen)}
      accessibilityRole="button"
      accessibilityLabel={`${label} filter${value ? `: ${value}` : ''}`}
    >
      <Text style={{ fontSize: 12, fontWeight: '600', color: pillText }} numberOfLines={1}>
        {value ? `${label}: ${value}` : label}
      </Text>
      <ChevronDown size={14} color={pillText} />
    </Pressable>
  )

  if (!popoverContent) return pillElement

  return (
    <Popover
      placement="bottom"
      trigger="manual"
      open={popoverOpen}
      onOpenChange={setPopoverOpen}
      showArrow
      offset={6}
      content={<PopoverContent>{popoverContent}</PopoverContent>}
    >
      {pillElement}
    </Popover>
  )
}

function FilterPillMobile({
  label,
  value,
  onPress,
  isActive = false,
  isExpanded = false,
  hasPopoverContent = false,
  onToggleExpand,
  theme,
}: Omit<FilterPillConfig, 'id' | 'popoverContent'> & {
  theme: ResolvedThemeMode
  isExpanded: boolean
  hasPopoverContent: boolean
  onToggleExpand: () => void
}) {
  const pillText = isActive
    ? colors.text[theme].primary
    : colors.text[theme].secondary

  const Chevron = isExpanded ? ChevronUp : ChevronDown

  return (
    <Pressable
      onPress={hasPopoverContent ? onToggleExpand : onPress}
      style={filterPillGlassStyle(theme, isActive || isExpanded)}
      accessibilityRole="button"
      accessibilityLabel={`${label} filter${value ? `: ${value}` : ''}`}
    >
      <Text style={{ fontSize: 12, fontWeight: '600', color: pillText }} numberOfLines={1}>
        {value ? `${label}: ${value}` : label}
      </Text>
      <Chevron size={14} color={pillText} />
    </Pressable>
  )
}

// ---------------------------------------------------------------------------
// PageHeader
// ---------------------------------------------------------------------------

export const PageHeader = memo(function PageHeader({
  breadcrumbItems,
  actions,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  renderSearch,
  searchVariant = 'default',
  filterPills,
  resultCount,
  resultLabel,
  onReset,
  children,
  style,
}: PageHeaderProps) {
  const { theme } = useThemeContext()
  const { isMobile } = useResponsive()
  const isDark = theme === 'dark'
  const borderColor = isDark ? 'rgba(80, 73, 64, 0.3)' : 'rgba(237, 221, 201, 0.5)'

  // Track which pill's inline panel is expanded on mobile
  const [expandedPillId, setExpandedPillId] = useState<string | null>(null)

  const showBreadcrumbRow = (breadcrumbItems && breadcrumbItems.length > 0) || actions
  const showSearchRow = onSearchChange != null || renderSearch != null
  const hasSearch = (searchValue ?? '').length > 0

  // Find the expanded pill's popoverContent for inline rendering on mobile
  const expandedPill = isMobile && expandedPillId
    ? filterPills?.find((p) => p.id === expandedPillId && p.popoverContent)
    : null

  return (
    <Stack
      width="100%"
      style={{
        ...(showSearchRow
          ? { borderBottomWidth: 1, borderBottomColor: borderColor }
          : undefined),
        ...style,
      }}
    >
      {/* Row 1 — Breadcrumbs & Actions */}
      {showBreadcrumbRow && (
        <Row
          width="100%"
          paddingHorizontal={16}
          paddingVertical={8}
          align="center"
          justify="space-between"
        >
          {breadcrumbItems && breadcrumbItems.length > 0 ? (
            <Breadcrumb
              items={breadcrumbItems}
              currentIndex={breadcrumbItems.length - 1}
            />
          ) : (
            <Stack />
          )}
          {actions && <Row gap={8} align="center">{actions}</Row>}
        </Row>
      )}

      {/* Row 2 — Search / Filter / Sort */}
      {showSearchRow && (
        <Stack width="100%" style={{ paddingVertical: 8, gap: isMobile ? 8 : 0 }}>
          {/* Search Input — own row on mobile, inline on desktop */}
          <Row width="100%" gap={8} align="center">
            <Stack flex={1} minWidth={120}>
              {renderSearch ? (
                renderSearch()
              ) : (
                <Input
                  placeholder={searchPlaceholder}
                  value={searchValue ?? ''}
                  onChangeText={onSearchChange}
                  iconStart={Search}
                  iconEnd={hasSearch ? X : undefined}
                  iconEndOnPress={hasSearch ? () => onSearchChange?.('') : undefined}
                  iconEndAccessibilityLabel={hasSearch ? 'Clear search' : undefined}
                  {...(searchVariant === 'pill' ? { style: { borderRadius: 9999 } } : {})}
                />
              )}
            </Stack>

            {/* Desktop: filter pills inline with search */}
            {!isMobile && filterPills && filterPills.length > 0 && (
              <Row gap={8} align="center" wrap>
                {filterPills.map((pill) => (
                  <FilterPillDesktop
                    key={pill.id}
                    label={pill.label}
                    value={pill.value}
                    onPress={pill.onPress}
                    isActive={pill.isActive}
                    popoverContent={pill.popoverContent}
                    theme={theme}
                  />
                ))}
              </Row>
            )}

            {!isMobile && children}

            {!isMobile && resultCount !== undefined && (
              <Text
                style={{ fontSize: 14, fontWeight: '500', color: colors.text[theme].secondary }}
                numberOfLines={1}
              >
                {resultCount} {resultLabel ?? (resultCount === 1 ? 'result' : 'results')}
              </Text>
            )}

            {!isMobile && onReset && (
              <Pressable
                onPress={onReset}
                style={filterPillGlassStyle(theme, false)}
                accessibilityRole="button"
                accessibilityLabel="Reset filters and search"
              >
                <RotateCcw size={14} color={colors.text[theme].secondary} />
              </Pressable>
            )}
          </Row>

          {/* Mobile: filter pills on their own row */}
          {isMobile && (filterPills?.length || children || resultCount !== undefined || onReset) && (
            <Row gap={8} align="center" wrap>
              {filterPills && filterPills.length > 0 &&
                filterPills.map((pill) => (
                  <FilterPillMobile
                    key={pill.id}
                    label={pill.label}
                    value={pill.value}
                    onPress={pill.onPress}
                    isActive={pill.isActive}
                    isExpanded={expandedPillId === pill.id}
                    hasPopoverContent={!!pill.popoverContent}
                    onToggleExpand={() =>
                      setExpandedPillId((prev) => (prev === pill.id ? null : pill.id))
                    }
                    theme={theme}
                  />
                ))}

              {children}

              {resultCount !== undefined && (
                <Text
                  style={{ fontSize: 14, fontWeight: '500', color: colors.text[theme].secondary }}
                  numberOfLines={1}
                >
                  {resultCount} {resultLabel ?? (resultCount === 1 ? 'result' : 'results')}
                </Text>
              )}

              {onReset && (
                <Pressable
                  onPress={onReset}
                  style={filterPillGlassStyle(theme, false)}
                  accessibilityRole="button"
                  accessibilityLabel="Reset filters and search"
                >
                  <RotateCcw size={14} color={colors.text[theme].secondary} />
                </Pressable>
              )}
            </Row>
          )}

          {/* Mobile: inline expanded panel for the active pill's content */}
          {expandedPill && (
            <Stack
              width="100%"
              style={{
                paddingVertical: 8,
                paddingHorizontal: 4,
              }}
            >
              {expandedPill.popoverContent}
            </Stack>
          )}
        </Stack>
      )}
    </Stack>
  )
})
