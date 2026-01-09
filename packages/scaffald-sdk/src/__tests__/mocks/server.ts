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
          title: 'Senior Software Engineer',
          description: 'We are looking for a senior software engineer...',
          status: 'published',
          location: {
            city: 'San Francisco',
            state: 'CA',
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
      total: 1,
      limit: 20,
      offset: 0,
    })
  }),

  // GET /v1/jobs/:id - Get job
  http.get(`${BASE_URL}/v1/jobs/:id`, ({ params }) => {
    const { id } = params
    return HttpResponse.json({
      id,
      title: 'Senior Software Engineer',
      description: 'We are looking for a senior software engineer...',
      status: 'published',
      location: {
        city: 'San Francisco',
        state: 'CA',
        country: 'US',
      },
      salary_min: 150000,
      salary_max: 200000,
      employment_type: 'full_time',
      organization_id: 'org_1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      published_at: '2024-01-01T00:00:00Z',
    })
  }),

  // POST /v1/jobs - Create job
  http.post(`${BASE_URL}/v1/jobs`, async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json(
      {
        id: 'job_new',
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
      title: 'Senior Software Engineer',
      description: 'We are looking for a senior software engineer...',
      status: 'published',
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
      ],
      total: 1,
      limit: 10,
      offset: 0,
    })
  }),
]

export const server = setupServer(...handlers)
