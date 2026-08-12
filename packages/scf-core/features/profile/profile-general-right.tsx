import { ProfileSectionIntro } from "@scf/core/features/profile/components";
import { Stack } from "@scaffald/ui";
import { VanityUrlSection } from "./components/VanityUrlSection";

/**
 * Profile General Right Component
 * Navigation and overview for general profile settings with animated tips
 *
 * The resume-import card used to live here too. /profile/resume ended up
 * presenting the same action three times — this card, the Resume Import
 * accordion section, and a ResumeImportWidget nested inside that section under
 * copy telling the user to go to a different screen (#589). Import now lives in
 * exactly one place: the Resume Import accordion section.
 */
export function ProfileGeneralRight() {
  return (
    <Stack gap={16}>
      <ProfileSectionIntro
        title="General Information"
        description="Update your basic profile information including your name, photo, and contact details."
      />

      <VanityUrlSection />
      {/* TODO: Uncomment this when we implement fully */}
      {/* <WorkLogVisibilitySettingsCard /> */}
    </Stack>
  );
}
