export type NudgeMessageType = 'social_proof' | 'loss_aversion' | 'personalized_benefit'

export interface NudgeMessage {
  id: string
  type: NudgeMessageType
  message: string
  userType?: 'worker' | 'employer'
  incompleteSection?: string
}

const BASE_MESSAGES: NudgeMessage[] = [
  {
    id: 'worker-social-proof-1',
    type: 'social_proof',
    userType: 'worker',
    message: '85% of workers who finish their profile get contacted in the first week.',
  },
  {
    id: 'worker-loss-1',
    type: 'loss_aversion',
    userType: 'worker',
    message: 'Incomplete profiles appear in 70% fewer searches. Don’t miss out on new projects.',
  },
  {
    id: 'worker-benefit-skills',
    type: 'personalized_benefit',
    userType: 'worker',
    incompleteSection: 'skills',
    message: 'Workers with at least 5 skills listed receive 3× more profile views.',
  },
  {
    id: 'worker-benefit-experience',
    type: 'personalized_benefit',
    userType: 'worker',
    incompleteSection: 'experience',
    message: 'Share your latest role to unlock experience badges employers filter for.',
  },
  {
    id: 'worker-benefit-preferences',
    type: 'personalized_benefit',
    userType: 'worker',
    incompleteSection: 'preferences',
    message: 'Adding your work preferences matches you with shift alerts tailored to you.',
  },
  {
    id: 'employer-social-proof-1',
    type: 'social_proof',
    userType: 'employer',
    message: 'Verified company profiles attract 2× more qualified applicants.',
  },
  {
    id: 'employer-loss-1',
    type: 'loss_aversion',
    userType: 'employer',
    message: 'Teams without full profiles receive 60% fewer introductions from the marketplace.',
  },
  {
    id: 'employer-benefit-team',
    type: 'personalized_benefit',
    userType: 'employer',
    incompleteSection: 'organization',
    message: 'Showcase your organization to unlock company spotlights and featured listings.',
  },
]

interface GetNextNudgeMessageParams {
  lastMessageId: string | null
  userType: 'worker' | 'employer'
  incompleteSections: string[]
}

export function getNextNudgeMessage({
  lastMessageId,
  userType,
  incompleteSections,
}: GetNextNudgeMessageParams): NudgeMessage | null {
  const messagesForUser = BASE_MESSAGES.filter((message) => !message.userType || message.userType === userType)

  if (messagesForUser.length === 0) {
    return null
  }

  const prioritized = [
    ...messagesForUser.filter(
      (message) =>
        message.type === 'personalized_benefit' &&
        message.incompleteSection &&
        incompleteSections.includes(message.incompleteSection),
    ),
    ...messagesForUser.filter((message) => message.type === 'social_proof'),
    ...messagesForUser.filter((message) => message.type === 'loss_aversion'),
  ]

  const uniquePrioritized = prioritized.filter(
    (message, index, self) => self.findIndex((item) => item.id === message.id) === index,
  )

  if (uniquePrioritized.length === 0) {
    return null
  }

  if (!lastMessageId) {
    return uniquePrioritized[0]
  }

  const currentIndex = uniquePrioritized.findIndex((message) => message.id === lastMessageId)
  if (currentIndex === -1) {
    return uniquePrioritized[0]
  }

  const nextIndex = (currentIndex + 1) % uniquePrioritized.length
  return uniquePrioritized[nextIndex]
}


