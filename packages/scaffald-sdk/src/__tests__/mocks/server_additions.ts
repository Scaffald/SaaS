import { http, HttpResponse } from 'msw'

const BASE_URL = 'https://api.scaffald.com'

// ===== Profile Import Handlers =====
export const profileImportHandlers = [
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
]

// ===== ONET Handlers =====
export const onetHandlers = [
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

  // GET /v1/onet/occupations/:onetCode
  http.get(`${BASE_URL}/v1/onet/occupations/:onetCode`, ({ params }) => {
    const { onetCode } = params
    return HttpResponse.json({
      onetsoc_code: onetCode,
      title: 'Software Developers',
      description: 'Research, design, and develop computer and network software',
      tasks: ['Design software systems', 'Write code', 'Test applications'],
      knowledge: ['Computer Science', 'Mathematics'],
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
]

// ===== Profile Completion Handlers =====
export const profileCompletionHandlers = [
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
]

// ===== Prerequisites Handlers =====
export const prerequisitesHandlers = [
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
]

// ===== Notifications Handlers =====
export const notificationsHandlers = [
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
    return HttpResponse.json({ data: { unread_count: 3 } })
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
      data: {
        user_id: 'user_123',
        email_notifications: true,
        push_notifications: false,
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
]

// ===== Inquiries Handlers =====
export const inquiriesHandlers = [
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
]

// ===== Employers Handlers =====
export const employersHandlers = [
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
]

export const allNewHandlers = [
  ...profileImportHandlers,
  ...onetHandlers,
  ...profileCompletionHandlers,
  ...prerequisitesHandlers,
  ...notificationsHandlers,
  ...inquiriesHandlers,
  ...employersHandlers,
]
