import { Resource } from './base.js'

export interface Connection {
  id: string
  requester_id: string
  addressee_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  updated_at: string
  requester?: {
    id: string
    first_name: string
    last_name: string
    avatar_url?: string
  }
  addressee?: {
    id: string
    first_name: string
    last_name: string
    avatar_url?: string
  }
}

export interface ConnectionRequest {
  id: string
  requester_id: string
  addressee_id: string
  status: 'pending'
  created_at: string
  requester: {
    id: string
    first_name: string
    last_name: string
    avatar_url?: string
  }
}

export interface SendConnectionRequestParams {
  targetUserId: string
}

export interface ConnectionsListResponse {
  data: Connection[]
  total: number
}

export interface PendingRequestsResponse {
  sent: ConnectionRequest[]
  received: ConnectionRequest[]
}

export interface ConnectionStatusResponse {
  status: 'none' | 'pending_sent' | 'pending_received' | 'connected'
  connectionId?: string
}

export class Connections extends Resource {
  /**
   * Get all connections for the current user
   */
  async list(): Promise<ConnectionsListResponse> {
    return this.get<ConnectionsListResponse>('/v1/connections')
  }

  /**
   * Get pending connection requests (sent and received)
   */
  async getPending(): Promise<PendingRequestsResponse> {
    return this.get<PendingRequestsResponse>('/v1/connections/pending')
  }

  /**
   * Get connection status with a specific user
   */
  async getStatus(userId: string): Promise<ConnectionStatusResponse> {
    return this.get<ConnectionStatusResponse>(`/v1/connections/status/${userId}`)
  }

  /**
   * Send a connection request to another user
   */
  async send(params: SendConnectionRequestParams): Promise<Connection> {
    return this.post<Connection>('/v1/connections/request', params)
  }

  /**
   * Accept a connection request
   */
  async accept(connectionId: string): Promise<Connection> {
    return this.post<Connection>(`/v1/connections/${connectionId}/accept`, {})
  }

  /**
   * Decline a connection request
   */
  async decline(connectionId: string): Promise<void> {
    return this.post<void>(`/v1/connections/${connectionId}/decline`, {})
  }

  /**
   * Remove an existing connection
   */
  async remove(connectionId: string): Promise<void> {
    return this.del<void>(`/v1/connections/${connectionId}`)
  }

  /**
   * Cancel a sent connection request
   */
  async cancel(connectionId: string): Promise<void> {
    return this.del<void>(`/v1/connections/${connectionId}/cancel`)
  }
}
