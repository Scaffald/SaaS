import { z } from "zod";

/**
 * Education Profile Form Schema
 * LinkedIn-style education tracking
 */
export const educationProfileSchema = z.object({
  // Education level (existing field)
  education_level: z
    .enum([
      "High School",
      "Some College",
      "Associate Degree",
      "Bachelor Degree",
      "Master Degree",
      "Doctoral Degree",
      "Professional Degree",
      "Trade School",
      "Apprenticeship",
    ])
    .optional(),

  // Detailed education entries
  education_entries: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        university_id: z.string().uuid(
          "Please select an institution from the catalog",
        ),
        institution_name: z.string().optional(), // Derived from university catalog
        degree_type: z
          .enum([
            "High School Diploma",
            "GED",
            "Certificate",
            "Associate Degree",
            "Bachelor Degree",
            "Master Degree",
            "Doctoral Degree",
            "Professional Degree",
            "Trade Certification",
            "Apprenticeship",
          ])
          .optional(),
        field_of_study: z.string().optional(),
        start_date: z.string().optional(), // ISO date string
        end_date: z.string().optional(), // ISO date string
        is_current: z.boolean().default(false),
        gpa: z.number().min(0).max(4.0).optional(),
        honors: z.array(z.string()).optional(),
        activities: z.string().max(500).optional(),
        description: z.string().max(500).optional(),
        location: z.string().optional(),
        is_verified: z.boolean().default(false),
      }),
    )
    .optional(),
});

export type EducationProfileFormData = z.infer<typeof educationProfileSchema>;

export const educationProfileDefaults: Partial<EducationProfileFormData> = {
  education_level: undefined,
  education_entries: [],
};

// Helper function to create new education entry
export const createNewEducationEntry = () => ({
  id: undefined,
  university_id: "",
  institution_name: "",
  degree_type: undefined,
  field_of_study: "",
  start_date: "",
  end_date: "",
  is_current: false,
  gpa: undefined,
  honors: [],
  activities: "",
  description: "",
  location: "",
  is_verified: false,
});

// Education level options
export const EDUCATION_LEVEL_OPTIONS = [
  "High School",
  "Some College",
  "Associate Degree",
  "Bachelor Degree",
  "Master Degree",
  "Doctoral Degree",
  "Professional Degree",
  "Trade School",
  "Apprenticeship",
] as const;

// Degree type options
export const DEGREE_TYPE_OPTIONS = [
  "High School Diploma",
  "GED",
  "Certificate",
  "Associate Degree",
  "Bachelor Degree",
  "Master Degree",
  "Doctoral Degree",
  "Professional Degree",
  "Trade Certification",
  "Apprenticeship",
] as const;

// Common honors/achievements
export const COMMON_HONORS = [
  "Summa Cum Laude",
  "Magna Cum Laude",
  "Cum Laude",
  "Dean's List",
  "Honor Roll",
  "Valedictorian",
  "Salutatorian",
  "Academic Scholarship",
  "Merit Scholarship",
] as const;

// Common fields of study for trade/technical
export const COMMON_TRADE_FIELDS = [
  "Electrical",
  "Plumbing",
  "HVAC",
  "Welding",
  "Carpentry",
  "Automotive",
  "Construction Management",
  "Heavy Equipment Operation",
  "Manufacturing Technology",
  "Safety Management",
] as const;
