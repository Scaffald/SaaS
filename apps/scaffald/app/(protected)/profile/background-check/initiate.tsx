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
      // The prototype's header: what this is part of, what it is, and why a
      // worker would do it (#1191). "You can stop and come back" went — the
      // wizard keeps its answers in memory only, so leaving loses them.
      screenKicker="Verification"
      screenTitle="Background check"
      screenTip="A clear check adds a verified badge to your profile that employers can see."
      leftContent={<BackgroundCheckWizard />}
    />
  )
}
