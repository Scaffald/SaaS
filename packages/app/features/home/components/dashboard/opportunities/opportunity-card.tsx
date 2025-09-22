import { Button, Paragraph, SizableText, XStack, YStack } from '@app/ui'
import type { ReactNode } from 'react'

export type OpportunityAction = {
  id: string
  label: string
  intent?: 'solid' | 'outline' | 'ghost'
  onPress?: () => void
}

export type OpportunityItem = {
  id: string
  title: string
  company: string
  location: string
  meta?: string
  statusLabel?: string
  statusTone?: 'default' | 'success' | 'warning'
  actions?: OpportunityAction[]
}

export type OpportunityCardProps = {
  item: OpportunityItem
}

export const OpportunityCard = ({ item }: OpportunityCardProps) => {
  return (
    <XStack
      ai="flex-start"
      jc="space-between"
      gap="$4"
      py="$3"
      px="$1"
      $sm={{ fd: 'column', gap: '$3' }}
    >
      <YStack gap="$1" f={1}>
        <SizableText size="$4" fontWeight="600">
          {item.title}
        </SizableText>
        <Paragraph size="$2" color="$gray11">
          {item.company}
          {item.location ? ` · ${item.location}` : ''}
        </Paragraph>
        {item.meta ? (
          <Paragraph size="$1" color="$gray10">
            {item.meta}
          </Paragraph>
        ) : null}
      </YStack>

      <YStack gap="$2" ai="flex-end" $sm={{ ai: 'flex-start' }}>
        {item.statusLabel ? (
          <StatusPill tone={item.statusTone}>{item.statusLabel}</StatusPill>
        ) : null}
        {item.actions?.length ? (
          <XStack gap="$2" $sm={{ fd: 'row-reverse' }}>
            {item.actions.map((action) => (
              <Button
                key={action.id}
                size="$2"
                onPress={action.onPress}
                {...getButtonVariantProps(action.intent)}
              >
                {action.label}
              </Button>
            ))}
          </XStack>
        ) : null}
      </YStack>
    </XStack>
  )
}

const StatusPill = ({
  children,
  tone = 'default',
}: { children: ReactNode; tone?: OpportunityItem['statusTone'] }) => {
  const palette = STATUS_TONES[tone ?? 'default']
  return (
    <XStack
      px="$2"
      py={6}
      br={9999}
      bg={palette.bg}
      boc={palette.border}
      bw={1}
      ai="center"
      jc="center"
    >
      <Paragraph size="$1" color={palette.text}>
        {children}
      </Paragraph>
    </XStack>
  )
}

const STATUS_TONES: Record<
  'default' | 'success' | 'warning',
  { bg: string; border: string; text: string }
> = {
  default: {
    bg: '$gray3',
    border: '$gray5',
    text: '$gray11',
  },
  success: {
    bg: '$green3',
    border: '$green6',
    text: '$green11',
  },
  warning: {
    bg: '$yellow3',
    border: '$yellow6',
    text: '$yellow11',
  },
}

const getButtonVariantProps = (intent: OpportunityAction['intent']) => {
  switch (intent) {
    case 'outline':
      return { variant: 'outlined' as const }
    case 'ghost':
      return { chromeless: true }
    default:
      return {}
  }
}
