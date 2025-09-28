// Client-safe types that mirror the actual tRPC router structure
// This provides proper type inference for tRPC client usage

// Input/Output types for profile endpoints
export type ProfileGeneralInput = {
  first_name?: string
  last_name?: string
  avatar_url?: string
  email?: string
  phone?: string
  about?: string
}

export type ProfileGeneralOutput = {
  first_name: string
  last_name: string
  avatar_url: string
  email: string
  phone: string
  about: string
}

export type ProfileEmploymentInput = {
  address?: {
    street?: string
    city?: string
    state?: string
    zip?: string
    country?: string
  }
  preferred_work_locations?: string[]
  willing_to_travel?: boolean
  travel_distance_miles?: number
  us_resident?: boolean
  residency_countries?: string[]
  us_passport?: boolean
  drivers_license_classes?: string[]
  military_status?: string[]
  availability?: string[]
  hourly_rate?: number
}

export type ProfileEmploymentOutput = {
  address: {
    street: string
    city: string
    state: string
    zip: string
    country: string
  } | null
  preferred_work_locations: string[]
  willing_to_travel: boolean
  travel_distance_miles: number
  us_resident: boolean
  residency_countries: string[]
  us_passport: boolean
  drivers_license_classes: string[]
  military_status: string[]
  availability: string[]
  hourly_rate: number | null
}

export type ProfileSkillsInput = {
  skills?: {
    skill_id: string
    skill_name: string
    proficiency: number
    years_experience?: number
    is_primary: boolean
    endorsed_count?: number
  }[]
  primary_industry_id?: string
  secondary_industries?: string[]
  skill_categories?: string[]
}

export type ProfileSkillsOutput = {
  skills: {
    skill_id: string
    skill_name: string
    proficiency: number
    years_experience: number | null
    is_primary: boolean
    endorsed_count: number
  }[]
  primary_industry_id: string | null
  secondary_industries: string[]
  skill_categories: string[]
}

export type UploadAvatarInput = {
  file: string
  fileName: string
  contentType: string
}

export type UploadAvatarOutput = {
  success: boolean
  avatarUrl: string
}

// tRPC router types for client consumption
export type AppRouter = {
  profile: {
    getGeneral: {
      input: void
      output: ProfileGeneralOutput
    }
    updateGeneral: {
      input: ProfileGeneralInput
      output: { success: boolean }
    }
    getEmployment: {
      input: void
      output: ProfileEmploymentOutput
    }
    updateEmployment: {
      input: ProfileEmploymentInput
      output: { success: boolean }
    }
    getSkills: {
      input: void
      output: ProfileSkillsOutput
    }
    updateSkills: {
      input: ProfileSkillsInput
      output: { success: boolean }
    }
    uploadAvatar: {
      input: UploadAvatarInput
      output: UploadAvatarOutput
    }
  }
}
