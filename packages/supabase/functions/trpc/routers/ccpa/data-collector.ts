/**
 * CCPA Data Collector for Scaffald
 *
 * Collects all user data from Scaffald's auth and core schemas,
 * organizing it by CCPA categories for export generation.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../../_shared/database.types';
import type {
  BackgroundCheckEntry,
  CertificationEntry,
  CollectionResult,
  CommunicationsData,
  DataSource,
  EducationEntry,
  ExperienceEntry,
  FeedbackEntry,
  FinancialInformation,
  IdVerificationEntry,
  LoginHistoryEntry,
  PaymentEntry,
  PersonalInformation,
  PersonalityAssessmentEntry,
  ProfessionalInformation,
  ProfileViewEntry,
  ReviewEntry,
  SensitiveInformation,
  SkillEntry,
  UsageInformation,
  UserDataExport,
  WorkLogEntry,
} from './types';

type DbClient = SupabaseClient<Database>

/**
 * Export format version for backwards compatibility
 */
const FORMAT_VERSION = '1.0.0'

/**
 * Collect personal information from auth and core.profile tables
 */
async function collectPersonalInformation(
  supabase: DbClient,
  userId: string,
  serviceRoleClient: DbClient
): Promise<{ data: PersonalInformation; sources: DataSource[]; errors: string[] }> {
  const errors: string[] = []
  const sources: DataSource[] = []
  const now = new Date().toISOString()

  let email: string | null = null
  let phone: string | null = null
  let accountCreatedAt: string | null = null
  let lastSignInAt: string | null = null
  let authProvider: string | null = null
  let appMetadata: Record<string, unknown> | null = null
  let userMetadata: Record<string, unknown> | null = null

  // Get auth user data using service role client
  try {
    const { data: authUser, error: authError } = await serviceRoleClient.auth.admin.getUserById(userId)
    if (authError) {
      errors.push(`auth.users: ${authError.message}`)
    } else if (authUser?.user) {
      email = authUser.user.email ?? null
      phone = authUser.user.phone ?? null
      accountCreatedAt = authUser.user.created_at ?? null
      lastSignInAt = authUser.user.last_sign_in_at ?? null
      authProvider = authUser.user.app_metadata?.provider ?? null
      appMetadata = authUser.user.app_metadata ?? null
      userMetadata = authUser.user.user_metadata ?? null
      sources.push({
        source: 'auth.users',
        description: 'Authentication and account data',
        collectedAt: now,
        retentionPeriod: 'indefinite',
      })
    }
  } catch (e) {
    errors.push(`auth.users: ${e instanceof Error ? e.message : 'Unknown error'}`)
  }

  // Get private profile data
  let firstName: string | null = null
  let lastName: string | null = null
  let address: Record<string, unknown> | null = null
  let profilePhone: string | null = null

  try {
    const { data: profile, error: profileError } = await supabase
      .schema('core')
      .from('profile')
      .select('first_name, last_name, address, phone')
      .eq('user_id', userId)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      errors.push(`core.profile: ${profileError.message}`)
    } else if (profile) {
      firstName = profile.first_name ?? null
      lastName = profile.last_name ?? null
      address = profile.address as Record<string, unknown> | null
      profilePhone = profile.phone ?? null
      sources.push({
        source: 'core.profile',
        description: 'Private profile information (name, address)',
        collectedAt: now,
        retentionPeriod: 'indefinite',
      })
    }
  } catch (e) {
    errors.push(`core.profile: ${e instanceof Error ? e.message : 'Unknown error'}`)
  }

  // Get public profile data
  let avatarPath: string | null = null

  try {
    const { data: publicProfile, error: publicError } = await supabase
      .schema('core')
      .from('users')
      .select('avatar_path')
      .eq('id', userId)
      .single()

    if (publicError && publicError.code !== 'PGRST116') {
      errors.push(`core.users: ${publicError.message}`)
    } else if (publicProfile) {
      avatarPath = publicProfile.avatar_path ?? null
      sources.push({
        source: 'core.users',
        description: 'Public profile data',
        collectedAt: now,
        retentionPeriod: 'indefinite',
      })
    }
  } catch (e) {
    errors.push(`core.users: ${e instanceof Error ? e.message : 'Unknown error'}`)
  }

  return {
    data: {
      email,
      phone: profilePhone ?? phone,
      firstName,
      lastName,
      address,
      avatarPath,
      accountCreatedAt,
      lastSignInAt,
      authProvider,
      appMetadata,
      userMetadata,
    },
    sources,
    errors,
  }
}

/**
 * Collect professional information from core schema tables
 */
async function collectProfessionalInformation(
  supabase: DbClient,
  userId: string
): Promise<{ data: ProfessionalInformation; sources: DataSource[]; errors: string[] }> {
  const errors: string[] = []
  const sources: DataSource[] = []
  const now = new Date().toISOString()

  // Get basic profile info (slug, headline, about)
  let slug: string | null = null
  let headline: string | null = null
  let about: Record<string, unknown> | null = null

  try {
    const { data: profile, error } = await supabase
      .schema('core')
      .from('users')
      .select('slug, headline, about')
      .eq('id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      errors.push(`core.users (profile): ${error.message}`)
    } else if (profile) {
      slug = profile.slug ?? null
      headline = profile.headline ?? null
      about = profile.about as Record<string, unknown> | null
    }
  } catch (e) {
    errors.push(`core.users (profile): ${e instanceof Error ? e.message : 'Unknown error'}`)
  }

  // Get education
  const education: EducationEntry[] = []
  try {
    const { data: eduData, error } = await supabase
      .schema('core')
      .from('user_education')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false })

    if (error) {
      errors.push(`core.user_education: ${error.message}`)
    } else if (eduData) {
      for (const edu of eduData) {
        education.push({
          id: edu.id,
          institutionName: edu.institution_name ?? '',
          universityId: edu.university_id ?? null,
          degreeType: edu.degree_type ?? null,
          fieldOfStudy: edu.field_of_study ?? null,
          startDate: edu.start_date ?? null,
          endDate: edu.end_date ?? null,
          isVerified: edu.is_verified ?? false,
          gpa: edu.gpa ?? null,
          description: edu.description ?? null,
        })
      }
      sources.push({
        source: 'core.user_education',
        description: 'Education history',
        collectedAt: now,
        retentionPeriod: 'indefinite',
      })
    }
  } catch (e) {
    errors.push(`core.user_education: ${e instanceof Error ? e.message : 'Unknown error'}`)
  }

  // Get skills
  const skills: SkillEntry[] = []
  try {
    const { data: skillsData, error } = await supabase
      .schema('core')
      .from('user_skills')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      errors.push(`core.user_skills: ${error.message}`)
    } else if (skillsData) {
      for (const skill of skillsData) {
        skills.push({
          id: skill.id,
          skillId: skill.skill_id ?? '',
          skillName: null, // Would need join to get name
          taxonomyType: skill.taxonomy_type ?? null,
          yearsExperience: skill.years_experience ?? null,
          proficiencyLevel: skill.proficiency_level ?? null,
          isVerified: skill.is_verified ?? false,
        })
      }
      sources.push({
        source: 'core.user_skills',
        description: 'Professional skills',
        collectedAt: now,
        retentionPeriod: 'indefinite',
      })
    }
  } catch (e) {
    errors.push(`core.user_skills: ${e instanceof Error ? e.message : 'Unknown error'}`)
  }

  // Get experience
  const experience: ExperienceEntry[] = []
  try {
    const { data: expData, error } = await supabase
      .schema('core')
      .from('user_experience')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false })

    if (error) {
      errors.push(`core.user_experience: ${error.message}`)
    } else if (expData) {
      for (const exp of expData) {
        experience.push({
          id: exp.id,
          companyName: exp.company_name ?? null,
          jobTitle: exp.job_title ?? null,
          startDate: exp.start_date ?? null,
          endDate: exp.end_date ?? null,
          isCurrent: exp.is_current ?? false,
          description: exp.description ?? null,
          location: exp.location ?? null,
        })
      }
      sources.push({
        source: 'core.user_experience',
        description: 'Work experience',
        collectedAt: now,
        retentionPeriod: 'indefinite',
      })
    }
  } catch (e) {
    errors.push(`core.user_experience: ${e instanceof Error ? e.message : 'Unknown error'}`)
  }

  // Get certifications
  const certifications: CertificationEntry[] = []
  try {
    const { data: certData, error } = await supabase
      .schema('core')
      .from('user_certifications')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      errors.push(`core.user_certifications: ${error.message}`)
    } else if (certData) {
      for (const cert of certData) {
        certifications.push({
          id: cert.id,
          certificationName: cert.certification_name ?? '',
          issuingOrganization: cert.issuing_organization ?? null,
          issueDate: cert.issue_date ?? null,
          expirationDate: cert.expiration_date ?? null,
          credentialId: cert.credential_id ?? null,
          isVerified: cert.is_verified ?? false,
        })
      }
      sources.push({
        source: 'core.user_certifications',
        description: 'Professional certifications',
        collectedAt: now,
        retentionPeriod: 'indefinite',
      })
    }
  } catch (e) {
    errors.push(`core.user_certifications: ${e instanceof Error ? e.message : 'Unknown error'}`)
  }

  // Get work logs
  const workLogs: WorkLogEntry[] = []
  try {
    const { data: logsData, error } = await supabase
      .schema('core')
      .from('work_logs')
      .select('id, project_id, log_date, total_hours, work_description, status, tasks_completed, skills_used, visibility, submitted_at, verified_at')
      .eq('user_id', userId)
      .order('log_date', { ascending: false })
      .limit(100) // Limit for performance

    if (error) {
      errors.push(`core.work_logs: ${error.message}`)
    } else if (logsData) {
      for (const log of logsData) {
        workLogs.push({
          id: log.id,
          projectId: log.project_id ?? null,
          logDate: log.log_date ?? null,
          totalHours: log.total_hours ?? null,
          workDescription: log.work_description ?? null,
          status: log.status ?? 'draft',
          tasksCompleted: (log.tasks_completed as unknown[]) ?? [],
          skillsUsed: (log.skills_used as unknown[]) ?? [],
          visibility: log.visibility ?? 'private',
          submittedAt: log.submitted_at ?? null,
          verifiedAt: log.verified_at ?? null,
        })
      }
      sources.push({
        source: 'core.work_logs',
        description: 'Work log entries',
        collectedAt: now,
        retentionPeriod: '7_years',
      })
    }
  } catch (e) {
    errors.push(`core.work_logs: ${e instanceof Error ? e.message : 'Unknown error'}`)
  }

  return {
    data: {
      slug,
      headline,
      about,
      education,
      skills,
      experience,
      certifications,
      workLogs,
    },
    sources,
    errors,
  }
}

/**
 * Collect financial information
 */
async function collectFinancialInformation(
  supabase: DbClient,
  userId: string
): Promise<{ data: FinancialInformation; sources: DataSource[]; errors: string[] }> {
  const errors: string[] = []
  const sources: DataSource[] = []
  const now = new Date().toISOString()

  let stripeCustomerId: string | null = null
  let stripeConnected = false
  const payments: PaymentEntry[] = []

  // Check for Stripe settings
  try {
    const { data: stripeData, error } = await supabase
      .schema('core')
      .from('stripe_settings')
      .select('stripe_customer_id, stripe_connect_account_id')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      errors.push(`core.stripe_settings: ${error.message}`)
    } else if (stripeData) {
      stripeCustomerId = stripeData.stripe_customer_id ?? null
      stripeConnected = !!stripeData.stripe_connect_account_id
      sources.push({
        source: 'core.stripe_settings',
        description: 'Payment configuration',
        collectedAt: now,
        retentionPeriod: '7_years',
      })
    }
  } catch (e) {
    errors.push(`core.stripe_settings: ${e instanceof Error ? e.message : 'Unknown error'}`)
  }

  // Get payments (if table exists)
  try {
    const { data: paymentsData, error } = await supabase
      .schema('core')
      .from('payments')
      .select('id, amount, currency, status, created_at, description')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error && error.code !== 'PGRST116' && !error.message.includes('does not exist')) {
      errors.push(`core.payments: ${error.message}`)
    } else if (paymentsData) {
      for (const payment of paymentsData) {
        payments.push({
          id: payment.id,
          amount: payment.amount ?? 0,
          currency: payment.currency ?? 'usd',
          status: payment.status ?? 'unknown',
          createdAt: payment.created_at ?? now,
          description: payment.description ?? null,
        })
      }
      if (paymentsData.length > 0) {
        sources.push({
          source: 'core.payments',
          description: 'Payment transactions',
          collectedAt: now,
          retentionPeriod: '7_years',
        })
      }
    }
  } catch (e) {
    // Table might not exist, which is fine
    if (e instanceof Error && !e.message.includes('does not exist')) {
      errors.push(`core.payments: ${e.message}`)
    }
  }

  return {
    data: {
      stripeCustomerId,
      payments,
      stripeConnected,
    },
    sources,
    errors,
  }
}

/**
 * Collect usage information
 */
async function collectUsageInformation(
  supabase: DbClient,
  userId: string
): Promise<{ data: UsageInformation; sources: DataSource[]; errors: string[] }> {
  const errors: string[] = []
  const sources: DataSource[] = []
  const now = new Date().toISOString()

  // Get profile views
  const profileViews: ProfileViewEntry[] = []
  try {
    const { data: viewsData, error } = await supabase
      .schema('core')
      .from('profile_views')
      .select('id, viewer_id, viewed_at')
      .eq('profile_id', userId)
      .order('viewed_at', { ascending: false })
      .limit(100)

    if (error) {
      errors.push(`core.profile_views: ${error.message}`)
    } else if (viewsData) {
      for (const view of viewsData) {
        profileViews.push({
          id: view.id,
          viewerId: view.viewer_id ?? null,
          viewedAt: view.viewed_at ?? now,
          viewerType: null, // Would need additional lookup
        })
      }
      sources.push({
        source: 'core.profile_views',
        description: 'Profile view history',
        collectedAt: now,
        retentionPeriod: '1_year',
      })
    }
  } catch (e) {
    errors.push(`core.profile_views: ${e instanceof Error ? e.message : 'Unknown error'}`)
  }

  // Login history would come from auth metadata (already collected in personal info)
  const loginHistory: LoginHistoryEntry[] = []

  // Get application count
  let applicationCount = 0
  try {
    const { count, error } = await supabase
      .schema('core')
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (error) {
      errors.push(`core.applications (count): ${error.message}`)
    } else {
      applicationCount = count ?? 0
      sources.push({
        source: 'core.applications',
        description: 'Job application count',
        collectedAt: now,
        retentionPeriod: '3_years',
      })
    }
  } catch (e) {
    errors.push(`core.applications: ${e instanceof Error ? e.message : 'Unknown error'}`)
  }

  // Get connection count
  let connectionCount = 0
  try {
    const { count, error } = await supabase
      .schema('core')
      .from('connections')
      .select('id', { count: 'exact', head: true })
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
      .eq('status', 'accepted')

    if (error) {
      errors.push(`core.connections (count): ${error.message}`)
    } else {
      connectionCount = count ?? 0
      sources.push({
        source: 'core.connections',
        description: 'Network connections count',
        collectedAt: now,
        retentionPeriod: 'indefinite',
      })
    }
  } catch (e) {
    errors.push(`core.connections: ${e instanceof Error ? e.message : 'Unknown error'}`)
  }

  return {
    data: {
      profileViews,
      loginHistory,
      applicationCount,
      connectionCount,
    },
    sources,
    errors,
  }
}

/**
 * Collect sensitive information
 */
async function collectSensitiveInformation(
  supabase: DbClient,
  userId: string
): Promise<{ data: SensitiveInformation; sources: DataSource[]; errors: string[] }> {
  const errors: string[] = []
  const sources: DataSource[] = []
  const now = new Date().toISOString()

  // Get background checks
  const backgroundChecks: BackgroundCheckEntry[] = []
  try {
    const { data: bgData, error } = await supabase
      .schema('core')
      .from('background_checks')
      .select('id, provider, status, requested_at, completed_at, result_summary')
      .eq('user_id', userId)

    if (error) {
      errors.push(`core.background_checks: ${error.message}`)
    } else if (bgData) {
      for (const bg of bgData) {
        backgroundChecks.push({
          id: bg.id,
          provider: bg.provider ?? 'unknown',
          status: bg.status ?? 'unknown',
          requestedAt: bg.requested_at ?? now,
          completedAt: bg.completed_at ?? null,
          resultSummary: bg.result_summary ?? null,
        })
      }
      if (bgData.length > 0) {
        sources.push({
          source: 'core.background_checks',
          description: 'Background check records',
          collectedAt: now,
          retentionPeriod: '7_years',
        })
      }
    }
  } catch (e) {
    errors.push(`core.background_checks: ${e instanceof Error ? e.message : 'Unknown error'}`)
  }

  // Get ID verifications
  const idVerifications: IdVerificationEntry[] = []
  try {
    const { data: idData, error } = await supabase
      .schema('core')
      .from('id_verifications')
      .select('id, provider, status, verified_at, document_type')
      .eq('user_id', userId)

    if (error) {
      errors.push(`core.id_verifications: ${error.message}`)
    } else if (idData) {
      for (const id of idData) {
        idVerifications.push({
          id: id.id,
          provider: id.provider ?? 'unknown',
          status: id.status ?? 'unknown',
          verifiedAt: id.verified_at ?? null,
          documentType: id.document_type ?? null,
        })
      }
      if (idData.length > 0) {
        sources.push({
          source: 'core.id_verifications',
          description: 'Identity verification records',
          collectedAt: now,
          retentionPeriod: '7_years',
        })
      }
    }
  } catch (e) {
    errors.push(`core.id_verifications: ${e instanceof Error ? e.message : 'Unknown error'}`)
  }

  // Get personality assessments
  const personalityAssessments: PersonalityAssessmentEntry[] = []
  try {
    const { data: paData, error } = await supabase
      .schema('core')
      .from('personality_assessments')
      .select('id, assessment_type, completed_at, results')
      .eq('user_id', userId)

    if (error) {
      errors.push(`core.personality_assessments: ${error.message}`)
    } else if (paData) {
      for (const pa of paData) {
        personalityAssessments.push({
          id: pa.id,
          assessmentType: pa.assessment_type ?? 'unknown',
          completedAt: pa.completed_at ?? null,
          results: pa.results as Record<string, unknown> | null,
        })
      }
      if (paData.length > 0) {
        sources.push({
          source: 'core.personality_assessments',
          description: 'Personality assessment results',
          collectedAt: now,
          retentionPeriod: '5_years',
        })
      }
    }
  } catch (e) {
    errors.push(`core.personality_assessments: ${e instanceof Error ? e.message : 'Unknown error'}`)
  }

  return {
    data: {
      backgroundChecks,
      idVerifications,
      personalityAssessments,
    },
    sources,
    errors,
  }
}

/**
 * Collect communications data
 */
async function collectCommunicationsData(
  supabase: DbClient,
  userId: string
): Promise<{ data: CommunicationsData; sources: DataSource[]; errors: string[] }> {
  const errors: string[] = []
  const sources: DataSource[] = []
  const now = new Date().toISOString()

  // Get reviews
  const reviews: ReviewEntry[] = []
  try {
    // Reviews given
    const { data: givenReviews, error: givenError } = await supabase
      .schema('core')
      .from('reviews')
      .select('id, rating, content, created_at, project_id')
      .eq('reviewer_id', userId)
      .limit(50)

    if (givenError) {
      errors.push(`core.reviews (given): ${givenError.message}`)
    } else if (givenReviews) {
      for (const review of givenReviews) {
        reviews.push({
          id: review.id,
          reviewType: 'given',
          rating: review.rating ?? null,
          content: review.content ?? null,
          createdAt: review.created_at ?? now,
          projectId: review.project_id ?? null,
        })
      }
    }

    // Reviews received
    const { data: receivedReviews, error: receivedError } = await supabase
      .schema('core')
      .from('reviews')
      .select('id, rating, content, created_at, project_id')
      .eq('reviewee_id', userId)
      .limit(50)

    if (receivedError) {
      errors.push(`core.reviews (received): ${receivedError.message}`)
    } else if (receivedReviews) {
      for (const review of receivedReviews) {
        reviews.push({
          id: review.id,
          reviewType: 'received',
          rating: review.rating ?? null,
          content: review.content ?? null,
          createdAt: review.created_at ?? now,
          projectId: review.project_id ?? null,
        })
      }
    }

    if (reviews.length > 0) {
      sources.push({
        source: 'core.reviews',
        description: 'Reviews given and received',
        collectedAt: now,
        retentionPeriod: 'indefinite',
      })
    }
  } catch (e) {
    errors.push(`core.reviews: ${e instanceof Error ? e.message : 'Unknown error'}`)
  }

  // Get feedback
  const feedback: FeedbackEntry[] = []
  try {
    const { data: feedbackData, error } = await supabase
      .schema('core')
      .from('feedback')
      .select('id, feedback_type, content, created_at, status')
      .eq('user_id', userId)
      .limit(50)

    if (error) {
      errors.push(`core.feedback: ${error.message}`)
    } else if (feedbackData) {
      for (const fb of feedbackData) {
        feedback.push({
          id: fb.id,
          feedbackType: fb.feedback_type ?? 'general',
          content: fb.content ?? null,
          createdAt: fb.created_at ?? now,
          status: fb.status ?? 'submitted',
        })
      }
      if (feedbackData.length > 0) {
        sources.push({
          source: 'core.feedback',
          description: 'Platform feedback submissions',
          collectedAt: now,
          retentionPeriod: '3_years',
        })
      }
    }
  } catch (e) {
    errors.push(`core.feedback: ${e instanceof Error ? e.message : 'Unknown error'}`)
  }

  return {
    data: {
      reviews,
      feedback,
    },
    sources,
    errors,
  }
}

/**
 * Calculate approximate size of the export data in bytes
 */
function calculateApproximateSize(data: UserDataExport): number {
  try {
    return new TextEncoder().encode(JSON.stringify(data)).length
  } catch {
    return 0
  }
}

/**
 * Count total records across all categories
 */
function countTotalRecords(data: UserDataExport): number {
  let count = 1 // Personal info counts as 1

  // Professional
  count += data.professionalInformation.education.length
  count += data.professionalInformation.skills.length
  count += data.professionalInformation.experience.length
  count += data.professionalInformation.certifications.length
  count += data.professionalInformation.workLogs.length

  // Financial
  count += data.financialInformation.payments.length

  // Usage
  count += data.usageInformation.profileViews.length
  count += data.usageInformation.loginHistory.length

  // Sensitive
  count += data.sensitiveInformation.backgroundChecks.length
  count += data.sensitiveInformation.idVerifications.length
  count += data.sensitiveInformation.personalityAssessments.length

  // Communications
  count += data.communications.reviews.length
  count += data.communications.feedback.length

  return count
}

/**
 * Main function to collect all user data for CCPA export
 *
 * @param supabase - Supabase client with user context
 * @param userId - The user ID to collect data for
 * @param serviceRoleClient - Service role client for admin operations
 * @returns Collection result with data and any errors
 */
export async function collectCoreUserData(
  supabase: DbClient,
  userId: string,
  serviceRoleClient: DbClient
): Promise<CollectionResult> {
  const startTime = Date.now()
  const allErrors: Array<{ source: string; error: string }> = []
  const allSources: DataSource[] = []

  // Collect all data categories in parallel
  const [
    personalResult,
    professionalResult,
    financialResult,
    usageResult,
    sensitiveResult,
    communicationsResult,
  ] = await Promise.all([
    collectPersonalInformation(supabase, userId, serviceRoleClient),
    collectProfessionalInformation(supabase, userId),
    collectFinancialInformation(supabase, userId),
    collectUsageInformation(supabase, userId),
    collectSensitiveInformation(supabase, userId),
    collectCommunicationsData(supabase, userId),
  ])

  // Aggregate errors
  for (const err of personalResult.errors) {
    allErrors.push({ source: 'personal', error: err })
  }
  for (const err of professionalResult.errors) {
    allErrors.push({ source: 'professional', error: err })
  }
  for (const err of financialResult.errors) {
    allErrors.push({ source: 'financial', error: err })
  }
  for (const err of usageResult.errors) {
    allErrors.push({ source: 'usage', error: err })
  }
  for (const err of sensitiveResult.errors) {
    allErrors.push({ source: 'sensitive', error: err })
  }
  for (const err of communicationsResult.errors) {
    allErrors.push({ source: 'communications', error: err })
  }

  // Aggregate sources
  allSources.push(...personalResult.sources)
  allSources.push(...professionalResult.sources)
  allSources.push(...financialResult.sources)
  allSources.push(...usageResult.sources)
  allSources.push(...sensitiveResult.sources)
  allSources.push(...communicationsResult.sources)

  const collectionDurationMs = Date.now() - startTime

  // Build export structure
  const exportData: UserDataExport = {
    metadata: {
      userId,
      exportedAt: new Date().toISOString(),
      formatVersion: FORMAT_VERSION,
      dataSources: allSources,
      totalRecords: 0, // Will be calculated
      approximateSizeBytes: 0, // Will be calculated
      collectionDurationMs,
    },
    personalInformation: personalResult.data,
    professionalInformation: professionalResult.data,
    financialInformation: financialResult.data,
    usageInformation: usageResult.data,
    sensitiveInformation: sensitiveResult.data,
    communications: communicationsResult.data,
  }

  // Calculate totals
  exportData.metadata.totalRecords = countTotalRecords(exportData)
  exportData.metadata.approximateSizeBytes = calculateApproximateSize(exportData)

  return {
    success: allErrors.length === 0,
    data: exportData,
    errors: allErrors,
  }
}
