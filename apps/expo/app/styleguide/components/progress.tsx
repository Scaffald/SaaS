// @ts-nocheck
import React from 'react'
import { Text, YStack } from '@app/ui'
import { StyleguidePage } from '@app/styleguide'
import { AnchorHeading } from '@app/styleguide'
import { ExampleCard } from '@app/styleguide'

const PROGRESS = [
  { label: 'Primary', percent: 65, color: '$color9' },
  { label: 'Success', percent: 90, color: '$color10' },
  { label: 'Warning', percent: 35, color: '$color8' },
]

export default function ProgressPage() {
  return (
    <StyleguidePage
      title="Progress"
      description="Determinate progress bars modeled after Bootstrap 2 components."
    >
      <YStack gap="$6">
        <AnchorHeading
          id="progress-bars"
          title="Progress bars"
          description="Wrap Text and progress track in YStack and apply tokens for color."
        />
        <ExampleCard
          title="Project progress"
          description="Progress track with percentage labels."
          code={`<YStack>
  <Text>Deployment readiness</Text>
  <YStack height={12} borderRadius={999} bg="$color4">
    <YStack width="65%" bg="$color9" />
  </YStack>
</YStack>`}
        >
          <YStack gap="$3">
            {PROGRESS.map((progress) => (
              <ProgressTrack key={progress.label} {...progress} />
            ))}
          </YStack>
        </ExampleCard>
      </YStack>
    </StyleguidePage>
  )
}

type ProgressTrackProps = {
  label: string
  percent: number
  color: string
}

const ProgressTrack = ({ label, percent, color }: ProgressTrackProps) => (
  <YStack gap={4}>
    <Text fontSize={13} color="$color11" fontWeight="600">
      {label} — {percent}%
    </Text>
    <YStack height={12} borderRadius={999} bg="$color4" overflow="hidden">
      <YStack width={`${percent}%`} height="100%" bg={color} borderRadius={999} />
    </YStack>
  </YStack>
)
