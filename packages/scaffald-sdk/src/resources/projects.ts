/**
 * Projects Resource
 * Project management with sites, addresses, and worker management
 */

import { Resource } from './base.js'

// ============================================================================
// Types
// ============================================================================

export type ProjectStatus = 'planning' | 'active' | 'completed' | 'on_hold'
export type LocationVisibility = 'public' | 'authenticated' | 'organization_only' | 'private'
export type WorkerStatus = 'pending' | 'approved' | 'rejected'

export interface Project {
  id: string
  organization_id: string
  name: string
  description: string | null
  status: ProjectStatus
  start_date: string | null
  end_date: string | null
  location_visibility: LocationVisibility
  location_visibility_override: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface ProjectSite {
  id: string
  project_id: string
  site_id: string
  is_primary: boolean
  created_at: string
}

export interface ProjectAddress {
  id: string
  project_id: string
  address_id: string
  is_primary: boolean
  created_at: string
}

export interface ProjectWorker {
  id: string
  project_id: string
  user_id: string
  job_id: string | null
  status: WorkerStatus
  claimed_by_worker: boolean
  assigned_by_manager: boolean
  approved_by: string | null
  approved_at: string | null
  start_date: string | null
  end_date: string | null
  role_on_project: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ProjectWithRelations extends Project {
  project_sites?: Array<{
    is_primary: boolean
    site?: {
      id: string
      site_identifier: string
      boundary: unknown
      area_sqft: number | null
      zoning_classification: string | null
      jurisdiction: string | null
      metadata: Record<string, unknown> | null
    }
  }>
  project_addresses?: Array<{
    is_primary: boolean
    address?: {
      id: string
      address: string
      geo: unknown
      property_type: string | null
      metadata: Record<string, unknown> | null
    }
  }>
  project_workers?: ProjectWorker[]
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface CreateProjectParams {
  organizationId: string
  name: string
  description?: string
  status?: ProjectStatus
  startDate?: string // YYYY-MM-DD
  endDate?: string // YYYY-MM-DD
  locationVisibility?: LocationVisibility
  locationVisibilityOverride?: boolean
}

export interface CreateProjectResponse {
  project: Project
}

export interface UpdateProjectParams {
  id: string
  name?: string
  description?: string | null
  status?: ProjectStatus
  startDate?: string | null // YYYY-MM-DD
  endDate?: string | null // YYYY-MM-DD
  locationVisibility?: LocationVisibility
  locationVisibilityOverride?: boolean
}

export interface UpdateProjectResponse {
  project: Project
}

export interface GetProjectParams {
  id: string
}

export interface GetProjectResponse {
  project: ProjectWithRelations
}

export interface ListProjectsParams {
  organizationId?: string
  status?: ProjectStatus
  limit?: number
  offset?: number
}

export interface ListProjectsResponse {
  projects: Project[]
  count: number
}

export interface AddSiteParams {
  projectId: string
  siteId: string
  isPrimary?: boolean
}

export interface AddSiteResponse {
  project_site: ProjectSite
  overlaps: Array<{
    site_id: string
    overlap_area: number
    overlap_percentage: number
  }>
}

export interface AddAddressParams {
  projectId: string
  addressId: string
  isPrimary?: boolean
}

export interface AddAddressResponse {
  project_address: ProjectAddress
}

export interface AddWorkerParams {
  projectId: string
  userId: string
  jobId?: string
  startDate?: string // YYYY-MM-DD
  endDate?: string // YYYY-MM-DD
  roleOnProject?: string
  notes?: string
}

export interface AddWorkerResponse {
  worker: ProjectWorker
}

export interface ClaimWorkParams {
  projectId: string
  jobId?: string
  startDate?: string // YYYY-MM-DD
  endDate?: string // YYYY-MM-DD
  roleOnProject?: string
  notes?: string
}

export interface ClaimWorkResponse {
  worker: ProjectWorker
}

export interface ApproveWorkerParams {
  projectWorkerId: string
}

export interface ApproveWorkerResponse {
  worker: ProjectWorker
}

export interface RejectWorkerParams {
  projectWorkerId: string
  reason?: string
}

export interface RejectWorkerResponse {
  worker: ProjectWorker
}

// ============================================================================
// Projects Resource
// ============================================================================

export class Projects extends Resource {
  /**
   * Create a new project
   */
  async create(params: CreateProjectParams): Promise<Project> {
    const response = await this.post<CreateProjectResponse>('/projects', {
      organization_id: params.organizationId,
      name: params.name,
      description: params.description,
      status: params.status,
      start_date: params.startDate,
      end_date: params.endDate,
      location_visibility: params.locationVisibility,
      location_visibility_override: params.locationVisibilityOverride,
    })
    return response.project
  }

  /**
   * Update a project
   */
  async update(params: UpdateProjectParams): Promise<Project> {
    const response = await this.patch<UpdateProjectResponse>(`/projects/${params.id}`, {
      name: params.name,
      description: params.description,
      status: params.status,
      start_date: params.startDate,
      end_date: params.endDate,
      location_visibility: params.locationVisibility,
      location_visibility_override: params.locationVisibilityOverride,
    })
    return response.project
  }

  /**
   * Get a project by ID with related data
   */
  async get(params: GetProjectParams): Promise<ProjectWithRelations> {
    const response = await this.get<GetProjectResponse>(`/projects/${params.id}`)
    return response.project
  }

  /**
   * List projects with pagination and filters
   */
  async list(params?: ListProjectsParams): Promise<ListProjectsResponse> {
    return this.get<ListProjectsResponse>('/projects', {
      organization_id: params?.organizationId,
      status: params?.status,
      limit: params?.limit,
      offset: params?.offset,
    })
  }

  /**
   * Add a site to a project
   */
  async addSite(params: AddSiteParams): Promise<AddSiteResponse> {
    return this.post<AddSiteResponse>(`/projects/${params.projectId}/sites`, {
      site_id: params.siteId,
      is_primary: params.isPrimary,
    })
  }

  /**
   * Add an address to a project
   */
  async addAddress(params: AddAddressParams): Promise<AddAddressResponse> {
    return this.post<AddAddressResponse>(`/projects/${params.projectId}/addresses`, {
      address_id: params.addressId,
      is_primary: params.isPrimary,
    })
  }

  /**
   * Manager assigns a worker to a project
   */
  async addWorker(params: AddWorkerParams): Promise<ProjectWorker> {
    const response = await this.post<AddWorkerResponse>(`/projects/${params.projectId}/workers`, {
      user_id: params.userId,
      job_id: params.jobId,
      start_date: params.startDate,
      end_date: params.endDate,
      role_on_project: params.roleOnProject,
      notes: params.notes,
    })
    return response.worker
  }

  /**
   * Worker claims they worked on a project
   */
  async claimWork(params: ClaimWorkParams): Promise<ProjectWorker> {
    const response = await this.post<ClaimWorkResponse>(
      `/projects/${params.projectId}/workers/claim`,
      {
        job_id: params.jobId,
        start_date: params.startDate,
        end_date: params.endDate,
        role_on_project: params.roleOnProject,
        notes: params.notes,
      }
    )
    return response.worker
  }

  /**
   * Manager approves a worker claim
   */
  async approveWorker(params: ApproveWorkerParams): Promise<ProjectWorker> {
    const response = await this.post<ApproveWorkerResponse>(
      `/projects/workers/${params.projectWorkerId}/approve`,
      {}
    )
    return response.worker
  }

  /**
   * Manager rejects a worker claim
   */
  async rejectWorker(params: RejectWorkerParams): Promise<ProjectWorker> {
    const response = await this.post<RejectWorkerResponse>(
      `/projects/workers/${params.projectWorkerId}/reject`,
      {
        reason: params.reason,
      }
    )
    return response.worker
  }
}
