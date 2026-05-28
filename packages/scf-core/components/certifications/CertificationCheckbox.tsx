import { Link } from 'lucide-react-native'
import { Button, Checkbox, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

interface Certification {
  id: string
  title: string
  description: string | null
}

interface CertificationCheckboxProps {
  certification: Certification
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  hasProof?: boolean
  onAddProof?: () => void
  disabled?: boolean
}

/**
 * Checkbox component for depth 2 certifications
 * Includes "Add Proof" button when checked
 */
export function CertificationCheckbox({
  certification,
  checked,
  onCheckedChange,
  hasProof = false,
  onAddProof,
  disabled = false,
}: CertificationCheckboxProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  return (
    <Stack gap={8}>
      <Row gap={12} style={{ alignItems: 'flex-start' }}>
        <Checkbox checked={checked} onChange={onCheckedChange} disabled={disabled} size="md" />

        <Stack style={{ flex: 1 }} gap={4}>
          <Text>{certification.title}</Text>
          {certification.description && <Text style={{ color: colors.text[t].secondary }}>{certification.description}</Text>}
        </Stack>

        {checked && onAddProof && (
          <Button size="sm" variant="outline" onPress={onAddProof} disabled={disabled}>
            <Row gap={4} align="center">
              <Link size={20} />
              <Text size="sm">{hasProof ? 'View Proof' : 'Add Proof'}</Text>
            </Row>
          </Button>
        )}
      </Row>
    </Stack>
  )
}
