/**
 * Contacts Widget component
 * Contact list interface for finance contacts
 *
 * @example
 * ```tsx
 * <ContactsWidget
 *   contacts={[
 *     { id: '1', name: 'John Doe', email: 'john@example.com' },
 *   ]}
 * />
 * ```
 */

import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native'
import type { ViewStyle } from 'react-native'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'
import { typographyVariants } from '../../../tokens/typography'

export interface Contact {
  id: string
  name: string
  email?: string
  avatar?: string
}

export interface ContactsWidgetProps {
  /**
   * Array of contacts
   */
  contacts?: Contact[]

  /**
   * On contact press handler
   */
  onContactPress?: (contact: Contact) => void

  /**
   * Custom container style
   */
  style?: ViewStyle
}

export function ContactsWidget({
  contacts = [],
  onContactPress,
  style,
}: ContactsWidgetProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>Contacts</Text>

      <ScrollView style={styles.scrollView}>
        {contacts.length === 0 ? (
          <Text style={styles.emptyText}>No contacts</Text>
        ) : (
          contacts.map((contact) => (
            <Pressable
              key={contact.id}
              onPress={() => onContactPress?.(contact)}
              style={({ pressed }) => [styles.contactItem, pressed && styles.contactItemPressed]}
            >
              {contact.avatar ? (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {contact.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()}
                  </Text>
                </View>
              ) : (
                <View style={styles.avatarPlaceholder} />
              )}
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                {contact.email && <Text style={styles.contactEmail}>{contact.email}</Text>}
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: spacing[12],
    width: 400,
    height: 432,
  },
  title: {
    ...typographyVariants.paragraphMMedium,
    color: colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[8],
    borderRadius: 8,
  },
  contactItemPressed: {
    backgroundColor: colors.gray[100],
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typographyVariants.paragraphSMedium,
    color: colors.text.inverse,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[200],
  },
  contactInfo: {
    flexDirection: 'column',
    gap: spacing[4],
    flex: 1,
  },
  contactName: {
    ...typographyVariants.paragraphSMedium,
    color: colors.text.primary,
  },
  contactEmail: {
    ...typographyVariants.captionRegular,
    color: colors.text.tertiary,
  },
  emptyText: {
    ...typographyVariants.paragraphSRegular,
    color: colors.text.tertiary,
    textAlign: 'center',
    paddingVertical: spacing[24],
  },
})
