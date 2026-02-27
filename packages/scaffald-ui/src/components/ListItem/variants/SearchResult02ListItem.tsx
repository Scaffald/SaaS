/**
 * SearchResult02ListItem component
 * Search result list item with author information
 *
 * @example
 * ```tsx
 * import { SearchResult02ListItem } from '@scaffald/ui'
 *
 * <SearchResult02ListItem
 *   title="Article Title"
 *   description="This is a description of the article..."
 *   authorName="John Doe"
 *   authorAvatarSrc="https://example.com/avatar.jpg"
 *   updatedText="Updated 2 days ago"
 * />
 * ```
 */

import { View, Text } from 'react-native'
import type { SearchResult02Props } from '../ListItem.types'
import { getListItemStyles } from '../ListItem.styles'
import { useThemeContext } from '../../../theme'
import { Avatar } from '../../Avatar'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'
import { typographyVariants } from '../../../tokens/typography'

export function SearchResult02ListItem({
  title,
  description,
  authorName,
  authorAvatarSrc,
  authorAvatarInitials,
  updatedText,
  onPress,
  style,
  accessibilityLabel,
}: Omit<SearchResult02Props, 'variant'>) {
  const { theme } = useThemeContext()
  const styles = getListItemStyles('search-result-02', theme)

  return (
    <View style={[styles.container, style]}>
      <View style={styles.contentSection}>
        {/* Title and description */}
        <View style={{ gap: spacing[4] }}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>

        {/* Author info */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[8] }}>
          <Avatar size={48} src={authorAvatarSrc} initials={authorAvatarInitials} />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: typographyVariants.paragraphMSemiBold.fontFamily,
                fontSize: typographyVariants.paragraphMSemiBold.fontSize,
                fontWeight: typographyVariants.paragraphMSemiBold.fontWeight,
                lineHeight: typographyVariants.paragraphMSemiBold.lineHeight,
                letterSpacing: parseFloat(typographyVariants.paragraphMSemiBold.letterSpacing || '0'),
                color: colors.text[theme].primary,
              }}
            >
              Written by {authorName}
            </Text>
            {updatedText && (
              <Text
                style={{
                  fontFamily: typographyVariants.paragraphSRegular.fontFamily,
                  fontSize: typographyVariants.paragraphSRegular.fontSize,
                  fontWeight: typographyVariants.paragraphSRegular.fontWeight,
                  lineHeight: typographyVariants.paragraphSRegular.lineHeight,
                  letterSpacing: parseFloat(typographyVariants.paragraphSRegular.letterSpacing || '0'),
                  color: colors.text[theme].tertiary,
                }}
              >
                {updatedText}
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  )
}
