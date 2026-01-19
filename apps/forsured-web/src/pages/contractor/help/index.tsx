// src/pages/contractor/help/index.tsx
// Contractor Help Center with comprehensive documentation

import { useState } from 'react';
import {
  Stack,
  Row,
  Text,
  H1,
  H2,
  H3,
  Card,
  Accordion,
  Paragraph,
} from '@unicornlove/beyond-ui';
import {
  Users,
  FileText,
  Shield,
  LayoutDashboard,
  CheckSquare,
  Mail,
  HelpCircle,
  BookOpen,
  Zap,
  Handshake,
  Building,
  Upload,
  Download,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Briefcase,
  Eye,
  Bell,
  Settings,
} from 'lucide-react';

interface QuickLinkProps {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick?: () => void;
}

function QuickLink({ icon: Icon, title, description, onClick }: QuickLinkProps) {
  return (
    <Card
      style={{
        padding: 20,
        borderRadius: 12,
        border: '1px solid var(--color-gray-4)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        flex: 1,
        minWidth: 280,
      }}
      onPress={onClick}
    >
      <Row alignItems="flex-start" gap={16}>
        <div
          style={{
            backgroundColor: 'var(--color-orange-2)',
            borderRadius: 10,
            padding: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={24} style={{ color: 'var(--color-orange-9)' }} />
        </div>
        <Stack gap={4} style={{ flex: 1 }}>
          <Text weight="semibold" style={{ color: 'var(--color-gray-12)' }}>
            {title}
          </Text>
          <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
            {description}
          </Text>
        </Stack>
      </Row>
    </Card>
  );
}

interface HelpSectionProps {
  id: string;
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}

function HelpSection({ icon: Icon, title, children }: HelpSectionProps) {
  return (
    <Card
      style={{
        padding: 24,
        borderRadius: 12,
        border: '1px solid var(--color-gray-4)',
        backgroundColor: 'var(--color-background)',
      }}
    >
      <Row alignItems="center" gap={12} style={{ marginBottom: 16 }}>
        <div
          style={{
            backgroundColor: 'var(--color-orange-2)',
            borderRadius: 8,
            padding: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={20} style={{ color: 'var(--color-orange-9)' }} />
        </div>
        <H2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>{title}</H2>
      </Row>
      {children}
    </Card>
  );
}

interface StepItemProps {
  number: number;
  title: string;
  description: string;
}

function StepItem({ number, title, description }: StepItemProps) {
  return (
    <Row alignItems="flex-start" gap={16} style={{ marginBottom: 16 }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          backgroundColor: 'var(--color-orange-9)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 600,
          fontSize: 14,
          flexShrink: 0,
        }}
      >
        {number}
      </div>
      <Stack gap={4}>
        <Text weight="semibold" style={{ color: 'var(--color-gray-12)' }}>
          {title}
        </Text>
        <Text size="sm" style={{ color: 'var(--color-gray-11)', lineHeight: 1.6 }}>
          {description}
        </Text>
      </Stack>
    </Row>
  );
}

export default function ContractorHelp() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <Stack gap={32} style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <Stack gap={8}>
        <H1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-gray-12)' }}>
          Contractor Help Center
        </H1>
        <Text size="lg" style={{ color: 'var(--color-gray-11)', maxWidth: 600 }}>
          Everything you need to manage your projects, work with managers, and maintain compliance.
          Find guides, tips, and answers to common questions.
        </Text>
      </Stack>

      {/* Quick Links */}
      <Stack gap={16}>
        <H2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-gray-12)' }}>
          Quick Links
        </H2>
        <Row gap={16} style={{ flexWrap: 'wrap' }}>
          <QuickLink
            icon={Handshake}
            title="Working with Managers"
            description="Learn how to connect with managers and accept project invitations"
            onClick={() => scrollToSection('managers')}
          />
          <QuickLink
            icon={Building}
            title="Projects"
            description="View and manage your assigned construction projects"
            onClick={() => scrollToSection('projects')}
          />
          <QuickLink
            icon={FileText}
            title="Documents"
            description="Upload certificates, contracts, and compliance documents"
            onClick={() => scrollToSection('documents')}
          />
          <QuickLink
            icon={CheckSquare}
            title="Tasks"
            description="Complete compliance tasks and requirements"
            onClick={() => scrollToSection('tasks')}
          />
          <QuickLink
            icon={Bell}
            title="Notifications"
            description="View approvals and important updates"
            onClick={() => scrollToSection('notifications')}
          />
          <QuickLink
            icon={Settings}
            title="Settings"
            description="Manage your profile and preferences"
            onClick={() => scrollToSection('settings')}
          />
        </Row>
      </Stack>

      {/* Getting Started */}
      <HelpSection id="getting-started" icon={Zap} title="Getting Started">
        <Paragraph style={{ color: 'var(--color-gray-11)', marginBottom: 20 }}>
          Welcome to ForSured! As a subcontractor, you can connect with managers (General Contractors),
          work on projects, upload compliance documents, and manage your insurance requirements all in one place.
        </Paragraph>
        <Stack gap={8}>
          <StepItem
            number={1}
            title="Connect with a Manager"
            description="Managers will invite you to join their projects. Accept invitations via email or by entering a connection code on the Managers page."
          />
          <StepItem
            number={2}
            title="View Your Projects"
            description="Once connected, you'll see all projects you're assigned to on the Projects page. Click any project to view details."
          />
          <StepItem
            number={3}
            title="Upload Documents"
            description="Upload certificates of insurance (COIs), safety certifications, and other required documents to stay compliant."
          />
          <StepItem
            number={4}
            title="Complete Tasks"
            description="Check your Tasks page regularly for compliance requirements, document requests, and action items from managers."
          />
        </Stack>
      </HelpSection>

      {/* Working with Managers */}
      <HelpSection id="managers" icon={Handshake} title="Working with Managers">
        <Stack gap={20}>
          <Stack gap={8}>
            <H3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-gray-12)' }}>
              Accepting Invitations
            </H3>
            <Paragraph style={{ color: 'var(--color-gray-11)' }}>
              Managers (General Contractors) will invite you to work on their projects. You can accept invitations via email:
            </Paragraph>
            <Stack gap={12} style={{ marginTop: 8 }}>
              <Row alignItems="center" gap={12}>
                <Mail size={18} style={{ color: 'var(--color-orange-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Email Invitation:</strong> Click the link in the invitation email to automatically connect. The email will include a connection code if you need to connect manually.
                </Text>
              </Row>
            </Stack>
          </Stack>

          <Stack gap={8}>
            <H3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-gray-12)' }}>
              Manager Relationships
            </H3>
            <Paragraph style={{ color: 'var(--color-gray-11)' }}>
              Once connected, you can work with multiple managers simultaneously. Each manager relationship includes:
            </Paragraph>
            <Stack gap={8} style={{ marginTop: 8, marginLeft: 16 }}>
              <Row alignItems="center" gap={8}>
                <ArrowRight size={14} style={{ color: 'var(--color-gray-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Project Access:</strong> View and work on projects assigned by that manager
                </Text>
              </Row>
              <Row alignItems="center" gap={8}>
                <ArrowRight size={14} style={{ color: 'var(--color-gray-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Compliance Requirements:</strong> See specific insurance and document requirements for each manager
                </Text>
              </Row>
              <Row alignItems="center" gap={8}>
                <ArrowRight size={14} style={{ color: 'var(--color-gray-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Task Management:</strong> Receive and complete tasks assigned by managers
                </Text>
              </Row>
              <Row alignItems="center" gap={8}>
                <ArrowRight size={14} style={{ color: 'var(--color-gray-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Document Sharing:</strong> Upload documents that managers can review and approve
                </Text>
              </Row>
            </Stack>
          </Stack>
        </Stack>
      </HelpSection>

      {/* Projects */}
      <HelpSection id="projects" icon={Building} title="Managing Projects">
        <Stack gap={20}>
          <Paragraph style={{ color: 'var(--color-gray-11)' }}>
            The Projects page shows all construction projects you&apos;ve been assigned to by managers.
            Each project displays important information about your role and requirements.
          </Paragraph>

          <Stack gap={8}>
            <H3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-gray-12)' }}>
              Project Information
            </H3>
            <Paragraph style={{ color: 'var(--color-gray-11)' }}>
              When you click on a project, you&apos;ll see:
            </Paragraph>
            <Stack gap={8} style={{ marginTop: 8, marginLeft: 16 }}>
              <Row alignItems="center" gap={8}>
                <CheckCircle size={14} style={{ color: 'var(--color-green-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  Project name, location, and timeline
                </Text>
              </Row>
              <Row alignItems="center" gap={8}>
                <CheckCircle size={14} style={{ color: 'var(--color-green-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  Your compliance status for that project
                </Text>
              </Row>
              <Row alignItems="center" gap={8}>
                <CheckCircle size={14} style={{ color: 'var(--color-green-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  Required insurance coverage and documents
                </Text>
              </Row>
              <Row alignItems="center" gap={8}>
                <CheckCircle size={14} style={{ color: 'var(--color-green-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  Tasks and action items specific to the project
                </Text>
              </Row>
            </Stack>
          </Stack>

          <Stack gap={8}>
            <H3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-gray-12)' }}>
              Project Status
            </H3>
            <Row gap={16} style={{ flexWrap: 'wrap', marginTop: 8 }}>
              <Card
                style={{
                  padding: 16,
                  borderRadius: 8,
                  border: '1px solid var(--color-blue-6)',
                  backgroundColor: 'var(--color-blue-2)',
                  flex: 1,
                  minWidth: 150,
                }}
              >
                <Text weight="semibold" style={{ color: 'var(--color-blue-11)', marginBottom: 4 }}>
                  Active
                </Text>
                <Text size="sm" style={{ color: 'var(--color-blue-11)' }}>
                  Project is currently in progress
                </Text>
              </Card>
              <Card
                style={{
                  padding: 16,
                  borderRadius: 8,
                  border: '1px solid var(--color-green-6)',
                  backgroundColor: 'var(--color-green-2)',
                  flex: 1,
                  minWidth: 150,
                }}
              >
                <Text weight="semibold" style={{ color: 'var(--color-green-11)', marginBottom: 4 }}>
                  Completed
                </Text>
                <Text size="sm" style={{ color: 'var(--color-green-11)' }}>
                  Project work has finished
                </Text>
              </Card>
              <Card
                style={{
                  padding: 16,
                  borderRadius: 8,
                  border: '1px solid var(--color-gray-6)',
                  backgroundColor: 'var(--color-gray-2)',
                  flex: 1,
                  minWidth: 150,
                }}
              >
                <Text weight="semibold" style={{ color: 'var(--color-gray-11)', marginBottom: 4 }}>
                  On Hold
                </Text>
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  Project temporarily paused
                </Text>
              </Card>
            </Row>
          </Stack>
        </Stack>
      </HelpSection>

      {/* Documents */}
      <HelpSection id="documents" icon={FileText} title="Documents">
        <Stack gap={20}>
          <Paragraph style={{ color: 'var(--color-gray-11)' }}>
            Upload and manage your compliance documents, certificates of insurance, and other required files.
            Documents can be shared with managers and your broker.
          </Paragraph>

          <Stack gap={8}>
            <H3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-gray-12)' }}>
              Uploading Documents
            </H3>
            <Stack gap={12}>
              <Row alignItems="center" gap={12}>
                <Upload size={18} style={{ color: 'var(--color-orange-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  Drag and drop PDF files into the upload zone, or click to browse
                </Text>
              </Row>
              <Row alignItems="center" gap={12}>
                <FileText size={18} style={{ color: 'var(--color-orange-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  Select a category: Compliance, Insurance, Contract, or General
                </Text>
              </Row>
              <Row alignItems="center" gap={12}>
                <CheckCircle size={18} style={{ color: 'var(--color-orange-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  Maximum file size: 10MB per document
                </Text>
              </Row>
            </Stack>
          </Stack>

          <Stack gap={8}>
            <H3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-gray-12)' }}>
              Document Categories
            </H3>
            <Row gap={12} style={{ flexWrap: 'wrap', marginTop: 8 }}>
              {[
                { name: 'Compliance', desc: 'Safety certs, training records' },
                { name: 'Insurance', desc: 'COIs, policy declarations' },
                { name: 'Contract', desc: 'Signed agreements, addenda' },
                { name: 'General', desc: 'Other supporting documents' },
              ].map((cat) => (
                <Card
                  key={cat.name}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    border: '1px solid var(--color-gray-4)',
                    minWidth: 150,
                  }}
                >
                  <Text weight="semibold" size="sm" style={{ color: 'var(--color-gray-12)' }}>
                    {cat.name}
                  </Text>
                  <Text size="xs" style={{ color: 'var(--color-gray-11)' }}>
                    {cat.desc}
                  </Text>
                </Card>
              ))}
            </Row>
          </Stack>

          <Stack gap={8}>
            <H3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-gray-12)' }}>
              Managing Documents
            </H3>
            <Stack gap={8}>
              <Row alignItems="center" gap={12}>
                <Eye size={18} style={{ color: 'var(--color-gray-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>View:</strong> Click on a document to preview or open in a new tab
                </Text>
              </Row>
              <Row alignItems="center" gap={12}>
                <Download size={18} style={{ color: 'var(--color-gray-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Download:</strong> Save documents locally using the download button
                </Text>
              </Row>
              <Row alignItems="center" gap={12}>
                <AlertTriangle size={18} style={{ color: 'var(--color-gray-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Delete:</strong> Remove documents with confirmation (this cannot be undone)
                </Text>
              </Row>
            </Stack>
          </Stack>
        </Stack>
      </HelpSection>

      {/* Tasks */}
      <HelpSection id="tasks" icon={CheckSquare} title="Tasks & Compliance">
        <Stack gap={20}>
          <Paragraph style={{ color: 'var(--color-gray-11)' }}>
            The Tasks page shows all compliance requirements, document requests, and action items assigned
            by managers. Complete tasks promptly to maintain your compliance status.
          </Paragraph>

          <Stack gap={8}>
            <H3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-gray-12)' }}>
              Task Types
            </H3>
            <Stack gap={8} style={{ marginTop: 8 }}>
              <Row alignItems="center" gap={12}>
                <FileText size={18} style={{ color: 'var(--color-orange-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Document Requests:</strong> Upload missing certificates or compliance documents
                </Text>
              </Row>
              <Row alignItems="center" gap={12}>
                <Shield size={18} style={{ color: 'var(--color-orange-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Compliance Requirements:</strong> Meet insurance or safety requirements for projects
                </Text>
              </Row>
              <Row alignItems="center" gap={12}>
                <Clock size={18} style={{ color: 'var(--color-orange-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Policy Updates:</strong> Update expiring insurance policies
                </Text>
              </Row>
              <Row alignItems="center" gap={12}>
                <AlertTriangle size={18} style={{ color: 'var(--color-orange-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Urgent Items:</strong> Address critical compliance gaps immediately
                </Text>
              </Row>
            </Stack>
          </Stack>

          <Stack gap={8}>
            <H3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-gray-12)' }}>
              Completing Tasks
            </H3>
            <Paragraph style={{ color: 'var(--color-gray-11)' }}>
              When tasks are available, you can complete them by:
            </Paragraph>
            <Stack gap={8} style={{ marginTop: 8, marginLeft: 16 }}>
              <Row alignItems="center" gap={8}>
                <ArrowRight size={14} style={{ color: 'var(--color-gray-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  Click on the task to view details and requirements
                </Text>
              </Row>
              <Row alignItems="center" gap={8}>
                <ArrowRight size={14} style={{ color: 'var(--color-gray-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  Upload any required documents or provide requested information
                </Text>
              </Row>
              <Row alignItems="center" gap={8}>
                <ArrowRight size={14} style={{ color: 'var(--color-gray-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  Mark the task as complete when all requirements are met
                </Text>
              </Row>
            </Stack>
            <Paragraph style={{ color: 'var(--color-gray-11)', marginTop: 12, fontStyle: 'italic' }}>
              Note: Tasks are assigned by managers as needed. If you don&apos;t see any tasks, check back later or contact your manager.
            </Paragraph>
          </Stack>
        </Stack>
      </HelpSection>

      {/* Notifications */}
      <HelpSection id="notifications" icon={Bell} title="Notifications & Approvals">
        <Stack gap={20}>
          <Paragraph style={{ color: 'var(--color-gray-11)' }}>
            The Notifications page keeps you informed about important updates, approvals, and action items
            from managers and your broker.
          </Paragraph>

          <Stack gap={8}>
            <H3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-gray-12)' }}>
              Notification Types
            </H3>
            <Stack gap={8} style={{ marginTop: 8 }}>
              <Row alignItems="center" gap={12}>
                <CheckCircle size={18} style={{ color: 'var(--color-green-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Document Approvals:</strong> Notifications when managers approve or request changes to your documents
                </Text>
              </Row>
              <Row alignItems="center" gap={12}>
                <Building size={18} style={{ color: 'var(--color-blue-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Project Updates:</strong> Updates about projects you&apos;re assigned to
                </Text>
              </Row>
              <Row alignItems="center" gap={12}>
                <Shield size={18} style={{ color: 'var(--color-orange-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Compliance Alerts:</strong> Warnings about expiring documents or compliance gaps
                </Text>
              </Row>
              <Row alignItems="center" gap={12}>
                <Users size={18} style={{ color: 'var(--color-purple-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Relationship Updates:</strong> New manager connections or broker invitations
                </Text>
              </Row>
            </Stack>
          </Stack>

          <Stack gap={8}>
            <H3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-gray-12)' }}>
              Managing Notifications
            </H3>
            <Paragraph style={{ color: 'var(--color-gray-11)' }}>
              You can:
            </Paragraph>
            <Stack gap={8} style={{ marginTop: 8, marginLeft: 16 }}>
              <Row alignItems="center" gap={8}>
                <ArrowRight size={14} style={{ color: 'var(--color-gray-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  View all notifications in one place
                </Text>
              </Row>
              <Row alignItems="center" gap={8}>
                <ArrowRight size={14} style={{ color: 'var(--color-gray-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  Filter by type or status
                </Text>
              </Row>
              <Row alignItems="center" gap={8}>
                <ArrowRight size={14} style={{ color: 'var(--color-gray-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  Mark notifications as read or unread
                </Text>
              </Row>
              <Row alignItems="center" gap={8}>
                <ArrowRight size={14} style={{ color: 'var(--color-gray-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  Configure notification preferences in Settings
                </Text>
              </Row>
            </Stack>
          </Stack>
        </Stack>
      </HelpSection>

      {/* My Broker */}
      <HelpSection id="broker" icon={Briefcase} title="My Broker">
        <Stack gap={20}>
          <Paragraph style={{ color: 'var(--color-gray-11)' }}>
            Connect with your insurance broker to manage your policies and compliance requirements.
            Your broker can help you maintain proper coverage and upload necessary documents.
          </Paragraph>

          <Stack gap={8}>
            <H3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-gray-12)' }}>
              Connecting with Your Broker
            </H3>
            <Paragraph style={{ color: 'var(--color-gray-11)' }}>
              You can connect with your broker in two ways:
            </Paragraph>
            <Stack gap={12} style={{ marginTop: 8 }}>
              <Row alignItems="center" gap={12}>
                <Mail size={18} style={{ color: 'var(--color-orange-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Invite Your Broker:</strong> Send an invitation to your broker&apos;s email address
                </Text>
              </Row>
              <Row alignItems="center" gap={12}>
                <Briefcase size={18} style={{ color: 'var(--color-orange-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Use Broker Code:</strong> Enter a connection code provided by your broker
                </Text>
              </Row>
            </Stack>
          </Stack>

          <Stack gap={8}>
            <H3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-gray-12)' }}>
              Broker Benefits
            </H3>
            <Stack gap={8} style={{ marginTop: 8, marginLeft: 16 }}>
              <Row alignItems="center" gap={8}>
                <CheckCircle size={14} style={{ color: 'var(--color-green-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  Your broker can view and manage your insurance policies
                </Text>
              </Row>
              <Row alignItems="center" gap={8}>
                <CheckCircle size={14} style={{ color: 'var(--color-green-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  Upload documents on your behalf for compliance
                </Text>
              </Row>
              <Row alignItems="center" gap={8}>
                <CheckCircle size={14} style={{ color: 'var(--color-green-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  Help you meet project-specific insurance requirements
                </Text>
              </Row>
              <Row alignItems="center" gap={8}>
                <CheckCircle size={14} style={{ color: 'var(--color-green-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  Track policy renewals and expiration dates
                </Text>
              </Row>
            </Stack>
          </Stack>
        </Stack>
      </HelpSection>

      {/* Dashboard */}
      <HelpSection id="dashboard" icon={LayoutDashboard} title="Dashboard Overview">
        <Stack gap={20}>
          <Paragraph style={{ color: 'var(--color-gray-11)' }}>
            Your dashboard provides a quick overview of your compliance status, active projects, and pending tasks.
          </Paragraph>

          <Stack gap={8}>
            <H3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-gray-12)' }}>
              Dashboard Features
            </H3>
            <Stack gap={8} style={{ marginTop: 8, marginLeft: 16 }}>
              <Row alignItems="center" gap={8}>
                <ArrowRight size={14} style={{ color: 'var(--color-gray-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Compliance Status:</strong> Overall compliance score across all projects
                </Text>
              </Row>
              <Row alignItems="center" gap={8}>
                <ArrowRight size={14} style={{ color: 'var(--color-gray-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Active Projects:</strong> Number of projects you&apos;re currently working on
                </Text>
              </Row>
              <Row alignItems="center" gap={8}>
                <ArrowRight size={14} style={{ color: 'var(--color-gray-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Pending Tasks:</strong> Action items requiring your attention
                </Text>
              </Row>
              <Row alignItems="center" gap={8}>
                <ArrowRight size={14} style={{ color: 'var(--color-gray-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Manager Connections:</strong> Number of managers you&apos;re working with
                </Text>
              </Row>
              <Row alignItems="center" gap={8}>
                <ArrowRight size={14} style={{ color: 'var(--color-gray-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Broker Connections:</strong> Your connected insurance brokers
                </Text>
              </Row>
            </Stack>
          </Stack>
        </Stack>
      </HelpSection>

      {/* Settings */}
      <HelpSection id="settings" icon={Settings} title="Settings & Preferences">
        <Stack gap={20}>
          <Paragraph style={{ color: 'var(--color-gray-11)' }}>
            Manage your account settings, company information, insurance details, and notification preferences
            from the Settings section.
          </Paragraph>

          <Stack gap={8}>
            <H3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-gray-12)' }}>
              Available Settings Pages
            </H3>
            <Stack gap={12} style={{ marginTop: 8 }}>
              <Row alignItems="flex-start" gap={12}>
                <Users size={18} style={{ color: 'var(--color-orange-9)', marginTop: 2 }} />
                <Stack gap={4}>
                  <Text weight="semibold" size="sm" style={{ color: 'var(--color-gray-12)' }}>
                    Profile Settings
                  </Text>
                  <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                    Update your personal information, contact details, and account preferences
                  </Text>
                </Stack>
              </Row>
              <Row alignItems="flex-start" gap={12}>
                <Building size={18} style={{ color: 'var(--color-orange-9)', marginTop: 2 }} />
                <Stack gap={4}>
                  <Text weight="semibold" size="sm" style={{ color: 'var(--color-gray-12)' }}>
                    Company Settings
                  </Text>
                  <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                    Manage your company information, business details, and organization profile
                  </Text>
                </Stack>
              </Row>
              <Row alignItems="flex-start" gap={12}>
                <Shield size={18} style={{ color: 'var(--color-orange-9)', marginTop: 2 }} />
                <Stack gap={4}>
                  <Text weight="semibold" size="sm" style={{ color: 'var(--color-gray-12)' }}>
                    Insurance Info
                  </Text>
                  <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                    View and manage your insurance policies and coverage information
                  </Text>
                </Stack>
              </Row>
              <Row alignItems="flex-start" gap={12}>
                <Bell size={18} style={{ color: 'var(--color-orange-9)', marginTop: 2 }} />
                <Stack gap={4}>
                  <Text weight="semibold" size="sm" style={{ color: 'var(--color-gray-12)' }}>
                    Notification Settings
                  </Text>
                  <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                    Configure how and when you receive notifications about approvals, tasks, and updates
                  </Text>
                </Stack>
              </Row>
              <Row alignItems="flex-start" gap={12}>
                <FileText size={18} style={{ color: 'var(--color-orange-9)', marginTop: 2 }} />
                <Stack gap={4}>
                  <Text weight="semibold" size="sm" style={{ color: 'var(--color-gray-12)' }}>
                    Document Settings
                  </Text>
                  <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                    Manage document preferences and default upload settings
                  </Text>
                </Stack>
              </Row>
              <Row alignItems="flex-start" gap={12}>
                <Briefcase size={18} style={{ color: 'var(--color-orange-9)', marginTop: 2 }} />
                <Stack gap={4}>
                  <Text weight="semibold" size="sm" style={{ color: 'var(--color-gray-12)' }}>
                    Referrals
                  </Text>
                  <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                    View and manage your referral program participation and credits
                  </Text>
                </Stack>
              </Row>
            </Stack>
          </Stack>

          <Stack gap={8}>
            <H3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-gray-12)' }}>
              Accessing Settings
            </H3>
            <Paragraph style={{ color: 'var(--color-gray-11)' }}>
              Navigate to Settings from the main menu or command palette. You can access any settings page
              directly, and changes are saved automatically.
            </Paragraph>
          </Stack>
        </Stack>
      </HelpSection>

      {/* FAQ */}
      <HelpSection id="faq" icon={HelpCircle} title="Frequently Asked Questions">
        <Accordion mode="single" width="full">
          <Accordion.Item value="connect-manager">
            <Accordion.Trigger>
              How do I connect with a manager?
            </Accordion.Trigger>
            <Accordion.Content>
              <Paragraph style={{ color: 'var(--color-gray-11)' }}>
                Managers will send you an invitation via email. Click the link in the invitation email
                to automatically connect. Once connected, you&apos;ll see their projects on the Projects
                page and can start working together.
              </Paragraph>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="upload-documents">
            <Accordion.Trigger>
              Where do I upload my documents?
            </Accordion.Trigger>
            <Accordion.Content>
              <Paragraph style={{ color: 'var(--color-gray-11)' }}>
                Navigate to the Documents page to upload certificates of insurance, safety certifications,
                and other compliance documents. You can drag and drop PDF files or click to browse.
                Select an appropriate category (Compliance, Insurance, Contract, or General) before uploading.
              </Paragraph>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="view-projects">
            <Accordion.Trigger>
              How do I see which projects I&apos;m assigned to?
            </Accordion.Trigger>
            <Accordion.Content>
              <Paragraph style={{ color: 'var(--color-gray-11)' }}>
                Go to the Projects page to see all projects you&apos;ve been assigned to by managers.
                Click on any project to view details including location, timeline, compliance requirements,
                and tasks specific to that project.
              </Paragraph>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="complete-tasks">
            <Accordion.Trigger>
              How do I complete a task?
            </Accordion.Trigger>
            <Accordion.Content>
              <Paragraph style={{ color: 'var(--color-gray-11)' }}>
                When tasks are assigned by managers, go to the Tasks page and click on a task to view its details.
                Follow the instructions, upload any required documents, and mark the task as complete when all
                requirements are met. Managers will be notified when you complete tasks. If you don&apos;t see
                any tasks, check back later or contact your manager.
              </Paragraph>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="notifications">
            <Accordion.Trigger>
              How do I view my notifications?
            </Accordion.Trigger>
            <Accordion.Content>
              <Paragraph style={{ color: 'var(--color-gray-11)' }}>
                Go to the Notifications page to see all your notifications in one place. You can filter by type,
                mark items as read or unread, and configure notification preferences in Settings. Notifications
                include document approvals, project updates, compliance alerts, and relationship updates.
              </Paragraph>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="settings">
            <Accordion.Trigger>
              Where can I update my account settings?
            </Accordion.Trigger>
            <Accordion.Content>
              <Paragraph style={{ color: 'var(--color-gray-11)' }}>
                Navigate to Settings from the main menu to access all your account settings. You can update your
                profile, company information, insurance details, notification preferences, document settings, and
                referral program participation. Changes are saved automatically.
              </Paragraph>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="connect-broker">
            <Accordion.Trigger>
              How do I connect with my insurance broker?
            </Accordion.Trigger>
            <Accordion.Content>
              <Paragraph style={{ color: 'var(--color-gray-11)' }}>
                Go to the My Broker page and either invite your broker by email or enter a connection
                code they provide. Once connected, your broker can help manage your insurance policies
                and compliance documents.
              </Paragraph>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="compliance-requirements">
            <Accordion.Trigger>
              What compliance requirements do I need to meet?
            </Accordion.Trigger>
            <Accordion.Content>
              <Paragraph style={{ color: 'var(--color-gray-11)' }}>
                Compliance requirements vary by project and manager. Generally, you&apos;ll need current
                certificates of insurance (COIs), safety certifications, and other documents specific to
                your trade. Check your Tasks page and project details to see specific requirements for
                each project.
              </Paragraph>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="multiple-managers">
            <Accordion.Trigger>
              Can I work with multiple managers?
            </Accordion.Trigger>
            <Accordion.Content>
              <Paragraph style={{ color: 'var(--color-gray-11)' }}>
                Yes! You can work with multiple managers simultaneously. Each manager relationship is
                independent, and you&apos;ll see all your projects from all managers on the Projects page.
                You can filter by manager if needed.
              </Paragraph>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="support">
            <Accordion.Trigger>
              How do I get additional support?
            </Accordion.Trigger>
            <Accordion.Content>
              <Paragraph style={{ color: 'var(--color-gray-11)' }}>
                If you need additional help or have questions not covered here, please contact our
                support team at support@forsured.com. We&apos;re here to help you manage your projects
                and compliance requirements effectively.
              </Paragraph>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion>
      </HelpSection>

      {/* Contact Support */}
      <Card
        style={{
          padding: 24,
          borderRadius: 12,
          border: '1px solid var(--color-orange-6)',
          backgroundColor: 'var(--color-orange-2)',
        }}
      >
        <Row alignItems="center" gap={16} style={{ flexWrap: 'wrap' }}>
          <div
            style={{
              backgroundColor: 'var(--color-orange-9)',
              borderRadius: 12,
              padding: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BookOpen size={28} style={{ color: 'white' }} />
          </div>
          <Stack gap={4} style={{ flex: 1, minWidth: 200 }}>
            <Text weight="semibold" size="lg" style={{ color: 'var(--color-orange-11)' }}>
              Need More Help?
            </Text>
            <Text style={{ color: 'var(--color-orange-11)' }}>
              Contact our support team at{' '}
              <a
                href="mailto:support@forsured.com"
                style={{
                  color: 'var(--color-orange-11)',
                  fontWeight: 600,
                  textDecoration: 'underline',
                }}
              >
                support@forsured.com
              </a>
            </Text>
          </Stack>
        </Row>
      </Card>
    </Stack>
  );
}
