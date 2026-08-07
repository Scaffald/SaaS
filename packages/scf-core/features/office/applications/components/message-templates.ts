/**
 * Stage-specific message templates for recruiter communication.
 * Templates can be associated with pipeline stages and used to pre-fill messages.
 *
 * @see Issue #89
 */

import type { ApplicationStatus } from '../../mock-data/ats-mock-data'

export interface MessageTemplate {
  id: string
  name: string
  body: string
  /** The pipeline stage this template is associated with */
  stage: ApplicationStatus | 'all'
  /** Placeholders available for variable substitution */
  variables: string[]
  createdAt: string
  updatedAt: string
  usageCount: number
  isDefault: boolean
}

export interface TemplateVariable {
  key: string
  label: string
  description: string
}

/** Available template variables that get substituted at send time */
export const TEMPLATE_VARIABLES: TemplateVariable[] = [
  { key: '{{candidateName}}', label: 'Candidate Name', description: "The candidate's full name" },
  { key: '{{jobTitle}}', label: 'Job Title', description: 'The job position title' },
  { key: '{{companyName}}', label: 'Company Name', description: 'The hiring organization name' },
  { key: '{{recruiterName}}', label: 'Recruiter Name', description: "The recruiter's name" },
  { key: '{{stageName}}', label: 'Stage Name', description: 'Current pipeline stage' },
]

/** Human-readable stage names */
export const STAGE_LABELS: Record<ApplicationStatus | 'all', string> = {
  all: 'All Stages',
  new: 'New Application',
  screen: 'Screening',
  inquired: 'Inquiry',
  interview: 'Interview',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
}

/** Built-in default templates for each stage */
export const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: 'tpl_screen_ack',
    name: 'Application Received',
    body: 'Hi {{candidateName}},\n\nThank you for applying for the {{jobTitle}} position at {{companyName}}. We have received your application and our team is currently reviewing it.\n\nWe will be in touch soon with next steps.\n\nBest regards,\n{{recruiterName}}',
    stage: 'new',
    variables: ['{{candidateName}}', '{{jobTitle}}', '{{companyName}}', '{{recruiterName}}'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    usageCount: 0,
    isDefault: true,
  },
  {
    id: 'tpl_screen_pass',
    name: 'Screening Passed',
    body: 'Hi {{candidateName}},\n\nGreat news! After reviewing your application for {{jobTitle}}, we would like to move forward with the next step in our process.\n\nWe will send you additional details shortly.\n\nBest regards,\n{{recruiterName}}',
    stage: 'screen',
    variables: ['{{candidateName}}', '{{jobTitle}}', '{{recruiterName}}'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    usageCount: 0,
    isDefault: true,
  },
  {
    id: 'tpl_interview_invite',
    name: 'Interview Invitation',
    body: 'Hi {{candidateName}},\n\nWe are pleased to invite you for an interview for the {{jobTitle}} position at {{companyName}}.\n\nPlease let us know your availability and we will coordinate the details.\n\nLooking forward to speaking with you!\n\n{{recruiterName}}',
    stage: 'interview',
    variables: ['{{candidateName}}', '{{jobTitle}}', '{{companyName}}', '{{recruiterName}}'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    usageCount: 0,
    isDefault: true,
  },
  {
    id: 'tpl_offer_extended',
    name: 'Offer Extended',
    body: 'Hi {{candidateName}},\n\nCongratulations! We are excited to extend an offer for the {{jobTitle}} position at {{companyName}}.\n\nPlease review the offer details and let us know if you have any questions.\n\nBest regards,\n{{recruiterName}}',
    stage: 'offer',
    variables: ['{{candidateName}}', '{{jobTitle}}', '{{companyName}}', '{{recruiterName}}'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    usageCount: 0,
    isDefault: true,
  },
  {
    id: 'tpl_rejection',
    name: 'Application Declined',
    body: 'Hi {{candidateName}},\n\nThank you for your interest in the {{jobTitle}} position at {{companyName}}. After careful consideration, we have decided to move forward with other candidates at this time.\n\nWe appreciate the time you invested in the process and wish you the best in your job search.\n\nBest regards,\n{{recruiterName}}',
    stage: 'rejected',
    variables: ['{{candidateName}}', '{{jobTitle}}', '{{companyName}}', '{{recruiterName}}'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    usageCount: 0,
    isDefault: true,
  },
  {
    id: 'tpl_hired_welcome',
    name: 'Welcome Aboard',
    body: 'Hi {{candidateName}},\n\nWelcome to the {{companyName}} team! We are thrilled to have you join us as {{jobTitle}}.\n\nOur team will be in touch soon with onboarding details and next steps.\n\nCongratulations again!\n\n{{recruiterName}}',
    stage: 'hired',
    variables: ['{{candidateName}}', '{{jobTitle}}', '{{companyName}}', '{{recruiterName}}'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    usageCount: 0,
    isDefault: true,
  },
]

/**
 * Substitute template variables with actual values
 */
export function applyTemplateVariables(template: string, values: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value)
  }
  return result
}
