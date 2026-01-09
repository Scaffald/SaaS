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
    const body = await request.json()
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
    const body = await request.json()
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
    const body = await request.json()
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
    const body = await request.json()
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
]

export const server = setupServer(...handlers)
