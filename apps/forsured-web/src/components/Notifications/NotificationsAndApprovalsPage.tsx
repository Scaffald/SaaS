/* eslint-disable @typescript-eslint/no-explicit-any, no-case-declarations */
import { useState } from 'react';
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
import { Stack, Row, Text, Card, Spinner } from '@unicornlove/beyond-ui';
import { Tabs as TabsCustom } from '../../ui/Tabs';
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
        <Stack style={{ gap: 'var(--space-4)' }}>
          {notifications.length === 0 ? (
            <Stack style={{ alignItems: 'center', paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-12)' }}>
              <Bell color="var(--color-text-secondary)" style={{ marginBottom: 'var(--space-4)' }} size={48} />
              <Text style={{ fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)' }}>
                No notifications
              </Text>
              <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-text-tertiary)' }}>
                You're all caught up!
              </Text>
            </Stack>
          ) : (
            <Stack style={{ gap: 'var(--space-3)' }}>
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  style={{
                    padding: 'var(--space-4)',
                    backgroundColor: 'var(--color-background-secondary)',
                    borderRadius: 'var(--radius-4)',
                    borderWidth: 1,
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <Row style={{ alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                    <Stack style={{ marginTop: 2 }}>
                      {getTypeIcon(notification.type)}
                    </Stack>
                    <Stack style={{ flex: 1 }}>
                      <Row style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                        <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: '500', color: 'var(--color-text-primary)' }}>
                          {notification.title}
                        </Text>
                        <Text style={{ fontSize: 'var(--font-size-1)', color: 'var(--color-text-secondary)' }}>
                          {formatDate(notification.requested_at)}
                        </Text>
                      </Row>
                      <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-text-tertiary)' }}>
                        {notification.description}
                      </Text>
                    </Stack>
                  </Row>
                </Card>
              ))}
            </Stack>
          )}
        </Stack>
      ),
    },
    {
      id: 'approvals',
      label: 'Approvals',
      icon: UserCheck,
      badge: approvalItems.length,
      content: (
        <Stack style={{ gap: 'var(--space-4)' }}>
          {/* Filters and Sort */}
          <Card style={{ backgroundColor: 'var(--color-background-secondary)', borderRadius: 'var(--radius-4)', padding: 'var(--space-4)', borderWidth: 1, borderColor: 'var(--color-border)' }}>
            <Row style={{ flexWrap: 'wrap', gap: 'var(--space-4)' }}>
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
            </Row>
            <Row style={{ marginTop: 'var(--space-4)', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                }
              >
                {sortOrder === 'asc' ? '^ Ascending' : 'v Descending'}
              </Button>
            </Row>
          </Card>

          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <Row
              style={{
                backgroundColor: 'var(--color-blue-2)',
                borderWidth: 1,
                borderColor: 'var(--color-blue-5)',
                borderRadius: 'var(--radius-4)',
                padding: 'var(--space-4)',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: '500', color: 'var(--color-blue-11)' }}>
                {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''}{' '}
                selected
              </Text>
              <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleBulkAction('approve')}
                >
                  <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
                    <CheckCircle size={16} />
                    <Text>Bulk Approve</Text>
                  </Row>
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleBulkAction('reject')}
                >
                  <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
                    <XCircle size={16} />
                    <Text>Bulk Reject</Text>
                  </Row>
                </Button>
              </Row>
            </Row>
          )}

          {/* Approvals List */}
          {loading ? (
            <Stack style={{ alignItems: 'center', paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-12)' }}>
              <Spinner size="large" style={{ color: 'var(--color-blue-9)', marginBottom: 'var(--space-2)' }} />
              <Text style={{ color: 'var(--color-text-tertiary)' }}>Loading approvals...</Text>
            </Stack>
          ) : filteredApprovals.length === 0 ? (
            <Stack style={{ alignItems: 'center', paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-12)' }}>
              <UserCheck color="var(--color-text-secondary)" style={{ marginBottom: 'var(--space-4)' }} size={48} />
              <Text style={{ fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)' }}>
                No approvals found
              </Text>
              <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-text-tertiary)' }}>
                Try adjusting your filters
              </Text>
            </Stack>
          ) : (
            <Stack style={{ gap: 'var(--space-3)' }}>
              {filteredApprovals.map((approval) => (
                <Card
                  key={approval.id}
                  style={{
                    padding: 'var(--space-4)',
                    backgroundColor: 'var(--color-background-secondary)',
                    borderRadius: 'var(--radius-4)',
                    borderWidth: 1,
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <Row style={{ alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                    <button
                      style={{
                        background: 'none',
                        border: 'none',
                        marginTop: 'var(--space-1)',
                        color: 'var(--color-text-secondary)',
                        cursor: 'pointer',
                      }}
                      onClick={() => toggleSelectItem(approval.id)}
                    >
                      {selectedItems.includes(approval.id) ? (
                        <CheckSquare size={20} color="var(--color-blue-9)" />
                      ) : (
                        <Square size={20} />
                      )}
                    </button>
                    <Stack style={{ flex: 1 }}>
                      <Row style={{ alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                        <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
                          {getTypeIcon(approval.type)}
                          <span
                            style={{
                              paddingLeft: 'var(--space-2)',
                              paddingRight: 'var(--space-2)',
                              paddingTop: 'var(--space-1)',
                              paddingBottom: 'var(--space-1)',
                              backgroundColor: 'var(--color-background-tertiary)',
                              borderRadius: 'var(--radius-2)',
                            }}
                          >
                            <Text style={{ fontSize: 'var(--font-size-1)', color: 'var(--color-text-tertiary)' }}>
                              {getTypeLabel(approval.type)}
                            </Text>
                          </span>
                          <span
                            style={{
                              paddingLeft: 'var(--space-2)',
                              paddingRight: 'var(--space-2)',
                              paddingTop: 'var(--space-1)',
                              paddingBottom: 'var(--space-1)',
                              borderRadius: 'var(--radius-2)',
                              borderWidth: 1,
                              borderStyle: 'solid',
                              borderColor:
                                approval.priority === 'urgent'
                                  ? 'var(--color-red-5)'
                                  : approval.priority === 'high'
                                    ? 'var(--color-orange-5)'
                                    : approval.priority === 'normal'
                                      ? 'var(--color-blue-5)'
                                      : 'var(--color-gray-5)',
                              backgroundColor:
                                approval.priority === 'urgent'
                                  ? 'var(--color-red-2)'
                                  : approval.priority === 'high'
                                    ? 'var(--color-orange-2)'
                                    : approval.priority === 'normal'
                                      ? 'var(--color-blue-2)'
                                      : 'var(--color-gray-2)',
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 'var(--font-size-1)',
                                fontWeight: '500',
                                color:
                                  approval.priority === 'urgent'
                                    ? 'var(--color-red-11)'
                                    : approval.priority === 'high'
                                      ? 'var(--color-orange-11)'
                                      : approval.priority === 'normal'
                                        ? 'var(--color-blue-11)'
                                        : 'var(--color-gray-11)',
                              }}
                            >
                              {approval.priority.toUpperCase()}
                            </Text>
                          </span>
                        </Row>
                        <span
                          style={{
                            paddingLeft: 'var(--space-2)',
                            paddingRight: 'var(--space-2)',
                            paddingTop: 'var(--space-1)',
                            paddingBottom: 'var(--space-1)',
                            borderRadius: 'var(--radius-2)',
                            backgroundColor:
                              approval.status === 'pending'
                                ? 'var(--color-orange-2)'
                                : approval.status === 'approved'
                                  ? 'var(--color-green-2)'
                                  : approval.status === 'rejected'
                                    ? 'var(--color-red-2)'
                                    : 'var(--color-gray-2)',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 'var(--font-size-1)',
                              fontWeight: '500',
                              color:
                                approval.status === 'pending'
                                  ? 'var(--color-orange-11)'
                                  : approval.status === 'approved'
                                    ? 'var(--color-green-11)'
                                    : approval.status === 'rejected'
                                      ? 'var(--color-red-11)'
                                      : 'var(--color-gray-11)',
                            }}
                          >
                            {approval.status.toUpperCase()}
                          </Text>
                        </span>
                      </Row>
                      <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)' }}>
                        {approval.title}
                      </Text>
                      <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-2)' }}>
                        {approval.description}
                      </Text>
                      <Row style={{ alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-3)' }}>
                        <Text style={{ fontSize: 'var(--font-size-1)', color: 'var(--color-text-secondary)' }}>
                          Requested {formatDate(approval.requested_at)}
                        </Text>
                        {approval.due_date && (
                          <Text style={{ fontSize: 'var(--font-size-1)', color: 'var(--color-text-secondary)' }}>
                            Due {formatDate(approval.due_date)}
                          </Text>
                        )}
                      </Row>
                      {approval.status === 'pending' && (
                        <Row style={{ alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleApprove(approval.id)}
                          >
                            <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
                              <CheckCircle size={16} />
                              <Text>Approve</Text>
                            </Row>
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleReject(approval.id, 'Rejected')}
                          >
                            <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
                              <XCircle size={16} />
                              <Text>Reject</Text>
                            </Row>
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setShowRequestMoreInfoModal(approval.id)}
                          >
                            <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
                              <MessageSquare size={16} />
                              <Text>Request More Info</Text>
                            </Row>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDeferModal(approval.id)}
                          >
                            <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
                              <Clock size={16} />
                              <Text>Defer</Text>
                            </Row>
                          </Button>
                        </Row>
                      )}
                    </Stack>
                  </Row>
                </Card>
              ))}
            </Stack>
          )}
        </Stack>
      ),
    },
  ];

  return (
    <Stack style={{ gap: 'var(--space-6)' }}>
      <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack>
          <h1 style={{ margin: 0, fontSize: 'var(--font-size-8)', fontWeight: 'bold' }}>Notifications & Approvals</h1>
          <Text style={{ color: 'var(--color-text-tertiary)' }}>
            Manage your notifications and pending approvals
          </Text>
        </Stack>
      </Row>

      <TabsCustom
        tabs={tabs}
        variant="enclosed"
        onChange={(tabId) => setActiveTab(tabId as any)}
      />

      {/* Request More Info Modal */}
      {showRequestMoreInfoModal && (
        <Row
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: 'var(--space-4)',
          }}
        >
          <Card
            style={{
              backgroundColor: 'var(--color-background)',
              borderRadius: 'var(--radius-4)',
              boxShadow: 'var(--shadow-lg)',
              maxWidth: 448,
              width: '100%',
              padding: 'var(--space-6)',
            }}
          >
            <Text style={{ fontSize: 'var(--font-size-6)', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: 'var(--space-4)' }}>
              Request More Information
            </Text>
            <Textarea
              label="What information do you need?"
              value={requestInfoComment}
              onChange={(e) => setRequestInfoComment(e.target.value)}
              placeholder="Enter your questions or information needed..."
              rows={4}
              fullWidth
              required
            />
            <Row style={{ gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowRequestMoreInfoModal(null);
                  setRequestInfoComment('');
                }}
                style={{ flex: 1 }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => handleRequestMoreInfo(showRequestMoreInfoModal)}
                disabled={!requestInfoComment.trim()}
                style={{ flex: 1 }}
              >
                Send Request
              </Button>
            </Row>
          </Card>
        </Row>
      )}

      {/* Defer Modal */}
      {showDeferModal && (
        <Row
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: 'var(--space-4)',
          }}
        >
          <Card
            style={{
              backgroundColor: 'var(--color-background)',
              borderRadius: 'var(--radius-4)',
              boxShadow: 'var(--shadow-lg)',
              maxWidth: 448,
              width: '100%',
              padding: 'var(--space-6)',
            }}
          >
            <Text style={{ fontSize: 'var(--font-size-6)', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: 'var(--space-4)' }}>
              Defer Approval
            </Text>
            <Input
              label="Assign to (User ID or Email)"
              value={deferAssignee}
              onChange={(e) => setDeferAssignee(e.target.value)}
              placeholder="user@example.com"
              fullWidth
              required
            />
            <Row style={{ gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDeferModal(null);
                  setDeferAssignee('');
                }}
                style={{ flex: 1 }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => handleDefer(showDeferModal)}
                disabled={!deferAssignee.trim()}
                style={{ flex: 1 }}
              >
                Defer
              </Button>
            </Row>
          </Card>
        </Row>
      )}
    </Stack>
  );
}
