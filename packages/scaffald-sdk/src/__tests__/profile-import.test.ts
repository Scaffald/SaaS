import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Scaffald } from '../client.js'
import type {
  ImportPreview,
  ImportResult,
  ImportValidationResult,
  LinkedInImportParams,
  ResumeImportParams,
} from '../resources/profile-import.js'

describe('ProfileImport Resource', () => {
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

  describe('importFromLinkedIn', () => {
    it('should import profile from LinkedIn', async () => {
      const params: LinkedInImportParams = {
        linkedin_url: 'https://linkedin.com/in/johndoe',
        merge_strategy: 'replace',
      }

      const mockResult: ImportResult = {
        import_id: 'import_123',
        status: 'completed',
        source: 'linkedin',
        imported_sections: ['basic_info', 'work_experience', 'education', 'skills'],
        created_count: 15,
        updated_count: 0,
        skipped_count: 0,
        errors: [],
        started_at: '2024-01-15T10:00:00Z',
        completed_at: '2024-01-15T10:02:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: mockResult }),
      })

      const result = await client.profileImport.importFromLinkedIn(params)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/profile/import/linkedin',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(params),
        })
      )
      expect(result.data.status).toBe('completed')
      expect(result.data.imported_sections).toHaveLength(4)
    })

    it('should handle LinkedIn import with merge strategy', async () => {
      const params: LinkedInImportParams = {
        linkedin_url: 'https://linkedin.com/in/johndoe',
        merge_strategy: 'merge',
        sections: ['work_experience', 'education'],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          data: {
            import_id: 'import_124',
            status: 'completed',
            source: 'linkedin',
            imported_sections: ['work_experience', 'education'],
            created_count: 3,
            updated_count: 2,
            skipped_count: 0,
            errors: [],
            started_at: '2024-01-15T10:00:00Z',
            completed_at: '2024-01-15T10:01:00Z',
          },
        }),
      })

      const result = await client.profileImport.importFromLinkedIn(params)

      expect(result.data.created_count).toBe(3)
      expect(result.data.updated_count).toBe(2)
    })

    it('should handle LinkedIn import errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: 'Invalid LinkedIn URL',
        }),
      })

      await expect(
        client.profileImport.importFromLinkedIn({
          linkedin_url: 'invalid-url',
          merge_strategy: 'replace',
        })
      ).rejects.toThrow()
    })
  })

  describe('importFromResume', () => {
    it('should import profile from resume file', async () => {
      const params: ResumeImportParams = {
        file_url: 'https://storage.example.com/resume.pdf',
        merge_strategy: 'merge',
      }

      const mockResult: ImportResult = {
        import_id: 'import_125',
        status: 'completed',
        source: 'resume',
        imported_sections: ['work_experience', 'education', 'skills'],
        created_count: 8,
        updated_count: 0,
        skipped_count: 2,
        errors: [],
        started_at: '2024-01-15T10:00:00Z',
        completed_at: '2024-01-15T10:03:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: mockResult }),
      })

      const result = await client.profileImport.importFromResume(params)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/profile/import/resume',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(params),
        })
      )
      expect(result.data.status).toBe('completed')
      expect(result.data.source).toBe('resume')
    })

    it('should handle resume upload with file', async () => {
      const params: ResumeImportParams = {
        file: new Blob(['resume content'], { type: 'application/pdf' }),
        file_name: 'resume.pdf',
        merge_strategy: 'replace',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          data: {
            import_id: 'import_126',
            status: 'completed',
            source: 'resume',
            imported_sections: ['work_experience'],
            created_count: 3,
            updated_count: 0,
            skipped_count: 0,
            errors: [],
            started_at: '2024-01-15T10:00:00Z',
            completed_at: '2024-01-15T10:02:00Z',
          },
        }),
      })

      const result = await client.profileImport.importFromResume(params)

      expect(result.data.status).toBe('completed')
    })

    it('should handle unsupported file format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: 'Unsupported file format',
        }),
      })

      await expect(
        client.profileImport.importFromResume({
          file_url: 'https://example.com/resume.txt',
          merge_strategy: 'replace',
        })
      ).rejects.toThrow()
    })
  })

  describe('previewImport', () => {
    it('should preview LinkedIn import', async () => {
      const mockPreview: ImportPreview = {
        source: 'linkedin',
        sections: [
          {
            section_name: 'basic_info',
            action: 'update',
            current_data: {
              first_name: 'John',
              last_name: 'Doe',
            },
            imported_data: {
              first_name: 'John',
              last_name: 'Doe',
              headline: 'Software Engineer',
            },
            conflicts: [],
          },
          {
            section_name: 'work_experience',
            action: 'create',
            current_data: null,
            imported_data: [
              {
                job_title: 'Senior Developer',
                company_name: 'Tech Corp',
                start_date: '2020-01',
              },
            ],
            conflicts: [],
          },
        ],
        total_creates: 5,
        total_updates: 2,
        total_skips: 0,
        potential_conflicts: 0,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: mockPreview }),
      })

      const result = await client.profileImport.previewImport({
        source: 'linkedin',
        linkedin_url: 'https://linkedin.com/in/johndoe',
        merge_strategy: 'merge',
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/profile/import/preview',
        expect.objectContaining({
          method: 'POST',
        })
      )
      expect(result.data.sections).toHaveLength(2)
      expect(result.data.total_creates).toBe(5)
    })

    it('should preview resume import with conflicts', async () => {
      const mockPreview: ImportPreview = {
        source: 'resume',
        sections: [],
        total_creates: 3,
        total_updates: 2,
        total_skips: 1,
        potential_conflicts: 2,
        conflicts: [
          {
            section: 'work_experience',
            field: 'end_date',
            current_value: '2024-01',
            imported_value: '2023-12',
            suggested_resolution: 'keep_current',
          },
        ],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: mockPreview }),
      })

      const result = await client.profileImport.previewImport({
        source: 'resume',
        file_url: 'https://storage.example.com/resume.pdf',
        merge_strategy: 'merge',
      })

      expect(result.data.potential_conflicts).toBe(2)
      expect(result.data.conflicts).toHaveLength(1)
    })
  })

  describe('validateImport', () => {
    it('should validate import data', async () => {
      const mockValidation: ImportValidationResult = {
        valid: true,
        errors: [],
        warnings: [
          {
            field: 'work_experience.description',
            message: 'Description is very short',
            severity: 'warning',
          },
        ],
        suggestions: [
          {
            field: 'skills',
            message: 'Consider adding more technical skills',
          },
        ],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: mockValidation }),
      })

      const result = await client.profileImport.validateImport({
        source: 'linkedin',
        linkedin_url: 'https://linkedin.com/in/johndoe',
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/profile/import/validate',
        expect.objectContaining({
          method: 'POST',
        })
      )
      expect(result.data.valid).toBe(true)
      expect(result.data.warnings).toHaveLength(1)
    })

    it('should detect validation errors', async () => {
      const mockValidation: ImportValidationResult = {
        valid: false,
        errors: [
          {
            field: 'work_experience.start_date',
            message: 'Start date is after end date',
            severity: 'error',
          },
          {
            field: 'education.degree',
            message: 'Degree is required',
            severity: 'error',
          },
        ],
        warnings: [],
        suggestions: [],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: mockValidation }),
      })

      const result = await client.profileImport.validateImport({
        source: 'resume',
        file_url: 'https://storage.example.com/resume.pdf',
      })

      expect(result.data.valid).toBe(false)
      expect(result.data.errors).toHaveLength(2)
    })
  })

  describe('getImportStatus', () => {
    it('should get import status by ID', async () => {
      const mockResult: ImportResult = {
        import_id: 'import_123',
        status: 'processing',
        source: 'linkedin',
        imported_sections: [],
        created_count: 0,
        updated_count: 0,
        skipped_count: 0,
        errors: [],
        started_at: '2024-01-15T10:00:00Z',
        completed_at: null,
        progress_percentage: 45,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: mockResult }),
      })

      const result = await client.profileImport.getImportStatus('import_123')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/profile/import/import_123',
        expect.any(Object)
      )
      expect(result.data.status).toBe('processing')
      expect(result.data.progress_percentage).toBe(45)
    })

    it('should handle failed import', async () => {
      const mockResult: ImportResult = {
        import_id: 'import_124',
        status: 'failed',
        source: 'resume',
        imported_sections: [],
        created_count: 0,
        updated_count: 0,
        skipped_count: 0,
        errors: [
          {
            section: 'work_experience',
            message: 'Failed to parse dates',
          },
        ],
        started_at: '2024-01-15T10:00:00Z',
        completed_at: '2024-01-15T10:01:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: mockResult }),
      })

      const result = await client.profileImport.getImportStatus('import_124')

      expect(result.data.status).toBe('failed')
      expect(result.data.errors).toHaveLength(1)
    })
  })

  describe('listImports', () => {
    it('should list import history', async () => {
      const mockHistory = {
        data: [
          {
            import_id: 'import_123',
            status: 'completed',
            source: 'linkedin',
            started_at: '2024-01-15T10:00:00Z',
            completed_at: '2024-01-15T10:02:00Z',
          },
          {
            import_id: 'import_122',
            status: 'completed',
            source: 'resume',
            started_at: '2024-01-14T10:00:00Z',
            completed_at: '2024-01-14T10:03:00Z',
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
        json: async () => mockHistory,
      })

      const result = await client.profileImport.listImports()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/profile/import',
        expect.any(Object)
      )
      expect(result.data).toHaveLength(2)
    })

    it('should filter imports by status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          data: [],
          pagination: { total: 0, page: 1, limit: 20, total_pages: 0 },
        }),
      })

      await client.profileImport.listImports({ status: 'failed' })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/profile/import?status=failed',
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

      await expect(
        client.profileImport.importFromLinkedIn({
          linkedin_url: 'https://linkedin.com/in/johndoe',
          merge_strategy: 'replace',
        })
      ).rejects.toThrow()
    })

    it('should handle 404 not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Import not found' }),
      })

      await expect(client.profileImport.getImportStatus('invalid_id')).rejects.toThrow()
    })

    it('should handle 429 rate limit', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Rate limit exceeded' }),
      })

      await expect(
        client.profileImport.importFromResume({
          file_url: 'https://example.com/resume.pdf',
          merge_strategy: 'merge',
        })
      ).rejects.toThrow()
    })

    it('should handle 500 server error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Internal server error' }),
      })

      await expect(client.profileImport.listImports()).rejects.toThrow()
    })
  })
})
