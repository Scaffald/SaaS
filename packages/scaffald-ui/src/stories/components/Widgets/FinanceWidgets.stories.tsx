/**
 * Finance Widget components stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import {
  BalanceWidget,
  SpendingLimitWidget,
  CreditCardWidget,
  VirtualCardsWidget,
  TransactionsWidget,
  EarningsWidget,
  ContactsWidget,
  CurrencyConverterWidget,
  SubscriptionsWidget,
  LargeBalanceWidget,
} from '../../../components/Widgets/Finance'

const BalanceWidgetMeta = {
  title: 'Widgets/Finance/BalanceWidget',
  component: BalanceWidget,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof BalanceWidget>

export default BalanceWidgetMeta
type BalanceWidgetStory = StoryObj<typeof BalanceWidget>

export const Balance01: BalanceWidgetStory = {
  args: {
    variant: 'Balance 01',
    title: 'Sales Revenue',
    amount: '5.632',
    changeValue: '+$23.53',
    changePeriod: 'this month',
    changeType: 'positive',
    chartData: [
      { value: 16, label: 'Jun' },
      { value: 36, label: 'Jul' },
      { value: 22, label: 'Aug' },
      { value: 6, label: 'Sep' },
    ],
  },
}

export const Balance02: BalanceWidgetStory = {
  args: {
    variant: 'Balance 02',
    title: 'Total Revenue',
    amount: '12,345',
    changeValue: '+$1,234',
    changePeriod: 'this month',
    changeType: 'positive',
  },
}

export const Balance03: BalanceWidgetStory = {
  args: {
    variant: 'Balance 03',
    title: 'Monthly Earnings',
    amount: '8,500',
    changeValue: '+$450',
    changePeriod: 'vs. last month',
    changeType: 'positive',
  },
}

export const Balance04Stock: BalanceWidgetStory = {
  args: {
    variant: 'Balance 04 (Stock)',
    title: 'Stock Value',
    amount: '25,000',
    changeValue: '-$500',
    changePeriod: 'today',
    changeType: 'negative',
  },
}

const _SpendingLimitWidgetMeta = {
  title: 'Widgets/Finance/SpendingLimitWidget',
  component: SpendingLimitWidget,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SpendingLimitWidget>

export const SpendingLimit01: StoryObj<typeof SpendingLimitWidget> = {
  args: {
    variant: 'Spending Limit 01',
    limit: 10000,
    used: 7500,
    remaining: 2500,
  },
}

const _CreditCardWidgetMeta = {
  title: 'Widgets/Finance/CreditCardWidget',
  component: CreditCardWidget,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CreditCardWidget>

export const CreditCard: StoryObj<typeof CreditCardWidget> = {
  args: {
    variant: 'Interactive - Credit Card',
    cardNumber: '1234',
    cardholderName: 'John Doe',
    balance: '$1,234.56',
  },
}

export const CreditCardWithLimit: StoryObj<typeof CreditCardWidget> = {
  args: {
    variant: 'Interactive - Credit Card - Limit On',
    cardNumber: '5678',
    cardholderName: 'Jane Smith',
    balance: '$5,678.90',
    limit: '$10,000',
  },
}

const _VirtualCardsWidgetMeta = {
  title: 'Widgets/Finance/VirtualCardsWidget',
  component: VirtualCardsWidget,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof VirtualCardsWidget>

export const VirtualCards: StoryObj<typeof VirtualCardsWidget> = {
  args: {
    cards: [
      { id: '1', name: 'Card 1', last4: '1234', balance: '$1,234.56', limit: '$5,000' },
      { id: '2', name: 'Card 2', last4: '5678', balance: '$2,345.67', limit: '$10,000' },
    ],
  },
}

const _TransactionsWidgetMeta = {
  title: 'Widgets/Finance/TransactionsWidget',
  component: TransactionsWidget,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TransactionsWidget>

export const Transactions: StoryObj<typeof TransactionsWidget> = {
  args: {
    transactions: [
      { id: '1', description: 'Coffee Shop', amount: -5.5, date: 'Today', category: 'Food' },
      { id: '2', description: 'Salary Deposit', amount: 5000, date: 'Yesterday', category: 'Income' },
      { id: '3', description: 'Grocery Store', amount: -85.25, date: '2 days ago', category: 'Shopping' },
    ],
  },
}

const _EarningsWidgetMeta = {
  title: 'Widgets/Finance/EarningsWidget',
  component: EarningsWidget,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof EarningsWidget>

export const Earnings: StoryObj<typeof EarningsWidget> = {
  args: {
    totalEarnings: 10000,
    earningsData: [
      { label: 'Product A', value: 6000, color: '#3b82f6' },
      { label: 'Product B', value: 3000, color: '#10b981' },
      { label: 'Product C', value: 1000, color: '#f59e0b' },
    ],
  },
}

const _ContactsWidgetMeta = {
  title: 'Widgets/Finance/ContactsWidget',
  component: ContactsWidget,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ContactsWidget>

export const Contacts: StoryObj<typeof ContactsWidget> = {
  args: {
    contacts: [
      { id: '1', name: 'John Doe', email: 'john@example.com' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
      { id: '3', name: 'Bob Johnson', email: 'bob@example.com' },
    ],
  },
}

const _CurrencyConverterWidgetMeta = {
  title: 'Widgets/Finance/CurrencyConverterWidget',
  component: CurrencyConverterWidget,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CurrencyConverterWidget>

export const CurrencyConverter: StoryObj<typeof CurrencyConverterWidget> = {
  args: {
    fromCurrency: 'USD',
    toCurrency: 'EUR',
    amount: '100',
    convertedAmount: '85.50',
    exchangeRate: 0.855,
  },
}

const _SubscriptionsWidgetMeta = {
  title: 'Widgets/Finance/SubscriptionsWidget',
  component: SubscriptionsWidget,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SubscriptionsWidget>

export const Subscriptions: StoryObj<typeof SubscriptionsWidget> = {
  args: {
    totalMonthly: 45.97,
    subscriptions: [
      { id: '1', name: 'Netflix', amount: 15.99, period: 'month', status: 'active' },
      { id: '2', name: 'Spotify', amount: 9.99, period: 'month', status: 'active' },
      { id: '3', name: 'Adobe Creative Cloud', amount: 19.99, period: 'month', status: 'active' },
    ],
  },
}

const _LargeBalanceWidgetMeta = {
  title: 'Widgets/Finance/LargeBalanceWidget',
  component: LargeBalanceWidget,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LargeBalanceWidget>

export const LargeBalance: StoryObj<typeof LargeBalanceWidget> = {
  args: {
    title: 'Total Balance',
    amount: '$50,000.00',
    change: '+$1,234.56',
    changeType: 'positive',
    chartData: [
      { value: 10, label: 'Jan' },
      { value: 20, label: 'Feb' },
      { value: 15, label: 'Mar' },
      { value: 30, label: 'Apr' },
      { value: 25, label: 'May' },
      { value: 40, label: 'Jun' },
    ],
  },
}
