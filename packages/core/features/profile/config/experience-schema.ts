import { z } from "zod";

/**
 * Experience Profile Form Schema
 * LinkedIn-style work experience tracking
 */
export const experienceProfileSchema = z.object({
  experience_entries: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        job_title: z.string().min(1, "Job title is required"),
        company_name: z.string().min(1, "Company name is required"),
        employment_type: z
          .enum([
            "Full-time",
            "Part-time",
            "Contract",
            "Temporary",
            "Internship",
            "Apprenticeship",
            "Freelance",
          ])
          .optional(),
        location: z.string().optional(),
        is_remote: z.boolean().default(false),
        start_date: z.string().optional(), // ISO date string
        end_date: z.string().optional(), // ISO date string
        is_current: z.boolean().default(false),
        description: z.string().max(2000).optional(),
        key_achievements: z.array(z.string()).optional(),
        skills_used: z.array(z.string()).optional(),
        industry: z.string().optional(),
        company_size: z
          .enum([
            "1-10 employees",
            "11-50 employees",
            "51-200 employees",
            "201-500 employees",
            "501-1000 employees",
            "1001-5000 employees",
            "5001+ employees",
          ])
          .optional(),
        salary_range: z.string().optional(),
        is_verified: z.boolean().default(false),
      }),
    )
    .optional(),

  // Overall experience summary
  career_level: z
    .enum([
      "Entry Level",
      "Mid Level",
      "Senior Level",
      "Executive",
      "Specialist",
    ])
    .optional(),
});

export type ExperienceProfileFormData = z.infer<typeof experienceProfileSchema>;

export const experienceProfileDefaults: Partial<ExperienceProfileFormData> = {
  experience_entries: [],
  career_level: undefined,
};

// Helper function to create new experience entry
export const createNewExperienceEntry = () => ({
  id: undefined,
  job_title: "",
  company_name: "",
  employment_type: undefined,
  location: "",
  is_remote: false,
  start_date: "",
  end_date: "",
  is_current: false,
  description: "",
  key_achievements: [],
  skills_used: [],
  industry: "",
  company_size: undefined,
  salary_range: "",
  is_verified: false,
});

// Employment type options
export const EMPLOYMENT_TYPE_OPTIONS = [
  "Full-time",
  "Part-time",
  "Contract",
  "Temporary",
  "Internship",
  "Apprenticeship",
  "Freelance",
] as const;

// Company size options
export const COMPANY_SIZE_OPTIONS = [
  "1-10 employees",
  "11-50 employees",
  "51-200 employees",
  "201-500 employees",
  "501-1000 employees",
  "1001-5000 employees",
  "5001+ employees",
] as const;

// Career level options
export const CAREER_LEVEL_OPTIONS = [
  "Entry Level",
  "Mid Level",
  "Senior Level",
  "Executive",
  "Specialist",
] as const;

// Common job titles for trade/technical roles
export const COMMON_JOB_TITLES = [
  "Electrician",
  "Plumber",
  "HVAC Technician",
  "Welder",
  "Carpenter",
  "Construction Worker",
  "Foreman",
  "Project Manager",
  "Safety Coordinator",
  "Quality Control Inspector",
  "Machine Operator",
  "Maintenance Technician",
  "Equipment Operator",
  "Truck Driver",
  "Warehouse Worker",
] as const;

// Salary ranges
export const SALARY_RANGES = [
  "Under $30,000",
  "$30,000 - $40,000",
  "$40,000 - $50,000",
  "$50,000 - $60,000",
  "$60,000 - $70,000",
  "$70,000 - $80,000",
  "$80,000 - $100,000",
  "$100,000 - $120,000",
  "$120,000+",
] as const;
