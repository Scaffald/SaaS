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
import { EmptyState, YStack, XStack, Text, Card } from '@unicornlove/ui';
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

  // Show empty state when no tasks/projects assigned
  if (!loading && tasks.length === 0) {
    return (
      <YStack gap="$6">
        <YStack>
          <Text fontSize="$8" fontWeight="700" color="$color12">{t('nav.dashboard')}</Text>
          <Text color="$color11">
            Track your compliance status and manage documents
          </Text>
        </YStack>
        <EmptyState
          icon={Briefcase}
          title="No Active Projects"
          description={`You haven't been assigned to any projects yet. Once a ${getManagerLabel().toLowerCase()} invites you to a project, you'll see your tasks and compliance requirements here.`}
          action={{
            label: 'View Documents',
            onClick: () => navigate('/subcontractor/documents'),
          }}
        />
      </YStack>
    );
  }

  return (
    <YStack gap="$6">
      <YStack>
        <Text fontSize="$8" fontWeight="700" color="$color12">{t('nav.dashboard')}</Text>
        <Text color="$color11">
          Track your compliance status and manage documents
        </Text>
      </YStack>

      <Card backgroundColor="$background" borderRadius="$4" borderWidth={1} borderColor="$borderColor" padding="$6">
        <XStack alignItems="center" justifyContent="space-between" marginBottom="$6">
          <YStack>
            <Text fontSize="$6" fontWeight="600" color="$color12">
              Compliance Status
            </Text>
            <Text color="$color11">
              Your overall compliance health score
            </Text>
          </YStack>
          <ComplianceScore score={complianceScore} trend="up" size="lg" />
        </XStack>

        <XStack flexWrap="wrap" gap="$4">
          <YStack flex={1} minWidth={200} alignItems="center" padding="$4" backgroundColor="$green2" borderRadius="$4">
            <CheckCircle color="var(--green10)" style={{ margin: '0 auto 8px' }} size={24} />
            <Text fontSize="$3" fontWeight="500" color="$color12">All Current</Text>
            <Text fontSize="$2" color="$green11">
              Insurance policies active
            </Text>
          </YStack>
          <YStack flex={1} minWidth={200} alignItems="center" padding="$4" backgroundColor="$yellow2" borderRadius="$4">
            <Clock color="var(--yellow10)" style={{ margin: '0 auto 8px' }} size={24} />
            <Text fontSize="$3" fontWeight="500" color="$color12">
              2 Expiring Soon
            </Text>
            <Text fontSize="$2" color="$yellow11">Renew within 30 days</Text>
          </YStack>
          <YStack flex={1} minWidth={200} alignItems="center" padding="$4" backgroundColor="$blue2" borderRadius="$4">
            <Shield color="var(--blue10)" style={{ margin: '0 auto 8px' }} size={24} />
            <Text fontSize="$3" fontWeight="500" color="$color12">
              Fully Compliant
            </Text>
            <Text fontSize="$2" color="$blue11">Meeting all requirements</Text>
          </YStack>
        </XStack>
      </Card>

      <XStack flexWrap="wrap" gap="$6">
        <Card flex={1} minWidth={200} backgroundColor="$background" borderRadius="$4" padding="$6" borderWidth={1} borderColor="$borderColor">
          <XStack alignItems="center" justifyContent="space-between">
            <YStack>
              <Text color="$color11" fontSize="$3">Documents</Text>
              <Text fontSize="$10" fontWeight="700" color="$color12">
                {documentsUploaded}
              </Text>
            </YStack>
            <XStack backgroundColor="$blue3" padding="$3" borderRadius="$12">
              <FileText color="var(--blue10)" size={24} />
            </XStack>
          </XStack>
          <Text marginTop="$3" fontSize="$3" color="$green11">All verified</Text>
        </Card>

        <Card flex={1} minWidth={200} backgroundColor="$background" borderRadius="$4" padding="$6" borderWidth={1} borderColor="$borderColor">
          <XStack alignItems="center" justifyContent="space-between">
            <YStack>
              <Text color="$color11" fontSize="$3">Active Policies</Text>
              <Text fontSize="$10" fontWeight="700" color="$green11">
                {activePolicies}
              </Text>
            </YStack>
            <XStack backgroundColor="$green3" padding="$3" borderRadius="$12">
              <Shield color="var(--green10)" size={24} />
            </XStack>
          </XStack>
          <Text marginTop="$3" fontSize="$3" color="$color11">
            $5.2M total coverage
          </Text>
        </Card>

        <Card flex={1} minWidth={200} backgroundColor="$background" borderRadius="$4" padding="$6" borderWidth={1} borderColor="$borderColor">
          <XStack alignItems="center" justifyContent="space-between">
            <YStack>
              <Text color="$color11" fontSize="$3">Expiring Soon</Text>
              <Text fontSize="$10" fontWeight="700" color="$orange11">
                {documentsExpiring}
              </Text>
            </YStack>
            <XStack backgroundColor="$orange3" padding="$3" borderRadius="$12">
              <AlertTriangle color="var(--orange10)" size={24} />
            </XStack>
          </XStack>
          <Text marginTop="$3" fontSize="$3" color="$orange11">Action required</Text>
        </Card>

        <Card flex={1} minWidth={200} backgroundColor="$background" borderRadius="$4" padding="$6" borderWidth={1} borderColor="$borderColor">
          <XStack alignItems="center" justifyContent="space-between">
            <YStack>
              <Text color="$color11" fontSize="$3">Annual Premium</Text>
              <Text fontSize="$10" fontWeight="700" color="$color12">$18.5K</Text>
            </YStack>
            <XStack backgroundColor="$orange3" padding="$3" borderRadius="$12">
              <DollarSign color="var(--orange9)" size={24} />
            </XStack>
          </XStack>
          <Text marginTop="$3" fontSize="$3" color="$green11">
            Save 15% with bundling
          </Text>
        </Card>
      </XStack>

      <SubcontractorTasksPanel
        tasks={tasks}
        onCompleteTask={handleCompleteTask}
        onViewRequirements={handleViewRequirements}
        onContactBroker={handleContactBroker}
        onUploadDocument={handleUploadDocument}
        onRequestQuote={handleRequestQuote}
      />

      <XStack flexWrap="wrap" gap="$6">
        <Card flex={1} minWidth={300} backgroundColor="$background" borderRadius="$4" borderWidth={1} borderColor="$borderColor" padding="$6">
          <Text fontSize="$6" fontWeight="600" color="$color12" marginBottom="$4">
            Quick Actions
          </Text>
          <YStack gap="$3">
            <Button
              variant="ghost"
              fullWidth
              justifyContent="space-between"
              padding="$3"
              backgroundColor="$blue2"
              hoverStyle={{ backgroundColor: '$blue3' }}
              height="auto"
            >
              <XStack alignItems="center" gap="$3">
                <FileText color="var(--blue10)" size={20} />
                <Text color="$color12" fontWeight="500">
                  Upload Documents
                </Text>
              </XStack>
              <Text color="$blue11">→</Text>
            </Button>

            <Button
              variant="ghost"
              fullWidth
              justifyContent="space-between"
              padding="$3"
              backgroundColor="$green2"
              hoverStyle={{ backgroundColor: '$green3' }}
              height="auto"
            >
              <XStack alignItems="center" gap="$3">
                <DollarSign color="var(--green10)" size={20} />
                <Text color="$color12" fontWeight="500">
                  Shop Insurance
                </Text>
              </XStack>
              <Text color="$green11">→</Text>
            </Button>

            <Button
              variant="ghost"
              fullWidth
              justifyContent="space-between"
              padding="$3"
              backgroundColor="$orange2"
              hoverStyle={{ backgroundColor: '$orange3' }}
              height="auto"
            >
              <XStack alignItems="center" gap="$3">
                <Calendar color="var(--orange9)" size={20} />
                <Text color="$color12" fontWeight="500">
                  Schedule Renewal
                </Text>
              </XStack>
              <Text color="$orange10">→</Text>
            </Button>
          </YStack>
        </Card>

        <Card flex={1} minWidth={300} backgroundColor="$background" borderRadius="$4" borderWidth={1} borderColor="$borderColor" padding="$6">
          <Text fontSize="$6" fontWeight="600" color="$color12" marginBottom="$4">
            Recent Activity
          </Text>
          <YStack gap="$4">
            <XStack alignItems="center" gap="$3">
              <XStack width={8} height={8} backgroundColor="$green9" borderRadius="$12" />
              <YStack flex={1}>
                <Text fontSize="$3" color="$color12">
                  General Liability renewed
                </Text>
                <Text fontSize="$2" color="$color11">2 days ago</Text>
              </YStack>
            </XStack>
            <XStack alignItems="center" gap="$3">
              <XStack width={8} height={8} backgroundColor="$blue9" borderRadius="$12" />
              <YStack flex={1}>
                <Text fontSize="$3" color="$color12">
                  License certificate uploaded
                </Text>
                <Text fontSize="$2" color="$color11">1 week ago</Text>
              </YStack>
            </XStack>
            <XStack alignItems="center" gap="$3">
              <XStack width={8} height={8} backgroundColor="$yellow9" borderRadius="$12" />
              <YStack flex={1}>
                <Text fontSize="$3" color="$color12">
                  Workers' comp expires in 30 days
                </Text>
                <Text fontSize="$2" color="$color11">Alert generated</Text>
              </YStack>
            </XStack>
          </YStack>
        </Card>
      </XStack>

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
                <YStack alignItems="center" paddingVertical="$8">
                  <Text color="$color11">
                    Broker contact information not available for this task.
                  </Text>
                </YStack>
              );
            }
            return (
              <YStack gap="$4">
                <YStack backgroundColor="$blue2" borderRadius="$4" padding="$4" borderWidth={1} borderColor="$blue6">
                  <Text fontWeight="600" color="$color12" marginBottom="$2">
                    {broker.name}
                  </Text>
                  <YStack gap="$2">
                    <XStack
                      tag="a"
                      href={`mailto:${broker.email}`}
                      alignItems="center"
                      gap="$2"
                      color="$blue11"
                      hoverStyle={{ color: '$blue12' }}
                    >
                      <Mail size={16} />
                      <Text>{broker.email}</Text>
                    </XStack>
                    {broker.phone && (
                      <XStack
                        tag="a"
                        href={`tel:${broker.phone}`}
                        alignItems="center"
                        gap="$2"
                        color="$blue11"
                        hoverStyle={{ color: '$blue12' }}
                      >
                        <Phone size={16} />
                        <Text>{broker.phone}</Text>
                      </XStack>
                    )}
                  </YStack>
                </YStack>
                <YStack fontSize="$3" color="$color11">
                  <Text marginBottom="$2">
                    Task: <Text fontWeight="700">{selectedTask.title}</Text>
                  </Text>
                  {selectedTask.project_name && (
                    <Text>
                      Project: <Text fontWeight="700">{selectedTask.project_name}</Text>
                    </Text>
                  )}
                </YStack>
              </YStack>
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
          <YStack gap="$4">
            <YStack backgroundColor="$blue2" borderRadius="$4" padding="$4" borderWidth={1} borderColor="$blue6">
              <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$1">
                {selectedTask.title}
              </Text>
              {selectedTask.description && (
                <Text fontSize="$2" color="$color11">
                  {selectedTask.description}
                </Text>
              )}
            </YStack>

            <YStack>
              <Text tag="label" display="block" fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2">
                Select Document
              </Text>
              <YStack borderWidth={2} borderStyle="dashed" borderColor="$borderColor" borderRadius="$4" padding="$6" alignItems="center">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  id="file-upload"
                />
                <YStack
                  tag="label"
                  htmlFor="file-upload"
                  cursor="pointer"
                  alignItems="center"
                  gap="$2"
                >
                  <Upload color="var(--blue10)" size={32} />
                  <Text fontSize="$3" color="$color12">
                    {uploadedFile
                      ? uploadedFile.name
                      : 'Click to upload or drag and drop'}
                  </Text>
                  <Text fontSize="$2" color="$color11">
                    PDF, DOC, DOCX, PNG, JPG (Max 10MB)
                  </Text>
                </YStack>
              </YStack>
            </YStack>

            {uploadedFile && (
              <XStack alignItems="center" justifyContent="space-between" padding="$3" backgroundColor="$green2" borderRadius="$4" borderWidth={1} borderColor="$green6">
                <XStack alignItems="center" gap="$2">
                  <FileText color="var(--green10)" size={16} />
                  <Text fontSize="$3" color="$color12">
                    {uploadedFile.name}
                  </Text>
                </XStack>
                <XStack
                  tag="button"
                  onPress={() => {
                    setUploadedFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  color="$red11"
                  hoverStyle={{ color: '$red12' }}
                  cursor="pointer"
                >
                  <X size={16} />
                </XStack>
              </XStack>
            )}

            <XStack justifyContent="flex-end" gap="$2" paddingTop="$4">
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
            </XStack>
          </YStack>
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
              <YStack gap="$4">
                <YStack backgroundColor="$blue2" borderRadius="$4" padding="$4" borderWidth={1} borderColor="$blue6">
                  <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2">
                    {selectedTask.title}
                  </Text>
                  {quoteDetails && (
                    <YStack gap="$1" fontSize="$3">
                      <XStack justifyContent="space-between">
                        <Text color="$color11">
                          Current Limit:
                        </Text>
                        <Text fontWeight="500" color="$color12">
                          ${(quoteDetails.current / 1000000).toFixed(1)}M
                        </Text>
                      </XStack>
                      <XStack justifyContent="space-between">
                        <Text color="$color11">
                          Required Limit:
                        </Text>
                        <Text fontWeight="500" color="$color12">
                          ${(quoteDetails.required / 1000000).toFixed(1)}M
                        </Text>
                      </XStack>
                      <XStack justifyContent="space-between" paddingTop="$2" borderTopWidth={1} borderTopColor="$blue6">
                        <Text color="$color11">Gap Amount:</Text>
                        <Text fontWeight="500" color="$yellow11">
                          ${(quoteDetails.gap / 1000000).toFixed(1)}M
                        </Text>
                      </XStack>
                    </YStack>
                  )}
                </YStack>

                <YStack>
                  <Text tag="label" display="block" fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2">
                    Additional Information (Optional)
                  </Text>
                  <Textarea
                    value={quoteRequest.message}
                    onChange={(e) =>
                      setQuoteRequest({ message: e.target.value })
                    }
                    placeholder="Add any specific requirements or questions for your broker..."
                    rows={4}
                  />
                </YStack>

                <XStack justifyContent="flex-end" gap="$2" paddingTop="$4">
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
                </XStack>
              </YStack>
            );
          })()}
      </Modal>
    </YStack>
  );
}
