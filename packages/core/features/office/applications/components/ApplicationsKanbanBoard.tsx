import React, { useMemo, useState, useCallback, useEffect } from 'react'
import { ScrollView } from 'react-native'
import { XStack, YStack, Text, Card, Avatar, type GetThemeValueForKey, Button } from 'tamagui'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { DroppableColumn, DraggableCard } from '@app/ui'
import { CheckSquare, Square } from '@tamagui/lucide-icons'
import { api } from '@app/core/utils/api'
import type { MockApplication, ApplicationStatus } from '../../mock-data/ats-mock-data'
import { CandidateDetailModal } from './CandidateDetailModal'
import { ApplicationStatusChangeModal } from './ApplicationStatusChangeModal'
import { InquiryStatusBadges } from './kanban/InquiryStatusBadges'
import { BulkInquiryModal } from '@app/core/features/inquiries/components/BulkInquiryModal'
import { InquiryComparisonView } from '@app/core/features/inquiries/components/InquiryComparisonView'
import { useApplicationStatusChange } from '../hooks/useApplicationStatusChange'

const STATUSES: ApplicationStatus[] = ['new', 'screen', 'inquired', 'interview', 'offer', 'hired', 'rejected']

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  new: 'New Applications',
  screen: 'Screening',
  inquired: 'Inquired',
  interview: 'Interview',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Rejected',
}

const STATUS_COLORS: Record<ApplicationStatus, GetThemeValueForKey<'backgroundColor'>> = {
  new: '$blue9',
  screen: '$yellow9',
  inquired: '$purple9',
  interview: '$red9',
  offer: '$green9',
  hired: '$green11',
  rejected: '$red9',
}

interface ApplicationsKanbanBoardProps {
  applications: MockApplication[]
}

export const ApplicationsKanbanBoard = ({ applications }: ApplicationsKanbanBoardProps) => {
  const [selectedApplication, setSelectedApplication] = useState<MockApplication | null>(null)
  const [selectedApplicationIds, setSelectedApplicationIds] = useState<Set<string>>(new Set())
  const [showBulkInquiry, setShowBulkInquiry] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [comparisonInquiryIds, setComparisonInquiryIds] = useState<string[]>([])

  // Fetch inquiry IDs for selected applications
  const selectedApplications = useMemo(
    () =>
      Array.from(selectedApplicationIds)
        .map((id) => applications.find((app) => app.id === id))
        .filter((app): app is MockApplication => !!app && app.status === 'inquired'),
    [selectedApplicationIds, applications]
  )

  const utils = api.useUtils()

  // Fetch inquiry IDs when selection changes
  useEffect(() => {
    const fetchInquiryIds = async () => {
      const ids: string[] = []
      const map: Record<string, string> = {}

      for (const app of selectedApplications) {
        try {
          const inquiryData = await utils.inquiries.getByApplication.fetch({
            applicationId: app.id,
          })
          if (inquiryData?.inquiry?.id) {
            ids.push(inquiryData.inquiry.id)
            map[inquiryData.inquiry.id] = app.id
          }
        } catch {
          // Skip applications without inquiries
        }
      }

      setComparisonInquiryIds(ids)
      setInquiryToApplicationMap(map)
    }

    if (selectedApplications.length >= 2) {
      fetchInquiryIds()
    } else {
      setComparisonInquiryIds([])
      setInquiryToApplicationMap({})
    }
  }, [selectedApplications, utils])

  const { changeStatus, isChanging, pendingChange, confirmChange, cancelChange } =
    useApplicationStatusChange()

  const toggleApplicationSelection = (applicationId: string) => {
    setSelectedApplicationIds((prev) => {
      const next = new Set(prev)
      if (next.has(applicationId)) {
        next.delete(applicationId)
      } else {
        next.add(applicationId)
      }
      return next
    })
  }

  const clearSelection = () => {
    setSelectedApplicationIds(new Set())
  }

  const handleRemoveComparisonInquiry = (inquiryId: string) => {
    setComparisonInquiryIds((prev) => {
      const next = prev.filter((id) => id !== inquiryId)
      if (next.length < 2) {
        setShowComparison(false)
      }
      return next
    })
    setInquiryToApplicationMap((prev) => {
      const next = { ...prev }
      const applicationId = next[inquiryId]
      delete next[inquiryId]
      if (applicationId) {
        setSelectedApplicationIds((current) => {
          const nextSet = new Set(current)
          nextSet.delete(applicationId)
          return nextSet
        })
      }
      return next
    })
  }

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement required to start drag
      },
    })
  )

  // Group applications by status
  const groupedApplications = useMemo(() => {
    return STATUSES.reduce(
      (acc, status) => {
        acc[status] = applications.filter((app) => app.status === status)
        return acc
      },
      {} as Record<ApplicationStatus, MockApplication[]>
    )
  }, [applications])

  const pendingApplication = pendingChange
    ? applications.find((app) => app.id === pendingChange.applicationId)
    : null

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) return

    const applicationId = active.id as string
    const newStatus = over.id as ApplicationStatus

    // Find the application being moved
    const application = applications.find((app) => app.id === applicationId)
    if (!application) return

    // Trigger status change (will show modal if critical)
    changeStatus({
      applicationId,
      fromStatus: application.status,
      toStatus: newStatus,
    })
  }

  const handleDragCancel = () => {
    setActiveId(null)
  }

  // Find active application for drag overlay
  const activeApplication = activeId ? applications.find((app) => app.id === activeId) : null

  return (
    <>
      {/* Bulk Action Bar */}
      {selectedApplicationIds.size > 0 && (
        <XStack
          gap="$3"
          p="$3"
          bg="$blue2"
          items="center"
          justify="space-between"
          borderBottomWidth={1}
          borderBottomColor="$borderColor"
          flexWrap="wrap"
          $sm={{ flexDirection: 'column', items: 'stretch' }}
        >
          <Text fontSize="$4" fontWeight="600">
            {selectedApplicationIds.size} candidate{selectedApplicationIds.size !== 1 ? 's' : ''} selected
          </Text>
          <XStack gap="$2" flexWrap="wrap" $sm={{ width: '100%', flexDirection: 'column' }}>
            <Button
              size="$3"
              variant="outlined"
              onPress={clearSelection}
              $sm={{ width: '100%' }}
            >
              Clear
            </Button>
            {selectedApplications.length >= 2 &&
              selectedApplications.length <= 5 &&
              comparisonInquiryIds.length >= 2 && (
                <Button
                  size="$3"
                  theme="blue"
                  variant="outlined"
                  onPress={() => {
                    if (comparisonInquiryIds.length >= 2 && comparisonInquiryIds.length <= 5) {
                      setShowComparison(true)
                    }
                  }}
                  $sm={{ width: '100%' }}
                >
                  Compare {comparisonInquiryIds.length}
                </Button>
              )}
            <Button
              size="$3"
              theme="blue"
              onPress={() => setShowBulkInquiry(true)}
              $sm={{ width: '100%' }}
            >
              Send Inquiry to {selectedApplicationIds.size}
            </Button>
          </XStack>
        </XStack>
      )}

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <XStack gap="$3" pb="$4">
            {STATUSES.map((status) => (
              <StatusColumn
                key={status}
                status={status}
                label={STATUS_LABELS[status]}
                color={STATUS_COLORS[status]}
                applications={groupedApplications[status]}
                selectedApplicationIds={selectedApplicationIds}
                onSelectApplication={setSelectedApplication}
                onToggleSelection={toggleApplicationSelection}
              />
            ))}
          </XStack>
        </ScrollView>

        <DragOverlay>
          {activeApplication ? (
            <ApplicationCard application={activeApplication} onPress={() => {}} isDragging />
          ) : null}
        </DragOverlay>
      </DndContext>

      <CandidateDetailModal
        application={selectedApplication}
        open={!!selectedApplication}
        onClose={() => setSelectedApplication(null)}
      />

      {pendingChange && (
        <ApplicationStatusChangeModal
          open={true}
          onClose={cancelChange}
          onConfirm={confirmChange}
          candidateName={pendingApplication?.candidate.name || ''}
          fromStatus={pendingChange.fromStatus}
          toStatus={pendingChange.toStatus}
          isLoading={isChanging}
          application={pendingApplication || undefined}
        />
      )}

      <BulkInquiryModal
        open={showBulkInquiry}
        onClose={() => {
          setShowBulkInquiry(false)
          clearSelection()
        }}
        applicationIds={Array.from(selectedApplicationIds)}
      />

      {showComparison && (
        <InquiryComparisonModal
          inquiryIds={comparisonInquiryIds}
          open={showComparison}
          onClose={() => {
            setShowComparison(false)
          }}
          onRemoveInquiry={handleRemoveComparisonInquiry}
        />
      )}
    </>
  )
}

interface InquiryComparisonModalProps {
  inquiryIds: string[]
  open: boolean
  onClose: () => void
  onRemoveInquiry?: (inquiryId: string) => void
}

function InquiryComparisonModal({
  inquiryIds,
  open,
  onClose,
  onRemoveInquiry,
}: InquiryComparisonModalProps) {
  if (!open || inquiryIds.length < 2) {
    return null
  }

  return (
    <YStack
      bg="$background"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}
    >
      <InquiryComparisonView
        inquiryIds={inquiryIds}
        onClose={onClose}
        onRemoveInquiry={onRemoveInquiry}
      />
    </YStack>
  )
}

interface StatusColumnProps {
  status: ApplicationStatus
  label: string
  color: GetThemeValueForKey<'backgroundColor'>
  applications: MockApplication[]
  selectedApplicationIds: Set<string>
  onSelectApplication: (application: MockApplication) => void
  onToggleSelection: (applicationId: string) => void
}

const StatusColumn = ({
  status,
  label,
  color,
  applications,
  selectedApplicationIds,
  onSelectApplication,
  onToggleSelection,
}: StatusColumnProps) => {
  return (
    <DroppableColumn id={status} items={applications.map((app) => app.id)}>
      <YStack data-testid={`kanban-column-${status}`} width={300} bg="$color2" rounded="$4" p="$3">
        {/* Column Header */}
        <XStack justify="space-between" items="center" mb="$3">
          <XStack gap="$2" items="center">
            <YStack width={8} height={8} rounded="$10" bg={color} />
            <Text fontWeight="600" fontSize="$4">
              {label}
            </Text>
          </XStack>
          <YStack bg="$color5" px="$2" py="$1" rounded="$2">
            <Text fontSize="$2">{applications.length}</Text>
          </YStack>
        </XStack>

        {/* Application Cards */}
        <YStack gap="$2" flex={1}>
          {applications.length === 0 ? (
            <Card p="$4" bg="gray">
              <Text fontSize="$2" text="center">
                No applications
              </Text>
            </Card>
          ) : (
            applications.map((app) => (
              <DraggableCard key={app.id} id={app.id}>
                <ApplicationCard
                  application={app}
                  isSelected={selectedApplicationIds.has(app.id)}
                  onPress={() => onSelectApplication(app)}
                  onToggleSelection={(e) => {
                    e.stopPropagation()
                    onToggleSelection(app.id)
                  }}
                />
              </DraggableCard>
            ))
          )}
        </YStack>
      </YStack>
    </DroppableColumn>
  )
}

interface ApplicationCardProps {
  application: MockApplication
  isSelected?: boolean
  onPress: () => void
  onToggleSelection?: (e: { stopPropagation: () => void }) => void
  isDragging?: boolean
}

const ApplicationCard = ({
  application,
  isSelected = false,
  onPress,
  onToggleSelection,
}: ApplicationCardProps) => {
  const appliedDate = new Date(application.appliedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  const scoreColor =
    application.score >= 80 ? '$green10' : application.score >= 60 ? '$blue10' : '$red10'
  const scoreBg = application.score >= 80 ? '$green3' : application.score >= 60 ? '$blue3' : '$red3'

  // Fetch inquiry data if status is 'inquired'
  const { data: inquiryData } = api.inquiries.getByApplication.useQuery(
    { applicationId: application.id },
    { enabled: application.status === 'inquired' }
  )

  return (
    <Card
      data-testid={`kanban-card-${application.id}`}
      p="$3"
      bg={isSelected ? '$blue3' : '$background'}
      borderWidth={isSelected ? 2 : 0}
      borderColor="$blue9"
      hoverStyle={{
        bg: isSelected ? '$blue4' : 'gray',
      }}
      pressStyle={{ scale: 0.98 }}
      animation="quick"
      elevate
      onPress={onPress}
    >
      {/* Selection Checkbox */}
      {onToggleSelection && (
        <XStack
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 10,
          }}
        >
          <Button
            size="$2"
            circular
            unstyled
            onPress={onToggleSelection}
            bg={isSelected ? '$blue9' : '$color5'}
            items="center"
            justify="center"
            width={24}
            height={24}
          >
            {isSelected ? (
              <CheckSquare size={16} color="white" />
            ) : (
              <Square size={16} color="$color11" />
            )}
          </Button>
        </XStack>
      )}

      {/* Candidate Info */}
      <XStack gap="$3" items="flex-start" mb="$2">
        <Avatar circular size="$4">
          <Avatar.Image src={application.candidate.photo} />
          <Avatar.Fallback bg="$blue9">
            <Text color="white" fontWeight="600">
              {application.candidate.name.charAt(0)}
            </Text>
          </Avatar.Fallback>
        </Avatar>

        <YStack flex={1}>
          <Text fontWeight="600" fontSize="$4" numberOfLines={1}>
            {application.candidate.name}
          </Text>
          <Text fontSize="$2" numberOfLines={1} opacity={0.6}>
            {application.candidate.title}
          </Text>
        </YStack>
      </XStack>

      {/* Score and Date */}
      <XStack justify="space-between" items="center" mt="$2">
        <YStack bg={scoreBg} px="$2" py="$1" rounded="$2">
          <Text fontSize="$2" fontWeight="600" color={scoreColor}>
            Score: {application.score}
          </Text>
        </YStack>

        <Text fontSize="$1" opacity={0.6}>
          {appliedDate}
        </Text>
      </XStack>

      {/* Job Info */}
      <Text fontSize="$1" mt="$2" numberOfLines={1} opacity={0.6}>
        {application.job.title}
      </Text>

      {/* Inquiry Status Badges */}
      {application.status === 'inquired' && inquiryData?.inquiry && (
        <InquiryStatusBadges
          inquiryData={{
            sections: inquiryData.sections,
            comments: inquiryData.comments,
            capabilityResponses: inquiryData.capabilityResponses,
          }}
        />
      )}
    </Card>
  )
}
