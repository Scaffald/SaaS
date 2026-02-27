import { Card, RangeSlider, Row, Stack, Text } from "@scaffald/ui";
import { Plane } from "lucide-react-native";

export interface MaximumTravelDistanceCardProps {
  description?: string;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  onValueChange?: (value: number) => void;
  disabled?: boolean;
}

/**
 * Shared "Maximum Travel Distance" range slider card component
 * Used in profile employment sections
 */
export function MaximumTravelDistanceCard({
  description = "Select your maximum travel distance to find opportunities that match your preferences",
  min = 10,
  max = 250,
  step = 5,
  value = 25,
  onValueChange,
  disabled = false,
}: MaximumTravelDistanceCardProps) {
  const formatValue = (v: number) => `${v} miles`;
  return (
    <Card bordered padding="md">
      <Stack gap={12}>
        <Row gap={8} align="center">
          <Plane size={20} color="#637083" />
          <Text>Maximum Travel Distance</Text>
        </Row>
        {description && <Text style={{ color: "#637083" }}>{description}</Text>}
        <Stack gap={8}>
          <RangeSlider
            value={value}
            onValueChange={onValueChange ?? (() => {})}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            size="medium"
          />
          <Text style={{ color: "#637083" }}>
            {formatValue(min)} – {formatValue(max)}
          </Text>
        </Stack>
      </Stack>
    </Card>
  );
}
