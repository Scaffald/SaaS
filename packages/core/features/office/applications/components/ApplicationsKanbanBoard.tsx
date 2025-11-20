import { BulkInquiryModal } from '@app/core/features/inquiries/components/BulkInquiryModal'
import { InquiryComparisonView } from '@app/core/features/inquiries/components/InquiryComparisonView'
import { api } from '@app/core/utils/api'
import { DraggableCard, DroppableColumn, KanbanCard } from '@app/ui'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ScrollView } from 'react-native'
import { Button, type GetThemeValueForKey, Text, XStack, YStack } from 'tamagui'
import type { ApplicationStatus, MockApplication } from '../../mock-data/ats-mock-data'
import { useApplicationStatusChange } from '../hooks/useApplicationStatusChange'
import { ApplicationStatusChangeModal } from './ApplicationStatusChangeModal'
import { CandidateDetailModal } from './CandidateDetailModal'

const STATUSES: ApplicationStatus[] = [
  'new',
  'screen',
  'inquired',
  'interview',
  'offer',
  'hired',
  'rejected',
]

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
  const [_inquiryToApplicationMap, setInquiryToApplicationMap] = useState<Record<string, string>>(
    {}
  )

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
    setInquiryToApplicationMap((prev: Record<string, string>) => {
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
            {selectedApplicationIds.size} candidate{selectedApplicationIds.size !== 1 ? 's' : ''}{' '}
            selected
          </Text>
          <XStack gap="$2" flexWrap="wrap" $sm={{ width: '100%', flexDirection: 'column' }}>
            <Button size="$3" variant="outlined" onPress={clearSelection} $sm={{ width: '100%' }}>
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
            <KanbanCard
              id={activeApplication.id}
              applicantName={activeApplication.candidate.name}
              applicantAvatar={activeApplication.candidate.photo}
              jobTitle={activeApplication.job.title}
              applicationDate={new Date(activeApplication.appliedAt)}
              score={activeApplication.score}
              status={activeApplication.status}
              attachmentCount={
                (activeApplication.attachments.resume ? 1 : 0) +
                (activeApplication.attachments.coverLetter ? 1 : 0) +
                (activeApplication.attachments.portfolio ? 1 : 0)
              }
              commentCount={activeApplication.notes.length}
              durationDays={Math.floor(
                (new Date().getTime() - new Date(activeApplication.appliedAt).getTime()) / (1000 * 60 * 60 * 24)
              )}
              isDragging
            />
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
    <DroppableColumn
      id={status}
      items={applications.map((app) => app.id)}
      title={label}
      count={applications.length}
      color={color}
      emptyMessage="No applications"
    >
      <>
        {applications.map((app) => {
          // Calculate attachment count
          const attachmentCount =
            (app.attachments.resume ? 1 : 0) +
            (app.attachments.coverLetter ? 1 : 0) +
            (app.attachments.portfolio ? 1 : 0)

          // Calculate duration in days
          const durationDays = Math.floor(
            (new Date().getTime() - new Date(app.appliedAt).getTime()) / (1000 * 60 * 60 * 24)
          )

          return (
            <DraggableCard
              key={app.id}
              id={app.id}
              kanbanCardProps={{
                applicantName: app.candidate.name,
                applicantAvatar: app.candidate.photo,
                jobTitle: app.job.title,
                applicationDate: new Date(app.appliedAt),
                score: app.score,
                status: app.status,
                attachmentCount,
                commentCount: app.notes.length,
                durationDays,
                isSelected: selectedApplicationIds.has(app.id),
                onToggleSelection: () => onToggleSelection(app.id),
                onView: () => onSelectApplication(app),
              }}
            />
          )
        })}
      </>
    </DroppableColumn>
  )
}

