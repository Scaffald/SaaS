/**
 * Mock market data for Storybook examples
 */

export interface PriceDataPoint {
  timestamp: number
  price: number
}

export interface MarketData {
  symbol: string
  currentPrice: number
  priceHistory: PriceDataPoint[]
  priceChange24h: number
  priceChangePercent24h: number
  high24h: number
  low24h: number
}

/**
 * Generate mock price history data
 */
function generatePriceHistory(
  basePrice: number,
  days: number = 30,
  volatility: number = 0.02
): PriceDataPoint[] {
  const data: PriceDataPoint[] = []
  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000
  let currentPrice = basePrice

  for (let i = days; i >= 0; i--) {
    const timestamp = now - i * dayMs
    // Random walk with slight upward trend
    const change = (Math.random() - 0.45) * volatility * basePrice
    currentPrice = Math.max(currentPrice + change, basePrice * 0.5)
    data.push({
      timestamp,
      price: Number(currentPrice.toFixed(2)),
    })
  }

  return data
}

export const marketData: Record<string, MarketData> = {
  BTC: {
    symbol: 'BTC',
    currentPrice: 45234.50,
    priceHistory: generatePriceHistory(45234.50, 30, 0.03),
    priceChange24h: 2250.30,
    priceChangePercent24h: 5.2,
    high24h: 45800.00,
    low24h: 42800.00,
  },
  ETH: {
    symbol: 'ETH',
    currentPrice: 2845.30,
    priceHistory: generatePriceHistory(2845.30, 30, 0.035),
    priceChange24h: 108.12,
    priceChangePercent24h: 3.8,
    high24h: 2900.00,
    low24h: 2700.00,
  },
  SOL: {
    symbol: 'SOL',
    currentPrice: 98.75,
    priceHistory: generatePriceHistory(98.75, 30, 0.04),
    priceChange24h: 7.40,
    priceChangePercent24h: 7.5,
    high24h: 102.00,
    low24h: 90.00,
  },
  BNB: {
    symbol: 'BNB',
    currentPrice: 312.45,
    priceHistory: generatePriceHistory(312.45, 30, 0.025),
    priceChange24h: -3.75,
    priceChangePercent24h: -1.2,
    high24h: 320.00,
    low24h: 305.00,
  },
}

export const getMarketData = (symbol: string): MarketData | undefined => {
  return marketData[symbol]
}

export const getChartData = (symbol: string, count: number = 30): number[] => {
  const data = marketData[symbol]
  if (!data) return []
  return data.priceHistory.slice(-count).map((point) => point.price)
}
