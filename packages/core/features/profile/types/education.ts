import type {
  EducationProfileFormData,
  EducationEntryFormValues as SingleEducationEntryFormValues,
} from '../config'

/**
 * Represents a persisted education entry returned from the profile API.
 * Matches the shape from the profile education router while keeping
 * optional fields nullable for compatibility with Supabase responses.
 */
export interface EducationEntry {
  id?: string
  user_id?: string
  university_id?: string | null
  institution_name: string
  is_verified?: boolean | null
  degree_type?: string | null
  custom_degree_type?: string | null
  field_of_study?: string | null
  start_date?: string | null
  end_date?: string | null
  expected_graduation_date?: string | null
  is_current?: boolean | null
  gpa?: number | string | null
  description?: string | null
  location?: string | null
  created_at?: string
  updated_at?: string
}

type EducationEntries = NonNullable<EducationProfileFormData['education_entries']>

/**
 * Convenience alias for the single education entry form values used by
 * react-hook-form components.
 */
export type EducationEntryFormValues = SingleEducationEntryFormValues

/**
 * Utility to derive the strongly typed entry used in form collections.
 */
export type EducationEntryArrayItem = EducationEntries[number]
