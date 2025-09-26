import { useSupabase } from '@app/core/utils/supabase/useSupabase'
import type { BasicInfoFormValues } from '../schemas/basic-info-schema'
import type { WorkSkillsFormValues } from '../schemas/work-skills-schema'
import type { TravelComplianceFormValues } from '../schemas/travel-compliance-schema'
import type { ContactAvailabilityFormValues } from '../schemas/contact-availability-schema'

type MutationContext = {
  supabase: ReturnType<typeof useSupabase>
  userId: string
  updateProfile?: () => Promise<unknown> | void
}

export const persistBasicInfo = async ({
  supabase,
  userId,
  values,
  updateProfile,
}: MutationContext & { values: BasicInfoFormValues }) => {
  const firstName = values.firstName.trim()
  const lastName = values.lastName.trim()
  const fullName = `${firstName} ${lastName}`.trim() || null

  const [{ error: profileError }, { error: userError }, { error: privateError }] =
    await Promise.all([
      // Update profiles table
      supabase
        .from('profiles')
        .update({ name: fullName })
        .eq('id', userId),

      // Update users table
      supabase
        .from('users')
        .update({ display_name: fullName })
        .eq('id', userId),

      // Update user_private table
      supabase
        .from('user_private')
        .upsert(
          {
            user_id: userId,
            first_name: firstName,
            last_name: lastName,
            phone: values.phone?.trim() || null,
            location: values.location.trim(),
            us_resident: values.usResident,
            us_passport: values.usPassport,
            veteran: values.veteran,
          },
          { onConflict: 'user_id' }
        ),
    ])

  if (profileError) throw new Error(profileError.message)
  if (userError) throw new Error(userError.message)
  if (privateError) throw new Error(privateError.message)

  await updateProfile?.()
}

export const persistWorkSkills = async ({
  supabase,
  userId,
  values,
  updateProfile,
}: MutationContext & { values: WorkSkillsFormValues }) => {
  const yearsOfExperience = Number(values.yearsExperience)
  const headline = values.headline.trim() || null
  const bio = values.bio?.trim() || null

  const { error: userError } = await supabase
    .from('users')
    .update({
      years_of_experience: Number.isFinite(yearsOfExperience) ? yearsOfExperience : null,
      headline,
      bio,
      industry_id: values.industryId || null,
      skills_summary: { primary: values.primarySkills },
    })
    .eq('id', userId)

  if (userError) throw new Error(userError.message)

  // Also update profiles table bio
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ about: bio })
    .eq('id', userId)

  if (profileError) throw new Error(profileError.message)

  await updateProfile?.()
}

export const persistTravelCompliance = async ({
  supabase,
  userId,
  values,
  updateProfile,
}: MutationContext & { values: TravelComplianceFormValues }) => {
  const travelMileage =
    values.openToTravel && values.travelMileage ? Number(values.travelMileage) : null

  // Parse certifications (one per line)
  const certificationEntries = values.certifications
    ? values.certifications
        .split('\n')
        .map((cert) => cert.trim())
        .filter((cert) => cert.length > 0)
    : []

  const { error: privateError } = await supabase.from('user_private').upsert(
    {
      user_id: userId,
      open_to_travel: values.openToTravel,
      travel_mileage: travelMileage,
      drivers_license_class: values.driversLicenseClass || null,
      education_level: values.educationLevel || null,
      certifications: certificationEntries,
    },
    { onConflict: 'user_id' }
  )

  if (privateError) throw new Error(privateError.message)

  await updateProfile?.()
}

export const persistContactAvailability = async ({
  supabase,
  userId,
  values,
  updateProfile,
}: MutationContext & { values: ContactAvailabilityFormValues }) => {
  const hourlyRateCents = values.hourlyRate ? Math.round(Number(values.hourlyRate) * 100) : null

  const { error: privateError } = await supabase.from('user_private').upsert(
    {
      user_id: userId,
      contact_prefs: values.contactMethods,
      phone_os: values.phoneOs || null,
      availability: values.availability,
      hourly_rate_cents: hourlyRateCents,
    },
    { onConflict: 'user_id' }
  )

  if (privateError) throw new Error(privateError.message)

  await updateProfile?.()
}
