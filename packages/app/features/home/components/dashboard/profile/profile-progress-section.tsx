import { ArrowRight, CheckCircle2, CircleDashed, ShieldAlert } from '@tamagui/lucide-icons'
import { Button, ListItem, Paragraph, Separator, XStack, YGroup, YStack } from '@my/ui'

import { DashboardCard, SectionHeading } from '../primitives'

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
}

export type ProfileProgressSectionProps = {
  checklist: ChecklistItem[]
  advanced: AdvancedTask[]
}

export const ProfileProgressSection = ({ checklist, advanced }: ProfileProgressSectionProps) => {
  return (
    <DashboardCard gap="$5">
      <SectionHeading
        title="Complete your profile"
        subtitle="Each task helps recruiters understand your experience."
      />

      <YGroup
        bordered
        size="$3"
        separator={<Separator borderColor="$borderColor" />}
        borderRadius="$5"
      >
        {checklist.map((item) => (
          <YGroup.Item key={item.id}>
            <ChecklistRow item={item} />
          </YGroup.Item>
        ))}
      </YGroup>

      <Separator borderColor="$borderColor" />

      <YGroup
        bordered
        size="$4"
        separator={<Separator borderColor="$borderColor" />}
        borderRadius="$5"
      >
        {advanced.map((task) => (
          <YGroup.Item key={task.id}>
            <AdvancedTaskRow task={task} />
          </YGroup.Item>
        ))}
      </YGroup>
    </DashboardCard>
  )
}

const ChecklistRow = ({ item }: { item: ChecklistItem }) => {
  const Icon = item.completed ? CheckCircle2 : CircleDashed

  return (
    <ListItem
      hoverTheme
      pressTheme={false}
      size="$3"
      px="$3"
      py="$2"
      bg="transparent"
      color="$gray12"
      fontWeight="500"
      icon={({ size }) => (
        <XStack
          ai="center"
          jc="center"
          w={28}
          h={28}
          br="$4"
          bg={item.completed ? '$green3' : '$gray3'}
        >
          <Icon size={size ?? 18} color={item.completed ? '$green11' : '$gray10'} />
        </XStack>
      )}
      iconAfter={item.points ? <PointsBadge points={item.points} /> : undefined}
      title={item.label}
    />
  )
}

const AdvancedTaskRow = ({ task }: { task: AdvancedTask }) => {
  return (
    <ListItem
      hoverTheme
      pressTheme
      size="$4"
      px="$4"
      py="$3"
      gap="$3"
      bg="$color1"
      color="$gray12"
      fontWeight="600"
      flexDirection="column"
      jc="flex-start"
      alignItems="flex-start"
      $gtSm={{ fd: 'row', jc: 'space-between', ai: 'center' }}
      icon={({ size }) => (
        <XStack ai="center" jc="center" w={36} h={36} br="$4" bg="$gray3">
          <CircleDashed size={size ?? 18} color="$gray10" />
        </XStack>
      )}
      title={task.label}
      subTitle={
        <YStack gap="$2">
          <Paragraph size="$2" color="$gray11">
            {task.description}
          </Paragraph>
          <XStack gap="$2" ai="center">
            {task.points ? <PointsBadge points={task.points} /> : null}
            {task.paid ? <PaidBadge /> : null}
          </XStack>
        </YStack>
      }
      iconAfter={
        <Button size="$2" iconAfter={ArrowRight}>
          {task.ctaLabel}
        </Button>
      }
    />
  )
}

const PointsBadge = ({ points }: { points: number }) => (
  <XStack px="$2" py="$1" br="$10" bg="$gray3">
    <Paragraph size="$1" color="$gray11">
      +{points}
    </Paragraph>
  </XStack>
)

const PaidBadge = () => (
  <XStack ai="center" gap={4} px="$2" py={4} br={9999} bg="$yellow3" boc="$yellow6" bw={1}>
    <ShieldAlert size={14} color="$yellow11" />
    <Paragraph size="$1" color="$yellow11">
      Paid feature
    </Paragraph>
  </XStack>
)
