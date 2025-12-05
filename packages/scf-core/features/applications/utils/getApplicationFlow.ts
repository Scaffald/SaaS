/**
 * Custom application question interface
 */
export interface CustomApplicationQuestion {
  id: string
  question: string
  type: 'short_text' | 'long_text' | 'single_choice' | 'multiple_choice' | 'yes_no'
  required: boolean
  options?: string[]
}

/**
 * Required attachments configuration interface
 */
export interface RequiredAttachments {
  resume?: { required: boolean; max_size_mb?: number }
  cover_letter?: { required: boolean; max_size_mb?: number }
  portfolio?: { required: boolean; max_size_mb?: number }
  [key: string]: { required: boolean; max_size_mb?: number } | undefined
}

/**
 * Job interface for flow selection
 */
export interface JobForFlowSelection {
  id: string
  title: string
  organization?: {
    name: string
  } | null
  custom_application_questions?: CustomApplicationQuestion[]
  required_attachments?: RequiredAttachments
}

/**
 * Determines which application flow to use based on job requirements
 *
 * @param job - Job object with custom_application_questions and required_attachments
 * @returns 'quick' for QuickApplyModal or 'full' for ApplicationWizard
 *
 * @example
 * ```tsx
 * const flowType = getApplicationFlow(job)
 * if (flowType === 'quick') {
 *   // Show QuickApplyModal
 * } else {
 *   // Show ApplicationWizard
 * }
 * ```
 */
export function getApplicationFlow(job: JobForFlowSelection): 'quick' | 'full' {
  // Check if job has custom questions
  const hasCustomQuestions =
    job.custom_application_questions && job.custom_application_questions.length > 0

  // Check if job requires documents
  const requiresDocuments =
    job.required_attachments &&
    Object.keys(job.required_attachments).some(
      (key) => job.required_attachments?.[key]?.required === true
    )

  // Use full wizard if job has custom questions or requires documents
  if (hasCustomQuestions || requiresDocuments) {
    return 'full'
  }

  // Default to quick apply for simple jobs (screening questions only)
  return 'quick'
}
