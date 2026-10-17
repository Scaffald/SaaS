import { Pressable } from 'react-native'
import { Button, Row, Stack, Text, useResponsive, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { employerRowFacts, formatOpenRoles } from '../utils/employerFacts'
import type { Employer } from './EmployerCard'

interface EmployerListRowProps {
  employer: Employer
  onViewDetails: (employer: Employer) => void
}

/**
 * One employer as a hairline-ruled row, on the JobListRow pattern (#1185).
 *
 * The prototype lists employers the way it lists jobs: the name, one line of
 * facts (industry · City, ST), the open-role count, and the action at the
 * right. The directory drew boxed glass cards with a purple icon tile and a
 * bare street address instead; those cards remain behind the List/Cards
 * switch.
 *
 * The prototype's field-staff size and applicant-response grade have no
 * source on core.organizations yet, so they are not drawn.
 */
export function EmployerListRow({ employer, onViewDetails }: EmployerListRowProps) {
  const { theme } = useThemeContext()
  const { isMobile } = useResponsive()
  const t = theme === 'dark' ? 'dark' : 'light'

  const facts = employerRowFacts({
    industryName: employer.industries?.name,
    address: employer.address,
  })
  const openRoles = formatOpenRoles(employer.open_roles_count)

  return (
    <Row
      gap={16}
      align="center"
      paddingVertical={16}
      testID="employer-row"
      style={{ borderBottomWidth: 1, borderBottomColor: colors.border[t].default }}
    >
      <Pressable
        onPress={() => onViewDetails(employer)}
        accessibilityRole="link"
        accessibilityLabel={`View ${employer.name}`}
        style={{ flex: 1, minWidth: 0 }}
      >
        <Stack gap={6}>
          <Text style={{ color: colors.text[t].primary, fontWeight: '600' }}>{employer.name}</Text>
          {facts ? <Text style={{ color: colors.text[t].secondary }}>{facts}</Text> : null}
          {openRoles ? <Text style={{ color: colors.text[t].tertiary }}>{openRoles}</Text> : null}
        </Stack>
      </Pressable>

      {isMobile ? null : (
        <Button size="sm" variant="outline" onPress={() => onViewDetails(employer)}>
          View
        </Button>
      )}
    </Row>
  )
}
