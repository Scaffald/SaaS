/**
 * ListItem component
 * Flexible list item component with multiple variants
 *
 * @example
 * ```tsx
 * import { ListItem } from '@scaffald/ui'
 *
 * // User profile variant
 * <ListItem
 *   variant="user-profile-01"
 *   name="Tina Hernandez"
 *   username="@tinahernan90"
 *   description="Passionate Senior Product Designer"
 *   avatarSrc="https://example.com/avatar.jpg"
 *   onFollowPress={() => console.log('Follow')}
 * />
 *
 * // Task variant
 * <ListItem
 *   variant="task"
 *   title="Opportunity 4"
 *   metadata="Opportunity Pipeline"
 *   updatedText="Updated 10 min ago"
 *   iconColor="success"
 * />
 * ```
 */

import { View, Text, Pressable, Image, Platform } from 'react-native'
import { ChevronRight, ArrowUpRight, Check } from 'lucide-react-native'
import type { ListItemProps } from './ListItem.types'
import { getListItemStyles } from './ListItem.styles'
import { useThemeContext } from '../../theme'
import { useStyles } from '../../hooks'
import { Avatar } from '../Avatar'
import { Button } from '../Button'
import { Chip } from '../Chip'
import { Breadcrumb } from '../Breadcrumb'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { typographyVariants } from '../../tokens/typography'

export function ListItem(props: ListItemProps) {
  const { theme } = useThemeContext()
  const { variant, onPress, style, accessibilityLabel } = props
  const styles = useStyles(getListItemStyles, [variant, theme] as const)

  // Render based on variant
  const renderContent = () => {
    switch (variant) {
      case 'user-profile-01': {
        const {
          avatarSrc,
          avatarInitials,
          name,
          username,
          description,
          onFollowPress,
          showVerified,
        } = props

        return (
          <View style={[styles.container, style]}>
            {/* Avatar */}
            <View style={styles.leftSection}>
              <Avatar
                size={48}
                src={avatarSrc}
                initials={avatarInitials}
                status={showVerified ? 'online' : undefined}
                verified={showVerified}
              />
            </View>

            {/* Content */}
            <View style={styles.contentSection}>
              {/* Name and username */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[4] }}>
                <Text style={styles.title}>{name}</Text>
                {showVerified && (
                  <View
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: colors.primary[500],
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: colors.gray[0], fontSize: 10 }}>✓</Text>
                  </View>
                )}
                <Text style={styles.subtitle}>{username}</Text>
              </View>

              {/* Description */}
              {description && <Text style={styles.description}>{description}</Text>}
            </View>

            {/* Follow button */}
            {onFollowPress && (
              <View style={styles.rightSection}>
                <Button
                  color="primary"
                  variant="filled"
                  size="sm"
                  onPress={onFollowPress}
                  style={{ minWidth: 80 }}
                >
                  Follow
                </Button>
              </View>
            )}
          </View>
        )
      }

      case 'user-profile-02': {
        const { avatarSrc, avatarInitials, name, username, subscriptionDate, onViewProfilePress } =
          props

        return (
          <View style={[styles.container, style]}>
            {/* Avatar */}
            <View style={styles.leftSection}>
              <Avatar size={48} src={avatarSrc} initials={avatarInitials} />
            </View>

            {/* Content */}
            <View style={styles.contentSection}>
              {/* Name and username */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[4] }}>
                <Text style={styles.title}>{name}</Text>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.gray[700],
                  }}
                />
                <Text style={styles.subtitle}>{username}</Text>
              </View>

              {/* Subscription date */}
              {subscriptionDate && (
                <Text style={styles.subtitle}>Subscribed on {subscriptionDate}</Text>
              )}
            </View>

            {/* View Profile button */}
            {onViewProfilePress && (
              <View style={styles.rightSection}>
                <Pressable
                  onPress={onViewProfilePress}
                  style={{
                    paddingHorizontal: spacing[16],
                    paddingVertical: spacing[8],
                    borderRadius: borderRadius.s,
                    backgroundColor: colors.bg[theme].subtle || colors.gray[50],
                  }}
                >
                  <Text
                    style={{
                      fontFamily: typographyVariants.paragraphSMedium.fontFamily,
                      fontSize: typographyVariants.paragraphSMedium.fontSize,
                      fontWeight: typographyVariants.paragraphSMedium.fontWeight,
                      lineHeight: typographyVariants.paragraphSMedium.lineHeight,
                      color: colors.text[theme].secondary,
                    }}
                  >
                    View Profile
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        )
      }

      case 'product': {
        const { logo, logoSrc, name, tags, count, onActionPress } = props

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

      case 'search-result-01': {
        const { title, timestamp, breadcrumbs, description, onReadMorePress } = props

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

      case 'search-result-02': {
        const { title, description, authorName, authorAvatarSrc, authorAvatarInitials, updatedText } =
          props

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

      case 'search-result-03': {
        const { icon, iconSrc, title, description } = props

        return (
          <View style={[styles.container, style]}>
            {/* Featured Icon with gradient background */}
            <View style={styles.leftSection}>
              {icon || (iconSrc && <Image source={{ uri: iconSrc }} style={{ width: 40, height: 40 }} />) || (
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: borderRadius.l,
                    ...(Platform.OS === 'web'
                      ? {
                          background: `linear-gradient(to bottom, ${colors.bg[theme].subtle || colors.gray[50]}, ${colors.bg[theme].default || colors.gray[100]})`,
                          boxShadow: `0px 0px 0px 2px ${colors.gray[0]}, 0px 0px 0px 3px ${colors.gray[100]}`,
                        }
                      : {
                          backgroundColor: colors.bg[theme].subtle || colors.gray[50],
                        }),
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 20 }}>⚙️</Text>
                </View>
              )}
            </View>

            {/* Content */}
            <View style={styles.contentSection}>
              <Text style={styles.title}>{title}</Text>
              {description && <Text style={styles.description}>{description}</Text>}
            </View>
          </View>
        )
      }

      case 'task': {
        const { iconColor = 'success', icon, title, metadata, updatedText } = props

        const iconColors = {
          success: colors.success[500],
          error: colors.error[500],
          warning: colors.warning[500],
          info: colors.info[500],
        }

        return (
          <View style={[styles.container, style]}>
            {/* Colored icon */}
            <View style={styles.leftSection}>
              {icon || (
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: iconColors[iconColor],
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Check size={16} color={colors.gray[0]} />
                </View>
              )}
            </View>

            {/* Content */}
            <View style={styles.contentSection}>
              <Text style={styles.title}>{title}</Text>
              {/* Metadata with dot separators */}
              {(metadata || updatedText) && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
                  {metadata && (
                    <>
                      <Text style={styles.metadata}>{metadata}</Text>
                      {updatedText && (
                        <>
                          <View
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: colors.gray[700],
                            }}
                          />
                          <Text style={styles.metadata}>{updatedText}</Text>
                        </>
                      )}
                    </>
                  )}
                </View>
              )}
            </View>
          </View>
        )
      }

      case 'song-title': {
        const { imageSrc, imagePlaceholder, title, type, artist, year } = props

        return (
          <View style={[styles.container, style]}>
            {/* Image */}
            <View style={styles.leftSection}>
              {imageSrc ? (
                <Image
                  source={{ uri: imageSrc }}
                  style={{ width: 50, height: 50, borderRadius: borderRadius.s }}
                />
              ) : (
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: borderRadius.s,
                    backgroundColor: colors.gray[300],
                  }}
                />
              )}
            </View>

            {/* Content */}
            <View style={styles.contentSection}>
              <Text style={styles.title}>{title}</Text>
              {/* Metadata with dot separators */}
              {(type || artist || year) && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
                  {type && <Text style={styles.subtitle}>{type}</Text>}
                  {artist && (
                    <>
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: colors.gray[700],
                        }}
                      />
                      <Text style={styles.subtitle}>{artist}</Text>
                    </>
                  )}
                  {year && (
                    <>
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: colors.gray[700],
                        }}
                      />
                      <Text style={styles.subtitle}>{year}</Text>
                    </>
                  )}
                </View>
              )}
            </View>
          </View>
        )
      }

      case 'cloud-file': {
        const { icon, iconSrc, name, service, size } = props

        return (
          <View style={[styles.container, style]}>
            {/* Featured Icon with gradient background */}
            <View style={styles.leftSection}>
              {icon || (iconSrc && <Image source={{ uri: iconSrc }} style={{ width: 40, height: 40 }} />) || (
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: borderRadius.l,
                    ...(Platform.OS === 'web'
                      ? {
                          background: `linear-gradient(to bottom, ${colors.bg[theme].subtle || colors.gray[50]}, ${colors.bg[theme].default || colors.gray[100]})`,
                          boxShadow: `0px 0px 0px 2px ${colors.gray[0]}, 0px 0px 0px 3px ${colors.gray[100]}`,
                        }
                      : {
                          backgroundColor: colors.bg[theme].subtle || colors.gray[50],
                        }),
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 20 }}>📁</Text>
                </View>
              )}
            </View>

            {/* Content */}
            <View style={styles.contentSection}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[8] }}>
                <Text style={styles.title}>{name}</Text>
                {/* Metadata with dot separators */}
                {(service || size) && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
                    {service && (
                      <>
                        <Text style={styles.subtitle}>{service}</Text>
                        {size && (
                          <>
                            <View
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: colors.gray[700],
                              }}
                            />
                            <Text style={styles.subtitle}>{size}</Text>
                          </>
                        )}
                      </>
                    )}
                  </View>
                )}
              </View>
            </View>
          </View>
        )
      }

      case 'phone-number': {
        const { flagIcon, flagSrc, countryCode, countryName } = props

        return (
          <View style={[styles.container, style]}>
            {/* Flag */}
            <View style={styles.leftSection}>
              {flagIcon || (flagSrc && <Image source={{ uri: flagSrc }} style={{ width: 28, height: 28 }} />) || (
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: borderRadius.xs,
                    backgroundColor: colors.gray[200],
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 16 }}>🇺🇸</Text>
                </View>
              )}
            </View>

            {/* Content - horizontal layout */}
            <View style={[styles.contentSection, { flexDirection: 'row', alignItems: 'center', gap: spacing[10] }]}>
              <Text style={styles.title}>{countryCode}</Text>
              <Text style={styles.subtitle}>{countryName}</Text>
            </View>
          </View>
        )
      }

      case 'integration': {
        const { icon, iconSrc, name } = props

        return (
          <View style={[styles.container, style]}>
            {/* Icon */}
            <View style={styles.leftSection}>
              {icon || (iconSrc && <Image source={{ uri: iconSrc }} style={{ width: 24, height: 24 }} />) || (
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: borderRadius.xs,
                    backgroundColor: colors.gray[200],
                  }}
                />
              )}
            </View>

            {/* Content */}
            <View style={styles.contentSection}>
              <Text style={styles.title}>{name}</Text>
            </View>

            {/* Chevron */}
            <View style={styles.rightSection}>
              <ChevronRight size={24} color={colors.text[theme].tertiary} />
            </View>
          </View>
        )
      }

      default:
        return null
    }
  }

  const content = renderContent()

  if (!content) {
    return null
  }

  // Wrap in Pressable if onPress is provided
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        {...(Platform.OS === 'web' && {
          onMouseEnter: () => {},
          onMouseLeave: () => {},
        } as any)}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
      >
        {content}
      </Pressable>
    )
  }

  return <View accessibilityLabel={accessibilityLabel}>{content}</View>
}
