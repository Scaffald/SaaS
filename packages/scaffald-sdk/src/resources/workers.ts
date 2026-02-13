import { Resource } from './base.js'

/**
 * Worker profile for listing (public discovery)
 */
export interface Worker {
  id: string
  display_name: string
  username: string
  slug: string | null
  about: string | null
  avatar_path: string | null
  created_at: string
  updated_at: string
}

/**
 * Detailed worker profile
 */
export interface WorkerDetailed {
  id: string
  name: string | null
  first_name: string | null
  last_name: string | null
  about: string | null
  avatar_path: string | null
  created_at: string
  updated_at: string
}

/**
 * Parameters for getting workers list
 */
export interface GetWorkersParams {
  search?: string
  industryIds?: string[]
  skillIds?: string[]
  limit?: number
}

/**
 * Response for workers list
 */
export interface GetWorkersResponse {
  workers: Worker[]
  total: number
}

/**
 * Parameters for getting a single worker
 */
export interface GetWorkerByIdParams {
  id: string
}

/**
 * Workers Resource
 * Public discovery of worker profiles
 */
export class Workers extends Resource {
  /**
   * Get all workers with optional filtering
   * Public endpoint for worker discovery
   */
  async getWorkers(params?: GetWorkersParams): Promise<GetWorkersResponse> {
    return this.get<GetWorkersResponse>('/v1/workers', params)
  }

  /**
   * Get a single worker profile by ID
   */
  async getWorkerById(params: GetWorkerByIdParams): Promise<WorkerDetailed> {
    return this.get<WorkerDetailed>(`/v1/workers/${params.id}`)
  }
}
