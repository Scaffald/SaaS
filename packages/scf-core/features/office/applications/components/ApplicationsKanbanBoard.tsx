import { BulkInquiryModal } from '@scf/core/features/inquiries/components/BulkInquiryModal'
import { InquiryComparisonView } from '@scf/core/features/inquiries/components/InquiryComparisonView'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useQueryClient } from '@tanstack/react-query'
import type { Ref } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import {
  Button,
  KanbanCard,
  KanbanColumn,
  Tabs,
  Text,
  useWindowDimensions,
  Row,
  Stack,
  useThemeContext,
} from '@scaffald/ui'
import type { ApplicationStatus, ATSApplication } from '../types'
import { useApplicationStatusChange } from '../hooks/useApplicationStatusChange'
import { ApplicationStatusChangeModal } from './ApplicationStatusChangeModal'
import { CandidateDetailModal } from './CandidateDetailModal'
import { colors } from '@scaffald/ui/tokens'

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
  rejected: 'Closed',
  withdrawn: 'Closed',
}

/**
 * Which column a status is drawn in.
 *
 * `withdrawn` shares the terminal column with `rejected` rather than adding an
 * eighth — nobody works a withdrawn candidate, so it does not earn board width.
 * The card carries a badge, and `app.status` stays `withdrawn`, so metrics and
 * EEO counts can tell a candidate who pulled out from one the employer turned
 * down (#533).
 */
const COLUMN_FOR_STATUS: Record<ApplicationStatus, ApplicationStatus> = {
  new: 'new',
  screen: 'screen',
  inquired: 'inquired',
  interview: 'interview',
  offer: 'offer',
  hired: 'hired',
  rejected: 'rejected',
  withdrawn: 'rejected',
}

const getStatusColors = (theme: 'light' | 'dark'): Record<ApplicationStatus, string> => ({
  new: colors.bg[theme].default,
  screen: theme === 'light' ? colors.yellow[50] : colors.yellow[900],
  inquired: theme === 'light' ? colors.purple[50] : colors.purple[900],
  interview: theme === 'light' ? colors.error[50] : colors.error[900],
  offer: theme === 'light' ? colors.green[50] : colors.green[900],
  hired: theme === 'light' ? colors.green[700] : colors.green[300],
  rejected: theme === 'light' ? colors.error[50] : colors.error[900],
  withdrawn: theme === 'light' ? colors.error[50] : colors.error[900],
})

interface ApplicationsKanbanBoardProps {
  applications: ATSApplication[]
}

export const ApplicationsKanbanBoard = ({ applications }: ApplicationsKanbanBoardProps) => {
  const { theme } = useThemeContext()
  const STATUS_COLORS = getStatusColors(theme)
  const [selectedApplication, setSelectedApplication] = useState<ATSApplication | null>(null)
  const [selectedApplicationIds, setSelectedApplicationIds] = useState<Set<string>>(new Set())
  const [showBulkInquiry, setShowBulkInquiry] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [comparisonInquiryIds, setComparisonInquiryIds] = useState<string[]>([])
  const [_inquiryToApplicationMap, setInquiryToApplicationMap] = useState<Record<string, string>>(
    {}
  )
  const [activeColumn, setActiveColumn] = useState<ApplicationStatus>(STATUSES[0])
  const { width } = useWindowDimensions()
  const isMobile = width < 768

  // Fetch inquiry IDs for selected applications
  const selectedApplications = useMemo(
    () =>
      Array.from(selectedApplicationIds)
        .map((id) => applications.find((app) => app.id === id))
        .filter((app): app is ATSApplication => !!app && app.status === 'inquired'),
    [selectedApplicationIds, applications]
  )

  const queryClient = useQueryClient()

  // Fetch inquiry IDs when selection changes
  useEffect(() => {
    const fetchInquiryIds = async () => {
      const ids: string[] = []
      const map: Record<string, string> = {}

      for (const app of selectedApplications) {
        try {
          const inquiryData = (await queryClient.fetchQuery({
            queryKey: ['inquiries', 'detail', app.id],
          })) as { inquiry?: { id?: string } } | null
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
  }, [selectedApplications, queryClient])

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
        // Group by column, not by status, so withdrawn lands with rejected
        // while keeping its own status on the card.
        acc[status] = applications.filter((app) => COLUMN_FOR_STATUS[app.status] === status)
        return acc
      },
      {} as Record<ApplicationStatus, ATSApplication[]>
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
        <Row
          gap={12}
          padding="sm"
          style={{
            backgroundColor: theme === 'light' ? colors.blue[50] : colors.blue[900],
            borderBottomWidth: 1,
            borderBottomColor: colors.border[theme].default,
          }}
          align="center"
          justify="space-between"
          wrap
        >
          <Text>
            {selectedApplicationIds.size} candidate{selectedApplicationIds.size !== 1 ? 's' : ''}{' '}
            selected
          </Text>
          <Row gap={8} wrap>
            <Button size="sm" variant="outline" onPress={clearSelection}>
              Clear
            </Button>
            {selectedApplications.length >= 2 &&
              selectedApplications.length <= 5 &&
              comparisonInquiryIds.length >= 2 && (
                <Button
                  size="sm"
                  color="primary"
                  variant="outline"
                  onPress={() => {
                    if (comparisonInquiryIds.length >= 2 && comparisonInquiryIds.length <= 5) {
                      setShowComparison(true)
                    }
                  }}
                >
                  Compare {comparisonInquiryIds.length}
                </Button>
              )}
            <Button size="sm" color="primary" onPress={() => setShowBulkInquiry(true)}>
              Send Inquiry to {selectedApplicationIds.size}
            </Button>
          </Row>
        </Row>
      )}

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {isMobile ? (
          // Mobile: Tab-based view showing one column at a time
          <Tabs
            value={activeColumn}
            onValueChange={(value) => setActiveColumn(value as ApplicationStatus)}
          >
            {STATUSES.map((status) => (
              <Tabs.Item key={status} value={status}>
                <Tabs.Trigger containerStyle={{ flex: 1, minWidth: 100 }}>
                  <Stack align="center">
                    <Text>{STATUS_LABELS[status]}</Text>
                    <Stack
                      style={{ backgroundColor: colors.bg[theme].muted }}
                      paddingHorizontal={8}
                      paddingVertical={4}
                      borderRadius={8}
                      marginTop={4}
                    >
                      <Text style={{ color: colors.text[theme].secondary }}>
                        {groupedApplications[status].length}
                      </Text>
                    </Stack>
                  </Stack>
                </Tabs.Trigger>
              </Tabs.Item>
            ))}

            {STATUSES.map((status) => (
              <Tabs.Content key={status} value={status}>
                <Stack padding="sm">
                  <StatusColumn
                    status={status}
                    label={STATUS_LABELS[status]}
                    color={STATUS_COLORS[status]}
                    applications={groupedApplications[status]}
                    selectedApplicationIds={selectedApplicationIds}
                    onSelectApplication={setSelectedApplication}
                    onToggleSelection={toggleApplicationSelection}
                  />
                </Stack>
              </Tabs.Content>
            ))}
          </Tabs>
        ) : (
          // Desktop: Horizontal scrolling layout
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Row gap={12} paddingBottom={16}>
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
            </Row>
          </ScrollView>
        )}

        <DragOverlay>
          {activeApplication ? (
            <KanbanCard id={activeApplication.id} isDragging>
              <Stack gap={8} padding="sm">
                <Text style={{ color: colors.text[theme].primary }}>
                  {activeApplication.candidate.name}
                </Text>
                <Text style={{ color: colors.text[theme].secondary }}>
                  {activeApplication.job.title}
                </Text>
                <Row gap={8} justify="space-between">
                  <Text style={{ color: colors.text[theme].tertiary, fontSize: 12 }}>
                    {Math.floor(
                      (Date.now() - new Date(activeApplication.appliedAt).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )}
                    d ago
                  </Text>
                  {(activeApplication.attachments.resume ? 1 : 0) +
                    (activeApplication.attachments.coverLetter ? 1 : 0) +
                    (activeApplication.attachments.portfolio ? 1 : 0) >
                    0 && (
                    <Text style={{ color: colors.text[theme].secondary, fontSize: 12 }}>
                      {(activeApplication.attachments.resume ? 1 : 0) +
                        (activeApplication.attachments.coverLetter ? 1 : 0) +
                        (activeApplication.attachments.portfolio ? 1 : 0)}{' '}
                      attachments
                    </Text>
                  )}
                </Row>
              </Stack>
            </KanbanCard>
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
  const { theme } = useThemeContext()
  if (!open || inquiryIds.length < 2) {
    return null
  }

  return (
    <Stack
      style={{
        backgroundColor: colors.bg[theme].default,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
      }}
    >
      <InquiryComparisonView
        inquiryIds={inquiryIds}
        onClose={onClose}
        onRemoveInquiry={onRemoveInquiry}
      />
    </Stack>
  )
}

/** Local droppable column using @dnd-kit (scaffald does not export DroppableColumn) */
function DroppableColumn({
  id,
  title,
  count,
  color,
  emptyMessage,
  children,
}: {
  id: string
  align?: string[]
  title: string
  count: number
  color?: string
  emptyMessage?: string
  children?: React.ReactNode
}) {
  const { isOver, setNodeRef } = useDroppable({ id, data: { type: 'column' } })
  return (
    <View ref={setNodeRef as Ref<View>} style={isOver ? { opacity: 0.9 } : undefined}>
      <KanbanColumn id={id} title={title} count={count} color={color} emptyMessage={emptyMessage}>
        {children}
      </KanbanColumn>
    </View>
  )
}

/** Local draggable card using @dnd-kit (scaffald does not export DraggableCard) */
function DraggableCard({
  id,
  kanbanCardProps,
}: {
  id: string
  kanbanCardProps: {
    applicantName: string
    applicantAvatar?: string
    jobTitle: string
    applicationDate: Date
    score?: number
    status: ApplicationStatus
    attachmentCount: number
    durationDays: number
    isSelected: boolean
    onToggleSelection: () => void
    onView: () => void
  }
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id, data: { type: 'card' } })
  const { theme } = useThemeContext()
  return (
    <View
      ref={setNodeRef as Ref<View>}
      {...(attributes as unknown as Record<string, unknown>)}
      {...(listeners as unknown as Record<string, unknown>)}
    >
      <KanbanCard id={id} isDragging={false}>
        <Pressable onPress={kanbanCardProps.onView}>
          <Stack gap={8} padding="sm">
            <Text style={{ color: colors.text[theme].primary }}>
              {kanbanCardProps.applicantName}
            </Text>
            <Text style={{ color: colors.text[theme].secondary }}>{kanbanCardProps.jobTitle}</Text>
            {/* The terminal column holds both rejected and withdrawn, so the
                card has to say which. Without it the two are indistinguishable
                on the board even though the data now keeps them apart. */}
            {kanbanCardProps.status === 'withdrawn' && (
              <Stack
                style={{
                  alignSelf: 'flex-start',
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 10,
                  backgroundColor: colors.bg[theme].subtle,
                }}
              >
                <Text style={{ fontSize: 11, color: colors.text[theme].secondary }}>
                  Withdrawn by candidate
                </Text>
              </Stack>
            )}
            <Row gap={8} justify="space-between">
              <Text style={{ color: colors.text[theme].tertiary, fontSize: 12 }}>
                {kanbanCardProps.durationDays}d ago
              </Text>
              {kanbanCardProps.attachmentCount > 0 && (
                <Text style={{ color: colors.text[theme].secondary, fontSize: 12 }}>
                  {kanbanCardProps.attachmentCount} attachments
                </Text>
              )}
            </Row>
          </Stack>
        </Pressable>
      </KanbanCard>
    </View>
  )
}

interface StatusColumnProps {
  status: ApplicationStatus
  label: string
  color: string
  applications: ATSApplication[]
  selectedApplicationIds: Set<string>
  onSelectApplication: (application: ATSApplication) => void
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
      align={applications.map((app) => app.id)}
      title={label}
      count={applications.length}
      color={color}
      emptyMessage="No applications"
    >
      {applications.map((app) => {
        // Calculate attachment count
        const attachmentCount =
          (app.attachments.resume ? 1 : 0) +
          (app.attachments.coverLetter ? 1 : 0) +
          (app.attachments.portfolio ? 1 : 0)

        // Calculate duration in days
        const durationDays = Math.floor(
          (Date.now() - new Date(app.appliedAt).getTime()) / (1000 * 60 * 60 * 24)
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
              durationDays,
              isSelected: selectedApplicationIds.has(app.id),
              onToggleSelection: () => onToggleSelection(app.id),
              onView: () => onSelectApplication(app),
            }}
          />
        )
      })}
    </DroppableColumn>
  )
}
