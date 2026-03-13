import { Text, Row, Button } from '@scaffald/ui'
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

  return (
    <Button
      variant={hasUpvoted ? 'filled' : 'outline'}
      size="sm"
      onPress={handleToggle}
      disabled={isPending}
    >
      <Row align="center" gap={4}>
        <Text style={{ fontSize: 14 }}>▲</Text>
        <Text style={{ fontSize: 13 }}>{count}</Text>
      </Row>
    </Button>
  )
}
