import { Resource } from './base'

// ============================================================================
// SKILL SNAPSHOTS TYPES
// ============================================================================

export interface SkillSnapshotCategoryData {
  average: number
  count: number
}

export interface SnapshotSoftSkillsData {
  categories: Record<string, SkillSnapshotCategoryData>
  overall_average: number
}

export interface SnapshotData {
  soft_skills: SnapshotSoftSkillsData
  evidence_count: number
  review_count: number
}

export interface SnapshotSummary {
  delta_overall: number
  previous_overall: number
  delta_categories?: Record<string, number>
}

export interface SkillSnapshot {
  id: string
  userId: string
  triggerType: 'review_received' | 'self_assessment' | 'manual' | 'periodic'
  triggerId: string | null
  snapshotData: SnapshotData
  summary: SnapshotSummary | null
  createdAt: string
}

export interface ListSnapshotsParams {
  userId?: string
  limit?: number
}

export interface ListSnapshotsResponse {
  snapshots: SkillSnapshot[]
}

export interface CreateSnapshotParams {
  userId?: string
  triggerType: 'review_received' | 'self_assessment' | 'manual' | 'periodic'
  triggerId?: string
}

export interface CreateSnapshotResponse {
  snapshot: SkillSnapshot
}

export interface TimelineDataPoint {
  date: string
  overallAverage: number
  categories: Record<string, number>
  snapshotId: string
}

export interface GetTimelineParams {
  userId?: string
  startDate?: string
  endDate?: string
  limit?: number
}

export interface GetTimelineResponse {
  timeline: TimelineDataPoint[]
}

export interface SnapshotDiff {
  deltaOverall: number
  deltaCategories: Record<string, number>
  improvedCount: number
  declinedCount: number
  stableCount: number
}

export interface CompareSnapshotsParams {
  snapshotAId: string
  snapshotBId: string
}

export interface CompareSnapshotsResponse {
  diff: SnapshotDiff
}

// ============================================================================
// SKILL EVIDENCE TYPES
// ============================================================================

export type SkillEvidenceType =
  | 'certification'
  | 'project'
  | 'review_excerpt'
  | 'work_log'
  | 'custom'

export interface SkillEvidence {
  id: string
  userId: string
  softSkillId: string | null
  skillTaxonomy: string | null
  skillRefId: string | null
  evidenceType: SkillEvidenceType
  title: string
  description: string | null
  url: string | null
  verified: boolean
  verifiedBy: string | null
  verifiedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ListEvidenceParams {
  userId?: string
  softSkillId?: string
  skillTaxonomy?: string
  skillRefId?: string
}

export interface ListEvidenceResponse {
  evidence: SkillEvidence[]
}

export interface CreateEvidenceParams {
  softSkillId?: string
  skillTaxonomy?: string
  skillRefId?: string
  evidenceType: SkillEvidenceType
  title: string
  description?: string
  url?: string
}

export interface CreateEvidenceResponse {
  evidence: SkillEvidence
}

export interface UpdateEvidenceParams {
  evidenceId: string
  title?: string
  description?: string
  url?: string
}

export interface UpdateEvidenceResponse {
  evidence: SkillEvidence
}

export interface DeleteEvidenceParams {
  evidenceId: string
}

export interface VerifyEvidenceParams {
  evidenceId: string
}

export interface SuccessResponse {
  success: boolean
}

// ============================================================================
// SKILL ANALYTICS RESOURCE
// ============================================================================

export class SkillAnalytics extends Resource {
  // Snapshots

  async listSnapshots(params?: ListSnapshotsParams): Promise<ListSnapshotsResponse> {
    return this.get<ListSnapshotsResponse>('/v1/skills/snapshots', params)
  }

  async getSnapshot(id: string): Promise<SkillSnapshot> {
    return this.get<SkillSnapshot>(`/v1/skills/snapshots/${id}`)
  }

  async createSnapshot(params: CreateSnapshotParams): Promise<CreateSnapshotResponse> {
    return this.post<CreateSnapshotResponse>('/v1/skills/snapshots', params)
  }

  async getTimeline(params?: GetTimelineParams): Promise<GetTimelineResponse> {
    return this.get<GetTimelineResponse>('/v1/skills/snapshots/timeline', params)
  }

  async compareSnapshots(params: CompareSnapshotsParams): Promise<CompareSnapshotsResponse> {
    return this.post<CompareSnapshotsResponse>('/v1/skills/snapshots/compare', params)
  }

  async getLatestSnapshot(userId?: string): Promise<SkillSnapshot | null> {
    const res = await this.get<ListSnapshotsResponse>('/v1/skills/snapshots', {
      userId,
      limit: 1,
    })
    return res.snapshots[0] ?? null
  }

  // Evidence

  async listEvidence(params?: ListEvidenceParams): Promise<ListEvidenceResponse> {
    return this.get<ListEvidenceResponse>('/v1/skills/evidence', params)
  }

  async createEvidence(params: CreateEvidenceParams): Promise<CreateEvidenceResponse> {
    return this.post<CreateEvidenceResponse>('/v1/skills/evidence', params)
  }

  async updateEvidence(params: UpdateEvidenceParams): Promise<UpdateEvidenceResponse> {
    const { evidenceId, ...body } = params
    return this.patch<UpdateEvidenceResponse>(`/v1/skills/evidence/${evidenceId}`, body)
  }

  async deleteEvidence(params: DeleteEvidenceParams): Promise<SuccessResponse> {
    return this.del<SuccessResponse>(`/v1/skills/evidence/${params.evidenceId}`)
  }

  async verifyEvidence(params: VerifyEvidenceParams): Promise<SkillEvidence> {
    return this.post<SkillEvidence>(`/v1/skills/evidence/${params.evidenceId}/verify`)
  }
}
