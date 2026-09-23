import { ROUTES } from '@scf/core/constants/routes'
import { BackgroundCheckWizard } from '@scf/core/features/background-check'
import { ProfilePage } from '@scf/core/features/profile/ProfilePage'

/**
 * Starting a background check (#830).
 *
 * This was a bare `SafeAreaView` with `headerShown: false` — no breadcrumb,
 * no heading, no way back except the OS gesture, and none of the screen
 * rhythm the rest of Profile uses. It sits on the shared shell now, like
 * every other Profile screen.
 */
export default function BackgroundCheckInitiateScreen() {
  return (
    <ProfilePage
      breadcrumbs={[
        { route: ROUTES.PROFILE },
        { route: ROUTES.PROFILE.ID_VERIFICATION },
        { route: ROUTES.PROFILE.BACKGROUND_CHECK.INITIATE },
      ]}
      screenTitle="Start a background check"
      screenTip="Pick what gets checked, give consent, and pay. You can stop and come back."
      leftContent={<BackgroundCheckWizard />}
    />
  )
}
