/**
 * TableCell component
 * Flexible table cell component with 30+ type variants
 *
 * @example
 * ```tsx
 * import { TableCell } from '@unicornlove/beyond-ui'
 *
 * // Text cell
 * <TableCell type="text-default" text="Cell content" description="Secondary text" />
 *
 * // Avatar cell
 * <TableCell type="avatar" text="John Doe" description="john@email.com" avatar={avatarSrc} />
 *
 * // Status cell
 * <TableCell type="status" statusType="success" statusLabel="Active" />
 * ```
 */

import { useState } from 'react'
import { View, Text, Pressable, Image, Platform } from 'react-native'
import {
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Share2,
  Download,
  Edit,
  Trash2,
  ArrowUpRight,
  Star,
} from 'lucide-react-native'
import type { TableCellProps } from './TableCell.types'
import { getTableCellStyles } from './TableCell.styles'
import { useThemeContext } from '../../playground/ThemeProvider'
import { Checkbox } from '../Checkbox'
import { Radio } from '../Radio'
import { Toggle } from '../Toggle'
import { StatusIndicator } from '../StatusIndicator'
import { ProgressBarBase } from '../ProgressBar'
import { Chip } from '../Chip'
import { Avatar } from '../Avatar'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { borderWidth } from '../../tokens/borders'

/**
 * TableCell component
 */
export function TableCell({
  type = 'interactive-default',
  state = 'default',
  align = 'left',
  width,
  style,
  textStyle,
  text,
  description,
  showCheckbox,
  showRadio,
  showSwitch,
  checked,
  radioChecked,
  switchChecked,
  onSelectionChange,
  avatar,
  showIndicator,
  avatars,
  maxAvatars = 3,
  cardIcon,
  expirationDate,
  fileType,
  fileSize,
  fileIcon,
  brandIcon,
  brandHandle,
  flag,
  countryCode,
  logo,
  cryptoIcon,
  symbol,
  trendIcon,
  trendDirection,
  trendValue,
  statusType,
  statusLabel,
  statusStyle,
  labels,
  maxLabels = 3,
  actions,
  maxActions = 4,
  progress,
  progressColor = 'primary',
  rating,
  maxRating = 5,
  chartType,
  chartData,
  chartComponent,
  onPress,
  onIconPress,
  onMorePress,
  children,
  ...pressableProps
}: TableCellProps) {
  const { theme } = useThemeContext()
  const [isHovered, setIsHovered] = useState(false)

  // Get styles for current type, state, and theme
  const styles = getTableCellStyles(
    type,
    isHovered && state === 'default' ? 'hover' : state,
    align,
    theme,
    width
  )

  // Handle selection change
  const handleSelectionChange = (newChecked: boolean) => {
    onSelectionChange?.(newChecked)
  }

  // Render selection controls
  const renderSelectionControl = () => {
    if (type === 'checkbox-only') {
      return (
        <Checkbox
          checked={checked || false}
          onChange={handleSelectionChange}
          size="md"
          color="primary"
          containerStyle={{ margin: 0 }}
        />
      )
    }
    if (type === 'radio-only') {
      return (
        <Radio
          checked={radioChecked || checked || false}
          onChange={handleSelectionChange}
          size="md"
          color="primary"
          containerStyle={{ margin: 0 }}
        />
      )
    }
    if (type === 'switch-only') {
      return (
        <Toggle
          checked={switchChecked || checked || false}
          onChange={handleSelectionChange}
          size="md"
          color="primary"
          containerStyle={{ margin: 0 }}
        />
      )
    }

    // Show controls for text-based cells
    if (showCheckbox) {
      return (
        <Checkbox
          checked={checked || false}
          onChange={handleSelectionChange}
          size="md"
          color="primary"
          containerStyle={{ margin: 0 }}
        />
      )
    }
    if (showRadio) {
      return (
        <Radio
          checked={radioChecked || checked || false}
          onChange={handleSelectionChange}
          size="md"
          color="primary"
          containerStyle={{ margin: 0 }}
        />
      )
    }
    if (showSwitch) {
      return (
        <Toggle
          checked={switchChecked || checked || false}
          onChange={handleSelectionChange}
          size="md"
          color="primary"
          containerStyle={{ margin: 0 }}
        />
      )
    }

    return null
  }

  // Render empty cell
  if (type === 'empty') {
    return <View style={[styles.container, style]} />
  }

  // Render guideline cells
  if (type.startsWith('guideline-vertical-')) {
    const isFull = type === 'guideline-vertical-full'
    const isHalf = type === 'guideline-vertical-half'
    const isFAndH = type === 'guideline-vertical-f-h'

    return (
      <View style={[styles.container, style]}>
        {isFull && (
          <View
            style={{
              width: 1,
              height: '100%',
              backgroundColor: colors.border[theme].default,
            }}
          />
        )}
        {(isHalf || isFAndH) && (
          <>
            <View
              style={{
                width: 1,
                height: isHalf ? '50%' : '100%',
                backgroundColor: colors.border[theme].default,
              }}
            />
            {isFAndH && (
              <View
                style={{
                  width: 19,
                  height: '50%',
                  borderLeftWidth: borderWidth.thin,
                  borderLeftColor: colors.border[theme].default,
                  borderBottomWidth: borderWidth.thin,
                  borderBottomColor: colors.border[theme].default,
                }}
              />
            )}
          </>
        )}
      </View>
    )
  }

  // Render interactive cells
  if (type.startsWith('interactive-')) {
    const Container = onPress ? Pressable : View

    return (
      <Container
        // @ts-expect-error - web-specific props
        onMouseEnter={Platform.OS === 'web' && onPress ? () => setIsHovered(true) : undefined}
        // @ts-expect-error - web-specific props
        onMouseLeave={Platform.OS === 'web' && onPress ? () => setIsHovered(false) : undefined}
        onPress={onPress}
        style={({ pressed }) => [
          styles.container,
          pressed && Platform.OS !== 'web' && { opacity: 0.8 },
          style,
        ]}
        {...pressableProps}
      >
        {text && <Text style={[styles.text, textStyle]}>{text}</Text>}
      </Container>
    )
  }

  // Render checkbox/radio/switch only cells
  if (type === 'checkbox-only' || type === 'radio-only' || type === 'switch-only') {
    return (
      <View style={[styles.container, style]}>
        {renderSelectionControl()}
      </View>
    )
  }

  // Render icon cells (open/close)
  if (type === 'icon-open' || type === 'icon-close') {
    const Icon = type === 'icon-open' ? ChevronRight : ChevronDown

    return (
      <Pressable
        onPress={onIconPress || onPress}
        style={[styles.container, style]}
        {...pressableProps}
      >
        <Icon size={20} color={styles.iconColor || colors.text[theme].secondary} />
      </Pressable>
    )
  }

  // Render status cell
  if (type === 'status') {
    return (
      <View style={[styles.container, style]}>
        <StatusIndicator
          type={statusType || 'success'}
          variant={statusStyle || 'light'}
          label={statusLabel}
        />
      </View>
    )
  }

  // Render labels cell
  if (type === 'labels') {
    const displayLabels = labels?.slice(0, maxLabels) || []
    const remainingCount = (labels?.length || 0) - maxLabels

    return (
      <View style={[styles.container, style]}>
        {displayLabels.map((label, index) => {
          if (typeof label === 'string') {
            return (
              <Chip key={index} size="sm" type="default">
                {label}
              </Chip>
            )
          }
          return <View key={index}>{label}</View>
        })}
        {remainingCount > 0 && (
          <Chip size="sm" type="default">
            +{remainingCount}
          </Chip>
        )}
      </View>
    )
  }

  // Render actions cell
  if (type === 'actions') {
    const displayActions = actions?.slice(0, maxActions) || []

    return (
      <View style={[styles.container, style]}>
        {displayActions.map((action, index) => {
          const Icon = action.icon
          return (
            <Pressable
              key={index}
              onPress={action.onPress}
              style={{ padding: spacing[4] }}
              accessibilityLabel={action.label}
            >
              <Icon size={20} color={styles.iconColor || colors.text[theme].secondary} />
            </Pressable>
          )
        })}
      </View>
    )
  }

  // Render more cell
  if (type === 'more') {
    return (
      <Pressable
        onPress={onMorePress || onPress}
        style={[styles.container, style]}
        {...pressableProps}
      >
        <MoreVertical size={22} color={styles.iconColor || colors.text[theme].primary} />
      </Pressable>
    )
  }

  // Render progress bar cell
  if (type === 'progress-bar') {
    return (
      <View style={[styles.container, style]}>
        <ProgressBarBase
          value={progress || 0}
          color={progressColor}
          style={{ width: 300, height: 6 }}
        />
      </View>
    )
  }

  // Render rating cell
  if (type === 'rating') {
    const ratingValue = rating || 0
    const stars = Array.from({ length: maxRating }, (_, i) => i + 1)

    return (
      <View style={[styles.container, style]}>
        {stars.map((starNum) => (
          <Star
            key={starNum}
            size={24}
            color={starNum <= ratingValue ? colors.gray[900] : colors.gray[300]}
            fill={starNum <= ratingValue ? colors.gray[900] : 'none'}
          />
        ))}
      </View>
    )
  }

  // Render chart cells
  if (type.startsWith('chart-')) {
    // For now, render placeholder. In a real implementation, you'd use a chart library
    return (
      <View style={[styles.container, style]}>
        {chartComponent || (
          <View
            style={{
              width: '100%',
              height: 40,
              backgroundColor: colors.gray[100],
              borderRadius: borderRadius.xs,
            }}
          >
            <Text style={{ fontSize: 12, color: colors.text[theme].tertiary }}>Chart {chartType}</Text>
          </View>
        )}
      </View>
    )
  }

  // Render text-based cells (default, card, avatar, file, etc.)
  const Container = onPress ? Pressable : View

  return (
    <Container
      // @ts-expect-error - web-specific props
      onMouseEnter={Platform.OS === 'web' && onPress ? () => setIsHovered(true) : undefined}
      // @ts-expect-error - web-specific props
      onMouseLeave={Platform.OS === 'web' && onPress ? () => setIsHovered(false) : undefined}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        pressed && Platform.OS !== 'web' && { opacity: 0.8 },
        style,
      ]}
      {...pressableProps}
    >
      {renderSelectionControl()}

      {/* Avatar cell */}
      {type === 'avatar' && (
        <>
          {typeof avatar === 'string' ? (
            <Avatar size={40} src={avatar} status={showIndicator ? 'online' : undefined} />
          ) : (
            avatar
          )}
        </>
      )}

      {/* Assignee cell (avatar group) */}
      {type === 'assignee' && avatars && (
        <View style={{ flexDirection: 'row', marginLeft: -spacing[14] }}>
          {avatars.slice(0, maxAvatars).map((avatarItem, index) => (
            <View key={index} style={{ marginLeft: index > 0 ? -spacing[14] : 0 }}>
              {typeof avatarItem === 'string' ? (
                <Avatar size={32} src={avatarItem} />
              ) : (
                avatarItem
              )}
            </View>
          ))}
        </View>
      )}

      {/* Card cell */}
      {type === 'card' && (
        <>
          {cardIcon || (
            <View
              style={{
                width: 43,
                height: 30,
                backgroundColor: colors.white,
                borderWidth: borderWidth.thin,
                borderColor: colors.border[theme].default,
                borderRadius: borderRadius.xs,
              }}
            />
          )}
        </>
      )}

      {/* File cell */}
      {type === 'file' && (
        <>
          {fileIcon || (
            <View
              style={{
                width: 32,
                height: 34,
                backgroundColor: colors.error[100],
                borderRadius: borderRadius.xs,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 9, color: colors.text[theme].secondary }}>{fileType || 'PDF'}</Text>
            </View>
          )}
        </>
      )}

      {/* Brand icon cell */}
      {type === 'brand-icon' && brandIcon && <View>{brandIcon}</View>}

      {/* Flag cell */}
      {type === 'flag' && flag && <View>{flag}</View>}

      {/* Company cell */}
      {type === 'company' && logo && <View>{logo}</View>}

      {/* Crypto cell */}
      {type === 'crypto' && (
        <>
          {cryptoIcon || (
            <View
              style={{
                width: 28,
                height: 28,
                backgroundColor: colors.warning[400],
                borderRadius: borderRadius.s,
              }}
            />
          )}
        </>
      )}

      {/* Stock market cell */}
      {type === 'stock-market' && (
        <>
          {trendIcon || (
            <ArrowUpRight
              size={16}
              color={trendDirection === 'up' ? colors.success[500] : colors.error[500]}
            />
          )}
        </>
      )}

      {/* Text content */}
      {text && (
        <View style={{ flex: 1 }}>
          <Text style={[styles.text, textStyle]}>{text}</Text>
          {description && <Text style={styles.descriptionText}>{description}</Text>}
          {type === 'card' && expirationDate && (
            <Text style={styles.descriptionText}>Exp {expirationDate}</Text>
          )}
          {type === 'file' && fileSize && <Text style={styles.descriptionText}>{fileSize}</Text>}
          {type === 'brand-icon' && brandHandle && (
            <Text style={styles.descriptionText}>{brandHandle}</Text>
          )}
          {type === 'flag' && countryCode && <Text style={styles.descriptionText}>{countryCode}</Text>}
          {type === 'crypto' && symbol && <Text style={styles.descriptionText}>{symbol}</Text>}
          {type === 'avatar' && description && (
            <Text style={styles.descriptionText}>{description}</Text>
          )}
        </View>
      )}

      {/* Custom content */}
      {children}
    </Container>
  )
}
