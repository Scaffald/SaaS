import { useState } from 'react'
import { Text, Stack, Button } from '@scaffald/ui'
import { useQueryClient } from '@tanstack/react-query'
import { useRatePostMutation } from '@scf/core/utils/communities-sdk-hooks'
import { StarRating } from './StarRating'

interface Props {
  postId: string
}

export function RatingInput({ postId }: Props) {
  const queryClient = useQueryClient()
  const [baseRating, setBaseRating] = useState(0)
  const [qualityRating, setQualityRating] = useState(0)
  const [techniqueRating, setTechniqueRating] = useState(0)
  const [creativityRating, setCreativityRating] = useState(0)
  const [showDetailed, setShowDetailed] = useState(false)

  const rateMutation = useRatePostMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities', 'ratings'] })
      queryClient.invalidateQueries({ queryKey: ['communities', 'post', postId] })
      setBaseRating(0)
      setQualityRating(0)
      setTechniqueRating(0)
      setCreativityRating(0)
    },
  })

  const handleSubmit = () => {
    if (baseRating === 0) return
    rateMutation.mutate({
      postId,
      params: {
        base_rating: baseRating,
        ...(showDetailed && qualityRating > 0 && { quality_rating: qualityRating }),
        ...(showDetailed && techniqueRating > 0 && { technique_rating: techniqueRating }),
        ...(showDetailed && creativityRating > 0 && { creativity_rating: creativityRating }),
      },
    })
  }

  return (
    <Stack gap={12}>
      <Text style={{ fontWeight: '600' }}>Rate this post</Text>
      <StarRating value={baseRating} onChange={setBaseRating} size={28} label="Overall" />

      {!showDetailed ? (
        <Button variant="outline" size="sm" onPress={() => setShowDetailed(true)}>
          Add detailed ratings (+10 rep)
        </Button>
      ) : (
        <Stack gap={8}>
          <StarRating value={qualityRating} onChange={setQualityRating} size={22} label="Quality" />
          <StarRating
            value={techniqueRating}
            onChange={setTechniqueRating}
            size={22}
            label="Technique"
          />
          <StarRating
            value={creativityRating}
            onChange={setCreativityRating}
            size={22}
            label="Creativity"
          />
        </Stack>
      )}

      <Button
        variant="filled"
        size="sm"
        onPress={handleSubmit}
        disabled={baseRating === 0 || rateMutation.isPending}
      >
        {rateMutation.isPending ? 'Submitting...' : 'Submit Rating'}
      </Button>
    </Stack>
  )
}
