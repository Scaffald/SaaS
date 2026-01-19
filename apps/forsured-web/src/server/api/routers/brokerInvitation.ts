/**
 * Broker Invitation Router
 * REQ-13: Contractor Invitation Email with Insurance Document Upload
 *
 * tRPC router for broker invitation flow where brokers can upload
 * insurance documents on behalf of contractors.
 */

import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc'
import { supabase, supabaseServiceRole } from '../../../lib/supabase'

// Use service role client for admin operations (bypasses RLS)
// Falls back to regular client if service role is not available (should not happen in production)
function getAdminClient() {
  if (!supabaseServiceRole) {
    console.warn('[BrokerInvitation] Service role client not available, using regular client')
    return supabase
  }
  return supabaseServiceRole
}

// Constants matching the edge function
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
]

// Input schemas
const getByReferralCodeInput = z.object({
  code: z.string().min(1, 'Referral code is required'),
})

const submitDocumentsInput = z.object({
  referralCode: z.string().min(1),
  brokerInfo: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    company: z.string().optional(),
    createAccount: z.boolean().default(false),
  }),
  files: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      size: z.number(),
      data: z.string(), // base64 encoded
    })
  ).min(1, 'At least one file is required'),
})

/**
 * Validate and decode base64 file data
 */
function decodeBase64File(base64Data: string): Uint8Array {
  const binaryString = atob(base64Data)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

/**
 * Generate storage path for uploaded file
 */
function generateStoragePath(contractorId: string, fileName: string): string {
  const timestamp = Date.now()
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `${contractorId}/${timestamp}-${sanitizedName}`
}

export const brokerInvitationRouter = createTRPCRouter({
  /**
   * Get contractor info by referral code
   * Public procedure - accessible without authentication
   */
  getByReferralCode: publicProcedure
    .input(getByReferralCodeInput)
    .query(async ({ input }) => {
      const { code } = input

      // The referral code is the contractor's user profile ID (UUID)
      // We use getAdminClient() to bypass RLS for this public lookup
      const { data: contractor, error } = await getAdminClient()
        .schema('forsured')
        .from('user_profiles')
        .select('id, name, email, company_name, user_type')
        .eq('id', code)
        .single()

      if (error || !contractor) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invalid referral code or contractor not found',
        })
      }

      // Verify this is actually a contractor (or manual user waiting for registration)
      if (contractor.user_type !== 'contractor' && contractor.user_type !== 'manual') {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invalid referral code',
        })
      }

      return {
        contractorId: contractor.id,
        contractorName: contractor.name || contractor.email || 'Contractor',
        contractorCompany: contractor.company_name,
      }
    }),

  /**
   * Submit documents on behalf of a contractor
   * Public procedure - broker doesn't need to be authenticated
   * Creates broker-contractor relationship and uploads files
   */
  submitDocuments: publicProcedure
    .input(submitDocumentsInput)
    .mutation(async ({ input }) => {
      const { referralCode, brokerInfo, files } = input

      // Validate contractor exists
      const { data: contractor, error: contractorError } = await getAdminClient()
        .schema('forsured')
        .from('user_profiles')
        .select('id, name, email, scaffald_user_id')
        .eq('id', referralCode)
        .single()

      if (contractorError || !contractor) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Contractor not found',
        })
      }

      // Validate files
      for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `File "${file.name}" exceeds 2MB limit`,
          })
        }
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `File type "${file.type}" not allowed`,
          })
        }
      }

      // Check if broker already exists by email
      let brokerId: string | null = null
      const { data: existingBroker } = await getAdminClient()
        .schema('forsured')
        .from('user_profiles')
        .select('id')
        .eq('email', brokerInfo.email.toLowerCase())
        .single()

      if (existingBroker) {
        brokerId = existingBroker.id
      } else if (brokerInfo.createAccount) {
        // Create a manual user profile for the broker (REQ-12 integration)
        const { data: newBroker, error: createError } = await getAdminClient()
          .schema('forsured')
          .from('user_profiles')
          .insert({
            email: brokerInfo.email.toLowerCase(),
            name: brokerInfo.name,
            phone: brokerInfo.phone || null,
            company_name: brokerInfo.company || null,
            user_type: 'manual', // Will become 'broker' when they complete registration
            status: 'pending',
            metadata: {
              intended_role: 'broker',
              created_via: 'broker_invitation',
              created_for_contractor: contractor.id,
            },
          })
          .select('id')
          .single()

        if (createError) {
          console.error('[BrokerInvitation] Failed to create broker profile:', createError)
          // Don't fail the upload, just skip broker profile creation
        } else {
          brokerId = newBroker.id
        }
      }

      // Create/update broker-contractor relationship if we have a broker ID
      if (brokerId) {
        const { error: relationshipError } = await getAdminClient()
          .schema('forsured')
          .from('broker_contractor_relationships')
          .upsert(
            {
              broker_id: brokerId,
              contractor_id: contractor.id,
              created_by: 'broker_invitation',
              created_by_user_id: brokerId,
              status: 'active',
            },
            {
              onConflict: 'broker_id,contractor_id',
              ignoreDuplicates: true,
            }
          )

        if (relationshipError) {
          console.error('[BrokerInvitation] Failed to create relationship:', relationshipError)
          // Don't fail the upload for relationship errors
        }
      }

      // Upload files to storage and create records
      const uploadedFiles: string[] = []
      const failedFiles: Array<{ name: string; reason: string }> = []

      for (const file of files) {
        try {
          const storagePath = generateStoragePath(contractor.id, file.name)
          const fileData = decodeBase64File(file.data)

          // Upload to storage
          const { error: uploadError } = await getAdminClient().storage
            .from('insurance-uploads')
            .upload(storagePath, fileData, {
              contentType: file.type,
              upsert: false,
            })

          if (uploadError) {
            console.error(`[BrokerInvitation] Upload error for ${file.name}:`, uploadError)
            failedFiles.push({ name: file.name, reason: 'Upload failed' })
            continue
          }

          // Create record in insurance_uploads table
          const { error: insertError } = await getAdminClient()
            .schema('forsured')
            .from('insurance_uploads')
            .insert({
              contractor_id: contractor.id,
              uploaded_by_user_id: brokerId, // null if no broker profile
              upload_method: 'broker_invitation',
              file_name: file.name,
              file_path: storagePath,
              file_size: file.size,
              mime_type: file.type,
              status: 'uploaded',
              email_metadata: {
                broker_name: brokerInfo.name,
                broker_email: brokerInfo.email,
                broker_company: brokerInfo.company || null,
                uploaded_at: new Date().toISOString(),
              },
            })

          if (insertError) {
            console.error(`[BrokerInvitation] Insert error for ${file.name}:`, insertError)
            // Try to clean up uploaded file
            await getAdminClient().storage.from('insurance-uploads').remove([storagePath])
            failedFiles.push({ name: file.name, reason: 'Database error' })
            continue
          }

          uploadedFiles.push(file.name)
        } catch (err) {
          console.error(`[BrokerInvitation] Unexpected error for ${file.name}:`, err)
          failedFiles.push({ name: file.name, reason: 'Unexpected error' })
        }
      }

      // Check if any files were uploaded
      if (uploadedFiles.length === 0) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to upload any files. Please try again.',
        })
      }

      // REQ-13 Task 6: Create notification for contractor about new documents
      try {
        if (contractor.scaffald_user_id) {
          await getAdminClient()
            .schema('core')
            .from('notifications')
            .insert({
              user_id: contractor.scaffald_user_id,
              title: 'Insurance Documents Uploaded',
              message: `${brokerInfo.name} from ${brokerInfo.company || 'your insurance broker'} has uploaded ${uploadedFiles.length} insurance document(s) for you.`,
              type: 'insurance_upload',
              severity: 'info',
              preview: `${uploadedFiles.length} document(s) uploaded by broker`,
              body: {
                contractor_id: contractor.id,
                broker_name: brokerInfo.name,
                broker_email: brokerInfo.email,
                broker_company: brokerInfo.company || null,
                files_count: uploadedFiles.length,
                upload_method: 'broker_invitation',
                uploaded_files: uploadedFiles,
              },
              metadata: {
                broker_name: brokerInfo.name,
                broker_email: brokerInfo.email,
              },
              cta_label: 'View Documents',
              cta_url: `/subcontractor/documents`,
              routed_channels: ['in_app'],
              dedupe_key: `broker_upload_${contractor.id}_${Date.now()}`,
            })

          console.log(`[BrokerInvitation] Created notification for contractor ${contractor.id}`)
        }
      } catch (notificationError) {
        console.error('[BrokerInvitation] Failed to create notification:', notificationError)
        // Don't fail the upload for notification errors
      }

      return {
        success: true,
        filesUploaded: uploadedFiles.length,
        filesFailed: failedFiles.length,
        uploaded: uploadedFiles,
        failed: failedFiles,
        brokerAccountCreated: brokerInfo.createAccount && brokerId !== null,
      }
    }),

  /**
   * Get documents uploaded for a contractor (protected)
   * Used by brokers to see what they've uploaded
   */
  getUploadsForContractor: protectedProcedure
    .input(z.object({ contractorId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { contractorId } = input

      // Get current user's profile
      const { data: userProfile } = await supabase
        .schema('forsured')
        .from('user_profiles')
        .select('id, user_type')
        .eq('scaffald_user_id', ctx.user.id)
        .single()

      if (!userProfile) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User profile not found',
        })
      }

      // Check if user has access (is the contractor, or is a broker with relationship)
      if (userProfile.user_type === 'broker') {
        const { data: relationship } = await supabase
          .schema('forsured')
          .from('broker_contractor_relationships')
          .select('id')
          .eq('broker_id', userProfile.id)
          .eq('contractor_id', contractorId)
          .eq('status', 'active')
          .single()

        if (!relationship) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'No active relationship with this contractor',
          })
        }
      } else if (userProfile.id !== contractorId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        })
      }

      // Fetch uploads
      const { data: uploads, error } = await supabase
        .schema('forsured')
        .from('insurance_uploads')
        .select('*')
        .eq('contractor_id', contractorId)
        .order('uploaded_at', { ascending: false })

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch uploads',
        })
      }

      return uploads
    }),
})
