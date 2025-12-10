/* eslint-disable @typescript-eslint/no-explicit-any, no-case-declarations */
import React, { useState } from 'react';
import {
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  UserCheck,
  Filter,
  Calendar,
  AlertCircle,
  FileText,
  Shield,
  UserPlus,
  DollarSign,
  CheckSquare,
  Square,
} from 'lucide-react';
import Tabs from '../../ui/Tabs';
import Button from '../Common/Button';
import Input from '../Common/Input';
import Select from '../Common/Select';
import Textarea from '../Common/Textarea';
import { useApprovals } from '../../hooks/useApprovals';
import {
  ApprovalItem,
  ApprovalItemType,
  ApprovalItemStatus,
  ApprovalPriority,
} from '../../types';
import { formatDate } from '../../utils/dateHelpers';
import { useUser } from '../../contexts/UserContext';

interface ApprovalFilter {
  type?: ApprovalItemType;
  status?: ApprovalItemStatus;
  dateRange?: '7days' | '30days' | '90days' | 'custom';
  assignedTo?: 'me' | 'my_team' | 'all';
  priority?: ApprovalPriority;
}

export default function NotificationsAndApprovalsPage() {
  const { currentUser } = useUser();
  const [activeTab, setActiveTab] = useState<'notifications' | 'approvals'>(
    'approvals'
  );
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [filter, setFilter] = useState<ApprovalFilter>({});
  const [showRequestMoreInfoModal, setShowRequestMoreInfoModal] = useState<
    string | null
  >(null);
  const [requestInfoComment, setRequestInfoComment] = useState('');
  const [showDeferModal, setShowDeferModal] = useState<string | null>(null);
  const [deferAssignee, setDeferAssignee] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { approvals, loading, updateApproval } = useApprovals({
    status: filter.status,
    type: filter.type,
  });

  // For now, show approvals as both notifications and approvals
  // In a real implementation, notifications would be separate informational items
  const notifications = approvals.filter((a) => a.status === 'pending');
  const approvalItems = approvals.filter((a) => a.status === 'pending');

  const getTypeIcon = (type: ApprovalItemType) => {
    switch (type) {
      case 'endorsement_review':
      case 'document_verification':
        return <FileText size={16} />;
      case 'waiver_request':
        return <Shield size={16} />;
      case 'policy_renewal':
        return <Calendar size={16} />;
      case 'bid_approval':
        return <DollarSign size={16} />;
      case 'coverage_gap':
        return <AlertCircle size={16} />;
      case 'user_invite':
        return <UserPlus size={16} />;
      default:
        return <Bell size={16} />;
    }
  };

  const getTypeLabel = (type: ApprovalItemType) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getPriorityColor = (priority: ApprovalPriority) => {
    switch (priority) {
      case 'urgent':
        return 'text-error-600 bg-error-50 border-error-200';
      case 'high':
        return 'text-warning-600 bg-warning-50 border-warning-200';
      case 'normal':
        return 'text-primary-600 bg-primary-50 border-primary-200';
      case 'low':
        return 'text-text-tertiary bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: ApprovalItemStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-warning-100 text-warning-700';
      case 'approved':
        return 'bg-success-100 text-success-700';
      case 'rejected':
        return 'bg-error-100 text-error-700';
      case 'expired':
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  const handleApprove = async (id: string, comment?: string) => {
    try {
      await updateApproval(id, {
        status: 'approved',
        metadata: {
          ...approvals.find((a) => a.id === id)?.metadata,
          approval_comment: comment,
          approved_at: new Date().toISOString(),
          approved_by: currentUser?.id,
        },
      });
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      await updateApproval(id, {
        status: 'rejected',
        metadata: {
          ...approvals.find((a) => a.id === id)?.metadata,
          rejection_reason: reason,
          rejected_at: new Date().toISOString(),
          rejected_by: currentUser?.id,
        },
      });
    } catch (error) {
      console.error('Failed to reject:', error);
    }
  };

  const handleRequestMoreInfo = async (id: string) => {
    if (requestInfoComment.trim()) {
      try {
        await updateApproval(id, {
          metadata: {
            ...approvals.find((a) => a.id === id)?.metadata,
            more_info_requested: true,
            more_info_comment: requestInfoComment,
            requested_info_at: new Date().toISOString(),
          },
        });
        setShowRequestMoreInfoModal(null);
        setRequestInfoComment('');
      } catch (error) {
        console.error('Failed to request more info:', error);
      }
    }
  };

  const handleDefer = async (id: string) => {
    if (deferAssignee) {
      try {
        await updateApproval(id, {
          metadata: {
            ...approvals.find((a) => a.id === id)?.metadata,
            deferred_to: deferAssignee,
            deferred_at: new Date().toISOString(),
          },
        });
        setShowDeferModal(null);
        setDeferAssignee('');
      } catch (error) {
        console.error('Failed to defer:', error);
      }
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    for (const id of selectedItems) {
      if (action === 'approve') {
        await handleApprove(id);
      } else {
        await handleReject(id, 'Bulk rejection');
      }
    }
    setSelectedItems([]);
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === approvalItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(approvalItems.map((a) => a.id));
    }
  };

  const sortedApprovals = [...approvalItems].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'date':
        comparison =
          new Date(a.requested_at).getTime() -
          new Date(b.requested_at).getTime();
        break;
      case 'priority':
        const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const filteredApprovals = sortedApprovals.filter((approval) => {
    if (filter.dateRange && filter.dateRange !== 'custom') {
      const daysAgo =
        filter.dateRange === '7days'
          ? 7
          : filter.dateRange === '30days'
            ? 30
            : 90;
      const cutoffDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      if (new Date(approval.requested_at) < cutoffDate) return false;
    }

    if (
      filter.assignedTo === 'me' &&
      approval.requested_by !== currentUser?.id
    ) {
      return false;
    }

    if (filter.priority && approval.priority !== filter.priority) {
      return false;
    }

    return true;
  });

  const tabs = [
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      badge: notifications.length,
      content: (
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="mx-auto text-text-tertiary mb-4" size={48} />
              <p className="text-text-primary font-medium mb-2">
                No notifications
              </p>
              <p className="text-text-secondary text-sm">
                You're all caught up!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-4 bg-bg-secondary rounded-lg border border-border"
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5">
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-text-primary">
                          {notification.title}
                        </p>
                        <span className="text-xs text-text-tertiary">
                          {formatDate(notification.requested_at)}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary">
                        {notification.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'approvals',
      label: 'Approvals',
      icon: UserCheck,
      badge: approvalItems.length,
      content: (
        <div className="space-y-4">
          {/* Filters and Sort */}
          <div className="bg-bg-secondary rounded-lg p-4 border border-border">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select
                label="Type"
                value={filter.type || 'all'}
                onChange={(e) =>
                  setFilter({
                    ...filter,
                    type:
                      e.target.value === 'all'
                        ? undefined
                        : (e.target.value as ApprovalItemType),
                  })
                }
                options={[
                  { value: 'all', label: 'All Types' },
                  { value: 'endorsement_review', label: 'Endorsement Review' },
                  { value: 'waiver_request', label: 'Waiver Request' },
                  { value: 'policy_renewal', label: 'Policy Renewal' },
                  {
                    value: 'document_verification',
                    label: 'Document Verification',
                  },
                  { value: 'bid_approval', label: 'Bid Approval' },
                  { value: 'coverage_gap', label: 'Coverage Gap' },
                  { value: 'user_invite', label: 'User Invite' },
                ]}
                fullWidth
              />
              <Select
                label="Status"
                value={filter.status || 'all'}
                onChange={(e) =>
                  setFilter({
                    ...filter,
                    status:
                      e.target.value === 'all'
                        ? undefined
                        : (e.target.value as ApprovalItemStatus),
                  })
                }
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' },
                  { value: 'expired', label: 'Expired' },
                ]}
                fullWidth
              />
              <Select
                label="Date Range"
                value={filter.dateRange || 'all'}
                onChange={(e) =>
                  setFilter({
                    ...filter,
                    dateRange:
                      e.target.value === 'all'
                        ? undefined
                        : (e.target.value as any),
                  })
                }
                options={[
                  { value: 'all', label: 'All Time' },
                  { value: '7days', label: 'Last 7 Days' },
                  { value: '30days', label: 'Last 30 Days' },
                  { value: '90days', label: 'Last 90 Days' },
                ]}
                fullWidth
              />
              <Select
                label="Sort By"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                options={[
                  { value: 'date', label: 'Date' },
                  { value: 'priority', label: 'Priority' },
                  { value: 'type', label: 'Type' },
                ]}
                fullWidth
              />
            </div>
            <div className="mt-4 flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                }
              >
                {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
              </Button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 flex items-center justify-between">
              <span className="text-sm font-medium text-primary-900">
                {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''}{' '}
                selected
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => handleBulkAction('approve')}
                  leftIcon={CheckCircle}
                >
                  Bulk Approve
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleBulkAction('reject')}
                  leftIcon={XCircle}
                >
                  Bulk Reject
                </Button>
              </div>
            </div>
          )}

          {/* Approvals List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
              <p className="text-text-secondary">Loading approvals...</p>
            </div>
          ) : filteredApprovals.length === 0 ? (
            <div className="text-center py-12">
              <UserCheck
                className="mx-auto text-text-tertiary mb-4"
                size={48}
              />
              <p className="text-text-primary font-medium mb-2">
                No approvals found
              </p>
              <p className="text-text-secondary text-sm">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredApprovals.map((approval) => (
                <div
                  key={approval.id}
                  className="p-4 bg-bg-secondary rounded-lg border border-border hover:border-primary-300 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <button
                      onClick={() => toggleSelectItem(approval.id)}
                      className="mt-1 text-text-tertiary hover:text-primary-600"
                    >
                      {selectedItems.includes(approval.id) ? (
                        <CheckSquare size={20} className="text-primary-600" />
                      ) : (
                        <Square size={20} />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(approval.type)}
                          <span className="text-xs px-2 py-0.5 bg-bg-tertiary rounded text-text-secondary">
                            {getTypeLabel(approval.type)}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded border ${getPriorityColor(approval.priority)}`}
                          >
                            {approval.priority.toUpperCase()}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(approval.status)}`}
                        >
                          {approval.status.toUpperCase()}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-text-primary mb-1">
                        {approval.title}
                      </h3>
                      <p className="text-sm text-text-secondary mb-2">
                        {approval.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-text-tertiary mb-3">
                        <span>
                          Requested {formatDate(approval.requested_at)}
                        </span>
                        {approval.due_date && (
                          <span>Due {formatDate(approval.due_date)}</span>
                        )}
                      </div>
                      {approval.status === 'pending' && (
                        <div className="flex items-center space-x-2 flex-wrap gap-2">
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleApprove(approval.id)}
                            leftIcon={CheckCircle}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() =>
                              handleReject(approval.id, 'Rejected')
                            }
                            leftIcon={XCircle}
                          >
                            Reject
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              setShowRequestMoreInfoModal(approval.id)
                            }
                            leftIcon={MessageSquare}
                          >
                            Request More Info
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDeferModal(approval.id)}
                            leftIcon={Clock}
                          >
                            Defer
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Notifications & Approvals
          </h1>
          <p className="text-text-secondary">
            Manage your notifications and pending approvals
          </p>
        </div>
      </div>

      <Tabs
        tabs={tabs}
        variant="enclosed"
        onChange={(tabId) => setActiveTab(tabId as any)}
      />

      {/* Request More Info Modal */}
      {showRequestMoreInfoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-primary rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Request More Information
            </h3>
            <Textarea
              label="What information do you need?"
              value={requestInfoComment}
              onChange={(e) => setRequestInfoComment(e.target.value)}
              placeholder="Enter your questions or information needed..."
              rows={4}
              fullWidth
              required
            />
            <div className="flex space-x-3 mt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowRequestMoreInfoModal(null);
                  setRequestInfoComment('');
                }}
                fullWidth
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => handleRequestMoreInfo(showRequestMoreInfoModal)}
                disabled={!requestInfoComment.trim()}
                fullWidth
              >
                Send Request
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Defer Modal */}
      {showDeferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-primary rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Defer Approval
            </h3>
            <Input
              label="Assign to (User ID or Email)"
              value={deferAssignee}
              onChange={(e) => setDeferAssignee(e.target.value)}
              placeholder="user@example.com"
              fullWidth
              required
            />
            <div className="flex space-x-3 mt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDeferModal(null);
                  setDeferAssignee('');
                }}
                fullWidth
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => handleDefer(showDeferModal)}
                disabled={!deferAssignee.trim()}
                fullWidth
              >
                Defer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
