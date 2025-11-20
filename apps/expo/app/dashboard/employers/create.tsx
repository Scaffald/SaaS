import { ROUTES } from '@app/core/constants/routes'
import { DashboardPage } from '@app/core/features/dashboard/DashboardPage'
import { normalizeOrganizationSlug } from '@app/core/features/discover/utils/normalizeOrganizationSlug'
import { OrganizationRequestForm } from '@app/core/features/organizations/components/OrganizationRequestForm'
import { QuickLinksSidebar } from '@app/ui'
import { Building2, Info } from '@tamagui/lucide-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Button, Separator, Text, XStack, YStack } from 'tamagui'

export default function DashboardOrganizationCreatePage() {
  const router = useRouter()
  const { name, slug } = useLocalSearchParams<{
    name?: string
    slug?: string
  }>()

  const defaultName = typeof name === 'string' ? name : ''
  const defaultSlug = typeof slug === 'string' ? slug : normalizeOrganizationSlug(defaultName)

  const form = <OrganizationRequestForm defaultName={defaultName} defaultSlug={defaultSlug} />

  const sidebar = (
    <YStack gap="$4">
      <YStack gap="$2">
        <XStack gap="$2" items="center">
          <Building2 size={20} color="$blue10" />
          <Text fontSize="$5" fontWeight="700" color="$color12">
            What happens next
          </Text>
        </XStack>
        <Text fontSize="$3" color="$color11">
          Share a few details that help our moderators validate your organization. We&apos;ll
          confirm there are no duplicates and publish it once approved.
        </Text>
      </YStack>

      <Separator />

      <YStack gap="$3">
        <XStack gap="$2" items="center">
          <Info size={18} color="$color10" />
          <Text fontSize="$4" fontWeight="600" color="$color10">
            Tips for faster approval
          </Text>
        </XStack>
        <Text fontSize="$3" color="$color10">
          - Provide the organization’s public-facing name and slug
        </Text>
        <Text fontSize="$3" color="$color10">
          - Include a website or reference link so we can verify quickly
        </Text>
        <Text fontSize="$3" color="$color10">
          - Add any context (e.g., location, contacts) in the notes field
        </Text>
      </YStack>

      <Separator />

      <Button
        size="$3"
        variant="outlined"
        onPress={() => router.replace(ROUTES.DASHBOARD.DISCOVER.EMPLOYERS.path)}
      >
        Back to Discover
      </Button>
    </YStack>
  )

  return (
    <DashboardPage
      showBreadcrumb={false}
      leftContent={form}
      rightContent={<QuickLinksSidebar>{sidebar}</QuickLinksSidebar>}
    />
  )
}
