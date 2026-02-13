import { Link } from 'lucide-react-native'
import { Button, Checkbox, Text, Row, Stack } from '@unicornlove/beyond-ui'

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
  return (
    <Stack gap={8}>
      <Row gap={12} style={{ alignItems: 'flex-start' }}>
        <Checkbox checked={checked} onChange={onCheckedChange} disabled={disabled} size="md" />

        <Stack style={{ flex: 1 }} gap={4}>
          <Text>{certification.title}</Text>
          {certification.description && <Text color="$gray11">{certification.description}</Text>}
        </Stack>

        {checked && onAddProof && (
          <Button size="xs" variant="outline" onPress={onAddProof} disabled={disabled}>
            <Row gap={4} align="center">
              <Link size="md" />
              <Text size="xs">{hasProof ? 'View Proof' : 'Add Proof'}</Text>
            </Row>
          </Button>
        )}
      </Row>
    </Stack>
  )
}
