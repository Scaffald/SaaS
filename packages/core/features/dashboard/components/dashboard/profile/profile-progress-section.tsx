import { ArrowRight, CheckCircle2, CircleDashed, ShieldAlert } from '@tamagui/lucide-icons'
import { Button, Paragraph, SizableText, Separator, XStack, YStack } from '@app/ui'
import { Link } from 'expo-router'

import { DashboardWidget, SectionHeading } from '../primitives'

export type ChecklistItem = {
  id: string
  label: string
  points?: number
  completed?: boolean
}

export type AdvancedTask = {
  id: string
  label: string
  description: string
  points?: number
  paid?: boolean
  ctaLabel: string
  ctaRoute?: string
}

export type ProfileProgressSectionProps = {
  checklist: ChecklistItem[]
  advanced: AdvancedTask[]
}

export const ProfileProgressSection = ({ checklist, advanced }: ProfileProgressSectionProps) => {
  return (
    <DashboardWidget gap="$5">
      <SectionHeading
        title="Complete your profile"
        subtitle="Each task helps recruiters understand your experience."
      />

      <YStack gap="$2">
        {checklist.map((item) => (
          <ChecklistRow key={item.id} item={item} />
        ))}
      </YStack>

      <Separator borderColor="$borderColor" />

      <YStack gap="$4">
        {advanced.map((task) => (
          <AdvancedTaskRow key={task.id} task={task} />
        ))}
      </YStack>
    </DashboardWidget>
  )
}

const ChecklistRow = ({ item }: { item: ChecklistItem }) => {
  return (
    <XStack ai="center" gap="$3">
      {item.completed ? (
        <CheckCircle2 size={18} color="$green10" />
      ) : (
        <CircleDashed size={18} color="$gray10" />
      )}
      <SizableText f={1} size="$3" fontWeight="500">
        {item.label}
      </SizableText>
      {item.points ? (
        <SizableText size="$2" color="$gray11">
          +{item.points}
        </SizableText>
      ) : null}
    </XStack>
  )
}

const AdvancedTaskRow = ({ task }: { task: AdvancedTask }) => {
  return (
    <YStack gap="$2">
      <XStack
        ai="center"
        gap="$3"
        jc="space-between"
        $sm={{ fd: 'column', ai: 'flex-start', gap: '$2' }}
      >
        <YStack gap="$1" f={1}>
          <XStack ai="center" gap="$2">
            <SizableText size="$3" fontWeight="600">
              {task.label}
            </SizableText>
            {task.points ? (
              <SizableText size="$2" color="$gray11">
                +{task.points}
              </SizableText>
            ) : null}
            {task.paid ? <PaidBadge /> : null}
          </XStack>
          <Paragraph size="$2" color="$gray11">
            {task.description}
          </Paragraph>
        </YStack>
        {task.ctaRoute ? (
          <Link href={task.ctaRoute} asChild>
            <Button size="$2" iconAfter={ArrowRight}>
              {task.ctaLabel}
            </Button>
          </Link>
        ) : (
          <Button size="$2" iconAfter={ArrowRight} disabled>
            {task.ctaLabel}
          </Button>
        )}
      </XStack>
    </YStack>
  )
}

const PaidBadge = () => (
  <XStack ai="center" gap={4} px="$2" py={4} br={9999} bg="$yellow3" boc="$yellow6" bw={1}>
    <ShieldAlert size={14} color="$yellow11" />
    <Paragraph size="$1" color="$yellow11">
      Paid feature
    </Paragraph>
  </XStack>
)
