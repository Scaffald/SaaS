/**
 * Transactions Widget component
 * Displays transaction list/feed
 *
 * @example
 * ```tsx
 * <TransactionsWidget
 *   transactions={[
 *     { id: '1', description: 'Coffee Shop', amount: -5.50, date: 'Today' },
 *   ]}
 * />
 * ```
 */

import { View, Text, StyleSheet, ScrollView } from 'react-native'
import type { ViewStyle } from 'react-native'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'
import { typographyVariants } from '../../../tokens/typography'
import { useThemeContext } from '../../../theme'
import type { ResolvedThemeMode } from '../../../tokens/colors'

export interface Transaction {
  id: string
  description: string
  amount: number
  date: string
  category?: string
}

export interface TransactionsWidgetProps {
  /**
   * Array of transactions
   */
  transactions?: Transaction[]

  /**
   * Custom container style
   */
  style?: ViewStyle
}

export function TransactionsWidget({ transactions = [], style }: TransactionsWidgetProps) {
  const { theme } = useThemeContext()
  const styles = getStyles(theme)
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>Recent Transactions</Text>

      <ScrollView style={styles.scrollView}>
        {transactions.length === 0 ? (
          <Text style={styles.emptyText}>No transactions</Text>
        ) : (
          transactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionItem}>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionDescription}>{transaction.description}</Text>
                {transaction.category && (
                  <Text style={styles.transactionCategory}>{transaction.category}</Text>
                )}
                <Text style={styles.transactionDate}>{transaction.date}</Text>
              </View>
              <Text
                style={[
                  styles.transactionAmount,
                  transaction.amount < 0 ? styles.amountNegative : styles.amountPositive,
                ]}
              >
                {transaction.amount < 0 ? '-' : '+'}${Math.abs(transaction.amount).toFixed(2)}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}

function getStyles(theme: ResolvedThemeMode) {
  return StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: spacing[12],
    width: 420,
    height: 364,
  },
  title: {
    ...typographyVariants.paragraphMMedium,
    color: colors.text[theme].primary,
  },
  scrollView: {
    flex: 1,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[12],
    borderBottomWidth: 1,
    borderBottomColor: colors.border[theme].default,
  },
  transactionInfo: {
    flexDirection: 'column',
    gap: spacing[4],
    flex: 1,
  },
  transactionDescription: {
    ...typographyVariants.paragraphSMedium,
    color: colors.text[theme].primary,
  },
  transactionCategory: {
    ...typographyVariants.captionRegular,
    color: colors.text[theme].tertiary,
  },
  transactionDate: {
    ...typographyVariants.captionRegular,
    color: colors.text[theme].tertiary,
  },
  transactionAmount: {
    ...typographyVariants.paragraphSMedium,
  },
  amountPositive: {
    color: colors.success[500],
  },
  amountNegative: {
    color: colors.text[theme].primary,
  },
  emptyText: {
    ...typographyVariants.paragraphSRegular,
    color: colors.text[theme].tertiary,
    textAlign: 'center',
    paddingVertical: spacing[24],
  },
})
}
