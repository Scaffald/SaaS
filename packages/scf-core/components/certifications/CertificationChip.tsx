import { X } from 'lucide-react-native'
import { Button, Text, Row } from '@scaffald/ui'

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
      <Text color="$blue11">{certification.title}</Text>
      <Button
        size="sm"
        variant="text"
        onPress={() => !disabled && onRemove(certification.id)}
        disabled={disabled}
        style={{ opacity: disabled ? 0.5 : 1 }}
      >
        <X size="lg" />
      </Button>
    </Row>
  )
}
