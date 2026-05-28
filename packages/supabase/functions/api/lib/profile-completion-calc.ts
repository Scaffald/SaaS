/**
 * Profile completion calculation — weighted section scoring.
 *
 * Pure functions (no I/O) so they can be unit-tested without a database.
 * Ported from the canonical tRPC implementation
 * (functions/trpc/routers/profile/completion.router.ts) during the
 * tRPC → REST migration; the REST `getStatus` handler had been left as a
 * stub that only credited a `headline`, so seeded profiles showed 0% (SC-86).
 */

import {
  PROFILE_WIZARD_STEP_WEIGHTS,
  PROFILE_WIZARD_STEPS,
  type ProfileWizardStepId,
} from "./profile-wizard-schema.ts";

export interface SectionStatus {
  id: ProfileWizardStepId;
  title: string;
  weight: number;
  completed: boolean;
  missingFields: string[];
}

export interface CompletionInputs {
  /** Row from core.profile (first_name, last_name, address, preferred_work_locations, education_level). */
  profile: Record<string, unknown> | null;
  /** core.users.headline. */
  headline: unknown;
  skillsCount: number;
  certificationsCount: number;
  educationCount: number;
  /** core.user_experience rows (need a job_title + company_name to count). */
  experience: Array<Record<string, unknown>>;
}

const SECTION_TITLES: Record<ProfileWizardStepId, string> = {
  general: "General Info",
  skills: "Core Skills",
  experience: "Recent Experience",
  certifications: "Certifications",
  preferences: "Work Preferences",
  education: "Education",
};

const COMPLETION_MILESTONES = [25, 50, 75, 100] as const;

const text = (value: unknown): string => `${value ?? ""}`.trim();

export function getSectionStatuses(inputs: CompletionInputs): SectionStatus[] {
  const profile = inputs.profile ?? {};

  const generalMissing: string[] = [];
  if (text(profile.first_name).length === 0) generalMissing.push("first_name");
  if (text(profile.last_name).length === 0) generalMissing.push("last_name");
  if (text(inputs.headline).length === 0) generalMissing.push("headline");

  const skillsComplete = inputs.skillsCount >= 3;

  const experienceComplete = inputs.experience.some(
    (entry) =>
      text(entry?.job_title).length > 0 && text(entry?.company_name).length > 0,
  );

  const certificationsComplete = inputs.certificationsCount > 0;

  const preferredLocations = Array.isArray(profile.preferred_work_locations)
    ? (profile.preferred_work_locations as unknown[])
    : [];
  const preferencesComplete = preferredLocations.length > 0 ||
    text(profile.address).length > 0;

  const educationComplete = text(profile.education_level).length > 0 ||
    inputs.educationCount > 0;

  const sectionMap: Record<ProfileWizardStepId, SectionStatus> = {
    general: {
      id: "general",
      title: SECTION_TITLES.general,
      weight: PROFILE_WIZARD_STEP_WEIGHTS.general,
      completed: generalMissing.length === 0,
      missingFields: generalMissing,
    },
    skills: {
      id: "skills",
      title: SECTION_TITLES.skills,
      weight: PROFILE_WIZARD_STEP_WEIGHTS.skills,
      completed: skillsComplete,
      missingFields: skillsComplete ? [] : ["skills>=3"],
    },
    experience: {
      id: "experience",
      title: SECTION_TITLES.experience,
      weight: PROFILE_WIZARD_STEP_WEIGHTS.experience,
      completed: experienceComplete,
      missingFields: experienceComplete ? [] : ["experience_entry"],
    },
    certifications: {
      id: "certifications",
      title: SECTION_TITLES.certifications,
      weight: PROFILE_WIZARD_STEP_WEIGHTS.certifications,
      completed: certificationsComplete,
      missingFields: certificationsComplete ? [] : ["certification_entry"],
    },
    preferences: {
      id: "preferences",
      title: SECTION_TITLES.preferences,
      weight: PROFILE_WIZARD_STEP_WEIGHTS.preferences,
      completed: preferencesComplete,
      missingFields: preferencesComplete ? [] : ["work_location_or_address"],
    },
    education: {
      id: "education",
      title: SECTION_TITLES.education,
      weight: PROFILE_WIZARD_STEP_WEIGHTS.education,
      completed: educationComplete,
      missingFields: educationComplete ? [] : ["education_entry"],
    },
  };

  return PROFILE_WIZARD_STEPS.map((step) => sectionMap[step]);
}

/** Completion percentage = sum of completed section weights (weights total 100). */
export function completionPercentage(sections: SectionStatus[]): number {
  return sections.reduce(
    (total, section) => total + (section.completed ? section.weight : 0),
    0,
  );
}

export function milestoneBadges(percentage: number) {
  return COMPLETION_MILESTONES.map((threshold) => ({
    id: `milestone-${threshold}`,
    threshold,
    achieved: percentage >= threshold,
    reachedAt: null as string | null,
  }));
}

export function nextMilestone(percentage: number): number | null {
  return COMPLETION_MILESTONES.find((threshold) => threshold > percentage) ??
    null;
}
