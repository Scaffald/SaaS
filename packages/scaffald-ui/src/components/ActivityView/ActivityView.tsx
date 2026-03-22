/**
 * ActivityView (Share Sheet) component
 * iOS 26 share sheet with glassmorphic design
 *
 * @example
 * ```tsx
 * import { ActivityView } from '@scaffald/ui'
 *
 * <ActivityView
 *   visible={showShare}
 *   onClose={() => setShowShare(false)}
 *   title="My Document"
 *   subtitle="https://example.com"
 *   apps={[
 *     { name: 'Messages', icon: <MessageIcon />, onPress: handleMessages },
 *     { name: 'Mail', icon: <MailIcon />, onPress: handleMail },
 *   ]}
 *   actions={[
 *     { label: 'Copy', icon: <CopyIcon />, onPress: handleCopy },
 *   ]}
 *   sections={[
 *     { items: [{ label: 'Add to Favorites', icon: <StarIcon />, onPress: handleFav }] },
 *   ]}
 * />
 * ```
 */

import { useCallback, useMemo, useRef, useEffect } from 'react'
import {
  Modal,
  Pressable,
  Text,
  View,
  ScrollView,
  Image,
  Animated,
  Dimensions,
  Platform,
} from 'react-native'
import type { ActivityViewProps } from './ActivityView.types'
import { getActivityViewStyles } from './ActivityView.styles'
import { useThemeContext } from '../../theme'

export function ActivityView({
  visible,
  onClose,
  title,
  subtitle,
  thumbnail,
  collaborate,
  contacts,
  apps,
  actions,
  sections,
  onEditActions,
  style,
}: ActivityViewProps) {
  const { theme } = useThemeContext()
  const styles = useMemo(() => getActivityViewStyles(theme), [theme])
  const slideAnim = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.spring(slideAnim, {
          toValue: 1,
          damping: 25,
          stiffness: 300,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: Platform.OS !== 'web' }),
      ]).start()
    }
  }, [visible, fadeAnim, slideAnim])

  const screenHeight = Dimensions.get('window').height

  const handleItemPress = useCallback(
    (onPress: () => void) => {
      onPress()
    },
    []
  )

  const thumbnailSource = typeof thumbnail === 'string' ? { uri: thumbnail } : thumbnail

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        {/* Backdrop */}
        <Pressable
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close share sheet"
        />

        {/* Sheet Content */}
        <Animated.View
          style={[
            styles.container,
            {
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [screenHeight * 0.6, 0],
                  }),
                },
              ],
            },
            style,
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header */}
            {(title || thumbnail) && (
              <View style={styles.header}>
                {thumbnailSource && (
                  <Image source={thumbnailSource} style={styles.headerThumbnail} />
                )}
                <View style={styles.headerTextArea}>
                  {title && <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>}
                  {subtitle && (
                    <Text style={styles.headerSubtitle} numberOfLines={1}>
                      {subtitle}
                    </Text>
                  )}
                </View>
                <Pressable
                  style={styles.closeButton}
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </Pressable>
              </View>
            )}

            {/* Collaborate Button */}
            {collaborate && (
              <>
                <Pressable
                  style={styles.collaborateButton}
                  onPress={collaborate.onPress}
                  accessibilityRole="button"
                >
                  <Text style={styles.collaborateText}>{collaborate.label}</Text>
                  <Text style={styles.collaborateText}>›</Text>
                </Pressable>
                {collaborate.subtitle && (
                  <Text style={styles.collaborateSubtitle}>
                    {collaborate.subtitle}
                  </Text>
                )}
              </>
            )}

            {/* Contacts Row */}
            {contacts && contacts.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.contactsRow}
              >
                {contacts.map((contact, index) => {
                  const avatarSrc = typeof contact.avatar === 'string'
                    ? { uri: contact.avatar }
                    : contact.avatar
                  return (
                    <View key={index} style={styles.contactItem}>
                      {avatarSrc ? (
                        <Image source={avatarSrc} style={styles.contactAvatar} />
                      ) : (
                        <View style={styles.contactAvatar} />
                      )}
                      <Text style={styles.contactName} numberOfLines={2}>
                        {contact.name}
                      </Text>
                    </View>
                  )
                })}
              </ScrollView>
            )}

            {/* Apps Row */}
            {apps && apps.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.appsRow}
              >
                {apps.map((app, index) => (
                  <Pressable
                    key={index}
                    style={styles.appItem}
                    onPress={() => handleItemPress(app.onPress)}
                    accessibilityRole="button"
                    accessibilityLabel={app.name}
                  >
                    <View style={styles.appIcon}>{app.icon}</View>
                    <Text style={styles.appName} numberOfLines={1}>
                      {app.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}

            {/* Quick Actions Grid */}
            {actions && actions.length > 0 && (
              <View style={styles.actionsGrid}>
                {actions.map((action, index) => (
                  <Pressable
                    key={index}
                    style={styles.actionItem}
                    onPress={() => handleItemPress(action.onPress)}
                    accessibilityRole="button"
                    accessibilityLabel={action.label}
                  >
                    {action.icon}
                    <Text
                      style={
                        action.destructive
                          ? styles.actionLabelDestructive
                          : styles.actionLabel
                      }
                      numberOfLines={2}
                    >
                      {action.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Grouped List Sections */}
            {sections?.map((section, sectionIndex) => (
              <View key={sectionIndex} style={styles.sectionContainer}>
                {section.title && (
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                )}
                {section.items.map((item, itemIndex) => (
                  <View key={itemIndex}>
                    {itemIndex > 0 && <View style={styles.listSeparator} />}
                    <Pressable
                      style={({ pressed }) => [
                        styles.listItem,
                        pressed && styles.listItemPressed,
                      ]}
                      onPress={() => handleItemPress(item.onPress)}
                      accessibilityRole="button"
                      accessibilityLabel={item.label}
                    >
                      <View style={styles.listItemIcon}>{item.icon}</View>
                      <Text style={styles.listItemLabel}>{item.label}</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            ))}

            {/* Edit Actions Footer */}
            {onEditActions && (
              <Pressable
                style={styles.editActionsButton}
                onPress={onEditActions}
                accessibilityRole="button"
                accessibilityLabel="Edit Actions"
              >
                <Text style={styles.editActionsText}>Edit Actions</Text>
              </Pressable>
            )}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

ActivityView.displayName = 'ActivityView'
