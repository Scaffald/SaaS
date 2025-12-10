import React, { useState, useEffect, useMemo } from 'react';
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-error-600 bg-error-50 border-error-200';
      case 'high':
        return 'text-warning-600 bg-warning-50 border-warning-200';
      case 'medium':
        return 'text-primary-600 bg-primary-50 border-primary-200';
      case 'low':
        return 'text-text-tertiary bg-gray-50 border-gray-200';
      default:
        return 'text-text-tertiary bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-primary-100 text-primary-700';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-success-100 text-success-700';
      case 'cancelled':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-primary-100 text-primary-700';
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
        color: 'text-error-600',
        isOverdue: true,
      };
    if (diffDays === 0)
      return { text: 'Due today', color: 'text-warning-600', isOverdue: false };
    if (diffDays === 1)
      return {
        text: 'Due tomorrow',
        color: 'text-warning-600',
        isOverdue: false,
      };
    return {
      text: `Due in ${diffDays} days`,
      color: 'text-text-secondary',
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
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-2xl font-bold text-text-primary">
                  {task.title}
                </h2>
                <span
                  className={`px-2.5 py-1 text-xs font-medium rounded border ${getPriorityColor(task.priority)}`}
                >
                  {task.priority}
                </span>
                <span
                  className={`px-2.5 py-1 text-xs font-medium rounded ${getStatusColor(task.status)}`}
                >
                  {formatStatus(task.status)}
                </span>
              </div>
              <p className="text-text-secondary">{task.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-bg-secondary rounded-lg">
              <Calendar className="text-text-tertiary" size={20} />
              <div>
                <p className="text-xs text-text-tertiary">Due Date</p>
                <p className={`text-sm font-medium ${dueDate.color}`}>
                  {dueDate.text}
                  {dueDate.isOverdue && <span className="ml-2">⚠️</span>}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-bg-secondary rounded-lg">
              <Building className="text-text-tertiary" size={20} />
              <div>
                <p className="text-xs text-text-tertiary">Project</p>
                <p className="text-sm font-medium text-text-primary">
                  {projectName}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">
                Assigned To
              </h3>
              <button
                onClick={() => setShowReassignModal(true)}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                Reassign
              </button>
            </div>
            <div className="space-y-2">
              {assigneeDetails.map((person) => (
                <div
                  key={person?.id}
                  className="flex items-center space-x-3 p-3 bg-bg-secondary rounded-lg"
                >
                  <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-white">
                      {person?.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {person?.name}
                    </p>
                    <p className="text-xs text-text-tertiary">
                      {person?.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {blockers.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="text-error-600" size={18} />
                <h3 className="text-sm font-semibold text-error-600">
                  Blockers
                </h3>
              </div>
              <div className="space-y-2">
                {blockers.map((blocker, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-2 p-3 bg-error-50 border border-error-200 rounded-lg"
                  >
                    <div className="w-2 h-2 bg-error-500 rounded-full mt-1.5"></div>
                    <p className="text-sm text-error-900">{blocker}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tags.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-text-primary">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 bg-bg-secondary text-text-secondary text-xs font-medium rounded-full border border-border"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {quickActions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-text-primary">
                Quick Actions
              </h3>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action}
                    onClick={() => {
                      if (action === 'add_note') setShowAddNoteModal(true);
                      else if (action === 'send_invite') setShowInviteModal(true);
                      else console.log('Action:', action);
                    }}
                    className="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors"
                  >
                    {action
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-text-primary">
              Update Status
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={
                  task.status === 'in_progress' ? 'primary' : 'secondary'
                }
                onClick={() => handleStatusChange('in_progress')}
                icon={Clock}
              >
                Start Working
              </Button>
              <Button
                variant={task.status === 'pending' ? 'primary' : 'secondary'}
                onClick={() => handleStatusChange('pending')}
                icon={AlertCircle}
              >
                Mark Pending
              </Button>
              <Button
                variant={task.status === 'completed' ? 'success' : 'secondary'}
                onClick={() => handleStatusChange('completed')}
                icon={CheckCircle}
              >
                Mark Complete
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowAddNoteModal(true)}
                icon={MessageSquare}
              >
                Add Note
              </Button>
            </div>
          </div>

          {related && Object.keys(related).length > 0 && (
            <div className="space-y-3 border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-text-primary">
                Related Items
              </h3>
              <div className="space-y-2">
                {Object.entries(related).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-2 bg-bg-secondary rounded"
                  >
                    <span className="text-xs text-text-tertiary capitalize">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-mono text-text-secondary">
                      {Array.isArray(value) ? value.join(', ') : value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={showReassignModal}
        onClose={() => setShowReassignModal(false)}
        title="Reassign Task"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Select Assignee
            </label>
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Choose a person...</option>
              {availablePeople.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name} ({person.email})
                </option>
              ))}
            </select>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={() => setShowReassignModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleReassign}
              className="flex-1"
            >
              Reassign
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showAddNoteModal}
        onClose={() => setShowAddNoteModal(false)}
        title="Add Note"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Note
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder="Enter your note here..."
              className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={() => setShowAddNoteModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAddNote}
              className="flex-1"
            >
              Add Note
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Send Invitation"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg">
            <p className="text-xs text-primary-900">
              This will send an invitation to join the project and complete
              onboarding requirements.
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={() => setShowInviteModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSendInvite}
              className="flex-1"
            >
              Send Invite
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
