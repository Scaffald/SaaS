import { TRPCError } from '@trpc/server'
import { uploadAvatarInputSchema } from '@scf/trpc/schemas'
import { protectedProcedure, t } from '../../middleware';

/**
 * Profile Avatar router - handles avatar upload operations
 */
export const profileAvatarRouter = t.router({
  /**
   * Upload user avatar
   * Handles avatar file upload to Supabase Storage and updates profile
   */
  uploadAvatar: protectedProcedure
    .input(uploadAvatarInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx

      try {
        // Convert base64 to Uint8Array
        const base64Data = input.file.split(',')[1] // Remove data:image/jpeg;base64, prefix
        const binaryString = atob(base64Data)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }

        // Generate unique file name
        const fileExtension = input.fileName.split('.').pop() || 'jpg'
        const uniqueFileName = `${user.id}/avatar-${Date.now()}.${fileExtension}`

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(uniqueFileName, bytes, {
            contentType: input.contentType,
            upsert: true,
          })

        if (uploadError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to upload avatar: ${uploadError.message}`,
          })
        }

        // Store only the file path, not the full URL
        // Client will construct the full URL using their environment variables
        const { error: updateError } = await supabase
          .schema('core')
          .from('users')
          .update({
            avatar_path: uniqueFileName, // Store just the file path
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)

        if (updateError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to update profile with avatar path: ${updateError.message}`,
          })
        }

        return {
          success: true,
          avatarPath: uniqueFileName, // Return the file path
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error('Avatar upload error:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Avatar upload failed: ${errorMessage}`,
        })
      }
    }),
})
