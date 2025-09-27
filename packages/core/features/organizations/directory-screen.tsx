import { Button, Card, Paragraph, SizableText, XStack, YStack } from '@app/ui'
import { Building2 } from '@tamagui/lucide-icons'
import { useLink } from 'solito/link'
import { ROUTES, DASHBOARD_ROUTES } from '@app/core/constants/routes'

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

export const OrganizationsDirectoryScreen = () => {
  const createLink = useLink({
    href:
      DASHBOARD_ROUTES.ORGANIZATIONS?.childrenArray?.find(
        (r) => r.path === '/dashboard/organizations/new'
      )?.fullPath || '/dashboard/organizations/new',
  })

  return (
    <YStack gap="$5" px="$4" py="$6" w="100%" $gtSm={{ maw: 840, als: 'center' }}>
      <XStack
        jc="space-between"
        ai="center"
        gap="$4"
        fw="wrap"
        $sm={{ fd: 'column', ai: 'stretch', gap: '$3' }}
      >
        <YStack gap="$2" f={1} minWidth={220}>
          <SizableText size="$7" fow="700">
            My Organizations
          </SizableText>
          <Paragraph size="$3" color="$gray11">
            Manage the companies you collaborate with across projects.
          </Paragraph>
        </YStack>

        <Button
          {...createLink}
          size="$4"
          br="$10"
          icon={Building2}
          accessibilityRole="link"
          alignSelf="flex-start"
          $sm={{ w: '100%' }}
        >
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
            gap="$3"
          >
            <XStack gap="$3" ai="center">
              <Building2 size={20} color="$gray11" />
              <SizableText size="$5" fow="600">
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
          </Card>
        ))}
      </YStack>
    </YStack>
  )
}
