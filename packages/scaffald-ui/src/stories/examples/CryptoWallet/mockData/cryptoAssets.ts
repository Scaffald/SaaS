/**
 * Mock crypto asset data for Storybook examples
 */

export interface CryptoAsset {
  symbol: string
  name: string
  price: number
  change: string
  changeType: 'positive' | 'negative'
  icon?: string
  marketCap?: number
  volume24h?: number
}

export const cryptoAssets: CryptoAsset[] = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 45234.50,
    change: '+5.2%',
    changeType: 'positive',
    marketCap: 850000000000,
    volume24h: 25000000000,
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    price: 2845.30,
    change: '+3.8%',
    changeType: 'positive',
    marketCap: 340000000000,
    volume24h: 12000000000,
  },
  {
    symbol: 'BNB',
    name: 'Binance Coin',
    price: 312.45,
    change: '-1.2%',
    changeType: 'negative',
    marketCap: 48000000000,
    volume24h: 1500000000,
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    price: 98.75,
    change: '+7.5%',
    changeType: 'positive',
    marketCap: 42000000000,
    volume24h: 1800000000,
  },
  {
    symbol: 'ADA',
    name: 'Cardano',
    price: 0.52,
    change: '+2.1%',
    changeType: 'positive',
    marketCap: 18000000000,
    volume24h: 450000000,
  },
  {
    symbol: 'XRP',
    name: 'Ripple',
    price: 0.62,
    change: '-0.8%',
    changeType: 'negative',
    marketCap: 32000000000,
    volume24h: 1200000000,
  },
]

export const getAssetBySymbol = (symbol: string): CryptoAsset | undefined => {
  return cryptoAssets.find((asset) => asset.symbol === symbol)
}
