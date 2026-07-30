import { Button } from '@scaffald/ui'
import { Bookmark } from 'lucide-react-native'
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

  // Bookmark state reads from the variant plus the icon, so Button owns the
  // color. A nested <Text> emits its own and loses the contrast color Button
  // sets for the filled variant — which is what made this render black-on-black
  // (in light mode too: filled/gray is gray[900] in both themes).
  return (
    <Button
      variant={hasBookmarked ? 'filled' : 'outline'}
      size="sm"
      iconOnly
      iconStart={Bookmark}
      onPress={handleToggle}
      disabled={isPending}
      accessibilityLabel={hasBookmarked ? 'Remove bookmark' : 'Bookmark'}
    />
  )
}
