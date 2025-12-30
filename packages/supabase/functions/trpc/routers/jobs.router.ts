import { TRPCError } from '@trpc/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import {
  applicationCreateSchema,
  applicationWithdrawSchema,
} from '../../_shared/application-schemas.ts';
import { jobSoftSkillRequirementSchema } from '../../_shared/profile-schemas.ts';
import { transformJobSkills } from '../../_shared/skill-helpers.ts';
import { protectedProcedure, t } from '../middleware.ts';

type SoftSkillRequirement = z.infer<typeof jobSoftSkillRequirementSchema>

interface SoftSkillMetadata {
  name: string | null
  category: string | null
}

export interface SoftSkillMatchDetail {
  skillId: string
  skillName: string | null
  category: string | null
  requiredImportance: number
  userRating: number | null
  meetsRequirement: boolean | null
  contribution: number
}

const softSkillRequirementArraySchema = z.array(jobSoftSkillRequirementSchema)

const parseRequiredSoftSkills = (value: unknown): SoftSkillRequirement[] => {
  if (!value) {
    return []
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return parseRequiredSoftSkills(parsed)
    } catch {
      return []
    }
  }

  const parsed = softSkillRequirementArraySchema.safeParse(value)
  if (parsed.success) {
    return parsed.data
  }

  return []
}

const fetchSoftSkillMetadata = async (
  supabase: SupabaseClient,
  skillIds: string[],
): Promise<Map<string, SoftSkillMetadata>> => {
  if (skillIds.length === 0) {
    return new Map()
  }

  const uniqueIds = Array.from(new Set(skillIds))

  const { data, error } = await supabase
    .schema('core')
    .from('soft_skills')
    .select('id, name, category')
    .in('id', uniqueIds)

  if (error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to load soft skills metadata: ${error.message}`,
      cause: error,
    })
  }

  const map = new Map<string, SoftSkillMetadata>()
  for (const row of data ?? []) {
    if (!row.id) continue
    map.set(row.id, {
      name: row.name ?? null,
      category: row.category ?? null,
    })
  }

  return map
}

const loadUserSoftSkillsForMatching = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<{ ratings: Map<string, number>; hasAssessment: boolean }> => {
  const { data: latestVersionRow, error: versionError } = await supabase
    .schema('core')
    .from('user_skills')
    .select('version')
    .eq('user_id', userId)
    .eq('skill_taxonomy', 'soft_skills')
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (versionError && versionError.code !== 'PGRST116') {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to load latest soft skill version: ${versionError.message}`,
      cause: versionError,
    })
  }

  const version = latestVersionRow?.version ?? null

  if (!version) {
    return { ratings: new Map(), hasAssessment: false }
  }

  const { data, error } = await supabase
    .schema('core')
    .from('user_skills')
    .select('soft_skill_id, proficiency_level')
    .eq('user_id', userId)
    .eq('skill_taxonomy', 'soft_skills')
    .eq('version', version)

  if (error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to load soft skill ratings: ${error.message}`,
      cause: error,
    })
  }

  const ratings = new Map<string, number>()

  for (const row of data ?? []) {
    if (!row.soft_skill_id) continue
    if (typeof row.proficiency_level === 'number') {
      ratings.set(row.soft_skill_id, row.proficiency_level)
    }
  }

  return { ratings, hasAssessment: ratings.size > 0 }
}

const computeSoftSkillMatch = (
  requirements: SoftSkillRequirement[],
  ratings: Map<string, number>,
  metadata: Map<string, SoftSkillMetadata>,
): { score: number | null; details: SoftSkillMatchDetail[] } => {
  if (requirements.length === 0) {
    return { score: null, details: [] }
  }

  const details = requirements.map<SoftSkillMatchDetail>((req) => {
    const info = metadata.get(req.skill_id)
    const userRating = ratings.get(req.skill_id)
    const cappedRating =
      typeof userRating === 'number' ? Math.min(userRating, req.importance) : 0
    const contributionRatio = req.importance > 0 ? cappedRating / req.importance : 0

    return {
      skillId: req.skill_id,
      skillName: info?.name ?? null,
      category: info?.category ?? null,
      requiredImportance: req.importance,
      userRating: userRating ?? null,
      meetsRequirement:
        typeof userRating === 'number' ? userRating >= req.importance : null,
      contribution: Number((contributionRatio * 100).toFixed(2)),
    }
  })

  if (ratings.size === 0) {
    return { score: null, details }
  }

  const averageRatio =
    details.reduce((sum, detail) => sum + detail.contribution / 100, 0) / requirements.length

  return {
    score: Math.round(averageRatio * 100),
    details,
  }
}

const calculateSoftSkillsMatchInput = z.object({
  jobId: z.string().uuid(),
  userId: z.string().uuid().optional(),
})

const jobsWithSoftSkillsMatchInput = z.object({
  userId: z.string().uuid().optional(),
  minMatchScore: z.number().int().min(0).max(100).optional(),
  sortBy: z.enum(['match_score']).optional(),
  limit: z.number().int().min(1).max(100).default(25),
  offset: z.number().int().min(0).default(0),
})

/**
 * Jobs router - handles job-related operations
 */
export const jobsRouter = t.router({
  /**
   * Get external jobs
   * Returns list of active external jobs with industry information
   */
  getExternalJobs: t.procedure.query(async ({ ctx }) => {
    const { supabase } = ctx

    const { data, error } = await supabase
      .schema('core')
      .from('external_jobs')
      .select(`
        id,
        title,
        company_name,
        company_logo,
        job_location,
        job_type,
        job_category,
        description,
        compensation_min,
        compensation_max,
        compensation_currency,
        posted_date,
        application_url,
        external_url,
        featured,
        external_job_industries(
          industry:industries(
            id,
            name
          ),
          confidence_score
        )
      `)
      .eq('is_active', true)
      .order('posted_date', { ascending: false })
      .limit(50)

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to fetch jobs: ${error.message}`,
      })
    }

    // Transform data to match UI expectations
    const jobs = (data || []).map((job: { id: string; title?: string | null; company_name?: string | null; company_logo?: string | null; job_location?: string | null; job_type?: string | null; job_category?: string | null; description?: string | null; compensation_min?: number | null; compensation_max?: number | null; [key: string]: unknown }) => ({
      id: job.id,
      title: job.title,
      company_name: job.company_name,
      company_logo: job.company_logo,
      job_location: job.job_location,
      job_type: job.job_type,
      job_category: job.job_category,
      description: job.description,
      compensation_min: job.compensation_min,
      compensation_max: job.compensation_max,
      compensation_currency: job.compensation_currency,
      posted_date: job.posted_date,
      application_url: job.application_url,
      external_url: job.external_url,
      featured: job.featured,
      industries: Array.isArray(job.external_job_industries)
        ? job.external_job_industries.map(
            (eji: { industry?: { name?: string } | null; confidence_score?: number | null }) => ({
              industry_name: eji.industry?.name || '',
              confidence_score: eji.confidence_score || 0,
            })
          )
        : [],
    }))

    return { jobs }
  }),

  /**
   * Get available filter options from actual job data
   * Returns unique industries, job types, and locations
   */
  getFilterOptions: t.procedure.query(async ({ ctx }) => {
    const { supabase } = ctx

    const { data, error } = await supabase
      .schema('core')
      .from('external_jobs')
      .select(`
        job_type,
        job_location,
        external_job_industries(
          industry:industries(
            name
          )
        )
      `)
      .eq('is_active', true)

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to fetch filter options: ${error.message}`,
      })
    }

    // Extract unique values
    const jobTypes = new Set<string>()
    const locations = new Set<string>()
    const industries = new Set<string>()

    for (const job of data || []) {
      if (job.job_type) jobTypes.add(job.job_type)
      if (job.job_location) locations.add(job.job_location)

      if (Array.isArray(job.external_job_industries)) {
        for (const eji of job.external_job_industries) {
          const industry = Array.isArray(eji.industry) ? eji.industry[0] : eji.industry
          if (industry?.name) {
            industries.add(industry.name)
          }
        }
      }
    }

    return {
      jobTypes: Array.from(jobTypes).sort(),
      locations: Array.from(locations).sort(),
      industries: Array.from(industries).sort(),
    }
  }),

  /**
   * Get published internal jobs
   * Returns list of open jobs from organizations with full details
   */
  getPublishedJobs: t.procedure
    .input(
      z.object({
        search: z.string().optional(),
        location: z.string().optional(),
        employment_type: z.string().optional(),
        remote_option: z.string().optional(),
        pay_min_cents: z.number().optional(),
        pay_max_cents: z.number().optional(),
        certification_ids: z.array(z.string().uuid()).optional(),
        skill_ids: z.array(z.string().uuid()).optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const { supabase } = ctx

      let query = supabase
        .schema('core')
        .from('jobs')
        .select(
          `
          id,
          title,
          description,
          employment_type,
          remote_option,
          location,
          pay_range_min_cents,
          pay_range_max_cents,
          pay_range_type,
          posted_at,
          created_at,
          organization:organizations!jobs_organization_id_fkey(
            id,
            name,
            slug
          ),
          job_certifications(
            certification:certifications(
              id,
              name,
              slug
            )
          ),
          job_skills(
            skill_taxonomy,
            csi_skill_id,
            onet_occupation_id
          )
        `,
          { count: 'exact' }
        )
        .eq('status', 'open')
        .order('posted_at', { ascending: false })

      // Apply filters
      if (input.search) {
        query = query.or(`title.ilike.%${input.search}%,description.ilike.%${input.search}%`)
      }

      if (input.location) {
        query = query.ilike('location', `%${input.location}%`)
      }

      if (input.employment_type) {
        query = query.eq('employment_type', input.employment_type)
      }

      if (input.remote_option) {
        query = query.eq('remote_option', input.remote_option)
      }

      if (input.pay_min_cents) {
        query = query.gte('pay_range_min_cents', input.pay_min_cents)
      }

      if (input.pay_max_cents) {
        query = query.lte('pay_range_max_cents', input.pay_max_cents)
      }

      // Apply pagination
      query = query.range(input.offset, input.offset + input.limit - 1)

      const { data, error, count } = await query

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch jobs: ${error.message}`,
        })
      }

      // Transform data
      const jobs = (data || []).map((job: { id: string; title?: string | null; description?: string | null; employment_type?: string | null; remote_option?: string | null; location?: string | null; pay_range_min_cents?: number | null; pay_range_max_cents?: number | null; pay_range_type?: string | null; posted_at?: string | null; created_at: string; organization?: unknown; job_certifications?: unknown; [key: string]: unknown }) => ({
        id: job.id,
        title: job.title,
        description: job.description,
        employment_type: job.employment_type,
        remote_option: job.remote_option,
        location: job.location,
        pay_range_min_cents: job.pay_range_min_cents,
        pay_range_max_cents: job.pay_range_max_cents,
        pay_range_type: job.pay_range_type,
        posted_at: job.posted_at,
        created_at: job.created_at,
        organization: job.organization,
        certifications: Array.isArray(job.job_certifications)
          ? job.job_certifications
              .map(
                (jc: { certification?: { id?: string; name?: string; slug?: string } | null }) =>
                  jc.certification
              )
              .filter(Boolean)
          // biome-ignore lint/suspicious/noExplicitAny: Complex type inference from Supabase query
          : [] as any,
        // biome-ignore lint/suspicious/noExplicitAny: Ensure array type for job_skills
        skills: transformJobSkills(Array.isArray(job.job_skills) ? job.job_skills : []),
      }))

      return { jobs, total: count || 0 }
    }),

  calculateSoftSkillsMatch: protectedProcedure
    .input(calculateSoftSkillsMatchInput)
    .query(async ({ ctx, input }) => {
      const { supabase, user } = ctx
      const targetUserId = input.userId ?? user.id

      const { ratings, hasAssessment } = await loadUserSoftSkillsForMatching(supabase, targetUserId)

      const { data: job, error } = await supabase
        .schema('core')
        .from('jobs')
        .select(
          `
            id,
            title,
            slug,
            organization:organizations!jobs_organization_id_fkey(id, name, slug),
            required_soft_skills
          `,
        )
        .eq('id', input.jobId)
        .maybeSingle()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to load job: ${error.message}`,
          cause: error,
        })
      }

      if (!job) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Job not found',
        })
      }

      const requirements = parseRequiredSoftSkills(job.required_soft_skills)

      if (requirements.length === 0) {
        return {
          jobId: job.id,
          jobTitle: job.title,
          organization: job.organization,
          score: null,
          needsSelfAssessment: !hasAssessment,
          totalRequirements: 0,
          details: [] as SoftSkillMatchDetail[],
        }
      }

      const metadata = await fetchSoftSkillMetadata(
        supabase,
        requirements.map((req) => req.skill_id),
      )

      const match = computeSoftSkillMatch(requirements, ratings, metadata)

      return {
        jobId: job.id,
        jobTitle: job.title,
        organization: job.organization,
        score: match.score,
        needsSelfAssessment: !hasAssessment,
        totalRequirements: requirements.length,
        details: match.details,
      }
    }),

  getJobsWithSoftSkillsMatch: protectedProcedure
    .input(jobsWithSoftSkillsMatchInput)
    .query(async ({ ctx, input }) => {
      const { supabase, user } = ctx
      const targetUserId = input.userId ?? user.id

      const { ratings, hasAssessment } = await loadUserSoftSkillsForMatching(supabase, targetUserId)

      if (!hasAssessment) {
        return {
          total: 0,
          needsSelfAssessment: true,
          jobs: [] as Array<{
            jobId: string
            title: string
            slug: string | null
            organization: unknown
            matchScore: number | null
            totalRequirements: number
            details: SoftSkillMatchDetail[]
          }>,
        }
      }

      const { data, error } = await supabase
        .schema('core')
        .from('jobs')
        .select(
          `
            id,
            title,
            slug,
            created_at,
            organization:organizations!jobs_organization_id_fkey(id, name, slug),
            required_soft_skills
          `,
        )
        .eq('status', 'open')
        .order('created_at', { ascending: false })

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to load jobs: ${error.message}`,
          cause: error,
        })
      }

      const jobsWithRequirements = (data || []).map((job: { id: string; title?: string | null; slug?: string | null; organization?: unknown; required_soft_skills?: unknown; [key: string]: unknown }) => {
        const requirements = parseRequiredSoftSkills(job.required_soft_skills)
        return { job, requirements }
      })

      const skillIds: string[] = []
      for (const entry of jobsWithRequirements) {
        for (const req of entry.requirements) {
          skillIds.push(req.skill_id)
        }
      }

      const metadata = await fetchSoftSkillMetadata(supabase, skillIds)

      const enriched = jobsWithRequirements
        .filter((entry: { job: { id: string; title?: string | null; slug?: string | null; organization?: unknown; [key: string]: unknown }; requirements: SoftSkillRequirement[] }) => entry.requirements.length > 0)
        .map((entry: { job: { id: string; title?: string | null; slug?: string | null; organization?: unknown; [key: string]: unknown }; requirements: SoftSkillRequirement[] }) => {
          const match = computeSoftSkillMatch(entry.requirements, ratings, metadata)
          return {
            jobId: entry.job.id,
            title: entry.job.title,
            slug: entry.job.slug ?? null,
            organization: entry.job.organization,
            matchScore: match.score,
            totalRequirements: entry.requirements.length,
            details: match.details,
          }
        })
        .filter((entry: { matchScore: number | null; [key: string]: unknown }) => entry.matchScore !== null)

      const minScore = typeof input.minMatchScore === 'number' ? input.minMatchScore : null
      const filtered = minScore !== null ? enriched.filter((entry: { matchScore: number | null; [key: string]: unknown }) => (entry.matchScore ?? 0) >= minScore) : enriched

      if (input.sortBy === 'match_score') {
        filtered.sort((a: { matchScore: number | null; [key: string]: unknown }, b: { matchScore: number | null; [key: string]: unknown }) => (b.matchScore ?? 0) - (a.matchScore ?? 0))
      }

      const total = filtered.length
      const paginated = filtered.slice(input.offset, input.offset + input.limit)

      return {
        total,
        needsSelfAssessment: false,
        jobs: paginated,
      }
    }),

  /**
   * Get job details by ID
   * Returns full job details including certifications and skills
   */
  getJobDetails: t.procedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { supabase, user } = ctx

      const { data, error } = await supabase
        .schema('core')
        .from('jobs')
        .select(
          `
          *,
          organization:organizations!jobs_organization_id_fkey(
            id,
            name,
            slug
          ),
          job_certifications(
            is_required,
            certification:certifications(
              id,
              name,
              slug,
              description,
              issuing_organization
            )
          ),
          job_skills(
            skill_taxonomy,
            csi_skill_id,
            onet_occupation_id
          )
        `
        )
        .eq('id', input.id)
        .eq('status', 'open')
        .single()

      if (error) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Job not found: ${error.message}`,
        })
      }

      // Check if user has already applied
      let hasApplied = false
      if (user) {
        const { data: application } = await supabase
          .schema('core')
          .from('applications')
          .select('id')
          .eq('job_id', input.id)
          .eq('user_id', user.id)
          .single()

        hasApplied = !!application
      }

      return {
        job: {
          ...data,
          certifications: Array.isArray(data.job_certifications)
            ? data.job_certifications.map(
                (jc: {
                  is_required?: boolean
                  certification?: {
                    id?: string
                    name?: string
                    slug?: string
                    description?: string
                    issuing_organization?: string
                  } | null
                }) => ({
                  ...jc.certification,
                  is_required: jc.is_required,
                })
              )
            : [],
          skills: transformJobSkills(data.job_skills || []),
        },
        hasApplied,
      }
    }),

  /**
   * Create a job application
   * Authenticated users can apply to jobs
   */
  createApplication: protectedProcedure
    .input(applicationCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Must be logged in to apply',
        })
      }

      // Check if job exists and is open
      const { data: job, error: jobError } = await supabase
        .schema('core')
        .from('jobs')
        .select('id, status, title')
        .eq('id', input.job_id)
        .single()

      if (jobError || !job) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Job not found',
        })
      }

      if (job.status !== 'open') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This job is no longer accepting applications',
        })
      }

      // Check if user has already applied
      const { data: existingApp } = await supabase
        .schema('core')
        .from('applications')
        .select('id')
        .eq('job_id', input.job_id)
        .eq('user_id', user.id)
        .single()

      if (existingApp) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You have already applied to this job',
        })
      }

      // Create application
      const { data: application, error: appError } = await supabase
        .schema('core')
        .from('applications')
        .insert({
          job_id: input.job_id,
          user_id: user.id,
          cover_letter: input.cover_letter,
          resume_path: input.resume_path,
          status: 'pending',
        })
        .select()
        .single()

      if (appError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to create application: ${appError.message}`,
        })
      }

      return { application }
    }),

  /**
   * Get user's applications
   * Returns list of jobs the user has applied to
   */
  getMyApplications: protectedProcedure
    .input(
      z.object({
        status: z
          .enum([
            'pending',
            'reviewing',
            'inquired',
            'interview',
            'offer',
            'hired',
            'rejected',
            'withdrawn',
          ])
          .optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const { supabase, user } = ctx

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Must be logged in',
        })
      }

      let query = supabase
        .schema('core')
        .from('applications')
        .select(
          `
          *,
          job:jobs(
            id,
            title,
            description,
            employment_type,
            remote_option,
            location,
            pay_range_min_cents,
            pay_range_max_cents,
            pay_range_type,
            status,
            organization:organizations!organization_id(
              id,
              name,
              slug
            )
          )
        `,
          { count: 'exact' }
        )
        .eq('user_id', user.id)
        .order('applied_at', { ascending: false })

      if (input.status) {
        query = query.eq('status', input.status)
      }

      query = query.range(input.offset, input.offset + input.limit - 1)

      const { data, error, count } = await query

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch applications: ${error.message}`,
        })
      }

      return { applications: data || [], total: count || 0 }
    }),

  /**
   * Get user's application for a specific job
   * Returns the application if it exists
   */
  getMyApplicationForJob: protectedProcedure
    .input(z.object({ job_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { supabase, user } = ctx

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Must be logged in',
        })
      }

      const { data: application, error } = await supabase
        .schema('core')
        .from('applications')
        .select('*')
        .eq('job_id', input.job_id)
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is 'not found' - that's ok, just means no application
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch application: ${error.message}`,
        })
      }

      return { application: application || null }
    }),

  /**
   * Update an existing application
   * Users can update their own applications
   */
  updateApplication: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        current_location: z.string().optional(),
        willing_to_relocate: z.boolean().optional(),
        years_experience: z.number().optional(),
        is_authorized_to_work: z.boolean().optional(),
        earliest_start_date: z.string().optional(),
        cover_letter: z.string().optional(),
        resume_path: z.string().optional(),
        custom_question_answers: z.array(z.any()).optional(),
        attachments: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Must be logged in',
        })
      }

      // Verify ownership
      const { data: application, error: fetchError } = await supabase
        .schema('core')
        .from('applications')
        .select('user_id, job_id, status')
        .eq('id', input.id)
        .single()

      if (fetchError || !application) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Application not found',
        })
      }

      if (application.user_id !== user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to update this application',
        })
      }

      // Check if job is still open
      const { data: job } = await supabase
        .schema('core')
        .from('jobs')
        .select('status')
        .eq('id', application.job_id)
        .single()

      if (job && job.status !== 'open') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This job is no longer accepting applications',
        })
      }

      // Update application
      const { id: _id, ...updateData } = input
      const { data: updated, error: updateError } = await supabase
        .schema('core')
        .from('applications')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.id)
        .select()
        .single()

      if (updateError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to update application: ${updateError.message}`,
        })
      }

      return { application: updated }
    }),

  /**
   * Withdraw application
   * Users can withdraw their own applications
   */
  withdrawApplication: protectedProcedure
    .input(applicationWithdrawSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Must be logged in',
        })
      }

      // Verify ownership
      const { data: application, error: fetchError } = await supabase
        .schema('core')
        .from('applications')
        .select('user_id, status')
        .eq('id', input.id)
        .single()

      if (fetchError || !application) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Application not found',
        })
      }

      if (application.user_id !== user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to withdraw this application',
        })
      }

      if (application.status === 'withdrawn') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Application is already withdrawn',
        })
      }

      // Update status
      const { error: updateError } = await supabase
        .schema('core')
        .from('applications')
        .update({ status: 'withdrawn' })
        .eq('id', input.id)

      if (updateError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to withdraw application: ${updateError.message}`,
        })
      }

      return { success: true }
    }),

  /**
   * Get filter options for internal jobs
   * Returns available filter values from published jobs
   */
  getInternalJobFilterOptions: t.procedure.query(async ({ ctx }) => {
    const { supabase } = ctx

    const { data, error } = await supabase
      .schema('core')
      .from('jobs')
      .select(
        `
        employment_type,
        remote_option,
        location,
        job_certifications(
          certification:certifications(name)
        ),
        job_skills(
          skill_taxonomy,
          csi_skill_id,
          onet_occupation_id
        )
      `
      )
      .eq('status', 'open')

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to fetch filter options: ${error.message}`,
      })
    }

    const employmentTypes = new Set<string>()
    const remoteOptions = new Set<string>()
    const locations = new Set<string>()
    const certifications = new Set<string>()
    const skills = new Set<string>()

    for (const job of data || []) {
      if (job.employment_type) employmentTypes.add(job.employment_type)
      if (job.remote_option) remoteOptions.add(job.remote_option)
      if (job.location) locations.add(job.location)

      if (Array.isArray(job.job_certifications)) {
        for (const jc of job.job_certifications) {
          const cert = Array.isArray(jc.certification) ? jc.certification[0] : jc.certification
          if (cert?.name) {
            certifications.add(cert.name)
          }
        }
      }

      const jobSkills = transformJobSkills(job.job_skills || [])
      for (const skill of jobSkills) {
        skills.add(skill.id) // Store skill IDs - names need separate lookup
      }
    }

    return {
      employmentTypes: Array.from(employmentTypes).sort(),
      remoteOptions: Array.from(remoteOptions).sort(),
      locations: Array.from(locations).sort(),
      certifications: Array.from(certifications).sort(),
      skills: Array.from(skills).sort(),
    }
  }),

  /**
   * Get job by slug (public endpoint for vanity URLs)
   * Returns public job data for slug-based access
   */
  bySlug: t.procedure
    .input(z.object({ slug: z.string().min(3).max(50) }))
    .query(async ({ ctx, input }) => {
      const { supabase } = ctx

      // Find job by slug
      const { data: job, error: jobError } = await supabase
        .schema('core')
        .from('jobs')
        .select(
          `
          id,
          title,
          slug,
          description,
          employment_type,
          location,
          is_remote,
          compensation_min,
          compensation_max,
          compensation_currency,
          status,
          created_at,
          updated_at,
          organization:organizations(
            id,
            name,
            slug,
            logo_url
          )
        `
        )
        .eq('slug', input.slug.toLowerCase())
        .eq('status', 'open') // Only return open jobs
        .single()

      if (jobError || !job) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Job with slug "${input.slug}" not found or not available`,
        })
      }

      return job
    }),
})
