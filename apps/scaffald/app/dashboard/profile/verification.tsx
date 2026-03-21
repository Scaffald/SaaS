import { ROUTES } from '@scf/core/constants/routes'
import { CheckStatusDashboard } from '@scf/core/features/background-check'
import { IdVerificationContent, IdVerificationRight } from '@scf/core/features/id-verification'
import { ProfilePage } from '@scf/core/features/profile/ProfilePage'
import { Accordion, useResponsive } from '@scaffald/ui'

export default function VerificationScreen() {
  const { isDesktop } = useResponsive()

  const leftContent = (
    <Accordion mode="multiple" defaultValue={['verification', 'background-check']}>
      <Accordion.Item value="verification">
        <Accordion.Trigger>ID Verification</Accordion.Trigger>
        <Accordion.Content>
          <IdVerificationContent />
          {!isDesktop && <IdVerificationRight />}
        </Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="background-check">
        <Accordion.Trigger>Background Check</Accordion.Trigger>
        <Accordion.Content>
          <CheckStatusDashboard />
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  )

  const rightContent = isDesktop ? <IdVerificationRight /> : null

  return (
    <ProfilePage
      breadcrumbs={[
        { route: ROUTES.DASHBOARD.PROFILE },
        { route: ROUTES.DASHBOARD.PROFILE.ID_VERIFICATION },
      ]}
      leftContent={leftContent}
      rightContent={rightContent}
    />
  )
}
