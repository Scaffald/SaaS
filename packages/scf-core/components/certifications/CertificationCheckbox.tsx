import { Check, Link } from '@tamagui/lucide-icons'
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
    <Stack gap="$2">
      <Row gap="$3" style={{ alignItems: 'flex-start' }}>
        <Checkbox checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} size="$4">
          <Checkbox.Indicator>
            <Check />
          </Checkbox.Indicator>
        </Checkbox>

        <Stack flex={1} gap="$1">
          <Text fontWeight={checked ? '600' : '400'} fontSize="$3">
            {certification.title}
          </Text>
          {certification.description && (
            <Text fontSize="$2" color="$color11">
              {certification.description}
            </Text>
          )}
        </Stack>

        {checked && onAddProof && (
          <Button size="$2" variant="outlined" icon={Link} onPress={onAddProof} disabled={disabled}>
            {hasProof ? 'View Proof' : 'Add Proof'}
          </Button>
        )}
      </Row>
    </Stack>
  )
}
