import { Button, Paragraph, SizableText, XStack, YStack } from '@app/ui'
import { Building2, Users } from '@tamagui/lucide-icons'
import { useMemo } from 'react'
import { useLink } from 'solito/link'

import { useOrganizations } from '@app/core/utils/useOrganizations'
import { ROUTES, DASHBOARD_ROUTES } from '@app/core/constants/routes'

import { DashboardCard } from '../primitives'

const EMPLOYEE_LABELS: Record<string, string> = {
  '1-10': '1-10 employees',
  '11-50': '11-50 employees',
  '51-200': '51-200 employees',
  '201-500': '201-500 employees',
  '501-1000': '501-1,000 employees',
  '1000+': '1,000+ employees',
}

const REVENUE_LABELS: Record<string, string> = {
  'lt-1m': 'Less than $1M',
  '1m-5m': '$1M - $5M',
  '5m-20m': '$5M - $20M',
  '20m-50m': '$20M - $50M',
  '50m-100m': '$50M - $100M',
  '100m+': '$100M+',
}

const formatRoleLabel = (roleName: string | null, isAdmin: boolean) => {
  if (!roleName) return 'Member'
  if (isAdmin) return 'Admin'
  return roleName.charAt(0).toUpperCase() + roleName.slice(1)
}

const formatEmployeeRange = (value: string | null) => {
  if (!value) return null
  return EMPLOYEE_LABELS[value] ?? value
}

const formatRevenueRange = (value: string | null) => {
  if (!value) return null
  return REVENUE_LABELS[value] ?? value
}

export const OrganizationQuickActionsCard = () => {
  const { data: organizations, isPending, error } = useOrganizations()
  const createLink = useLink({
    href:
      DASHBOARD_ROUTES.ORGANIZATIONS?.childrenArray?.find(
        (r) => r.path === '/dashboard/organizations/new'
      )?.fullPath || '/dashboard/organizations/new',
  })

  const content = useMemo(() => {
    if (error) {
      return (
        <Paragraph size="$2" color="$red11">
          We couldn’t load your organizations right now. Please try again in a moment.
        </Paragraph>
      )
    }

    if (isPending) {
      return (
        <Paragraph size="$2" color="$gray11">
          Loading your organizations…
        </Paragraph>
      )
    }

    if (!organizations || organizations.length === 0) {
      return (
        <Paragraph size="$2" color="$gray11">
          You’re not part of any organizations yet. Create one to unlock hiring and collaboration
          tools.
        </Paragraph>
      )
    }

    return (
      <YStack gap="$3">
        {organizations.map((organization) => {
          const employeeLabel = formatEmployeeRange(organization.employee_count_range)
          const revenueLabel = formatRevenueRange(organization.annual_revenue_range)

          return (
            <YStack
              key={organization.assignment_id}
              gap="$2"
              p="$3"
              br="$4"
              bg="$color2"
              borderColor="$color3"
              borderWidth={1}
            >
              <XStack gap="$3" ai="center">
                <Users size={18} color="$gray11" />
                <SizableText size="$4" fontWeight="600">
                  {organization.organization_name ?? 'Untitled organization'}
                </SizableText>
              </XStack>

              <Paragraph size="$2" color="$gray11">
                Role: {formatRoleLabel(organization.role_name, organization.is_admin)}
              </Paragraph>

              <XStack gap="$4" fw="wrap">
                {employeeLabel ? (
                  <Paragraph size="$2" color="$gray11">
                    Team size: {employeeLabel}
                  </Paragraph>
                ) : null}
                {revenueLabel ? (
                  <Paragraph size="$2" color="$gray11">
                    Revenue: {revenueLabel}
                  </Paragraph>
                ) : null}
                {organization.website_url ? (
                  <Paragraph size="$2" color="$gray11">
                    {organization.website_url}
                  </Paragraph>
                ) : null}
              </XStack>
            </YStack>
          )
        })}
      </YStack>
    )
  }, [error, isPending, organizations])

  return (
    <DashboardCard>
      <YStack gap="$4">
        <XStack jc="space-between" ai="center" gap="$4" $sm={{ fd: 'column', ai: 'flex-start' }}>
          <YStack gap="$1">
            <SizableText size="$5" fontWeight="700">
              Organizations
            </SizableText>
            <Paragraph size="$2" color="$gray11">
              Manage the companies you collaborate with across projects.
            </Paragraph>
          </YStack>

          <Button {...createLink} size="$3" br="$10" icon={Building2} accessibilityRole="link">
            Create organization
          </Button>
        </XStack>

        {content}
      </YStack>
    </DashboardCard>
  )
}

export default OrganizationQuickActionsCard
