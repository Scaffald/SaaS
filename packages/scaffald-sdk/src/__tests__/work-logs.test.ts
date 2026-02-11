import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { Scaffald } from '../client.js'
import { server } from './mocks/server.js'
import { http, HttpResponse } from 'msw'

describe('WorkLogs', () => {
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

  // ===== Project Options =====

  describe('getProjectOptions()', () => {
    it('should get available project options', async () => {
      const result = await client.workLogs.getProjectOptions()

      expect(result).toBeDefined()
      expect(result).toBeInstanceOf(Array)
    })

    it('should filter projects by organization', async () => {
      const result = await client.workLogs.getProjectOptions({
        organizationId: 'org_123',
      })

      expect(result).toBeDefined()
      expect(result).toBeInstanceOf(Array)
    })

    it('should search projects', async () => {
      const result = await client.workLogs.getProjectOptions({
        search: 'Construction',
      })

      expect(result).toBeDefined()
      expect(result).toBeInstanceOf(Array)
    })
  })

  // ===== List Work Logs =====

  describe('list()', () => {
    it('should list work logs', async () => {
      const result = await client.workLogs.list()

      expect(result).toBeDefined()
      expect(result.workLogs).toBeInstanceOf(Array)
      expect(result.totalCount).toBeDefined()
      expect(result.hasMore).toBeDefined()
    })

    it('should filter by status', async () => {
      const result = await client.workLogs.list({
        statuses: ['verified', 'pending_verification'],
      })

      expect(result).toBeDefined()
      expect(result.workLogs).toBeInstanceOf(Array)
    })

    it('should filter by project', async () => {
      const result = await client.workLogs.list({
        projectId: 'project_123',
      })

      expect(result).toBeDefined()
      expect(result.workLogs).toBeInstanceOf(Array)
    })

    it('should filter by date range', async () => {
      const result = await client.workLogs.list({
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
      })

      expect(result).toBeDefined()
      expect(result.workLogs).toBeInstanceOf(Array)
    })

    it('should support pagination', async () => {
      const result = await client.workLogs.list({
        page: 1,
        pageSize: 10,
      })

      expect(result).toBeDefined()
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(10)
    })

    it('should support sorting', async () => {
      const result = await client.workLogs.list({
        sortField: 'log_date',
        sortDirection: 'desc',
      })

      expect(result).toBeDefined()
      expect(result.workLogs).toBeInstanceOf(Array)
    })
  })

  // ===== Get Work Log =====

  describe('getById()', () => {
    it('should get work log by ID', async () => {
      const result = await client.workLogs.getById('log_123')

      expect(result).toBeDefined()
      expect(result.id).toBe('log_123')
    })

    it('should include full work log details', async () => {
      const result = await client.workLogs.getById('log_123')

      expect(result.user_id).toBeDefined()
      expect(result.status).toBeDefined()
      expect(result.log_date).toBeDefined()
      expect(result.total_hours).toBeDefined()
    })

    it('should handle nonexistent work log', async () => {
      server.use(
        http.get('*/work-logs/:id', () => {
          return HttpResponse.json({ error: 'Work log not found' }, { status: 404 })
        })
      )

      await expect(client.workLogs.getById('invalid')).rejects.toThrow()
    })
  })

  // ===== Overview =====

  describe('getOverview()', () => {
    it('should get work logs overview', async () => {
      const result = await client.workLogs.getOverview()

      expect(result).toBeDefined()
      expect(result.statusSummary).toBeDefined()
      expect(result.totalHours).toBeDefined()
      expect(result.totalEntries).toBeDefined()
      expect(result.recentActivity).toBeInstanceOf(Array)
    })

    it('should filter overview by date range', async () => {
      const result = await client.workLogs.getOverview({
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
      })

      expect(result).toBeDefined()
      expect(result.statusSummary).toBeDefined()
    })
  })

  // ===== Project Rollup =====

  describe('getProjectRollup()', () => {
    it('should get project rollup analytics', async () => {
      const result = await client.workLogs.getProjectRollup({
        projectId: 'project_123',
      })

      expect(result).toBeDefined()
      expect(result.projectId).toBe('project_123')
      expect(result.totalHours).toBeDefined()
      expect(result.entryCount).toBeDefined()
      expect(result.statusBreakdown).toBeDefined()
    })

    it('should include collaborators and date range', async () => {
      const result = await client.workLogs.getProjectRollup({
        projectId: 'project_123',
      })

      expect(result.collaborators).toBeInstanceOf(Array)
      expect(result.dateRange).toBeDefined()
      expect(result.dateRange.earliest).toBeDefined()
      expect(result.dateRange.latest).toBeDefined()
    })
  })

  // ===== Create Work Log =====

  describe('create()', () => {
    it('should create a work log', async () => {
      const result = await client.workLogs.create({
        entryType: 'single_day',
        logDate: '2024-01-15',
        timeEntries: [
          { start_time: '08:00', end_time: '17:00', break_minutes: 60 },
        ],
        workDescription: 'Completed electrical work',
      })

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.log_date).toBe('2024-01-15')
    })

    it('should create work log with GPS location', async () => {
      const result = await client.workLogs.create({
        entryType: 'single_day',
        logDate: '2024-01-15',
        timeEntries: [{ start_time: '08:00', end_time: '17:00' }],
        gpsLatitude: 37.7749,
        gpsLongitude: -122.4194,
        gpsAccuracyMeters: 10,
        gpsCapturedAt: '2024-01-15T08:00:00Z',
        deviceType: 'ios',
        locationPermissionStatus: 'granted',
      })

      expect(result).toBeDefined()
      expect(result.gps_location).toBeDefined()
    })

    it('should create date range work log', async () => {
      const result = await client.workLogs.create({
        entryType: 'date_range',
        logDate: '2024-01-01',
        endDate: '2024-01-05',
        workDescription: 'Week-long project',
      })

      expect(result).toBeDefined()
      expect(result.entry_type).toBe('date_range')
    })
  })

  // ===== Update Work Log =====

  describe('update()', () => {
    it('should update a work log', async () => {
      const result = await client.workLogs.update({
        workLogId: 'log_123',
        workDescription: 'Updated description',
        tasksCompleted: ['Task 1', 'Task 2'],
      })

      expect(result).toBeDefined()
      expect(result.id).toBe('log_123')
    })
  })

  // ===== Submit Work Log =====

  describe('submit()', () => {
    it('should submit a work log for verification', async () => {
      const result = await client.workLogs.submit({
        workLogId: 'log_123',
      })

      expect(result).toBeDefined()
      expect(result.id).toBe('log_123')
      expect(result.status).toBe('pending_verification')
    })
  })

  // ===== Collaborators =====

  describe('addCollaborator()', () => {
    it('should add a collaborator', async () => {
      const result = await client.workLogs.addCollaborator({
        workLogId: 'log_123',
        collaboratorUserId: 'user_456',
        role: 'Assistant',
        hoursContributed: 4,
      })

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.collaborator_user_id).toBe('user_456')
    })
  })

  describe('getCollaborators()', () => {
    it('should get work log collaborators', async () => {
      const result = await client.workLogs.getCollaborators('log_123')

      expect(result).toBeDefined()
      expect(result).toBeInstanceOf(Array)
    })
  })

  describe('updateCollaborator()', () => {
    it('should update a collaborator', async () => {
      const result = await client.workLogs.updateCollaborator({
        collaboratorId: 'collab_123',
        role: 'Lead Assistant',
        hoursContributed: 6,
      })

      expect(result).toBeDefined()
      expect(result.id).toBe('collab_123')
    })
  })

  describe('removeCollaborator()', () => {
    it('should remove a collaborator', async () => {
      const result = await client.workLogs.removeCollaborator('collab_123')

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })
  })

  // ===== Comments =====

  describe('addComment()', () => {
    it('should add a comment to work log', async () => {
      const result = await client.workLogs.addComment({
        workLogId: 'log_123',
        content: 'Great work!',
      })

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.content).toBe('Great work!')
    })

    it('should add a reply comment', async () => {
      const result = await client.workLogs.addComment({
        workLogId: 'log_123',
        content: 'Thanks!',
        parentCommentId: 'comment_456',
      })

      expect(result).toBeDefined()
      expect(result.parent_comment_id).toBe('comment_456')
    })
  })

  describe('getConversation()', () => {
    it('should get work log conversation', async () => {
      const result = await client.workLogs.getConversation('log_123')

      expect(result).toBeDefined()
      expect(result).toBeInstanceOf(Array)
    })
  })

  // ===== Skills =====

  describe('getSuggestedSkills()', () => {
    it('should get suggested skills', async () => {
      const result = await client.workLogs.getSuggestedSkills({ query: 'elect' })

      expect(result).toBeDefined()
      expect(result).toBeInstanceOf(Array)
    })
  })

  describe('addSkillToProfile()', () => {
    it('should add skill to profile', async () => {
      const result = await client.workLogs.addSkillToProfile({ skill: 'Electrical' })

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })
  })

  // ===== Photos =====

  describe('uploadPhoto()', () => {
    it('should upload a photo', async () => {
      const result = await client.workLogs.uploadPhoto({
        workLogId: 'log_123',
        fileName: 'work-photo.jpg',
        mimeType: 'image/jpeg',
        fileSizeBytes: 102400,
      })

      expect(result).toBeDefined()
      expect(result.photoId).toBeDefined()
      expect(result.uploadUrl).toBeDefined()
    })
  })

  describe('updatePhotoMetadata()', () => {
    it('should update photo metadata', async () => {
      const result = await client.workLogs.updatePhotoMetadata({
        photoId: 'photo_123',
        caption: 'Completed installation',
        displayOrder: 1,
      })

      expect(result).toBeDefined()
      expect(result.id).toBe('photo_123')
    })
  })

  describe('updatePhotoVisibility()', () => {
    it('should update photo visibility', async () => {
      const result = await client.workLogs.updatePhotoVisibility({
        photoId: 'photo_123',
        visibility: 'public',
      })

      expect(result).toBeDefined()
      expect(result.visibility).toBe('public')
    })
  })

  describe('deletePhoto()', () => {
    it('should delete a photo', async () => {
      const result = await client.workLogs.deletePhoto('photo_123')

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })
  })

  // ===== Move Requests =====

  describe('moveToProject()', () => {
    it('should request move to different project', async () => {
      const result = await client.workLogs.moveToProject({
        workLogId: 'log_123',
        targetProjectId: 'project_456',
        reason: 'Wrong project selected',
      })

      expect(result).toBeDefined()
      expect(result.pending_move_to_project_id).toBe('project_456')
    })
  })

  describe('approveMoveRequest()', () => {
    it('should approve a move request', async () => {
      const result = await client.workLogs.approveMoveRequest({
        workLogId: 'log_123',
      })

      expect(result).toBeDefined()
    })
  })

  describe('denyMoveRequest()', () => {
    it('should deny a move request', async () => {
      const result = await client.workLogs.denyMoveRequest({
        workLogId: 'log_123',
        reason: 'Incorrect reasoning',
      })

      expect(result).toBeDefined()
    })
  })

  // ===== Utilities =====

  describe('checkTimeOverlap()', () => {
    it('should check for time overlaps', async () => {
      const result = await client.workLogs.checkTimeOverlap({
        logDate: '2024-01-15',
        timeEntries: [{ start_time: '08:00', end_time: '17:00' }],
      })

      expect(result).toBeDefined()
      expect(result.hasOverlap).toBeDefined()
      expect(result.overlappingLogs).toBeInstanceOf(Array)
    })
  })

  describe('exportWorkLog()', () => {
    it('should export work log as PDF', async () => {
      const result = await client.workLogs.exportWorkLog({
        workLogId: 'log_123',
        format: 'pdf',
      })

      expect(result).toBeDefined()
      expect(result.downloadUrl).toBeDefined()
      expect(result.expiresAt).toBeDefined()
    })

    it('should export work log as CSV', async () => {
      const result = await client.workLogs.exportWorkLog({
        workLogId: 'log_123',
        format: 'csv',
      })

      expect(result).toBeDefined()
      expect(result.downloadUrl).toBeDefined()
    })
  })

  // ===== Error Handling =====

  describe('error handling', () => {
    it('should handle authentication errors', async () => {
      server.use(
        http.get('*/work-logs', () => {
          return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
        })
      )

      await expect(client.workLogs.list()).rejects.toThrow()
    })

    it('should handle rate limiting', { timeout: 15000 }, async () => {
      server.use(
        http.get('*/work-logs/overview', () => {
          return HttpResponse.json(
            { error: 'Rate limit exceeded' },
            { status: 429, headers: { 'Retry-After': '1' } }
          )
        })
      )

      await expect(client.workLogs.getOverview()).rejects.toThrow()
    })

    it('should handle server errors', async () => {
      server.use(
        http.post('*/work-logs', () => {
          return HttpResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
          )
        })
      )

      await expect(
        client.workLogs.create({
          entryType: 'single_day',
          logDate: '2024-01-15',
          timeEntries: [{ start_time: '08:00', end_time: '17:00' }],
        })
      ).rejects.toThrow()
    })
  })
})
