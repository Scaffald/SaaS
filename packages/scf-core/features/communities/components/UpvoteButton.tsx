import { Button } from '@scaffald/ui'
import { ChevronUp } from 'lucide-react-native'
import { useQueryClient } from '@tanstack/react-query'
import { useUpvoteMutation, useRemoveUpvoteMutation } from '@scf/core/utils/communities-sdk-hooks'

interface Props {
  targetType: 'post' | 'comment'
  targetId: string
  count: number
  hasUpvoted: boolean
}

export function UpvoteButton({ targetType, targetId, count, hasUpvoted }: Props) {
  const queryClient = useQueryClient()

  const upvote = useUpvoteMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] })
    },
  })

  const removeUpvote = useRemoveUpvoteMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] })
    },
  })

  const handleToggle = () => {
    if (hasUpvoted) {
      removeUpvote.mutate({ targetType, targetId })
    } else {
      upvote.mutate({ target_type: targetType, target_id: targetId })
    }
  }

  const isPending = upvote.isPending || removeUpvote.isPending

  // The arrow goes through iconStart and the count through children, so Button
  // colors both of them itself. A nested <Text> emits its own color and so loses
  // the contrast color Button sets for the filled variant — which is what made
  // this render black-on-black (in light mode too: filled/gray is gray[900] in
  // both themes).
  return (
    <Button
      variant={hasUpvoted ? 'filled' : 'outline'}
      size="sm"
      iconStart={ChevronUp}
      onPress={handleToggle}
      disabled={isPending}
      accessibilityLabel={hasUpvoted ? 'Remove upvote' : 'Upvote'}
    >
      {String(count)}
    </Button>
  )
}
