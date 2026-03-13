import { Resource } from './base.js'

export interface CommunitySkill {
  id: string
  name: string
  slug: string
  tier: number
  parent_id: string | null
  community_id: string | null
  description: string | null
}

export interface SkillSearchParams {
  q: string
  community_id?: string
  limit?: number
}

export class CommunitySkills extends Resource {
  async search(params: SkillSearchParams): Promise<{ data: CommunitySkill[] }> {
    const qp = new URLSearchParams()
    qp.append('q', params.q)
    if (params.community_id) qp.append('community_id', params.community_id)
    if (params.limit !== undefined) qp.append('limit', params.limit.toString())
    return this.get<{ data: CommunitySkill[] }>(
      `/v1/communities/skills/search?${qp.toString()}`
    )
  }

  async getTree(communityId: string): Promise<{ data: CommunitySkill[] }> {
    return this.get<{ data: CommunitySkill[] }>(`/v1/communities/skills/tree/${communityId}`)
  }

  async getChildren(skillId: string): Promise<{ data: CommunitySkill[] }> {
    return this.get<{ data: CommunitySkill[] }>(`/v1/communities/skills/${skillId}/children`)
  }

  async getAncestors(skillId: string): Promise<{ data: CommunitySkill[] }> {
    return this.get<{ data: CommunitySkill[] }>(`/v1/communities/skills/${skillId}/ancestors`)
  }
}
