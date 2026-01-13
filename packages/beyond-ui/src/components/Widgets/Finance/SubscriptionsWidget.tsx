/**
 * Subscriptions Widget component
 * Subscription management interface
 *
 * @example
 * ```tsx
 * <SubscriptionsWidget
 *   subscriptions={[
 *     { id: '1', name: 'Netflix', amount: 15.99, period: 'month' },
 *   ]}
 * />
 * ```
 */

import { View, Text, StyleSheet, ScrollView } from 'react-native'
import type { ViewStyle } from 'react-native'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'
import { typographyVariants } from '../../../tokens/typography'

export interface Subscription {
  id: string
  name: string
  amount: number
  period: 'month' | 'year'
  status?: 'active' | 'cancelled' | 'pending'
}

export interface SubscriptionsWidgetProps {
  /**
   * Array of subscriptions
   */
  subscriptions?: Subscription[]

  /**
   * Total monthly cost
   */
  totalMonthly?: number

  /**
   * Custom container style
   */
  style?: ViewStyle
}

export function SubscriptionsWidget({
  subscriptions = [],
  totalMonthly,
  style,
}: SubscriptionsWidgetProps) {
  const totalValue = totalMonthly !== undefined ? `$${totalMonthly.toFixed(2)}` : undefined

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>Subscriptions</Text>
        {totalValue && <Text style={styles.total}>Total: {totalValue}/mo</Text>}
      </View>

      <ScrollView style={styles.scrollView}>
        {subscriptions.length === 0 ? (
          <Text style={styles.emptyText}>No subscriptions</Text>
        ) : (
          subscriptions.map((subscription) => (
            <View key={subscription.id} style={styles.subscriptionItem}>
              <View style={styles.subscriptionInfo}>
                <Text style={styles.subscriptionName}>{subscription.name}</Text>
                <Text style={styles.subscriptionPeriod}>
                  ${subscription.amount.toFixed(2)}/{subscription.period === 'month' ? 'mo' : 'yr'}
                </Text>
              </View>
              {subscription.status && (
                <View
                  style={[
                    styles.statusBadge,
                    subscription.status === 'active' && styles.statusActive,
                    subscription.status === 'cancelled' && styles.statusCancelled,
                    subscription.status === 'pending' && styles.statusPending,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      subscription.status === 'active' && styles.statusTextActive,
                      subscription.status === 'cancelled' && styles.statusTextCancelled,
                      subscription.status === 'pending' && styles.statusTextPending,
                    ]}
                  >
                    {subscription.status}
                  </Text>
                </View>
              )}
            </View>
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
    width: 420,
    height: 434,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...typographyVariants.paragraphMMedium,
    color: colors.text.primary,
  },
  total: {
    ...typographyVariants.paragraphSMedium,
    color: colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  subscriptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[12],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light.default,
  },
  subscriptionInfo: {
    flexDirection: 'column',
    gap: spacing[4],
    flex: 1,
  },
  subscriptionName: {
    ...typographyVariants.paragraphSMedium,
    color: colors.text.primary,
  },
  subscriptionPeriod: {
    ...typographyVariants.captionRegular,
    color: colors.text.tertiary,
  },
  statusBadge: {
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: colors.success[50],
  },
  statusCancelled: {
    backgroundColor: colors.error[50],
  },
  statusPending: {
    backgroundColor: colors.warning[50],
  },
  statusText: {
    ...typographyVariants.captionMedium,
  },
  statusTextActive: {
    color: colors.success[700],
  },
  statusTextCancelled: {
    color: colors.error[700],
  },
  statusTextPending: {
    color: colors.warning[700],
  },
  emptyText: {
    ...typographyVariants.paragraphSRegular,
    color: colors.text.tertiary,
    textAlign: 'center',
    paddingVertical: spacing[24],
  },
})
