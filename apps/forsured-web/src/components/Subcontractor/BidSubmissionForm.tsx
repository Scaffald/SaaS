import { useState } from 'react';
import {
  X,
  Upload,
  FileText,
  DollarSign,
  Calendar,
  CheckCircle,
} from 'lucide-react';
import { Stack, Row, Text, Card } from '@unicornlove/beyond-ui';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import Input from '../Common/Input';
import Textarea from '../Common/Textarea';
import { useBids } from '../../hooks/useBids';
import { useAttachments } from '../../hooks/useAttachments';
import { useProjects } from '../../hooks/useProjects';
import { useUser } from '../../contexts/UserContext';
import { EntityType } from '../../types';

interface BidSubmissionFormProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function BidSubmissionForm({
  projectId,
  isOpen,
  onClose,
  onSuccess,
}: BidSubmissionFormProps) {
  const { currentUser } = useUser();
  const { projects } = useProjects();
  const { createBid } = useBids();
  const { createAttachment } = useAttachments();

  const [bidAmount, setBidAmount] = useState('');
  const [scopeOfWork, setScopeOfWork] = useState('');
  const [timelineStart, setTimelineStart] = useState('');
  const [timelineEnd, setTimelineEnd] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const project = projects.find((p) => p.id === projectId);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setError(null);

    if (!bidAmount || !scopeOfWork || !timelineStart || !timelineEnd) {
      setError('Please fill in all required fields');
      return;
    }

    if (uploadedFiles.length === 0) {
      setError('Please upload at least one document (proposal or COI)');
      return;
    }

    setLoading(true);

    try {
      // Upload attachments first
      const attachmentIds: string[] = [];
      for (const file of uploadedFiles) {
        const attachment = await createAttachment({
          entity_type: 'bid' as EntityType,
          entity_id: '', // Will be set after bid creation
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          file_url: URL.createObjectURL(file),
          uploaded_by: currentUser?.id || '',
        });
        attachmentIds.push(attachment.id);
      }

      // Create bid proposal
      await createBid({
        project_id: projectId,
        subcontractor_id: currentUser?.id || '',
        bid_amount: parseFloat(bidAmount.replace(/[^0-9.]/g, '')),
        scope_of_work: scopeOfWork,
        proposed_timeline: { start: timelineStart, end: timelineEnd },
        documents: attachmentIds.map((id) => ({
          type: 'proposal',
          file_id: id,
        })),
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        metadata: {
          uploaded_files: uploadedFiles.map((f) => ({
            name: f.name,
            size: f.size,
            type: f.type,
          })),
          notes: additionalNotes,
        },
      } as any);

      setSubmitted(true);
      setTimeout(() => {
        handleClose();
        onSuccess?.();
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to submit bid. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setBidAmount('');
    setScopeOfWork('');
    setTimelineStart('');
    setTimelineEnd('');
    setAdditionalNotes('');
    setUploadedFiles([]);
    setError(null);
    setSubmitted(false);
    onClose();
  };

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    if (!numericValue) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(numericValue));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Submit Bid Proposal"
      size="large"
    >
      {submitted ? (
        <Stack align="center" style={{ paddingTop: 48, paddingBottom: 48 }}>
          <div
            style={{
              width: 64,
              height: 64,
              backgroundColor: 'var(--color-green-3)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <CheckCircle color="var(--color-green-10)" size={32} />
          </div>
          <Text size="lg" weight="semibold" style={{ marginBottom: 8 }}>
            Bid Submitted Successfully!
          </Text>
          <Text muted>
            Your bid has been submitted and will be reviewed by the project
            manager.
          </Text>
        </Stack>
      ) : (
        <Stack gap={24}>
          {project && (
            <Card
              style={{
                backgroundColor: 'var(--color-blue-3)',
                border: '1px solid var(--color-blue-6)',
                borderRadius: 12,
                padding: 16,
              }}
            >
              <Text weight="semibold" style={{ color: 'var(--color-blue-11)', marginBottom: 4 }}>
                Project: {project.name}
              </Text>
              <Text size="sm" style={{ color: 'var(--color-blue-10)' }}>{project.description}</Text>
            </Card>
          )}

          {error && (
            <Card
              style={{
                backgroundColor: 'var(--color-red-3)',
                border: '1px solid var(--color-red-6)',
                borderRadius: 12,
                padding: 16,
              }}
            >
              <Text size="sm" style={{ color: 'var(--color-red-10)' }}>{error}</Text>
            </Card>
          )}

          <Row gap={16} style={{ flexWrap: 'wrap' }}>
            <Stack style={{ flex: 1, minWidth: 200 }}>
              <Input
                label="Bid Amount"
                type="text"
                value={bidAmount}
                onChange={(e) => {
                  const formatted = formatCurrency(e.target.value);
                  setBidAmount(formatted);
                }}
                placeholder="$0.00"
                fullWidth
                required
                leftIcon={DollarSign}
              />
            </Stack>

            <Stack style={{ flex: 1, minWidth: 200 }}>
              <Input
                label="Timeline Start"
                type="date"
                value={timelineStart}
                onChange={(e) => setTimelineStart(e.target.value)}
                fullWidth
                required
                leftIcon={Calendar}
              />
            </Stack>
          </Row>

          <Row gap={16} style={{ flexWrap: 'wrap' }}>
            <Stack style={{ flex: 1, minWidth: 200 }}>
              <Input
                label="Timeline End"
                type="date"
                value={timelineEnd}
                onChange={(e) => setTimelineEnd(e.target.value)}
                fullWidth
                required
                leftIcon={Calendar}
              />
            </Stack>
          </Row>

          <Textarea
            label="Scope of Work"
            value={scopeOfWork}
            onChange={(e) => setScopeOfWork(e.target.value)}
            placeholder="Describe the work you will perform, materials, labor, etc."
            rows={6}
            fullWidth
            required
          />

          <Textarea
            label="Additional Notes (Optional)"
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="Any additional information, special conditions, or clarifications"
            rows={4}
            fullWidth
          />

          <Stack>
            <Text size="sm" weight="medium" style={{ marginBottom: 8, display: 'block' }}>
              Upload Documents
            </Text>
            <div
              style={{
                border: '2px dashed var(--color-border)',
                borderRadius: 12,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="file-upload"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              />
              <label
                htmlFor="file-upload"
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <Upload color="var(--color-blue-10)" size={32} style={{ marginBottom: 8 }} />
                <Text size="sm" weight="medium" style={{ color: 'var(--color-blue-10)', marginBottom: 4 }}>
                  Click to upload or drag and drop
                </Text>
                <Text size="xs" muted>
                  PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (Max 10MB each)
                </Text>
              </label>
            </div>

            {uploadedFiles.length > 0 && (
              <Stack gap={8} style={{ marginTop: 16 }}>
                {uploadedFiles.map((file, index) => (
                  <Card
                    key={index}
                    style={{
                      padding: 12,
                      backgroundColor: 'var(--color-gray-3)',
                      borderRadius: 12,
                    }}
                  >
                    <Row align="center" justify="space-between">
                      <Row align="center" gap={12}>
                        <FileText color="var(--color-blue-10)" size={20} />
                        <Stack>
                          <Text size="sm" weight="medium">
                            {file.name}
                          </Text>
                          <Text size="xs" muted>
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </Text>
                        </Stack>
                      </Row>
                      <button
                        onPress={() => removeFile(index)}
                        style={{
                          padding: 4,
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--color-red-10)',
                        }}
                      >
                        <X size={18} />
                      </button>
                    </Row>
                  </Card>
                ))}
              </Stack>
            )}

            <Stack style={{ marginTop: 12 }}>
              <Text size="xs" muted>
                Required documents: Proposal, COI, Endorsements (if applicable)
              </Text>
            </Stack>
          </Stack>

          <Row gap={12} style={{ paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
            <Button
              variant="secondary"
              onPress={handleClose}
              fullWidth
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onPress={handleSubmit}
              fullWidth
              disabled={
                loading ||
                !bidAmount ||
                !scopeOfWork ||
                !timelineStart ||
                !timelineEnd ||
                uploadedFiles.length === 0
              }
              leftIcon={CheckCircle}
            >
              {loading ? 'Submitting...' : 'Submit Bid'}
            </Button>
          </Row>
        </Stack>
      )}
    </Modal>
  );
}
