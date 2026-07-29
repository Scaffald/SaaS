import { Row, Text } from '@scaffald/ui'
import { View } from 'react-native'
import { brand, layout } from '../theme'

/** Static wrapped list on native; see TradeTicker.web.tsx for the marquee. */
export function TradeTicker({ trades }: { trades: string[] }) {
  return (
    <View
      style={{
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(2,45,56,0.5)',
        paddingVertical: 16,
      }}
    >
      <Row
        justify="center"
        style={{
          flexWrap: 'wrap',
          maxWidth: layout.maxWidth,
          marginHorizontal: 'auto',
          paddingHorizontal: layout.gutter,
        }}
      >
        {trades.map((trade, i) => (
          <Row key={trade} align="center" gap={12} style={{ paddingHorizontal: 12 }}>
            {i > 0 ? <Text color={brand.teal}>•</Text> : null}
            <Text size="sm" weight="medium" color={brand.tealSoft}>
              {trade}
            </Text>
          </Row>
        ))}
      </Row>
    </View>
  )
}
