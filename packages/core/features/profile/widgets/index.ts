/**
 * Profile Widgets - Self-contained, data-fetching display components
 *
 * These widgets can be used in:
 * - Own profile view (/dashboard/profile) with edit buttons
 * - Other users' public profiles (/dashboard/users/:id)
 * - Dashboard summary view with compact variants
 */

export * from "./types";
export { GeneralInfoWidget } from "./GeneralInfoWidget";
export { ExperienceWidget } from "./ExperienceWidget";
export { EducationWidget } from "./EducationWidget";
export { SkillsWidget } from "./SkillsWidget";
export { CertificationsWidget } from "./CertificationsWidget";
export { PreferencesWidget } from "./PreferencesWidget";
export { ProfileSnapshotWidget } from "./ProfileSnapshotWidget";
export { ReviewsWidget } from "./ReviewsWidget";
export { ProfileCompletionWidget } from "./ProfileCompletionWidget";
export { PortfolioManager } from "./PortfolioManager";
export { PortfolioGallery } from "./PortfolioGallery";
