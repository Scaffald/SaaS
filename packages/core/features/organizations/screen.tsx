import {
  SidebarMenu,
  type MenuItem,
  useMedia,
  Button,
  YStack,
  XStack,
  SizableText,
  Paragraph,
  Card,
} from '@app/ui'
import { Building2, Plus } from '@tamagui/lucide-icons'
import { usePathname } from '@app/core/utils/usePathname'
import { useLink } from 'solito/link'

export const OrganizationsScreen = () => {
  const media = useMedia()
  const _pathname = usePathname()
  const createLink = useLink({ href: '/organizations/new' })

  const menuItems: MenuItem[] = [
    {
      id: 'create-organization',
      label: 'Create Organization',
      icon: Plus,
      accentTheme: 'orange',
      href: '/organizations/new',
    },
  ]

  // Placeholder organizations data
  const organizations = [
    {
      id: '1',
      name: 'Acme Corporation',
      role: 'Admin',
      employeeCount: '51-200',
      revenue: '$5M - $20M',
      website: 'https://acme.com',
    },
    {
      id: '2',
      name: 'TechStart Inc',
      role: 'Member',
      employeeCount: '11-50',
      revenue: '$1M - $5M',
      website: 'https://techstart.com',
    },
  ]

  // On mobile, show the sidebar menu
  if (media.sm) {
    return <SidebarMenu items={menuItems} />
  }

  // On desktop, show the full organizations list
  return (
    <YStack gap="$4" p="$4">
      <XStack jc="space-between" ai="center" gap="$4" $sm={{ fd: 'column', ai: 'flex-start' }}>
        <YStack gap="$1">
          <SizableText size="$6" fontWeight="700">
            Organizations
          </SizableText>
          <Paragraph size="$3" color="$gray11">
            Manage the companies you collaborate with across projects.
          </Paragraph>
        </YStack>

        <Button {...createLink} size="$4" br="$10" icon={Building2} accessibilityRole="link">
          Create Organization
        </Button>
      </XStack>

      <YStack gap="$3">
        {organizations.map((organization) => (
          <Card
            key={organization.id}
            p="$4"
            br="$4"
            bg="$color2"
            borderColor="$color3"
            borderWidth={1}
          >
            <YStack gap="$3">
              <XStack gap="$3" ai="center">
                <Building2 size={20} color="$gray11" />
                <SizableText size="$5" fontWeight="600">
                  {organization.name}
                </SizableText>
              </XStack>

              <Paragraph size="$3" color="$gray11">
                Role: {organization.role}
              </Paragraph>

              <XStack gap="$4" fw="wrap">
                <Paragraph size="$2" color="$gray11">
                  Team size: {organization.employeeCount} employees
                </Paragraph>
                <Paragraph size="$2" color="$gray11">
                  Revenue: {organization.revenue}
                </Paragraph>
                <Paragraph size="$2" color="$gray11">
                  {organization.website}
                </Paragraph>
              </XStack>
            </YStack>
          </Card>
        ))}
      </YStack>
    </YStack>
  )
}
