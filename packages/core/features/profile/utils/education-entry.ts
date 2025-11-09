import { DEGREE_TYPE_OPTIONS } from "../config";
import type { EducationEntry, EducationEntryFormValues } from "../types/education";

type DegreeOption = (typeof DEGREE_TYPE_OPTIONS)[number];

/**
 * Normalize persisted education entries into form-friendly values.
 */
export const normalizeEducationEntry = (
  entry: EducationEntry,
): EducationEntryFormValues => {
  const rawDegreeType = entry.degree_type ?? undefined;
  const isStandardDegree =
    rawDegreeType != null &&
    (DEGREE_TYPE_OPTIONS as readonly string[]).includes(rawDegreeType as DegreeOption);

  const degreeType: DegreeOption | undefined = isStandardDegree
    ? (rawDegreeType as DegreeOption)
    : rawDegreeType
      ? "Other"
      : undefined;

  const customDegreeType = isStandardDegree
    ? entry.custom_degree_type ?? undefined
    : rawDegreeType ?? entry.custom_degree_type ?? undefined;

  return {
    id: entry.id,
    university_id: entry.university_id ?? undefined,
    institution_name: entry.institution_name ?? "",
    is_verified: entry.is_verified ?? false,
    degree_type: degreeType,
    custom_degree_type: customDegreeType,
    field_of_study: entry.field_of_study ?? undefined,
    start_date: entry.start_date ?? "",
    end_date: entry.end_date ?? undefined,
    expected_graduation_date: entry.expected_graduation_date ?? undefined,
    is_current: entry.is_current ?? false,
    gpa:
      typeof entry.gpa === "number"
        ? entry.gpa
        : entry.gpa != null && entry.gpa !== ""
          ? Number.parseFloat(String(entry.gpa))
          : undefined,
    description: entry.description ?? undefined,
    location: entry.location ?? undefined,
  };
};
