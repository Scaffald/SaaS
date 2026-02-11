import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Scaffald } from '../client.js'
import type {
  Occupation,
  OccupationDetails,
  OccupationsSearchResponse,
  OccupationSkill,
} from '../resources/onet.js'

describe('ONET Resource', () => {
  let client: Scaffald
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockFetch = vi.fn()
    global.fetch = mockFetch
    client = new Scaffald({
      apiKey: 'test-api-key',
      baseURL: 'https://api.test.com',
    })
  })

  describe('search', () => {
    it('should search occupations by keyword', async () => {
      const mockResponse: OccupationsSearchResponse = {
        data: [
          {
            onet_code: '15-1252.00',
            title: 'Software Developers',
            description: 'Research, design, and develop computer applications',
            alternate_titles: ['Application Developer', 'Software Engineer'],
          },
          {
            onet_code: '15-1256.00',
            title: 'Software Quality Assurance Analysts',
            description: 'Develop and execute software tests',
            alternate_titles: ['QA Analyst', 'Test Engineer'],
          },
        ],
        pagination: {
          total: 2,
          page: 1,
          limit: 20,
          total_pages: 1,
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      })

      const result = await client.onet.search({ keyword: 'software' })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/onet/search?keyword=software',
        expect.any(Object)
      )
      expect(result.data).toHaveLength(2)
      expect(result.data[0].title).toContain('Software')
    })

    it('should handle empty search results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          data: [],
          pagination: { total: 0, page: 1, limit: 20, total_pages: 0 },
        }),
      })

      const result = await client.onet.search({ keyword: 'nonexistent' })

      expect(result.data).toHaveLength(0)
    })

    it('should support pagination', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          data: [],
          pagination: { total: 100, page: 2, limit: 50, total_pages: 2 },
        }),
      })

      await client.onet.search({ keyword: 'developer', page: 2, limit: 50 })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/onet/search?keyword=developer&page=2&limit=50',
        expect.any(Object)
      )
    })
  })

  describe('get', () => {
    it('should get occupation details by O*NET code', async () => {
      const mockOccupation: OccupationDetails = {
        onet_code: '15-1252.00',
        title: 'Software Developers',
        description:
          'Research, design, and develop computer and network software or specialized utility programs.',
        alternate_titles: ['Application Developer', 'Software Engineer'],
        sample_of_reported_job_titles: [
          'Software Developer',
          'Software Engineer',
          'Application Developer',
        ],
        tasks: [
          'Develop and test software applications',
          'Analyze user needs and develop software solutions',
        ],
        technology_skills: [
          'Programming languages',
          'Development environments',
        ],
        knowledge: [
          { name: 'Computers and Electronics', level: 90 },
          { name: 'Mathematics', level: 75 },
        ],
        skills: [
          { name: 'Programming', level: 85 },
          { name: 'Critical Thinking', level: 80 },
        ],
        abilities: [
          { name: 'Deductive Reasoning', level: 75 },
          { name: 'Information Ordering', level: 70 },
        ],
        education: {
          typical_education: "Bachelor's degree",
          related_experience: 'None',
          on_site_training: 'None',
        },
        job_zone: 4,
        median_wages: {
          annual: 120730,
          hourly: 58.04,
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: mockOccupation }),
      })

      const result = await client.onet.get('15-1252.00')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/onet/occupations/15-1252.00',
        expect.any(Object)
      )
      expect(result.data.onet_code).toBe('15-1252.00')
      expect(result.data.title).toBe('Software Developers')
    })

    it('should handle invalid O*NET code', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Occupation not found' }),
      })

      await expect(client.onet.get('99-9999.99')).rejects.toThrow()
    })
  })

  describe('getSkills', () => {
    it('should get skills for an occupation', async () => {
      const mockSkills: OccupationSkill[] = [
        {
          skill_name: 'Programming',
          importance: 85,
          level: 80,
          category: 'Technical Skills',
        },
        {
          skill_name: 'Critical Thinking',
          importance: 78,
          level: 75,
          category: 'Cognitive Skills',
        },
        {
          skill_name: 'Complex Problem Solving',
          importance: 80,
          level: 78,
          category: 'Cognitive Skills',
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: mockSkills }),
      })

      const result = await client.onet.getSkills('15-1252.00')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/onet/occupations/15-1252.00/skills',
        expect.any(Object)
      )
      expect(result.data).toHaveLength(3)
      expect(result.data[0].skill_name).toBe('Programming')
    })

    it('should filter skills by minimum importance', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: [] }),
      })

      await client.onet.getSkills('15-1252.00', { min_importance: 80 })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/onet/occupations/15-1252.00/skills?min_importance=80',
        expect.any(Object)
      )
    })

    it('should filter skills by category', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: [] }),
      })

      await client.onet.getSkills('15-1252.00', { category: 'Technical Skills' })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/onet/occupations/15-1252.00/skills?category=Technical+Skills',
        expect.any(Object)
      )
    })
  })

  describe('getRelated', () => {
    it('should get related occupations', async () => {
      const mockRelated: Occupation[] = [
        {
          onet_code: '15-1256.00',
          title: 'Software Quality Assurance Analysts',
          description: 'Develop and execute software tests',
          alternate_titles: ['QA Analyst'],
        },
        {
          onet_code: '15-1299.08',
          title: 'Web Developers',
          description: 'Design and create websites',
          alternate_titles: ['Web Designer'],
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: mockRelated }),
      })

      const result = await client.onet.getRelated('15-1252.00')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/onet/occupations/15-1252.00/related',
        expect.any(Object)
      )
      expect(result.data).toHaveLength(2)
    })

    it('should limit number of related occupations', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: [] }),
      })

      await client.onet.getRelated('15-1252.00', { limit: 5 })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/onet/occupations/15-1252.00/related?limit=5',
        expect.any(Object)
      )
    })

    it('should handle occupation with no related jobs', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: [] }),
      })

      const result = await client.onet.getRelated('15-1252.00')

      expect(result.data).toHaveLength(0)
    })
  })

  describe('getKnowledge', () => {
    it('should get knowledge areas for an occupation', async () => {
      const mockKnowledge = {
        data: [
          {
            knowledge_area: 'Computers and Electronics',
            importance: 90,
            level: 85,
            description: 'Knowledge of circuit boards, processors, etc.',
          },
          {
            knowledge_area: 'Mathematics',
            importance: 75,
            level: 70,
            description: 'Knowledge of arithmetic, algebra, geometry, etc.',
          },
        ],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockKnowledge,
      })

      const result = await client.onet.getKnowledge('15-1252.00')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/onet/occupations/15-1252.00/knowledge',
        expect.any(Object)
      )
      expect(result.data).toHaveLength(2)
    })
  })

  describe('getAbilities', () => {
    it('should get abilities for an occupation', async () => {
      const mockAbilities = {
        data: [
          {
            ability_name: 'Deductive Reasoning',
            importance: 75,
            level: 70,
            description: 'The ability to apply general rules to specific problems',
          },
          {
            ability_name: 'Oral Comprehension',
            importance: 72,
            level: 68,
            description: 'The ability to listen and understand spoken information',
          },
        ],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockAbilities,
      })

      const result = await client.onet.getAbilities('15-1252.00')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/onet/occupations/15-1252.00/abilities',
        expect.any(Object)
      )
      expect(result.data).toHaveLength(2)
    })
  })

  describe('autocomplete', () => {
    it('should autocomplete occupation titles', async () => {
      const mockSuggestions = {
        data: [
          { onet_code: '15-1252.00', title: 'Software Developers' },
          { onet_code: '15-1256.00', title: 'Software Quality Assurance Analysts' },
          { onet_code: '15-1299.08', title: 'Software Developers, Applications' },
        ],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockSuggestions,
      })

      const result = await client.onet.autocomplete({ query: 'soft' })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/onet/autocomplete?query=soft',
        expect.any(Object)
      )
      expect(result.data).toHaveLength(3)
    })

    it('should limit autocomplete results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: [] }),
      })

      await client.onet.autocomplete({ query: 'dev', limit: 5 })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/onet/autocomplete?query=dev&limit=5',
        expect.any(Object)
      )
    })
  })

  describe('error handling', () => {
    it('should handle 401 unauthorized', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Unauthorized' }),
      })

      await expect(client.onet.search({ keyword: 'developer' })).rejects.toThrow()
    })

    it('should handle 404 not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Occupation not found' }),
      })

      await expect(client.onet.get('invalid-code')).rejects.toThrow()
    })

    it('should handle 429 rate limit', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Rate limit exceeded' }),
      })

      await expect(client.onet.search({ keyword: 'test' })).rejects.toThrow()
    })

    it('should handle 500 server error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Internal server error' }),
      })

      await expect(client.onet.getSkills('15-1252.00')).rejects.toThrow()
    })
  })
})
