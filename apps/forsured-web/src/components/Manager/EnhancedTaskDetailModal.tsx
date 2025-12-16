import { useState, useEffect, useMemo } from 'react';
import {
  X,
  AlertCircle,
  Calendar,
  User,
  Tag,
  Building,
  FileText,
  Clock,
  CheckCircle,
  MessageSquare,
  UserPlus,
  Edit,
  Loader2,
} from 'lucide-react';
import { YStack, XStack, Text, H2, H3, Card } from '@unicornlove/ui';
import Button from '../Common/Button';
import Modal from '../Common/Modal';
import { useMockDatabase } from '../../contexts/DatabaseContext';
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

export default function EnhancedTaskDetailModal({
  task,
  isOpen,
  onClose,
  onUpdateTask,
}: EnhancedTaskDetailModalProps) {
  const db = useMockDatabase();
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [note, setNote] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');

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
        const [usersResult, projectsResult, subsResult] = await Promise.all([
          db.from('users').select('*'),
          db.from('projects').select('*'),
          db.from('subcontractors').select('*'),
        ]);

        if (usersResult.error) throw usersResult.error;
        if (projectsResult.error) throw projectsResult.error;
        if (subsResult.error) throw subsResult.error;

        setUsers(usersResult.data || []);
        setProjects(projectsResult.data || []);
        setSubcontractors(subsResult.data || []);
      } catch (err) {
        const error = err as Error;
        toast.error(error.message || 'Failed to load related data');
      } finally {
        setLoadingRelated(false);
      }
    }

    fetchRelatedData();
  }, [db, isOpen]);

  if (!task) return null;

  // Get assignee details from users data
  const assigneeDetails = useMemo(() => {
    if (!task.assigned_to_user_id) return [];
    const user = users.find(u => u.id === task.assigned_to_user_id);
    return user ? [{ id: user.id, name: user.name, email: user.email }] : [];
  }, [task.assigned_to_user_id, users]);

  // Get related project and subcontractor
  const relatedProject = projects.find(p => p.id === task.project_id);
  const relatedSubcontractor = subcontractors.find(s => s.id === task.subcontractor_id);

  // Get project name from metadata or lookup
  const projectName = task.metadata?.project_name || relatedProject?.name || 'Unknown Project';

  // Get blockers, quick_actions, tags from metadata
  const blockers = task.metadata?.blockers || [];
  const quickActions = task.metadata?.quick_actions || [];
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

  const handleSendInvite = () => {
    if (inviteEmail.trim()) {
      console.log('Sending invite to:', inviteEmail);
      setShowInviteModal(false);
      setInviteEmail('');
    }
  };

  // Available users for reassignment
  const availablePeople = users;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="" size="lg">
        <YStack gap="$6">
          <XStack alignItems="flex-start" justifyContent="space-between">
            <YStack flex={1}>
              <XStack alignItems="center" gap="$3" marginBottom="$2">
                <H2 fontSize="$9" fontWeight="700" color="$color12">
                  {task.title}
                </H2>
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
              <Text color="$color11">{task.description}</Text>
            </YStack>
          </XStack>

          <XStack flexWrap="wrap" gap="$4">
            <Card
              alignItems="center"
              gap="$3"
              padding="$3"
              backgroundColor="$backgroundHover"
              borderRadius="$4"
              flex={1}
              minWidth="calc(50% - 8px)"
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
              alignItems="center"
              gap="$3"
              padding="$3"
              backgroundColor="$backgroundHover"
              borderRadius="$4"
              flex={1}
              minWidth="calc(50% - 8px)"
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

          <YStack gap="$3">
            <XStack alignItems="center" justifyContent="space-between">
              <H3 fontSize="$3" fontWeight="600" color="$color12">
                Assigned To
              </H3>
              <XStack
                onPress={() => setShowReassignModal(true)}
                cursor="pointer"
                hoverStyle={{ opacity: 0.8 }}
              >
                <Text fontSize="$1" color="$blue10" fontWeight="500">
                  Reassign
                </Text>
              </XStack>
            </XStack>
            <YStack gap="$2">
              {assigneeDetails.map((person) => (
                <XStack
                  key={person?.id}
                  alignItems="center"
                  gap="$3"
                  padding="$3"
                  backgroundColor="$backgroundHover"
                  borderRadius="$4"
                >
                  <YStack
                    width={40}
                    height={40}
                    backgroundColor="$blue10"
                    borderRadius={9999}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text fontSize="$3" fontWeight="600" color="white">
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
          </YStack>

          {blockers.length > 0 && (
            <YStack gap="$3">
              <XStack alignItems="center" gap="$2">
                <AlertCircle color="$red10" size={18} />
                <H3 fontSize="$3" fontWeight="600" color="$red10">
                  Blockers
                </H3>
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
                    borderRadius="$4"
                  >
                    <Circle size={8} backgroundColor="$red10" marginTop="$1.5" />
                    <Text fontSize="$3" color="$red12">{blocker}</Text>
                  </XStack>
                ))}
              </YStack>
            </YStack>
          )}

          {tags.length > 0 && (
            <YStack gap="$3">
              <H3 fontSize="$3" fontWeight="600" color="$color12">Tags</H3>
              <XStack flexWrap="wrap" gap="$2">
                {tags.map((tag) => (
                  <Text
                    key={tag}
                    paddingHorizontal="$3"
                    paddingVertical="$1.5"
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

          {quickActions.length > 0 && (
            <YStack gap="$3">
              <H3 fontSize="$3" fontWeight="600" color="$color12">
                Quick Actions
              </H3>
              <XStack flexWrap="wrap" gap="$2">
                {quickActions.map((action) => (
                  <XStack
                    key={action}
                    onPress={() => {
                      if (action === 'add_note') setShowAddNoteModal(true);
                      else if (action === 'send_invite') setShowInviteModal(true);
                      else console.log('Action:', action);
                    }}
                    paddingHorizontal="$4"
                    paddingVertical="$2"
                    fontSize="$3"
                    fontWeight="500"
                    color="$blue10"
                    backgroundColor="$blue2"
                    borderWidth={1}
                    borderColor="$blue8"
                    borderRadius="$4"
                    hoverStyle={{ backgroundColor: '$blue3' }}
                    cursor="pointer"
                  >
                    <Text fontSize="$3" fontWeight="500" color="$blue10">
                      {action
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Text>
                  </XStack>
                ))}
              </XStack>
            </YStack>
          )}

          <YStack gap="$3">
            <H3 fontSize="$3" fontWeight="600" color="$color12">
              Update Status
            </H3>
            <XStack flexWrap="wrap" gap="$2">
              <Button
                variant={
                  task.status === 'in_progress' ? 'primary' : 'secondary'
                }
                onClick={() => handleStatusChange('in_progress')}
                icon={Clock}
                flex={1}
                minWidth="calc(50% - 4px)"
              >
                Start Working
              </Button>
              <Button
                variant={task.status === 'pending' ? 'primary' : 'secondary'}
                onClick={() => handleStatusChange('pending')}
                icon={AlertCircle}
                flex={1}
                minWidth="calc(50% - 4px)"
              >
                Mark Pending
              </Button>
              <Button
                variant={task.status === 'completed' ? 'success' : 'secondary'}
                onClick={() => handleStatusChange('completed')}
                icon={CheckCircle}
                flex={1}
                minWidth="calc(50% - 4px)"
              >
                Mark Complete
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowAddNoteModal(true)}
                icon={MessageSquare}
                flex={1}
                minWidth="calc(50% - 4px)"
              >
                Add Note
              </Button>
            </XStack>
          </YStack>

          {related && Object.keys(related).length > 0 && (
            <YStack gap="$3" borderTopWidth={1} borderColor="$borderColor" paddingTop="$4">
              <H3 fontSize="$3" fontWeight="600" color="$color12">
                Related Items
              </H3>
              <YStack gap="$2">
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
      </Modal>

      <Modal
        isOpen={showReassignModal}
        onClose={() => setShowReassignModal(false)}
        title="Reassign Task"
        size="sm"
      >
        <YStack gap="$4">
          <YStack>
            <Text
              as="label"
              display="block"
              fontSize="$3"
              fontWeight="500"
              color="$color11"
              marginBottom="$2"
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
      </Modal>

      <Modal
        isOpen={showAddNoteModal}
        onClose={() => setShowAddNoteModal(false)}
        title="Add Note"
        size="sm"
      >
        <YStack gap="$4">
          <YStack>
            <Text
              as="label"
              display="block"
              fontSize="$3"
              fontWeight="500"
              color="$color11"
              marginBottom="$2"
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
      </Modal>

      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Send Invitation"
        size="sm"
      >
        <YStack gap="$4">
          <YStack>
            <Text
              as="label"
              display="block"
              fontSize="$3"
              fontWeight="500"
              color="$color11"
              marginBottom="$2"
            >
              Email Address
            </Text>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@example.com"
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
          <Card padding="$3" backgroundColor="$blue2" borderWidth={1} borderColor="$blue8" borderRadius="$4">
            <Text fontSize="$1" color="$blue12">
              This will send an invitation to join the project and complete
              onboarding requirements.
            </Text>
          </Card>
          <XStack gap="$3">
            <Button
              variant="secondary"
              onClick={() => setShowInviteModal(false)}
              flex={1}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSendInvite}
              flex={1}
            >
              Send Invite
            </Button>
          </XStack>
        </YStack>
      </Modal>
    </>
  );
}
