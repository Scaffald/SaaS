import { Card, Row, Stack, Text, Toggle } from '@scaffald/ui'
import { Plane } from 'lucide-react-native'
import { MaximumTravelDistanceCard } from './MaximumTravelDistanceCard'

export interface OpenToTravelCardProps {
  /** Optional override for description */
  description?: string
  /** Whether the toggle is checked */
  checked?: boolean
  /** Callback when toggle state changes */
  onChange?: (checked: boolean) => void
  /** Travel distance value (only used when checked is true) */
  travelDistanceValue?: number
  /** Callback when travel distance changes */
  onTravelDistanceChange?: (value: number) => void
  /** Optional override for minimum travel distance (default: 10) */
  minTravelDistance?: number
  /** Optional override for maximum travel distance (default: 250) */
  maxTravelDistance?: number
  /** Optional override for travel distance step (default: 5) */
  travelDistanceStep?: number
  /** Whether the card is disabled */
  disabled?: boolean
}

/**
 * Combined "Open to travel" toggle card with expandable travel distance slider
 * The travel distance slider only appears when "Open to travel" is toggled on
 * Used in both profile employment and resume wizard contexts
 */
export function OpenToTravelCard({
  description = 'I am willing to travel for work opportunities',
  checked,
  onChange,
  travelDistanceValue = 25,
  onTravelDistanceChange,
  minTravelDistance = 10,
  maxTravelDistance = 250,
  travelDistanceStep = 5,
  disabled = false,
}: OpenToTravelCardProps) {
  return (
    <Card variant="outlined">
      <Row gap={12} align="center" style={{ padding: 12 }}>
        <Plane size={20} color="#414e62" />
        <Stack style={{ flex: 1, gap: 4 }}>
          <Text weight="medium">Open to travel</Text>
          <Text size="sm">{description}</Text>
        </Stack>
        <Toggle
          checked={checked}
          onChange={onChange}
          size="sm"
          color="primary"
          disabled={disabled}
        />
      </Row>
      {checked && onTravelDistanceChange ? (
        <Stack style={{ gap: 8, paddingTop: 12, paddingHorizontal: 12, paddingBottom: 12 }}>
          <MaximumTravelDistanceCard
            value={travelDistanceValue}
            onValueChange={onTravelDistanceChange}
            min={minTravelDistance}
            max={maxTravelDistance}
            step={travelDistanceStep}
            disabled={disabled}
          />
        </Stack>
      ) : null}
    </Card>
  )
}
