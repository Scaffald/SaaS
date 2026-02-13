/**
 * Admin Feedback Management Page
 *
 * Two-panel layout for managing user feedback:
 * - Left: Filterable list of feedback items
 * - Right: Selected item detail with conversation and actions
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  RefreshCcw,
  MessageSquare,
  Bug,
  Lightbulb,
  HelpCircle,
  MessageCircle,
  User,
  Clock,
  CheckCircle,
  Archive,
  UserPlus,
  Send,
  Upload,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  Stack,
  Row,
  Text,
  Button,
  H1,
  H3,
  Card,
  Input,
  Spinner,
  SearchSelect,
} from '@scaffald/ui';
import { toast } from 'sonner';
import { trpc } from '../../lib/trpc';
import { FeedbackReassignModal } from '../../components/Admin/FeedbackReassignModal';

type FeedbackType = 'bug' | 'feature' | 'support' | 'general';
type FeedbackStatus = 'open' | 'in_progress' | 'resolved' | 'archived';
type TabFilter = 'unassigned' | 'mine' | 'all';

interface AttachmentPreview {
  id: string;
  file: File;
  preview?: string;
}

const TYPE_CONFIG = {
  bug: { icon: Bug, label: 'Bug Report', color: 'var(--color-red-9)' },
  feature: { icon: Lightbulb, label: 'Feature Request', color: 'var(--color-yellow-9)' },
  support: { icon: HelpCircle, label: 'Support Request', color: 'var(--color-blue-9)' },
  general: { icon: MessageCircle, label: 'General Feedback', color: 'var(--color-gray-9)' },
} as const;

const STATUS_CONFIG = {
  open: { label: 'Open', color: 'var(--color-blue-9)', bg: 'var(--color-blue-3)' },
  in_progress: { label: 'In Progress', color: 'var(--color-yellow-9)', bg: 'var(--color-yellow-3)' },
  resolved: { label: 'Resolved', color: 'var(--color-green-9)', bg: 'var(--color-green-3)' },
  archived: { label: 'Archived', color: 'var(--color-gray-9)', bg: 'var(--color-gray-3)' },
} as const;

function AdminFeedback() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tabFilter, setTabFilter] = useState<TabFilter>('unassigned');
  const [typeFilter, setTypeFilter] = useState<FeedbackType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [attachments, setAttachments] = useState<AttachmentPreview[]>([]);
  const [sending, setSending] = useState(false);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);

  const utils = trpc.useUtils();

  // Queries
  const {
    data: feedbackItems,
    isLoading: loadingList,
    refetch: refetchList,
  } = trpc.feedback.admin.list.useQuery({
    tab: tabFilter,
    type: typeFilter === 'all' ? undefined : typeFilter,
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: searchQuery || undefined,
  });

  const { data: selectedFeedback, isLoading: loadingDetail } = trpc.feedback.admin.get.useQuery(
    { feedbackId: selectedId! },
    { enabled: !!selectedId }
  );

  const { data: stats } = trpc.feedback.admin.getStats.useQuery();

  // Mutations
  const replyMutation = trpc.feedback.admin.reply.useMutation();
  const claimMutation = trpc.feedback.admin.claim.useMutation();
  const updateStatusMutation = trpc.feedback.admin.updateStatus.useMutation();
  const getUploadUrlMutation = trpc.feedback.getUploadUrl.useMutation();

  // Check URL for specific feedback ID
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fbId = params.get('id');
    if (fbId) {
      setSelectedId(fbId);
      // Clean up URL
      params.delete('id');
      const newUrl = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(`File too large: ${file.name}`);
        continue;
      }
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
      setAttachments((prev) => [...prev, { id, file, preview }]);
    }
    e.target.value = '';
  }, []);

  // Remove attachment
  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const att = prev.find((a) => a.id === id);
      if (att?.preview) URL.revokeObjectURL(att.preview);
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  // Handle reply
  const handleReply = async () => {
    if (!selectedId || (!replyContent.trim() && attachments.length === 0)) return;

    setSending(true);
    try {
      // Upload attachments
      const uploadedAttachments: { fileName: string; filePath: string; fileSize: number; mimeType: string }[] = [];

      for (const att of attachments) {
        try {
          const { signedUrl, path } = await getUploadUrlMutation.mutateAsync({
            feedbackId: selectedId,
            fileName: att.file.name,
            mimeType: att.file.type || 'application/octet-stream',
          });

          await fetch(signedUrl, {
            method: 'PUT',
            body: att.file,
            headers: { 'Content-Type': att.file.type || 'application/octet-stream' },
          });

          uploadedAttachments.push({
            fileName: att.file.name,
            filePath: path,
            fileSize: att.file.size,
            mimeType: att.file.type || 'application/octet-stream',
          });
        } catch (err) {
          console.error('Upload failed:', err);
        }
      }

      await replyMutation.mutateAsync({
        feedbackId: selectedId,
        content: replyContent.trim() || '(attachment)',
        attachments: uploadedAttachments,
      });

      setReplyContent('');
      setAttachments([]);
      await utils.feedback.admin.get.invalidate({ feedbackId: selectedId });
      await refetchList();
      toast.success('Reply sent');
    } catch (error) {
      console.error('Reply failed:', error);
      toast.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  // Handle claim
  const handleClaim = async () => {
    if (!selectedId) return;
    try {
      await claimMutation.mutateAsync({ feedbackId: selectedId });
      await utils.feedback.admin.get.invalidate({ feedbackId: selectedId });
      await refetchList();
      toast.success('Feedback claimed');
    } catch (error) {
      console.error('Claim failed:', error);
      toast.error('Failed to claim feedback');
    }
  };

  // Handle status change
  const handleStatusChange = async (newStatus: FeedbackStatus) => {
    if (!selectedId) return;
    try {
      await updateStatusMutation.mutateAsync({ feedbackId: selectedId, status: newStatus });
      await utils.feedback.admin.get.invalidate({ feedbackId: selectedId });
      await refetchList();
      toast.success(`Status updated to ${STATUS_CONFIG[newStatus].label}`);
    } catch (error) {
      console.error('Status update failed:', error);
      toast.error('Failed to update status');
    }
  };

  // Format relative time
  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <Stack style={{ height: '100%', padding: 24, gap: 24 }}>
      {/* Header */}
      <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Row style={{ alignItems: 'center', gap: 12 }}>
          <MessageSquare size={28} color="var(--color-blue-9)" />
          <H1>Feedback Management</H1>
        </Row>
        <Button variant="outline" onPress={() => refetchList()}>
          <RefreshCcw size={16} />
          <Text style={{ marginLeft: 6 }}>Refresh</Text>
        </Button>
      </Row>

      {/* Stats badges */}
      <Row style={{ gap: 12 }}>
        <Stack
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--color-red-3)',
            borderRadius: 8,
            border: '1px solid var(--color-red-6)',
          }}
        >
          <Text style={{ fontSize: 12, color: 'var(--color-red-11)' }}>Unassigned</Text>
          <Text style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-red-11)' }}>
            {stats?.unassignedCount || 0}
          </Text>
        </Stack>
        <Stack
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--color-blue-3)',
            borderRadius: 8,
            border: '1px solid var(--color-blue-6)',
          }}
        >
          <Text style={{ fontSize: 12, color: 'var(--color-blue-11)' }}>My Unread</Text>
          <Text style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-blue-11)' }}>
            {stats?.myUnreadCount || 0}
          </Text>
        </Stack>
        <Stack
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--color-gray-3)',
            borderRadius: 8,
            border: '1px solid var(--color-gray-6)',
          }}
        >
          <Text style={{ fontSize: 12, color: 'var(--color-gray-11)' }}>Total Active</Text>
          <Text style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-gray-11)' }}>
            {stats?.totalActive || 0}
          </Text>
        </Stack>
      </Row>

      {/* Main content */}
      <Row style={{ flex: 1, gap: 24, minHeight: 0 }}>
        {/* Left panel - List */}
        <Card style={{ width: 400, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Tabs */}
          <Row style={{ borderBottom: '1px solid var(--color-border)', padding: 8, gap: 4 }}>
            {(['unassigned', 'mine', 'all'] as TabFilter[]).map((tab) => (
              <Button
                key={tab}
                variant={tabFilter === tab ? 'default' : 'ghost'}
                size="sm"
                onPress={() => setTabFilter(tab)}
              >
                {tab === 'unassigned' ? 'Unassigned' : tab === 'mine' ? 'My Items' : 'All'}
              </Button>
            ))}
          </Row>

          {/* Filters */}
          <Stack style={{ padding: 12, gap: 8, borderBottom: '1px solid var(--color-border)' }}>
            <Input
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by subject..."
              leftIcon={<Search size={16} />}
            />
            <Row style={{ gap: 8 }}>
              <SearchSelect
                value={typeFilter}
                onChange={(v) => setTypeFilter((v as FeedbackType | 'all') || 'all')}
                placeholder="Type"
                searchable={false}
                options={[
                  { value: 'all', label: 'All Types' },
                  { value: 'bug', label: 'Bug' },
                  { value: 'feature', label: 'Feature' },
                  { value: 'support', label: 'Support' },
                  { value: 'general', label: 'General' },
                ]}
                style={{ flex: 1 }}
              />
              <SearchSelect
                value={statusFilter}
                onChange={(v) => setStatusFilter((v as FeedbackStatus | 'all') || 'all')}
                placeholder="Status"
                searchable={false}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'open', label: 'Open' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'resolved', label: 'Resolved' },
                  { value: 'archived', label: 'Archived' },
                ]}
                style={{ flex: 1 }}
              />
            </Row>
          </Stack>

          {/* List */}
          <Stack style={{ flex: 1, overflowY: 'auto' }}>
            {loadingList ? (
              <Stack style={{ alignItems: 'center', padding: 24 }}>
                <Spinner size="medium" />
              </Stack>
            ) : !feedbackItems?.length ? (
              <Stack style={{ alignItems: 'center', padding: 24, gap: 8 }}>
                <MessageCircle size={32} color="var(--color-gray-7)" />
                <Text style={{ color: 'var(--color-gray-9)' }}>No feedback items found</Text>
              </Stack>
            ) : (
              feedbackItems.map((item) => {
                const typeConfig = TYPE_CONFIG[item.type as FeedbackType];
                const statusConfig = STATUS_CONFIG[item.status as FeedbackStatus];
                const Icon = typeConfig?.icon || MessageCircle;
                const isSelected = selectedId === item.id;
                const hasUnread = item.hasUnreadUserReply;

                return (
                  <Stack
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    style={{
                      padding: 12,
                      borderBottom: '1px solid var(--color-border)',
                      backgroundColor: isSelected ? 'var(--color-blue-3)' : 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <Row style={{ alignItems: 'flex-start', gap: 8 }}>
                      <Icon size={16} color={typeConfig?.color} style={{ marginTop: 2 }} />
                      <Stack style={{ flex: 1, gap: 4 }}>
                        <Row style={{ alignItems: 'center', gap: 6 }}>
                          <Text
                            style={{
                              flex: 1,
                              fontSize: 14,
                              fontWeight: hasUnread ? 600 : 500,
                              color: 'var(--color-gray-12)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.subject}
                          </Text>
                          {hasUnread && (
                            <Stack
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: 'var(--color-blue-9)',
                              }}
                            />
                          )}
                        </Row>
                        <Row style={{ alignItems: 'center', gap: 8 }}>
                          <Text style={{ fontSize: 12, color: 'var(--color-gray-9)' }}>
                            {item.userName || 'Unknown User'}
                          </Text>
                          <Stack
                            style={{
                              backgroundColor: statusConfig?.bg,
                              paddingLeft: 6,
                              paddingRight: 6,
                              paddingTop: 1,
                              paddingBottom: 1,
                              borderRadius: 3,
                            }}
                          >
                            <Text style={{ fontSize: 10, fontWeight: 500, color: statusConfig?.color }}>
                              {statusConfig?.label}
                            </Text>
                          </Stack>
                          <Text style={{ fontSize: 11, color: 'var(--color-gray-8)' }}>
                            {formatTime(item.updated_at)}
                          </Text>
                        </Row>
                      </Stack>
                    </Row>
                  </Stack>
                );
              })
            )}
          </Stack>
        </Card>

        {/* Right panel - Detail */}
        <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selectedId ? (
            <Stack style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <MessageSquare size={48} color="var(--color-gray-6)" />
              <Text style={{ fontSize: 16, color: 'var(--color-gray-9)' }}>
                Select a feedback item to view details
              </Text>
            </Stack>
          ) : loadingDetail ? (
            <Stack style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Spinner size="large" />
            </Stack>
          ) : !selectedFeedback ? (
            <Stack style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <AlertCircle size={48} color="var(--color-red-9)" />
              <Text style={{ fontSize: 16, color: 'var(--color-gray-9)' }}>
                Failed to load feedback
              </Text>
            </Stack>
          ) : (
            <>
              {/* Detail header */}
              <Stack style={{ padding: 16, borderBottom: '1px solid var(--color-border)', gap: 12 }}>
                <Row style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <Stack style={{ gap: 4 }}>
                    <Row style={{ alignItems: 'center', gap: 8 }}>
                      {(() => {
                        const Icon = TYPE_CONFIG[selectedFeedback.type as FeedbackType]?.icon || MessageCircle;
                        return <Icon size={20} color={TYPE_CONFIG[selectedFeedback.type as FeedbackType]?.color} />;
                      })()}
                      <H3>{selectedFeedback.subject}</H3>
                    </Row>
                    <Row style={{ alignItems: 'center', gap: 12 }}>
                      <Row style={{ alignItems: 'center', gap: 4 }}>
                        <User size={14} color="var(--color-gray-9)" />
                        <Text style={{ fontSize: 13, color: 'var(--color-gray-11)' }}>
                          {selectedFeedback.userName || 'Unknown'}
                        </Text>
                      </Row>
                      <Row style={{ alignItems: 'center', gap: 4 }}>
                        <Clock size={14} color="var(--color-gray-9)" />
                        <Text style={{ fontSize: 13, color: 'var(--color-gray-9)' }}>
                          {new Date(selectedFeedback.created_at).toLocaleString()}
                        </Text>
                      </Row>
                    </Row>
                  </Stack>

                  <Row style={{ gap: 8 }}>
                    {/* Status dropdown */}
                    <SearchSelect
                      value={selectedFeedback.status}
                      onChange={(v) => v && handleStatusChange(v as FeedbackStatus)}
                      searchable={false}
                      options={Object.entries(STATUS_CONFIG).map(([value, config]) => ({
                        value,
                        label: config.label,
                      }))}
                      style={{ width: 140 }}
                    />

                    {/* Claim button */}
                    {!selectedFeedback.assigned_to && (
                      <Button variant="outline" onPress={handleClaim}>
                        <CheckCircle size={16} />
                        <Text style={{ marginLeft: 6 }}>Claim</Text>
                      </Button>
                    )}

                    {/* Reassign button */}
                    {selectedFeedback.assigned_to && (
                      <Button variant="outline" onPress={() => setReassignModalOpen(true)}>
                        <UserPlus size={16} />
                        <Text style={{ marginLeft: 6 }}>Reassign</Text>
                      </Button>
                    )}
                  </Row>
                </Row>

                {/* Assigned info */}
                {selectedFeedback.assigned_to && (
                  <Row
                    style={{
                      padding: 8,
                      backgroundColor: 'var(--color-gray-2)',
                      borderRadius: 6,
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <User size={14} color="var(--color-gray-9)" />
                    <Text style={{ fontSize: 13, color: 'var(--color-gray-11)' }}>
                      Assigned to: {selectedFeedback.assigneeName || 'Unknown'}
                    </Text>
                  </Row>
                )}

                {/* Source URL */}
                {selectedFeedback.source_url && (
                  <Text style={{ fontSize: 12, color: 'var(--color-gray-9)' }}>
                    From: {selectedFeedback.source_url}
                  </Text>
                )}
              </Stack>

              {/* Messages */}
              <Stack style={{ flex: 1, overflowY: 'auto', padding: 16, gap: 12 }}>
                {selectedFeedback.messages.map((msg) => {
                  const isAdmin = msg.sender_type === 'admin';
                  return (
                    <Stack
                      key={msg.id}
                      style={{
                        maxWidth: '80%',
                        alignSelf: isAdmin ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <Stack
                        style={{
                          padding: 12,
                          backgroundColor: isAdmin ? 'var(--color-blue-9)' : 'var(--color-gray-3)',
                          borderRadius: 12,
                          borderBottomRightRadius: isAdmin ? 4 : 12,
                          borderBottomLeftRadius: isAdmin ? 12 : 4,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            color: isAdmin ? 'white' : 'var(--color-gray-12)',
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {msg.content}
                        </Text>
                      </Stack>

                      {/* Attachments */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <Row style={{ gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                          {msg.attachments.map((att) => (
                            <a
                              key={att.id}
                              href={att.downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                padding: '4px 8px',
                                backgroundColor: 'var(--color-gray-3)',
                                borderRadius: 4,
                                fontSize: 12,
                                color: 'var(--color-blue-9)',
                                textDecoration: 'none',
                              }}
                            >
                              {att.file_name}
                            </a>
                          ))}
                        </Row>
                      )}

                      <Text
                        style={{
                          fontSize: 11,
                          color: 'var(--color-gray-9)',
                          marginTop: 4,
                          textAlign: isAdmin ? 'right' : 'left',
                        }}
                      >
                        {msg.senderName} - {formatTime(msg.created_at)}
                      </Text>
                    </Stack>
                  );
                })}
              </Stack>

              {/* Reply input */}
              <Stack
                style={{
                  padding: 12,
                  borderTop: '1px solid var(--color-border)',
                  gap: 8,
                }}
              >
                {/* Attachment previews */}
                {attachments.length > 0 && (
                  <Row style={{ gap: 8, flexWrap: 'wrap' }}>
                    {attachments.map((att) => (
                      <Stack
                        key={att.id}
                        style={{
                          position: 'relative',
                          padding: '4px 8px',
                          backgroundColor: 'var(--color-gray-3)',
                          borderRadius: 4,
                        }}
                      >
                        <Text style={{ fontSize: 12, color: 'var(--color-gray-11)' }}>
                          {att.file.name}
                        </Text>
                        <Button
                          onPress={() => removeAttachment(att.id)}
                          variant="ghost"
                          style={{
                            position: 'absolute',
                            top: -6,
                            right: -6,
                            width: 16,
                            height: 16,
                            padding: 0,
                            backgroundColor: 'var(--color-gray-12)',
                            borderRadius: '50%',
                          }}
                        >
                          <X size={10} color="white" />
                        </Button>
                      </Stack>
                    ))}
                  </Row>
                )}

                <Row style={{ gap: 8 }}>
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Type your reply..."
                    rows={2}
                    disabled={sending}
                    style={{
                      flex: 1,
                      resize: 'none',
                      padding: 10,
                      fontSize: 14,
                      borderRadius: 8,
                      border: '1px solid var(--color-gray-6)',
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-gray-12)',
                      fontFamily: 'inherit',
                      outline: 'none',
                      opacity: sending ? 0.6 : 1,
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--color-blue-8)';
                      e.target.style.boxShadow = '0 0 0 2px var(--color-blue-4)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--color-gray-6)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </Row>

                <Row style={{ gap: 8, justifyContent: 'space-between' }}>
                  <Button
                    variant="ghost"
                    onPress={() => document.getElementById('admin-reply-file-input')?.click()}
                    disabled={sending}
                    style={{ padding: 8 }}
                  >
                    <Upload size={16} />
                  </Button>
                  <input
                    id="admin-reply-file-input"
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />

                  <Button
                    onPress={handleReply}
                    variant="default"
                    disabled={sending || (!replyContent.trim() && attachments.length === 0)}
                    style={{ gap: 6 }}
                  >
                    {sending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                    <Text>Send Reply</Text>
                  </Button>
                </Row>
              </Stack>
            </>
          )}
        </Card>
      </Row>

      {/* Reassign Modal */}
      <FeedbackReassignModal
        isOpen={reassignModalOpen}
        onClose={() => setReassignModalOpen(false)}
        feedbackId={selectedId || ''}
        currentAssigneeId={selectedFeedback?.assigned_to}
        onSuccess={async () => {
          await utils.feedback.admin.get.invalidate({ feedbackId: selectedId! });
          await refetchList();
        }}
      />
    </Stack>
  );
}

export default AdminFeedback;
