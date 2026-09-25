import { useSessionContext } from '@scf/core/utils/supabase/useSessionContext'

/**
 * Whether the signed-in user is reading their own profile. `showEdit` only
 * says whether editing is offered; this says who the copy is addressed to.
 * A missing `userId` means the widget loads the current user.
 */
export function useIsProfileOwner(userId?: string): boolean {
  const { session } = useSessionContext()
  const currentUserId = session?.user?.id
  return !userId || (!!currentUserId && currentUserId === userId)
}
