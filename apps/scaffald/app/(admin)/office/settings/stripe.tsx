import { OfficeLayout } from '@scf/core/components/layouts/OfficeLayout'
import { StripeSettingsPage } from '@scf/core/features/office/settings/StripeSettingsPage'

// In the office gutter like the other office screens (#1098); the page set its
// own padding before and sat outside the shell's width.
export default function StripeSettingsRoute() {
  return (
    <OfficeLayout leftContent={<StripeSettingsPage />} leftContainerProps={{ minWidth: '100%' }} />
  )
}
