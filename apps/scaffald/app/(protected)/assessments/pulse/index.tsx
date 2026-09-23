import { LuscherTestWizard } from '@scf/core/features/luscher-test'

/**
 * Weekly pulse.
 *
 * The wizard supplies its own `DashboardLayout` — breadcrumb, screen header
 * and rail — like the other three assessments. Wrapping it in a second
 * layout here nested one screen shell inside another (#832).
 */
export default function LuscherTestPage() {
  return <LuscherTestWizard />
}
