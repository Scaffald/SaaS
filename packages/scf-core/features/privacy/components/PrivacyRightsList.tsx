/**
 * Privacy Rights List Component
 * CCPA Compliance Implementation
 *
 * Displays the user's CCPA privacy rights with descriptions
 * and links to exercise each right
 */

import { Text, Row, Stack } from '@unicornlove/beyond-ui'

/**
 * Privacy right structure
 */
interface PrivacyRight {
  id: string
  title: string
  description: string
  actionLabel?: string
  actionType?: 'export' | 'delete' | 'optout' | 'correct' | 'info'
}

/**
 * CCPA Rights definitions
 */
const CCPA_RIGHTS: PrivacyRight[] = [
  {
    id: 'know',
    title: 'Right to Know',
    description:
      'You have the right to request that we disclose what personal information we collect, use, disclose, and sell about you. This includes the categories of personal information, the sources, the business purposes, and the categories of third parties with whom we share your information.',
    actionLabel: 'Request My Data',
    actionType: 'export',
  },
  {
    id: 'delete',
    title: 'Right to Delete',
    description:
      'You have the right to request the deletion of your personal information that we have collected from you, subject to certain exceptions. Some information may be retained for legal, regulatory, or business purposes.',
    actionLabel: 'Request Deletion',
    actionType: 'delete',
  },
  {
    id: 'optout',
    title: 'Right to Opt-Out',
    description:
      'You have the right to opt-out of the sale or sharing of your personal information. We honor Global Privacy Control (GPC) signals from your browser. You can also manually opt-out through your privacy settings.',
    actionLabel: 'Manage Opt-Outs',
    actionType: 'optout',
  },
  {
    id: 'correct',
    title: 'Right to Correct',
    description:
      'You have the right to request the correction of inaccurate personal information that we maintain about you, taking into account the nature and purposes of processing.',
    actionLabel: 'Request Correction',
    actionType: 'correct',
  },
  {
    id: 'nondiscrimination',
    title: 'Right to Non-Discrimination',
    description:
      'You have the right not to receive discriminatory treatment for exercising your privacy rights. We will not deny you goods or services, charge different prices, or provide a different level of quality based on your privacy choices.',
    actionType: 'info',
  },
  {
    id: 'limit',
    title: 'Right to Limit Use of Sensitive Information',
    description:
      'You have the right to limit the use and disclosure of your sensitive personal information to only what is necessary for performing services or providing goods.',
    actionLabel: 'Limit Sensitive Data Use',
    actionType: 'optout',
  },
]

/**
 * Action type to color mapping
 */
const ACTION_COLORS: Record<string, string> = {
  export: '$blue10',
  delete: '$red10',
  optout: '$orange10',
  correct: '$purple10',
  info: '$color11',
}

/**
 * Single privacy right card
 */
function RightCard({
  right,
  onAction,
}: {
  right: PrivacyRight
  onAction?: (rightId: string, actionType: string) => void
}) {
  const handleAction = () => {
    if (right.actionType && onAction) {
      onAction(right.id, right.actionType)
    }
  }

  return (
    <Stack
      padding="$4"
      backgroundColor="$color2"
      borderRadius="$3"
      borderWidth={1}
      borderColor="$borderColor"
      gap="$3"
    >
      <Row gap="$2" alignItems="center">
        <Stack
          width={8}
          height={8}
          borderRadius={4}
          backgroundColor="$green10"
        />
        <Text fontSize="$5" fontWeight="600">
          {right.title}
        </Text>
      </Row>

      <Text fontSize="$3" color="$color11" lineHeight="$4">
        {right.description}
      </Text>

      {right.actionLabel && right.actionType !== 'info' && (
        <Text
          fontSize="$3"
          color={ACTION_COLORS[right.actionType || 'info']}
          fontWeight="500"
          cursor="pointer"
          hoverStyle={{ textDecorationLine: 'underline' }}
          onPress={handleAction}
        >
          {right.actionLabel} →
        </Text>
      )}
    </Stack>
  )
}

/**
 * Props for PrivacyRightsList
 */
interface PrivacyRightsListProps {
  onAction?: (rightId: string, actionType: string) => void
}

/**
 * Privacy Rights List Component
 *
 * Displays all CCPA rights with descriptions and action links
 */
export function PrivacyRightsList({ onAction }: PrivacyRightsListProps) {
  return (
    <Stack gap="$3">
      {CCPA_RIGHTS.map((right) => (
        <RightCard key={right.id} right={right} onAction={onAction} />
      ))}

      {/* Legal reference */}
      <Stack
        padding="$3"
        backgroundColor="$color3"
        borderRadius="$2"
        marginTop="$2"
      >
        <Text fontSize="$2" color="$color10">
          These rights are provided under the California Consumer Privacy Act (CCPA) and
          California Privacy Rights Act (CPRA). To exercise any of these rights, you can use
          the quick actions at the top of this page or contact our Privacy Team.
        </Text>
      </Stack>
    </Stack>
  )
}

export default PrivacyRightsList
