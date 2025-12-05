import { z } from 'zod'

/**
 * Certifications Profile Form Schema
 * Robust certification tracking like LinkedIn
 */
export const certificationsProfileSchema = z.object({
  certifications: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        name: z.string().min(1, 'Certification name is required'),
        issuing_organization: z.string().min(1, 'Issuing organization is required'),
        issue_date: z.string().optional(), // ISO date string
        expiration_date: z.string().optional(), // ISO date string
        credential_id: z.string().optional(),
        credential_url: z.string().url().optional().or(z.literal('')),
        certificate_file_path: z.string().optional(),
        description: z.string().max(500).optional(),
        skills_gained: z.array(z.string()).optional(),
        is_active: z.boolean().default(true),
        verification_status: z.enum(['verified', 'pending', 'unverified']).default('unverified'),
      })
    )
    .optional(),
})

export type CertificationsProfileFormData = z.infer<typeof certificationsProfileSchema>

export const certificationsProfileDefaults: Partial<CertificationsProfileFormData> = {
  certifications: [],
}

// Helper function to create new certification
export const createNewCertification = () => ({
  id: undefined,
  name: '',
  issuing_organization: '',
  issue_date: '',
  expiration_date: '',
  credential_id: '',
  credential_url: '',
  certificate_file_path: undefined,
  description: '',
  skills_gained: [],
  is_active: true,
  verification_status: 'unverified' as const,
})

// Common certification organizations
export const COMMON_CERT_ORGANIZATIONS = [
  'OSHA',
  'NCCER',
  'AWS (American Welding Society)',
  'NIMS (National Institute for Metalworking Skills)',
  'CompTIA',
  'Microsoft',
  'Google',
  'Amazon Web Services',
  'Cisco',
  'PMI (Project Management Institute)',
  'NFPA (National Fire Protection Association)',
  'ANSI',
  'ISO',
  'Red Cross',
  'First Aid/CPR',
] as const

// Verification status options
export const VERIFICATION_STATUS_OPTIONS = [
  { value: 'verified', label: 'Verified', color: 'green' },
  { value: 'pending', label: 'Pending Verification', color: 'orange' },
  { value: 'unverified', label: 'Not Verified', color: 'gray' },
] as const
