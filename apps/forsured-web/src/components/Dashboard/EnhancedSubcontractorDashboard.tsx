/**
 * EnhancedSubcontractorDashboard - Subcontractor dashboard using Beyond UI
 * Migrated from Tamagui to Beyond UI
 */
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
import { Stack, Row, Text, Card } from '@unicornlove/beyond-ui';
import { EmptyState } from '../../ui/EmptyState';
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
      <Stack gap={16}>
        <Stack>
          <Text size="sm" weight="medium" >{t('nav.dashboard')}</Text>
          <Text >
            Track your compliance status and manage documents
          </Text>
        </Stack>
        <EmptyState
          icon={Briefcase}
          title="No Active Projects"
          description={`You haven't been assigned to any projects yet. Once a ${getManagerLabel().toLowerCase()} invites you to a project, you'll see your tasks and compliance requirements here.`}
          action={{
            label: 'View Documents',
            onClick: () => navigate('/subcontractor/documents'),
          }}
        />
      </Stack>
    );
  }

  return (
    <Stack gap={16}>
      <Stack>
        <Text size="sm" weight="medium" >{t('nav.dashboard')}</Text>
        <Text >
          Track your compliance status and manage documents
        </Text>
      </Stack>

      <Card style={{backgroundColor: 'var(--color-background)'}} style={{borderRadius: 8}} borderWidth={1} style={{borderColor: 'var(--color-border)'}} padding={16}>
        <Row alignItems="center" justifyContent="space-between" style={{marginBottom: 16}}>
          <Stack>
            <Text size="sm" weight="medium" >
              Compliance Status
            </Text>
            <Text >
              Your overall compliance health score
            </Text>
          </Stack>
          <ComplianceScore score={complianceScore} trend="up" size="lg" />
        </Row>

        <Row flexWrap="wrap" gap={16}>
          <Stack flex={1} minWidth={200} alignItems="center" padding={16} style={{backgroundColor: 'var(--color-green-2)'}} style={{borderRadius: 8}}>
            <CheckCircle color="var(--green10)" style={{ margin: '0 auto 8px' }} size={24} />
            <Text size="sm" weight="medium" >All Current</Text>
            <Text size="sm" style={{color: 'var(--color-green-10)'}}>
              Insurance policies active
            </Text>
          </Stack>
          <Stack flex={1} minWidth={200} alignItems="center" padding={16} style={{backgroundColor: 'var(--color-yellow-2)'}} style={{borderRadius: 8}}>
            <Clock color="var(--yellow10)" style={{ margin: '0 auto 8px' }} size={24} />
            <Text size="sm" weight="medium" >
              2 Expiring Soon
            </Text>
            <Text size="sm" style={{color: 'var(--color-yellow-10)'}}>Renew within 30 days</Text>
          </Stack>
          <Stack flex={1} minWidth={200} alignItems="center" padding={16} style={{backgroundColor: 'var(--color-blue-2)'}} style={{borderRadius: 8}}>
            <Shield color="var(--blue10)" style={{ margin: '0 auto 8px' }} size={24} />
            <Text size="sm" weight="medium" >
              Fully Compliant
            </Text>
            <Text size="sm" style={{color: 'var(--color-blue-10)'}}>Meeting all requirements</Text>
          </Stack>
        </Row>
      </Card>

      <Row flexWrap="wrap" gap={16}>
        <Card flex={1} minWidth={200} style={{backgroundColor: 'var(--color-background)'}} style={{borderRadius: 8}} padding={16} borderWidth={1} style={{borderColor: 'var(--color-border)'}}>
          <Row alignItems="center" justifyContent="space-between">
            <Stack>
              <Text  size="sm">Documents</Text>
              <Text size="sm" weight="medium" >
                {documentsUploaded}
              </Text>
            </Stack>
            <Row style={{backgroundColor: 'var(--color-blue-3)'}} padding={16} style={{borderRadius: 24}}>
              <FileText color="var(--blue10)" size={24} />
            </Row>
          </Row>
          <Text style={{marginTop: 16}} size="sm" style={{color: 'var(--color-green-10)'}}>All verified</Text>
        </Card>

        <Card flex={1} minWidth={200} style={{backgroundColor: 'var(--color-background)'}} style={{borderRadius: 8}} padding={16} borderWidth={1} style={{borderColor: 'var(--color-border)'}}>
          <Row alignItems="center" justifyContent="space-between">
            <Stack>
              <Text  size="sm">Active Policies</Text>
              <Text size="sm" weight="medium" style={{color: 'var(--color-green-10)'}}>
                {activePolicies}
              </Text>
            </Stack>
            <Row style={{backgroundColor: 'var(--color-green-3)'}} padding={16} style={{borderRadius: 24}}>
              <Shield color="var(--green10)" size={24} />
            </Row>
          </Row>
          <Text style={{marginTop: 16}} size="sm" >
            $5.2M total coverage
          </Text>
        </Card>

        <Card flex={1} minWidth={200} style={{backgroundColor: 'var(--color-background)'}} style={{borderRadius: 8}} padding={16} borderWidth={1} style={{borderColor: 'var(--color-border)'}}>
          <Row alignItems="center" justifyContent="space-between">
            <Stack>
              <Text  size="sm">Expiring Soon</Text>
              <Text size="sm" weight="medium" style={{color: 'var(--color-orange-10)'}}>
                {documentsExpiring}
              </Text>
            </Stack>
            <Row style={{backgroundColor: 'var(--color-orange-3)'}} padding={16} style={{borderRadius: 24}}>
              <AlertTriangle color="var(--orange10)" size={24} />
            </Row>
          </Row>
          <Text style={{marginTop: 16}} size="sm" style={{color: 'var(--color-orange-10)'}}>Action required</Text>
        </Card>

        <Card flex={1} minWidth={200} style={{backgroundColor: 'var(--color-background)'}} style={{borderRadius: 8}} padding={16} borderWidth={1} style={{borderColor: 'var(--color-border)'}}>
          <Row alignItems="center" justifyContent="space-between">
            <Stack>
              <Text  size="sm">Annual Premium</Text>
              <Text size="sm" weight="medium" >$18.5K</Text>
            </Stack>
            <Row style={{backgroundColor: 'var(--color-orange-3)'}} padding={16} style={{borderRadius: 24}}>
              <DollarSign color="var(--orange9)" size={24} />
            </Row>
          </Row>
          <Text style={{marginTop: 16}} size="sm" style={{color: 'var(--color-green-10)'}}>
            Save 15% with bundling
          </Text>
        </Card>
      </Row>

      <SubcontractorTasksPanel
        tasks={tasks}
        onCompleteTask={handleCompleteTask}
        onViewRequirements={handleViewRequirements}
        onContactBroker={handleContactBroker}
        onUploadDocument={handleUploadDocument}
        onRequestQuote={handleRequestQuote}
      />

      <Row flexWrap="wrap" gap={16}>
        <Card flex={1} minWidth={300} style={{backgroundColor: 'var(--color-background)'}} style={{borderRadius: 8}} borderWidth={1} style={{borderColor: 'var(--color-border)'}} padding={16}>
          <Text size="sm" weight="medium"  style={{marginBottom: 16}}>
            Quick Actions
          </Text>
          <Stack gap={16}>
            <Button
              variant="ghost"
              fullWidth
              justifyContent="space-between"
              padding={16}
              style={{backgroundColor: 'var(--color-blue-2)'}}
              hoverStyle={{ backgroundColor: '$blue3' }}
              height="auto"
            >
              <Row alignItems="center" gap={16}>
                <FileText color="var(--blue10)" size={20} />
                <Text  weight="medium">
                  Upload Documents
                </Text>
              </Row>
              <Text style={{color: 'var(--color-blue-10)'}}>→</Text>
            </Button>

            <Button
              variant="ghost"
              fullWidth
              justifyContent="space-between"
              padding={16}
              style={{backgroundColor: 'var(--color-green-2)'}}
              hoverStyle={{ backgroundColor: '$green3' }}
              height="auto"
            >
              <Row alignItems="center" gap={16}>
                <DollarSign color="var(--green10)" size={20} />
                <Text  weight="medium">
                  Shop Insurance
                </Text>
              </Row>
              <Text style={{color: 'var(--color-green-10)'}}>→</Text>
            </Button>

            <Button
              variant="ghost"
              fullWidth
              justifyContent="space-between"
              padding={16}
              style={{backgroundColor: 'var(--color-orange-2)'}}
              hoverStyle={{ backgroundColor: '$orange3' }}
              height="auto"
            >
              <Row alignItems="center" gap={16}>
                <Calendar color="var(--orange9)" size={20} />
                <Text  weight="medium">
                  Schedule Renewal
                </Text>
              </Row>
              <Text style={{color: 'var(--color-orange-10)'}}>→</Text>
            </Button>
          </Stack>
        </Card>

        <Card flex={1} minWidth={300} style={{backgroundColor: 'var(--color-background)'}} style={{borderRadius: 8}} borderWidth={1} style={{borderColor: 'var(--color-border)'}} padding={16}>
          <Text size="sm" weight="medium"  style={{marginBottom: 16}}>
            Recent Activity
          </Text>
          <Stack gap={16}>
            <Row alignItems="center" gap={16}>
              <Row width={8} height={8} backgroundColor="$green9" style={{borderRadius: 24}} />
              <Stack flex={1}>
                <Text size="sm" >
                  General Liability renewed
                </Text>
                <Text size="sm" >2 days ago</Text>
              </Stack>
            </Row>
            <Row alignItems="center" gap={16}>
              <Row width={8} height={8} backgroundColor="$blue9" style={{borderRadius: 24}} />
              <Stack flex={1}>
                <Text size="sm" >
                  License certificate uploaded
                </Text>
                <Text size="sm" >1 week ago</Text>
              </Stack>
            </Row>
            <Row alignItems="center" gap={16}>
              <Row width={8} height={8} backgroundColor="$yellow9" style={{borderRadius: 24}} />
              <Stack flex={1}>
                <Text size="sm" >
                  Workers' comp expires in 30 days
                </Text>
                <Text size="sm" >Alert generated</Text>
              </Stack>
            </Row>
          </Stack>
        </Card>
      </Row>

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
        size="medium"
      >
        {selectedTask &&
          (() => {
            const broker = getBrokerContact(selectedTask);
            if (!broker) {
              return (
                <Stack alignItems="center" style={{paddingTop: 16, paddingBottom: 16}}>
                  <Text >
                    Broker contact information not available for this task.
                  </Text>
                </Stack>
              );
            }
            return (
              <Stack gap={16}>
                <Stack style={{backgroundColor: 'var(--color-blue-2)'}} style={{borderRadius: 8}} padding={16} borderWidth={1} borderColor="$blue6">
                  <Text weight="medium"  style={{marginBottom: 16}}>
                    {broker.name}
                  </Text>
                  <Stack gap={16}>
                    <Row
                      tag="a"
                      href={`mailto:${broker.email}`}
                      alignItems="center"
                      gap={16}
                      style={{color: 'var(--color-blue-10)'}}
                      hoverStyle={{ color: '$blue12' }}
                    >
                      <Mail size={16} />
                      <Text>{broker.email}</Text>
                    </Row>
                    {broker.phone && (
                      <Row
                        tag="a"
                        href={`tel:${broker.phone}`}
                        alignItems="center"
                        gap={16}
                        style={{color: 'var(--color-blue-10)'}}
                        hoverStyle={{ color: '$blue12' }}
                      >
                        <Phone size={16} />
                        <Text>{broker.phone}</Text>
                      </Row>
                    )}
                  </Stack>
                </Stack>
                <Stack size="sm" >
                  <Text style={{marginBottom: 16}}>
                    Task: <Text weight="medium">{selectedTask.title}</Text>
                  </Text>
                  {selectedTask.project_name && (
                    <Text>
                      Project: <Text weight="medium">{selectedTask.project_name}</Text>
                    </Text>
                  )}
                </Stack>
              </Stack>
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
        size="medium"
      >
        {selectedTask && (
          <Stack gap={16}>
            <Stack style={{backgroundColor: 'var(--color-blue-2)'}} style={{borderRadius: 8}} padding={16} borderWidth={1} borderColor="$blue6">
              <Text size="sm" weight="medium"  style={{marginBottom: 16}}>
                {selectedTask.title}
              </Text>
              {selectedTask.description && (
                <Text size="sm" >
                  {selectedTask.description}
                </Text>
              )}
            </Stack>

            <Stack>
              <Text tag="label" display="block" size="sm" weight="medium"  style={{marginBottom: 16}}>
                Select Document
              </Text>
              <Stack borderWidth={2} borderStyle="dashed" style={{borderColor: 'var(--color-border)'}} style={{borderRadius: 8}} padding={16} alignItems="center">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  id="file-upload"
                />
                <Stack
                  tag="label"
                  htmlFor="file-upload"
                  cursor="pointer"
                  alignItems="center"
                  gap={16}
                >
                  <Upload color="var(--blue10)" size={32} />
                  <Text size="sm" >
                    {uploadedFile
                      ? uploadedFile.name
                      : 'Click to upload or drag and drop'}
                  </Text>
                  <Text size="sm" >
                    PDF, DOC, DOCX, PNG, JPG (Max 10MB)
                  </Text>
                </Stack>
              </Stack>
            </Stack>

            {uploadedFile && (
              <Row alignItems="center" justifyContent="space-between" padding={16} style={{backgroundColor: 'var(--color-green-2)'}} style={{borderRadius: 8}} borderWidth={1} borderColor="$green6">
                <Row alignItems="center" gap={16}>
                  <FileText color="var(--green10)" size={16} />
                  <Text size="sm" >
                    {uploadedFile.name}
                  </Text>
                </Row>
                <Row
                  tag="button"
                  onPress={() => {
                    setUploadedFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  style={{color: 'var(--color-red-10)'}}
                  hoverStyle={{ color: '$red12' }}
                  cursor="pointer"
                >
                  <X size={16} />
                </Row>
              </Row>
            )}

            <Row justifyContent="flex-end" gap={16} style={{paddingTop: 16}}>
              <Button
                variant="ghost"
                onPress={() => {
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
              <Button onPress={handleUploadSubmit} disabled={!uploadedFile}>
                Upload Document
              </Button>
            </Row>
          </Stack>
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
        size="medium"
      >
        {selectedTask &&
          (() => {
            const quoteDetails = getQuoteDetails(selectedTask);
            return (
              <Stack gap={16}>
                <Stack style={{backgroundColor: 'var(--color-blue-2)'}} style={{borderRadius: 8}} padding={16} borderWidth={1} borderColor="$blue6">
                  <Text size="sm" weight="medium"  style={{marginBottom: 16}}>
                    {selectedTask.title}
                  </Text>
                  {quoteDetails && (
                    <Stack gap={16} size="sm">
                      <Row justifyContent="space-between">
                        <Text >
                          Current Limit:
                        </Text>
                        <Text weight="medium" >
                          ${(quoteDetails.current / 1000000).toFixed(1)}M
                        </Text>
                      </Row>
                      <Row justifyContent="space-between">
                        <Text >
                          Required Limit:
                        </Text>
                        <Text weight="medium" >
                          ${(quoteDetails.required / 1000000).toFixed(1)}M
                        </Text>
                      </Row>
                      <Row justifyContent="space-between" style={{paddingTop: 16}} borderTopWidth={1} borderTopColor="$blue6">
                        <Text >Gap Amount:</Text>
                        <Text weight="medium" style={{color: 'var(--color-yellow-10)'}}>
                          ${(quoteDetails.gap / 1000000).toFixed(1)}M
                        </Text>
                      </Row>
                    </Stack>
                  )}
                </Stack>

                <Stack>
                  <Text tag="label" display="block" size="sm" weight="medium"  style={{marginBottom: 16}}>
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
                </Stack>

                <Row justifyContent="flex-end" gap={16} style={{paddingTop: 16}}>
                  <Button
                    variant="ghost"
                    onPress={() => {
                      setQuoteModalOpen(false);
                      setSelectedTask(null);
                      setQuoteRequest({ message: '' });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onPress={handleQuoteSubmit}>Submit Request</Button>
                </Row>
              </Stack>
            );
          })()}
      </Modal>
    </Stack>
  );
}
