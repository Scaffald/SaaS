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
import { Stack, Row, Text, H2, H3, Card } from '@unicornlove/beyond-ui';
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
      onPress={(e: React.MouseEvent) => e.stopPropagation()}
      style={{
        backgroundColor: 'var(--color-background)',
        padding: 24,
        borderRadius: 12,
        width,
        maxWidth: '95vw',
        maxHeight: '90vh',
        overflow: 'auto',
      }}
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

  const getPriorityColorProps = (priority: string): React.CSSProperties => {
    switch (priority) {
      case 'urgent':
        return { color: 'var(--color-red-10)', backgroundColor: 'var(--color-red-2)', borderColor: 'var(--color-red-8)' };
      case 'high':
        return { color: 'var(--color-orange-10)', backgroundColor: 'var(--color-orange-2)', borderColor: 'var(--color-orange-8)' };
      case 'medium':
        return { color: 'var(--color-blue-10)', backgroundColor: 'var(--color-blue-2)', borderColor: 'var(--color-blue-8)' };
      case 'low':
        return { color: 'var(--color-text-muted)', backgroundColor: 'var(--color-gray-2)', borderColor: 'var(--color-gray-8)' };
      default:
        return { color: 'var(--color-text-muted)', backgroundColor: 'var(--color-gray-2)', borderColor: 'var(--color-gray-8)' };
    }
  };

  const getStatusColorProps = (status: string): React.CSSProperties => {
    switch (status) {
      case 'pending':
        return { backgroundColor: 'var(--color-blue-2)', color: 'var(--color-blue-10)' };
      case 'in_progress':
        return { backgroundColor: 'var(--color-blue-2)', color: 'var(--color-blue-10)' };
      case 'completed':
        return { backgroundColor: 'var(--color-green-2)', color: 'var(--color-green-10)' };
      case 'cancelled':
        return { backgroundColor: 'var(--color-gray-2)', color: 'var(--color-gray-10)' };
      default:
        return { backgroundColor: 'var(--color-blue-2)', color: 'var(--color-blue-10)' };
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
        color: 'var(--color-red-10)',
        isOverdue: true,
      };
    if (diffDays === 0)
      return { text: 'Due today', color: 'var(--color-orange-10)', isOverdue: false };
    if (diffDays === 1)
      return {
        text: 'Due tomorrow',
        color: 'var(--color-orange-10)',
        isOverdue: false,
      };
    return {
      text: `Due in ${diffDays} days`,
      color: 'var(--color-text-muted)',
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
      // Add note to task metadata
      const existingNotes = (task.metadata?.notes as Array<{ text: string; timestamp: string }>) || [];
      const newNote = {
        text: note.trim(),
        timestamp: new Date().toISOString(),
      };
      onUpdateTask?.(task.id, {
        metadata: {
          ...task.metadata,
          notes: [...existingNotes, newNote],
        },
      });
      setShowAddNoteModal(false);
      setNote('');
    }
  };

  // Available users for reassignment
  const availablePeople = users;

  return (
    <>
      <ModalOverlay onClose={onClose} width={700}>
        <Stack gap={20}>
          {/* Header with title, badges, and close button */}
          <Row alignItems="flex-start" justifyContent="space-between" gap={16}>
            <Stack style={{ flex: 1 }} gap={8}>
              <Row alignItems="center" gap={12} style={{ flexWrap: 'wrap' }}>
                <H2 style={{ fontSize: 28, fontWeight: 700 }}>
                  {task.title}
                </H2>
                <Row gap={8}>
                  <span
                    style={{
                      paddingLeft: 10,
                      paddingRight: 10,
                      paddingTop: 4,
                      paddingBottom: 4,
                      fontSize: 12,
                      fontWeight: 500,
                      borderRadius: 8,
                      border: '1px solid',
                      ...getPriorityColorProps(task.priority),
                    }}
                  >
                    {task.priority}
                  </span>
                  <span
                    style={{
                      paddingLeft: 10,
                      paddingRight: 10,
                      paddingTop: 4,
                      paddingBottom: 4,
                      fontSize: 12,
                      fontWeight: 500,
                      borderRadius: 8,
                      ...getStatusColorProps(task.status),
                    }}
                  >
                    {formatStatus(task.status)}
                  </span>
                </Row>
              </Row>
              {task.description && (
                <Text size="sm" muted>
                  {task.description}
                </Text>
              )}
            </Stack>
            <div
              onClick={onClose}
              style={{ cursor: 'pointer', padding: 8, borderRadius: 8 }}
            >
              <X size={24} color="var(--color-text-muted)" />
            </div>
          </Row>

          {/* Info row: Due Date and Project side by side */}
          <Row gap={12}>
            <Card
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                backgroundColor: 'var(--color-gray-2)',
                borderRadius: 12,
                flex: 1,
              }}
            >
              <Calendar color="var(--color-text-muted)" size={20} />
              <Stack>
                <Text size="xs" muted>Due Date</Text>
                <Row alignItems="center" gap={8}>
                  <Text size="sm" weight="medium" style={{ color: dueDate.color }}>
                    {dueDate.text}
                  </Text>
                  {dueDate.isOverdue && <Text size="sm">⚠️</Text>}
                </Row>
              </Stack>
            </Card>

            <Card
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                backgroundColor: 'var(--color-gray-2)',
                borderRadius: 12,
                flex: 1,
              }}
            >
              <Building color="var(--color-text-muted)" size={20} />
              <Stack>
                <Text size="xs" muted>Project</Text>
                <Text size="sm" weight="medium">
                  {projectName}
                </Text>
              </Stack>
            </Card>
          </Row>

          {/* Assigned To section */}
          <Stack gap={8}>
            <Row alignItems="center" justifyContent="space-between">
              <Text size="sm" weight="semibold" muted>
                Assigned To
              </Text>
              <div
                onClick={() => setShowReassignModal(true)}
                style={{ cursor: 'pointer' }}
              >
                <Text size="sm" weight="medium" style={{ color: 'var(--color-blue-10)' }}>
                  {assigneeDetails.length > 0 ? 'Reassign' : 'Assign'}
                </Text>
              </div>
            </Row>
            {assigneeDetails.length > 0 ? (
              <Stack gap={8}>
                {assigneeDetails.map((person) => (
                  <Row
                    key={person?.id}
                    alignItems="center"
                    gap={12}
                    style={{
                      padding: 12,
                      backgroundColor: 'var(--color-gray-2)',
                      borderRadius: 12,
                    }}
                  >
                    <Stack
                      alignItems="center"
                      justifyContent="center"
                      style={{
                        width: 36,
                        height: 36,
                        backgroundColor: 'var(--color-blue-10)',
                        borderRadius: 9999,
                      }}
                    >
                      <Text size="sm" weight="semibold" style={{ color: 'white' }}>
                        {person?.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </Text>
                    </Stack>
                    <Stack>
                      <Text size="sm" weight="medium">
                        {person?.name}
                      </Text>
                      <Text size="xs" muted>
                        {person?.email}
                      </Text>
                    </Stack>
                  </Row>
                ))}
              </Stack>
            ) : (
              <Card
                style={{
                  padding: 12,
                  backgroundColor: 'var(--color-gray-2)',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Row alignItems="center" gap={8}>
                  <User size={16} color="var(--color-text-muted)" />
                  <Text size="sm" muted>
                    No one assigned
                  </Text>
                </Row>
              </Card>
            )}
          </Stack>

          {/* Blockers section */}
          {blockers.length > 0 && (
            <Stack gap={8}>
              <Row alignItems="center" gap={8}>
                <AlertCircle color="var(--color-red-10)" size={16} />
                <Text size="sm" weight="semibold" style={{ color: 'var(--color-red-10)' }}>
                  Blockers
                </Text>
              </Row>
              <Stack gap={8}>
                {blockers.map((blocker, index) => (
                  <Row
                    key={index}
                    alignItems="flex-start"
                    gap={8}
                    style={{
                      padding: 12,
                      backgroundColor: 'var(--color-red-2)',
                      border: '1px solid var(--color-red-8)',
                      borderRadius: 12,
                    }}
                  >
                    <div style={{ width: 6, height: 6, backgroundColor: 'var(--color-red-10)', borderRadius: 9999, marginTop: 6 }} />
                    <Text size="sm" style={{ color: 'var(--color-red-12)' }}>{blocker}</Text>
                  </Row>
                ))}
              </Stack>
            </Stack>
          )}

          {/* Tags section */}
          {tags.length > 0 && (
            <Stack gap={8}>
              <Text size="sm" weight="semibold" muted>Tags</Text>
              <Row style={{ flexWrap: 'wrap', gap: 8 }}>
                {tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      paddingLeft: 10,
                      paddingRight: 10,
                      paddingTop: 4,
                      paddingBottom: 4,
                      backgroundColor: 'var(--color-gray-2)',
                      color: 'var(--color-text-muted)',
                      fontSize: 12,
                      fontWeight: 500,
                      borderRadius: 9999,
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </Row>
            </Stack>
          )}

          {/* Actions section */}
          <Stack gap={12} style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
            <Text size="sm" weight="semibold" muted>
              Actions
            </Text>

            {/* Status buttons */}
            <Row gap={8}>
              <Button
                variant={task.status === 'in_progress' ? 'primary' : 'secondary'}
                onPress={() => handleStatusChange('in_progress')}
                leftIcon={Clock}
                style={{ flex: 1 }}
              >
                Start Working
              </Button>
              <Button
                variant={task.status === 'completed' ? 'success' : 'secondary'}
                onPress={() => handleStatusChange('completed')}
                leftIcon={CheckCircle}
                style={{ flex: 1 }}
              >
                Complete
              </Button>
            </Row>

            {/* Secondary actions */}
            <Row gap={8}>
              <Button
                variant="secondary"
                onPress={() => handleStatusChange('pending')}
                style={{ flex: 1 }}
              >
                Mark Pending
              </Button>
              <Button
                variant="secondary"
                onPress={() => setShowAddNoteModal(true)}
                leftIcon={MessageSquare}
                style={{ flex: 1 }}
              >
                Add Note
              </Button>
            </Row>
          </Stack>

          {/* Related Items section */}
          {related && Object.keys(related).length > 0 && (
            <Stack gap={8} style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
              <Text size="sm" weight="semibold" muted>
                Related Items
              </Text>
              <Stack gap={4}>
                {Object.entries(related).map(([key, value]) => (
                  <Row
                    key={key}
                    alignItems="center"
                    justifyContent="space-between"
                    style={{
                      padding: 8,
                      backgroundColor: 'var(--color-gray-2)',
                      borderRadius: 8,
                    }}
                  >
                    <Text size="xs" muted style={{ textTransform: 'capitalize' }}>
                      {key.replace(/_/g, ' ')}
                    </Text>
                    <Text size="xs" muted style={{ fontFamily: 'monospace' }}>
                      {Array.isArray(value) ? value.join(', ') : String(value)}
                    </Text>
                  </Row>
                ))}
              </Stack>
            </Stack>
          )}
        </Stack>
      </ModalOverlay>

      {/* Reassign Modal */}
      {showReassignModal && (
        <ModalOverlay onClose={() => setShowReassignModal(false)} width={400}>
          <Stack gap={16}>
            <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: 8 }}>
              <H3 style={{ fontSize: 18, fontWeight: 600 }}>Reassign Task</H3>
              <div
                onClick={() => setShowReassignModal(false)}
                style={{ cursor: 'pointer', padding: 8, borderRadius: 8 }}
              >
                <X size={20} color="var(--color-text-muted)" />
              </div>
            </Row>
            <Stack>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 8 }}>
                Select Assignee
              </label>
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: 'var(--color-text)',
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
            </Stack>
            <Row gap={12}>
              <Button
                variant="secondary"
                onPress={() => setShowReassignModal(false)}
                style={{ flex: 1 }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onPress={handleReassign}
                style={{ flex: 1 }}
              >
                Reassign
              </Button>
            </Row>
          </Stack>
        </ModalOverlay>
      )}

      {/* Add Note Modal */}
      {showAddNoteModal && (
        <ModalOverlay onClose={() => setShowAddNoteModal(false)} width={400}>
          <Stack gap={16}>
            <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: 8 }}>
              <H3 style={{ fontSize: 18, fontWeight: 600 }}>Add Note</H3>
              <div
                onClick={() => setShowAddNoteModal(false)}
                style={{ cursor: 'pointer', padding: 8, borderRadius: 8 }}
              >
                <X size={20} color="var(--color-text-muted)" />
              </div>
            </Row>
            <Stack>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 8 }}>
                Note
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                placeholder="Enter your note here..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: 'var(--color-text)',
                  fontFamily: 'inherit',
                }}
              />
            </Stack>
            <Row gap={12}>
              <Button
                variant="secondary"
                onPress={() => setShowAddNoteModal(false)}
                style={{ flex: 1 }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onPress={handleAddNote}
                style={{ flex: 1 }}
              >
                Add Note
              </Button>
            </Row>
          </Stack>
        </ModalOverlay>
      )}
    </>
  );
}
