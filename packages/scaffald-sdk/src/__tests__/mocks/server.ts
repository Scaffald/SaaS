import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

const BASE_URL = 'https://api.scaffald.com'

export const handlers = [
  // GET /v1/jobs - List jobs
  http.get(`${BASE_URL}/v1/jobs`, () => {
    return HttpResponse.json({
      data: [
        {
          id: 'job_1',
          title: 'Software Engineer',
          description: 'We are looking for a software engineer...',
          status: 'published',
          location: {
            city: 'San Francisco',
            state: 'CA',
            country: 'US',
          },
          salary_min: 120000,
          salary_max: 160000,
          employment_type: 'full_time',
          organization_id: 'org_1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          published_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'job_2',
          title: 'Senior Software Engineer',
          description: 'We are looking for a senior software engineer...',
          status: 'published',
          location: {
            city: 'New York',
            state: 'NY',
            country: 'US',
          },
          salary_min: 150000,
          salary_max: 200000,
          employment_type: 'full_time',
          organization_id: 'org_1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          published_at: '2024-01-01T00:00:00Z',
        },
      ],
      total: 2,
      limit: 20,
      offset: 0,
    })
  }),

  // GET /v1/jobs/:id - Get job
  http.get(`${BASE_URL}/v1/jobs/:id`, ({ params }) => {
    const { id } = params
    return HttpResponse.json({
      id,
      title: 'Software Engineer',
      description: 'We are looking for a software engineer...',
      status: 'published',
      location: {
        city: 'San Francisco',
        state: 'CA',
        country: 'US',
      },
      salary_min: 120000,
      salary_max: 160000,
      employment_type: 'full_time',
      organization_id: 'org_1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      published_at: '2024-01-01T00:00:00Z',
    })
  }),

  // GET /v1/jobs/filter-options - Get filter options
  http.get(`${BASE_URL}/v1/jobs/filter-options`, () => {
    return HttpResponse.json({
      industries: [
        { value: 'technology', label: 'Technology' },
        { value: 'finance', label: 'Finance' },
      ],
      locations: [
        { value: 'san-francisco', label: 'San Francisco' },
        { value: 'new-york', label: 'New York' },
      ],
      experienceLevels: [
        { value: 'junior', label: 'Junior' },
        { value: 'mid', label: 'Mid-Level' },
        { value: 'senior', label: 'Senior' },
      ],
    })
  }),

  // POST /v1/jobs - Create job
  http.post(`${BASE_URL}/v1/jobs`, async ({ request }) => {
    const body = (await request.json()) as Record<string, any>
    return HttpResponse.json(
      {
        id: 'job_new_123',
        ...body,
        organization_id: 'org_1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { status: 201 }
    )
  }),

  // PATCH /v1/jobs/:id - Update job
  http.patch(`${BASE_URL}/v1/jobs/:id`, async ({ params, request }) => {
    const { id } = params
    const body = (await request.json()) as Record<string, any>
    return HttpResponse.json({
      id,
      ...body,
      organization_id: 'org_1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: new Date().toISOString(),
    })
  }),

  // DELETE /v1/jobs/:id - Delete job
  http.delete(`${BASE_URL}/v1/jobs/:id`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // GET /v1/jobs/:id/similar - Get similar jobs
  http.get(`${BASE_URL}/v1/jobs/:id/similar`, () => {
    return HttpResponse.json({
      data: [
        {
          id: 'job_similar_1',
          title: 'Software Engineer',
          description: 'Similar role...',
          status: 'published',
          organization_id: 'org_1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'job_similar_2',
          title: 'Backend Engineer',
          description: 'Another similar role...',
          status: 'published',
          organization_id: 'org_1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ],
      total: 2,
      limit: 10,
      offset: 0,
    })
  }),

  // POST /v1/applications - Create application
  http.post(`${BASE_URL}/v1/applications`, async ({ request }) => {
    const body = (await request.json()) as Record<string, any>
    return HttpResponse.json(
      {
        id: 'app_new',
        user_id: 'user_1',
        status: 'pending',
        is_complete: false,
        applied_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...body,
      },
      { status: 201 }
    )
  }),

  // GET /v1/applications/:id - Get application
  http.get(`${BASE_URL}/v1/applications/:id`, ({ params }) => {
    const { id } = params
    return HttpResponse.json({
      id,
      job_id: 'job_1',
      user_id: 'user_1',
      status: 'submitted',
      current_location: 'San Francisco, CA',
      willing_to_relocate: true,
      years_experience: 5,
      is_authorized_to_work: true,
      earliest_start_date: '2024-02-01',
      is_complete: true,
      applied_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    })
  }),

  // PATCH /v1/applications/:id - Update application
  http.patch(`${BASE_URL}/v1/applications/:id`, async ({ params, request }) => {
    const { id } = params
    const body = (await request.json()) as Record<string, any>
    return HttpResponse.json({
      id,
      job_id: 'job_1',
      user_id: 'user_1',
      status: 'submitted',
      ...body,
      willing_to_relocate: true,
      years_experience: 5,
      is_authorized_to_work: true,
      earliest_start_date: '2024-02-01',
      is_complete: true,
      applied_at: '2024-01-01T00:00:00Z',
      updated_at: new Date().toISOString(),
    })
  }),

  // POST /v1/applications/:id/withdraw - Withdraw application
  http.post(`${BASE_URL}/v1/applications/:id/withdraw`, async ({ params }) => {
    const { id } = params
    return HttpResponse.json({
      id,
      job_id: 'job_1',
      user_id: 'user_1',
      status: 'withdrawn',
      current_location: 'San Francisco, CA',
      willing_to_relocate: true,
      years_experience: 5,
      is_authorized_to_work: true,
      earliest_start_date: '2024-02-01',
      is_complete: true,
      applied_at: '2024-01-01T00:00:00Z',
      updated_at: new Date().toISOString(),
    })
  }),

  // ===== Industries Endpoints =====

  // GET /v1/industries - List all industries
  http.get(`${BASE_URL}/v1/industries`, () => {
    return HttpResponse.json([
      {
        id: 'ind_1',
        name: 'Healthcare',
        slug: 'healthcare',
        description: 'Healthcare and medical services industry',
      },
      {
        id: 'ind_2',
        name: 'Technology',
        slug: 'technology',
        description: 'Technology and software development industry',
      },
      {
        id: 'ind_3',
        name: 'Transportation',
        slug: 'transportation',
        description: 'Transportation and logistics industry',
      },
    ])
  }),

  // GET /v1/industries/:slug - Get industry by slug
  http.get(`${BASE_URL}/v1/industries/:slug`, ({ params }) => {
    const { slug } = params

    const industries: Record<string, any> = {
      technology: {
        id: 'ind_2',
        name: 'Technology',
        slug: 'technology',
        description: 'Technology and software development industry',
      },
      healthcare: {
        id: 'ind_1',
        name: 'Healthcare',
        slug: 'healthcare',
        description: 'Healthcare and medical services industry',
      },
      transportation: {
        id: 'ind_3',
        name: 'Transportation',
        slug: 'transportation',
        description: 'Transportation and logistics industry',
      },
    }

    const industry = industries[slug as string]
    if (!industry) {
      return HttpResponse.json(null)
    }

    return HttpResponse.json(industry)
  }),

  // ===== Organizations Endpoints =====

  // GET /v1/organizations/:id - Get organization
  http.get(`${BASE_URL}/v1/organizations/:id`, ({ params }) => {
    const { id } = params
    return HttpResponse.json({
      id,
      name: 'ACME Corporation',
      slug: 'acme-corp',
      description: 'Leading technology solutions provider',
      website: 'https://acme.com',
      visibility: 'public',
      address: {
        street: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        postal_code: '94102',
        country: 'US',
      },
      logo_url: 'https://example.com/acme-logo.png',
      industry_id: 'ind_2',
      industries: {
        id: 'ind_2',
        name: 'Technology',
        slug: 'technology',
      },
      owner_user_id: 'user_owner_1',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    })
  }),

  // GET /v1/organizations/:id/open-jobs-count - Get open jobs count
  http.get(`${BASE_URL}/v1/organizations/:id/open-jobs-count`, ({ params }) => {
    const { id } = params
    return HttpResponse.json({
      organization_id: id,
      count: 15,
    })
  }),

  // GET /v1/organizations/:id/members - List members
  http.get(`${BASE_URL}/v1/organizations/:id/members`, () => {
    return HttpResponse.json([
      {
        user_id: 'user_1',
        organization_id: 'org_1',
        role_name: 'admin',
        user_profile: {
          username: 'john.doe',
          displayName: 'John Doe',
          avatar_url: 'https://example.com/john.jpg',
        },
        joined_at: '2023-01-01T00:00:00Z',
      },
      {
        user_id: 'user_2',
        organization_id: 'org_1',
        role_name: 'member',
        user_profile: {
          username: 'jane.smith',
          displayName: 'Jane Smith',
          avatar_url: 'https://example.com/jane.jpg',
        },
        joined_at: '2023-06-15T00:00:00Z',
      },
    ])
  }),

  // POST /v1/organizations/:id/members/invite - Invite member
  http.post(`${BASE_URL}/v1/organizations/:id/members/invite`, async ({ request }) => {
    const _body = await request.json()
    return HttpResponse.json(
      {
        id: 'invite_123',
        token: 'inv_token_abc123',
      },
      { status: 201 }
    )
  }),

  // POST /v1/organizations/:id/members/:userId/remove - Remove member
  http.post(`${BASE_URL}/v1/organizations/:id/members/:userId/remove`, () => {
    return HttpResponse.json({
      removed: true,
    })
  }),

  // GET /v1/organizations/:id/documents - List documents
  http.get(`${BASE_URL}/v1/organizations/:id/documents`, () => {
    return HttpResponse.json([
      {
        id: 'doc_1',
        organization_id: 'org_1',
        name: 'Employee Handbook',
        description: 'Company policies and procedures',
        category: 'policies',
        file_name: 'handbook.pdf',
        mime_type: 'application/pdf',
        file_size: 2048000,
        storage_path: 'org_1/documents/handbook.pdf',
        version: 1,
        uploaded_by: 'user_1',
        created_at: '2023-01-15T00:00:00Z',
        updated_at: '2023-01-15T00:00:00Z',
      },
      {
        id: 'doc_2',
        organization_id: 'org_1',
        name: 'Benefits Guide',
        description: 'Employee benefits information',
        category: 'benefits',
        file_name: 'benefits.pdf',
        mime_type: 'application/pdf',
        file_size: 1024000,
        storage_path: 'org_1/documents/benefits.pdf',
        version: 1,
        uploaded_by: 'user_1',
        created_at: '2023-02-01T00:00:00Z',
        updated_at: '2023-02-01T00:00:00Z',
      },
    ])
  }),

  // GET /v1/organizations/:id/documents/:documentId - Get document
  http.get(`${BASE_URL}/v1/organizations/:id/documents/:documentId`, ({ params }) => {
    const { documentId } = params
    return HttpResponse.json({
      id: documentId,
      organization_id: 'org_1',
      name: 'Employee Handbook',
      description: 'Company policies and procedures',
      category: 'policies',
      file_name: 'handbook.pdf',
      mime_type: 'application/pdf',
      file_size: 2048000,
      storage_path: 'org_1/documents/handbook.pdf',
      version: 1,
      uploaded_by: 'user_1',
      created_at: '2023-01-15T00:00:00Z',
      updated_at: '2023-01-15T00:00:00Z',
    })
  }),

  // POST /v1/organizations/:id/documents/upload-session - Create upload session
  http.post(`${BASE_URL}/v1/organizations/:id/documents/upload-session`, async ({ request }) => {
    const _body = await request.json()
    return HttpResponse.json(
      {
        document_id: 'doc_new_123',
        upload_url: 'https://storage.example.com/upload/abc123',
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      },
      { status: 201 }
    )
  }),

  // POST /v1/organizations/:id/documents/:documentId/download-url - Create download URL
  http.post(`${BASE_URL}/v1/organizations/:id/documents/:documentId/download-url`, () => {
    return HttpResponse.json({
      download_url: 'https://storage.example.com/download/abc123',
      expires_at: new Date(Date.now() + 3600000).toISOString(),
    })
  }),

  // GET /v1/organizations/:id/settings - Get settings
  http.get(`${BASE_URL}/v1/organizations/:id/settings`, ({ params }) => {
    const { id } = params
    return HttpResponse.json({
      organization_id: id,
      timezone: 'America/New_York',
      date_format: 'MM/DD/YYYY',
      time_format: '12h',
      language: 'en',
      enforce_mfa: true,
      session_timeout_minutes: 30,
      allowed_email_domains: ['acme.com', 'acmecorp.com'],
      notification_preferences: {
        email_notifications: true,
        new_applications: true,
        application_updates: true,
        team_invitations: true,
      },
      updated_at: '2024-01-01T00:00:00Z',
    })
  }),

  // PATCH /v1/organizations/:id/settings - Update settings
  http.patch(`${BASE_URL}/v1/organizations/:id/settings`, async ({ params, request }) => {
    const { id } = params
    const body = (await request.json()) as Record<string, any>
    return HttpResponse.json({
      organization_id: id,
      timezone: 'America/New_York',
      date_format: 'MM/DD/YYYY',
      time_format: '12h',
      language: 'en',
      enforce_mfa: true,
      session_timeout_minutes: 30,
      allowed_email_domains: ['acme.com', 'acmecorp.com'],
      notification_preferences: {
        email_notifications: true,
        new_applications: true,
        application_updates: true,
        team_invitations: true,
      },
      ...body,
      updated_at: new Date().toISOString(),
    })
  }),

  // GET /v1/profiles/:username - Get user profile
  http.get(`${BASE_URL}/v1/profiles/:username`, ({ params }) => {
    const { username } = params
    return HttpResponse.json({
      id: 'user_1',
      username,
      displayName: 'John Doe',
      bio: 'Software engineer with 5 years of experience',
      avatar_url: 'https://example.com/avatar.jpg',
      location: 'San Francisco, CA',
      website: 'https://johndoe.com',
      linkedin_url: 'https://linkedin.com/in/johndoe',
      github_url: 'https://github.com/johndoe',
      years_experience: 5,
      current_position: 'Senior Software Engineer',
      skills: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
      certifications: [
        {
          name: 'AWS Certified Solutions Architect',
          issuer: 'Amazon Web Services',
          issued_at: '2023-01-01',
        },
      ],
      created_at: '2020-01-01T00:00:00Z',
    })
  }),

  // GET /v1/profiles/organizations/:slug - Get organization profile
  http.get(`${BASE_URL}/v1/profiles/organizations/:slug`, ({ params }) => {
    const { slug } = params
    return HttpResponse.json({
      id: 'org_1',
      slug,
      name: 'ACME Corporation',
      description: 'Leading technology company',
      logo_url: 'https://example.com/logo.png',
      website: 'https://acme.com',
      industry: 'Technology',
      size: '1000-5000',
      location: 'San Francisco, CA',
      founded_year: 2010,
      created_at: '2020-01-01T00:00:00Z',
      job_count: 25,
    })
  }),

  // GET /v1/profiles/employers/:slug - Get employer profile
  http.get(`${BASE_URL}/v1/profiles/employers/:slug`, ({ params }) => {
    const { slug } = params
    return HttpResponse.json({
      id: 'emp_1',
      slug,
      name: 'Tech Startup Inc',
      description: 'Innovative startup',
      logo_url: 'https://example.com/startup-logo.png',
      website: 'https://startup.com',
      industry: 'SaaS',
      location: 'New York, NY',
      created_at: '2021-01-01T00:00:00Z',
      active_jobs_count: 10,
    })
  }),

  // ===== Teams Endpoints =====

  // GET /v1/teams - List teams
  http.get(`${BASE_URL}/v1/teams`, () => {
    return HttpResponse.json({
      teams: [
        {
          id: 'team_1',
          organizationId: 'org_1',
          name: 'Engineering Hiring Team',
          slug: 'eng-hiring',
          purpose: 'Hire software engineers',
          visibility: 'organization',
          invitationPolicy: 'invite_only',
          description: 'Team focused on engineering recruitment',
          imageUrl: 'https://example.com/team1.png',
          metadata: {},
          settings: {},
          allowSelfJoin: false,
          autoAssignJobs: true,
          invitationExpirationDays: 7,
          workloadStrategy: 'auto_balanced',
          workloadSettings: {},
          analyticsMetadata: {},
          analyticsLastRefreshedAt: '2024-01-01T00:00:00Z',
          analyticsRefreshIntervalMinutes: 60,
          defaultRoleKey: 'member',
          defaultRoleId: 'role_1',
          defaultRole: {
            id: 'role_1',
            key: 'member',
            name: 'Member',
          },
          isArchived: false,
          archivedAt: null,
          archivedBy: null,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'user_1',
        },
        {
          id: 'team_2',
          organizationId: 'org_1',
          name: 'Sales Recruitment',
          slug: 'sales-recruiting',
          purpose: 'Build sales team',
          visibility: 'private',
          invitationPolicy: 'invite_only',
          description: null,
          imageUrl: null,
          metadata: {},
          settings: {},
          allowSelfJoin: false,
          autoAssignJobs: false,
          invitationExpirationDays: 14,
          workloadStrategy: 'manual',
          workloadSettings: {},
          analyticsMetadata: {},
          analyticsLastRefreshedAt: null,
          analyticsRefreshIntervalMinutes: 60,
          defaultRoleKey: 'member',
          defaultRoleId: 'role_1',
          defaultRole: {
            id: 'role_1',
            key: 'member',
            name: 'Member',
          },
          isArchived: false,
          archivedAt: null,
          archivedBy: null,
          createdAt: '2023-06-01T00:00:00Z',
          updatedAt: '2023-06-01T00:00:00Z',
          createdBy: 'user_1',
        },
      ],
    })
  }),

  // GET /v1/teams/:id - Get team
  http.get(`${BASE_URL}/v1/teams/:id`, ({ params }) => {
    const { id } = params
    return HttpResponse.json({
      team: {
        id,
        organizationId: 'org_1',
        name: 'Engineering Hiring Team',
        slug: 'eng-hiring',
        purpose: 'Hire software engineers',
        visibility: 'organization',
        invitationPolicy: 'invite_only',
        description: 'Team focused on engineering recruitment',
        imageUrl: 'https://example.com/team1.png',
        metadata: {},
        settings: {},
        allowSelfJoin: false,
        autoAssignJobs: true,
        invitationExpirationDays: 7,
        workloadStrategy: 'auto_balanced',
        workloadSettings: {},
        analyticsMetadata: {},
        analyticsLastRefreshedAt: '2024-01-01T00:00:00Z',
        analyticsRefreshIntervalMinutes: 60,
        defaultRoleKey: 'member',
        defaultRoleId: 'role_1',
        defaultRole: {
          id: 'role_1',
          key: 'member',
          name: 'Member',
        },
        isArchived: false,
        archivedAt: null,
        archivedBy: null,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdBy: 'user_1',
      },
    })
  }),

  // POST /v1/teams - Create team
  http.post(`${BASE_URL}/v1/teams`, async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json(
      {
        team: {
          id: 'team_new_123',
          organizationId: (body as any).organizationId,
          name: (body as any).name,
          slug: (body as any).slug ?? null,
          purpose: (body as any).purpose ?? null,
          visibility: (body as any).visibility ?? 'organization',
          invitationPolicy: (body as any).invitationPolicy ?? 'invite_only',
          description: (body as any).description ?? null,
          imageUrl: (body as any).imageUrl ?? null,
          metadata: (body as any).metadata ?? {},
          settings: (body as any).settings ?? {},
          allowSelfJoin: (body as any).allowSelfJoin ?? false,
          autoAssignJobs: (body as any).autoAssignJobs ?? false,
          invitationExpirationDays: (body as any).invitationExpirationDays ?? 7,
          workloadStrategy: (body as any).workloadStrategy ?? 'manual',
          workloadSettings: (body as any).workloadSettings ?? {},
          analyticsMetadata: (body as any).analyticsMetadata ?? {},
          analyticsLastRefreshedAt: null,
          analyticsRefreshIntervalMinutes: (body as any).analyticsRefreshIntervalMinutes ?? 60,
          defaultRoleKey: (body as any).defaultRoleKey ?? 'member',
          defaultRoleId: 'role_1',
          defaultRole: {
            id: 'role_1',
            key: 'member',
            name: 'Member',
          },
          isArchived: false,
          archivedAt: null,
          archivedBy: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'user_1',
        },
      },
      { status: 201 }
    )
  }),

  // PATCH /v1/teams/:id - Update team
  http.patch(`${BASE_URL}/v1/teams/:id`, async ({ params, request }) => {
    const { id } = params
    const body = await request.json()
    return HttpResponse.json({
      team: {
        id,
        organizationId: 'org_1',
        name: (body as any).name ?? 'Engineering Hiring Team',
        slug: (body as any).slug ?? 'eng-hiring',
        purpose: (body as any).purpose ?? 'Hire software engineers',
        visibility: (body as any).visibility ?? 'organization',
        invitationPolicy: (body as any).invitationPolicy ?? 'invite_only',
        description: (body as any).description ?? 'Team focused on engineering recruitment',
        imageUrl: (body as any).imageUrl ?? 'https://example.com/team1.png',
        metadata: (body as any).metadata ?? {},
        settings: (body as any).settings ?? {},
        allowSelfJoin: (body as any).allowSelfJoin ?? false,
        autoAssignJobs: (body as any).autoAssignJobs ?? true,
        invitationExpirationDays: (body as any).invitationExpirationDays ?? 7,
        workloadStrategy: (body as any).workloadStrategy ?? 'auto_balanced',
        workloadSettings: (body as any).workloadSettings ?? {},
        analyticsMetadata: (body as any).analyticsMetadata ?? {},
        analyticsLastRefreshedAt: '2024-01-01T00:00:00Z',
        analyticsRefreshIntervalMinutes: (body as any).analyticsRefreshIntervalMinutes ?? 60,
        defaultRoleKey: (body as any).defaultRoleKey ?? 'member',
        defaultRoleId: 'role_1',
        defaultRole: {
          id: 'role_1',
          key: 'member',
          name: 'Member',
        },
        isArchived: false,
        archivedAt: null,
        archivedBy: null,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: new Date().toISOString(),
        createdBy: 'user_1',
      },
    })
  }),

  // POST /v1/teams/:id/archive - Archive team
  http.post(`${BASE_URL}/v1/teams/:id/archive`, ({ params }) => {
    const { id } = params
    return HttpResponse.json({
      team: {
        id,
        organizationId: 'org_1',
        name: 'Engineering Hiring Team',
        slug: 'eng-hiring',
        purpose: 'Hire software engineers',
        visibility: 'organization',
        invitationPolicy: 'invite_only',
        description: 'Team focused on engineering recruitment',
        imageUrl: 'https://example.com/team1.png',
        metadata: {},
        settings: {},
        allowSelfJoin: false,
        autoAssignJobs: true,
        invitationExpirationDays: 7,
        workloadStrategy: 'auto_balanced',
        workloadSettings: {},
        analyticsMetadata: {},
        analyticsLastRefreshedAt: '2024-01-01T00:00:00Z',
        analyticsRefreshIntervalMinutes: 60,
        defaultRoleKey: 'member',
        defaultRoleId: 'role_1',
        defaultRole: {
          id: 'role_1',
          key: 'member',
          name: 'Member',
        },
        isArchived: true,
        archivedAt: new Date().toISOString(),
        archivedBy: 'user_1',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: new Date().toISOString(),
        createdBy: 'user_1',
      },
    })
  }),

  // GET /v1/teams/:id/members - List team members
  http.get(`${BASE_URL}/v1/teams/:id/members`, () => {
    return HttpResponse.json({
      members: [
        {
          id: 'member_1',
          teamId: 'team_1',
          userId: 'user_1',
          roleId: 'role_admin',
          status: 'active',
          joinedAt: '2023-01-01T00:00:00Z',
          invitedBy: null,
          removedAt: null,
          metadata: {},
          createdAt: '2023-01-01T00:00:00Z',
          role: {
            id: 'role_admin',
            key: 'admin',
            name: 'Team Admin',
          },
          user: {
            id: 'user_1',
            displayName: 'Alice Johnson',
            username: 'alice',
            avatarPath: '/avatars/alice.jpg',
          },
        },
        {
          id: 'member_2',
          teamId: 'team_1',
          userId: 'user_2',
          roleId: 'role_recruiter',
          status: 'active',
          joinedAt: '2023-02-01T00:00:00Z',
          invitedBy: 'user_1',
          removedAt: null,
          metadata: {},
          createdAt: '2023-02-01T00:00:00Z',
          role: {
            id: 'role_recruiter',
            key: 'recruiter',
            name: 'Recruiter',
          },
          user: {
            id: 'user_2',
            displayName: 'Bob Smith',
            username: 'bob',
            avatarPath: null,
          },
        },
      ],
    })
  }),

  // POST /v1/teams/:id/members - Add team member
  http.post(`${BASE_URL}/v1/teams/:id/members`, async ({ params, request }) => {
    const { id: teamId } = params
    const body = await request.json()
    return HttpResponse.json(
      {
        member: {
          id: 'member_new_123',
          teamId,
          userId: (body as any).userId,
          roleId: 'role_1',
          status: 'active',
          joinedAt: new Date().toISOString(),
          invitedBy: 'user_1',
          removedAt: null,
          metadata: (body as any).metadata ?? {},
          createdAt: new Date().toISOString(),
          role: {
            id: 'role_1',
            key: (body as any).roleKey ?? 'member',
            name: 'Member',
          },
          user: {
            id: (body as any).userId,
            displayName: 'New User',
            username: 'newuser',
            avatarPath: null,
          },
        },
      },
      { status: 201 }
    )
  }),

  // PATCH /v1/teams/:id/members/:userId - Update team member
  http.patch(`${BASE_URL}/v1/teams/:id/members/:userId`, async ({ params, request }) => {
    const { id: teamId, userId } = params
    const body = await request.json()
    return HttpResponse.json({
      member: {
        id: 'member_1',
        teamId,
        userId,
        roleId: 'role_1',
        status: (body as any).status ?? 'active',
        joinedAt: '2023-01-01T00:00:00Z',
        invitedBy: 'user_1',
        removedAt: null,
        metadata: (body as any).metadata ?? {},
        createdAt: '2023-01-01T00:00:00Z',
        role: {
          id: 'role_1',
          key: (body as any).roleKey ?? 'member',
          name: 'Member',
        },
        user: {
          id: userId,
          displayName: 'Updated User',
          username: 'updateduser',
          avatarPath: null,
        },
      },
    })
  }),

  // DELETE /v1/teams/:id/members/:userId - Remove team member
  http.delete(`${BASE_URL}/v1/teams/:id/members/:userId`, () => {
    return HttpResponse.json({
      success: true,
    })
  }),

  // GET /v1/teams/:id/invitations - List team invitations
  http.get(`${BASE_URL}/v1/teams/:id/invitations`, () => {
    return HttpResponse.json({
      invitations: [
        {
          id: 'inv_1',
          teamId: 'team_1',
          email: 'newrecruiter@example.com',
          invitedUserId: null,
          roleId: 'role_recruiter',
          status: 'pending',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          acceptedAt: null,
          declinedAt: null,
          revokedAt: null,
          sentAt: '2024-01-01T00:00:00Z',
          notificationId: 'notif_1',
          lastDeliveryStatus: 'delivered',
          lastDeliveryError: null,
          lastDeliveryChannels: ['email'],
          createdAt: '2024-01-01T00:00:00Z',
          createdBy: 'user_1',
          metadata: {},
          role: {
            id: 'role_recruiter',
            key: 'recruiter',
            name: 'Recruiter',
          },
          team: {
            id: 'team_1',
            name: 'Engineering Hiring Team',
            organizationId: 'org_1',
            organizationName: 'ACME Corporation',
          },
        },
      ],
    })
  }),

  // POST /v1/teams/:id/invitations - Invite team member
  http.post(`${BASE_URL}/v1/teams/:id/invitations`, async ({ params, request }) => {
    const { id: teamId } = params
    const body = await request.json()
    return HttpResponse.json(
      {
        invitation: {
          id: 'inv_new_123',
          teamId,
          email: (body as any).email,
          invitedUserId: null,
          roleId: 'role_1',
          status: 'pending',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          acceptedAt: null,
          declinedAt: null,
          revokedAt: null,
          sentAt: new Date().toISOString(),
          notificationId: 'notif_new',
          lastDeliveryStatus: 'pending',
          lastDeliveryError: null,
          lastDeliveryChannels: null,
          createdAt: new Date().toISOString(),
          createdBy: 'user_1',
          metadata: (body as any).metadata ?? {},
          role: {
            id: 'role_1',
            key: (body as any).roleKey ?? 'member',
            name: 'Member',
          },
          team: {
            id: teamId,
            name: 'Engineering Hiring Team',
            organizationId: 'org_1',
            organizationName: 'ACME Corporation',
          },
        },
      },
      { status: 201 }
    )
  }),

  // DELETE /v1/teams/:id/invitations/:invitationId - Cancel team invitation
  http.delete(`${BASE_URL}/v1/teams/:id/invitations/:invitationId`, () => {
    return HttpResponse.json({
      success: true,
    })
  }),

  // GET /v1/teams/:id/jobs - List team job assignments
  http.get(`${BASE_URL}/v1/teams/:id/jobs`, () => {
    return HttpResponse.json({
      assignments: [
        {
          id: 'assignment_1',
          teamId: 'team_1',
          jobId: 'job_1',
          isPrimary: true,
          assignedAt: '2023-01-15T00:00:00Z',
          assignedBy: 'user_1',
          job: {
            id: 'job_1',
            title: 'Senior Software Engineer',
            status: 'published',
            organizationId: 'org_1',
          },
        },
        {
          id: 'assignment_2',
          teamId: 'team_1',
          jobId: 'job_2',
          isPrimary: false,
          assignedAt: '2023-02-01T00:00:00Z',
          assignedBy: 'user_1',
          job: {
            id: 'job_2',
            title: 'Frontend Developer',
            status: 'published',
            organizationId: 'org_1',
          },
        },
      ],
    })
  }),

  // POST /v1/teams/:id/jobs - Create job assignment
  http.post(`${BASE_URL}/v1/teams/:id/jobs`, async ({ params, request }) => {
    const { id: teamId } = params
    const body = await request.json()
    return HttpResponse.json(
      {
        assignment: {
          id: 'assignment_new_123',
          teamId,
          jobId: (body as any).jobId,
          isPrimary: (body as any).isPrimary ?? false,
          assignedAt: new Date().toISOString(),
          assignedBy: 'user_1',
          job: {
            id: (body as any).jobId,
            title: 'New Job Position',
            status: 'published',
            organizationId: 'org_1',
          },
        },
      },
      { status: 201 }
    )
  }),

  // DELETE /v1/teams/:id/jobs/:assignmentId - Delete job assignment
  http.delete(`${BASE_URL}/v1/teams/:id/jobs/:assignmentId`, () => {
    return HttpResponse.json({
      success: true,
    })
  }),
]

export const server = setupServer(...handlers)
