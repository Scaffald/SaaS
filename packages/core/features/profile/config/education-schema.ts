import { z } from "zod";

/**
 * Education Profile Form Schema
 * LinkedIn-style education tracking
 */
// Single education entry schema (reusable)
const educationEntrySchema = z.object({
  id: z.string().uuid().optional(),
  university_id: z.string().uuid().optional(),
  institution_name: z.string().min(1, "Institution name is required"),
  is_verified: z.boolean().default(false),
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
      "Other",
    ])
    .optional(),
  custom_degree_type: z.string().optional(),
  field_of_study: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  expected_graduation_date: z.string().optional(),
  is_current: z.boolean().default(false),
  gpa: z.number().min(0).max(4.0, "GPA must be between 0.0 and 4.0").optional(),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
  location: z.string().optional(),
})
  .refine(
    (data) => {
      // End date must be after start date when both are provided
      if (
        !data.is_current &&
        data.end_date &&
        data.start_date &&
        new Date(data.end_date) <= new Date(data.start_date)
      ) {
        return false;
      }
      return true;
    },
    { message: "End date must be after start date", path: ["end_date"] }
  )
  .refine(
    (data) => {
      // If degree_type is "Other", custom_degree_type must be provided
      if (data.degree_type === "Other" && !data.custom_degree_type) {
        return false;
      }
      return true;
    },
    { message: "Please specify the degree type", path: ["custom_degree_type"] }
  );

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
  education_entries: z.array(educationEntrySchema).optional(),
});

// Export the single entry schema for use in edit modal
export const singleEducationEntrySchema = educationEntrySchema;

export type EducationProfileFormData = z.infer<typeof educationProfileSchema>;

export const educationProfileDefaults: Partial<EducationProfileFormData> = {
  education_level: undefined,
  education_entries: [],
};

// Helper function to create new education entry
export const createNewEducationEntry = () => ({
  id: undefined,
  university_id: undefined,
  institution_name: "",
  is_verified: false,
  degree_type: undefined,
  custom_degree_type: "",
  field_of_study: "",
  start_date: "",
  end_date: undefined,
  expected_graduation_date: undefined,
  is_current: false,
  gpa: undefined,
  description: "",
  location: "",
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
  "Other",
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
