import { AuthCard } from '@scf/core/features/auth/components/AuthCard'
import { LoginScreen } from '@scf/core/features/auth/login-screen'
import { viewportLoader } from '../../../utils/server-viewport'

/** No data of its own; the loader exists so the server lays the page out for the visitor's device (#782). */
export const loader = viewportLoader

/**
 * /auth opens on the form at every width (#1210). Phones used to get a
 * full-screen testimonial carousel first, behind a persisted "seen welcome"
 * flag, so a first-time visitor had to Continue or Skip before the email
 * field appeared; that gate, and the flag read that blanked the page while it
 * loaded, are gone.
 */
export default function Screen() {
  return (
    <AuthCard>
      <LoginScreen />
    </AuthCard>
  )
}
