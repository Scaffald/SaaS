import { ROUTES } from '@scf/core/constants/routes'
import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { normalizeOrganizationSlug } from '@scf/core/features/discover/utils/normalizeOrganizationSlug'
import { OrganizationRequestForm } from '@scf/core/features/organizations/components/OrganizationRequestForm'
import { Building2, Info } from 'lucide-react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Button, Row, Separator, Stack, Text } from '@scaffald/ui'

export default function DashboardOrganizationsCreatePage() {
  const router = useRouter()
  const { name, slug } = useLocalSearchParams<{
    name?: string
    slug?: string
  }>()

  const defaultName = typeof name === 'string' ? name : ''
  const defaultSlug = typeof slug === 'string' ? slug : normalizeOrganizationSlug(defaultName)

  const form = <OrganizationRequestForm defaultName={defaultName} defaultSlug={defaultSlug} />

  const sidebar = (
    <Stack gap={16}>
      <Stack gap={8}>
        <Row gap={8} align="center">
          <Building2 size={20} color="#3b82f6" />
          <Text size="lg" weight="bold">
            What happens next
          </Text>
        </Row>
        <Text size="sm" color="gray">
          Share a few details that help our moderators validate your organization. We&apos;ll
          confirm there are no duplicates and publish it once approved.
        </Text>
      </Stack>

      <Separator />

      <Stack gap={12}>
        <Row gap={8} align="center">
          <Info size={18} color="#6b7280" />
          <Text size="md" weight="semibold" color="#6b7280">
            Tips for faster approval
          </Text>
        </Row>
        <Text size="sm" color="#6b7280">
          - Provide the organization&apos;s public-facing name and slug
        </Text>
        <Text size="sm" color="#6b7280">
          - Include a website or reference link so we can verify quickly
        </Text>
        <Text size="sm" color="#6b7280">
          - Add any context (e.g., location, contacts) in the notes field
        </Text>
      </Stack>

      <Separator />

      <Button
        size="sm"
        variant="outline"
        color="primary"
        onPress={() => router.replace(ROUTES.DASHBOARD.DISCOVER.EMPLOYERS.ORGANIZATIONS.path)}
      >
        Back to Organizations
      </Button>
    </Stack>
  )

  return <DashboardPage showBreadcrumb={false} leftContent={form} rightContent={sidebar} />
}
