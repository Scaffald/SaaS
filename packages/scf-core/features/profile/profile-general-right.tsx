import { Stack } from '@scaffald/ui'
import { VanityUrlSection } from './components/VanityUrlSection'

/**
 * Profile General Right Component
 * The general-info settings that don't fit the form: the public profile URL.
 *
 * The resume-import card used to live here too. /profile/resume ended up
 * presenting the same action three times — this card, the Resume Import
 * accordion section, and a ResumeImportWidget nested inside that section under
 * copy telling the user to go to a different screen (#589). Import now lives in
 * exactly one place: the Resume Import accordion section.
 *
 * A "General Information — update your basic profile information" card opened
 * this rail, restating the section beside it; it went with #1190.
 */
export function ProfileGeneralRight() {
  return (
    <Stack gap={16}>
      <VanityUrlSection />
      {/* TODO: Uncomment this when we implement fully */}
      {/* <WorkLogVisibilitySettingsCard /> */}
    </Stack>
  )
}
