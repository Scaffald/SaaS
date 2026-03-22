import { Button, Row } from '@scaffald/ui'

interface DateRangeSelectorProps {
  value: number
  onChange: (days: number) => void
}

const OPTIONS = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
]

export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  return (
    <Row gap={6}>
      {OPTIONS.map((opt) => (
        <Button
          key={opt.days}
          size="sm"
          variant={value === opt.days ? 'filled' : 'ghost'}
          color={value === opt.days ? 'primary' : undefined}
          onPress={() => onChange(opt.days)}
        >
          {opt.label}
        </Button>
      ))}
    </Row>
  )
}
