import { Resource } from './base.js'

export interface OfficeUser {
  id: string
  username: string | null
  display_name: string | null
  first_name: string
  last_name: string
  avatar_path: string | null
  created_at: string | undefined
  updated_at: string | undefined
}

export interface OfficeListUsersResponse {
  users: OfficeUser[]
  total: number
}

export interface OfficeUpdateUserParams {
  profile?: {
    first_name?: string
    last_name?: string
    display_name?: string
    bio?: string
  }
  privateData?: {
    email?: string
    phone_number?: string
    birth_date?: string
    location?: string
    employment_status?: string
    job_search_status?: string
    years_of_experience?: number
    current_title?: string
    current_employer?: string
  }
}

export interface OfficeUserGeneral {
  first_name: string
  last_name: string
  about: string
  avatar_path: string
  email: string
  phone: string
  address: {
    street: string
    city: string
    state: string
    zip: string
    country: string
    latitude?: number
    longitude?: number
  }
}

export interface OfficeUpdateUserGeneralParams {
  first_name?: string
  last_name?: string
  about?: string
  avatar_path?: string
  address?: {
    street?: string
    city?: string
    state?: string
    zip?: string
    country?: string
    latitude?: number
    longitude?: number
  }
}

export interface OfficeUserEmployment {
  preferred_work_locations: unknown[]
  open_to_travel: boolean
  travel_distance_miles: number
  us_resident: boolean
  us_passport: boolean
  drivers_license_classes: string[]
  military_status: string[]
  availability: string[]
  hourly_rate: number | null | undefined
}

export interface OfficeUpdateUserEmploymentParams {
  preferred_work_locations?: unknown[]
  open_to_travel?: boolean
  travel_distance_miles?: number
  us_resident?: boolean
  us_passport?: boolean
  drivers_license_classes?: string[]
  military_status?: string[]
  availability?: string[]
  hourly_rate?: number | null
}

export class OfficeUsers extends Resource {
  async list(): Promise<OfficeListUsersResponse> {
    return this.get<OfficeListUsersResponse>('/v1/office/users')
  }

  async delete(id: string): Promise<{ success: boolean }> {
    return this.del<{ success: boolean }>(`/v1/office/users/${id}`)
  }

  async update(id: string, params: OfficeUpdateUserParams): Promise<{ success: boolean }> {
    return this.patch<{ success: boolean }>(`/v1/office/users/${id}`, params)
  }

  async getUserGeneral(userId: string): Promise<OfficeUserGeneral> {
    return this.get<OfficeUserGeneral>(`/v1/office/users/${userId}/general`)
  }

  async updateUserGeneral(
    userId: string,
    params: OfficeUpdateUserGeneralParams
  ): Promise<{ success: boolean }> {
    return this.patch<{ success: boolean }>(`/v1/office/users/${userId}/general`, params)
  }

  async getUserEmployment(userId: string): Promise<OfficeUserEmployment> {
    return this.get<OfficeUserEmployment>(`/v1/office/users/${userId}/employment`)
  }

  async updateUserEmployment(
    userId: string,
    params: OfficeUpdateUserEmploymentParams
  ): Promise<{ success: boolean }> {
    return this.patch<{ success: boolean }>(`/v1/office/users/${userId}/employment`, params)
  }
}
