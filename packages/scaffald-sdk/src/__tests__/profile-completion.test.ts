import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Scaffald } from '../client.js'
import type {
  ProfileCompletionStatus,
  ProfileSection,
  CompletionSuggestion,
} from '../resources/profile-completion.js'

describe('ProfileCompletion Resource', () => {
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

  describe('getStatus', () => {
    it('should get profile completion status', async () => {
      const mockStatus: ProfileCompletionStatus = {
        user_id: 'user_123',
        overall_completion: 75,
        sections: [
          {
            section_name: 'basic_info',
            display_name: 'Basic Information',
            completed: true,
            completion_percentage: 100,
            weight: 20,
          },
          {
            section_name: 'work_experience',
            display_name: 'Work Experience',
            completed: false,
            completion_percentage: 60,
            weight: 30,
          },
          {
            section_name: 'education',
            display_name: 'Education',
            completed: true,
            completion_percentage: 100,
            weight: 20,
          },
          {
            section_name: 'skills',
            display_name: 'Skills',
            completed: false,
            completion_percentage: 40,
            weight: 15,
          },
          {
            section_name: 'certifications',
            display_name: 'Certifications',
            completed: false,
            completion_percentage: 0,
            weight: 15,
          },
        ],
        last_updated: '2024-01-15T10:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: mockStatus }),
      })

      const result = await client.profileCompletion.getStatus()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/profile/completion',
        expect.any(Object)
      )
      expect(result.data.overall_completion).toBe(75)
      expect(result.data.sections).toHaveLength(5)
    })

    it('should handle incomplete profile', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          data: {
            user_id: 'user_123',
            overall_completion: 20,
            sections: [],
            last_updated: '2024-01-15T10:00:00Z',
          },
        }),
      })

      const result = await client.profileCompletion.getStatus()

      expect(result.data.overall_completion).toBe(20)
    })
  })

  describe('getSection', () => {
    it('should get specific section details', async () => {
      const mockSection: ProfileSection = {
        section_name: 'work_experience',
        display_name: 'Work Experience',
        completed: false,
        completion_percentage: 60,
        weight: 30,
        required_fields: [
          { name: 'job_title', completed: true },
          { name: 'company_name', completed: true },
          { name: 'start_date', completed: true },
          { name: 'end_date', completed: false },
          { name: 'description', completed: false },
        ],
        optional_fields: [
          { name: 'achievements', completed: false },
          { name: 'technologies', completed: true },
        ],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: mockSection }),
      })

      const result = await client.profileCompletion.getSection('work_experience')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/profile/completion/sections/work_experience',
        expect.any(Object)
      )
      expect(result.data.section_name).toBe('work_experience')
      expect(result.data.required_fields).toHaveLength(5)
    })

    it('should handle invalid section name', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Section not found' }),
      })

      await expect(
        client.profileCompletion.getSection('invalid_section')
      ).rejects.toThrow()
    })
  })

  describe('getMissingSections', () => {
    it('should get incomplete sections', async () => {
      const mockMissing = {
        data: [
          {
            section_name: 'work_experience',
            display_name: 'Work Experience',
            completed: false,
            completion_percentage: 60,
            weight: 30,
          },
          {
            section_name: 'skills',
            display_name: 'Skills',
            completed: false,
            completion_percentage: 40,
            weight: 15,
          },
        ],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockMissing,
      })

      const result = await client.profileCompletion.getMissingSections()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/profile/completion/missing-sections',
        expect.any(Object)
      )
      expect(result.data).toHaveLength(2)
    })

    it('should return empty for complete profile', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: [] }),
      })

      const result = await client.profileCompletion.getMissingSections()

      expect(result.data).toHaveLength(0)
    })

    it('should filter by minimum weight', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: [] }),
      })

      await client.profileCompletion.getMissingSections({ min_weight: 20 })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/profile/completion/missing-sections?min_weight=20',
        expect.any(Object)
      )
    })
  })

  describe('getSuggestions', () => {
    it('should get completion suggestions', async () => {
      const mockSuggestions: CompletionSuggestion[] = [
        {
          section_name: 'work_experience',
          priority: 'high',
          impact_score: 30,
          suggestion: 'Add end dates to your work experiences',
          action_url: '/profile/experience',
          estimated_time_minutes: 5,
        },
        {
          section_name: 'skills',
          priority: 'medium',
          impact_score: 15,
          suggestion: 'Add at least 5 more skills to reach 100% completion',
          action_url: '/profile/skills',
          estimated_time_minutes: 10,
        },
        {
          section_name: 'certifications',
          priority: 'low',
          impact_score: 10,
          suggestion: 'Add professional certifications to stand out',
          action_url: '/profile/certifications',
          estimated_time_minutes: 15,
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: mockSuggestions }),
      })

      const result = await client.profileCompletion.getSuggestions()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/profile/completion/suggestions',
        expect.any(Object)
      )
      expect(result.data).toHaveLength(3)
      expect(result.data[0].priority).toBe('high')
    })

    it('should filter suggestions by priority', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: [] }),
      })

      await client.profileCompletion.getSuggestions({ priority: 'high' })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/profile/completion/suggestions?priority=high',
        expect.any(Object)
      )
    })

    it('should limit number of suggestions', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: [] }),
      })

      await client.profileCompletion.getSuggestions({ limit: 3 })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/profile/completion/suggestions?limit=3',
        expect.any(Object)
      )
    })
  })

  describe('getWeighting', () => {
    it('should get section weighting configuration', async () => {
      const mockWeighting = {
        data: {
          basic_info: 20,
          work_experience: 30,
          education: 20,
          skills: 15,
          certifications: 15,
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockWeighting,
      })

      const result = await client.profileCompletion.getWeighting()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/profile/completion/weighting',
        expect.any(Object)
      )
      expect(result.data.work_experience).toBe(30)
      expect(result.data.basic_info).toBe(20)
    })

    it('should verify weights sum to 100', async () => {
      const mockWeighting = {
        data: {
          basic_info: 20,
          work_experience: 30,
          education: 20,
          skills: 15,
          certifications: 15,
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockWeighting,
      })

      const result = await client.profileCompletion.getWeighting()
      const sum = Object.values(result.data).reduce((a, b) => a + b, 0)

      expect(sum).toBe(100)
    })
  })

  describe('recalculate', () => {
    it('should trigger recalculation of completion score', async () => {
      const mockRecalculated: ProfileCompletionStatus = {
        user_id: 'user_123',
        overall_completion: 80,
        sections: [],
        last_updated: '2024-01-15T11:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: mockRecalculated }),
      })

      const result = await client.profileCompletion.recalculate()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/profile/completion/recalculate',
        expect.objectContaining({
          method: 'POST',
        })
      )
      expect(result.data.overall_completion).toBe(80)
    })
  })

  describe('getHistory', () => {
    it('should get completion history over time', async () => {
      const mockHistory = {
        data: [
          {
            date: '2024-01-01',
            overall_completion: 50,
          },
          {
            date: '2024-01-08',
            overall_completion: 65,
          },
          {
            date: '2024-01-15',
            overall_completion: 75,
          },
        ],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockHistory,
      })

      const result = await client.profileCompletion.getHistory()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/profile/completion/history',
        expect.any(Object)
      )
      expect(result.data).toHaveLength(3)
      expect(result.data[2].overall_completion).toBe(75)
    })

    it('should filter history by date range', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: [] }),
      })

      await client.profileCompletion.getHistory({
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/profile/completion/history?start_date=2024-01-01&end_date=2024-01-31',
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

      await expect(client.profileCompletion.getStatus()).rejects.toThrow()
    })

    it('should handle 404 not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Profile not found' }),
      })

      await expect(client.profileCompletion.getSection('invalid')).rejects.toThrow()
    })

    it('should handle 429 rate limit', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Rate limit exceeded' }),
      })

      await expect(client.profileCompletion.recalculate()).rejects.toThrow()
    })

    it('should handle 500 server error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Internal server error' }),
      })

      await expect(client.profileCompletion.getSuggestions()).rejects.toThrow()
    })
  })
})
