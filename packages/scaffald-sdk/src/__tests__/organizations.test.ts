import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { Scaffald } from '../client.js'
import { server } from './mocks/server'

describe('Organizations', () => {
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

  describe('retrieve()', () => {
    it('should retrieve an organization by ID', async () => {
      const org = await client.organizations.retrieve('org_123')

      expect(org).toBeDefined()
      expect(org.id).toBe('org_123')
      expect(org.name).toBe('ACME Corporation')
      expect(org.slug).toBe('acme-corp')
      expect(org.description).toBe('Leading technology solutions provider')
      expect(org.website).toBe('https://acme.com')
      expect(org.visibility).toBe('public')
      expect(org.industry_id).toBe('ind_2')
      expect(org.industries).toEqual({
        id: 'ind_2',
        name: 'Technology',
        slug: 'technology',
      })
    })

    it('should include address information', async () => {
      const org = await client.organizations.retrieve('org_123')

      expect(org.address).toBeDefined()
      expect(org.address).toMatchObject({
        street: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        postal_code: '94102',
        country: 'US',
      })
    })

    it('should include timestamps', async () => {
      const org = await client.organizations.retrieve('org_123')

      expect(org.created_at).toBeDefined()
      expect(org.updated_at).toBeDefined()
      expect(new Date(org.created_at).getTime()).toBeLessThanOrEqual(
        new Date(org.updated_at).getTime()
      )
    })
  })

  describe('getOpenJobsCount()', () => {
    it('should get count of open jobs for an organization', async () => {
      const result = await client.organizations.getOpenJobsCount('org_123')

      expect(result).toBeDefined()
      expect(result.organization_id).toBe('org_123')
      expect(result.count).toBe(15)
      expect(typeof result.count).toBe('number')
    })
  })

  describe('listMembers()', () => {
    it('should list organization members', async () => {
      const result = await client.organizations.listMembers('org_123')

      expect(result).toBeDefined()
      expect(result.data).toBeInstanceOf(Array)
      expect(result.data).toHaveLength(2)
      expect(result.total).toBe(2)
    })

    it('should include member details with user profiles', async () => {
      const result = await client.organizations.listMembers('org_123')

      const member = result.data[0]
      expect(member.user_id).toBeDefined()
      expect(member.organization_id).toBe('org_1')
      expect(member.role_name).toBe('admin')
      expect(member.user_profile).toBeDefined()
      expect(member.user_profile.username).toBe('john.doe')
      expect(member.user_profile.displayName).toBe('John Doe')
      expect(member.joined_at).toBeDefined()
    })

    it('should accept optional search and filter parameters', async () => {
      // This test verifies the method accepts parameters
      const result = await client.organizations.listMembers('org_123', {
        search: 'john',
        roleNames: ['admin', 'member'],
      })

      expect(result).toBeDefined()
      expect(result.data).toBeInstanceOf(Array)
    })
  })

  describe('inviteMember()', () => {
    it('should invite a new member to the organization', async () => {
      const result = await client.organizations.inviteMember('org_123', {
        email: 'newuser@example.com',
        roleName: 'member',
        message: 'Welcome to the team!',
      })

      expect(result).toBeDefined()
      expect(result.id).toBe('invite_123')
      expect(result.token).toBe('inv_token_abc123')
    })

    it('should invite member with minimal params', async () => {
      const result = await client.organizations.inviteMember('org_123', {
        email: 'simple@example.com',
      })

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.token).toBeDefined()
    })
  })

  describe('removeMember()', () => {
    it('should remove a member from the organization', async () => {
      const result = await client.organizations.removeMember('org_123', 'user_456')

      expect(result).toBeDefined()
      expect(result.removed).toBe(true)
    })

    it('should accept optional removal reason', async () => {
      const result = await client.organizations.removeMember('org_123', 'user_456', {
        reason: 'Left the company',
      })

      expect(result).toBeDefined()
      expect(result.removed).toBe(true)
    })
  })

  describe('listDocuments()', () => {
    it('should list organization documents', async () => {
      const result = await client.organizations.listDocuments('org_123')

      expect(result).toBeDefined()
      expect(result.data).toBeInstanceOf(Array)
      expect(result.data).toHaveLength(2)
      expect(result.total).toBe(2)
    })

    it('should include document metadata', async () => {
      const result = await client.organizations.listDocuments('org_123')

      const doc = result.data[0]
      expect(doc.id).toBe('doc_1')
      expect(doc.organization_id).toBe('org_1')
      expect(doc.name).toBe('Employee Handbook')
      expect(doc.description).toBe('Company policies and procedures')
      expect(doc.category).toBe('policies')
      expect(doc.file_name).toBe('handbook.pdf')
      expect(doc.mime_type).toBe('application/pdf')
      expect(doc.file_size).toBe(2048000)
      expect(doc.version).toBe(1)
      expect(doc.uploaded_by).toBe('user_1')
      expect(doc.created_at).toBeDefined()
      expect(doc.updated_at).toBeDefined()
    })

    it('should accept optional filtering parameters', async () => {
      const result = await client.organizations.listDocuments('org_123', {
        category: 'policies',
        limit: 10,
        offset: 0,
      })

      expect(result).toBeDefined()
      expect(result.data).toBeInstanceOf(Array)
    })
  })

  describe('getDocument()', () => {
    it('should get a specific document by ID', async () => {
      const doc = await client.organizations.getDocument('org_123', 'doc_1')

      expect(doc).toBeDefined()
      expect(doc.id).toBe('doc_1')
      expect(doc.organization_id).toBe('org_1')
      expect(doc.name).toBe('Employee Handbook')
      expect(doc.category).toBe('policies')
      expect(doc.file_name).toBe('handbook.pdf')
      expect(doc.mime_type).toBe('application/pdf')
    })
  })

  describe('createDocumentUploadSession()', () => {
    it('should create a document upload session', async () => {
      const session = await client.organizations.createDocumentUploadSession('org_123', {
        name: 'New Contract',
        fileName: 'contract.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024000,
        category: 'contracts',
      })

      expect(session).toBeDefined()
      expect(session.document_id).toBe('doc_new_123')
      expect(session.upload_url).toBe('https://storage.example.com/upload/abc123')
      expect(session.expires_at).toBeDefined()
      expect(new Date(session.expires_at).getTime()).toBeGreaterThan(Date.now())
    })

    it('should create session with optional description', async () => {
      const session = await client.organizations.createDocumentUploadSession('org_123', {
        name: 'Policy Document',
        fileName: 'policy.pdf',
        mimeType: 'application/pdf',
        fileSize: 512000,
        category: 'policies',
        description: 'Updated company policy',
      })

      expect(session).toBeDefined()
      expect(session.document_id).toBeDefined()
      expect(session.upload_url).toBeDefined()
    })
  })

  describe('createDocumentDownloadUrl()', () => {
    it('should create a download URL for a document', async () => {
      const result = await client.organizations.createDocumentDownloadUrl('org_123', 'doc_1')

      expect(result).toBeDefined()
      expect(result.download_url).toBe('https://storage.example.com/download/abc123')
      expect(result.expires_at).toBeDefined()
      expect(new Date(result.expires_at).getTime()).toBeGreaterThan(Date.now())
    })

    it('should accept optional version ID', async () => {
      const result = await client.organizations.createDocumentDownloadUrl(
        'org_123',
        'doc_1',
        'v2'
      )

      expect(result).toBeDefined()
      expect(result.download_url).toBeDefined()
      expect(result.expires_at).toBeDefined()
    })
  })

  describe('getSettings()', () => {
    it('should get organization settings', async () => {
      const settings = await client.organizations.getSettings('org_123')

      expect(settings).toBeDefined()
      expect(settings.organization_id).toBe('org_123')
      expect(settings.timezone).toBe('America/New_York')
      expect(settings.date_format).toBe('MM/DD/YYYY')
      expect(settings.time_format).toBe('12h')
      expect(settings.language).toBe('en')
      expect(settings.enforce_mfa).toBe(true)
      expect(settings.session_timeout_minutes).toBe(30)
      expect(settings.updated_at).toBeDefined()
    })

    it('should include notification preferences', async () => {
      const settings = await client.organizations.getSettings('org_123')

      expect(settings.notification_preferences).toBeDefined()
      expect(settings.notification_preferences.email_notifications).toBe(true)
      expect(settings.notification_preferences.new_applications).toBe(true)
      expect(settings.notification_preferences.application_updates).toBe(true)
      expect(settings.notification_preferences.team_invitations).toBe(true)
    })

    it('should include allowed email domains', async () => {
      const settings = await client.organizations.getSettings('org_123')

      expect(settings.allowed_email_domains).toBeDefined()
      expect(settings.allowed_email_domains).toBeInstanceOf(Array)
      expect(settings.allowed_email_domains).toContain('acme.com')
      expect(settings.allowed_email_domains).toContain('acmecorp.com')
    })
  })

  describe('updateSettings()', () => {
    it('should update organization settings', async () => {
      const updated = await client.organizations.updateSettings('org_123', {
        timezone: 'America/Los_Angeles',
        enforceMfa: false,
        sessionTimeoutMinutes: 60,
      })

      expect(updated).toBeDefined()
      expect(updated.organization_id).toBe('org_123')
      expect(updated.updated_at).toBeDefined()
      // Verify updated_at is recent
      const updatedTime = new Date(updated.updated_at).getTime()
      expect(updatedTime).toBeGreaterThan(Date.now() - 5000) // Within last 5 seconds
    })

    it('should update notification preferences', async () => {
      const updated = await client.organizations.updateSettings('org_123', {
        notificationPreferences: {
          emailNotifications: false,
          newApplications: false,
        },
      })

      expect(updated).toBeDefined()
      expect(updated.notification_preferences).toBeDefined()
    })

    it('should update allowed email domains', async () => {
      const updated = await client.organizations.updateSettings('org_123', {
        allowedEmailDomains: ['newdomain.com'],
      })

      expect(updated).toBeDefined()
      expect(updated.updated_at).toBeDefined()
    })
  })
})
