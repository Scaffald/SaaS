import { X } from '@tamagui/lucide-icons'
import { Button, Text, Row } from '@unicornlove/beyond-ui'

interface CertificationChipProps {
  certification: {
    id: string
    title: string
  }
  onRemove: (id: string) => void
  disabled?: boolean
}

/**
 * Chip component for displaying selected top-level certifications
 * Shows certification name with remove button
 */
export function CertificationChip({
  certification,
  onRemove,
  disabled = false,
}: CertificationChipProps) {
  return (
    <Row
      style={{
        backgroundColor: '#dbeafe',
        borderColor: '#60a5fa',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 8,
        alignItems: 'center',
      }}
    >
      <Text fontSize="$3" fontWeight="500" color="$blue11">
        {certification.title}
      </Text>
      <Button
        size="$2"
        circular
        chromeless
        icon={X}
        onPress={() => !disabled && onRemove(certification.id)}
        disabled={disabled}
        opacity={disabled ? 0.5 : 1}
      />
    </Row>
  )
}
