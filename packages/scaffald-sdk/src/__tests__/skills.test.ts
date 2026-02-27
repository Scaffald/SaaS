import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { Scaffald } from '../client.js'
import { server } from './mocks/server.js'
import { http, HttpResponse } from 'msw'

describe('Skills', () => {
  let client: Scaffald

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' })
    client = new Scaffald({
      apiKey: 'test_key',
      baseUrl: 'https://api.scaffald.com',
    })
  })

  afterEach(() => {
    server.resetHandlers()
  })

  afterAll(() => {
    server.close()
  })

  // ===== Soft Skills =====

  describe('getSoftSkills()', () => {
    it('should get soft skills for current user', async () => {
      const result = await client.skills.getSoftSkills()

      expect(result).toBeDefined()
      expect(result.skills).toBeInstanceOf(Array)
      expect(result.categoryAverages).toBeDefined()
      expect(result.version).toBeDefined()
    })

    it('should include all soft skill categories', async () => {
      const result = await client.skills.getSoftSkills()

      const categories = result.skills.map(s => s.category)
      expect(categories).toContain('reliability')
      expect(categories).toContain('collaboration')
      expect(categories).toContain('professionalism')
      expect(categories).toContain('technical')
    })

    it('should get soft skills for specific user', async () => {
      const result = await client.skills.getSoftSkills({ userId: 'user_123' })

      expect(result).toBeDefined()
      expect(result.skills).toBeInstanceOf(Array)
    })

    it('should get soft skills for specific version', async () => {
      const result = await client.skills.getSoftSkills({ version: 2 })

      expect(result).toBeDefined()
      expect(result.version).toBe(2)
    })
  })

  describe('updateSoftSkills()', () => {
    it('should update soft skills ratings', async () => {
      const result = await client.skills.updateSoftSkills({
        skills: [
          { skill_id: 'skill_1', rating: 4 },
          { skill_id: 'skill_2', rating: 5 },
        ],
      })

      expect(result).toBeDefined()
      expect(result.version).toBeGreaterThan(0)
      expect(result.selfAssessedAt).toBeDefined()
      expect(result.categoryAverages).toBeDefined()
    })

    it('should create new version on update', async () => {
      const result = await client.skills.updateSoftSkills({
        skills: [{ skill_id: 'skill_1', rating: 5 }],
      })

      expect(result.createdNewVersion).toBe(true)
      expect(result.version).toBeDefined()
    })

    it('should validate rating values', async () => {
      server.use(
        http.patch('*/v1/profiles/skills/soft', () => {
          return HttpResponse.json(
            { error: 'Rating must be between 1 and 5' },
            { status: 400 }
          )
        })
      )

      await expect(
        client.skills.updateSoftSkills({
          skills: [{ skill_id: 'skill_1', rating: 10 }],
        })
      ).rejects.toThrow()
    })
  })

  describe('getSoftSkillsHistory()', () => {
    it('should get soft skills history versions', async () => {
      const result = await client.skills.getSoftSkillsHistory()

      expect(result).toBeDefined()
      expect(result.versions).toBeInstanceOf(Array)
    })

    it('should include version metadata', async () => {
      const result = await client.skills.getSoftSkillsHistory()

      const version = result.versions[0]
      if (version) {
        expect(version.version).toBeDefined()
        expect(version.categoryAverages).toBeDefined()
      }
    })
  })

  describe('getSoftSkillsComparison()', () => {
    it('should get soft skills comparison with peers', async () => {
      const result = await client.skills.getSoftSkillsComparison()

      expect(result).toBeDefined()
      expect(result.peerSampleSize).toBeGreaterThanOrEqual(0)
    })

    it('should include self and peer averages', async () => {
      const result = await client.skills.getSoftSkillsComparison()

      if (result.self) {
        expect(result.self).toHaveProperty('reliability')
        expect(result.self).toHaveProperty('collaboration')
      }
    })

    it('should calculate alignment score', async () => {
      const result = await client.skills.getSoftSkillsComparison()

      if (result.alignmentScore !== null) {
        expect(result.alignmentScore).toBeGreaterThanOrEqual(0)
        expect(result.alignmentScore).toBeLessThanOrEqual(100)
      }
    })
  })

  // ===== Hard Skills (Hierarchical) =====

  describe('getIndustries()', () => {
    it('should list all industries', async () => {
      const result = await client.skills.getIndustries()

      expect(result).toBeDefined()
      expect(result.industries).toBeInstanceOf(Array)
    })

    it('should include industry details', async () => {
      const result = await client.skills.getIndustries()

      const industry = result.industries[0]
      if (industry) {
        expect(industry.id).toBeDefined()
        expect(industry.name).toBeDefined()
        expect(industry.slug).toBeDefined()
      }
    })
  })

  describe('searchParentSkills()', () => {
    it('should search for parent skills', async () => {
      const result = await client.skills.searchParentSkills({ query: 'JavaScript' })

      expect(result).toBeDefined()
      expect(result.skills).toBeInstanceOf(Array)
    })

    it('should filter by industry', async () => {
      const result = await client.skills.searchParentSkills({
        query: 'JavaScript',
        industryId: 'industry_1',
      })

      expect(result).toBeDefined()
      expect(result.skills).toBeInstanceOf(Array)
    })

    it('should respect limit parameter', async () => {
      const result = await client.skills.searchParentSkills({
        query: 'JavaScript',
        limit: 5,
      })

      expect(result.skills.length).toBeLessThanOrEqual(5)
    })

    it('should handle empty search results', async () => {
      server.use(
        http.post('*/v1/profiles/skills/search-parents', () => {
          return HttpResponse.json({ skills: [] })
        })
      )

      const result = await client.skills.searchParentSkills({ query: 'nonexistent' })

      expect(result.skills).toHaveLength(0)
    })
  })

  describe('getSkillChildren()', () => {
    it('should get children of a parent skill', async () => {
      const result = await client.skills.getSkillChildren({ parentId: 'skill_parent_1' })

      expect(result).toBeDefined()
      expect(result.children).toBeInstanceOf(Array)
    })

    it('should include child skill details', async () => {
      const result = await client.skills.getSkillChildren({ parentId: 'skill_parent_1' })

      const child = result.children[0]
      if (child) {
        expect(child.id).toBeDefined()
        expect(child.name).toBeDefined()
      }
    })

    it('should handle parent with no children', async () => {
      server.use(
        http.get('*/v1/profiles/skills/children', () => {
          return HttpResponse.json({ children: [] })
        })
      )

      const result = await client.skills.getSkillChildren({ parentId: 'skill_leaf' })

      expect(result.children).toHaveLength(0)
    })
  })

  describe('getSkillDetails()', () => {
    it('should get details for a skill', async () => {
      const result = await client.skills.getSkillDetails({ skillId: 'skill_1' })

      expect(result).toBeDefined()
      expect(result.skill).toBeDefined()
      expect(result.skill.id).toBe('skill_1')
    })

    it('should include skill metadata', async () => {
      const result = await client.skills.getSkillDetails({ skillId: 'skill_1' })

      expect(result.skill.name).toBeDefined()
    })

    it('should handle nonexistent skill', async () => {
      server.use(
        http.get('*/v1/profiles/skills/details', () => {
          return HttpResponse.json({ error: 'Skill not found' }, { status: 404 })
        })
      )

      await expect(
        client.skills.getSkillDetails({ skillId: 'nonexistent' })
      ).rejects.toThrow()
    })
  })

  // ===== User Skills =====

  describe('getUserSkills()', () => {
    it('should get user skills', async () => {
      const result = await client.skills.getUserSkills()

      expect(result).toBeDefined()
      expect(result.explicitSkills).toBeInstanceOf(Array)
      expect(result.impliedSkills).toBeInstanceOf(Array)
      expect(result.allSkills).toBeInstanceOf(Array)
    })

    it('should include explicit and implied skills', async () => {
      const result = await client.skills.getUserSkills()

      if (result.explicitSkills.length > 0) {
        const skill = result.explicitSkills[0]
        expect(skill.skill_id).toBeDefined()
        expect(skill.skill_name).toBeDefined()
        expect(skill.proficiency).toBeDefined()
      }
    })
  })

  describe('addUserSkill()', () => {
    it('should add a user skill', async () => {
      const result = await client.skills.addUserSkill({
        skillId: 'skill_new',
        proficiency: 4,
      })

      expect(result).toBeDefined()
    })

    it('should validate proficiency level', async () => {
      server.use(
        http.post('*/v1/profiles/skills', () => {
          return HttpResponse.json(
            { error: 'Proficiency must be between 1 and 5' },
            { status: 400 }
          )
        })
      )

      await expect(
        client.skills.addUserSkill({ skillId: 'skill_1', proficiency: 10 })
      ).rejects.toThrow()
    })
  })

  describe('updateUserSkill()', () => {
    it('should update a user skill', async () => {
      const result = await client.skills.updateUserSkill({ skillId: 'user_skill_1',
        proficiency: 5,
      })

      expect(result).toBeDefined()
    })
  })

  describe('removeUserSkill()', () => {
    it('should remove a user skill', async () => {
      const result = await client.skills.removeUserSkill({ skillId: 'user_skill_1' })

      expect(result).toBeDefined()
    })

    it('should handle nonexistent skill removal', async () => {
      server.use(
        http.delete('*/v1/profiles/skills/:id', () => {
          return HttpResponse.json({ error: 'Skill not found' }, { status: 404 })
        })
      )

      await expect(
        client.skills.removeUserSkill({ skillId: 'nonexistent' })
      ).rejects.toThrow()
    })
  })

  // ===== Multi-Taxonomy Skills =====

  describe('getUserSkillsMultiTaxonomy()', () => {
    it('should get multi-taxonomy skills', async () => {
      const result = await client.skills.getUserSkillsMultiTaxonomy()

      expect(result).toBeDefined()
      expect(result.skills).toBeInstanceOf(Array)
    })

    it('should include skill taxonomy', async () => {
      const result = await client.skills.getUserSkillsMultiTaxonomy()

      if (result.skills.length > 0) {
        const skill = result.skills[0]
        expect(skill.skill_taxonomy).toBeDefined()
        expect(['csi', 'onet']).toContain(skill.skill_taxonomy)
      }
    })
  })

  describe('addSkillMultiTaxonomy()', () => {
    it('should add multi-taxonomy skill', async () => {
      const result = await client.skills.addSkillMultiTaxonomy({
        taxonomy: 'csi',
        skillId: 'csi_skill_1',
        proficiencyLevel: 4,
      })

      expect(result).toBeDefined()
    })

    it('should support ONET taxonomy', async () => {
      const result = await client.skills.addSkillMultiTaxonomy({
        taxonomy: 'onet',
        skillId: 'onet_skill_1',
        proficiencyLevel: 5,
      })

      expect(result).toBeDefined()
    })
  })

  describe('updateSkillMultiTaxonomy()', () => {
    it('should update multi-taxonomy skill', async () => {
      const result = await client.skills.updateSkillMultiTaxonomy({ userSkillId: 'mt_skill_1',
        proficiencyLevel: 5,
      })

      expect(result).toBeDefined()
    })
  })

  describe('removeSkillMultiTaxonomy()', () => {
    it('should remove multi-taxonomy skill', async () => {
      const result = await client.skills.removeSkillMultiTaxonomy({ userSkillId: 'mt_skill_1' })

      expect(result).toBeDefined()
    })
  })

  // ===== Primary Industry =====

  describe('getPrimaryIndustry()', () => {
    it('should get primary industry', async () => {
      const result = await client.skills.getPrimaryIndustry()

      expect(result).toBeDefined()
    })

    it('should include industry details', async () => {
      const result = await client.skills.getPrimaryIndustry()

      if (result.industry) {
        expect(result.industry.id).toBeDefined()
        expect(result.industry.name).toBeDefined()
      }
    })
  })

  describe('updatePrimaryIndustry()', () => {
    it('should update primary industry', async () => {
      const result = await client.skills.updatePrimaryIndustry({
        industryId: 'industry_new',
      })

      expect(result).toBeDefined()
    })

    it('should validate industry ID', async () => {
      server.use(
        http.patch('*/v1/profiles/skills/primary-industry', () => {
          return HttpResponse.json(
            { error: 'Industry not found' },
            { status: 404 }
          )
        })
      )

      await expect(
        client.skills.updatePrimaryIndustry({ industryId: 'invalid' })
      ).rejects.toThrow()
    })
  })

  // ===== Legacy Skills =====

  describe('getSkillsLegacy()', () => {
    it('should get legacy skills', async () => {
      const result = await client.skills.getSkillsLegacy()

      expect(result).toBeDefined()
      expect(result.skills).toBeInstanceOf(Array)
    })
  })

  describe('updateSkillsLegacy()', () => {
    it('should update legacy skills', async () => {
      const result = await client.skills.updateSkillsLegacy({
        industry_id: 'ind_2',
      })

      expect(result).toBeDefined()
    })
  })

  // ===== Error Handling =====

  describe('error handling', () => {
    it('should handle authentication errors', async () => {
      server.use(
        http.get('*/v1/profiles/skills/soft', () => {
          return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
        })
      )

      await expect(client.skills.getSoftSkills()).rejects.toThrow()
    })

    it('should handle rate limiting', { timeout: 15000 }, async () => {
      server.use(
        http.get('*/v1/profiles/skills/soft', () => {
          return HttpResponse.json(
            { error: 'Rate limit exceeded' },
            { status: 429, headers: { 'Retry-After': '1' } }
          )
        })
      )

      await expect(client.skills.getSoftSkills()).rejects.toThrow()
    })

    it('should handle server errors', { timeout: 15000 }, async () => {
      server.use(
        http.get('*/v1/profiles/skills/soft', () => {
          return HttpResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
          )
        })
      )

      await expect(client.skills.getSoftSkills()).rejects.toThrow()
    })
  })
})
