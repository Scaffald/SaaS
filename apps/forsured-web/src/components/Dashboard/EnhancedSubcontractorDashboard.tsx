import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Shield,
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Mail,
  Phone,
  Upload,
  X,
  Briefcase,
} from 'lucide-react';
import EmptyState from '../../ui/EmptyState';
import { useTasks } from '../../hooks/useTasks';
import { Task, SubcontractorTaskMetadata } from '../../types';
import ComplianceScore from '../Common/ComplianceScore';
import Button from '../Common/Button';
import SubcontractorTasksPanel from '../Subcontractor/SubcontractorTasksPanel';
import InsuranceRequirementsModal from '../Subcontractor/InsuranceRequirementsModal';
import Modal from '../Common/Modal';
import Textarea from '../Common/Textarea';
import { useLexicon } from '../../contexts/LexiconContext';

export default function EnhancedSubcontractorDashboard() {
  const navigate = useNavigate();
  // REQ-4: Use lexicon for dynamic labels
  const { t, getManagerLabel } = useLexicon();
  const { tasks, updateTask, loading } = useTasks();
  const [requirementsModalOpen, setRequirementsModalOpen] = useState(false);
  const [contactBrokerModalOpen, setContactBrokerModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [quoteRequest, setQuoteRequest] = useState({ message: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const complianceScore = 92;
  const documentsUploaded = 8;
  const documentsExpiring = 2;
  const activePolicies = 4;

  const handleCompleteTask = async (taskId: string) => {
    await updateTask(taskId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    });
  };

  const handleViewRequirements = (task: Task) => {
    setSelectedTask(task);
    setRequirementsModalOpen(true);
  };

  const handleContactBroker = (task: Task) => {
    setSelectedTask(task);
    setContactBrokerModalOpen(true);
  };

  const handleUploadDocument = (task: Task) => {
    setSelectedTask(task);
    setUploadModalOpen(true);
  };

  const handleRequestQuote = (task: Task) => {
    setSelectedTask(task);
    setQuoteModalOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedTask || !uploadedFile) return;

    // Mock upload - update task status to submitted
    await updateTask(selectedTask.id, {
      status: 'submitted',
      updated_at: new Date().toISOString(),
    });

    // Reset and close
    setUploadedFile(null);
    setUploadModalOpen(false);
    setSelectedTask(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    alert('Document uploaded successfully! Your broker will review it.');
  };

  const handleQuoteSubmit = async () => {
    if (!selectedTask) return;

    // Mock quote request
    alert('Quote request submitted! Your broker will contact you soon.');
    setQuoteRequest({ message: '' });
    setQuoteModalOpen(false);
    setSelectedTask(null);
  };

  const getBrokerContact = (task: Task) => {
    const metadata = task.metadata as SubcontractorTaskMetadata | undefined;
    return metadata?.broker_contact;
  };

  const getQuoteDetails = (task: Task) => {
    const metadata = task.metadata as SubcontractorTaskMetadata | undefined;
    if (metadata?.current_limit && metadata?.required_limit) {
      return {
        current: metadata.current_limit,
        required: metadata.required_limit,
        gap:
          metadata.gap_amount ||
          metadata.required_limit - metadata.current_limit,
      };
    }
    return null;
  };

  // REQ-4: Use lexicon for manager label
  const { getManagerLabel } = useLexicon();

  // Show empty state when no tasks/projects assigned
  if (!loading && tasks.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t('nav.dashboard')}</h1>
          <p className="text-text-secondary">
            Track your compliance status and manage documents
          </p>
        </div>
        <EmptyState
          icon={Briefcase}
          title="No Active Projects"
          description={`You haven't been assigned to any projects yet. Once a ${getManagerLabel().toLowerCase()} invites you to a project, you'll see your tasks and compliance requirements here.`}
          action={{
            label: 'View Documents',
            onClick: () => navigate('/subcontractor/documents'),
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{t('nav.dashboard')}</h1>
        <p className="text-text-secondary">
          Track your compliance status and manage documents
        </p>
      </div>

      <div className="bg-surface rounded-lg shadow-sm border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              Compliance Status
            </h2>
            <p className="text-text-secondary">
              Your overall compliance health score
            </p>
          </div>
          <ComplianceScore score={complianceScore} trend="up" size="lg" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-success-50 rounded-lg">
            <CheckCircle className="text-success-600 mx-auto mb-2" size={24} />
            <p className="text-sm font-medium text-text-primary">All Current</p>
            <p className="text-xs text-success-600">
              Insurance policies active
            </p>
          </div>
          <div className="text-center p-4 bg-warning-50 rounded-lg">
            <Clock className="text-warning-600 mx-auto mb-2" size={24} />
            <p className="text-sm font-medium text-text-primary">
              2 Expiring Soon
            </p>
            <p className="text-xs text-warning-600">Renew within 30 days</p>
          </div>
          <div className="text-center p-4 bg-primary-50 rounded-lg">
            <Shield className="text-primary-600 mx-auto mb-2" size={24} />
            <p className="text-sm font-medium text-text-primary">
              Fully Compliant
            </p>
            <p className="text-xs text-primary-600">Meeting all requirements</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Documents</p>
              <p className="text-3xl font-bold text-text-primary">
                {documentsUploaded}
              </p>
            </div>
            <div className="bg-primary-100 p-3 rounded-full">
              <FileText className="text-primary-600" size={24} />
            </div>
          </div>
          <div className="mt-3 text-sm text-success-600">All verified</div>
        </div>

        <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Active Policies</p>
              <p className="text-3xl font-bold text-success-600">
                {activePolicies}
              </p>
            </div>
            <div className="bg-success-100 p-3 rounded-full">
              <Shield className="text-success-600" size={24} />
            </div>
          </div>
          <div className="mt-3 text-sm text-text-secondary">
            $5.2M total coverage
          </div>
        </div>

        <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Expiring Soon</p>
              <p className="text-3xl font-bold text-secondary-600">
                {documentsExpiring}
              </p>
            </div>
            <div className="bg-secondary-100 p-3 rounded-full">
              <AlertTriangle className="text-secondary-600" size={24} />
            </div>
          </div>
          <div className="mt-3 text-sm text-secondary-600">Action required</div>
        </div>

        <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Annual Premium</p>
              <p className="text-3xl font-bold text-text-primary">$18.5K</p>
            </div>
            <div className="bg-secondary-100 p-3 rounded-full">
              <DollarSign className="text-secondary-500" size={24} />
            </div>
          </div>
          <div className="mt-3 text-sm text-success-600">
            Save 15% with bundling
          </div>
        </div>
      </div>

      <SubcontractorTasksPanel
        tasks={tasks}
        onCompleteTask={handleCompleteTask}
        onViewRequirements={handleViewRequirements}
        onContactBroker={handleContactBroker}
        onUploadDocument={handleUploadDocument}
        onRequestQuote={handleRequestQuote}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface rounded-lg shadow-sm border border-border p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <Button
              variant="ghost"
              fullWidth
              className="justify-between p-3 bg-primary-50 hover:bg-primary-100 h-auto"
            >
              <div className="flex items-center space-x-3">
                <FileText className="text-primary-600" size={20} />
                <span className="text-text-primary font-medium">
                  Upload Documents
                </span>
              </div>
              <span className="text-primary-600">→</span>
            </Button>

            <Button
              variant="ghost"
              fullWidth
              className="justify-between p-3 bg-success-50 hover:bg-success-100 h-auto"
            >
              <div className="flex items-center space-x-3">
                <DollarSign className="text-success-600" size={20} />
                <span className="text-text-primary font-medium">
                  Shop Insurance
                </span>
              </div>
              <span className="text-success-600">→</span>
            </Button>

            <Button
              variant="ghost"
              fullWidth
              className="justify-between p-3 bg-secondary-50 hover:bg-secondary-100 h-auto"
            >
              <div className="flex items-center space-x-3">
                <Calendar className="text-secondary-500" size={20} />
                <span className="text-text-primary font-medium">
                  Schedule Renewal
                </span>
              </div>
              <span className="text-secondary-500">→</span>
            </Button>
          </div>
        </div>

        <div className="bg-surface rounded-lg shadow-sm border border-border p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Recent Activity
          </h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-success-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-text-primary">
                  General Liability renewed
                </p>
                <p className="text-xs text-text-secondary">2 days ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-text-primary">
                  License certificate uploaded
                </p>
                <p className="text-xs text-text-secondary">1 week ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-warning-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-text-primary">
                  Workers' comp expires in 30 days
                </p>
                <p className="text-xs text-text-secondary">Alert generated</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <InsuranceRequirementsModal
        isOpen={requirementsModalOpen}
        onClose={() => {
          setRequirementsModalOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
      />

      {/* Contact Broker Modal */}
      <Modal
        isOpen={contactBrokerModalOpen}
        onClose={() => {
          setContactBrokerModalOpen(false);
          setSelectedTask(null);
        }}
        title="Contact Broker"
        size="md"
      >
        {selectedTask &&
          (() => {
            const broker = getBrokerContact(selectedTask);
            if (!broker) {
              return (
                <div className="text-center py-8">
                  <p className="text-text-secondary">
                    Broker contact information not available for this task.
                  </p>
                </div>
              );
            }
            return (
              <div className="space-y-4">
                <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
                  <h3 className="font-semibold text-text-primary mb-2">
                    {broker.name}
                  </h3>
                  <div className="space-y-2">
                    <a
                      href={`mailto:${broker.email}`}
                      className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
                    >
                      <Mail size={16} />
                      <span>{broker.email}</span>
                    </a>
                    {broker.phone && (
                      <a
                        href={`tel:${broker.phone}`}
                        className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
                      >
                        <Phone size={16} />
                        <span>{broker.phone}</span>
                      </a>
                    )}
                  </div>
                </div>
                <div className="text-sm text-text-secondary">
                  <p className="mb-2">
                    Task: <strong>{selectedTask.title}</strong>
                  </p>
                  {selectedTask.project_name && (
                    <p>
                      Project: <strong>{selectedTask.project_name}</strong>
                    </p>
                  )}
                </div>
              </div>
            );
          })()}
      </Modal>

      {/* Upload Document Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => {
          setUploadModalOpen(false);
          setSelectedTask(null);
          setUploadedFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }}
        title="Upload Document"
        size="md"
      >
        {selectedTask && (
          <div className="space-y-4">
            <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
              <p className="text-sm font-medium text-text-primary mb-1">
                {selectedTask.title}
              </p>
              {selectedTask.description && (
                <p className="text-xs text-text-secondary">
                  {selectedTask.description}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Select Document
              </label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <Upload className="text-primary-600" size={32} />
                  <span className="text-sm text-text-primary">
                    {uploadedFile
                      ? uploadedFile.name
                      : 'Click to upload or drag and drop'}
                  </span>
                  <span className="text-xs text-text-secondary">
                    PDF, DOC, DOCX, PNG, JPG (Max 10MB)
                  </span>
                </label>
              </div>
            </div>

            {uploadedFile && (
              <div className="flex items-center justify-between p-3 bg-success-50 rounded-lg border border-success-200">
                <div className="flex items-center space-x-2">
                  <FileText className="text-success-600" size={16} />
                  <span className="text-sm text-text-primary">
                    {uploadedFile.name}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setUploadedFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="text-error-600 hover:text-error-700"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setUploadModalOpen(false);
                  setSelectedTask(null);
                  setUploadedFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUploadSubmit} disabled={!uploadedFile}>
                Upload Document
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Request Quote Modal */}
      <Modal
        isOpen={quoteModalOpen}
        onClose={() => {
          setQuoteModalOpen(false);
          setSelectedTask(null);
          setQuoteRequest({ message: '' });
        }}
        title="Request Quote"
        size="md"
      >
        {selectedTask &&
          (() => {
            const quoteDetails = getQuoteDetails(selectedTask);
            return (
              <div className="space-y-4">
                <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
                  <p className="text-sm font-medium text-text-primary mb-2">
                    {selectedTask.title}
                  </p>
                  {quoteDetails && (
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">
                          Current Limit:
                        </span>
                        <span className="font-medium text-text-primary">
                          ${(quoteDetails.current / 1000000).toFixed(1)}M
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">
                          Required Limit:
                        </span>
                        <span className="font-medium text-text-primary">
                          ${(quoteDetails.required / 1000000).toFixed(1)}M
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-primary-200">
                        <span className="text-text-secondary">Gap Amount:</span>
                        <span className="font-medium text-warning-600">
                          ${(quoteDetails.gap / 1000000).toFixed(1)}M
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Additional Information (Optional)
                  </label>
                  <Textarea
                    value={quoteRequest.message}
                    onChange={(e) =>
                      setQuoteRequest({ message: e.target.value })
                    }
                    placeholder="Add any specific requirements or questions for your broker..."
                    rows={4}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setQuoteModalOpen(false);
                      setSelectedTask(null);
                      setQuoteRequest({ message: '' });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleQuoteSubmit}>Submit Request</Button>
                </div>
              </div>
            );
          })()}
      </Modal>
    </div>
  );
}
