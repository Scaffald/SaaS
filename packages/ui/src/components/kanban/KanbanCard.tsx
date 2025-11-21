import { Clock, Eye, MessageSquare, MoreVertical, Paperclip } from '@tamagui/lucide-icons'
import { memo, useState } from 'react'
import { Avatar, Button, Card, Text, XStack, YStack } from 'tamagui'
import { Chip } from '../chips/Chip'
import { ProgressBar } from './ProgressBar'

export interface KanbanCardProps {
  /** Unique identifier for the card */
  id: string | number
  /** Applicant name */
  applicantName: string
  /** Optional applicant avatar URL */
  applicantAvatar?: string
  /** Job title applied for */
  jobTitle: string
  /** Application submission date */
  applicationDate: Date
  /** Application score (0-100) */
  score: number
  /** Current status */
  status: string
  /** Optional tags for categorization */
  tags?: string[]
  /** Optional attachment count */
  attachmentCount?: number
  /** Optional comment count */
  commentCount?: number
  /** Optional duration in days */
  durationDays?: number
  /** Optional callback when view is clicked */
  onView?: () => void
  /** Optional callback when edit is clicked */
  onEdit?: () => void
  /** Whether the card is selected */
  isSelected?: boolean
  /** Optional callback to toggle selection */
  onToggleSelection?: () => void
  /** Whether the card is being dragged */
  isDragging?: boolean
}

/**
 * KanbanCard - Enhanced card component for Kanban boards with rich metadata
 *
 * Displays applicant information, scores, status, and metadata in a modern card format.
 * Supports selection, drag states, and quick actions.
 *
 * @example
 * ```tsx
 * <KanbanCard
 *   id="app-1"
 *   applicantName="John Doe"
 *   applicantAvatar="/avatar.jpg"
 *   jobTitle="Software Engineer"
 *   applicationDate={new Date()}
 *   score={85}
 *   status="interview"
 *   attachmentCount={3}
 *   commentCount={5}
 *   durationDays={7}
 *   onView={() => console.log('View')}
 *   isSelected={false}
 *   isDragging={false}
 * />
 * ```
 */
export const KanbanCard = memo(
  ({
    id,
    applicantName,
    applicantAvatar,
    jobTitle,
    applicationDate,
    score,
    status: _status,
    tags = [],
    attachmentCount = 0,
    commentCount = 0,
    durationDays,
    onView,
    onEdit,
    isSelected = false,
    onToggleSelection,
    isDragging = false,
  }: KanbanCardProps) => {
    const [isHovered, setIsHovered] = useState(false)

    // Format date
    const formattedDate = applicationDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })

    // Determine score priority and colors
    const scorePriority = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low'
    const scoreColor = score >= 80 ? '$green9' : score >= 60 ? '$blue9' : '$red9'

    // Format duration
    const durationText = durationDays !== undefined ? `${durationDays}d` : null

    return (
      <Card
        data-testid={`kanban-card-${id}`}
        p="$4"
        bg={isSelected ? '$blue3' : '$background'}
        borderWidth={isSelected ? 2 : 0}
        borderColor="$blue9"
        rounded="$4"
        gap="$3"
        opacity={isDragging ? 0.5 : 1}
        elevate={isDragging}
        hoverStyle={{
          bg: isSelected ? '$blue4' : '$gray2',
          elevate: true,
        }}
        pressStyle={{ scale: 0.98 }}
        animation="quick"
        onHoverIn={() => setIsHovered(true)}
        onHoverOut={() => setIsHovered(false)}
        cursor="pointer"
      >
        {/* Header: Selection checkbox and quick actions */}
        <XStack justify="space-between" items="flex-start">
          {onToggleSelection && (
            <Button
              size="$2"
              circular
              unstyled
              onPress={(e) => {
                e.stopPropagation()
                onToggleSelection()
              }}
              bg={isSelected ? '$blue9' : '$color5'}
              items="center"
              justify="center"
              width={24}
              height={24}
            >
              <Text color={isSelected ? 'white' : '$color11'} fontSize="$3">
                {isSelected ? '✓' : ''}
              </Text>
            </Button>
          )}

          {/* Quick action buttons (visible on hover) */}
          {(isHovered || isSelected) && (onView || onEdit) && (
            <XStack gap="$1" opacity={isHovered ? 1 : 0.7}>
              {onView && (
                <Button
                  size="$2"
                  circular
                  unstyled
                  onPress={(e) => {
                    e.stopPropagation()
                    onView()
                  }}
                  bg="$color5"
                  items="center"
                  justify="center"
                  width={24}
                  height={24}
                  hoverStyle={{ bg: '$color6' }}
                >
                  <Eye size={14} color="$color11" />
                </Button>
              )}
              {onEdit && (
                <Button
                  size="$2"
                  circular
                  unstyled
                  onPress={(e) => {
                    e.stopPropagation()
                    onEdit()
                  }}
                  bg="$color5"
                  items="center"
                  justify="center"
                  width={24}
                  height={24}
                  hoverStyle={{ bg: '$color6' }}
                >
                  <MoreVertical size={14} color="$color11" />
                </Button>
              )}
            </XStack>
          )}
        </XStack>

        {/* Applicant Info */}
        <XStack gap="$3" items="flex-start">
          <Avatar circular size="$4">
            {applicantAvatar ? <Avatar.Image src={applicantAvatar} /> : null}
            <Avatar.Fallback bg="$blue9">
              <Text color="white" fontWeight="600" fontSize="$3">
                {applicantName.charAt(0).toUpperCase()}
              </Text>
            </Avatar.Fallback>
          </Avatar>

          <YStack flex={1} gap="$1">
            <Text fontWeight="600" fontSize="$4" numberOfLines={1}>
              {applicantName}
            </Text>
            <Text fontSize="$2" numberOfLines={1} color="$color10">
              {jobTitle}
            </Text>
          </YStack>
        </XStack>

        {/* Score Badge and Progress */}
        <YStack gap="$2">
          <XStack justify="space-between" items="center">
            <Chip priority={scorePriority} fontSize="$2" px="$2" py="$1">
              Score: {score}
            </Chip>
            <Text fontSize="$1" color="$color10">
              {formattedDate}
            </Text>
          </XStack>
          <ProgressBar value={score} color={scoreColor} size={4} />
        </YStack>

        {/* Tags */}
        {tags.length > 0 && (
          <XStack gap="$2" flexWrap="wrap">
            {tags.slice(0, 3).map((tag) => (
              <Chip key={tag} variant="default" fontSize="$1" px="$2" py="$1">
                {tag}
              </Chip>
            ))}
            {tags.length > 3 && (
              <Text fontSize="$1" color="$color10">
                +{tags.length - 3}
              </Text>
            )}
          </XStack>
        )}

        {/* Metadata Footer */}
        <XStack gap="$3" items="center" mt="$1">
          {attachmentCount > 0 && (
            <XStack gap="$1" items="center">
              <Paperclip size={12} color="$color10" />
              <Text fontSize="$1" color="$color10">
                {attachmentCount}
              </Text>
            </XStack>
          )}
          {commentCount > 0 && (
            <XStack gap="$1" items="center">
              <MessageSquare size={12} color="$color10" />
              <Text fontSize="$1" color="$color10">
                {commentCount}
              </Text>
            </XStack>
          )}
          {durationText && (
            <XStack gap="$1" items="center">
              <Clock size={12} color="$color10" />
              <Text fontSize="$1" color="$color10">
                {durationText}
              </Text>
            </XStack>
          )}
        </XStack>
      </Card>
    )
  }
)

KanbanCard.displayName = 'KanbanCard'
