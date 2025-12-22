import { useState } from 'react';
import {
  X,
  Upload,
  FileText,
  DollarSign,
  Calendar,
  MessageSquare,
  CheckCircle,
} from 'lucide-react';
import { YStack, XStack, Text, Card, Button as TamaguiButton } from '@unicornlove/ui';
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
        <YStack alignItems="center" paddingVertical="$12">
          <Card
            width={64}
            height={64}
            backgroundColor="$green3"
            borderRadius={9999}
            alignItems="center"
            justifyContent="center"
            mb="$4"
          >
            <CheckCircle color="$green10" size={32} />
          </Card>
          <Text fontSize="$6" fontWeight="600" color="$color12" mb="$2">
            Bid Submitted Successfully!
          </Text>
          <Text color="$color11">
            Your bid has been submitted and will be reviewed by the project
            manager.
          </Text>
        </YStack>
      ) : (
        <YStack gap="$6">
          {project && (
            <Card backgroundColor="$blue3" borderWidth={1} borderColor="$blue6" borderRadius="$4" padding="$4">
              <Text fontWeight="600" color="$blue11" mb="$1">
                Project: {project.name}
              </Text>
              <Text fontSize="$2" color="$blue10">{project.description}</Text>
            </Card>
          )}

          {error && (
            <Card backgroundColor="$red3" borderWidth={1} borderColor="$red6" borderRadius="$4" padding="$4">
              <Text fontSize="$2" color="$red10">{error}</Text>
            </Card>
          )}

          <XStack gap="$4" flexWrap="wrap">
            <YStack flex={1} minWidth="200px">
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
            </YStack>

            <YStack flex={1} minWidth="200px">
              <Input
                label="Timeline Start"
                type="date"
                value={timelineStart}
                onChange={(e) => setTimelineStart(e.target.value)}
                fullWidth
                required
                leftIcon={Calendar}
              />
            </YStack>
          </XStack>

          <XStack gap="$4" flexWrap="wrap">
            <YStack flex={1} minWidth="200px">
              <Input
                label="Timeline End"
                type="date"
                value={timelineEnd}
                onChange={(e) => setTimelineEnd(e.target.value)}
                fullWidth
                required
                leftIcon={Calendar}
              />
            </YStack>
          </XStack>

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

          <YStack>
            <Text fontSize="$2" fontWeight="500" color="$color12" mb="$2" display="block">
              Upload Documents
            </Text>
            <Card
              borderWidth={2}
              borderStyle="dashed"
              borderColor="$borderColor"
              borderRadius="$4"
              padding="$6"
              alignItems="center"
            >
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="file-upload"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              />
              <YStack
                as="label"
                htmlFor="file-upload"
                cursor="pointer"
                alignItems="center"
              >
                <Upload color="$blue10" size={32} mb="$2" />
                <Text fontSize="$2" fontWeight="500" color="$blue10" mb="$1">
                  Click to upload or drag and drop
                </Text>
                <Text fontSize="$1" color="$color10">
                  PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (Max 10MB each)
                </Text>
              </YStack>
            </Card>

            {uploadedFiles.length > 0 && (
              <YStack mt="$4" gap="$2">
                {uploadedFiles.map((file, index) => (
                  <Card
                    key={index}
                    padding="$3"
                    backgroundColor="$gray3"
                    borderRadius="$4"
                  >
                    <XStack alignItems="center" justifyContent="space-between">
                      <XStack alignItems="center" gap="$3">
                        <FileText color="$blue10" size={20} />
                        <YStack>
                          <Text fontSize="$2" fontWeight="500" color="$color12">
                            {file.name}
                          </Text>
                          <Text fontSize="$1" color="$color10">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </Text>
                        </YStack>
                      </XStack>
                      <TamaguiButton
                        onPress={() => removeFile(index)}
                        padding="$1"
                        backgroundColor="transparent"
                        color="$red10"
                        hoverStyle={{
                          color: '$red12',
                        }}
                      >
                        <X size={18} />
                      </TamaguiButton>
                    </XStack>
                  </Card>
                ))}
              </YStack>
            )}

            <YStack mt="$3">
              <Text fontSize="$1" color="$color10">
                Required documents: Proposal, COI, Endorsements (if applicable)
              </Text>
            </YStack>
          </YStack>

          <XStack gap="$3" paddingTop="$4" borderTopWidth={1} borderTopColor="$borderColor">
            <Button
              variant="secondary"
              onClick={handleClose}
              fullWidth
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
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
          </XStack>
        </YStack>
      )}
    </Modal>
  );
}
