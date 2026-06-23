/**
 * Bookmark toggle for saving/un-saving a job. Reused on job cards + the job
 * detail screen. Render this as a SIBLING of (not nested inside) any pressable
 * card — on web, nesting two interactive elements is invalid DOM and the tap
 * bubbles to the parent.
 */
import { useCallback } from 'react'
import { Pressable } from 'react-native'
import { Bookmark } from 'lucide-react-native'
import { useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useQueryClient } from '@tanstack/react-query'
import {
  useIsJobSaved,
  useSaveJobMutation,
  useUnsaveJobMutation,
} from '@scf/core/utils/jobs-sdk-hooks'

export interface SaveJobButtonProps {
  jobId: string
  size?: number
}

export function SaveJobButton({ jobId, size = 20 }: SaveJobButtonProps) {
  const { theme } = useThemeContext()
  const queryClient = useQueryClient()
  const { data: status } = useIsJobSaved(jobId)
  const saved = !!status?.isFollowing

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['jobs', 'saved-status', jobId] })
    queryClient.invalidateQueries({ queryKey: ['jobs', 'saved-list'] })
  }, [queryClient, jobId])

  const save = useSaveJobMutation({ onSettled: invalidate })
  const unsave = useUnsaveJobMutation({ onSettled: invalidate })
  const pending = save.isPending || unsave.isPending

  const onToggle = useCallback(() => {
    if (pending) return
    if (saved) unsave.mutate(jobId)
    else save.mutate(jobId)
  }, [pending, saved, save, unsave, jobId])

  return (
    <Pressable
      onPress={onToggle}
      disabled={pending}
      accessibilityRole="button"
      accessibilityState={{ selected: saved, disabled: pending }}
      accessibilityLabel={saved ? 'Remove from saved jobs' : 'Save job'}
      hitSlop={8}
      style={({ pressed }) => ({
        minWidth: 44,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pending ? 0.5 : pressed ? 0.6 : 1,
      })}
    >
      <Bookmark
        size={size}
        color={saved ? colors.primary[500] : colors.icon[theme].muted}
        fill={saved ? colors.primary[500] : 'transparent'}
      />
    </Pressable>
  )
}
