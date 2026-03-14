import { X } from 'lucide-react-native'
import { Button, Text, Row, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

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
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  return (
    <Row
      style={{
        backgroundColor: t === 'dark' ? colors.blue[900] : colors.blue[100],
        borderColor: t === 'dark' ? colors.blue[500] : colors.blue[400],
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 8,
        alignItems: 'center',
      }}
    >
      <Text style={{ color: t === 'dark' ? colors.blue[300] : colors.blue[700] }}>{certification.title}</Text>
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
