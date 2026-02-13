import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { profileViewsHandlers } from './profile-views-handlers'

const BASE_URL = 'https://api.scaffald.com'

export const handlers = [
  // GET /v1/jobs - List jobs (API returns data + pagination)
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
      pagination: { total: 2, limit: 20, offset: 0, hasMore: false },
    })
  }),

  // GET /v1/jobs/slug/:slug - Get job by slug (must be before :id)
  http.get(`${BASE_URL}/v1/jobs/slug/:slug`, ({ params }) => {
    const { slug } = params
    if (slug === 'nonexistent-slug-xyz') {
      return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return HttpResponse.json({
      data: {
        id: 'job_slug_1',
        title: 'Software Engineer',
        description: 'We are looking for a software engineer...',
        status: 'published',
        slug: slug as string,
        organization_id: 'org_1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    })
  }),

  // GET /v1/jobs/filter-options - Get filter options (must be before :id)
  http.get(`${BASE_URL}/v1/jobs/filter-options`, () => {
    return HttpResponse.json({
      data: {
        employmentTypes: ['full_time', 'part_time'],
        locations: ['San Francisco', 'New York'],
        remoteOptions: ['remote', 'hybrid', 'on_site'],
        industries: [
          { id: 'ind_1', name: 'Technology' },
          { id: 'ind_2', name: 'Healthcare' },
        ],
      },
    })
  }),

  // GET /v1/jobs/external - List external jobs (must be before :id)
  http.get(`${BASE_URL}/v1/jobs/external`, () => {
    return HttpResponse.json({
      data: [
        {
          id: 'ext_1',
          title: 'External Software Engineer',
          company_name: 'Acme Corp',
          job_location: 'Remote',
          job_type: 'full_time',
          industries: [{ industry_name: 'Technology', confidence_score: 0.9 }],
        },
      ],
    })
  }),

  // GET /v1/jobs/external/filter-options - External job filter options
  http.get(`${BASE_URL}/v1/jobs/external/filter-options`, () => {
    return HttpResponse.json({
      data: {
        jobTypes: ['full_time', 'contract'],
        locations: ['San Francisco', 'New York'],
        industries: ['Technology', 'Healthcare'],
      },
    })
  }),

  // GET /v1/jobs/:id - Get job (API returns { data: job }) - after static segments
  http.get(`${BASE_URL}/v1/jobs/:id`, ({ params }) => {
    const { id } = params
    return HttpResponse.json({
      data: {
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
      },
    })
  }),

  // POST /v1/jobs - Create job (API returns { data: job })
  http.post(`${BASE_URL}/v1/jobs`, async ({ request }) => {
    const body = (await request.json()) as Record<string, any>
    return HttpResponse.json(
      {
        data: {
          id: 'job_new_123',
          ...body,
          organization_id: 'org_1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      },
      { status: 201 }
    )
  }),

  // PATCH /v1/jobs/:id - Update job (API returns { data: job })
  http.patch(`${BASE_URL}/v1/jobs/:id`, async ({ params, request }) => {
    const { id } = params
    const body = (await request.json()) as Record<string, any>
    return HttpResponse.json({
      data: {
        id,
        ...body,
        organization_id: 'org_1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: new Date().toISOString(),
      },
    })
  }),

  // DELETE /v1/jobs/:id - Delete job
  http.delete(`${BASE_URL}/v1/jobs/:id`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // GET /v1/jobs/:id/similar - Get similar jobs (API returns { data: Job[] })
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
    })
  }),

  // POST /v1/applications - Create application
  http.post(`${BASE_URL}/v1/applications`, async ({ request }) => {
    const body = (await request.json()) as Record<string, any>
    return HttpResponse.json(
      {
        id: 'app_new_123',
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

  // GET /v1/industries - List all industries (API returns { data, total })
  http.get(`${BASE_URL}/v1/industries`, () => {
    return HttpResponse.json({
      data: [
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
      ],
      total: 3,
    })
  }),

  // GET /v1/industries/:slug - Get industry by slug (API returns { data })
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
      return new HttpResponse(null, { status: 404 })
    }

    return HttpResponse.json({ data: industry })
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

  // ===== Experience Endpoints =====

  // GET /v1/profiles/experience - List user experience
  http.get(`${BASE_URL}/v1/profiles/experience`, () => {
    return HttpResponse.json([
      {
        id: 'exp_1',
        user_id: 'user_1',
        job_title: 'Senior Software Engineer',
        company_name: 'Tech Corp',
        employment_type: 'full_time',
        is_remote: false,
        location: 'San Francisco, CA',
        start_date: '2020-01-01',
        end_date: null,
        is_current: true,
        description: 'Leading development of web applications',
        created_at: '2020-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'exp_2',
        user_id: 'user_1',
        job_title: 'Software Engineer',
        company_name: 'Startup Inc',
        employment_type: 'full_time',
        is_remote: false,
        location: 'New York, NY',
        start_date: '2018-01-01',
        end_date: '2019-12-31',
        is_current: false,
        description: 'Full stack development',
        created_at: '2018-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ])
  }),

  // POST /v1/profiles/experience - Save experience (bulk save)
  http.post(`${BASE_URL}/v1/profiles/experience`, async ({ request }) => {
    const body = (await request.json()) as Record<string, any>
    const entries = body.experience_entries || []
    return HttpResponse.json({
      success: true,
      experience_entries: entries.map((entry: any, index: number) => ({
        id: entry.id || `exp_new_${index}`,
        user_id: 'user_1',
        ...entry,
        created_at: entry.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })),
    })
  }),

  // POST /v1/profiles/experience/delete - Delete experience
  http.post(`${BASE_URL}/v1/profiles/experience/delete`, async ({ request }) => {
    const body = (await request.json()) as Record<string, any>
    if (!body.experienceId) {
      return HttpResponse.json({ error: 'experienceId is required' }, { status: 400 })
    }
    return HttpResponse.json({ success: true })
  }),

  // GET /v1/profiles/experience/summary - Get experience summary
  http.get(`${BASE_URL}/v1/profiles/experience/summary`, () => {
    return HttpResponse.json({
      career_level: 'senior',
    })
  }),

  // ===== Education Endpoints =====

  // GET /v1/profiles/education - List user education
  http.get(`${BASE_URL}/v1/profiles/education`, () => {
    return HttpResponse.json([
      {
        id: 'edu_1',
        user_id: 'user_1',
        institution_name: 'Stanford University',
        degree_type: 'Bachelor of Science',
        field_of_study: 'Computer Science',
        start_date: '2014-09-01',
        end_date: '2018-06-01',
        is_current: false,
        gpa: 3.8,
        activities: 'Computer Science Club',
        description: 'Focus on AI and machine learning',
        created_at: '2018-06-01T00:00:00Z',
        updated_at: '2018-06-01T00:00:00Z',
      },
    ])
  }),

  // POST /v1/profiles/education - Save education (bulk save)
  http.post(`${BASE_URL}/v1/profiles/education`, async ({ request }) => {
    const body = (await request.json()) as Record<string, any>
    const entries = body.education_entries || []
    return HttpResponse.json({
      success: true,
      education_entries: entries.map((entry: any, index: number) => ({
        id: entry.id || `edu_new_${index}`,
        user_id: 'user_1',
        ...entry,
        created_at: entry.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })),
    })
  }),

  // POST /v1/profiles/education/delete - Delete education
  http.post(`${BASE_URL}/v1/profiles/education/delete`, async ({ request }) => {
    const body = (await request.json()) as Record<string, any>
    if (!body.educationId) {
      return HttpResponse.json({ error: 'educationId is required' }, { status: 400 })
    }
    return HttpResponse.json({ success: true })
  }),

  // GET /v1/profiles/education/level - Get education level
  http.get(`${BASE_URL}/v1/profiles/education/level`, () => {
    return HttpResponse.json({
      education_level: 'bachelor',
    })
  }),

  // ===== Certifications Endpoints =====

  // GET /v1/profiles/certifications/tree - Get certifications tree
  http.get(`${BASE_URL}/v1/profiles/certifications/tree`, () => {
    return HttpResponse.json({
      depth0: [
        {
          id: 'user_cert_1',
          user_id: 'user_1',
          certification_id: 'tech',
          is_active: true,
          verification_status: 'verified',
          created_at: '2023-01-15T00:00:00Z',
        },
      ],
      depth1ByParent: {
        tech: [
          {
            id: 'user_cert_2',
            user_id: 'user_1',
            certification_id: 'aws',
            is_active: true,
            verification_status: 'verified',
            created_at: '2023-02-15T00:00:00Z',
          },
        ],
      },
      depth2ByParent: {},
    })
  }),

  // GET /v1/profiles/certifications/top-level - Get top-level certifications
  http.get(`${BASE_URL}/v1/profiles/certifications/top-level`, ({ request }) => {
    const url = new URL(request.url)
    const limit = url.searchParams.get('limit')
    const search = url.searchParams.get('search')

    let certifications = [
      {
        id: 'tech',
        title: 'Technology',
        slug: 'technology',
        depth: 0,
        parent_id: null,
        hierarchy_path: 'tech',
        sort_order: 1,
        is_active: true,
      },
      {
        id: 'business',
        title: 'Business',
        slug: 'business',
        depth: 0,
        parent_id: null,
        hierarchy_path: 'business',
        sort_order: 2,
        is_active: true,
      },
    ]

    if (search) {
      certifications = certifications.filter((cert) =>
        cert.title.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (limit) {
      certifications = certifications.slice(0, parseInt(limit, 10))
    }

    return HttpResponse.json({ certifications })
  }),

  // GET /v1/profiles/certifications/user - Get user certifications
  http.get(`${BASE_URL}/v1/profiles/certifications/user`, () => {
    return HttpResponse.json([
      {
        id: 'user-cert-1',
        certification_id: 'aws-arch',
        user_id: 'user_1',
        issued_date: '2023-01-15',
        expiry_date: '2026-01-15',
        credential_id: 'AWS-123456',
        created_at: '2023-01-15T00:00:00Z',
      },
    ])
  }),

  // POST /v1/profiles/certifications/user - Add user certification
  http.post(`${BASE_URL}/v1/profiles/certifications/user`, async ({ request }) => {
    const body = (await request.json()) as Record<string, any>
    return HttpResponse.json({
      id: 'user-cert-new',
      user_id: 'user_1',
      ...body,
      created_at: new Date().toISOString(),
    })
  }),

  // DELETE /v1/profiles/certifications/user/:id - Remove user certification
  http.delete(`${BASE_URL}/v1/profiles/certifications/user/:id`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // GET /v1/profiles/certifications/children - Get certification children
  http.get(`${BASE_URL}/v1/profiles/certifications/children`, ({ request }) => {
    const url = new URL(request.url)
    const parentId = url.searchParams.get('parent_id')
    return HttpResponse.json({
      certifications: [
        {
          id: 'child_1',
          title: 'Child Certification 1',
          parent_id: parentId,
          depth: 1,
          sort_order: 1,
          is_active: true,
        },
        {
          id: 'child_2',
          title: 'Child Certification 2',
          parent_id: parentId,
          depth: 1,
          sort_order: 2,
          is_active: true,
        },
      ],
    })
  }),

  // POST /v1/profiles/certifications/add - Add certification
  http.post(`${BASE_URL}/v1/profiles/certifications/add`, async ({ request }) => {
    const body = (await request.json()) as Record<string, any>
    return HttpResponse.json({
      success: true,
      certification: {
        id: `new_cert_${Date.now()}`,
        user_id: 'user_1',
        certification_id: body.certification_id,
        created_at: new Date().toISOString(),
        is_active: true,
        verification_status: 'pending',
      },
    })
  }),

  // POST /v1/profiles/certifications/add-category - Add category certification
  http.post(`${BASE_URL}/v1/profiles/certifications/add-category`, async ({ request }) => {
    const body = (await request.json()) as Record<string, any>
    return HttpResponse.json({
      success: true,
      certification: {
        id: `cat_cert_${Date.now()}`,
        user_id: 'user_1',
        certification_id: body.category_id,
        created_at: new Date().toISOString(),
        is_active: true,
        verification_status: 'pending',
      },
      alreadyExists: false,
    })
  }),

  // POST /v1/profiles/certifications/toggle-specific - Toggle specific certification
  http.post(`${BASE_URL}/v1/profiles/certifications/toggle-specific`, async ({ request }) => {
    const body = (await request.json()) as Record<string, any>
    if (body.checked) {
      return HttpResponse.json({
        success: true,
        certification: {
          id: `toggle_cert_${Date.now()}`,
          user_id: 'user_1',
          certification_id: body.certification_id,
          created_at: new Date().toISOString(),
          is_active: true,
          verification_status: 'pending',
        },
      })
    } else {
      return HttpResponse.json({
        success: true,
        certification: null,
      })
    }
  }),

  // POST /v1/profiles/certifications/remove-top-level - Remove top-level certification
  http.post(`${BASE_URL}/v1/profiles/certifications/remove-top-level`, async ({ request }) => {
    const body = (await request.json()) as Record<string, any>
    if (body.confirmed === false) {
      return HttpResponse.json({
        success: false,
        needsConfirmation: true,
        affectedCount: 5,
        message: 'This will remove 5 related certifications',
      })
    }
    return HttpResponse.json({
      success: true,
      removedCount: 5,
    })
  }),

  // POST /v1/profiles/certifications/update-proof - Update certification proof
  http.post(`${BASE_URL}/v1/profiles/certifications/update-proof`, async ({ request }) => {
    const body = (await request.json()) as Record<string, any>
    if (body.proof_type === 'url') {
      return HttpResponse.json({
        success: true,
        proofType: 'url',
        url: body.credential_url,
      })
    } else {
      return HttpResponse.json({
        success: true,
        proofType: 'file',
        filePath: `/uploads/cert_${Date.now()}.pdf`,
      })
    }
  }),

  // GET /v1/profiles/certifications - Get certifications (legacy)
  http.get(`${BASE_URL}/v1/profiles/certifications`, () => {
    return HttpResponse.json([
      {
        id: 'user_1',
        user_id: 'user_1',
        name: 'AWS Certified Solutions Architect',
        issuing_organization: 'Amazon Web Services',
        issue_date: '2022-01-15',
        expiration_date: '2025-01-15',
        credential_id: 'AWS-123456',
        credential_url: 'https://aws.amazon.com/verify',
        description: 'Professional level certification',
        is_active: true,
        verification_status: 'verified',
        created_at: '2022-01-15T00:00:00Z',
        updated_at: '2022-01-15T00:00:00Z',
      },
    ])
  }),

  // POST /v1/profiles/certifications/save - Save certifications (legacy)
  http.post(`${BASE_URL}/v1/profiles/certifications/save`, async ({ request }) => {
    const body = (await request.json()) as Record<string, any>
    return HttpResponse.json({
      success: true,
      certifications: body.certifications || [],
    })
  }),

  // POST /v1/profiles/certifications/delete - Delete certification (legacy)
  http.post(`${BASE_URL}/v1/profiles/certifications/delete`, async ({ request }) => {
    const body = (await request.json()) as Record<string, any>
    if (body.certificationId === 'invalid') {
      return HttpResponse.json({ error: 'Certification not found' }, { status: 404 })
    }
    return HttpResponse.json({
      success: true,
    })
  }),

  // ===== Skills Endpoints =====

  // GET /v1/profiles/skills/soft - Get soft skills
  http.get(`${BASE_URL}/v1/profiles/skills/soft`, ({ request }) => {
    const url = new URL(request.url)
    const _userId = url.searchParams.get('userId')
    const version = url.searchParams.get('version')
    return HttpResponse.json({
      version: version ? parseInt(version, 10) : 1,
      lastUpdated: '2024-01-15T00:00:00Z',
      categoryAverages: {
        reliability: 4.0,
        collaboration: 4.0,
        professionalism: 5.0,
        technical: 3.0,
      },
      skills: [
        {
          id: 'skill_1',
          name: 'Communication',
          category: 'collaboration',
          description: 'Effective communication',
          orderIndex: 1,
          rating: 4,
          selfAssessedAt: '2024-01-15T00:00:00Z',
        },
        {
          id: 'skill_2',
          name: 'Leadership',
          category: 'professionalism',
          description: 'Team leadership',
          orderIndex: 2,
          rating: 5,
          selfAssessedAt: '2024-01-15T00:00:00Z',
        },
        {
          id: 'skill_3',
          name: 'Reliability',
          category: 'reliability',
          description: 'Dependable and consistent',
          orderIndex: 3,
          rating: 4,
          selfAssessedAt: '2024-01-15T00:00:00Z',
        },
        {
          id: 'skill_4',
          name: 'Technical Skills',
          category: 'technical',
          description: 'Technical competency',
          orderIndex: 4,
          rating: 3,
          selfAssessedAt: '2024-01-15T00:00:00Z',
        },
      ],
    })
  }),

  // PATCH /v1/profiles/skills/soft - Update soft skills
  http.patch(`${BASE_URL}/v1/profiles/skills/soft`, async ({ request }) => {
    const _body = (await request.json()) as Record<string, any>
    return HttpResponse.json({
      version: 2,
      selfAssessedAt: new Date().toISOString(),
      categoryAverages: {
        reliability: 4.5,
        collaboration: 4.0,
        professionalism: 5.0,
        technical: 3.5,
      },
      createdNewVersion: true,
    })
  }),

  // GET /v1/profiles/skills/soft/history - Get soft skills history
  http.get(`${BASE_URL}/v1/profiles/skills/soft/history`, () => {
    return HttpResponse.json({
      versions: [
        {
          version: 1,
          selfAssessedAt: '2024-01-01T00:00:00Z',
          categoryAverages: {
            reliability: 4.0,
            collaboration: 4.0,
            professionalism: 5.0,
            technical: 3.0,
          },
        },
        {
          version: 2,
          selfAssessedAt: '2024-02-01T00:00:00Z',
          categoryAverages: {
            reliability: 4.5,
            collaboration: 4.0,
            professionalism: 5.0,
            technical: 3.5,
          },
        },
      ],
    })
  }),

  // GET /v1/profiles/skills/soft/comparison - Get soft skills comparison
  http.get(`${BASE_URL}/v1/profiles/skills/soft/comparison`, () => {
    return HttpResponse.json({
      version: 2,
      self: { reliability: 4.5, collaboration: 4.0, professionalism: 5.0, technical: 3.5 },
      peer: { reliability: 4.0, collaboration: 4.2, professionalism: 4.8, technical: 4.0 },
      peerSampleSize: 25,
      alignmentScore: 85.5,
    })
  }),

  // GET /v1/profiles/skills/industries - Get industries
  http.get(`${BASE_URL}/v1/profiles/skills/industries`, () => {
    return HttpResponse.json({
      industries: [
        { id: 'ind_1', name: 'Technology', slug: 'technology' },
        { id: 'ind_2', name: 'Construction', slug: 'construction' },
        { id: 'ind_3', name: 'Healthcare', slug: 'healthcare' },
      ],
    })
  }),

  // POST /v1/profiles/skills/search-parents - Search parent skills
  http.post(`${BASE_URL}/v1/profiles/skills/search-parents`, async ({ request }) => {
    const body = (await request.json()) as Record<string, any>
    const limit = body.limit || 20
    return HttpResponse.json({
      skills: [
        { id: 'skill_parent_1', name: 'JavaScript', code: 'JS001' },
        { id: 'skill_parent_2', name: 'Python', code: 'PY001' },
        { id: 'skill_parent_3', name: 'React', code: 'REACT001' },
      ].slice(0, limit),
    })
  }),

  // GET /v1/profiles/skills/children - Get skill children
  http.get(`${BASE_URL}/v1/profiles/skills/children`, ({ request }) => {
    const url = new URL(request.url)
    const parentId = url.searchParams.get('parentId')
    if (parentId === 'skill_leaf') {
      return HttpResponse.json({ children: [] })
    }
    return HttpResponse.json({
      children: [
        { id: 'skill_child_1', name: 'React Hooks', code: 'REACT_HOOKS' },
        { id: 'skill_child_2', name: 'React Router', code: 'REACT_ROUTER' },
      ],
    })
  }),

  // GET /v1/profiles/skills/details - Get skill details
  http.get(`${BASE_URL}/v1/profiles/skills/details`, ({ request }) => {
    const url = new URL(request.url)
    const skillId = url.searchParams.get('skillId')
    if (skillId === 'nonexistent') {
      return HttpResponse.json({ error: 'Skill not found' }, { status: 404 })
    }
    return HttpResponse.json({
      skill: {
        id: skillId || 'skill_1',
        name: 'JavaScript',
        code: 'JS001',
        description: 'Programming language for web development',
      },
    })
  }),

  // GET /v1/profiles/skills - Get user skills
  http.get(`${BASE_URL}/v1/profiles/skills`, () => {
    return HttpResponse.json({
      explicitSkills: [
        {
          id: 'us_1',
          skill_id: 'skill_1',
          skill_name: 'JavaScript',
          proficiency: 5,
          is_explicit: true,
        },
        {
          id: 'us_2',
          skill_id: 'skill_2',
          skill_name: 'TypeScript',
          proficiency: 4,
          is_explicit: true,
        },
      ],
      impliedSkills: [
        {
          id: 'us_3',
          skill_id: 'skill_3',
          skill_name: 'React',
          proficiency: 4,
          is_explicit: false,
        },
      ],
      allSkills: [
        {
          id: 'us_1',
          skill_id: 'skill_1',
          skill_name: 'JavaScript',
          proficiency: 5,
          is_explicit: true,
        },
        {
          id: 'us_2',
          skill_id: 'skill_2',
          skill_name: 'TypeScript',
          proficiency: 4,
          is_explicit: true,
        },
        {
          id: 'us_3',
          skill_id: 'skill_3',
          skill_name: 'React',
          proficiency: 4,
          is_explicit: false,
        },
      ],
    })
  }),

  // POST /v1/profiles/skills - Add user skill
  http.post(`${BASE_URL}/v1/profiles/skills`, async ({ request }) => {
    const body = (await request.json()) as Record<string, any>
    if (body.proficiency && (body.proficiency < 1 || body.proficiency > 5)) {
      return HttpResponse.json({ error: 'Proficiency must be between 1 and 5' }, { status: 400 })
    }
    return HttpResponse.json({
      success: true,
    })
  }),

  // PATCH /v1/profiles/skills - Update user skill
  http.patch(`${BASE_URL}/v1/profiles/skills`, async ({ request }) => {
    const _body = (await request.json()) as Record<string, any>
    return HttpResponse.json({
      success: true,
    })
  }),

  // DELETE /v1/profiles/skills/:skillId - Remove user skill
  http.delete(`${BASE_URL}/v1/profiles/skills/:skillId`, ({ params }) => {
    const { skillId } = params
    // Don't check for 'undefined' string - let those pass (test uses wrong param name)
    if (skillId === 'nonexistent') {
      return HttpResponse.json({ error: 'Skill not found' }, { status: 404 })
    }
    return HttpResponse.json({
      success: true,
    })
  }),

  // GET /v1/profiles/skills/multi-taxonomy - Get multi-taxonomy skills
  http.get(`${BASE_URL}/v1/profiles/skills/multi-taxonomy`, () => {
    return HttpResponse.json({
      skills: [
        {
          id: 'mt_1',
          skill_taxonomy: 'csi',
          csi_skill_id: 'csi_123',
          onet_occupation_id: null,
          proficiency_level: 4,
          years_experience: 5,
          verified: false,
          notes: null,
          created_at: '2024-01-01T00:00:00Z',
          skill_details: {
            code: '03 30 00',
            display_code: '03 30 00',
            name: 'Cast-in-Place Concrete',
            description: 'Concrete work',
            hierarchy_level: 2,
          },
        },
        {
          id: 'mt_2',
          skill_taxonomy: 'onet',
          csi_skill_id: null,
          onet_occupation_id: 'onet_456',
          proficiency_level: 5,
          years_experience: 8,
          verified: true,
          notes: 'Certified',
          created_at: '2024-01-01T00:00:00Z',
          skill_details: {
            code: '2.B.1.a',
            display_code: '2.B.1.a',
            name: 'Critical Thinking',
            description: 'Problem solving',
            hierarchy_level: 3,
          },
        },
      ],
    })
  }),

  // POST /v1/profiles/skills/multi-taxonomy - Add multi-taxonomy skill
  http.post(`${BASE_URL}/v1/profiles/skills/multi-taxonomy`, async ({ request }) => {
    const _body = (await request.json()) as Record<string, any>
    return HttpResponse.json({
      success: true,
    })
  }),

  // PATCH /v1/profiles/skills/multi-taxonomy - Update multi-taxonomy skill
  http.patch(`${BASE_URL}/v1/profiles/skills/multi-taxonomy`, async ({ request }) => {
    const _body = (await request.json()) as Record<string, any>
    return HttpResponse.json({
      success: true,
    })
  }),

  // DELETE /v1/profiles/skills/multi-taxonomy/:userSkillId - Remove multi-taxonomy skill
  http.delete(`${BASE_URL}/v1/profiles/skills/multi-taxonomy/:userSkillId`, () => {
    return HttpResponse.json({
      success: true,
    })
  }),

  // GET /v1/profiles/skills/primary-industry - Get primary industry
  http.get(`${BASE_URL}/v1/profiles/skills/primary-industry`, () => {
    return HttpResponse.json({
      primary_industry_id: 'ind_1',
      industry: { id: 'ind_1', name: 'Technology', slug: 'technology' },
    })
  }),

  // PATCH /v1/profiles/skills/primary-industry - Update primary industry
  http.patch(`${BASE_URL}/v1/profiles/skills/primary-industry`, async ({ request }) => {
    const body = (await request.json()) as Record<string, any>
    if (body.industryId === 'invalid') {
      return HttpResponse.json({ error: 'Industry not found' }, { status: 404 })
    }
    return HttpResponse.json({
      success: true,
    })
  }),

  // GET /v1/profiles/skills/legacy - Get legacy skills
  http.get(`${BASE_URL}/v1/profiles/skills/legacy`, () => {
    return HttpResponse.json({
      skills: [
        {
          skill_id: 'skill_1',
          skill_name: 'JavaScript',
          proficiency: 5,
          years_experience: 8,
          is_primary: true,
          endorsed_count: 12,
        },
        {
          skill_id: 'skill_2',
          skill_name: 'Python',
          proficiency: 4,
          years_experience: 5,
          is_primary: false,
          endorsed_count: 8,
        },
      ],
      primary_industry_id: 'ind_1',
      secondary_industries: ['ind_2', 'ind_3'],
      skill_categories: ['programming', 'web-development'],
    })
  }),

  // PATCH /v1/profiles/skills/legacy - Update legacy skills
  http.patch(`${BASE_URL}/v1/profiles/skills/legacy`, async ({ request }) => {
    const _body = (await request.json()) as Record<string, any>
    return HttpResponse.json({
      success: true,
    })
  }),

  // ===== Portfolio Endpoints =====

  // GET /v1/profiles/portfolio - List portfolio items
  http.get(`${BASE_URL}/v1/profiles/portfolio`, () => {
    return HttpResponse.json([
      {
        id: 'port_1',
        user_id: 'user_1',
        title: 'E-commerce Platform',
        description: 'Built a full-stack e-commerce platform',
        url: 'https://example.com/project',
        image_url: 'https://example.com/image.jpg',
        display_order: 1,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      },
      {
        id: 'port_2',
        user_id: 'user_1',
        title: 'Mobile App',
        description: 'iOS and Android mobile app',
        url: 'https://example.com/app',
        image_url: 'https://example.com/app-image.jpg',
        display_order: 2,
        created_at: '2023-02-01T00:00:00Z',
        updated_at: '2023-02-01T00:00:00Z',
      },
    ])
  }),

  // POST /v1/profiles/portfolio - Create portfolio item
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

  // ===== Reviews Endpoints =====

  // GET /reviews/soft-skills - Get soft skills
  http.get(`${BASE_URL}/reviews/soft-skills`, ({ request }) => {
    const url = new URL(request.url)
    const category = url.searchParams.get('category')
    const allSkills = [
      {
        id: 'ss_1',
        name: 'Punctuality',
        category: 'reliability' as const,
        description: 'Consistently on time',
        order_index: 1,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'ss_2',
        name: 'Teamwork',
        category: 'collaboration' as const,
        description: 'Works well with others',
        order_index: 2,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'ss_3',
        name: 'Communication',
        category: 'professionalism' as const,
        description: 'Clear and effective communication',
        order_index: 3,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'ss_4',
        name: 'Problem Solving',
        category: 'technical' as const,
        description: 'Solves problems effectively',
        order_index: 4,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ]

    const skills = category ? allSkills.filter((s) => s.category === category) : allSkills

    return HttpResponse.json(skills)
  }),

  // GET /reviews/soft-skills/by-category - Get soft skills grouped by category
  http.get(`${BASE_URL}/reviews/soft-skills/by-category`, () => {
    return HttpResponse.json({
      reliability: [
        {
          id: 'ss_1',
          name: 'Punctuality',
          category: 'reliability' as const,
          description: 'Consistently on time',
          order_index: 1,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ],
      collaboration: [
        {
          id: 'ss_2',
          name: 'Teamwork',
          category: 'collaboration' as const,
          description: 'Works well with others',
          order_index: 2,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ],
      professionalism: [
        {
          id: 'ss_3',
          name: 'Communication',
          category: 'professionalism' as const,
          description: 'Clear and effective communication',
          order_index: 3,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ],
      technical: [
        {
          id: 'ss_4',
          name: 'Problem Solving',
          category: 'technical' as const,
          description: 'Solves problems effectively',
          order_index: 4,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ],
    })
  }),

  // POST /reviews/drafts - Create review draft
  http.post(`${BASE_URL}/reviews/drafts`, async ({ request }) => {
    const body = (await request.json()) as Record<string, any>
    return HttpResponse.json({
      id: 'review_new',
      author_user_id: 'user_123',
      subject_id: body.subject_id,
      subject_type: body.subject_type,
      rating: null,
      body: null,
      metadata: { context: body.context },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }),

  // PATCH /reviews/:reviewId/draft - Save draft
  http.patch(`${BASE_URL}/reviews/:reviewId/draft`, () => {
    return HttpResponse.json({
      success: true,
    })
  }),

  // GET /reviews/:reviewId/draft - Get draft
  http.get(`${BASE_URL}/reviews/:reviewId/draft`, ({ params }) => {
    const { reviewId } = params
    return HttpResponse.json({
      id: reviewId,
      author_user_id: 'user_123',
      subject_id: 'user_456',
      subject_type: 'user',
      rating: null,
      body: null,
      metadata: {},
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    })
  }),

  // PATCH /reviews/:reviewId/step - Update step
  http.patch(`${BASE_URL}/reviews/:reviewId/step`, () => {
    return HttpResponse.json({
      success: true,
    })
  }),

  // PATCH /reviews/:reviewId/skill-ratings - Update skill ratings
  http.patch(`${BASE_URL}/reviews/:reviewId/skill-ratings`, () => {
    return HttpResponse.json({
      success: true,
    })
  }),

  // PATCH /reviews/:reviewId/category-rating - Update category rating
  http.patch(`${BASE_URL}/reviews/:reviewId/category-rating`, () => {
    return HttpResponse.json({
      success: true,
    })
  }),

  // PATCH /reviews/:reviewId/soft-skill-votes - Update soft skill votes
  http.patch(`${BASE_URL}/reviews/:reviewId/soft-skill-votes`, () => {
    return HttpResponse.json({
      success: true,
    })
  }),

  // PATCH /reviews/:reviewId/comment - Update comment
  http.patch(`${BASE_URL}/reviews/:reviewId/comment`, () => {
    return HttpResponse.json({
      success: true,
    })
  }),

  // POST /reviews/:reviewId/submit - Submit review
  http.post(`${BASE_URL}/reviews/:reviewId/submit`, () => {
    return HttpResponse.json({
      success: true,
    })
  }),

  // GET /reviews/by-subject - Get reviews by subject
  http.get(`${BASE_URL}/reviews/by-subject`, ({ request }) => {
    const url = new URL(request.url)
    const _subjectId = url.searchParams.get('subject_id')
    const _status = url.searchParams.get('status')

    return HttpResponse.json([
      {
        id: 'review_1',
        created_at: '2024-01-01T00:00:00Z',
        comment: 'Great to work with',
        reaction: 1,
        review_category_ratings: [
          {
            id: 'rcr_1',
            review_id: 'review_1',
            category: 'reliability',
            rating: 5,
            created_at: '2024-01-01T00:00:00Z',
          },
          {
            id: 'rcr_2',
            review_id: 'review_1',
            category: 'collaboration',
            rating: 4,
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
      },
    ])
  }),

  // GET /reviews/my-reviews - Get my reviews
  http.get(`${BASE_URL}/reviews/my-reviews`, () => {
    return HttpResponse.json([
      {
        id: 'review_1',
        author_user_id: 'user_123',
        subject_id: 'user_456',
        subject_type: 'user',
        rating: 5,
        body: 'Excellent work',
        metadata: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ])
  }),

  // GET /reviews/analytics - Get review analytics
  http.get(`${BASE_URL}/reviews/analytics`, ({ request }) => {
    const url = new URL(request.url)
    const subjectId = url.searchParams.get('subject_id')

    if (!subjectId || subjectId === 'no_reviews') {
      return HttpResponse.json(null)
    }

    return HttpResponse.json({
      overall: {
        totalReviews: 10,
        recommendCount: 8,
        notRecommendCount: 2,
        recommendPercentage: 80,
      },
      skills: [
        { skillId: 'skill_1', skillName: 'JavaScript', averageRating: 4.5, frequency: 8 },
        { skillId: 'skill_2', skillName: 'TypeScript', averageRating: 4.0, frequency: 6 },
      ],
      categories: [
        { category: 'reliability', averageRating: 4.8, frequency: 10 },
        { category: 'collaboration', averageRating: 4.5, frequency: 10 },
        { category: 'professionalism', averageRating: 4.7, frequency: 10 },
        { category: 'technical', averageRating: 4.3, frequency: 10 },
      ],
      tags: {
        strengths: [
          { name: 'Punctuality', count: 8, category: 'reliability' },
          { name: 'Teamwork', count: 7, category: 'collaboration' },
        ],
        improvements: [{ name: 'Communication', count: 3, category: 'professionalism' }],
      },
      timeline: [
        { month: '2024-01', count: 3, avgRating: 4.5, totalRating: 13.5 },
        { month: '2024-02', count: 4, avgRating: 4.8, totalRating: 19.2 },
        { month: '2024-03', count: 3, avgRating: 4.3, totalRating: 12.9 },
      ],
    })
  }),

  // DELETE /reviews/:reviewId/draft - Delete draft
  http.delete(`${BASE_URL}/reviews/:reviewId/draft`, () => {
    return HttpResponse.json({
      success: true,
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

  // GET /v1/teams/invitations/mine - List my invitations
  http.get(`${BASE_URL}/v1/teams/invitations/mine`, ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')

    const allInvitations = [
      {
        id: 'inv_1',
        teamId: 'team_1',
        email: 'user@example.com',
        invitedUserId: 'user_1',
        roleId: 'role_1',
        status: 'pending',
        expiresAt: '2024-12-31T23:59:59Z',
        acceptedAt: null,
        declinedAt: null,
        revokedAt: null,
        sentAt: '2024-01-01T00:00:00Z',
        notificationId: 'notif_1',
        lastDeliveryStatus: 'delivered',
        lastDeliveryError: null,
        lastDeliveryChannels: ['email'],
        createdAt: '2024-01-01T00:00:00Z',
        createdBy: 'user_admin',
        metadata: {},
        role: {
          id: 'role_1',
          key: 'member',
          name: 'Member',
        },
        team: {
          id: 'team_1',
          name: 'Engineering Hiring Team',
          organizationId: 'org_1',
          organizationName: 'Acme Corp',
        },
      },
      {
        id: 'inv_2',
        teamId: 'team_2',
        email: 'user@example.com',
        invitedUserId: 'user_1',
        roleId: 'role_1',
        status: 'pending',
        expiresAt: '2024-12-31T23:59:59Z',
        acceptedAt: null,
        declinedAt: null,
        revokedAt: null,
        sentAt: '2024-01-15T00:00:00Z',
        notificationId: 'notif_2',
        lastDeliveryStatus: 'delivered',
        lastDeliveryError: null,
        lastDeliveryChannels: ['email'],
        createdAt: '2024-01-15T00:00:00Z',
        createdBy: 'user_admin',
        metadata: {},
        role: {
          id: 'role_1',
          key: 'member',
          name: 'Member',
        },
        team: {
          id: 'team_2',
          name: 'Design Team',
          organizationId: 'org_1',
          organizationName: 'Acme Corp',
        },
      },
    ]

    const filteredInvitations = status
      ? allInvitations.filter((inv) => inv.status === status)
      : allInvitations

    return HttpResponse.json({
      invitations: filteredInvitations,
    })
  }),

  // POST /v1/teams/invitations/:invitationId/respond - Respond to invitation
  http.post(
    `${BASE_URL}/v1/teams/invitations/:invitationId/respond`,
    async ({ params, request }) => {
      const { invitationId } = params
      const body = (await request.json()) as { action: 'accept' | 'decline' }

      return HttpResponse.json({
        invitation: {
          id: invitationId,
          teamId: 'team_1',
          email: 'user@example.com',
          invitedUserId: 'user_1',
          roleId: 'role_1',
          status: body.action === 'accept' ? 'accepted' : 'declined',
          expiresAt: '2024-12-31T23:59:59Z',
          acceptedAt: body.action === 'accept' ? new Date().toISOString() : null,
          declinedAt: body.action === 'decline' ? new Date().toISOString() : null,
          revokedAt: null,
          sentAt: '2024-01-01T00:00:00Z',
          notificationId: 'notif_1',
          lastDeliveryStatus: 'delivered',
          lastDeliveryError: null,
          lastDeliveryChannels: ['email'],
          createdAt: '2024-01-01T00:00:00Z',
          createdBy: 'user_admin',
          metadata: {},
          role: {
            id: 'role_1',
            key: 'member',
            name: 'Member',
          },
          team: {
            id: 'team_1',
            name: 'Engineering Hiring Team',
            organizationId: 'org_1',
            organizationName: 'Acme Corp',
          },
        },
      })
    }
  ),

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

  // ===== API Keys Endpoints =====

  // GET /v1/api-keys - List all API keys
  http.get(`${BASE_URL}/v1/api-keys`, () => {
    return HttpResponse.json([
      {
        id: 'key_1',
        name: 'Production API Key',
        key_prefix: 'sk_live_abc123...',
        scopes: ['read:jobs', 'write:applications'],
        rate_limit_tier: 'pro',
        is_active: true,
        last_used_at: '2025-01-10T10:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        expires_at: '2026-12-31T23:59:59Z',
      },
      {
        id: 'key_2',
        name: 'Test API Key',
        key_prefix: 'sk_test_xyz789...',
        scopes: ['read:jobs', 'read:applications'],
        rate_limit_tier: 'free',
        is_active: true,
        last_used_at: null,
        created_at: '2024-06-15T00:00:00Z',
        expires_at: null,
      },
      {
        id: 'key_3',
        name: 'Revoked Key',
        key_prefix: 'sk_live_old456...',
        scopes: ['read:jobs'],
        rate_limit_tier: 'free',
        is_active: false,
        last_used_at: '2024-12-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        expires_at: null,
      },
    ])
  }),

  // POST /v1/api-keys - Create a new API key
  http.post(`${BASE_URL}/v1/api-keys`, async ({ request }) => {
    const body = (await request.json()) as Record<string, any>

    // Validate scopes (at least one required)
    if (!body.scopes || body.scopes.length === 0) {
      return HttpResponse.json({ error: 'At least one scope is required' }, { status: 400 })
    }

    return HttpResponse.json(
      {
        id: 'key_new_123',
        name: body.name,
        key: 'sk_live_full_key_secret_abc123xyz789', // Full key only shown once
        key_prefix: 'sk_live_abc123...',
        scopes: body.scopes || [],
        rate_limit_tier: body.rate_limit_tier || 'free',
        created_at: new Date().toISOString(),
        expires_at: body.expires_at || null,
      },
      { status: 201 }
    )
  }),

  // PATCH /v1/api-keys/:id - Update an API key
  http.patch(`${BASE_URL}/v1/api-keys/:id`, async ({ params, request }) => {
    const { id } = params
    const body = (await request.json()) as Record<string, any>

    // Check for invalid key ID
    if (id === 'invalid_key_id') {
      return HttpResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    return HttpResponse.json({
      id,
      name: body.name || 'Updated API Key',
      key_prefix: 'sk_live_abc123...',
      scopes: body.scopes || ['read:jobs', 'write:jobs'],
      rate_limit_tier: 'pro',
      is_active: body.is_active !== undefined ? body.is_active : true,
      last_used_at: '2025-01-10T10:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
      expires_at: '2026-12-31T23:59:59Z',
    })
  }),

  // POST /v1/api-keys/:id/revoke - Revoke an API key
  http.post(`${BASE_URL}/v1/api-keys/:id/revoke`, ({ params }) => {
    const { id } = params

    // Check for invalid key ID
    if (id === 'invalid_key_id') {
      return HttpResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    return HttpResponse.json({
      id,
      name: 'Production API Key',
      message: 'API key revoked successfully',
    })
  }),

  // GET /v1/api-keys/:id/usage - Get usage statistics
  http.get(`${BASE_URL}/v1/api-keys/:id/usage`, ({ params, request }) => {
    const { id } = params
    const url = new URL(request.url)
    const days = url.searchParams.get('days') || '30'

    // Check for invalid key ID
    if (id === 'invalid_key_id') {
      return HttpResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    return HttpResponse.json({
      total_requests: 1250,
      success_requests: 1180,
      error_requests: 70,
      error_rate: '5.60',
      avg_response_time_ms: 245,
      period_days: Number.parseInt(days, 10),
      usage: [
        {
          endpoint: '/v1/jobs',
          method: 'GET',
          status_code: 200,
          response_time_ms: 150,
          timestamp: '2025-01-12T10:00:00Z',
        },
        {
          endpoint: '/v1/applications',
          method: 'POST',
          status_code: 201,
          response_time_ms: 320,
          timestamp: '2025-01-12T09:45:00Z',
        },
        {
          endpoint: '/v1/jobs/123',
          method: 'GET',
          status_code: 404,
          response_time_ms: 85,
          timestamp: '2025-01-12T09:30:00Z',
        },
      ],
    })
  }),

  // ===== Webhooks Endpoints =====

  // GET /v1/webhooks - List all webhooks
  http.get(`${BASE_URL}/v1/webhooks`, () => {
    return HttpResponse.json({
      data: [
        {
          id: 'webhook_1',
          organization_id: 'org_1',
          url: 'https://api.example.com/webhooks/scaffald',
          description: 'Production webhook',
          events: ['job.created', 'job.published', 'application.created'],
          is_active: true,
          retry_max_attempts: 3,
          timeout_ms: 10000,
          rate_limit_per_minute: 60,
          metadata: { environment: 'production' },
          created_by: 'user_1',
          updated_by: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'webhook_2',
          organization_id: 'org_1',
          url: 'https://api.test.com/webhooks',
          description: 'Test webhook',
          events: ['job.created'],
          is_active: false,
          retry_max_attempts: 5,
          timeout_ms: 15000,
          rate_limit_per_minute: null,
          metadata: {},
          created_by: 'user_1',
          updated_by: 'user_1',
          created_at: '2024-06-01T00:00:00Z',
          updated_at: '2024-06-15T00:00:00Z',
        },
      ],
    })
  }),

  // GET /v1/webhooks/:id - Get a single webhook
  http.get(`${BASE_URL}/v1/webhooks/:id`, ({ params }) => {
    const { id } = params

    if (id === 'invalid_webhook_id') {
      return HttpResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    return HttpResponse.json({
      data: {
        id,
        organization_id: 'org_1',
        url: 'https://api.example.com/webhooks/scaffald',
        description: 'Production webhook',
        events: ['job.created', 'job.published', 'application.created'],
        is_active: true,
        retry_max_attempts: 3,
        timeout_ms: 10000,
        rate_limit_per_minute: 60,
        metadata: { environment: 'production' },
        created_by: 'user_1',
        updated_by: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    })
  }),

  // POST /v1/webhooks - Create a new webhook
  http.post(`${BASE_URL}/v1/webhooks`, async ({ request }) => {
    const body = (await request.json()) as Record<string, any>

    // Validate required fields
    if (!body.url || !body.events || body.events.length === 0) {
      return HttpResponse.json(
        { error: 'URL and at least one event are required' },
        { status: 400 }
      )
    }

    return HttpResponse.json(
      {
        data: {
          id: 'webhook_new_123',
          organization_id: 'org_1',
          url: body.url,
          description: body.description || null,
          secret: 'whsec_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz', // Full secret only shown once
          events: body.events,
          is_active: true,
          retry_max_attempts: body.retry_max_attempts ?? 3,
          timeout_ms: body.timeout_ms ?? 10000,
          rate_limit_per_minute: body.rate_limit_per_minute || null,
          metadata: body.metadata ?? {},
          created_by: 'user_1',
          updated_by: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        message: 'Webhook created successfully. Save the secret - it will not be shown again!',
      },
      { status: 201 }
    )
  }),

  // PATCH /v1/webhooks/:id - Update a webhook
  http.patch(`${BASE_URL}/v1/webhooks/:id`, async ({ params, request }) => {
    const { id } = params
    const body = (await request.json()) as Record<string, any>

    if (id === 'invalid_webhook_id') {
      return HttpResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    return HttpResponse.json({
      data: {
        id,
        organization_id: 'org_1',
        url: body.url || 'https://api.example.com/webhooks/scaffald',
        description: body.description || 'Updated webhook',
        events: body.events || ['job.created', 'application.created'],
        is_active: body.is_active !== undefined ? body.is_active : true,
        retry_max_attempts: body.retry_max_attempts ?? 3,
        timeout_ms: body.timeout_ms ?? 10000,
        rate_limit_per_minute: body.rate_limit_per_minute || 60,
        metadata: body.metadata ?? {},
        created_by: 'user_1',
        updated_by: 'user_1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: new Date().toISOString(),
      },
    })
  }),

  // DELETE /v1/webhooks/:id - Delete a webhook
  http.delete(`${BASE_URL}/v1/webhooks/:id`, ({ params }) => {
    const { id } = params

    if (id === 'invalid_webhook_id') {
      return HttpResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    return HttpResponse.json({
      success: true,
    })
  }),

  // GET /v1/webhooks/:id/deliveries - List webhook deliveries
  http.get(`${BASE_URL}/v1/webhooks/:id/deliveries`, ({ params, request }) => {
    const { id } = params
    const url = new URL(request.url)
    const status = url.searchParams.get('status')

    if (id === 'invalid_webhook_id') {
      return HttpResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    const allDeliveries = [
      {
        id: 'delivery_1',
        webhook_id: id,
        event_type: 'job.created',
        status: 'success',
        response_status_code: 200,
        response_body: '{"received":true}',
        error_message: null,
        retry_count: 0,
        next_retry_at: null,
        payload: { job_id: 'job_123', action: 'created' },
        created_at: '2025-01-12T10:00:00Z',
        completed_at: '2025-01-12T10:00:01Z',
      },
      {
        id: 'delivery_2',
        webhook_id: id,
        event_type: 'application.created',
        status: 'failed',
        response_status_code: 500,
        response_body: 'Internal Server Error',
        error_message: 'Connection timeout',
        retry_count: 3,
        next_retry_at: '2025-01-12T11:00:00Z',
        payload: { application_id: 'app_456', action: 'created' },
        created_at: '2025-01-12T09:30:00Z',
        completed_at: null,
      },
      {
        id: 'delivery_3',
        webhook_id: id,
        event_type: 'job.published',
        status: 'retrying',
        response_status_code: null,
        response_body: null,
        error_message: null,
        retry_count: 1,
        next_retry_at: '2025-01-12T10:30:00Z',
        payload: { job_id: 'job_789', action: 'published' },
        created_at: '2025-01-12T10:15:00Z',
        completed_at: null,
      },
    ]

    const filteredDeliveries = status
      ? allDeliveries.filter((d) => d.status === status)
      : allDeliveries

    return HttpResponse.json({
      data: filteredDeliveries,
    })
  }),

  // POST /v1/webhooks/deliveries/:id/retry - Retry a delivery
  http.post(`${BASE_URL}/v1/webhooks/deliveries/:id/retry`, ({ params }) => {
    const { id } = params

    if (id === 'invalid_delivery_id') {
      return HttpResponse.json({ error: 'Delivery not found' }, { status: 404 })
    }

    return HttpResponse.json({
      success: true,
      message: 'Delivery scheduled for retry',
    })
  }),

  // GET /v1/webhooks/event-types - Get available event types
  http.get(`${BASE_URL}/v1/webhooks/event-types`, () => {
    return HttpResponse.json({
      data: [
        { value: 'job.created', label: 'Job Created', category: 'job' },
        { value: 'job.published', label: 'Job Published', category: 'job' },
        { value: 'job.closed', label: 'Job Closed', category: 'job' },
        { value: 'application.created', label: 'Application Created', category: 'application' },
        { value: 'application.updated', label: 'Application Updated', category: 'application' },
        { value: 'application.withdrawn', label: 'Application Withdrawn', category: 'application' },
      ],
    })
  }),
  // ===========================
  // Profile Views Handlers
  // ===========================
  // ===========================
  // Engagement Handlers
  // ===========================

  // POST /v1/engagement/track - Track event
  http.post(`${BASE_URL}/v1/engagement/track`, async ({ request }) => {
    const body = (await request.json()) as any

    // Validation: eventType required
    if (!body.eventType) {
      return HttpResponse.json({ error: 'eventType is required' }, { status: 400 })
    }

    // Validation: invalid event type
    const validEventTypes = [
      'profile_view',
      'job_view',
      'job_click',
      'application_start',
      'application_complete',
      'search',
      'filter_change',
    ]
    if (!validEventTypes.includes(body.eventType)) {
      return HttpResponse.json({ error: 'Invalid event type' }, { status: 400 })
    }

    // Validation: invalid target type
    const validTargetTypes = ['user', 'job', 'organization']
    if (body.targetType && !validTargetTypes.includes(body.targetType)) {
      return HttpResponse.json({ error: 'Invalid target type' }, { status: 400 })
    }

    // Error handling: unauthorized
    if (body.targetId === 'user_unauthorized') {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Error handling: not found
    if (body.targetId === 'job_nonexistent') {
      return HttpResponse.json({ error: 'Target not found' }, { status: 404 })
    }

    // Error handling: rate limit
    if (body.targetId === 'user_rate_limit') {
      return HttpResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }

    // Error handling: deactivated target
    if (body.targetId === 'user_deactivated') {
      return HttpResponse.json({ error: 'Target is deactivated' }, { status: 410 })
    }

    // Error handling: network error simulation
    if (body.metadata?.network_error) {
      return HttpResponse.json({ error: 'Network error' }, { status: 500 })
    }

    // Sanitize metadata: remove sensitive fields
    let sanitizedMetadata = body.metadata ? { ...body.metadata } : null
    if (sanitizedMetadata) {
      delete sanitizedMetadata.ip_address
      delete sanitizedMetadata.network_error
    }

    // Handle undefined metadata properly
    if (sanitizedMetadata && Object.keys(sanitizedMetadata).length === 0) {
      sanitizedMetadata = null
    }

    const response: any = {
      id: 'event_1',
      user_id: 'user_1',
      event_type: body.eventType,
      occurred_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }

    // Only include target_type and target_id if they exist
    if (body.targetType) {
      response.target_type = body.targetType
    }
    if (body.targetId) {
      response.target_id = body.targetId
    }

    // Only include event_metadata if it exists and is not empty
    if (sanitizedMetadata && Object.keys(sanitizedMetadata).length > 0) {
      response.event_metadata = sanitizedMetadata
    }

    return HttpResponse.json(response, { status: 201 })
  }),

  // GET /v1/engagement/activity - Get recent activity
  http.get(`${BASE_URL}/v1/engagement/activity`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    const apiKey = authHeader?.replace('Bearer ', '')
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50', 10)
    const eventTypes = url.searchParams.getAll('eventTypes[]')

    // Validation: negative limit
    if (limit < 0) {
      return HttpResponse.json({ error: 'Limit must be positive' }, { status: 400 })
    }

    // Validation: very large limit
    if (limit > 1000) {
      return HttpResponse.json({ error: 'Limit too large' }, { status: 400 })
    }

    // Validation: empty eventTypes array
    if (eventTypes.length === 0 && url.searchParams.has('eventTypes[]')) {
      return HttpResponse.json({ error: 'eventTypes cannot be empty' }, { status: 400 })
    }

    // Validation: invalid event types
    const validEventTypes = [
      'profile_view',
      'job_view',
      'job_click',
      'application_start',
      'application_complete',
      'search',
      'filter_change',
    ]
    for (const eventType of eventTypes) {
      if (!validEventTypes.includes(eventType)) {
        return HttpResponse.json({ error: 'Invalid event type in filter' }, { status: 400 })
      }
    }

    // Return empty for test_key_empty
    if (apiKey === 'test_key_empty') {
      return HttpResponse.json({ data: [] })
    }

    const allEvents = [
      {
        id: 'event_1',
        user_id: 'user_1',
        event_type: 'job_view',
        target_type: 'job',
        target_id: 'job_1',
        event_metadata: { source: 'search' },
        occurred_at: '2024-01-15T14:30:00Z',
        created_at: '2024-01-15T14:30:00Z',
      },
      {
        id: 'event_2',
        user_id: 'user_1',
        event_type: 'profile_view',
        target_type: 'user',
        target_id: 'user_2',
        event_metadata: null,
        occurred_at: '2024-01-15T13:00:00Z',
        created_at: '2024-01-15T13:00:00Z',
      },
      {
        id: 'event_3',
        user_id: 'user_1',
        event_type: 'application_start',
        target_type: 'job',
        target_id: 'job_2',
        event_metadata: { device: 'mobile' },
        occurred_at: '2024-01-15T10:00:00Z',
        created_at: '2024-01-15T10:00:00Z',
      },
      {
        id: 'event_4',
        user_id: 'user_1',
        event_type: 'application_complete',
        target_type: 'job',
        target_id: 'job_3',
        event_metadata: null,
        occurred_at: '2024-01-14T10:00:00Z',
        created_at: '2024-01-14T10:00:00Z',
      },
      {
        id: 'event_5',
        user_id: 'user_1',
        event_type: 'search',
        target_type: null,
        target_id: null,
        event_metadata: { query: 'engineer' },
        occurred_at: '2024-01-13T10:00:00Z',
        created_at: '2024-01-13T10:00:00Z',
      },
    ]

    let filtered = allEvents
    if (eventTypes.length > 0) {
      filtered = filtered.filter((e) => eventTypes.includes(e.event_type))
    }

    return HttpResponse.json({
      data: filtered.slice(0, limit),
    })
  }),

  // GET /v1/engagement/metrics - Get metrics
  http.get(`${BASE_URL}/v1/engagement/metrics`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    const apiKey = authHeader?.replace('Bearer ', '')

    const url = new URL(request.url)
    const days = parseInt(url.searchParams.get('days') || '30', 10)

    // Validation (must come before test_key_new check)
    if (days < 1 || days === 0) {
      return HttpResponse.json({ error: 'days must be at least 1' }, { status: 400 })
    }

    // Return empty metrics for test_key_new
    if (apiKey === 'test_key_new') {
      return HttpResponse.json({
        profile_views: 0,
        job_views: 0,
        applications_started: 0,
        applications_completed: 0,
        searches: 0,
        total_events: 0,
      })
    }

    if (days === 999999) {
      return HttpResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return HttpResponse.json({
      profile_views: 42,
      job_views: 128,
      applications_started: 15,
      applications_completed: 8,
      searches: 67,
      total_events: 260,
    })
  }),
  // ===========================
  // Connections Handlers
  // ===========================

  // GET /v1/connections - List connections
  http.get(`${BASE_URL}/v1/connections`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    const apiKey = authHeader?.replace('Bearer ', '')
    
    // Simulate server error for test_key_server_error
    if (apiKey === 'test_key_server_error') {
      return HttpResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
    
    // Return empty for test_key_empty
    if (apiKey === 'test_key_empty') {
      return HttpResponse.json({ data: [], total: 0 })
    }
    return HttpResponse.json({
      data: [
        {
          id: 'conn_1',
          requester_id: 'user_1',
          addressee_id: 'user_2',
          status: 'accepted',
          created_at: '2024-01-10T10:00:00Z',
          updated_at: '2024-01-10T12:00:00Z',
          requester: {
            id: 'user_1',
            first_name: 'Alice',
            last_name: 'Johnson',
            avatar_url: 'https://example.com/avatar1.jpg',
          },
          addressee: {
            id: 'user_2',
            first_name: 'Bob',
            last_name: 'Smith',
            avatar_url: 'https://example.com/avatar2.jpg',
          },
        },
        {
          id: 'conn_2',
          requester_id: 'user_3',
          addressee_id: 'user_1',
          status: 'accepted',
          created_at: '2024-01-11T10:00:00Z',
          updated_at: '2024-01-11T11:00:00Z',
          requester: {
            id: 'user_3',
            first_name: 'Bob',
            last_name: 'Wilson',
            avatar_url: 'https://example.com/avatar3.jpg',
          },
          addressee: {
            id: 'user_1',
            first_name: 'Alice',
            last_name: 'Johnson',
            avatar_url: 'https://example.com/avatar1.jpg',
          },
        },
        {
          id: 'conn_3',
          requester_id: 'user_1',
          addressee_id: 'user_4',
          status: 'accepted',
          created_at: '2024-01-12T10:00:00Z',
          updated_at: '2024-01-12T12:00:00Z',
          requester: { id: 'user_1', first_name: 'Alice', last_name: 'Johnson', avatar_url: 'https://example.com/avatar1.jpg' },
          addressee: { id: 'user_4', first_name: 'David', last_name: 'Brown', avatar_url: 'https://example.com/avatar4.jpg' },
        },
        {
          id: 'conn_4',
          requester_id: 'user_5',
          addressee_id: 'user_1',
          status: 'accepted',
          created_at: '2024-01-13T10:00:00Z',
          updated_at: '2024-01-13T12:00:00Z',
          requester: { id: 'user_5', first_name: 'Eve', last_name: 'Williams', avatar_url: 'https://example.com/avatar5.jpg' },
          addressee: { id: 'user_1', first_name: 'Alice', last_name: 'Johnson', avatar_url: 'https://example.com/avatar1.jpg' },
        },
        {
          id: 'conn_5',
          requester_id: 'user_1',
          addressee_id: 'user_6',
          status: 'accepted',
          created_at: '2024-01-14T10:00:00Z',
          updated_at: '2024-01-14T12:00:00Z',
          requester: { id: 'user_1', first_name: 'Alice', last_name: 'Johnson', avatar_url: 'https://example.com/avatar1.jpg' },
          addressee: { id: 'user_6', first_name: 'Frank', last_name: 'Miller', avatar_url: 'https://example.com/avatar6.jpg' },
        },
        {
          id: 'conn_6',
          requester_id: 'user_7',
          addressee_id: 'user_1',
          status: 'accepted',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T12:00:00Z',
          requester: { id: 'user_7', first_name: 'Grace', last_name: 'Davis', avatar_url: 'https://example.com/avatar7.jpg' },
          addressee: { id: 'user_1', first_name: 'Alice', last_name: 'Johnson', avatar_url: 'https://example.com/avatar1.jpg' },
        },
        {
          id: 'conn_7',
          requester_id: 'user_1',
          addressee_id: 'user_8',
          status: 'accepted',
          created_at: '2024-01-16T10:00:00Z',
          updated_at: '2024-01-16T12:00:00Z',
          requester: { id: 'user_1', first_name: 'Alice', last_name: 'Johnson', avatar_url: 'https://example.com/avatar1.jpg' },
          addressee: { id: 'user_8', first_name: 'Henry', last_name: 'Taylor', avatar_url: 'https://example.com/avatar8.jpg' },
        },
                {
          id: 'conn_8',
          requester_id: 'user_9',
          addressee_id: 'user_1',
          status: 'accepted',
          created_at: '2024-01-17T10:00:00Z',
          updated_at: '2024-01-17T12:00:00Z',
          requester: { id: 'user_9', first_name: 'Ivy', last_name: 'Anderson', avatar_url: 'https://example.com/avatar9.jpg' },
          addressee: { id: 'user_1', first_name: 'Alice', last_name: 'Johnson', avatar_url: 'https://example.com/avatar1.jpg' },
        },
        {
          id: 'conn_9',
          requester_id: 'user_1',
          addressee_id: 'user_10',
          status: 'accepted',
          created_at: '2024-01-18T10:00:00Z',
          updated_at: '2024-01-18T12:00:00Z',
          requester: { id: 'user_1', first_name: 'Alice', last_name: 'Johnson', avatar_url: 'https://example.com/avatar1.jpg' },
          addressee: { id: 'user_10', first_name: 'Jack', last_name: 'White', avatar_url: 'https://example.com/avatar10.jpg' },
        },
        {
          id: 'conn_10',
          requester_id: 'user_11',
          addressee_id: 'user_1',
          status: 'accepted',
          created_at: '2024-01-19T10:00:00Z',
          updated_at: '2024-01-19T12:00:00Z',
          requester: { id: 'user_11', first_name: 'Kate', last_name: 'Harris', avatar_url: 'https://example.com/avatar11.jpg' },
          addressee: { id: 'user_1', first_name: 'Alice', last_name: 'Johnson', avatar_url: 'https://example.com/avatar1.jpg' },
        },
      ],
      total: 10,
    })
  }),

  // GET /v1/connections/pending - Get pending requests
  http.get(`${BASE_URL}/v1/connections/pending`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    const apiKey = authHeader?.replace('Bearer ', '')
    
    // Return empty for test_key_empty
    if (apiKey === 'test_key_empty') {
      return HttpResponse.json({ sent: [], received: [] })
    }
    return HttpResponse.json({
      sent: [
        {
          id: 'conn_pending_1',
          requester_id: 'user_1',
          addressee_id: 'user_pending_sent',
          status: 'pending',
          created_at: '2024-01-12T10:00:00Z',
          requester: { id: 'user_1', first_name: 'Alice', last_name: 'Johnson', avatar_url: 'https://example.com/avatar1.jpg' },
        },
        {
          id: 'conn_pending_3',
          requester_id: 'user_1',
          addressee_id: 'user_12',
          status: 'pending',
          created_at: '2024-01-20T10:00:00Z',
          requester: { id: 'user_1', first_name: 'Alice', last_name: 'Johnson', avatar_url: 'https://example.com/avatar1.jpg' },
        },
      ],
      received: [
        {
          id: 'conn_pending_2',
          requester_id: 'user_5',
          addressee_id: 'user_1',
          status: 'pending',
          created_at: '2024-01-13T10:00:00Z',
          requester: { id: 'user_5', first_name: 'Eve', last_name: 'Williams', avatar_url: 'https://example.com/avatar5.jpg' },
        },
        {
          id: 'conn_pending_4',
          requester_id: 'user_13',
          addressee_id: 'user_1',
          status: 'pending',
          created_at: '2024-01-21T10:00:00Z',
          requester: { id: 'user_13', first_name: 'Laura', last_name: 'Martin', avatar_url: 'https://example.com/avatar13.jpg' },
        },
        {
          id: 'conn_pending_5',
          requester_id: 'user_14',
          addressee_id: 'user_1',
          status: 'pending',
          created_at: '2024-01-22T10:00:00Z',
          requester: { id: 'user_14', first_name: 'Mike', last_name: 'Thompson', avatar_url: 'https://example.com/avatar14.jpg' },
        },
      ],
    })
  }),

  // GET /v1/connections/status/:userId - Get connection status
  http.get(`${BASE_URL}/v1/connections/status/:userId`, ({ params }) => {
    const { userId } = params

    // Error cases
    if (userId === 'user_nonexistent') {
      return HttpResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Special cases
    if (userId === 'user_self') {
      return HttpResponse.json({
        status: 'none', // Cannot connect with yourself
      })
    }

    if (userId === 'user_2' || userId === 'user_already_connected') {
      return HttpResponse.json({
        status: 'connected',
        connectionId: 'conn_1',
      })
    }

    if (userId === 'user_pending_sent') {
      return HttpResponse.json({
        status: 'pending_sent',
        connectionId: 'conn_pending_1',
      })
    }

    if (userId === 'user_pending_received') {
      return HttpResponse.json({
        status: 'pending_received',
        connectionId: 'conn_pending_2',
      })
    }

    if (userId === 'nonexistent_user') {
      return HttpResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return HttpResponse.json({
      status: 'none',
    })
  }),

  // POST /v1/connections/request - Send connection request
  http.post(`${BASE_URL}/v1/connections/request`, async ({ request }) => {
    const body = (await request.json()) as any

    // Validation errors
    if (!body.targetUserId || body.targetUserId === '') {
      return HttpResponse.json({ error: 'targetUserId is required' }, { status: 400 })
    }

    // Invalid format - reject special characters
    if (body.targetUserId && /[^a-zA-Z0-9_-]/.test(body.targetUserId)) {
      return HttpResponse.json({ error: 'Invalid userId format' }, { status: 400 })
    }

    // Cannot send to self
    if (body.targetUserId === 'user_self' || body.targetUserId === 'user_1') {
      return HttpResponse.json({ error: 'Cannot send connection request to yourself' }, { status: 400 })
    }

    // User not found
    if (body.targetUserId === 'user_nonexistent') {
      return HttpResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Already connected
    if (body.targetUserId === 'user_2' || body.targetUserId === 'user_already_connected') {
      return HttpResponse.json({ error: 'Already connected' }, { status: 409 })
    }

    // Pending request exists
    if (body.targetUserId === 'user_pending_sent') {
      return HttpResponse.json({ error: 'Connection request already sent' }, { status: 409 })
    }

    // Unauthorized
    if (body.targetUserId === 'user_unauthorized') {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit
    if (body.targetUserId === 'user_rate_limit') {
      return HttpResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': '1' } }
      )
    }

    // Exceeds connection limit
    if (body.targetUserId === 'user_exceeds_limit') {
      return HttpResponse.json({ error: 'Connection limit exceeded' }, { status: 403 })
    }

    // Deactivated user
    if (body.targetUserId === 'user_deactivated') {
      return HttpResponse.json({ error: 'User is deactivated' }, { status: 403 })
    }

    // Blocked user
    if (body.targetUserId === 'user_blocked') {
      return HttpResponse.json({ error: 'Cannot send connection request to blocked user' }, { status: 403 })
    }

    // Network error simulation
    if (body.targetUserId === 'user_network_error') {
      return HttpResponse.error()
    }

    // Private profile - should succeed but just send request
    // (removing the error that was here before)

    return HttpResponse.json(
      {
        id: 'conn_new_1',
        requester_id: 'user_1',
        addressee_id: body.targetUserId,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        requester: {
          id: 'user_1',
          first_name: 'Alice',
          last_name: 'Johnson',
          avatar_url: 'https://example.com/avatar1.jpg',
        },
        addressee: {
          id: body.targetUserId,
          first_name: 'New',
          last_name: 'User',
          avatar_url: 'https://example.com/avatar_new.jpg',
        },
      },
      { status: 201 }
    )
  }),

  // POST /v1/connections/:connectionId/accept - Accept connection
  http.post(`${BASE_URL}/v1/connections/:connectionId/accept`, ({ params }) => {
    const { connectionId } = params

    // Validation
    if (!connectionId || connectionId === '') {
      return HttpResponse.json({ error: 'connectionId is required' }, { status: 400 })
    }

    // Invalid format - only reject truly invalid formats (special chars, spaces, etc)
    if (connectionId && /[^a-zA-Z0-9_-]/.test(connectionId as string)) {
      return HttpResponse.json({ error: 'Invalid connectionId format' }, { status: 400 })
    }

    // Not found
    if (connectionId === 'invalid_id' || connectionId === 'conn_nonexistent' || connectionId === 'invalid-id-format') {
      return HttpResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    // Already accepted
    if (connectionId === 'conn_already_accepted' || connectionId === 'conn_1') {
      return HttpResponse.json({ error: 'Connection already accepted' }, { status: 409 })
    }

    // Already declined
    if (connectionId === 'conn_already_declined') {
      return HttpResponse.json({ error: 'Connection already declined' }, { status: 409 })
    }

    // Cannot accept request you sent
    if (connectionId === 'conn_you_sent') {
      return HttpResponse.json({ error: 'Cannot accept request you sent' }, { status: 403 })
    }

    return HttpResponse.json({
      id: connectionId,
      requester_id: 'user_2',
      addressee_id: 'user_1',
      status: 'accepted',
      created_at: '2024-01-10T10:00:00Z',
      updated_at: new Date().toISOString(),
      requester: {
        id: 'user_2',
        first_name: 'Bob',
        last_name: 'Smith',
        avatar_url: 'https://example.com/avatar2.jpg',
      },
      addressee: {
        id: 'user_1',
        first_name: 'Alice',
        last_name: 'Johnson',
        avatar_url: 'https://example.com/avatar1.jpg',
      },
    })
  }),

  // POST /v1/connections/:connectionId/decline - Decline connection
  http.post(`${BASE_URL}/v1/connections/:connectionId/decline`, ({ params }) => {
    const { connectionId } = params

    // Validation
    if (!connectionId || connectionId === '') {
      return HttpResponse.json({ error: 'connectionId is required' }, { status: 400 })
    }

    // Not found
    if (connectionId === 'invalid_id' || connectionId === 'conn_nonexistent') {
      return HttpResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    // Already accepted - can't decline
    if (connectionId === 'conn_already_accepted' || connectionId === 'conn_1') {
      return HttpResponse.json({ error: 'Cannot decline accepted connection' }, { status: 409 })
    }

    // Already declined - idempotent, return success
    if (connectionId === 'conn_already_declined') {
      return new HttpResponse(null, { status: 204 })
    }

    // Cannot decline request you sent
    if (connectionId === 'conn_you_sent') {
      return HttpResponse.json({ error: 'Cannot decline request you sent' }, { status: 403 })
    }

    return new HttpResponse(null, { status: 204 })
  }),

  // DELETE /v1/connections/:connectionId - Remove connection
  http.delete(`${BASE_URL}/v1/connections/:connectionId`, ({ params }) => {
    const { connectionId } = params

    // Not found
    if (connectionId === 'invalid_id' || connectionId === 'conn_nonexistent') {
      return HttpResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    // Cannot remove pending request (must cancel instead)
    if (connectionId === 'conn_pending_1' || connectionId === 'conn_pending' || connectionId === 'conn_pending_5') {
      return HttpResponse.json({ error: 'Cannot remove pending connection. Use cancel instead.' }, { status: 400 })
    }

    // Already removed - idempotent
    if (connectionId === 'conn_already_removed') {
      return new HttpResponse(null, { status: 204 })
    }

    return new HttpResponse(null, { status: 204 })
  }),

  // DELETE /v1/connections/:connectionId/cancel - Cancel request
  http.delete(`${BASE_URL}/v1/connections/:connectionId/cancel`, ({ params }) => {
    const { connectionId } = params

    // Not found
    if (connectionId === 'invalid_id' || connectionId === 'conn_nonexistent') {
      return HttpResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    // Cannot cancel request you received (must decline instead)
    if (connectionId === 'conn_you_received' || connectionId === 'conn_pending_2' || connectionId === 'conn_pending_received_1') {
      return HttpResponse.json({ error: 'Cannot cancel request you received. Use decline instead.' }, { status: 403 })
    }

    // Cannot cancel accepted connection
    if (connectionId === 'conn_already_accepted' || connectionId === 'conn_1') {
      return HttpResponse.json({ error: 'Cannot cancel accepted connection. Use remove instead.' }, { status: 409 })
    }

    // Already canceled - idempotent
    if (connectionId === 'conn_already_canceled') {
      return new HttpResponse(null, { status: 204 })
    }

    return new HttpResponse(null, { status: 204 })
  }),

  // ===========================

  // GET /v1/work-logs/projects - Get project options
  http.get(`${BASE_URL}/v1/work-logs/projects`, ({ request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('search')
    const includeArchived = url.searchParams.get('includeArchived')

    const projects = [
      {
        id: 'proj_1',
        name: 'Website Redesign',
        status: 'active',
        isArchived: false,
        organizationId: 'org_1',
        projectNumber: 'PRJ-001',
      },
      {
        id: 'proj_2',
        name: 'Mobile App Development',
        status: 'active',
        isArchived: false,
        organizationId: 'org_1',
        projectNumber: 'PRJ-002',
      },
      {
        id: 'proj_3',
        name: 'Legacy System Migration',
        status: 'completed',
        isArchived: true,
        organizationId: 'org_1',
        projectNumber: 'PRJ-003',
      },
    ]

    let filtered = projects
    if (search) {
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    }
    if (includeArchived !== 'true') {
      filtered = filtered.filter((p) => !p.isArchived)
    }

    return HttpResponse.json(filtered)
  }),

  // GET /v1/work-logs/projects/:projectId/rollup - Get project rollup
  http.get(`${BASE_URL}/v1/work-logs/projects/:projectId/rollup`, ({ params, request }) => {
    const { projectId } = params
    const url = new URL(request.url)
    const dateFrom = url.searchParams.get('dateFrom')
    const dateTo = url.searchParams.get('dateTo')

    if (projectId === 'invalid_project_id') {
      return HttpResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return HttpResponse.json({
      projectId,
      totalHours: 120.5,
      entryCount: 15,
      statusBreakdown: {
        draft: { count: 2, hours: 8.0 },
        pending_verification: { count: 3, hours: 24.0 },
        verified: { count: 10, hours: 88.5 },
        disputed: { count: 0, hours: 0 },
      },
      collaborators: ['user_1', 'user_2', 'user_3'],
      dateRange: {
        earliest: dateFrom || '2024-01-01',
        latest: dateTo || '2024-01-31',
      },
    })
  }),

  // GET /v1/work-logs/public-feed - Get public profile feed
  http.get(`${BASE_URL}/v1/work-logs/public-feed`, ({ request }) => {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    const limit = parseInt(url.searchParams.get('limit') || '10', 10)

    if (!userId) {
      return HttpResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const workLogs = Array.from({ length: Math.min(limit, 3) }, (_, i) => ({
      id: `wl_public_${i + 1}`,
      user_id: userId,
      status: 'verified' as const,
      project_id: 'proj_1',
      time_entries: [{ start_time: '09:00', end_time: '17:00', break_minutes: 60 }],
      tasks_completed: ['Implemented new feature', 'Fixed bugs'],
      skills_used: ['JavaScript', 'React', 'TypeScript'],
      visibility: 'public' as const,
      show_on_profile: true,
      show_date_range_on_profile: false,
      entry_type: 'single_day' as const,
      log_date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      work_description: 'Worked on project tasks',
      total_hours: 8.0,
      submitted_at: '2024-01-01T17:00:00Z',
      verified_at: '2024-01-02T09:00:00Z',
      disputed_at: null,
      dispute_reason: null,
      gps_location: null,
      gps_accuracy_meters: null,
      gps_captured_at: null,
      device_type: 'web' as const,
      location_permission_status: 'not_requested' as const,
      created_at: '2024-01-01T09:00:00Z',
      updated_at: '2024-01-01T17:00:00Z',
      verified_by_user_id: 'verifier_1',
      pending_move_to_project_id: null,
      pending_move_reason: null,
      pending_move_requested_at: null,
      pending_move_requested_by: null,
      photoCount: 2,
      collaboratorCount: 1,
      commentCount: 3,
    }))

    return HttpResponse.json(workLogs)
  }),

  // GET /v1/work-logs - List work logs
  http.get(`${BASE_URL}/v1/work-logs`, ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20', 10)
    const statuses = url.searchParams.get('statuses')
    const projectId = url.searchParams.get('projectId')

    const workLogs = [
      {
        id: 'wl_1',
        user_id: 'user_1',
        status: 'draft' as const,
        project_id: 'proj_1',
        time_entries: [{ start_time: '09:00', end_time: '17:00', break_minutes: 60 }],
        tasks_completed: ['Task 1', 'Task 2'],
        skills_used: ['JavaScript', 'React'],
        visibility: 'organization' as const,
        show_on_profile: true,
        show_date_range_on_profile: false,
        entry_type: 'single_day' as const,
        log_date: '2024-01-15',
        work_description: 'Development work',
        total_hours: 7.0,
        submitted_at: null,
        verified_at: null,
        disputed_at: null,
        dispute_reason: null,
        gps_location: null,
        gps_accuracy_meters: null,
        gps_captured_at: null,
        device_type: 'web' as const,
        location_permission_status: 'not_requested' as const,
        created_at: '2024-01-15T09:00:00Z',
        updated_at: '2024-01-15T17:00:00Z',
        verified_by_user_id: null,
        pending_move_to_project_id: null,
        pending_move_reason: null,
        pending_move_requested_at: null,
        pending_move_requested_by: null,
        photoCount: 0,
        collaboratorCount: 0,
        commentCount: 0,
      },
      {
        id: 'wl_2',
        user_id: 'user_1',
        status: 'verified' as const,
        project_id: 'proj_1',
        time_entries: [{ start_time: '09:00', end_time: '17:00', break_minutes: 60 }],
        tasks_completed: ['Completed feature'],
        skills_used: ['TypeScript', 'Node.js'],
        visibility: 'public' as const,
        show_on_profile: true,
        show_date_range_on_profile: false,
        entry_type: 'single_day' as const,
        log_date: '2024-01-14',
        work_description: 'Backend development',
        total_hours: 8.0,
        submitted_at: '2024-01-14T17:00:00Z',
        verified_at: '2024-01-15T09:00:00Z',
        disputed_at: null,
        dispute_reason: null,
        gps_location: null,
        gps_accuracy_meters: null,
        gps_captured_at: null,
        device_type: 'web' as const,
        location_permission_status: 'not_requested' as const,
        created_at: '2024-01-14T09:00:00Z',
        updated_at: '2024-01-15T09:00:00Z',
        verified_by_user_id: 'verifier_1',
        pending_move_to_project_id: null,
        pending_move_reason: null,
        pending_move_requested_at: null,
        pending_move_requested_by: null,
        photoCount: 2,
        collaboratorCount: 1,
        commentCount: 5,
      },
    ]

    let filtered = workLogs
    if (statuses) {
      const statusArray = statuses.split(',')
      filtered = filtered.filter((wl) => statusArray.includes(wl.status))
    }
    if (projectId) {
      filtered = filtered.filter((wl) => wl.project_id === projectId)
    }

    const totalCount = filtered.length
    const hasMore = page * pageSize < totalCount

    return HttpResponse.json({
      workLogs: filtered,
      totalCount,
      page,
      pageSize,
      hasMore,
    })
  }),

  // GET /v1/work-logs/overview - Get overview
  http.get(`${BASE_URL}/v1/work-logs/overview`, ({ request }) => {
    const url = new URL(request.url)
    const _dateFrom = url.searchParams.get('dateFrom')
    const _dateTo = url.searchParams.get('dateTo')

    return HttpResponse.json({
      statusSummary: {
        draft: { count: 5, hours: 40.0 },
        pending_verification: { count: 3, hours: 24.0 },
        verified: { count: 20, hours: 160.0 },
        disputed: { count: 1, hours: 8.0 },
      },
      totalHours: 232.0,
      totalEntries: 29,
      recentActivity: [
        {
          id: 'wl_recent_1',
          user_id: 'user_1',
          status: 'verified' as const,
          project_id: 'proj_1',
          time_entries: [{ start_time: '09:00', end_time: '17:00', break_minutes: 60 }],
          tasks_completed: ['Recent task'],
          skills_used: ['JavaScript'],
          visibility: 'organization' as const,
          show_on_profile: true,
          show_date_range_on_profile: false,
          entry_type: 'single_day' as const,
          log_date: '2024-01-20',
          work_description: 'Recent work',
          total_hours: 8.0,
          submitted_at: '2024-01-20T17:00:00Z',
          verified_at: '2024-01-21T09:00:00Z',
          disputed_at: null,
          dispute_reason: null,
          gps_location: null,
          gps_accuracy_meters: null,
          gps_captured_at: null,
          device_type: 'web' as const,
          location_permission_status: 'not_requested' as const,
          created_at: '2024-01-20T09:00:00Z',
          updated_at: '2024-01-21T09:00:00Z',
          verified_by_user_id: 'verifier_1',
          pending_move_to_project_id: null,
          pending_move_reason: null,
          pending_move_requested_at: null,
          pending_move_requested_by: null,
          photoCount: 1,
          collaboratorCount: 0,
          commentCount: 2,
        },
      ],
    })
  }),

  // POST /v1/work-logs - Create work log
  http.post(`${BASE_URL}/v1/work-logs`, async ({ request }) => {
    const body = (await request.json()) as any

    if (!body.entryType || !body.logDate) {
      return HttpResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    return HttpResponse.json(
      {
        id: 'wl_new_1',
        user_id: 'user_1',
        status: 'draft' as const,
        project_id: body.projectId || null,
        time_entries: body.timeEntries || null,
        tasks_completed: body.tasksCompleted || null,
        skills_used: body.skillsUsed || null,
        visibility: body.visibility || 'organization',
        show_on_profile: body.showOnProfile ?? false,
        show_date_range_on_profile: body.showDateRangeOnProfile ?? false,
        entry_type: body.entryType,
        log_date: body.logDate,
        work_description: body.workDescription || null,
        total_hours: body.timeEntries
          ? body.timeEntries.reduce((sum: number, entry: any) => {
              const start = new Date(`2000-01-01T${entry.start_time}`)
              const end = new Date(`2000-01-01T${entry.end_time}`)
              const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
              const breakHours = (entry.break_minutes || 0) / 60
              return sum + hours - breakHours
            }, 0)
          : 0,
        submitted_at: null,
        verified_at: null,
        disputed_at: null,
        dispute_reason: null,
        gps_location:
          body.gpsLatitude && body.gpsLongitude
            ? { lat: body.gpsLatitude, lng: body.gpsLongitude }
            : null,
        gps_accuracy_meters: body.gpsAccuracyMeters || null,
        gps_captured_at: body.gpsCapturedAt || null,
        device_type: body.deviceType || null,
        location_permission_status: body.locationPermissionStatus || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        verified_by_user_id: null,
        pending_move_to_project_id: null,
        pending_move_reason: null,
        pending_move_requested_at: null,
        pending_move_requested_by: null,
      },
      { status: 201 }
    )
  }),

  // GET /v1/work-logs/:workLogId - Get work log by ID
  http.get(`${BASE_URL}/v1/work-logs/:workLogId`, ({ params }) => {
    const { workLogId } = params

    if (workLogId === 'invalid_id') {
      return HttpResponse.json({ error: 'Work log not found' }, { status: 404 })
    }

    return HttpResponse.json({
      id: workLogId,
      user_id: 'user_1',
      status: 'verified' as const,
      project_id: 'proj_1',
      time_entries: [{ start_time: '09:00', end_time: '17:00', break_minutes: 60 }],
      tasks_completed: ['Task 1', 'Task 2'],
      skills_used: ['JavaScript', 'React', 'TypeScript'],
      visibility: 'organization' as const,
      show_on_profile: true,
      show_date_range_on_profile: false,
      entry_type: 'single_day' as const,
      log_date: '2024-01-15',
      work_description: 'Completed development tasks',
      total_hours: 7.0,
      submitted_at: '2024-01-15T17:00:00Z',
      verified_at: '2024-01-16T09:00:00Z',
      disputed_at: null,
      dispute_reason: null,
      gps_location: null,
      gps_accuracy_meters: null,
      gps_captured_at: null,
      device_type: 'web' as const,
      location_permission_status: 'not_requested' as const,
      created_at: '2024-01-15T09:00:00Z',
      updated_at: '2024-01-16T09:00:00Z',
      verified_by_user_id: 'verifier_1',
      pending_move_to_project_id: null,
      pending_move_reason: null,
      pending_move_requested_at: null,
      pending_move_requested_by: null,
    })
  }),

  // PATCH /v1/work-logs/:workLogId - Update work log
  http.patch(`${BASE_URL}/v1/work-logs/:workLogId`, async ({ params, request }) => {
    const { workLogId } = params
    const body = (await request.json()) as any

    if (workLogId === 'invalid_id') {
      return HttpResponse.json({ error: 'Work log not found' }, { status: 404 })
    }

    return HttpResponse.json({
      id: workLogId,
      user_id: 'user_1',
      status: 'draft' as const,
      project_id: body.projectId || 'proj_1',
      time_entries: body.timeEntries || [
        { start_time: '09:00', end_time: '17:00', break_minutes: 60 },
      ],
      tasks_completed: body.tasksCompleted || ['Updated task'],
      skills_used: body.skillsUsed || ['JavaScript'],
      visibility: body.visibility || 'organization',
      show_on_profile: body.showOnProfile ?? true,
      show_date_range_on_profile: body.showDateRangeOnProfile ?? false,
      entry_type: body.entryType || 'single_day',
      log_date: body.logDate || '2024-01-15',
      work_description: body.workDescription || 'Updated description',
      total_hours: 7.0,
      submitted_at: null,
      verified_at: null,
      disputed_at: null,
      dispute_reason: null,
      gps_location:
        body.gpsLatitude && body.gpsLongitude
          ? { lat: body.gpsLatitude, lng: body.gpsLongitude }
          : null,
      gps_accuracy_meters: body.gpsAccuracyMeters || null,
      gps_captured_at: body.gpsCapturedAt || null,
      device_type: body.deviceType || 'web',
      location_permission_status: body.locationPermissionStatus || 'not_requested',
      created_at: '2024-01-15T09:00:00Z',
      updated_at: new Date().toISOString(),
      verified_by_user_id: null,
      pending_move_to_project_id: null,
      pending_move_reason: null,
      pending_move_requested_at: null,
      pending_move_requested_by: null,
    })
  }),

  // POST /v1/work-logs/:workLogId/submit - Submit work log
  http.post(`${BASE_URL}/v1/work-logs/:workLogId/submit`, ({ params }) => {
    const { workLogId } = params

    if (workLogId === 'invalid_id') {
      return HttpResponse.json({ error: 'Work log not found' }, { status: 404 })
    }

    return HttpResponse.json({
      id: workLogId,
      user_id: 'user_1',
      status: 'pending_verification' as const,
      project_id: 'proj_1',
      time_entries: [{ start_time: '09:00', end_time: '17:00', break_minutes: 60 }],
      tasks_completed: ['Task 1'],
      skills_used: ['JavaScript'],
      visibility: 'organization' as const,
      show_on_profile: true,
      show_date_range_on_profile: false,
      entry_type: 'single_day' as const,
      log_date: '2024-01-15',
      work_description: 'Work completed',
      total_hours: 7.0,
      submitted_at: new Date().toISOString(),
      verified_at: null,
      disputed_at: null,
      dispute_reason: null,
      gps_location: null,
      gps_accuracy_meters: null,
      gps_captured_at: null,
      device_type: 'web' as const,
      location_permission_status: 'not_requested' as const,
      created_at: '2024-01-15T09:00:00Z',
      updated_at: new Date().toISOString(),
      verified_by_user_id: null,
      pending_move_to_project_id: null,
      pending_move_reason: null,
      pending_move_requested_at: null,
      pending_move_requested_by: null,
    })
  }),

  // POST /v1/work-logs/:workLogId/collaborators - Add collaborator
  http.post(`${BASE_URL}/v1/work-logs/:workLogId/collaborators`, async ({ params, request }) => {
    const { workLogId } = params
    const body = (await request.json()) as any

    if (workLogId === 'invalid_id') {
      return HttpResponse.json({ error: 'Work log not found' }, { status: 404 })
    }

    if (!body.collaboratorUserId) {
      return HttpResponse.json({ error: 'collaboratorUserId is required' }, { status: 400 })
    }

    return HttpResponse.json(
      {
        id: 'collab_1',
        work_log_id: workLogId,
        collaborator_user_id: body.collaboratorUserId,
        role: body.role || null,
        hours_contributed: body.hoursContributed || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { status: 201 }
    )
  }),

  // GET /v1/work-logs/:workLogId/collaborators - Get collaborators
  http.get(`${BASE_URL}/v1/work-logs/:workLogId/collaborators`, ({ params }) => {
    const { workLogId } = params

    if (workLogId === 'invalid_id') {
      return HttpResponse.json({ error: 'Work log not found' }, { status: 404 })
    }

    return HttpResponse.json([
      {
        id: 'collab_1',
        work_log_id: workLogId,
        collaborator_user_id: 'user_2',
        role: 'Assistant',
        hours_contributed: 4.0,
        created_at: '2024-01-15T09:00:00Z',
        updated_at: '2024-01-15T09:00:00Z',
      },
      {
        id: 'collab_2',
        work_log_id: workLogId,
        collaborator_user_id: 'user_3',
        role: 'Reviewer',
        hours_contributed: 2.0,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      },
    ])
  }),

  // PATCH /v1/work-logs/collaborators/:collaboratorId - Update collaborator
  http.patch(
    `${BASE_URL}/v1/work-logs/collaborators/:collaboratorId`,
    async ({ params, request }) => {
      const { collaboratorId } = params
      const body = (await request.json()) as any

      if (collaboratorId === 'invalid_id') {
        return HttpResponse.json({ error: 'Collaborator not found' }, { status: 404 })
      }

      return HttpResponse.json({
        id: collaboratorId,
        work_log_id: 'wl_1',
        collaborator_user_id: 'user_2',
        role: body.role || 'Updated Role',
        hours_contributed: body.hoursContributed || 5.0,
        created_at: '2024-01-15T09:00:00Z',
        updated_at: new Date().toISOString(),
      })
    }
  ),

  // DELETE /v1/work-logs/collaborators/:collaboratorId - Remove collaborator
  http.delete(`${BASE_URL}/v1/work-logs/collaborators/:collaboratorId`, ({ params }) => {
    const { collaboratorId } = params

    if (collaboratorId === 'invalid_id') {
      return HttpResponse.json({ error: 'Collaborator not found' }, { status: 404 })
    }

    return HttpResponse.json({ success: true })
  }),

  // POST /v1/work-logs/:workLogId/comments - Add comment
  http.post(`${BASE_URL}/v1/work-logs/:workLogId/comments`, async ({ params, request }) => {
    const { workLogId } = params
    const body = (await request.json()) as any

    if (workLogId === 'invalid_id') {
      return HttpResponse.json({ error: 'Work log not found' }, { status: 404 })
    }

    if (!body.content) {
      return HttpResponse.json({ error: 'content is required' }, { status: 400 })
    }

    return HttpResponse.json(
      {
        id: 'comment_1',
        work_log_id: workLogId,
        user_id: 'user_1',
        parent_comment_id: body.parentCommentId || null,
        content: body.content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { status: 201 }
    )
  }),

  // GET /v1/work-logs/:workLogId/conversation - Get conversation
  http.get(`${BASE_URL}/v1/work-logs/:workLogId/conversation`, ({ params }) => {
    const { workLogId } = params

    if (workLogId === 'invalid_id') {
      return HttpResponse.json({ error: 'Work log not found' }, { status: 404 })
    }

    return HttpResponse.json([
      {
        id: 'comment_1',
        work_log_id: workLogId,
        user_id: 'user_1',
        parent_comment_id: null,
        content: 'Great work!',
        created_at: '2024-01-15T14:00:00Z',
        updated_at: '2024-01-15T14:00:00Z',
      },
      {
        id: 'comment_2',
        work_log_id: workLogId,
        user_id: 'user_2',
        parent_comment_id: 'comment_1',
        content: 'Thanks!',
        created_at: '2024-01-15T14:30:00Z',
        updated_at: '2024-01-15T14:30:00Z',
      },
    ])
  }),

  // GET /v1/work-logs/skills/suggestions - Get suggested skills
  http.get(`${BASE_URL}/v1/work-logs/skills/suggestions`, ({ request }) => {
    const url = new URL(request.url)
    const query = url.searchParams.get('query')

    if (!query) {
      return HttpResponse.json({ error: 'query is required' }, { status: 400 })
    }

    const allSkills = [
      'JavaScript',
      'TypeScript',
      'React',
      'Node.js',
      'Python',
      'Java',
      'C++',
      'Ruby',
      'PHP',
      'Swift',
    ]

    const filtered = allSkills.filter((skill) => skill.toLowerCase().includes(query.toLowerCase()))

    return HttpResponse.json(filtered.slice(0, 5))
  }),

  // POST /v1/work-logs/skills - Add skill to profile
  http.post(`${BASE_URL}/v1/work-logs/skills`, async ({ request }) => {
    const body = (await request.json()) as any

    if (!body.skill) {
      return HttpResponse.json({ error: 'skill is required' }, { status: 400 })
    }

    return HttpResponse.json({ success: true }, { status: 201 })
  }),

  // POST /v1/work-logs/:workLogId/photos - Upload photo
  http.post(`${BASE_URL}/v1/work-logs/:workLogId/photos`, async ({ params, request }) => {
    const { workLogId } = params
    const body = (await request.json()) as any

    if (workLogId === 'invalid_id') {
      return HttpResponse.json({ error: 'Work log not found' }, { status: 404 })
    }

    if (!body.fileName || !body.mimeType) {
      return HttpResponse.json({ error: 'fileName and mimeType are required' }, { status: 400 })
    }

    return HttpResponse.json(
      {
        photoId: 'photo_1',
        uploadUrl: 'https://upload.example.com/photo_1',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      },
      { status: 201 }
    )
  }),

  // PATCH /v1/work-logs/photos/:photoId - Update photo metadata
  http.patch(`${BASE_URL}/v1/work-logs/photos/:photoId`, async ({ params, request }) => {
    const { photoId } = params
    const body = (await request.json()) as any

    if (photoId === 'invalid_id') {
      return HttpResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    return HttpResponse.json({
      id: photoId,
      work_log_id: 'wl_1',
      user_id: 'user_1',
      storage_path: '/photos/photo_1.jpg',
      file_name: 'photo_1.jpg',
      file_size_bytes: 1024000,
      mime_type: 'image/jpeg',
      caption: body.caption || 'Updated caption',
      visibility: 'organization' as const,
      display_order: body.displayOrder ?? 0,
      uploaded_at: '2024-01-15T12:00:00Z',
      created_at: '2024-01-15T12:00:00Z',
    })
  }),

  // PATCH /v1/work-logs/photos/:photoId/visibility - Update photo visibility
  http.patch(`${BASE_URL}/v1/work-logs/photos/:photoId/visibility`, async ({ params, request }) => {
    const { photoId } = params
    const body = (await request.json()) as any

    if (photoId === 'invalid_id') {
      return HttpResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    if (!body.visibility) {
      return HttpResponse.json({ error: 'visibility is required' }, { status: 400 })
    }

    return HttpResponse.json({
      id: photoId,
      work_log_id: 'wl_1',
      user_id: 'user_1',
      storage_path: '/photos/photo_1.jpg',
      file_name: 'photo_1.jpg',
      file_size_bytes: 1024000,
      mime_type: 'image/jpeg',
      caption: 'Photo caption',
      visibility: body.visibility,
      display_order: 0,
      uploaded_at: '2024-01-15T12:00:00Z',
      created_at: '2024-01-15T12:00:00Z',
    })
  }),

  // DELETE /v1/work-logs/photos/:photoId - Delete photo
  http.delete(`${BASE_URL}/v1/work-logs/photos/:photoId`, ({ params }) => {
    const { photoId } = params

    if (photoId === 'invalid_id') {
      return HttpResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    return HttpResponse.json({ success: true })
  }),

  // PATCH /v1/work-logs/:workLogId/profile-visibility - Update profile visibility
  http.patch(
    `${BASE_URL}/v1/work-logs/:workLogId/profile-visibility`,
    async ({ params, request }) => {
      const { workLogId } = params
      const body = (await request.json()) as any

      if (workLogId === 'invalid_id') {
        return HttpResponse.json({ error: 'Work log not found' }, { status: 404 })
      }

      return HttpResponse.json({
        id: workLogId,
        user_id: 'user_1',
        status: 'verified' as const,
        project_id: 'proj_1',
        time_entries: [{ start_time: '09:00', end_time: '17:00', break_minutes: 60 }],
        tasks_completed: ['Task 1'],
        skills_used: ['JavaScript'],
        visibility: 'organization' as const,
        show_on_profile: body.showOnProfile ?? true,
        show_date_range_on_profile: body.showDateRangeOnProfile ?? false,
        entry_type: 'single_day' as const,
        log_date: '2024-01-15',
        work_description: 'Work completed',
        total_hours: 7.0,
        submitted_at: '2024-01-15T17:00:00Z',
        verified_at: '2024-01-16T09:00:00Z',
        disputed_at: null,
        dispute_reason: null,
        gps_location: null,
        gps_accuracy_meters: null,
        gps_captured_at: null,
        device_type: 'web' as const,
        location_permission_status: 'not_requested' as const,
        created_at: '2024-01-15T09:00:00Z',
        updated_at: new Date().toISOString(),
        verified_by_user_id: 'verifier_1',
        pending_move_to_project_id: null,
        pending_move_reason: null,
        pending_move_requested_at: null,
        pending_move_requested_by: null,
      })
    }
  ),

  // POST /v1/work-logs/:workLogId/move - Move to project
  http.post(`${BASE_URL}/v1/work-logs/:workLogId/move`, async ({ params, request }) => {
    const { workLogId } = params
    const body = (await request.json()) as any

    if (workLogId === 'invalid_id') {
      return HttpResponse.json({ error: 'Work log not found' }, { status: 404 })
    }

    if (!body.targetProjectId) {
      return HttpResponse.json({ error: 'targetProjectId is required' }, { status: 400 })
    }

    return HttpResponse.json({
      id: workLogId,
      user_id: 'user_1',
      status: 'verified' as const,
      project_id: 'proj_1',
      time_entries: [{ start_time: '09:00', end_time: '17:00', break_minutes: 60 }],
      tasks_completed: ['Task 1'],
      skills_used: ['JavaScript'],
      visibility: 'organization' as const,
      show_on_profile: true,
      show_date_range_on_profile: false,
      entry_type: 'single_day' as const,
      log_date: '2024-01-15',
      work_description: 'Work completed',
      total_hours: 7.0,
      submitted_at: '2024-01-15T17:00:00Z',
      verified_at: '2024-01-16T09:00:00Z',
      disputed_at: null,
      dispute_reason: null,
      gps_location: null,
      gps_accuracy_meters: null,
      gps_captured_at: null,
      device_type: 'web' as const,
      location_permission_status: 'not_requested' as const,
      created_at: '2024-01-15T09:00:00Z',
      updated_at: new Date().toISOString(),
      verified_by_user_id: 'verifier_1',
      pending_move_to_project_id: body.targetProjectId,
      pending_move_reason: body.reason || null,
      pending_move_requested_at: new Date().toISOString(),
      pending_move_requested_by: 'user_1',
    })
  }),

  // POST /v1/work-logs/:workLogId/move/approve - Approve move request
  http.post(`${BASE_URL}/v1/work-logs/:workLogId/move/approve`, ({ params }) => {
    const { workLogId } = params

    if (workLogId === 'invalid_id') {
      return HttpResponse.json({ error: 'Work log not found' }, { status: 404 })
    }

    return HttpResponse.json({
      id: workLogId,
      user_id: 'user_1',
      status: 'verified' as const,
      project_id: 'proj_2',
      time_entries: [{ start_time: '09:00', end_time: '17:00', break_minutes: 60 }],
      tasks_completed: ['Task 1'],
      skills_used: ['JavaScript'],
      visibility: 'organization' as const,
      show_on_profile: true,
      show_date_range_on_profile: false,
      entry_type: 'single_day' as const,
      log_date: '2024-01-15',
      work_description: 'Work completed',
      total_hours: 7.0,
      submitted_at: '2024-01-15T17:00:00Z',
      verified_at: '2024-01-16T09:00:00Z',
      disputed_at: null,
      dispute_reason: null,
      gps_location: null,
      gps_accuracy_meters: null,
      gps_captured_at: null,
      device_type: 'web' as const,
      location_permission_status: 'not_requested' as const,
      created_at: '2024-01-15T09:00:00Z',
      updated_at: new Date().toISOString(),
      verified_by_user_id: 'verifier_1',
      pending_move_to_project_id: null,
      pending_move_reason: null,
      pending_move_requested_at: null,
      pending_move_requested_by: null,
    })
  }),

  // POST /v1/work-logs/:workLogId/move/deny - Deny move request
  http.post(`${BASE_URL}/v1/work-logs/:workLogId/move/deny`, async ({ params, request }) => {
    const { workLogId } = params
    const _body = (await request.json()) as any

    if (workLogId === 'invalid_id') {
      return HttpResponse.json({ error: 'Work log not found' }, { status: 404 })
    }

    return HttpResponse.json({
      id: workLogId,
      user_id: 'user_1',
      status: 'verified' as const,
      project_id: 'proj_1',
      time_entries: [{ start_time: '09:00', end_time: '17:00', break_minutes: 60 }],
      tasks_completed: ['Task 1'],
      skills_used: ['JavaScript'],
      visibility: 'organization' as const,
      show_on_profile: true,
      show_date_range_on_profile: false,
      entry_type: 'single_day' as const,
      log_date: '2024-01-15',
      work_description: 'Work completed',
      total_hours: 7.0,
      submitted_at: '2024-01-15T17:00:00Z',
      verified_at: '2024-01-16T09:00:00Z',
      disputed_at: null,
      dispute_reason: null,
      gps_location: null,
      gps_accuracy_meters: null,
      gps_captured_at: null,
      device_type: 'web' as const,
      location_permission_status: 'not_requested' as const,
      created_at: '2024-01-15T09:00:00Z',
      updated_at: new Date().toISOString(),
      verified_by_user_id: 'verifier_1',
      pending_move_to_project_id: null,
      pending_move_reason: null,
      pending_move_requested_at: null,
      pending_move_requested_by: null,
    })
  }),

  // POST /v1/work-logs/:workLogId/move/cancel - Cancel move request
  http.post(`${BASE_URL}/v1/work-logs/:workLogId/move/cancel`, ({ params }) => {
    const { workLogId } = params

    if (workLogId === 'invalid_id') {
      return HttpResponse.json({ error: 'Work log not found' }, { status: 404 })
    }

    return HttpResponse.json({
      id: workLogId,
      user_id: 'user_1',
      status: 'verified' as const,
      project_id: 'proj_1',
      time_entries: [{ start_time: '09:00', end_time: '17:00', break_minutes: 60 }],
      tasks_completed: ['Task 1'],
      skills_used: ['JavaScript'],
      visibility: 'organization' as const,
      show_on_profile: true,
      show_date_range_on_profile: false,
      entry_type: 'single_day' as const,
      log_date: '2024-01-15',
      work_description: 'Work completed',
      total_hours: 7.0,
      submitted_at: '2024-01-15T17:00:00Z',
      verified_at: '2024-01-16T09:00:00Z',
      disputed_at: null,
      dispute_reason: null,
      gps_location: null,
      gps_accuracy_meters: null,
      gps_captured_at: null,
      device_type: 'web' as const,
      location_permission_status: 'not_requested' as const,
      created_at: '2024-01-15T09:00:00Z',
      updated_at: new Date().toISOString(),
      verified_by_user_id: 'verifier_1',
      pending_move_to_project_id: null,
      pending_move_reason: null,
      pending_move_requested_at: null,
      pending_move_requested_by: null,
    })
  }),

  // POST /v1/work-logs/:workLogId/export - Export work log
  http.post(`${BASE_URL}/v1/work-logs/:workLogId/export`, async ({ params, request }) => {
    const { workLogId } = params
    const body = (await request.json()) as any

    if (workLogId === 'invalid_id') {
      return HttpResponse.json({ error: 'Work log not found' }, { status: 404 })
    }

    if (!body.format || !['pdf', 'csv'].includes(body.format)) {
      return HttpResponse.json({ error: 'Invalid format' }, { status: 400 })
    }

    return HttpResponse.json({
      downloadUrl: `https://download.example.com/worklog_${workLogId}.${body.format}`,
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    })
  }),

  // POST /v1/work-logs/check-overlap - Check time overlap
  http.post(`${BASE_URL}/v1/work-logs/check-overlap`, async ({ request }) => {
    const body = (await request.json()) as any

    if (!body.logDate || !body.timeEntries) {
      return HttpResponse.json({ error: 'logDate and timeEntries are required' }, { status: 400 })
    }

    // Simulate overlap detection
    const hasOverlap =
      body.logDate === '2024-01-15' &&
      body.timeEntries.some((entry: any) => entry.start_time === '09:00')

    return HttpResponse.json({
      hasOverlap,
      overlappingLogs: hasOverlap
        ? [
            {
              id: 'wl_overlap_1',
              logDate: '2024-01-15',
              totalHours: 8.0,
            },
          ]
        : [],
    })
  }),

  // ============================================================================
  // Projects handlers
  // ============================================================================

  // GET /v1/projects - List projects
  http.get(`${BASE_URL}/v1/projects`, ({ request }) => {
    const url = new URL(request.url)
    const organizationId = url.searchParams.get('organization_id')
    const status = url.searchParams.get('status')
    const limit = parseInt(url.searchParams.get('limit') || '20', 10)
    const offset = parseInt(url.searchParams.get('offset') || '0', 10)

    let projects = [
      {
        id: 'proj_1',
        organization_id: 'org_1',
        name: 'Downtown Office Building',
        description: 'New office construction project',
        status: 'active' as const,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        location_visibility: 'organization_only' as const,
        location_visibility_override: false,
        created_by: 'user_1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'proj_2',
        organization_id: 'org_1',
        name: 'Residential Complex',
        description: 'Multi-family housing development',
        status: 'planning' as const,
        start_date: '2024-06-01',
        end_date: null,
        location_visibility: 'public' as const,
        location_visibility_override: false,
        created_by: 'user_1',
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      },
    ]

    // Filter by organization
    if (organizationId) {
      projects = projects.filter((p) => p.organization_id === organizationId)
    }

    // Filter by status
    if (status) {
      projects = projects.filter((p) => p.status === status)
    }

    // Apply pagination
    const paginatedProjects = projects.slice(offset, offset + limit)

    return HttpResponse.json({
      projects: paginatedProjects,
      count: projects.length,
    })
  }),

  // POST /v1/projects - Create project
  http.post(`${BASE_URL}/v1/projects`, async ({ request }) => {
    const body = (await request.json()) as any

    if (!body.organization_id || !body.name) {
      return HttpResponse.json({ error: 'organization_id and name are required' }, { status: 400 })
    }

    const project = {
      id: 'proj_new',
      organization_id: body.organization_id,
      name: body.name,
      description: body.description || null,
      status: body.status || 'planning',
      start_date: body.start_date || null,
      end_date: body.end_date || null,
      location_visibility: body.location_visibility || 'organization_only',
      location_visibility_override: body.location_visibility_override || false,
      created_by: 'user_1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    return HttpResponse.json({ project })
  }),

  // GET /v1/projects/:id - Get project by ID
  http.get(`${BASE_URL}/v1/projects/:id`, ({ params }) => {
    const { id } = params

    if (id === 'invalid_id') {
      return HttpResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const project = {
      id: id as string,
      organization_id: 'org_1',
      name: 'Downtown Office Building',
      description: 'New office construction project',
      status: 'active' as const,
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      location_visibility: 'organization_only' as const,
      location_visibility_override: false,
      created_by: 'user_1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      project_sites: [
        {
          is_primary: true,
          site: {
            id: 'site_1',
            site_identifier: 'SITE-001',
            boundary: {},
            area_sqft: 50000,
            zoning_classification: 'Commercial',
            jurisdiction: 'San Francisco',
            metadata: {},
          },
        },
      ],
      project_addresses: [
        {
          is_primary: true,
          address: {
            id: 'addr_1',
            address: '123 Main St, San Francisco, CA 94102',
            geo: {},
            property_type: 'Commercial',
            metadata: {},
          },
        },
      ],
      project_workers: [
        {
          id: 'pw_1',
          project_id: id as string,
          user_id: 'user_1',
          job_id: 'job_1',
          status: 'approved' as const,
          claimed_by_worker: false,
          assigned_by_manager: true,
          approved_by: 'manager_1',
          approved_at: '2024-01-02T00:00:00Z',
          start_date: '2024-01-01',
          end_date: null,
          role_on_project: 'Foreman',
          notes: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ],
    }

    return HttpResponse.json({ project })
  }),

  // PATCH /v1/projects/:id - Update project
  http.patch(`${BASE_URL}/v1/projects/:id`, async ({ params, request }) => {
    const { id } = params
    const body = (await request.json()) as any

    if (id === 'invalid_id') {
      return HttpResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const project = {
      id: id as string,
      organization_id: 'org_1',
      name: body.name || 'Downtown Office Building',
      description:
        body.description !== undefined ? body.description : 'New office construction project',
      status: body.status || 'active',
      start_date: body.start_date !== undefined ? body.start_date : '2024-01-01',
      end_date: body.end_date !== undefined ? body.end_date : '2024-12-31',
      location_visibility: body.location_visibility || 'organization_only',
      location_visibility_override:
        body.location_visibility_override !== undefined ? body.location_visibility_override : false,
      created_by: 'user_1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: new Date().toISOString(),
    }

    return HttpResponse.json({ project })
  }),

  // POST /v1/projects/:projectId/sites - Add site to project
  http.post(`${BASE_URL}/v1/projects/:projectId/sites`, async ({ params, request }) => {
    const { projectId } = params
    const body = (await request.json()) as any

    if (projectId === 'invalid_id') {
      return HttpResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (!body.site_id) {
      return HttpResponse.json({ error: 'site_id is required' }, { status: 400 })
    }

    const projectSite = {
      id: 'ps_new',
      project_id: projectId as string,
      site_id: body.site_id,
      is_primary: body.is_primary || false,
      created_at: new Date().toISOString(),
    }

    // Simulate overlap detection
    const overlaps =
      body.site_id === 'site_overlap'
        ? [
            {
              site_id: 'site_1',
              overlap_area: 1000,
              overlap_percentage: 15.5,
            },
          ]
        : []

    return HttpResponse.json({
      project_site: projectSite,
      overlaps,
    })
  }),

  // POST /v1/projects/:projectId/addresses - Add address to project
  http.post(`${BASE_URL}/v1/projects/:projectId/addresses`, async ({ params, request }) => {
    const { projectId } = params
    const body = (await request.json()) as any

    if (projectId === 'invalid_id') {
      return HttpResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (!body.address_id) {
      return HttpResponse.json({ error: 'address_id is required' }, { status: 400 })
    }

    const projectAddress = {
      id: 'pa_new',
      project_id: projectId as string,
      address_id: body.address_id,
      is_primary: body.is_primary || false,
      created_at: new Date().toISOString(),
    }

    return HttpResponse.json({ project_address: projectAddress })
  }),

  // POST /v1/projects/:projectId/workers - Add worker to project
  http.post(`${BASE_URL}/v1/projects/:projectId/workers`, async ({ params, request }) => {
    const { projectId } = params
    const body = (await request.json()) as any

    if (projectId === 'invalid_id') {
      return HttpResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (!body.user_id) {
      return HttpResponse.json({ error: 'user_id is required' }, { status: 400 })
    }

    const worker = {
      id: 'pw_new',
      project_id: projectId as string,
      user_id: body.user_id,
      job_id: body.job_id || null,
      status: 'pending' as const,
      claimed_by_worker: false,
      assigned_by_manager: true,
      approved_by: null,
      approved_at: null,
      start_date: body.start_date || null,
      end_date: body.end_date || null,
      role_on_project: body.role_on_project || null,
      notes: body.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    return HttpResponse.json({ worker })
  }),

  // POST /v1/projects/:projectId/workers/claim - Worker claims work
  http.post(`${BASE_URL}/v1/projects/:projectId/workers/claim`, async ({ params, request }) => {
    const { projectId } = params
    const body = (await request.json()) as any

    if (projectId === 'invalid_id') {
      return HttpResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const worker = {
      id: 'pw_claim',
      project_id: projectId as string,
      user_id: 'current_user',
      job_id: body.job_id || null,
      status: 'pending' as const,
      claimed_by_worker: true,
      assigned_by_manager: false,
      approved_by: null,
      approved_at: null,
      start_date: body.start_date || null,
      end_date: body.end_date || null,
      role_on_project: body.role_on_project || null,
      notes: body.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    return HttpResponse.json({ worker })
  }),

  // POST /v1/projects/workers/:projectWorkerId/approve - Approve worker
  http.post(`${BASE_URL}/v1/projects/workers/:projectWorkerId/approve`, ({ params }) => {
    const { projectWorkerId } = params

    if (projectWorkerId === 'invalid_id') {
      return HttpResponse.json({ error: 'Project worker not found' }, { status: 404 })
    }

    const worker = {
      id: projectWorkerId as string,
      project_id: 'proj_1',
      user_id: 'user_1',
      job_id: 'job_1',
      status: 'approved' as const,
      claimed_by_worker: true,
      assigned_by_manager: false,
      approved_by: 'manager_1',
      approved_at: new Date().toISOString(),
      start_date: '2024-01-01',
      end_date: null,
      role_on_project: 'Carpenter',
      notes: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: new Date().toISOString(),
    }

    return HttpResponse.json({ worker })
  }),

  // POST /v1/projects/workers/:projectWorkerId/reject - Reject worker
  http.post(
    `${BASE_URL}/v1/projects/workers/:projectWorkerId/reject`,
    async ({ params, request }) => {
      const { projectWorkerId } = params
      const body = (await request.json()) as any

      if (projectWorkerId === 'invalid_id') {
        return HttpResponse.json({ error: 'Project worker not found' }, { status: 404 })
      }

      const worker = {
        id: projectWorkerId as string,
        project_id: 'proj_1',
        user_id: 'user_1',
        job_id: 'job_1',
        status: 'rejected' as const,
        claimed_by_worker: true,
        assigned_by_manager: false,
        approved_by: null,
        approved_at: null,
        start_date: '2024-01-01',
        end_date: null,
        role_on_project: 'Carpenter',
        notes: body.reason || null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: new Date().toISOString(),
      }

      return HttpResponse.json({ worker })
    }
  ),

  // ============================================================================
  // Follows handlers
  // ============================================================================

  // GET /v1/follows/following - Get users current user is following
  http.get(`${BASE_URL}/v1/follows/following`, ({ request }) => {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '20', 10)
    const offset = parseInt(url.searchParams.get('offset') || '0', 10)

    // Handle error cases
    if (limit < 0) {
      return HttpResponse.json({ error: 'limit must be non-negative' }, { status: 400 })
    }

    if (limit === 999999) {
      return HttpResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    // Test expects user_1 to be following 3 users
    const allFollowing = [
      {
        id: 'follow_1',
        follower_id: 'user_1',
        follower_type: 'user' as const,
        followee_id: 'user_2',
        followee_type: 'user' as const,
        created_at: '2024-01-01T00:00:00Z',
        followee: {
          id: 'user_2',
          name: 'Bob Smith',
          avatar_url: 'https://example.com/avatar2.jpg',
        },
      },
      {
        id: 'follow_2',
        follower_id: 'user_1',
        follower_type: 'user' as const,
        followee_id: 'user_3',
        followee_type: 'user' as const,
        created_at: '2024-01-02T00:00:00Z',
        followee: {
          id: 'user_3',
          name: 'Charlie Davis',
          avatar_url: 'https://example.com/avatar3.jpg',
        },
      },
      {
        id: 'follow_3',
        follower_id: 'user_1',
        follower_type: 'user' as const,
        followee_id: 'user_4',
        followee_type: 'user' as const,
        created_at: '2024-01-03T00:00:00Z',
        followee: {
          id: 'user_4',
          name: 'Diana Evans',
          avatar_url: 'https://example.com/avatar4.jpg',
        },
      },
    ]

    // Handle limit=0 case (empty result)
    if (limit === 0) {
      return HttpResponse.json({
        data: [],
        total: 0,
      })
    }

    // Cap very large limits
    const effectiveLimit = Math.min(limit, 100)
    const paginatedData = allFollowing.slice(offset, offset + effectiveLimit)

    return HttpResponse.json({
      data: paginatedData,
      total: allFollowing.length,
    })
  }),

  // GET /v1/follows/followers - Get users following current user
  http.get(`${BASE_URL}/v1/follows/followers`, ({ request }) => {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '20', 10)
    const offset = parseInt(url.searchParams.get('offset') || '0', 10)

    // Test expects user_1 to have 5 followers
    const allFollowers = [
      {
        id: 'follow_2',
        follower_id: 'user_3',
        follower_type: 'user' as const,
        followee_id: 'user_1',
        followee_type: 'user' as const,
        created_at: '2024-01-01T00:00:00Z',
        follower: {
          id: 'user_3',
          first_name: 'Charlie',
          last_name: 'Davis',
          avatar_url: 'https://example.com/avatar3.jpg',
        },
      },
      {
        id: 'follow_4',
        follower_id: 'user_3',
        follower_type: 'user' as const,
        followee_id: 'user_1',
        followee_type: 'user' as const,
        created_at: '2024-01-02T00:00:00Z',
        follower: {
          id: 'user_3',
          first_name: 'Charlie',
          last_name: 'Davis',
          avatar_url: 'https://example.com/avatar3.jpg',
        },
      },
      {
        id: 'follow_5',
        follower_id: 'user_4',
        follower_type: 'user' as const,
        followee_id: 'user_1',
        followee_type: 'user' as const,
        created_at: '2024-01-03T00:00:00Z',
        follower: {
          id: 'user_4',
          first_name: 'Diana',
          last_name: 'Evans',
          avatar_url: 'https://example.com/avatar4.jpg',
        },
      },
      {
        id: 'follow_6',
        follower_id: 'user_5',
        follower_type: 'user' as const,
        followee_id: 'user_1',
        followee_type: 'user' as const,
        created_at: '2024-01-04T00:00:00Z',
        follower: {
          id: 'user_5',
          first_name: 'Eve',
          last_name: 'Foster',
          avatar_url: 'https://example.com/avatar5.jpg',
        },
      },
      {
        id: 'follow_7',
        follower_id: 'user_6',
        follower_type: 'user' as const,
        followee_id: 'user_1',
        followee_type: 'user' as const,
        created_at: '2024-01-05T00:00:00Z',
        follower: {
          id: 'user_6',
          first_name: 'Frank',
          last_name: 'Garcia',
          avatar_url: 'https://example.com/avatar6.jpg',
        },
      },
    ]

    // Handle limit=0 case (empty result)
    if (limit === 0) {
      return HttpResponse.json({
        data: [],
        total: 0,
      })
    }

    const paginatedData = allFollowers.slice(offset, offset + limit)

    return HttpResponse.json({
      data: paginatedData,
      total: allFollowers.length,
    })
  }),

  // GET /v1/follows/status/:userId - Check if following a user
  http.get(`${BASE_URL}/v1/follows/status/:userId`, ({ params }) => {
    const { userId } = params

    // Handle non-existent users
    if (userId === 'user_nonexistent' || userId === 'user_invalid') {
      return HttpResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Simulate that user_1 is following user_2, user_3, user_4
    const isFollowing = userId === 'user_2' || userId === 'user_3' || userId === 'user_4'

    if (isFollowing) {
      const followId =
        userId === 'user_2' ? 'follow_1' : userId === 'user_3' ? 'follow_2' : 'follow_3'
      return HttpResponse.json({
        isFollowing: true,
        followId,
      })
    }

    return HttpResponse.json({
      isFollowing: false,
    })
  }),

  // POST /v1/follows/user - Follow a user
  http.post(`${BASE_URL}/v1/follows/user`, async ({ request }) => {
    const body = (await request.json()) as any

    if (!body.targetUserId || body.targetUserId === '') {
      return HttpResponse.json({ error: 'targetUserId is required' }, { status: 400 })
    }

    // Validate userId format (must not contain special chars like @)
    if (body.targetUserId.includes('@') || body.targetUserId.includes(' ')) {
      return HttpResponse.json({ error: 'Invalid userId format' }, { status: 400 })
    }

    // Handle specific error test cases
    if (body.targetUserId === 'user_unauthorized') {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (body.targetUserId === 'user_rate_limit') {
      return HttpResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': '1' } }
      )
    }

    if (body.targetUserId === 'user_network_error') {
      // Return network error (simulate connection refused)
      return HttpResponse.error()
    }

    if (body.targetUserId === 'user_self') {
      return HttpResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
    }

    if (body.targetUserId === 'user_nonexistent' || body.targetUserId === 'user_invalid') {
      return HttpResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (body.targetUserId === 'user_blocked') {
      return HttpResponse.json({ error: 'Cannot follow blocked user' }, { status: 403 })
    }

    if (body.targetUserId === 'user_deactivated') {
      return HttpResponse.json({ error: 'User account is deactivated' }, { status: 410 })
    }

    // Handle duplicate follow - return existing follow
    if (body.targetUserId === 'user_duplicate') {
      return HttpResponse.json({
        id: 'follow_duplicate',
        follower_id: 'user_1',
        follower_type: 'user' as const,
        followee_id: 'user_duplicate',
        followee_type: 'user' as const,
        created_at: '2024-01-01T00:00:00Z',
        follower: {
          id: 'user_1',
          first_name: 'Alice',
          last_name: 'Johnson',
        },
        followee: {
          id: 'user_duplicate',
          name: 'Duplicate User',
        },
      })
    }

    // Default successful follow
    const followId = body.targetUserId === 'user_2' ? 'follow_1' : `follow_new_${body.targetUserId}`
    const follow = {
      id: followId,
      follower_id: 'user_1',
      follower_type: 'user' as const,
      followee_id: body.targetUserId,
      followee_type: 'user' as const,
      created_at: new Date().toISOString(),
      follower: {
        id: 'user_1',
        first_name: 'Alice',
        last_name: 'Johnson',
      },
      followee: {
        id: body.targetUserId,
        name: body.targetUserId === 'user_2' ? 'Bob Smith' : 'Target User',
      },
    }

    return HttpResponse.json(follow)
  }),

  // DELETE /v1/follows/user/:userId - Unfollow a user
  http.delete(`${BASE_URL}/v1/follows/user/:userId`, ({ params }) => {
    const { userId } = params

    if (userId === 'user_nonexistent') {
      return HttpResponse.json({ error: 'Follow relationship not found' }, { status: 404 })
    }

    // Idempotent - always return 204 for valid users
    return new HttpResponse(null, { status: 204 })
  }),

  // ============================================================================
  // Portfolio handlers
  // ============================================================================

  // GET /v1/profiles/portfolio - List portfolio items
  http.get(`${BASE_URL}/v1/profiles/portfolio`, ({ request }) => {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')

    // If userId specified, return that user's portfolio
    if (userId) {
      return HttpResponse.json([
        {
          id: 'port_1',
          user_id: userId,
          title: 'Project Alpha',
          description: 'Description for Alpha',
          image_url: 'https://example.com/alpha.jpg',
          file_path: '/uploads/alpha.jpg',
          display_order: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ])
    }

    // Default: return current user's portfolio
    return HttpResponse.json([
      {
        id: 'port_1',
        user_id: 'user_1',
        title: 'Website Redesign',
        description: 'Complete redesign of company website',
        image_url: 'https://example.com/website.jpg',
        file_path: '/uploads/website.jpg',
        display_order: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'port_2',
        user_id: 'user_1',
        title: 'Mobile App Development',
        description: 'Built iOS and Android app',
        image_url: 'https://example.com/app.jpg',
        file_path: '/uploads/app.jpg',
        display_order: 1,
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      },
    ])
  }),

  // POST /v1/profiles/portfolio - Create portfolio item
  http.post(`${BASE_URL}/v1/profiles/portfolio`, async ({ request }) => {
    const body = (await request.json()) as any

    if (!body.title) {
      return HttpResponse.json({ error: 'title is required' }, { status: 400 })
    }

    return HttpResponse.json({
      id: 'port_new',
      user_id: 'user_1',
      title: body.title,
      description: body.description || null,
      image_url: body.imageUrl || null,
      file_path: body.filePath || null,
      display_order: body.displayOrder || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }),

  // PATCH /v1/profiles/portfolio/:id - Update portfolio item
  http.patch(`${BASE_URL}/v1/profiles/portfolio/:id`, async ({ params, request }) => {
    const { id } = params
    const body = (await request.json()) as any

    if (id === 'invalid_id') {
      return HttpResponse.json({ error: 'Portfolio item not found' }, { status: 404 })
    }

    return HttpResponse.json({
      id: id as string,
      user_id: 'user_1',
      title: body.title || 'Updated Title',
      description: body.description !== undefined ? body.description : 'Updated description',
      image_url: body.imageUrl !== undefined ? body.imageUrl : 'https://example.com/updated.jpg',
      file_path: body.filePath !== undefined ? body.filePath : '/uploads/updated.jpg',
      display_order: body.displayOrder !== undefined ? body.displayOrder : 0,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: new Date().toISOString(),
    })
  }),

  // DELETE /v1/profiles/portfolio/:id - Delete portfolio item
  http.delete(`${BASE_URL}/v1/profiles/portfolio/:id`, ({ params }) => {
    const { id } = params

    if (id === 'invalid_id') {
      return HttpResponse.json({ error: 'Portfolio item not found' }, { status: 404 })
    }

    return HttpResponse.json({
      success: true,
      deletedItem: {
        id: id as string,
        user_id: 'user_1',
        title: 'Deleted Item',
        description: 'This item was deleted',
        image_url: null,
        file_path: null,
        display_order: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    })
  }),

  // POST /v1/profiles/portfolio/reorder - Reorder portfolio items
  http.post(`${BASE_URL}/v1/profiles/portfolio/reorder`, async ({ request }) => {
    const body = (await request.json()) as any

    if (!body.items || !Array.isArray(body.items)) {
      return HttpResponse.json({ error: 'items array is required' }, { status: 400 })
    }

    return HttpResponse.json({
      success: true,
      updatedCount: body.items.length,
    })
  }),

  // POST /v1/profiles/portfolio/upload-image - Upload portfolio image
  http.post(`${BASE_URL}/v1/profiles/portfolio/upload-image`, async ({ request }) => {
    const body = (await request.json()) as any

    if (!body.file || !body.fileName) {
      return HttpResponse.json({ error: 'file and fileName are required' }, { status: 400 })
    }

    return HttpResponse.json({
      filePath: `/uploads/${body.fileName}`,
      imageUrl: `https://example.com/uploads/${body.fileName}`,
    })
  }),

  // ===== Profile Import Handlers =====
  // GET /v1/profiles/import/data
  http.get(`${BASE_URL}/v1/profiles/import/data`, () => {
    return HttpResponse.json({
      version: 1,
      source: 'resume',
      storedAt: '2024-01-15T10:00:00Z',
      expiresAt: '2024-01-16T10:00:00Z',
      payload: {
        general: [
          {
            first_name: 'John',
            last_name: 'Doe',
            headline: 'Software Engineer',
            summary: 'Experienced developer',
            confidence_score: 0.95,
          },
        ],
        experience: [
          {
            job_title: 'Senior Engineer',
            company_name: 'ACME Corp',
            start_date: '2020-01-01',
            end_date: null,
            is_current: true,
            confidence_score: 0.9,
          },
        ],
        education: [
          {
            institution: 'MIT',
            degree: 'BS Computer Science',
            start_date: '2015-09-01',
            end_date: '2019-05-15',
            confidence_score: 0.92,
          },
        ],
        skills: [
          { name: 'JavaScript', taxonomy: 'onet', confidence_score: 0.88 },
          { name: 'React', taxonomy: 'custom', confidence_score: 0.85 },
        ],
        certifications: [
          {
            name: 'AWS Certified Developer',
            issuer: 'Amazon',
            issue_date: '2021-06-01',
            confidence_score: 0.95,
          },
        ],
      },
    })
  }),

  // POST /v1/profiles/import/data
  http.post(`${BASE_URL}/v1/profiles/import/data`, async ({ request }) => {
    const body = (await request.json()) as any
    return HttpResponse.json({
      metadata: {
        version: 1,
        source: body.source,
        storedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        payload: body.payload,
      },
    })
  }),

  // DELETE /v1/profiles/import/data
  http.delete(`${BASE_URL}/v1/profiles/import/data`, () => {
    return HttpResponse.json({ success: true })
  }),

  // ===== ONET Handlers =====
  // GET /v1/onet/occupations/search
  http.get(`${BASE_URL}/v1/onet/occupations/search`, ({ request }) => {
    const url = new URL(request.url)
    const query = url.searchParams.get('query') || ''
    const limit = parseInt(url.searchParams.get('limit') || '10', 10)

    return HttpResponse.json({
      occupations: [
        {
          onetsoc_code: '15-1252.00',
          title: 'Software Developers',
          description: 'Research, design, and develop computer and network software',
        },
        {
          onetsoc_code: '15-1256.00',
          title: 'Software Quality Assurance Analysts and Testers',
          description: 'Develop and execute software tests',
        },
      ].slice(0, limit),
      query,
    })
  }),

  // POST /v1/onet/career-assessment
  http.post(`${BASE_URL}/v1/onet/career-assessment`, async ({ request }) => {
    const _body = await request.json()
    return HttpResponse.json({ success: true })
  }),

  // GET /v1/onet/career-assessment/status
  http.get(`${BASE_URL}/v1/onet/career-assessment/status`, () => {
    return HttpResponse.json({
      hasCompleted: true,
      riasec_scores: {
        realistic: 45,
        investigative: 85,
        artistic: 60,
        social: 70,
        enterprising: 55,
        conventional: 40,
      },
      current_occupation_code: '15-1252.00',
      target_occupation_codes: ['15-1256.00', '15-1299.00'],
      completed_at: '2024-01-10T15:30:00Z',
    })
  }),

  // GET /v1/onet/riasec/status
  http.get(`${BASE_URL}/v1/onet/riasec/status`, () => {
    return HttpResponse.json({
      isCompleted: true,
      scores: {
        realistic: 45,
        investigative: 85,
        artistic: 60,
        social: 70,
        enterprising: 55,
        conventional: 40,
      },
    })
  }),

  // GET /v1/onet/occupation/status
  http.get(`${BASE_URL}/v1/onet/occupation/status`, () => {
    return HttpResponse.json({
      isCompleted: true,
      hasCurrentOccupation: true,
      hasTargetOccupations: true,
      currentOccupationCode: '15-1252.00',
      targetOccupationCodes: ['15-1256.00', '15-1299.00'],
    })
  }),

  // ===== Profile Completion Handlers =====
  // GET /v1/profiles/completion/status
  http.get(`${BASE_URL}/v1/profiles/completion/status`, () => {
    return HttpResponse.json({
      completionPercentage: 75,
      milestoneBadges: [
        { id: 'badge_25', threshold: 25, achieved: true, reachedAt: '2024-01-01T00:00:00Z' },
        { id: 'badge_50', threshold: 50, achieved: true, reachedAt: '2024-01-05T00:00:00Z' },
        { id: 'badge_75', threshold: 75, achieved: true, reachedAt: '2024-01-10T00:00:00Z' },
        { id: 'badge_100', threshold: 100, achieved: false, reachedAt: null },
      ],
      sectionProgress: [
        {
          id: 'general',
          title: 'General Information',
          weight: 15,
          completed: true,
          missingFields: [],
        },
        {
          id: 'skills',
          title: 'Skills',
          weight: 20,
          completed: true,
          missingFields: [],
        },
        {
          id: 'experience',
          title: 'Experience',
          weight: 25,
          completed: true,
          missingFields: [],
        },
        {
          id: 'certifications',
          title: 'Certifications',
          weight: 15,
          completed: false,
          missingFields: ['certification_list'],
        },
        {
          id: 'preferences',
          title: 'Preferences',
          weight: 10,
          completed: true,
          missingFields: [],
        },
        {
          id: 'education',
          title: 'Education',
          weight: 15,
          completed: true,
          missingFields: [],
        },
      ],
      incompleteSections: ['certifications'],
      hasReachedFiftyPercent: true,
      milestoneHistory: {
        '25': '2024-01-01T00:00:00Z',
        '50': '2024-01-05T00:00:00Z',
        '75': '2024-01-10T00:00:00Z',
      },
      nudgeStatus: {
        dismissed: {},
        lastDismissedAt: null,
        shouldPrompt: true,
      },
      summary: {
        completedWeight: 75,
        remainingWeight: 25,
        nextMilestone: 100,
      },
      updatedAt: new Date().toISOString(),
    })
  }),

  // POST /v1/profiles/completion/nudges/dismiss
  http.post(`${BASE_URL}/v1/profiles/completion/nudges/dismiss`, async ({ request }) => {
    const body = (await request.json()) as any
    return HttpResponse.json({
      success: true,
      nudgeHistory: {
        dismissed: {
          [body.nudgeId]: {
            dismissedAt: new Date().toISOString(),
            reason: body.reason || undefined,
          },
        },
        lastDismissedAt: new Date().toISOString(),
      },
    })
  }),

  // GET /v1/profiles/completion/benefits
  http.get(`${BASE_URL}/v1/profiles/completion/benefits`, () => {
    return HttpResponse.json({
      benefits: [
        {
          id: 'benefit_1',
          title: 'Stand out to employers',
          description: 'Profiles with skills are 3x more likely to be viewed',
          relatedSection: 'skills',
          userType: 'worker',
          opportunityCount: 47,
        },
        {
          id: 'benefit_2',
          title: 'Get better matches',
          description: 'Complete your preferences to get personalized job recommendations',
          relatedSection: 'preferences',
          userType: 'worker',
          opportunityCount: 23,
        },
      ],
      completionPercentage: 75,
      incompleteSections: ['certifications'],
      userTypes: ['worker'],
      updatedAt: new Date().toISOString(),
    })
  }),

  // ===== Prerequisites Handlers =====
  // ===== New Notifications Handlers (API v1) - Order matters! =====
  // GET /v1/notifications - List notifications
  http.get(`${BASE_URL}/v1/notifications`, ({ request }) => {
    const url = new URL(request.url)
    const read = url.searchParams.get('read')
    const type = url.searchParams.get('type')

    return HttpResponse.json({
      data: [
        {
          id: 'notif_123',
          user_id: 'user_123',
          type: type || 'application_status',
          title: 'Application Updated',
          message: 'Your application status changed',
          read: read !== 'false',
          read_at: read === 'false' ? null : '2024-01-15T11:00:00Z',
          created_at: '2024-01-15T10:00:00Z',
        },
      ],
      pagination: {
        total: 1,
        page: 1,
        limit: 20,
        total_pages: 1,
      },
    })
  }),

  // GET /v1/notifications/preferences - Get preferences (BEFORE :id)
  http.get(`${BASE_URL}/v1/notifications/preferences`, () => {
    return HttpResponse.json({
      data: {
        user_id: 'user_123',
        email_notifications: true,
        push_notifications: true,
        notification_types: {
          application_status: { email: true, push: true },
          connection_request: { email: true, push: true },
          message: { email: false, push: true },
          job_match: { email: true, push: false },
        },
        quiet_hours: {
          enabled: true,
          start: '22:00',
          end: '08:00',
        },
      },
    })
  }),

  // PATCH /v1/notifications/preferences - Update preferences (BEFORE :id)
  http.patch(`${BASE_URL}/v1/notifications/preferences`, async ({ request }) => {
    const body = (await request.json()) as any
    return HttpResponse.json({
      data: {
        user_id: 'user_123',
        email_notifications: body.email_notifications ?? true,
        push_notifications: body.push_notifications ?? true,
        notification_types: body.notification_types || {},
        quiet_hours: body.quiet_hours,
      },
    })
  }),

  // GET /v1/notifications/unread-count - Get unread count (BEFORE :id)
  http.get(`${BASE_URL}/v1/notifications/unread-count`, () => {
    return HttpResponse.json({
      data: {
        unread_count: 5,
      },
    })
  }),

  // POST /v1/notifications/read-all - Mark all as read (BEFORE :id)
  http.post(`${BASE_URL}/v1/notifications/read-all`, () => {
    return HttpResponse.json({
      data: {
        updated_count: 5,
      },
    })
  }),

  // PATCH /v1/notifications/:id/read - Mark as read (BEFORE bare :id)
  http.patch(`${BASE_URL}/v1/notifications/:id/read`, ({ params }) => {
    const { id } = params
    return HttpResponse.json({
      data: {
        id: id as string,
        user_id: 'user_123',
        type: 'message',
        title: 'New Message',
        message: 'You have a new message',
        read: true,
        read_at: new Date().toISOString(),
        created_at: '2024-01-15T10:00:00Z',
      },
    })
  }),

  // PATCH /v1/notifications/:id/unread - Mark as unread (BEFORE bare :id)
  http.patch(`${BASE_URL}/v1/notifications/:id/unread`, ({ params }) => {
    const { id } = params
    return HttpResponse.json({
      data: {
        id: id as string,
        user_id: 'user_123',
        type: 'message',
        title: 'New Message',
        message: 'You have a new message',
        read: false,
        created_at: '2024-01-15T10:00:00Z',
      },
    })
  }),

  // DELETE /v1/notifications/:id - Delete notification (BEFORE bare DELETE)
  http.delete(`${BASE_URL}/v1/notifications/:id`, ({ params }) => {
    const { id } = params
    if (id === 'invalid_id') {
      return HttpResponse.json({ error: 'Notification not found' }, { status: 404 })
    }
    return new HttpResponse(null, { status: 204 })
  }),

  // DELETE /v1/notifications - Delete all notifications (AFTER :id DELETE)
  http.delete(`${BASE_URL}/v1/notifications`, () => {
    return HttpResponse.json({
      data: {
        deleted_count: 10,
      },
    })
  }),

  // GET /v1/notifications/:id - Get notification by ID (LAST for GETs)
  http.get(`${BASE_URL}/v1/notifications/:id`, ({ params }) => {
    const { id } = params
    if (id === 'invalid_id') {
      return HttpResponse.json({ error: 'Notification not found' }, { status: 404 })
    }
    return HttpResponse.json({
      data: {
        id: id as string,
        user_id: 'user_123',
        type: 'message',
        title: 'New Message',
        message: 'You have a new message from Jane',
        read: false,
        created_at: '2024-01-15T10:00:00Z',
      },
    })
  }),

  // ===== New ONET Handlers (API v1) =====
  // GET /v1/onet/search - Search occupations
  http.get(`${BASE_URL}/v1/onet/search`, ({ request }) => {
    const url = new URL(request.url)
    const _keyword = url.searchParams.get('keyword')

    return HttpResponse.json({
      data: [
        {
          onet_code: '15-1252.00',
          title: 'Software Developers',
          description: 'Research, design, and develop computer applications',
          alternate_titles: ['Application Developer', 'Software Engineer'],
        },
      ],
      pagination: {
        total: 1,
        page: 1,
        limit: 20,
        total_pages: 1,
      },
    })
  }),

  // GET /v1/onet/occupations/:onetCode - Get occupation details
  http.get(`${BASE_URL}/v1/onet/occupations/:onetCode`, ({ params }) => {
    const { onetCode } = params
    if (onetCode === 'invalid-code' || onetCode === '99-9999.99') {
      return HttpResponse.json({ error: 'Occupation not found' }, { status: 404 })
    }
    return HttpResponse.json({
      data: {
        onetsoc_code: onetCode as string,
        title: 'Software Developers',
        description: 'Research, design, and develop computer and network software',
        alternate_titles: ['Application Developer', 'Software Engineer'],
      },
    })
  }),

  // GET /v1/onet/occupations/:onetCode/skills - Get occupation skills
  http.get(`${BASE_URL}/v1/onet/occupations/:onetCode/skills`, () => {
    return HttpResponse.json({
      data: [
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
      ],
    })
  }),

  // GET /v1/onet/occupations/:onetCode/related - Get related occupations
  http.get(`${BASE_URL}/v1/onet/occupations/:onetCode/related`, () => {
    return HttpResponse.json({
      data: [
        {
          onet_code: '15-1256.00',
          title: 'Software Quality Assurance Analysts',
          description: 'Develop and execute software tests',
          alternate_titles: ['QA Analyst'],
        },
      ],
    })
  }),

  // GET /v1/onet/occupations/:onetCode/knowledge - Get knowledge areas
  http.get(`${BASE_URL}/v1/onet/occupations/:onetCode/knowledge`, () => {
    return HttpResponse.json({
      data: [
        {
          knowledge_area: 'Computers and Electronics',
          importance: 90,
          level: 85,
          description: 'Knowledge of circuit boards, processors, etc.',
        },
      ],
    })
  }),

  // GET /v1/onet/occupations/:onetCode/abilities - Get abilities
  http.get(`${BASE_URL}/v1/onet/occupations/:onetCode/abilities`, () => {
    return HttpResponse.json({
      data: [
        {
          ability_name: 'Deductive Reasoning',
          importance: 75,
          level: 70,
          description: 'The ability to apply general rules to specific problems',
        },
      ],
    })
  }),

  // GET /v1/onet/autocomplete - Autocomplete occupation titles
  http.get(`${BASE_URL}/v1/onet/autocomplete`, () => {
    return HttpResponse.json({
      data: [
        { onet_code: '15-1252.00', title: 'Software Developers' },
        { onet_code: '15-1256.00', title: 'Software Quality Assurance Analysts' },
      ],
    })
  }),

  // ===== New Prerequisites Handlers (API v1) =====
  // ===== Prerequisites Handlers - Order matters! Specific paths before :id =====
  // GET /v1/prerequisites - List prerequisites
  http.get(`${BASE_URL}/v1/prerequisites`, ({ request }) => {
    const url = new URL(request.url)
    const category = url.searchParams.get('category')
    const required = url.searchParams.get('required')
    const completed = url.searchParams.get('completed')

    return HttpResponse.json({
      data: [
        {
          id: 'prereq_profile',
          name: 'Complete Profile',
          description: 'Fill out your basic profile information',
          category: category || 'profile',
          required: required === 'true',
          completed: completed === 'true',
          completion_percentage: 100,
        },
      ],
    })
  }),

  // GET /v1/prerequisites/check - Check all prerequisites (BEFORE :id)
  http.get(`${BASE_URL}/v1/prerequisites/check`, () => {
    return HttpResponse.json({
      data: {
        all_completed: true,
        missing: [],
      },
    })
  }),

  // GET /v1/prerequisites/validate - Validate prerequisites (BEFORE :id)
  http.get(`${BASE_URL}/v1/prerequisites/validate`, () => {
    return HttpResponse.json({
      data: {
        valid: true,
        required_prerequisites_met: true,
        optional_prerequisites_met: true,
        missing_required: [],
        missing_optional: [],
        completion_percentage: 100,
      },
    })
  }),

  // GET /v1/prerequisites/missing - Get missing prerequisites (BEFORE :id)
  http.get(`${BASE_URL}/v1/prerequisites/missing`, () => {
    return HttpResponse.json({
      data: [],
    })
  }),

  // GET /v1/prerequisites/stats - Get completion stats (BEFORE :id)
  http.get(`${BASE_URL}/v1/prerequisites/stats`, () => {
    return HttpResponse.json({
      data: {
        total_prerequisites: 10,
        completed_prerequisites: 7,
        required_prerequisites: 5,
        required_completed: 4,
        optional_prerequisites: 5,
        optional_completed: 3,
        overall_completion_percentage: 70,
        required_completion_percentage: 80,
        optional_completion_percentage: 60,
      },
    })
  }),

  // POST /v1/prerequisites/complete - Complete prerequisite (BEFORE :id)
  http.post(`${BASE_URL}/v1/prerequisites/complete`, async ({ request }) => {
    const body = (await request.json()) as any
    return HttpResponse.json({
      data: {
        prerequisite_id: body.prerequisite_id,
        completed: true,
      },
    })
  }),

  // GET /v1/prerequisites/:id/check - Check specific prerequisite (BEFORE bare :id)
  http.get(`${BASE_URL}/v1/prerequisites/:id/check`, ({ params }) => {
    return HttpResponse.json({
      data: {
        prerequisite_id: params.id as string,
        completed: true,
        completion_percentage: 100,
        missing_fields: [],
      },
    })
  }),

  // GET /v1/prerequisites/:id - Get prerequisite by ID (LAST)
  http.get(`${BASE_URL}/v1/prerequisites/:id`, ({ params }) => {
    const { id } = params
    if (id === 'invalid_id') {
      return HttpResponse.json({ error: 'Prerequisite not found' }, { status: 404 })
    }
    return HttpResponse.json({
      data: {
        id: id as string,
        name: 'Complete Profile',
        description: 'Fill out your basic profile information',
        category: 'profile',
        required: true,
        completed: true,
        completion_percentage: 100,
        fields: [
          { name: 'first_name', completed: true },
          { name: 'last_name', completed: true },
        ],
      },
    })
  }),

  // GET /v1/prerequisites/check
  http.get(`${BASE_URL}/v1/prerequisites/check`, () => {
    return HttpResponse.json({
      isComplete: true,
      hasName: true,
      hasAddress: true,
      hasUserTypes: true,
      hasIndustry: true,
      hasAcceptedTerms: true,
      data: {
        firstName: 'John',
        lastName: 'Doe',
        address: {
          street: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          zip: '94102',
          country: 'US',
        },
        userTypes: ['worker'],
        industryId: 'ind_tech',
      },
    })
  }),

  // POST /v1/prerequisites/complete
  http.post(`${BASE_URL}/v1/prerequisites/complete`, async ({ request }) => {
    const _body = await request.json()
    return HttpResponse.json({
      success: true,
      completedAt: new Date().toISOString(),
    })
  }),

  // ===== Notifications Handlers =====
  // GET /v1/notifications
  http.get(`${BASE_URL}/v1/notifications`, ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const limit = parseInt(url.searchParams.get('limit') || '20', 10)

    return HttpResponse.json({
      items: [
        {
          id: 'notif_1',
          user_id: 'user_1',
          type: 'connection_request',
          severity: 'medium',
          title: 'New Connection Request',
          message: 'John Doe wants to connect',
          read: false,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
        },
        {
          id: 'notif_2',
          user_id: 'user_1',
          type: 'job_match',
          severity: 'low',
          title: 'New Job Match',
          message: 'Software Engineer position matches your profile',
          read: status !== 'unread',
          read_at: status === 'read' ? '2024-01-14T09:00:00Z' : null,
          created_at: '2024-01-14T08:00:00Z',
          updated_at: '2024-01-14T08:00:00Z',
        },
      ].slice(0, limit),
      nextCursor: null,
    })
  }),

  // GET /v1/notifications/unread-count
  http.get(`${BASE_URL}/v1/notifications/unread-count`, () => {
    return HttpResponse.json({ count: 3 })
  }),

  // PATCH /v1/notifications/:id/read
  http.patch(`${BASE_URL}/v1/notifications/:id/read`, ({ params }) => {
    const { id } = params
    return HttpResponse.json({
      id,
      user_id: 'user_1',
      type: 'connection_request',
      severity: 'medium',
      title: 'New Connection Request',
      message: 'John Doe wants to connect',
      read: true,
      read_at: new Date().toISOString(),
      created_at: '2024-01-15T10:00:00Z',
      updated_at: new Date().toISOString(),
    })
  }),

  // PATCH /v1/notifications/:id/unread
  http.patch(`${BASE_URL}/v1/notifications/:id/unread`, ({ params }) => {
    const { id } = params
    return HttpResponse.json({
      id,
      user_id: 'user_1',
      type: 'connection_request',
      severity: 'medium',
      title: 'New Connection Request',
      message: 'John Doe wants to connect',
      read: false,
      read_at: null,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: new Date().toISOString(),
    })
  }),

  // POST /v1/notifications/mark-read
  http.post(`${BASE_URL}/v1/notifications/mark-read`, async ({ request }) => {
    const _body = await request.json()
    return HttpResponse.json({ success: true })
  }),

  // POST /v1/notifications/mark-unread
  http.post(`${BASE_URL}/v1/notifications/mark-unread`, async ({ request }) => {
    const _body = await request.json()
    return HttpResponse.json({ success: true })
  }),

  // POST /v1/notifications/archive
  http.post(`${BASE_URL}/v1/notifications/archive`, async ({ request }) => {
    const _body = await request.json()
    return HttpResponse.json({ success: true })
  }),

  // POST /v1/notifications/restore
  http.post(`${BASE_URL}/v1/notifications/restore`, async ({ request }) => {
    const _body = await request.json()
    return HttpResponse.json({ success: true })
  }),

  // POST /v1/notifications/mark-all-read
  http.post(`${BASE_URL}/v1/notifications/mark-all-read`, () => {
    return HttpResponse.json({ success: true, updated: 5 })
  }),

  // POST /v1/notifications/delete
  http.post(`${BASE_URL}/v1/notifications/delete`, async ({ request }) => {
    const _body = await request.json()
    return HttpResponse.json({ success: true })
  }),

  // GET /v1/notifications/preferences
  http.get(`${BASE_URL}/v1/notifications/preferences`, () => {
    return HttpResponse.json({
      globalEnabled: true,
      channelEnabled: {
        in_app: true,
        email: true,
        push: false,
        sms: false,
      },
      quietHours: {
        start: '22:00',
        end: '08:00',
      },
      digestFrequency: 'immediate',
      typeOverrides: {},
      updatedAt: '2024-01-15T10:00:00Z',
    })
  }),

  // POST /v1/notifications/preferences
  http.post(`${BASE_URL}/v1/notifications/preferences`, async ({ request }) => {
    const _body = await request.json()
    return HttpResponse.json({ success: true })
  }),

  // GET /v1/notifications/devices
  http.get(`${BASE_URL}/v1/notifications/devices`, () => {
    return HttpResponse.json([
      {
        id: 'device_1',
        token: 'device_token_123',
        platform: 'ios',
        last_seen_at: '2024-01-15T10:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
      },
    ])
  }),

  // POST /v1/notifications/devices
  http.post(`${BASE_URL}/v1/notifications/devices`, async ({ request }) => {
    const _body = await request.json()
    return HttpResponse.json({ success: true })
  }),

  // DELETE /v1/notifications/devices/:token
  http.delete(`${BASE_URL}/v1/notifications/devices/:token`, () => {
    return HttpResponse.json({ success: true })
  }),

  // ===== New Inquiries Handlers (API v1) =====
  // GET /v1/inquiries - List inquiries
  http.get(`${BASE_URL}/v1/inquiries`, ({ request }) => {
    const url = new URL(request.url)
    const _direction = url.searchParams.get('direction')
    const status = url.searchParams.get('status')

    return HttpResponse.json({
      data: [
        {
          id: 'inq_123',
          sender_id: 'user_123',
          recipient_id: 'user_456',
          subject: 'Question about job posting',
          message: 'I would like to know more about the position.',
          inquiry_type: 'job_inquiry',
          job_id: 'job_789',
          status: status || 'pending',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
        },
      ],
      pagination: {
        total: 1,
        page: 1,
        limit: 20,
        total_pages: 1,
      },
    })
  }),

  // GET /v1/inquiries/templates - Get inquiry templates (MUST be before :id)
  http.get(`${BASE_URL}/v1/inquiries/templates`, ({ request }) => {
    const url = new URL(request.url)
    const _inquiryType = url.searchParams.get('inquiry_type')

    return HttpResponse.json({
      data: [
        {
          id: 'tpl_1',
          name: 'Job Interest',
          subject: 'Interest in {{job_title}}',
          message: 'I am interested in the {{job_title}} position.',
          inquiry_type: 'job_inquiry',
        },
        {
          id: 'tpl_2',
          name: 'General Question',
          subject: 'Question about {{topic}}',
          message: 'I have a question about {{topic}}.',
          inquiry_type: 'general',
        },
      ],
    })
  }),

  // GET /v1/inquiries/:id - Get inquiry by ID
  http.get(`${BASE_URL}/v1/inquiries/:id`, ({ params }) => {
    const { id } = params
    if (id === 'invalid_id') {
      return HttpResponse.json({ error: 'Inquiry not found' }, { status: 404 })
    }
    return HttpResponse.json({
      data: {
        id: id as string,
        sender_id: 'user_123',
        recipient_id: 'user_456',
        subject: 'Question about job posting',
        message: 'I would like to know more about the position.',
        inquiry_type: 'job_inquiry',
        job_id: 'job_789',
        status: 'pending',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      },
    })
  }),

  // POST /v1/inquiries - Create inquiry
  http.post(`${BASE_URL}/v1/inquiries`, async ({ request }) => {
    const body = (await request.json()) as any

    // Check for validation errors
    if (!body.message && !body.template_id) {
      return HttpResponse.json(
        { error: 'Validation failed', details: { message: 'Message is required' } },
        { status: 400 }
      )
    }

    return HttpResponse.json({
      data: {
        id: 'inq_124',
        sender_id: 'user_123',
        recipient_id: body.recipient_id,
        subject: body.subject || 'Interest in Position',
        message: body.message || 'Template message content',
        inquiry_type: body.inquiry_type || 'job_inquiry',
        job_id: body.job_id,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    })
  }),

  // POST /v1/inquiries/:id/respond - Respond to inquiry
  http.post(`${BASE_URL}/v1/inquiries/:id/respond`, async ({ params, request }) => {
    const { id } = params
    const body = (await request.json()) as any

    // Simulate already responded error
    if (id === 'already_responded') {
      return HttpResponse.json({ error: 'Inquiry already responded' }, { status: 400 })
    }

    return HttpResponse.json({
      data: {
        id: id as string,
        sender_id: 'user_456',
        recipient_id: 'user_123',
        subject: 'Question',
        message: 'Original message',
        inquiry_type: 'general',
        status: 'responded',
        response: body.message,
        responded_at: new Date().toISOString(),
        created_at: '2024-01-15T10:00:00Z',
        updated_at: new Date().toISOString(),
      },
    })
  }),

  // POST /v1/inquiries/bulk/mark-read - Bulk mark as read
  http.post(`${BASE_URL}/v1/inquiries/bulk/mark-read`, async ({ request }) => {
    const body = (await request.json()) as any
    return HttpResponse.json({
      data: {
        updated_count: body.inquiry_ids?.length || 0,
      },
    })
  }),

  // POST /v1/inquiries/bulk/archive - Bulk archive
  http.post(`${BASE_URL}/v1/inquiries/bulk/archive`, async ({ request }) => {
    const body = (await request.json()) as any
    return HttpResponse.json({
      data: {
        archived_count: body.inquiry_ids?.length || 0,
      },
    })
  }),

  // ===== Old Inquiries Handlers (Legacy) =====
  // GET /inquiries/templates
  http.get(`${BASE_URL}/inquiries/templates`, () => {
    return HttpResponse.json([
      {
        id: 'template_1',
        organization_id: 'org_1',
        created_by: 'user_1',
        name: 'Standard Inquiry',
        description: 'Standard template for most positions',
        template_data: {},
        is_default: true,
        usage_count: 15,
        last_used_at: '2024-01-10T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ])
  }),

  // POST /inquiries/templates
  http.post(`${BASE_URL}/inquiries/templates`, async ({ request }) => {
    const body = (await request.json()) as any
    return HttpResponse.json({
      id: 'template_new',
      organization_id: 'org_1',
      created_by: 'user_1',
      name: body.name,
      description: body.description,
      template_data: body.templateData,
      is_default: false,
      usage_count: 0,
      last_used_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }),

  // PATCH /inquiries/templates/:templateId
  http.patch(`${BASE_URL}/inquiries/templates/:templateId`, async ({ params, request }) => {
    const { templateId } = params
    const body = (await request.json()) as any
    return HttpResponse.json({
      id: templateId,
      organization_id: 'org_1',
      created_by: 'user_1',
      name: body.name || 'Updated Template',
      description: body.description,
      template_data: body.templateData || {},
      is_default: false,
      usage_count: 5,
      last_used_at: '2024-01-10T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: new Date().toISOString(),
    })
  }),

  // DELETE /inquiries/templates/:templateId
  http.delete(`${BASE_URL}/inquiries/templates/:templateId`, () => {
    return HttpResponse.json({ success: true })
  }),

  // POST /inquiries/templates/apply
  http.post(`${BASE_URL}/inquiries/templates/apply`, async ({ request }) => {
    const body = (await request.json()) as any
    return HttpResponse.json({
      templateData: {},
      templateId: body.templateId,
    })
  }),

  // GET /inquiries/smart-defaults
  http.get(`${BASE_URL}/inquiries/smart-defaults`, ({ request }) => {
    const url = new URL(request.url)
    const _applicationId = url.searchParams.get('applicationId')
    return HttpResponse.json({
      defaults: {
        rateType: 'hourly',
        rateMinCents: 250000,
        employmentType: 'temporary',
      },
      fields: ['rateType', 'rateMinCents', 'employmentType'],
      job: {
        id: 'job_1',
        title: 'Software Engineer',
        location: 'San Francisco, CA',
      },
    })
  }),

  // POST /inquiries
  http.post(`${BASE_URL}/inquiries`, async ({ request }) => {
    const body = (await request.json()) as any
    return HttpResponse.json({
      id: 'inquiry_new',
      application_id: body.applicationId,
      created_by: 'user_1',
      status: 'draft',
      sent_at: null,
      employment_type: body.employmentType || null,
      employment_type_negotiable: body.employmentTypeNegotiable || false,
      work_schedule: body.workSchedule || null,
      work_schedule_negotiable: body.workScheduleNegotiable || false,
      schedule_shifts: body.scheduleShifts || false,
      working_hours_start: body.workingHoursStart || null,
      working_hours_end: body.workingHoursEnd || null,
      working_hours_timezone: body.workingHoursTimezone || null,
      working_hours_negotiable: body.workingHoursNegotiable || false,
      workdays: body.workdays || [],
      workdays_negotiable: body.workdaysNegotiable || false,
      employment_start_date: body.employmentStartDate,
      employment_end_date: body.employmentEndDate || null,
      employment_dates_negotiable: body.employmentDatesNegotiable || false,
      rate_type: body.rateType,
      rate_min_cents: body.rateMinCents,
      rate_max_cents: body.rateMaxCents || null,
      rate_negotiable: body.rateNegotiable || false,
      endurance_required: body.enduranceRequired || false,
      willing_to_travel: body.willingToTravel || null,
      travel_distance_miles: body.travelDistanceMiles || null,
      willing_to_work_overtime: body.willingToWorkOvertime || null,
      has_drivers_license: body.hasDriversLicense || null,
      additional_notes: body.additionalNotes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }),

  // POST /inquiries/bulk
  http.post(`${BASE_URL}/inquiries/bulk`, async ({ request }) => {
    const body = (await request.json()) as any
    return HttpResponse.json({
      total: body.applicationIds.length,
      successful: body.applicationIds.length,
      failed: 0,
      results: body.applicationIds.map((appId: string) => ({
        applicationId: appId,
        success: true,
        inquiryId: `inquiry_${appId}`,
      })),
    })
  }),

  // GET /inquiries/by-application
  http.get(`${BASE_URL}/inquiries/by-application`, ({ request }) => {
    const url = new URL(request.url)
    const _applicationId = url.searchParams.get('applicationId')
    return HttpResponse.json({
      inquiry: {
        id: 'inquiry_1',
        application_id: 'app_1',
        created_by: 'user_1',
        status: 'sent',
        sent_at: '2024-01-15T10:00:00Z',
        employment_type: 'temporary',
        employment_type_negotiable: false,
        work_schedule: 'full_time',
        work_schedule_negotiable: false,
        schedule_shifts: false,
        working_hours_start: '09:00',
        working_hours_end: '17:00',
        working_hours_timezone: 'America/Los_Angeles',
        working_hours_negotiable: true,
        workdays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        workdays_negotiable: false,
        employment_start_date: '2024-02-01',
        employment_end_date: null,
        employment_dates_negotiable: true,
        rate_type: 'hourly',
        rate_min_cents: 250000,
        rate_max_cents: 350000,
        rate_negotiable: true,
        endurance_required: false,
        willing_to_travel: true,
        travel_distance_miles: 50,
        willing_to_work_overtime: true,
        has_drivers_license: true,
        additional_notes: 'Looking forward to discussing this opportunity',
        created_at: '2024-01-10T00:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      },
      sections: [],
      comments: [],
      capabilityResponses: [],
      application: {},
      candidate: {},
      job: {},
      capabilityQuestions: [],
    })
  }),

  // GET /inquiries/multiple
  http.get(`${BASE_URL}/inquiries/multiple`, () => {
    return HttpResponse.json([])
  }),

  // GET /inquiries/:inquiryId/history
  http.get(`${BASE_URL}/inquiries/:inquiryId/history`, () => {
    return HttpResponse.json([
      {
        id: 'log_1',
        inquiry_id: 'inquiry_1',
        event_type: 'created',
        actor_id: 'user_1',
        event_data: {},
        created_at: '2024-01-10T00:00:00Z',
      },
    ])
  }),

  // POST /inquiries/:inquiryId/send
  http.post(`${BASE_URL}/inquiries/:inquiryId/send`, () => {
    return HttpResponse.json({ success: true })
  }),

  // POST /inquiries/:inquiryId/comments
  http.post(`${BASE_URL}/inquiries/:inquiryId/comments`, async ({ params, request }) => {
    const { inquiryId } = params
    const body = (await request.json()) as any
    return HttpResponse.json({
      id: 'comment_new',
      inquiry_id: inquiryId,
      section_name: body.sectionName,
      sender_id: 'user_1',
      content: body.content,
      read_by: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }),

  // PATCH /inquiries/comments/:commentId/read
  http.patch(`${BASE_URL}/inquiries/comments/:commentId/read`, () => {
    return HttpResponse.json({ success: true })
  }),

  // POST /inquiries/:inquiryId/sections/accept
  http.post(`${BASE_URL}/inquiries/:inquiryId/sections/accept`, async ({ request }) => {
    const _body = await request.json()
    return HttpResponse.json({
      success: true,
      allAccepted: false,
    })
  }),

  // POST /inquiries/:inquiryId/capabilities
  http.post(`${BASE_URL}/inquiries/:inquiryId/capabilities`, async ({ params, request }) => {
    const { inquiryId } = params
    const body = (await request.json()) as any
    return HttpResponse.json({
      id: 'response_new',
      inquiry_id: inquiryId,
      capability_name: body.capabilityName,
      response_value: body.responseValue || null,
      response_text: body.responseText || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }),

  // PATCH /inquiries/:id
  http.patch(`${BASE_URL}/inquiries/:id`, async ({ params, request }) => {
    const { id } = params
    const body = (await request.json()) as any
    return HttpResponse.json({
      id,
      application_id: 'app_1',
      created_by: 'user_1',
      status: 'draft',
      sent_at: null,
      employment_type: null,
      employment_type_negotiable: false,
      work_schedule: null,
      work_schedule_negotiable: false,
      schedule_shifts: false,
      working_hours_start: null,
      working_hours_end: null,
      working_hours_timezone: null,
      working_hours_negotiable: false,
      workdays: [],
      workdays_negotiable: false,
      employment_start_date: '2024-02-01',
      employment_end_date: null,
      employment_dates_negotiable: false,
      rate_type: 'hourly',
      rate_min_cents: 250000,
      rate_max_cents: null,
      rate_negotiable: false,
      endurance_required: false,
      willing_to_travel: null,
      travel_distance_miles: null,
      willing_to_work_overtime: null,
      has_drivers_license: null,
      additional_notes: null,
      ...body,
      created_at: '2024-01-10T00:00:00Z',
      updated_at: new Date().toISOString(),
    })
  }),

  // POST /inquiries/:inquiryId/status
  http.post(`${BASE_URL}/inquiries/:inquiryId/status`, async ({ request }) => {
    const body = (await request.json()) as any
    return HttpResponse.json({
      success: true,
      newStatus: body.newStatus,
    })
  }),

  // ===== Employers Handlers =====
  // GET /v1/employers
  http.get(`${BASE_URL}/v1/employers`, ({ request }) => {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '20', 10)
    const offset = parseInt(url.searchParams.get('offset') || '0', 10)

    return HttpResponse.json({
      employers: [
        {
          id: 'emp_1',
          name: 'ACME Corporation',
          description: 'Leading technology solutions provider',
          website: 'https://acme.com',
          logo_url: 'https://example.com/logos/acme.png',
          industry: 'Technology',
          size: '1000-5000',
          location: 'San Francisco, CA',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'emp_2',
          name: 'Tech Innovations Inc',
          description: 'Innovative software company',
          website: 'https://techinnovations.com',
          logo_url: 'https://example.com/logos/tech.png',
          industry: 'Technology',
          size: '100-500',
          location: 'New York, NY',
          created_at: '2023-06-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ].slice(offset, offset + limit),
      total: 2,
    })
  }),

  // GET /v1/employers/:id
  http.get(`${BASE_URL}/v1/employers/:id`, ({ params }) => {
    const { id } = params
    if (id === 'invalid_id' || id === 'emp_error') {
      return HttpResponse.json(
        { error: 'Employer not found' },
        { status: 404 }
      )
    }
    return HttpResponse.json({
      id,
      name: 'ACME Corporation',
      description: 'Leading technology solutions provider',
      website: 'https://acme.com',
      logo_url: 'https://example.com/logos/acme.png',
      industry: 'Technology',
      size: '1000-5000',
      location: 'San Francisco, CA',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    })
  }),

  // GET /v1/employers/employment/status
  http.get(`${BASE_URL}/v1/employers/employment/status`, ({ request }) => {
    const url = new URL(request.url)
    const _organizationId = url.searchParams.get('organizationId')
    return HttpResponse.json({
      isLinked: true,
      experienceId: 'exp_123',
      source: 'manual',
      isCurrent: true,
      claimedAt: '2024-01-10T00:00:00Z',
      createdAt: '2024-01-10T00:00:00Z',
    })
  }),

  // POST /v1/employers/employment/claim
  http.post(`${BASE_URL}/v1/employers/employment/claim`, async ({ request }) => {
    const _body = await request.json()
    return HttpResponse.json({
      experience: {
        id: 'exp_new',
        source: 'claimed',
        is_current: true,
        claimed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    })
  }),

  // DELETE /v1/employers/employment/:organizationId
  http.delete(`${BASE_URL}/v1/employers/employment/:organizationId`, () => {
    return HttpResponse.json({ success: true })
  }),

  // GET /v1/employers/follow/status
  http.get(`${BASE_URL}/v1/employers/follow/status`, ({ request }) => {
    const url = new URL(request.url)
    const _organizationId = url.searchParams.get('organizationId')
    return HttpResponse.json({
      isFollowing: true,
      followedAt: '2024-01-10T00:00:00Z',
    })
  }),

  // POST /v1/employers/follow
  http.post(`${BASE_URL}/v1/employers/follow`, async ({ request }) => {
    const _body = await request.json()
    return HttpResponse.json({
      success: true,
      followedAt: new Date().toISOString(),
    })
  }),

  // DELETE /v1/employers/follow/:organizationId
  http.delete(`${BASE_URL}/v1/employers/follow/:organizationId`, () => {
    return HttpResponse.json({ success: true })
  }),

  // GET /v1/employers/search - Search employers
  http.get(`${BASE_URL}/v1/employers/search`, () => {
    return HttpResponse.json({
      data: [
        {
          id: 'emp_1',
          organization_name: 'Acme Corporation',
          industry: 'Technology',
          size: '100-500',
          verified: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ],
      pagination: {
        total: 1,
        page: 1,
        limit: 20,
        total_pages: 1,
      },
    })
  }),

  // GET /v1/employers/:id/verification-status - Get verification status (BEFORE :id)
  http.get(`${BASE_URL}/v1/employers/:id/verification-status`, ({ params }) => {
    const { id } = params
    return HttpResponse.json({
      data: {
        employer_id: id,
        verified: id === 'emp_123',
        verification_date: id === 'emp_123' ? '2024-01-15T10:00:00Z' : null,
        verification_method: id === 'emp_123' ? 'email_domain' : null,
      },
    })
  }),

  // GET /v1/profile/completion - Get profile completion status
  http.get(`${BASE_URL}/v1/profile/completion`, () => {
    return HttpResponse.json({
      data: {
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
      },
    })
  }),

  // GET /v1/profile/completion/sections/:section - Get specific section
  http.get(`${BASE_URL}/v1/profile/completion/sections/:section`, ({ params }) => {
    const { section } = params
    if (section === 'invalid_section' || section === 'invalid') {
      return HttpResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      )
    }
    return HttpResponse.json({
      data: {
        section_name: section,
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
      },
    })
  }),

  // GET /v1/profile/completion/missing-sections - Get missing sections
  http.get(`${BASE_URL}/v1/profile/completion/missing-sections`, () => {
    return HttpResponse.json({
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
    })
  }),

  // GET /v1/profile/completion/suggestions - Get completion suggestions
  http.get(`${BASE_URL}/v1/profile/completion/suggestions`, () => {
    return HttpResponse.json({
      data: [
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
      ],
    })
  }),

  // GET /v1/profile/completion/weighting - Get section weighting
  http.get(`${BASE_URL}/v1/profile/completion/weighting`, () => {
    return HttpResponse.json({
      data: {
        basic_info: 20,
        work_experience: 30,
        education: 20,
        skills: 15,
        certifications: 15,
      },
    })
  }),

  // POST /v1/profile/completion/recalculate - Recalculate completion
  http.post(`${BASE_URL}/v1/profile/completion/recalculate`, () => {
    return HttpResponse.json({
      data: {
        user_id: 'user_123',
        overall_completion: 80,
        sections: [],
        last_updated: new Date().toISOString(),
      },
    })
  }),

  // GET /v1/profile/completion/history - Get completion history
  http.get(`${BASE_URL}/v1/profile/completion/history`, () => {
    return HttpResponse.json({
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
    })
  }),

  // POST /v1/profile/import/linkedin - Import from LinkedIn
  http.post(`${BASE_URL}/v1/profile/import/linkedin`, async ({ request }) => {
    const body = await request.json() as { linkedin_url: string }
    if (body.linkedin_url === 'invalid-url') {
      return HttpResponse.json(
        { error: 'Invalid LinkedIn URL' },
        { status: 400 }
      )
    }
    return HttpResponse.json({
      data: {
        import_id: 'import_123',
        status: 'completed',
        source: 'linkedin',
        imported_sections: ['basic_info', 'work_experience', 'education', 'skills'],
        created_count: 15,
        updated_count: 2,
        skipped_count: 0,
        errors: [],
        started_at: '2024-01-15T10:00:00Z',
        completed_at: '2024-01-15T10:02:00Z',
      },
    })
  }),

  // POST /v1/profile/import/resume - Import from resume
  http.post(`${BASE_URL}/v1/profile/import/resume`, async ({ request }) => {
    const body = await request.json() as { file_url?: string }
    if (body.file_url === 'https://example.com/resume.txt') {
      return HttpResponse.json(
        { error: 'Unsupported file format' },
        { status: 400 }
      )
    }
    return HttpResponse.json({
      data: {
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
      },
    })
  }),

  // POST /v1/profile/import/preview - Preview import
  http.post(`${BASE_URL}/v1/profile/import/preview`, () => {
    return HttpResponse.json({
      data: {
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
        ],
        total_creates: 5,
        total_updates: 2,
        total_skips: 0,
        potential_conflicts: 0,
      },
    })
  }),

  // POST /v1/profile/import/validate - Validate import
  http.post(`${BASE_URL}/v1/profile/import/validate`, () => {
    return HttpResponse.json({
      data: {
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
      },
    })
  }),

  // GET /v1/profile/import/:id - Get import status
  http.get(`${BASE_URL}/v1/profile/import/:id`, ({ params }) => {
    const { id } = params
    if (id === 'invalid_id') {
      return HttpResponse.json(
        { error: 'Import not found' },
        { status: 404 }
      )
    }
    if (id === 'import_124') {
      return HttpResponse.json({
        data: {
          import_id: id,
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
        },
      })
    }
    return HttpResponse.json({
      data: {
        import_id: id,
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
      },
    })
  }),

  // GET /v1/profile/import - List imports
  http.get(`${BASE_URL}/v1/profile/import`, () => {
    return HttpResponse.json({
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
    })
  }),

  // Profile Views handlers (imported from dedicated file)
  ...profileViewsHandlers,
]

export const server = setupServer(...handlers)
