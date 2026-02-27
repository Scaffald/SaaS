/**
 * SearchResult01ListItem component
 * Search result list item with title, breadcrumbs, and description
 *
 * @example
 * ```tsx
 * import { SearchResult01ListItem } from '@scaffald/ui'
 *
 * <SearchResult01ListItem
 *   title="Search Result Title"
 *   timestamp="2 hours ago"
 *   breadcrumbs={[
 *     { label: 'Home', href: '/' },
 *     { label: 'Category', href: '/category' },
 *     { label: 'Page' }
 *   ]}
 *   description="This is a description of the search result..."
 *   onReadMorePress={() => console.log('Read more')}
 * />
 * ```
 */

import { View, Text } from 'react-native'
import type { SearchResult01Props } from '../ListItem.types'
import { getListItemStyles } from '../ListItem.styles'
import { useThemeContext } from '../../../theme'
import { Breadcrumb } from '../../Breadcrumb'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'
import { typographyVariants } from '../../../tokens/typography'

export function SearchResult01ListItem({
  title,
  timestamp,
  breadcrumbs,
  description,
  onReadMorePress,
  onPress,
  style,
  accessibilityLabel,
}: Omit<SearchResult01Props, 'variant'>) {
  const { theme } = useThemeContext()
  const styles = getListItemStyles('search-result-01', theme)

  return (
    <View style={[styles.container, style]}>
      <View style={styles.contentSection}>
        {/* Title and timestamp */}
        <View style={{ gap: spacing[4] }}>
          <Text style={styles.title}>{title}</Text>
          {timestamp && <Text style={styles.subtitle}>{timestamp}</Text>}
        </View>

        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumb
            items={breadcrumbs.map((b) => ({ label: b.label, href: b.href }))}
            currentIndex={breadcrumbs.length - 1}
          />
        )}

        {/* Description with Read more */}
        {description && (
          <Text style={styles.description}>
            {description}
            {onReadMorePress && (
              <Text
                style={{
                  color: colors.primary[500],
                  fontFamily: typographyVariants.paragraphSRegular.fontFamily,
                  fontSize: typographyVariants.paragraphSRegular.fontSize,
                  fontWeight: typographyVariants.paragraphSRegular.fontWeight,
                  lineHeight: typographyVariants.paragraphSRegular.lineHeight,
                }}
                onPress={onReadMorePress}
              >
                {' '}...Read more
              </Text>
            )}
          </Text>
        )}
      </View>
    </View>
  )
}
