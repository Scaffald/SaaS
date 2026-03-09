import { ProfileSectionIntro } from "@scf/core/features/profile/components";
import { Stack } from "@scaffald/ui";

/**
 * Profile Employment Right Component
 * Navigation and overview for employment profile settings
 */
export function ProfileEmploymentRight() {
  return (
    <Stack gap={16}>
      <ProfileSectionIntro
        title="Employment Preferences"
        description="Update your employment preferences including location, travel willingness, availability, and compensation."
      />
    </Stack>
  );
}
