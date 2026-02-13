/**
 * ProductListItem component
 * Product list item with logo, tags, and action button
 *
 * @example
 * ```tsx
 * import { ProductListItem } from '@scaffald/ui'
 *
 * <ProductListItem
 *   name="Product Name"
 *   logoSrc="https://example.com/logo.png"
 *   tags={['Tag 1', 'Tag 2', 'Tag 3']}
 *   count={42}
 *   onActionPress={() => console.log('Action')}
 * />
 * ```
 */

import { View, Text, Pressable, Image } from 'react-native'
import { ArrowUpRight } from 'lucide-react-native'
import type { ProductProps } from '../ListItem.types'
import { getListItemStyles } from '../ListItem.styles'
import { useThemeContext } from '../../../theme'
import { Chip } from '../../Chip'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'
import { borderRadius } from '../../../tokens/borders'
import { typographyVariants } from '../../../tokens/typography'

export function ProductListItem({
  logo,
  logoSrc,
  name,
  tags,
  count,
  onActionPress,
  onPress,
  style,
  accessibilityLabel,
}: Omit<ProductProps, 'variant'>) {
  const { theme } = useThemeContext()
  const styles = getListItemStyles('product', theme)

  return (
    <View style={[styles.container, style]}>
      {/* Logo */}
      <View style={styles.leftSection}>
        {logo || (logoSrc && <Image source={{ uri: logoSrc }} style={{ width: 48, height: 48, borderRadius: borderRadius.s }} />) || (
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: borderRadius.s,
              backgroundColor: colors.primary[500],
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: colors.gray[0], fontSize: 24 }}>*</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.contentSection}>
        <Text style={styles.title}>{name}</Text>
        {/* Tags */}
        {tags && tags.length > 0 && (
          <View style={{ flexDirection: 'row', gap: spacing[6], flexWrap: 'wrap' }}>
            {tags.map((tag, index) => (
              <Chip key={index} size="sm" type="default">
                {tag}
              </Chip>
            ))}
          </View>
        )}
      </View>

      {/* Action button with count */}
      {onActionPress && (
        <View style={styles.rightSection}>
          <Pressable
            onPress={onActionPress}
            style={{
              width: 48,
              height: 48,
              borderWidth: 1,
              borderColor: colors.border[theme].default,
              borderRadius: borderRadius.s,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: spacing[4],
            }}
          >
            <ArrowUpRight size={24} color={colors.text[theme].primary} />
            {count !== undefined && (
              <Text
                style={{
                  fontFamily: typographyVariants.paragraphSSemiBold.fontFamily,
                  fontSize: typographyVariants.paragraphSSemiBold.fontSize,
                  fontWeight: typographyVariants.paragraphSSemiBold.fontWeight,
                  lineHeight: typographyVariants.paragraphSSemiBold.lineHeight,
                  letterSpacing: parseFloat(typographyVariants.paragraphSSemiBold.letterSpacing || '0'),
                  color: colors.text[theme].primary,
                }}
              >
                {count}
              </Text>
            )}
          </Pressable>
        </View>
      )}
    </View>
  )
}
