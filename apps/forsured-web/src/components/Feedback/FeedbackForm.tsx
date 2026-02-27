/**
 * FeedbackForm - Form for creating new feedback
 */

import React, { useState, useCallback } from 'react';
import { Bug, Lightbulb, HelpCircle, MessageCircle, Upload, X, Loader2 } from 'lucide-react';
import { Stack, Row, Text, Button, Input } from '@scaffald/ui';
import { toast } from 'sonner';
import { trpc } from '../../lib/trpc';
import { PageScreenshot } from './PageScreenshot';

type FeedbackType = 'bug' | 'feature' | 'support' | 'general';

interface AttachmentPreview {
  id: string;
  file: File;
  blob?: Blob;
  preview?: string;
}

interface FeedbackFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const TYPE_OPTIONS: { type: FeedbackType; icon: typeof Bug; label: string; description: string }[] = [
  { type: 'bug', icon: Bug, label: 'Bug Report', description: 'Something is broken' },
  { type: 'feature', icon: Lightbulb, label: 'Feature Request', description: 'Suggest an improvement' },
  { type: 'support', icon: HelpCircle, label: 'Support', description: 'Get help with something' },
  { type: 'general', icon: MessageCircle, label: 'General', description: 'Other feedback' },
];

export function FeedbackForm({ onSuccess, onCancel }: FeedbackFormProps) {
  const [type, setType] = useState<FeedbackType | null>(null);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<AttachmentPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const utils = trpc.useUtils();
  const createMutation = trpc.feedback.create.useMutation();
  const getUploadUrlMutation = trpc.feedback.getUploadUrl.useMutation();

  // Current page URL
  const sourceUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    for (const file of files) {
      // Check file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        toast.error(`File too large: ${file.name}`, {
          description: 'Maximum file size is 2MB',
        });
        continue;
      }

      // Create preview
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;

      setAttachments((prev) => [...prev, { id, file, preview }]);
    }

    // Reset input
    e.target.value = '';
  }, []);

  // Handle screenshot capture
  const handleScreenshotCapture = useCallback((blob: Blob, fileName: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const file = new File([blob], fileName, { type: 'image/png' });
    const preview = URL.createObjectURL(blob);

    setAttachments((prev) => [...prev, { id, file, blob, preview }]);
  }, []);

  // Remove attachment
  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const att = prev.find((a) => a.id === id);
      if (att?.preview) {
        URL.revokeObjectURL(att.preview);
      }
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!type) {
      toast.error('Please select a feedback type');
      return;
    }

    if (!subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }

    if (!content.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setSubmitting(true);

    try {
      // Upload attachments first
      const uploadedAttachments: { fileName: string; filePath: string; fileSize: number; mimeType: string }[] = [];

      if (attachments.length > 0) {
        setUploading(true);

        for (const att of attachments) {
          try {
            // Get signed upload URL
            const { signedUrl, path } = await getUploadUrlMutation.mutateAsync({
              feedbackId: 'pending', // Will be replaced by actual ID in router
              fileName: att.file.name,
              mimeType: att.file.type || 'application/octet-stream',
            });

            // Upload file
            const uploadResponse = await fetch(signedUrl, {
              method: 'PUT',
              body: att.file,
              headers: {
                'Content-Type': att.file.type || 'application/octet-stream',
              },
            });

            if (!uploadResponse.ok) {
              throw new Error(`Upload failed: ${uploadResponse.statusText}`);
            }

            uploadedAttachments.push({
              fileName: att.file.name,
              filePath: path,
              fileSize: att.file.size,
              mimeType: att.file.type || 'application/octet-stream',
            });
          } catch (uploadError) {
            console.error('Failed to upload attachment:', uploadError);
            toast.error(`Failed to upload ${att.file.name}`);
          }
        }

        setUploading(false);
      }

      // Create feedback
      await createMutation.mutateAsync({
        type,
        subject: subject.trim(),
        content: content.trim(),
        sourceUrl,
        attachments: uploadedAttachments,
      });

      // Invalidate queries
      await utils.feedback.list.invalidate();
      await utils.feedback.getUnreadCount.invalidate();

      toast.success('Feedback submitted', {
        description: 'Thank you for your feedback!',
      });

      onSuccess();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast.error('Failed to submit feedback', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack style={{ gap: 20 }}>
        {/* Type selection */}
        <Stack style={{ gap: 8 }}>
          <Text style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-gray-11)' }}>
            What type of feedback?
          </Text>
          <Row style={{ flexWrap: 'wrap', gap: 8 }}>
            {TYPE_OPTIONS.map(({ type: t, icon: Icon, label, description }) => (
              <Button
                key={t}
                type="button"
                onPress={() => setType(t)}
                variant={type === t ? 'default' : 'outline'}
                style={{
                  flex: '1 1 calc(50% - 4px)',
                  minWidth: 140,
                  padding: 12,
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  height: 'auto',
                }}
              >
                <Icon size={20} />
                <Text style={{ fontSize: 13, fontWeight: 500 }}>{label}</Text>
                <Text style={{ fontSize: 11, color: type === t ? 'inherit' : 'var(--color-gray-9)' }}>
                  {description}
                </Text>
              </Button>
            ))}
          </Row>
        </Stack>

        {/* Subject */}
        <Stack style={{ gap: 8 }}>
          <Text style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-gray-11)' }}>
            Subject
          </Text>
          <Input
            value={subject}
            onChangeText={setSubject}
            placeholder="Brief summary of your feedback"
            maxLength={200}
            style={{ width: '100%' }}
          />
        </Stack>

        {/* Content */}
        <Stack style={{ gap: 8 }}>
          <Text style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-gray-11)' }}>
            Message
          </Text>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Describe your feedback in detail..."
            rows={4}
            maxLength={10000}
            style={{
              width: '100%',
              resize: 'vertical',
              padding: 12,
              fontSize: 14,
              borderRadius: 8,
              border: '1px solid var(--color-gray-6)',
              backgroundColor: 'var(--color-background)',
              color: 'var(--color-gray-12)',
              fontFamily: 'inherit',
              outline: 'none',
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
        </Stack>

        {/* Source URL (read-only info) */}
        <Stack style={{ gap: 4 }}>
          <Text style={{ fontSize: 11, color: 'var(--color-gray-9)' }}>
            Submitting from: {sourceUrl.length > 60 ? `${sourceUrl.slice(0, 60)}...` : sourceUrl}
          </Text>
        </Stack>

        {/* Attachments */}
        <Stack style={{ gap: 8 }}>
          <Text style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-gray-11)' }}>
            Attachments
          </Text>

          <Row style={{ gap: 8 }}>
            <PageScreenshot onCapture={handleScreenshotCapture} disabled={submitting} />

            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onPress={() => document.getElementById('file-input')?.click()}
              style={{ padding: 8, paddingLeft: 12, paddingRight: 12, borderRadius: 6 }}
            >
              <Row style={{ alignItems: 'center', gap: 6 }}>
                <Upload size={16} />
                <Text style={{ fontSize: 13 }}>Upload Files</Text>
              </Row>
            </Button>
            <input
              id="file-input"
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </Row>

          {/* Attachment previews */}
          {attachments.length > 0 && (
            <Stack style={{ gap: 8, marginTop: 8 }}>
              {attachments.map((att) => (
                <Row
                  key={att.id}
                  style={{
                    alignItems: 'center',
                    gap: 8,
                    padding: 8,
                    backgroundColor: 'var(--color-gray-2)',
                    borderRadius: 6,
                    border: '1px solid var(--color-gray-4)',
                  }}
                >
                  {att.preview ? (
                    <img
                      src={att.preview}
                      alt={att.file.name}
                      style={{
                        width: 40,
                        height: 40,
                        objectFit: 'cover',
                        borderRadius: 4,
                      }}
                    />
                  ) : (
                    <Stack
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 4,
                        backgroundColor: 'var(--color-gray-4)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Upload size={16} color="var(--color-gray-9)" />
                    </Stack>
                  )}
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 12,
                      color: 'var(--color-gray-11)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {att.file.name}
                  </Text>
                  <Text style={{ fontSize: 11, color: 'var(--color-gray-9)' }}>
                    {(att.file.size / 1024).toFixed(0)} KB
                  </Text>
                  <Button
                    type="button"
                    variant="ghost"
                    onPress={() => removeAttachment(att.id)}
                    disabled={submitting}
                    style={{ padding: 4 }}
                  >
                    <X size={14} color="var(--color-gray-9)" />
                  </Button>
                </Row>
              ))}
            </Stack>
          )}

          <Text style={{ fontSize: 11, color: 'var(--color-gray-8)' }}>
            Max 2MB per file. Supported: images, PDF, Word documents
          </Text>
        </Stack>

        {/* Actions */}
        <Row style={{ gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
          <Button type="button" variant="ghost" onPress={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="default" disabled={submitting || !type}>
            {submitting ? (
              <Row style={{ alignItems: 'center', gap: 6 }}>
                <Loader2 size={16} className="animate-spin" />
                <Text>{uploading ? 'Uploading...' : 'Submitting...'}</Text>
              </Row>
            ) : (
              'Submit Feedback'
            )}
          </Button>
        </Row>
      </Stack>
    </form>
  );
}

export default FeedbackForm;
