import { useState, useEffect, useMemo } from 'react';
import {
  X,
  AlertCircle,
  Calendar,
  User,
  Building,
  Clock,
  CheckCircle,
  MessageSquare,
} from 'lucide-react';
import { YStack, XStack, Text, H2, H3, Card, Circle } from '@unicornlove/ui';
import Button from '../Common/Button';
// Modal import removed - using simple overlay to avoid ResponsiveModal freeze issue
import { useDatabase } from '../../contexts/DatabaseContext';
import { toast } from 'sonner';

// New database schema types
type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'submitted' | 'in_review' | 'approved' | 'rejected' | 'needs_info';
type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

interface Task {
  id: string;
  project_id: string;
  subcontractor_id: string | null;
  assigned_to_user_id: string | null;
  created_by_user_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string;
  task_type: string;
  origin_role: string;
  target_role: string;
  metadata?: {
    blockers?: string[];
    quick_actions?: string[];
    tags?: string[];
    project_name?: string;
    related?: Record<string, unknown>;
    legacy_assignees?: string[];
    [key: string]: unknown;
  };
  created_at: string;
  updated_at: string;
}

interface UserRecord {
  id: string;
  name: string;
  email: string;
  organization_id: string;
}

interface Project {
  id: string;
  name: string;
}

interface Subcontractor {
  id: string;
  company_name: string;
}

interface EnhancedTaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
}

// Simple overlay component to avoid ResponsiveModal freeze issue
const ModalOverlay = ({
  children,
  onClose,
  width = 900
}: {
  children: React.ReactNode;
  onClose: () => void;
  width?: number | string;
}) => (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}
    onClick={onClose}
  >
    <Card
      backgroundColor="$background"
      padding="$6"
      borderRadius="$4"
      width={width}
      maxWidth="95vw"
      maxHeight="90vh"
      overflow="scroll"
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
    >
      {children}
    </Card>
  </div>
);

export default function EnhancedTaskDetailModal({
  task,
  isOpen,
  onClose,
  onUpdateTask,
}: EnhancedTaskDetailModalProps) {
  const { forsured } = useDatabase();
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [note, setNote] = useState('');

  // Related data from database
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(true);

  // Fetch related data for lookups
  useEffect(() => {
    async function fetchRelatedData() {
      if (!isOpen) return;
      setLoadingRelated(true);

      try {
        // Don't fail on users query - table might not exist in forsured schema
        const [projectsResult, subsResult] = await Promise.all([
          forsured('projects').select('*'),
          forsured('subcontractors').select('*'),
        ]);

        if (projectsResult.error) {
          console.warn('[EnhancedTaskDetailModal] Projects query error:', projectsResult.error);
        }
        if (subsResult.error) {
          console.warn('[EnhancedTaskDetailModal] Subcontractors query error:', subsResult.error);
        }

        setUsers([]); // Users are in core schema, not forsured
        setProjects(projectsResult.data || []);
        setSubcontractors(subsResult.data || []);
      } catch (err) {
        const error = err as Error;
        console.warn('[EnhancedTaskDetailModal] Error loading related data:', error.message);
      } finally {
        setLoadingRelated(false);
      }
    }

    fetchRelatedData();
  }, [forsured, isOpen]);

  // Get assignee details from users data - MUST be before any early returns
  const assigneeDetails = useMemo(() => {
    if (!task?.assigned_to_user_id) return [];
    const user = users.find(u => u.id === task.assigned_to_user_id);
    return user ? [{ id: user.id, name: user.name, email: user.email }] : [];
  }, [task?.assigned_to_user_id, users]);

  // Early return if not open or no task
  if (!isOpen || !task) return null;

  // Get related project and subcontractor
  const relatedProject = projects.find(p => p.id === task.project_id);
  const relatedSubcontractor = subcontractors.find(s => s.id === task.subcontractor_id);

  // Get project name from metadata or lookup
  const projectName = task.metadata?.project_name || relatedProject?.name || 'Unknown Project';

  // Get blockers, tags from metadata
  const blockers = task.metadata?.blockers || [];
  const tags = task.metadata?.tags || [];
  const related = task.metadata?.related;

  const getPriorityColorProps = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return { color: '$red10', backgroundColor: '$red2', borderColor: '$red8' };
      case 'high':
        return { color: '$orange10', backgroundColor: '$orange2', borderColor: '$orange8' };
      case 'medium':
        return { color: '$blue10', backgroundColor: '$blue2', borderColor: '$blue8' };
      case 'low':
        return { color: '$color10', backgroundColor: '$gray2', borderColor: '$gray8' };
      default:
        return { color: '$color10', backgroundColor: '$gray2', borderColor: '$gray8' };
    }
  };

  const getStatusColorProps = (status: string) => {
    switch (status) {
      case 'pending':
        return { backgroundColor: '$blue2', color: '$blue10' };
      case 'in_progress':
        return { backgroundColor: '$blue2', color: '$blue10' };
      case 'completed':
        return { backgroundColor: '$green2', color: '$green10' };
      case 'cancelled':
        return { backgroundColor: '$gray2', color: '$gray10' };
      default:
        return { backgroundColor: '$blue2', color: '$blue10' };
    }
  };

  // Format status for display
  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0)
      return {
        text: `${Math.abs(diffDays)} days overdue`,
        color: '$red10',
        isOverdue: true,
      };
    if (diffDays === 0)
      return { text: 'Due today', color: '$orange10', isOverdue: false };
    if (diffDays === 1)
      return {
        text: 'Due tomorrow',
        color: '$orange10',
        isOverdue: false,
      };
    return {
      text: `Due in ${diffDays} days`,
      color: '$color11',
      isOverdue: false,
    };
  };

  const dueDate = formatDueDate(task.due_date);

  const handleStatusChange = (newStatus: TaskStatus) => {
    onUpdateTask?.(task.id, { status: newStatus });
  };

  const handleReassign = () => {
    if (selectedAssignee) {
      onUpdateTask?.(task.id, { assigned_to_user_id: selectedAssignee });
      setShowReassignModal(false);
      setSelectedAssignee('');
    }
  };

  const handleAddNote = () => {
    if (note.trim()) {
      console.log('Adding note:', note);
      setShowAddNoteModal(false);
      setNote('');
    }
  };

  // Available users for reassignment
  const availablePeople = users;

  return (
    <>
      <ModalOverlay onClose={onClose} width={700}>
        <YStack gap="$5">
          {/* Header with title, badges, and close button */}
          <XStack alignItems="flex-start" justifyContent="space-between" gap="$4">
            <YStack flex={1} gap="$2">
              <XStack alignItems="center" gap="$3" flexWrap="wrap">
                <H2 fontSize="$8" fontWeight="700" color="$color12">
                  {task.title}
                </H2>
                <XStack gap="$2">
                  <Text
                    paddingHorizontal="$2.5"
                    paddingVertical="$1"
                    fontSize="$1"
                    fontWeight="500"
                    borderRadius="$2"
                    borderWidth={1}
                    {...getPriorityColorProps(task.priority)}
                  >
                    {task.priority}
                  </Text>
                  <Text
                    paddingHorizontal="$2.5"
                    paddingVertical="$1"
                    fontSize="$1"
                    fontWeight="500"
                    borderRadius="$2"
                    {...getStatusColorProps(task.status)}
                  >
                    {formatStatus(task.status)}
                  </Text>
                </XStack>
              </XStack>
              {task.description && (
                <Text color="$color11" fontSize="$3">
                  {task.description}
                </Text>
              )}
            </YStack>
            <XStack
              onPress={onClose}
              cursor="pointer"
              padding="$2"
              borderRadius="$2"
              hoverStyle={{ backgroundColor: '$backgroundHover' }}
            >
              <X size={24} color="$color10" />
            </XStack>
          </XStack>

          {/* Info row: Due Date and Project side by side */}
          <XStack gap="$3">
            <Card
              flexDirection="row"
              alignItems="center"
              gap="$3"
              padding="$3"
              backgroundColor="$backgroundHover"
              borderRadius="$3"
              flex={1}
            >
              <Calendar color="$color10" size={20} />
              <YStack>
                <Text fontSize="$1" color="$color10">Due Date</Text>
                <XStack alignItems="center" gap="$2">
                  <Text fontSize="$3" fontWeight="500" color={dueDate.color}>
                    {dueDate.text}
                  </Text>
                  {dueDate.isOverdue && <Text fontSize="$3">⚠️</Text>}
                </XStack>
              </YStack>
            </Card>

            <Card
              flexDirection="row"
              alignItems="center"
              gap="$3"
              padding="$3"
              backgroundColor="$backgroundHover"
              borderRadius="$3"
              flex={1}
            >
              <Building color="$color10" size={20} />
              <YStack>
                <Text fontSize="$1" color="$color10">Project</Text>
                <Text fontSize="$3" fontWeight="500" color="$color12">
                  {projectName}
                </Text>
              </YStack>
            </Card>
          </XStack>

          {/* Assigned To section */}
          <YStack gap="$2">
            <XStack alignItems="center" justifyContent="space-between">
              <Text fontSize="$2" fontWeight="600" color="$color11">
                Assigned To
              </Text>
              <XStack
                onPress={() => setShowReassignModal(true)}
                cursor="pointer"
                hoverStyle={{ opacity: 0.8 }}
              >
                <Text fontSize="$2" color="$blue10" fontWeight="500">
                  {assigneeDetails.length > 0 ? 'Reassign' : 'Assign'}
                </Text>
              </XStack>
            </XStack>
            {assigneeDetails.length > 0 ? (
              <YStack gap="$2">
                {assigneeDetails.map((person) => (
                  <XStack
                    key={person?.id}
                    alignItems="center"
                    gap="$3"
                    padding="$3"
                    backgroundColor="$backgroundHover"
                    borderRadius="$3"
                  >
                    <YStack
                      width={36}
                      height={36}
                      backgroundColor="$blue10"
                      borderRadius={9999}
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text fontSize="$2" fontWeight="600" color="white">
                        {person?.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </Text>
                    </YStack>
                    <YStack>
                      <Text fontSize="$3" fontWeight="500" color="$color12">
                        {person?.name}
                      </Text>
                      <Text fontSize="$1" color="$color10">
                        {person?.email}
                      </Text>
                    </YStack>
                  </XStack>
                ))}
              </YStack>
            ) : (
              <Card
                padding="$3"
                backgroundColor="$backgroundHover"
                borderRadius="$3"
                alignItems="center"
              >
                <XStack alignItems="center" gap="$2">
                  <User size={16} color="$color9" />
                  <Text fontSize="$2" color="$color9">
                    No one assigned
                  </Text>
                </XStack>
              </Card>
            )}
          </YStack>

          {/* Blockers section */}
          {blockers.length > 0 && (
            <YStack gap="$2">
              <XStack alignItems="center" gap="$2">
                <AlertCircle color="$red10" size={16} />
                <Text fontSize="$2" fontWeight="600" color="$red10">
                  Blockers
                </Text>
              </XStack>
              <YStack gap="$2">
                {blockers.map((blocker, index) => (
                  <XStack
                    key={index}
                    alignItems="flex-start"
                    gap="$2"
                    padding="$3"
                    backgroundColor="$red2"
                    borderWidth={1}
                    borderColor="$red8"
                    borderRadius="$3"
                  >
                    <Circle size={6} backgroundColor="$red10" marginTop={6} />
                    <Text fontSize="$2" color="$red12">{blocker}</Text>
                  </XStack>
                ))}
              </YStack>
            </YStack>
          )}

          {/* Tags section */}
          {tags.length > 0 && (
            <YStack gap="$2">
              <Text fontSize="$2" fontWeight="600" color="$color11">Tags</Text>
              <XStack flexWrap="wrap" gap="$2">
                {tags.map((tag) => (
                  <Text
                    key={tag}
                    paddingHorizontal="$2.5"
                    paddingVertical="$1"
                    backgroundColor="$backgroundHover"
                    color="$color11"
                    fontSize="$1"
                    fontWeight="500"
                    borderRadius={9999}
                    borderWidth={1}
                    borderColor="$borderColor"
                  >
                    {tag}
                  </Text>
                ))}
              </XStack>
            </YStack>
          )}

          {/* Actions section */}
          <YStack gap="$3" borderTopWidth={1} borderColor="$borderColor" paddingTop="$4">
            <Text fontSize="$2" fontWeight="600" color="$color11">
              Actions
            </Text>

            {/* Status buttons */}
            <XStack gap="$2">
              <Button
                variant={task.status === 'in_progress' ? 'primary' : 'secondary'}
                onClick={() => handleStatusChange('in_progress')}
                icon={Clock}
                flex={1}
                size="$3"
              >
                Start Working
              </Button>
              <Button
                variant={task.status === 'completed' ? 'success' : 'secondary'}
                onClick={() => handleStatusChange('completed')}
                icon={CheckCircle}
                flex={1}
                size="$3"
              >
                Complete
              </Button>
            </XStack>

            {/* Secondary actions */}
            <XStack gap="$2">
              <Button
                variant="secondary"
                onClick={() => handleStatusChange('pending')}
                flex={1}
                size="$3"
              >
                Mark Pending
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowAddNoteModal(true)}
                icon={MessageSquare}
                flex={1}
                size="$3"
              >
                Add Note
              </Button>
            </XStack>
          </YStack>

          {/* Related Items section */}
          {related && Object.keys(related).length > 0 && (
            <YStack gap="$2" borderTopWidth={1} borderColor="$borderColor" paddingTop="$4">
              <Text fontSize="$2" fontWeight="600" color="$color11">
                Related Items
              </Text>
              <YStack gap="$1">
                {Object.entries(related).map(([key, value]) => (
                  <XStack
                    key={key}
                    alignItems="center"
                    justifyContent="space-between"
                    padding="$2"
                    backgroundColor="$backgroundHover"
                    borderRadius="$2"
                  >
                    <Text fontSize="$1" color="$color10" textTransform="capitalize">
                      {key.replace(/_/g, ' ')}
                    </Text>
                    <Text fontSize="$1" fontFamily="$mono" color="$color11">
                      {Array.isArray(value) ? value.join(', ') : String(value)}
                    </Text>
                  </XStack>
                ))}
              </YStack>
            </YStack>
          )}
        </YStack>
      </ModalOverlay>

      {/* Reassign Modal */}
      {showReassignModal && (
        <ModalOverlay onClose={() => setShowReassignModal(false)} width={400}>
          <YStack gap="$4">
            <XStack alignItems="center" justifyContent="space-between" mb="$2">
              <H3 fontSize="$5" fontWeight="600" color="$color12">Reassign Task</H3>
              <XStack
                onPress={() => setShowReassignModal(false)}
                cursor="pointer"
                padding="$2"
                borderRadius="$2"
                hoverStyle={{ backgroundColor: '$backgroundHover' }}
              >
                <X size={20} color="$color10" />
              </XStack>
            </XStack>
            <YStack>
              <Text
                as="label"
                display="block"
                fontSize="$3"
                fontWeight="500"
                color="$color11"
                mb="$2"
              >
                Select Assignee
              </Text>
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--borderColor)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: 'var(--color12)',
                  fontFamily: 'inherit',
                }}
              >
                <option value="">Choose a person...</option>
                {availablePeople.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name} ({person.email})
                  </option>
                ))}
              </select>
            </YStack>
            <XStack gap="$3">
              <Button
                variant="secondary"
                onClick={() => setShowReassignModal(false)}
                flex={1}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleReassign}
                flex={1}
              >
                Reassign
              </Button>
            </XStack>
          </YStack>
        </ModalOverlay>
      )}

      {/* Add Note Modal */}
      {showAddNoteModal && (
        <ModalOverlay onClose={() => setShowAddNoteModal(false)} width={400}>
          <YStack gap="$4">
            <XStack alignItems="center" justifyContent="space-between" mb="$2">
              <H3 fontSize="$5" fontWeight="600" color="$color12">Add Note</H3>
              <XStack
                onPress={() => setShowAddNoteModal(false)}
                cursor="pointer"
                padding="$2"
                borderRadius="$2"
                hoverStyle={{ backgroundColor: '$backgroundHover' }}
              >
                <X size={20} color="$color10" />
              </XStack>
            </XStack>
            <YStack>
              <Text
                as="label"
                display="block"
                fontSize="$3"
                fontWeight="500"
                color="$color11"
                mb="$2"
              >
                Note
              </Text>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                placeholder="Enter your note here..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--borderColor)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: 'var(--color12)',
                  fontFamily: 'inherit',
                }}
              />
            </YStack>
            <XStack gap="$3">
              <Button
                variant="secondary"
                onClick={() => setShowAddNoteModal(false)}
                flex={1}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleAddNote}
                flex={1}
              >
                Add Note
              </Button>
            </XStack>
          </YStack>
        </ModalOverlay>
      )}
    </>
  );
}
