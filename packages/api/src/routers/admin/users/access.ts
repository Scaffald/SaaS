import type { Database } from '@app/supabase/types'
import type { SupabaseClient } from '@supabase/supabase-js'
import { TRPCError } from '@trpc/server'

export type AdminAccess = {
  role: 'super_admin' | 'partner_admin'
  organizationId: string | null
}

export async function applyOrganizationContext(
  supabase: SupabaseClient<Database>,
  organizationId: string
) {
  const { error } = await supabase.rpc(
    'set_org_context' as never,
    { p_org_id: organizationId } as never
  )

  if (error) {
    console.error('Failed to set organization context', error)
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unable to apply organization context.',
    })
  }
}

export async function ensureAdminAccess(
  supabase: SupabaseClient<Database>,
  userId: string,
  organizationId: string | undefined,
  { requireOrgContext = false }: { requireOrgContext?: boolean } = {}
): Promise<AdminAccess> {
  const { data: isSuperAdmin, error: superError } = await supabase.rpc('user_has_role', {
    p_user_id: userId,
    p_role_name: 'super_admin',
  })

  if (superError) {
    console.error('Failed to verify admin access', superError)
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Could not verify administrator role.',
    })
  }

  if (isSuperAdmin) {
    if (organizationId) {
      await applyOrganizationContext(supabase, organizationId)
    }

    if (requireOrgContext && !organizationId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'organizationId is required for this operation.',
      })
    }

    return { role: 'super_admin', organizationId: organizationId ?? null }
  }

  if (!organizationId) {
    throw new TRPCError({
      code: requireOrgContext ? 'BAD_REQUEST' : 'FORBIDDEN',
      message: 'An organizationId is required for partner administrator operations.',
    })
  }

  const { data: isPartnerAdmin, error: partnerError } = await supabase.rpc('user_has_role', {
    p_user_id: userId,
    p_role_name: 'partner_admin',
    p_org_id: organizationId,
  })

  if (partnerError) {
    console.error('Failed to verify partner admin access', partnerError)
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Could not verify partner administrator role.',
    })
  }

  if (!isPartnerAdmin) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have permission to perform this action.',
    })
  }

  await applyOrganizationContext(supabase, organizationId)

  return { role: 'partner_admin', organizationId }
}
