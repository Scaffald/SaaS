/**
 * Mock portfolio data for Storybook examples
 */

export interface PortfolioBalance {
  symbol: string
  balance: number
  balanceUSD: number
  allocation: number // percentage
}

export interface Portfolio {
  totalBalanceUSD: number
  totalChange: string
  totalChangeType: 'positive' | 'negative'
  balances: PortfolioBalance[]
}

export const portfolio: Portfolio = {
  totalBalanceUSD: 125450.75,
  totalChange: '+12.5%',
  totalChangeType: 'positive',
  balances: [
    {
      symbol: 'BTC',
      balance: 1.25,
      balanceUSD: 56543.13,
      allocation: 45.1,
    },
    {
      symbol: 'ETH',
      balance: 15.5,
      balanceUSD: 44102.15,
      allocation: 35.2,
    },
    {
      symbol: 'SOL',
      balance: 120.0,
      balanceUSD: 11850.00,
      allocation: 9.4,
    },
    {
      symbol: 'BNB',
      balance: 45.0,
      balanceUSD: 14060.25,
      allocation: 11.2,
    },
    {
      symbol: 'ADA',
      balance: 5000.0,
      balanceUSD: 2600.00,
      allocation: 2.1,
    },
    {
      symbol: 'XRP',
      balance: 2500.0,
      balanceUSD: 1550.00,
      allocation: 1.2,
    },
  ],
}

export const getPortfolioBalance = (symbol: string): PortfolioBalance | undefined => {
  return portfolio.balances.find((balance) => balance.symbol === symbol)
}
