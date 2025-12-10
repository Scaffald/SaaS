import React, { useState } from 'react';
import {
  X,
  Upload,
  FileText,
  DollarSign,
  Calendar,
  MessageSquare,
  CheckCircle,
} from 'lucide-react';
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
      size="lg"
    >
      {submitted ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-success-600" size={32} />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            Bid Submitted Successfully!
          </h3>
          <p className="text-text-secondary">
            Your bid has been submitted and will be reviewed by the project
            manager.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {project && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <h3 className="font-semibold text-primary-900 mb-1">
                Project: {project.name}
              </h3>
              <p className="text-sm text-primary-700">{project.description}</p>
            </div>
          )}

          {error && (
            <div className="bg-error-50 border border-error-200 rounded-lg p-4">
              <p className="text-sm text-error-700">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
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

            <Input
              label="Timeline Start"
              type="date"
              value={timelineStart}
              onChange={(e) => setTimelineStart(e.target.value)}
              fullWidth
              required
              leftIcon={Calendar}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Timeline End"
              type="date"
              value={timelineEnd}
              onChange={(e) => setTimelineEnd(e.target.value)}
              fullWidth
              required
              leftIcon={Calendar}
            />
          </div>

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

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Upload Documents
            </label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="text-primary-600 mb-2" size={32} />
                <span className="text-sm font-medium text-primary-600 mb-1">
                  Click to upload or drag and drop
                </span>
                <span className="text-xs text-text-tertiary">
                  PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (Max 10MB each)
                </span>
              </label>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="text-primary-600" size={20} />
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {file.name}
                        </p>
                        <p className="text-xs text-text-tertiary">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-error-600 hover:text-error-700"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 text-xs text-text-tertiary">
              <p>
                Required documents: Proposal, COI, Endorsements (if applicable)
              </p>
            </div>
          </div>

          <div className="flex space-x-3 pt-4 border-t border-border">
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
          </div>
        </div>
      )}
    </Modal>
  );
}
