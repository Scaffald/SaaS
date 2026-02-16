// IMPORTANT: OpenAI's zodResponseFormat requires the zod/v3 compat layer.
import { z } from 'zod/v3';

export const CoverageLimitsSchema = z.object({
  each_occurrence: z.number().nullable().optional(),
  general_aggregate: z.number().nullable().optional(),
  products_comp_aggregate: z.number().nullable().optional(),
  personal_adv_injury: z.number().nullable().optional(),
  damage_to_rented_premises: z.number().nullable().optional(),
  medical_expense: z.number().nullable().optional(),
  combined_single_limit: z.number().nullable().optional(),
  bodily_injury_per_person: z.number().nullable().optional(),
  bodily_injury_per_accident: z.number().nullable().optional(),
  property_damage: z.number().nullable().optional(),
  each_accident: z.number().nullable().optional(),
  disease_each_employee: z.number().nullable().optional(),
  disease_policy_limit: z.number().nullable().optional(),
});

export const GLDetailsSchema = z.object({
  claims_made: z.boolean(),
  occurrence: z.boolean(),
  policy_aggregate_type: z.enum(['per_project', 'per_location', 'standard']).nullable().optional(),
});

export const AutoDetailsSchema = z.object({
  any_auto: z.boolean(),
  owned_autos: z.boolean(),
  hired_autos: z.boolean(),
  scheduled_autos: z.boolean(),
  non_owned_autos: z.boolean(),
  auto_symbol: z.string().nullable().optional(),
});

export const UmbrellaDetailsSchema = z.object({
  umbrella_form: z.boolean(),
  excess_form: z.boolean(),
  deductible: z.number().nullable().optional(),
  retention: z.number().nullable().optional(),
});

export const CoverageSchema = z.object({
  type: z.enum(['general_liability', 'auto_liability', 'umbrella', 'workers_comp', 'professional_liability']),
  carrier: z.string(),
  policy_number: z.string(),
  effective_date: z.string().describe('ISO 8601 date format YYYY-MM-DD'),
  expiration_date: z.string().describe('ISO 8601 date format YYYY-MM-DD'),
  limits: CoverageLimitsSchema,
  commercial_general_liability: GLDetailsSchema.nullable().optional(),
  auto_liability: AutoDetailsSchema.nullable().optional(),
  umbrella: UmbrellaDetailsSchema.nullable().optional(),
});

export const EndorsementSchema = z.object({
  code: z.string().describe('Endorsement form number, e.g. CG 20 10 04 13'),
  type: z.enum([
    'additional_insured',
    'waiver_of_subrogation',
    'primary_non_contributory',
    'per_project_aggregate',
    'blanket_additional_insured',
    '30_day_notice_cancellation',
    'other',
  ]),
  description: z.string(),
  applies_to_coverage: z.string().describe('Which coverage type this endorsement modifies'),
  is_blanket: z.boolean().describe('True if endorsement applies to all qualifying entities, not just named ones'),
  restricts_coverage: z.boolean().describe('True if this endorsement restricts rather than expands coverage'),
  key_conditions: z.array(z.string()).describe('Notable conditions or limitations in the endorsement'),
});

export const ExtractedCertificateSchema = z.object({
  document_type: z.enum(['acord_25', 'acord_28', 'policy_dec', 'endorsement_schedule']),

  producer: z.object({
    name: z.string(),
    address: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    contact: z.string().nullable().optional(),
  }),

  insured: z.object({
    name: z.string(),
    address: z.string().nullable().optional(),
    dba: z.string().nullable().optional(),
  }),

  certificate_holder: z.object({
    name: z.string(),
    address: z.string().nullable().optional(),
    is_additional_insured: z.boolean(),
  }).nullable().optional(),

  coverages: z.array(CoverageSchema),

  endorsements: z.array(EndorsementSchema),

  description_of_operations: z.string().nullable().optional(),

  extraction_confidence: z.number().min(0).max(100),
  extraction_notes: z.array(z.string()).describe('Issues, ambiguities, or notable findings during extraction'),
  fields_requiring_review: z.array(z.string()).describe('Field names where confidence is low or data appears ambiguous'),
});

export type ExtractedCertificate = z.infer<typeof ExtractedCertificateSchema>;
