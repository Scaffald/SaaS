import {
  Avatar,
  Button,
  DashboardWidget,
  DashboardWidgetHeader,
  Row,
  Stack,
  Text,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

type SuggestedContact = {
  id: string
  name: string
  title: string
  initials: string
}

const PLACEHOLDER_CONTACTS: SuggestedContact[] = [
  {
    id: '1',
    name: 'Alex Rivera',
    title: 'Site Superintendent',
    initials: 'AR',
  },
  {
    id: '2',
    name: 'Jordan Silva',
    title: 'Safety Coordinator',
    initials: 'JS',
  },
]

function ContactRow({ contact }: { contact: SuggestedContact }) {
  const { theme } = useThemeContext()

  return (
    <Row justify="space-between" align="center" gap={12}>
      <Row align="center" gap={12} flex={1}>
        <Avatar size={40} initials={contact.initials} color="gray" />
        <Stack gap={2} flex={1}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text[theme].primary }}>
            {contact.name}
          </Text>
          <Text style={{ fontSize: 10, color: colors.text[theme].secondary }}>
            {contact.title}
          </Text>
        </Stack>
      </Row>
      <Button variant="outline" color="primary" size="sm">
        Connect
      </Button>
    </Row>
  )
}

/**
 * SuggestedContactsWidget
 * Shows potential connections for the dashboard right column.
 */
export function SuggestedContactsWidget() {
  return (
    <DashboardWidget>
      <DashboardWidgetHeader title="Suggested Contacts" />
      <Stack gap={20}>
        {PLACEHOLDER_CONTACTS.map((contact) => (
          <ContactRow key={contact.id} contact={contact} />
        ))}
      </Stack>
    </DashboardWidget>
  )
}
