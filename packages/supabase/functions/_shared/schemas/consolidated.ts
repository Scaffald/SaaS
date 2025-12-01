import { z } from "zod";
import { phoneNumberSchema } from '../phone';

// Phone validation helper (matches frontend validation)
const optionalPhoneNumberSchema = phoneNumberSchema;

// =============================================================================
// PROFILE WIZARD SCHEMAS & CONSTANTS
// =============================================================================

export const PROFILE_WIZARD_STEPS = [
  "general",
  "skills",
  "experience",
  "certifications",
  "preferences",
  "education",
] as const;

export type ProfileWizardStepId = (typeof PROFILE_WIZARD_STEPS)[number];

export const PROFILE_WIZARD_OPTIONAL_STEPS: ProfileWizardStepId[] = [
  "certifications",
  "education",
];

export const PROFILE_WIZARD_REQUIRED_STEPS = PROFILE_WIZARD_STEPS.filter(
  (step) => !PROFILE_WIZARD_OPTIONAL_STEPS.includes(step),
) as ProfileWizardStepId[];

export const PROFILE_WIZARD_STEP_WEIGHTS: Record<ProfileWizardStepId, number> =
  {
    general: 20,
    skills: 20,
    experience: 20,
    certifications: 10,
    preferences: 15,
    education: 15,
  };

export const profileWizardStepSchema = z.enum(PROFILE_WIZARD_STEPS);

const generalStepSchema = z
  .object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    headline: z.string().optional(),
    bio: z.string().nullable().optional(),
  })
  .strip();

const skillsStepSchema = z
  .object({
    skills: z
      .array(
        z.object({
          id: z.string().optional(),
          name: z.string(),
          taxonomy: z.enum(["csi", "onet"]).optional(),
          proficiency: z.number().int().min(1).max(5).optional(),
        }),
      )
      .optional(),
  })
  .strip();

const experienceStepSchema = z
  .object({
    jobTitle: z.string().optional(),
    companyName: z.string().optional(),
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
    isCurrent: z.boolean().optional(),
    summary: z.string().nullable().optional(),
  })
  .strip();

const certificationEntrySchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().optional(),
    issuer: z.string().optional(),
    issuedOn: z.string().nullable().optional(),
    expiresOn: z.string().nullable().optional(),
  })
  .strip();

const certificationsStepSchema = z
  .object({
    certifications: z.array(certificationEntrySchema).optional(),
  })
  .strip();

const preferencesStepSchema = z
  .object({
    locationPreference: z.string().nullable().optional(),
    hourlyRate: z.string().nullable().optional(),
    availability: z.string().nullable().optional(),
    remotePreference: z.enum(["remote", "hybrid", "onsite"]).nullable()
      .optional(),
  })
  .strip();

const educationStepSchema = z
  .object({
    degreeType: z.string().optional(),
    institutionName: z.string().optional(),
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
    isCurrent: z.boolean().optional(),
  })
  .strip();

const profileWizardStepSchemas = {
  general: generalStepSchema,
  skills: skillsStepSchema,
  experience: experienceStepSchema,
  certifications: certificationsStepSchema,
  preferences: preferencesStepSchema,
  education: educationStepSchema,
} as const;

export type ProfileWizardStepData = {
  [Step in ProfileWizardStepId]?: z.infer<
    (typeof profileWizardStepSchemas)[Step]
  >;
};

const profileWizardStepDataSchema = z
  .object({
    general: generalStepSchema.optional(),
    skills: skillsStepSchema.optional(),
    experience: experienceStepSchema.optional(),
    certifications: certificationsStepSchema.optional(),
    preferences: preferencesStepSchema.optional(),
    education: educationStepSchema.optional(),
  })
  .partial()
  .strip();

export const profileWizardSaveStepInputSchema = z.discriminatedUnion("step", [
  z.object({
    step: z.literal("general"),
    data: generalStepSchema,
    skip: z.boolean().optional(),
  }),
  z.object({
    step: z.literal("skills"),
    data: skillsStepSchema,
    skip: z.boolean().optional(),
  }),
  z.object({
    step: z.literal("experience"),
    data: experienceStepSchema,
    skip: z.boolean().optional(),
  }),
  z.object({
    step: z.literal("certifications"),
    data: certificationsStepSchema,
    skip: z.boolean().optional(),
  }),
  z.object({
    step: z.literal("preferences"),
    data: preferencesStepSchema,
    skip: z.boolean().optional(),
  }),
  z.object({
    step: z.literal("education"),
    data: educationStepSchema,
    skip: z.boolean().optional(),
  }),
]);

export const profileWizardCompleteInputSchema = z
  .object({
    celebrate: z.boolean().optional(),
  })
  .strip();

export const profileWizardProgressSchema = z
  .object({
    currentStep: profileWizardStepSchema,
    completedSteps: z.array(profileWizardStepSchema),
    completionPercentage: z.number().min(0).max(100),
    lastSavedAt: z.string().datetime().nullable(),
    requiredSteps: z.array(profileWizardStepSchema),
    completedAt: z.string().datetime().nullable().optional(),
    stepData: profileWizardStepDataSchema.default({}),
  })
  .strip();

export type ProfileWizardProgress = z.infer<typeof profileWizardProgressSchema>;
export type ProfileWizardSaveStepInput = z.infer<
  typeof profileWizardSaveStepInputSchema
>;

export const profileWizardDefaultProgress: ProfileWizardProgress = {
  currentStep: PROFILE_WIZARD_STEPS[0],
  completedSteps: [],
  completionPercentage: 0,
  lastSavedAt: null,
  requiredSteps: PROFILE_WIZARD_REQUIRED_STEPS,
  completedAt: null,
  stepData: {},
};

/**
 * Consolidated schemas for tRPC operations
 * These schemas are shared between client and server to ensure type consistency
 */

// Address schema used in multiple places
export const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

// =============================================================================
// PROFILE GENERAL SCHEMAS
// =============================================================================

export const profileGeneralInputSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(
    50,
    "First name too long",
  ),
  last_name: z.string().min(1, "Last name is required").max(
    50,
    "Last name too long",
  ),
  avatar_path: z.union([z.string().url(), z.string().min(1), z.literal("")])
    .optional(),
  email: z.string().email().optional(),
  phone: optionalPhoneNumberSchema,
  // About field accepts both string (legacy) and JSONContent (TipTap format)
  about: z
    .union([
      z.string().max(1500, "About section must be 1500 characters or less"),
      z
        .object({
          type: z.string(),
          content: z.array(z.any()).optional(),
        })
        .passthrough(), // TipTap JSONContent format
    ])
    .optional()
    .nullable(),
  address: addressSchema.nullable().optional(),
});

export const profileGeneralOutputSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  avatar_path: z.string(),
  email: z.string(),
  phone: optionalPhoneNumberSchema,
  about: z.string(),
  address: addressSchema.nullable(),
});

// =============================================================================
// PROFILE EMPLOYMENT SCHEMAS
// =============================================================================

// Constants for employment options
export const DRIVERS_LICENSE_OPTIONS = [
  "Class M",
  "Class A",
  "Class B",
  "Class C",
  "Class D",
  "CDL A",
  "CDL B",
  "CDL C",
] as const;

export const MILITARY_STATUS_OPTIONS = [
  "Active Duty",
  "Reserve",
  "National Guard",
  "Veteran",
  "Retired",
] as const;

export const AVAILABILITY_OPTIONS = [
  "Part-time",
  "Contract",
  "Full-time",
  "Weekend",
  "Night Shift",
  "Day Shift",
  "Temporary",
  "Short Notice",
] as const;

export const profileEmploymentInputSchema = z
  .object({
    // Preferred work locations (up to 3)
    preferred_work_locations: z
      .array(z.string())
      .max(3, "Maximum 3 work locations allowed")
      .optional(),

    // Travel preferences
    open_to_travel: z.boolean().optional(),
    travel_distance_miles: z.number().min(10).max(250).optional(),

    // Residency (multiple countries but keep US boolean)
    us_resident: z.boolean().optional(),
    authorized_countries: z.array(z.string()).max(
      3,
      "Maximum 3 countries allowed",
    ).optional(),

    // Passport
    us_passport: z.boolean().optional(),

    // Drivers License (multi-select array)
    drivers_license_classes: z.array(z.string()).optional(),

    // Military Status (multi-select)
    military_status: z.array(z.string()).optional(),

    // Availability (multi-select - accepts any string values)
    availability: z.array(z.string()).optional(),

    // Hourly Rate (default 0, 0-200)
    hourly_rate: z.number().min(0).max(200).default(0),
  })
  .partial()
  .superRefine((data, ctx) => {
    // Travel distance is only required if user is open to travel
    if (
      data.open_to_travel &&
      (data.travel_distance_miles === undefined ||
        data.travel_distance_miles === null)
    ) {
      ctx.addIssue({
        path: ["travel_distance_miles"],
        code: z.ZodIssueCode.custom,
        message: "Please select a travel distance",
      });
    }
  });

export const profileEmploymentOutputSchema = z.object({
  preferred_work_locations: z.array(z.string()),
  open_to_travel: z.boolean(),
  travel_distance_miles: z.number(),
  us_resident: z.boolean(),
  authorized_countries: z.array(z.string()),
  us_passport: z.boolean(),
  drivers_license_classes: z.array(z.string()),
  military_status: z.array(z.string()),
  availability: z.array(z.string()),
  hourly_rate: z.number().nullable(),
});

// Default values for employment profile
export const profileEmploymentDefaults: Partial<EmploymentProfileFormData> = {
  preferred_work_locations: [],
  open_to_travel: true,
  travel_distance_miles: 25,
  us_resident: undefined,
  authorized_countries: [],
  us_passport: false,
  drivers_license_classes: [],
  military_status: [],
  availability: [],
  hourly_rate: 0,
};

// =============================================================================
// PROFILE SKILLS SCHEMAS
// =============================================================================

export const profileSkillsInputSchema = z
  .object({
    // Skills array with proficiency
    skills: z
      .array(
        z.object({
          skill_id: z.string().uuid(),
          skill_name: z.string(),
          proficiency: z.number().min(1).max(5).default(3),
          years_experience: z.number().min(0).max(50).optional(),
          is_primary: z.boolean().default(false),
          endorsed_count: z.number().default(0).optional(),
        }),
      )
      .optional(),

    // Industry focus
    industry_id: z.string().uuid().optional(),
    secondary_industries: z.array(z.string().uuid()).max(3).optional(),

    // Skill categories of interest
    skill_categories: z.array(z.string()).optional(),
  })
  .partial();

export const profileSkillsOutputSchema = z.object({
  skills: z.array(
    z.object({
      skill_id: z.string(),
      skill_name: z.string(),
      proficiency: z.number(),
      years_experience: z.number().nullable(),
      is_primary: z.boolean(),
      endorsed_count: z.number(),
    }),
  ),
  industry_id: z.string().nullable(),
  secondary_industries: z.array(z.string()),
  skill_categories: z.array(z.string()),
});

// =============================================================================
// SKILLS API SCHEMAS
// =============================================================================

// Search parent skills input (simplified cascading approach)
export const searchParentSkillsInputSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  industryId: z.string().uuid(),
  limit: z.number().min(1).max(50).optional().default(20),
});

// Parent skill output (now includes hierarchy information)
export const parentSkillSchema = z.object({
  skill_id: z.string(),
  skill_name: z.string(),
  csi_display: z.string().nullable(),
  csi_code: z.array(z.string()).nullable(),
  active: z.boolean(),
  child_count: z.number(),
  parent_id: z.string().uuid().nullable(),
  parent_name: z.string().nullable(),
  depth: z.number(),
  hierarchy_path: z.string().nullable(),
});

// Get skill children input
export const getSkillChildrenInputSchema = z.object({
  parentId: z.string().uuid(),
});

// Skill child output (with hierarchy)
export const skillChildSchema = z.object({
  skill_id: z.string(),
  skill_name: z.string(),
  csi_display: z.string().nullable(),
  csi_code: z.array(z.string()).nullable(),
  parent_id: z.string().nullable(),
  depth: z.number(),
  hierarchy_path: z.string(),
  active: z.boolean(),
  leaf_node: z.boolean(),
});

// Legacy: Keep for backwards compatibility (deprecated)
export const searchSkillsInputSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  industryId: z.string().uuid(),
  limit: z.number().min(1).max(50).optional().default(20),
});

export const skillWithHierarchySchema = z.object({
  skill_id: z.string(),
  skill_name: z.string(),
  csi_display: z.string().nullable(),
  csi_code: z.array(z.string()).nullable(),
  parent_id: z.string().nullable(),
  hierarchy_path: z.string(),
  hierarchy_ids: z.array(z.string()),
  depth: z.number(),
  active: z.boolean(),
});

// Skill details output
export const skillDetailsSchema = z.object({
  skill_id: z.string(),
  skill_name: z.string(),
  csi_display: z.string().nullable(),
  csi_code: z.array(z.string()).nullable(),
  parent_id: z.string().nullable(),
  industry_id: z.string().nullable(),
  industry_name: z.string().nullable(),
  hierarchy_path: z.string(),
  hierarchy_ids: z.array(z.string()),
  active: z.boolean(),
  created_at: z.string(),
});

// User skill with hierarchy output
export const userSkillWithHierarchySchema = z.object({
  skill_id: z.string(),
  skill_name: z.string(),
  csi_display: z.string().nullable(),
  proficiency: z.number().nullable(),
  years_experience: z.number().nullable(),
  source: z.string(),
  last_verified_at: z.string().nullable(),
  hierarchy_path: z.string(),
  hierarchy_ids: z.array(z.string()),
  is_explicit: z.boolean(),
  depth: z.number(),
});

// Add user skill input
export const addUserSkillInputSchema = z.object({
  skillId: z.string().uuid(),
  proficiency: z.number().min(1).max(5),
  yearsExperience: z.number().min(0).max(50).optional(),
});

// Update user skill input
export const updateUserSkillInputSchema = z.object({
  skillId: z.string().uuid(),
  proficiency: z.number().min(1).max(5).optional(),
  yearsExperience: z.number().min(0).max(50).optional(),
});

// Remove user skill input
export const removeUserSkillInputSchema = z.object({
  skillId: z.string().uuid(),
});

// Industry output
export const industrySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  active: z.boolean(),
});

// =============================================================================
// AVATAR UPLOAD SCHEMA
// =============================================================================

/**
 * Avatar upload payload validation
 *
 * Validates client-supplied avatar images before they reach Supabase storage.
 * Guards against oversized payloads, unexpected MIME types, and mismatched filenames.
 */
export const uploadAvatarInputSchema = z.object({
  file: z
    .string()
    .min(1, "Image data is required")
    .max(13_421_772, "Image file size must be under 10MB") // 10MB base64 ≈ 13.4MB
    .regex(
      /^data:image\/(jpeg|jpg|png|webp);base64,/,
      "Invalid image format. Please provide a JPG, PNG, or WebP image.",
    ),
  fileName: z
    .string()
    .min(1, "Filename is required")
    .regex(
      /\.(jpg|jpeg|png|webp)$/i,
      "Filename must end with .jpg, .jpeg, .png, or .webp.",
    ),
  contentType: z
    .string()
    .refine(
      (type) =>
        type === "image/jpeg" ||
        type === "image/jpg" ||
        type === "image/png" ||
        type === "image/webp",
      {
        message: "Content type must be image/jpeg, image/png, or image/webp.",
      },
    ),
});

export const uploadAvatarOutputSchema = z.object({
  success: z.boolean(),
  avatarPath: z.string(),
});

// =============================================================================
// CERTIFICATION FILE UPLOAD SCHEMAS
// =============================================================================

export const uploadCertificationFileInputSchema = z.object({
  certificationId: z.string().uuid(),
  file: z.string(), // Base64 encoded file
  fileName: z.string(),
  contentType: z
    .string()
    .refine(
      (type) =>
        type === "application/pdf" ||
        type === "image/png" ||
        type === "image/jpeg" ||
        type === "image/jpg",
      {
        message: "File must be PDF, PNG, or JPEG",
      },
    ),
});

export const uploadCertificationFileOutputSchema = z.object({
  success: z.boolean(),
  filePath: z.string(),
});

export const deleteCertificationFileInputSchema = z.object({
  certificationId: z.string().uuid(),
  filePath: z.string(),
});

export const deleteCertificationFileOutputSchema = z.object({
  success: z.boolean(),
});

// =============================================================================
// CERTIFICATION CRUD SCHEMAS
// =============================================================================

export const certificationSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  issuing_organization: z.string().min(1),
  issue_date: z.string().optional(),
  expiration_date: z.string().optional(),
  credential_id: z.string().optional(),
  credential_url: z.string().optional(),
  certificate_file_path: z.string().optional(),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
  verification_status: z.enum(["verified", "pending", "unverified"]).default(
    "unverified",
  ),
});

export const saveCertificationsInputSchema = z.object({
  certifications: z.array(certificationSchema),
});

export const saveCertificationsOutputSchema = z.object({
  success: z.boolean(),
  certifications: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      issuing_organization: z.string(),
      issue_date: z.string().nullable(),
      expiration_date: z.string().nullable(),
      credential_id: z.string().nullable(),
      credential_url: z.string().nullable(),
      certificate_file_path: z.string().nullable(),
      description: z.string().nullable(),
      is_active: z.boolean(),
      verification_status: z.string(),
    }),
  ),
});

export const getCertificationsOutputSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    issuing_organization: z.string(),
    issue_date: z.string().nullable(),
    expiration_date: z.string().nullable(),
    credential_id: z.string().nullable(),
    credential_url: z.string().nullable(),
    certificate_file_path: z.string().nullable(),
    description: z.string().nullable(),
    is_active: z.boolean(),
    verification_status: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
  }),
);

export const deleteCertificationInputSchema = z.object({
  certificationId: z.string().uuid(),
});

export const deleteCertificationOutputSchema = z.object({
  success: z.boolean(),
});

// =============================================================================
// DATABASE UPDATE SCHEMAS
// =============================================================================

export const profileUpdateSchema = z.object({
  id: z.string(),
  updated_at: z.string(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  avatar_path: z.string().optional(),
});

export const userPrivateUpdateSchema = z.object({
  user_id: z.string(),
  updated_at: z.string(),
  phone: z.string().optional(),
  about: z.string().optional(),
});

export const userPrivateEmploymentUpdateSchema = z.object({
  user_id: z.string(),
  updated_at: z.string(),
  employment_street: z.string().optional(),
  employment_city: z.string().optional(),
  employment_state: z.string().optional(),
  employment_zip: z.string().optional(),
  employment_country: z.string().optional(),
  preferred_work_locations: z.array(z.string()).optional(),
  open_to_travel: z.boolean().optional(),
  travel_distance_miles: z.number().optional(),
  us_resident: z.boolean().optional(),
  authorized_countries: z.array(z.string()).optional(),
  us_passport: z.boolean().optional(),
  drivers_license_classes: z.array(z.string()).optional(),
  military_status: z.array(z.string()).optional(),
  availability: z.array(z.string()).optional(),
  hourly_rate_cents: z.number().optional(), // Database stores cents as integer
});

// =============================================================================
// INFERRED TYPES FOR EXPORT
// =============================================================================

export type ProfileGeneralInput = z.infer<typeof profileGeneralInputSchema>;
export type ProfileGeneralOutput = z.infer<typeof profileGeneralOutputSchema>;
export type ProfileEmploymentInput = z.infer<
  typeof profileEmploymentInputSchema
>;
export type ProfileEmploymentOutput = z.infer<
  typeof profileEmploymentOutputSchema
>;
export type ProfileSkillsInput = z.infer<typeof profileSkillsInputSchema>;
export type ProfileSkillsOutput = z.infer<typeof profileSkillsOutputSchema>;
export type UploadAvatarInput = z.infer<typeof uploadAvatarInputSchema>;
export type UploadAvatarOutput = z.infer<typeof uploadAvatarOutputSchema>;

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
export type UserPrivateUpdate = z.infer<typeof userPrivateUpdateSchema>;
export type UserPrivateEmploymentUpdate = z.infer<
  typeof userPrivateEmploymentUpdateSchema
>;

// Form data type for client-side components
export type EmploymentProfileFormData = z.infer<
  typeof profileEmploymentInputSchema
>;
