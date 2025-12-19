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
import { XStack, YStack, Text, H1, SizableText, Card, Spinner } from 'tamagui';
import { TabsCustom } from '@unicornlove/ui';
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
        <YStack gap="$4">
          {notifications.length === 0 ? (
            <YStack alignItems="center" paddingVertical="$12">
              <Bell color="$color10" marginBottom="$4" size={48} />
              <Text fontWeight="500" color="$color12" marginBottom="$2">
                No notifications
              </Text>
              <SizableText size="$3" color="$color11">
                You're all caught up!
              </SizableText>
            </YStack>
          ) : (
            <YStack gap="$3">
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  padding="$4"
                  backgroundColor="$color2"
                  borderRadius="$4"
                  borderWidth={1}
                  borderColor="$borderColor"
                >
                  <XStack alignItems="flex-start" gap="$3">
                    <YStack marginTop={2}>
                      {getTypeIcon(notification.type)}
                    </YStack>
                    <YStack flex={1}>
                      <XStack alignItems="center" justifyContent="space-between" marginBottom="$1">
                        <SizableText size="$3" fontWeight="500" color="$color12">
                          {notification.title}
                        </SizableText>
                        <SizableText size="$1" color="$color10">
                          {formatDate(notification.requested_at)}
                        </SizableText>
                      </XStack>
                      <SizableText size="$3" color="$color11">
                        {notification.description}
                      </SizableText>
                    </YStack>
                  </XStack>
                </Card>
              ))}
            </YStack>
          )}
        </YStack>
      ),
    },
    {
      id: 'approvals',
      label: 'Approvals',
      icon: UserCheck,
      badge: approvalItems.length,
      content: (
        <YStack gap="$4">
          {/* Filters and Sort */}
          <Card backgroundColor="$color2" borderRadius="$4" padding="$4" borderWidth={1} borderColor="$borderColor">
            <XStack flexWrap="wrap" gap="$4" $gtMd={{ flexDirection: 'row' }}>
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
            </XStack>
            <XStack marginTop="$4" alignItems="center" gap="$2">
              <Button
                variant="ghost"
                size="$3"
                onPress={() =>
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                }
              >
                {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
              </Button>
            </XStack>
          </Card>

          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <XStack
              backgroundColor="$blue2"
              borderWidth={1}
              borderColor="$blue5"
              borderRadius="$4"
              padding="$4"
              alignItems="center"
              justifyContent="space-between"
            >
              <SizableText size="$3" fontWeight="500" color="$blue11">
                {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''}{' '}
                selected
              </SizableText>
              <XStack alignItems="center" gap="$2">
                <Button
                  variant="primary"
                  size="$3"
                  onPress={() => handleBulkAction('approve')}
                >
                  <XStack alignItems="center" gap="$2">
                    <CheckCircle size={16} />
                    <Text>Bulk Approve</Text>
                  </XStack>
                </Button>
                <Button
                  variant="danger"
                  size="$3"
                  onPress={() => handleBulkAction('reject')}
                >
                  <XStack alignItems="center" gap="$2">
                    <XCircle size={16} />
                    <Text>Bulk Reject</Text>
                  </XStack>
                </Button>
              </XStack>
            </XStack>
          )}

          {/* Approvals List */}
          {loading ? (
            <YStack alignItems="center" paddingVertical="$12">
              <Spinner size="large" color="$blue9" marginBottom="$2" />
              <SizableText color="$color11">Loading approvals...</SizableText>
            </YStack>
          ) : filteredApprovals.length === 0 ? (
            <YStack alignItems="center" paddingVertical="$12">
              <UserCheck color="$color10" marginBottom="$4" size={48} />
              <Text fontWeight="500" color="$color12" marginBottom="$2">
                No approvals found
              </Text>
              <SizableText size="$3" color="$color11">
                Try adjusting your filters
              </SizableText>
            </YStack>
          ) : (
            <YStack gap="$3">
              {filteredApprovals.map((approval) => (
                <Card
                  key={approval.id}
                  padding="$4"
                  backgroundColor="$color2"
                  borderRadius="$4"
                  borderWidth={1}
                  borderColor="$borderColor"
                  hoverStyle={{
                    borderColor: '$blue7',
                  }}
                >
                  <XStack alignItems="flex-start" gap="$3">
                    <Button
                      unstyled
                      marginTop="$1"
                      color="$color10"
                      hoverStyle={{ color: '$blue9' }}
                      onPress={() => toggleSelectItem(approval.id)}
                    >
                      {selectedItems.includes(approval.id) ? (
                        <CheckSquare size={20} color="$blue9" />
                      ) : (
                        <Square size={20} />
                      )}
                    </Button>
                    <YStack flex={1}>
                      <XStack alignItems="flex-start" justifyContent="space-between" marginBottom="$2">
                        <XStack alignItems="center" gap="$2">
                          {getTypeIcon(approval.type)}
                          <XStack
                            paddingHorizontal="$2"
                            paddingVertical="$1"
                            backgroundColor="$color4"
                            borderRadius="$2"
                          >
                            <SizableText size="$1" color="$color11">
                              {getTypeLabel(approval.type)}
                            </SizableText>
                          </XStack>
                          <XStack
                            paddingHorizontal="$2"
                            paddingVertical="$1"
                            borderRadius="$2"
                            borderWidth={1}
                            borderColor={
                              approval.priority === 'urgent'
                                ? '$red5'
                                : approval.priority === 'high'
                                  ? '$orange5'
                                  : approval.priority === 'normal'
                                    ? '$blue5'
                                    : '$color5'
                            }
                            backgroundColor={
                              approval.priority === 'urgent'
                                ? '$red2'
                                : approval.priority === 'high'
                                  ? '$orange2'
                                  : approval.priority === 'normal'
                                    ? '$blue2'
                                    : '$color2'
                            }
                          >
                            <SizableText
                              size="$1"
                              fontWeight="500"
                              color={
                                approval.priority === 'urgent'
                                  ? '$red11'
                                  : approval.priority === 'high'
                                    ? '$orange11'
                                    : approval.priority === 'normal'
                                      ? '$blue11'
                                      : '$color11'
                              }
                            >
                              {approval.priority.toUpperCase()}
                            </SizableText>
                          </XStack>
                        </XStack>
                        <XStack
                          paddingHorizontal="$2"
                          paddingVertical="$1"
                          borderRadius="$2"
                          backgroundColor={
                            approval.status === 'pending'
                              ? '$orange2'
                              : approval.status === 'approved'
                                ? '$green2'
                                : approval.status === 'rejected'
                                  ? '$red2'
                                  : '$color2'
                          }
                        >
                          <SizableText
                            size="$1"
                            fontWeight="500"
                            color={
                              approval.status === 'pending'
                                ? '$orange11'
                                : approval.status === 'approved'
                                  ? '$green11'
                                  : approval.status === 'rejected'
                                    ? '$red11'
                                    : '$color11'
                            }
                          >
                            {approval.status.toUpperCase()}
                          </SizableText>
                        </XStack>
                      </XStack>
                      <SizableText size="$3" fontWeight="600" color="$color12" marginBottom="$1">
                        {approval.title}
                      </SizableText>
                      <SizableText size="$3" color="$color11" marginBottom="$2">
                        {approval.description}
                      </SizableText>
                      <XStack alignItems="center" gap="$4" marginBottom="$3">
                        <SizableText size="$1" color="$color10">
                          Requested {formatDate(approval.requested_at)}
                        </SizableText>
                        {approval.due_date && (
                          <SizableText size="$1" color="$color10">
                            Due {formatDate(approval.due_date)}
                          </SizableText>
                        )}
                      </XStack>
                      {approval.status === 'pending' && (
                        <XStack alignItems="center" gap="$2" flexWrap="wrap">
                          <Button
                            variant="primary"
                            size="$3"
                            onPress={() => handleApprove(approval.id)}
                          >
                            <XStack alignItems="center" gap="$2">
                              <CheckCircle size={16} />
                              <Text>Approve</Text>
                            </XStack>
                          </Button>
                          <Button
                            variant="danger"
                            size="$3"
                            onPress={() => handleReject(approval.id, 'Rejected')}
                          >
                            <XStack alignItems="center" gap="$2">
                              <XCircle size={16} />
                              <Text>Reject</Text>
                            </XStack>
                          </Button>
                          <Button
                            variant="secondary"
                            size="$3"
                            onPress={() => setShowRequestMoreInfoModal(approval.id)}
                          >
                            <XStack alignItems="center" gap="$2">
                              <MessageSquare size={16} />
                              <Text>Request More Info</Text>
                            </XStack>
                          </Button>
                          <Button
                            variant="outlined"
                            size="$3"
                            onPress={() => setShowDeferModal(approval.id)}
                          >
                            <XStack alignItems="center" gap="$2">
                              <Clock size={16} />
                              <Text>Defer</Text>
                            </XStack>
                          </Button>
                        </XStack>
                      )}
                    </YStack>
                  </XStack>
                </Card>
              ))}
            </YStack>
          )}
        </YStack>
      ),
    },
  ];

  return (
    <YStack gap="$6">
      <XStack alignItems="center" justifyContent="space-between">
        <YStack>
          <H1>Notifications & Approvals</H1>
          <SizableText color="$color11">
            Manage your notifications and pending approvals
          </SizableText>
        </YStack>
      </XStack>

      <TabsCustom
        tabs={tabs}
        variant="enclosed"
        onChange={(tabId) => setActiveTab(tabId as any)}
      />

      {/* Request More Info Modal */}
      {showRequestMoreInfoModal && (
        <XStack
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          backgroundColor="rgba(0,0,0,0.5)"
          alignItems="center"
          justifyContent="center"
          zIndex={50}
          padding="$4"
        >
          <Card
            backgroundColor="$background"
            borderRadius="$4"
            elevation={10}
            maxWidth={448}
            width="100%"
            padding="$6"
          >
            <Text fontSize="$6" fontWeight="600" color="$color12" marginBottom="$4">
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
            <XStack gap="$3" marginTop="$4">
              <Button
                variant="secondary"
                onPress={() => {
                  setShowRequestMoreInfoModal(null);
                  setRequestInfoComment('');
                }}
                flex={1}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onPress={() => handleRequestMoreInfo(showRequestMoreInfoModal)}
                disabled={!requestInfoComment.trim()}
                flex={1}
              >
                Send Request
              </Button>
            </XStack>
          </Card>
        </XStack>
      )}

      {/* Defer Modal */}
      {showDeferModal && (
        <XStack
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          backgroundColor="rgba(0,0,0,0.5)"
          alignItems="center"
          justifyContent="center"
          zIndex={50}
          padding="$4"
        >
          <Card
            backgroundColor="$background"
            borderRadius="$4"
            elevation={10}
            maxWidth={448}
            width="100%"
            padding="$6"
          >
            <Text fontSize="$6" fontWeight="600" color="$color12" marginBottom="$4">
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
            <XStack gap="$3" marginTop="$4">
              <Button
                variant="secondary"
                onPress={() => {
                  setShowDeferModal(null);
                  setDeferAssignee('');
                }}
                flex={1}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onPress={() => handleDefer(showDeferModal)}
                disabled={!deferAssignee.trim()}
                flex={1}
              >
                Defer
              </Button>
            </XStack>
          </Card>
        </XStack>
      )}
    </YStack>
  );
}
