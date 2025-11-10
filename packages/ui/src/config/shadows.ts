export const cardShadows = {
  light: 'rgba(0,0,0,0.02) 0px 1px 2px, rgba(0,0,0,0.04) 0px 2px 8px',
  lightHover: 'rgba(0,0,0,0.04) 0px 2px 4px, rgba(0,0,0,0.06) 0px 4px 12px',
  lightPress: 'rgba(0,0,0,0.02) 0px 1px 1px, rgba(0,0,0,0.03) 0px 1px 4px',
  dark: 'rgba(0,0,0,0.3) 0px 2px 4px, rgba(0,0,0,0.2) 0px 4px 12px',
  darkHover: 'rgba(0,0,0,0.4) 0px 4px 8px, rgba(0,0,0,0.3) 0px 8px 16px',
  darkPress: 'rgba(0,0,0,0.2) 0px 1px 2px, rgba(0,0,0,0.15) 0px 2px 6px',
  elevated: 'rgba(0,0,0,0.08) 0px 4px 12px, rgba(0,0,0,0.04) 0px 2px 4px',
  elevatedHover: 'rgba(0,0,0,0.12) 0px 8px 16px, rgba(0,0,0,0.06) 0px 4px 8px',
  none: 'none',
} as const

export type CardShadowName = keyof typeof cardShadows
