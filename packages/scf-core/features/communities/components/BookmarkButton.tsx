import { Button, Text } from '@scaffald/ui'
import { useQueryClient } from '@tanstack/react-query'
import {
  useBookmarkMutation,
  useRemoveBookmarkMutation,
} from '@scf/core/utils/communities-sdk-hooks'

interface Props {
  postId: string
  hasBookmarked: boolean
}

export function BookmarkButton({ postId, hasBookmarked }: Props) {
  const queryClient = useQueryClient()

  const bookmark = useBookmarkMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] })
    },
  })

  const removeBookmark = useRemoveBookmarkMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] })
    },
  })

  const handleToggle = () => {
    if (hasBookmarked) {
      removeBookmark.mutate(postId)
    } else {
      bookmark.mutate(postId)
    }
  }

  const isPending = bookmark.isPending || removeBookmark.isPending

  return (
    <Button
      variant={hasBookmarked ? 'filled' : 'outline'}
      size="sm"
      onPress={handleToggle}
      disabled={isPending}
    >
      <Text style={{ fontSize: 14 }}>{hasBookmarked ? '★' : '☆'}</Text>
    </Button>
  )
}
