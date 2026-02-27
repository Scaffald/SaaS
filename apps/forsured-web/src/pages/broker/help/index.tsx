// src/pages/broker/help/index.tsx
// Broker Help Center with comprehensive documentation

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
} from '@scaffald/ui';
import {
  Users,
  FileText,
  Shield,
  LayoutDashboard,
  CheckSquare,
  Mail,
  Search,
  HelpCircle,
  BookOpen,
  Zap,
  UserPlus,
  Eye,
  Upload,
  Download,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Bell,
  Settings,
  Briefcase,
  Gift,
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

export default function BrokerHelp() {
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
          Broker Help Center
        </H1>
        <Text size="lg" style={{ color: 'var(--color-gray-11)', maxWidth: 600 }}>
          Everything you need to manage your clients&apos; insurance compliance efficiently.
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
            icon={Users}
            title="Managing Clients"
            description="Learn how to invite, view, and manage your clients"
            onClick={() => scrollToSection('clients')}
          />
          <QuickLink
            icon={FileText}
            title="Documents"
            description="Upload, organize, and track client documents"
            onClick={() => scrollToSection('documents')}
          />
          <QuickLink
            icon={Shield}
            title="Compliance"
            description="Monitor and manage insurance compliance"
            onClick={() => scrollToSection('compliance')}
          />
          <QuickLink
            icon={CheckSquare}
            title="Tasks"
            description="Stay on top of renewals and action items"
            onClick={() => scrollToSection('tasks')}
          />
          <QuickLink
            icon={Users}
            title="Team"
            description="Manage your broker team members"
            onClick={() => scrollToSection('team')}
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
          Welcome to ForSured! As a broker, you can manage multiple clients&apos; insurance
          needs, track compliance requirements, and stay on top of policy renewals all in one place.
        </Paragraph>
        <Stack gap={8}>
          <StepItem
            number={1}
            title="Invite Your First Client"
            description="Navigate to the Clients page and click 'Invite Clients' to send an invitation via email or share a unique connection code."
          />
          <StepItem
            number={2}
            title="Review Client Profiles"
            description="Once connected, view each client's profile to see their projects, policies, and compliance status."
          />
          <StepItem
            number={3}
            title="Upload Documents"
            description="Upload certificates of insurance (COIs), contracts, and other compliance documents directly to client profiles."
          />
          <StepItem
            number={4}
            title="Build Your Team"
            description="Invite team members to collaborate on client management and assign roles and permissions."
          />
          <StepItem
            number={5}
            title="Monitor Compliance"
            description="Use the dashboard to track overall compliance scores and identify clients needing attention."
          />
        </Stack>
      </HelpSection>

      {/* Managing Clients */}
      <HelpSection id="clients" icon={Users} title="Managing Clients">
        <Stack gap={20}>
          <Stack gap={8}>
            <H3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-gray-12)' }}>
              Inviting Clients
            </H3>
            <Paragraph style={{ color: 'var(--color-gray-11)' }}>
              To add a new client to your portfolio, use the &quot;Invite Clients&quot; button on the
              Clients page. You can either:
            </Paragraph>
            <Stack gap={12} style={{ marginTop: 8 }}>
              <Row alignItems="center" gap={12}>
                <Mail size={18} style={{ color: 'var(--color-orange-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Email Invitation:</strong> Send an invitation link directly to their email
                </Text>
              </Row>
              <Row alignItems="center" gap={12}>
                <UserPlus size={18} style={{ color: 'var(--color-orange-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Connection Code:</strong> Share a unique code that clients can enter to connect
                </Text>
              </Row>
            </Stack>
          </Stack>

          <Stack gap={8}>
            <H3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-gray-12)' }}>
              Client Profiles
            </H3>
            <Paragraph style={{ color: 'var(--color-gray-11)' }}>
              Each client has a dedicated profile page accessible from the Clients list. The profile includes:
            </Paragraph>
            <Stack gap={8} style={{ marginTop: 8, marginLeft: 16 }}>
              <Row alignItems="center" gap={8}>
                <ArrowRight size={14} style={{ color: 'var(--color-gray-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Overview:</strong> Company information and compliance summary
                </Text>
              </Row>
              <Row alignItems="center" gap={8}>
                <ArrowRight size={14} style={{ color: 'var(--color-gray-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Compliance:</strong> Detailed compliance status and requirements
                </Text>
              </Row>
              <Row alignItems="center" gap={8}>
                <ArrowRight size={14} style={{ color: 'var(--color-gray-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Policies:</strong> Active insurance policies and coverage details
                </Text>
              </Row>
              <Row alignItems="center" gap={8}>
                <ArrowRight size={14} style={{ color: 'var(--color-gray-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Projects:</strong> Associated construction projects
                </Text>
              </Row>
              <Row alignItems="center" gap={8}>
                <ArrowRight size={14} style={{ color: 'var(--color-gray-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Documents:</strong> Uploaded files and certificates
                </Text>
              </Row>
            </Stack>
          </Stack>

          <Stack gap={8}>
            <H3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-gray-12)' }}>
              Client Types
            </H3>
            <Paragraph style={{ color: 'var(--color-gray-11)' }}>
              ForSured supports two types of clients for brokers:
            </Paragraph>
            <Row gap={16} style={{ marginTop: 12, flexWrap: 'wrap' }}>
              <Card
                style={{
                  padding: 16,
                  borderRadius: 8,
                  border: '1px solid var(--color-blue-6)',
                  backgroundColor: 'var(--color-blue-2)',
                  flex: 1,
                  minWidth: 200,
                }}
              >
                <Text weight="semibold" style={{ color: 'var(--color-blue-11)', marginBottom: 4 }}>
                  General Contractors (GCs)
                </Text>
                <Text size="sm" style={{ color: 'var(--color-blue-11)' }}>
                  Also called &quot;Managers&quot; - companies that manage projects and subcontractors
                </Text>
              </Card>
              <Card
                style={{
                  padding: 16,
                  borderRadius: 8,
                  border: '1px solid var(--color-green-6)',
                  backgroundColor: 'var(--color-green-2)',
                  flex: 1,
                  minWidth: 200,
                }}
              >
                <Text weight="semibold" style={{ color: 'var(--color-green-11)', marginBottom: 4 }}>
                  Subcontractors
                </Text>
                <Text size="sm" style={{ color: 'var(--color-green-11)' }}>
                  Specialty trade contractors working on specific project scopes
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
            Documents are managed at the client level. Navigate to a client&apos;s profile and
            select the &quot;Documents&quot; tab to upload and manage their files.
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

      {/* Compliance */}
      <HelpSection id="compliance" icon={Shield} title="Insurance & Compliance">
        <Stack gap={20}>
          <Paragraph style={{ color: 'var(--color-gray-11)' }}>
            The compliance dashboard gives you a quick overview of all your clients&apos; insurance
            status. Monitor coverage gaps, expiring policies, and compliance scores.
          </Paragraph>

          <Stack gap={8}>
            <H3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-gray-12)' }}>
              Compliance Scores
            </H3>
            <Row gap={16} style={{ flexWrap: 'wrap', marginTop: 8 }}>
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
                <Text weight="bold" style={{ color: 'var(--color-green-11)', fontSize: 24 }}>
                  90-100%
                </Text>
                <Text size="sm" style={{ color: 'var(--color-green-11)' }}>
                  Compliant - All requirements met
                </Text>
              </Card>
              <Card
                style={{
                  padding: 16,
                  borderRadius: 8,
                  border: '1px solid var(--color-yellow-6)',
                  backgroundColor: 'var(--color-yellow-2)',
                  flex: 1,
                  minWidth: 150,
                }}
              >
                <Text weight="bold" style={{ color: 'var(--color-yellow-11)', fontSize: 24 }}>
                  70-89%
                </Text>
                <Text size="sm" style={{ color: 'var(--color-yellow-11)' }}>
                  Needs Attention - Some gaps
                </Text>
              </Card>
              <Card
                style={{
                  padding: 16,
                  borderRadius: 8,
                  border: '1px solid var(--color-red-6)',
                  backgroundColor: 'var(--color-red-2)',
                  flex: 1,
                  minWidth: 150,
                }}
              >
                <Text weight="bold" style={{ color: 'var(--color-red-11)', fontSize: 24 }}>
                  Below 70%
                </Text>
                <Text size="sm" style={{ color: 'var(--color-red-11)' }}>
                  At Risk - Urgent action needed
                </Text>
              </Card>
            </Row>
          </Stack>

          <Stack gap={8}>
            <H3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-gray-12)' }}>
              Viewing Client Policies
            </H3>
            <Paragraph style={{ color: 'var(--color-gray-11)' }}>
              To view a client&apos;s insurance policies, navigate to their profile and select the
              &quot;Policies&quot; tab. You&apos;ll see:
            </Paragraph>
            <Stack gap={8} style={{ marginTop: 8, marginLeft: 16 }}>
              <Row alignItems="center" gap={8}>
                <CheckCircle size={14} style={{ color: 'var(--color-green-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  Policy type (General Liability, Workers Comp, Auto, etc.)
                </Text>
              </Row>
              <Row alignItems="center" gap={8}>
                <CheckCircle size={14} style={{ color: 'var(--color-green-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  Coverage amounts and limits
                </Text>
              </Row>
              <Row alignItems="center" gap={8}>
                <CheckCircle size={14} style={{ color: 'var(--color-green-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  Policy effective and expiration dates
                </Text>
              </Row>
              <Row alignItems="center" gap={8}>
                <CheckCircle size={14} style={{ color: 'var(--color-green-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  Current status (Active, Expiring Soon, Expired)
                </Text>
              </Row>
            </Stack>
          </Stack>
        </Stack>
      </HelpSection>

      {/* Tasks */}
      <HelpSection id="tasks" icon={CheckSquare} title="Tasks & Dashboard">
        <Stack gap={20}>
          <Paragraph style={{ color: 'var(--color-gray-11)' }}>
            The Tasks page helps you stay organized and on top of important deadlines. Create tasks
            for policy renewals, document requests, follow-ups, and more.
          </Paragraph>

          <Stack gap={8}>
            <H3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-gray-12)' }}>
              Task Types
            </H3>
            <Stack gap={8} style={{ marginTop: 8 }}>
              <Row alignItems="center" gap={12}>
                <Clock size={18} style={{ color: 'var(--color-orange-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Policy Renewals:</strong> Track upcoming policy expirations
                </Text>
              </Row>
              <Row alignItems="center" gap={12}>
                <FileText size={18} style={{ color: 'var(--color-orange-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Document Requests:</strong> Request missing certificates or forms
                </Text>
              </Row>
              <Row alignItems="center" gap={12}>
                <Users size={18} style={{ color: 'var(--color-orange-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Client Follow-ups:</strong> Schedule check-ins and reviews
                </Text>
              </Row>
              <Row alignItems="center" gap={12}>
                <AlertTriangle size={18} style={{ color: 'var(--color-orange-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Compliance Issues:</strong> Address coverage gaps or requirements
                </Text>
              </Row>
            </Stack>
          </Stack>

          <Stack gap={8}>
            <H3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-gray-12)' }}>
              Dashboard Overview
            </H3>
            <Paragraph style={{ color: 'var(--color-gray-11)' }}>
              Your dashboard provides a high-level view of your entire book of business:
            </Paragraph>
            <Stack gap={8} style={{ marginTop: 8, marginLeft: 16 }}>
              <Row alignItems="center" gap={8}>
                <ArrowRight size={14} style={{ color: 'var(--color-gray-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Compliance Overview:</strong> Aggregate compliance score across all clients
                </Text>
              </Row>
              <Row alignItems="center" gap={8}>
                <ArrowRight size={14} style={{ color: 'var(--color-gray-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Tasks Inbox:</strong> Prioritized list of pending and upcoming tasks
                </Text>
              </Row>
              <Row alignItems="center" gap={8}>
                <ArrowRight size={14} style={{ color: 'var(--color-gray-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Filter by Project:</strong> Focus on specific projects across your clients
                </Text>
              </Row>
            </Stack>
          </Stack>
        </Stack>
      </HelpSection>

      {/* Team */}
      <HelpSection id="team" icon={Users} title="Team Management">
        <Stack gap={20}>
          <Paragraph style={{ color: 'var(--color-gray-11)' }}>
            Manage your broker team members, assign roles, and collaborate on client management.
            The Team page allows you to invite team members and control access to your agency&apos;s clients.
          </Paragraph>

          <Stack gap={8}>
            <H3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-gray-12)' }}>
              Team Features
            </H3>
            <Stack gap={8} style={{ marginTop: 8, marginLeft: 16 }}>
              <Row alignItems="center" gap={8}>
                <ArrowRight size={14} style={{ color: 'var(--color-gray-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Invite Team Members:</strong> Add colleagues to your broker agency
                </Text>
              </Row>
              <Row alignItems="center" gap={8}>
                <ArrowRight size={14} style={{ color: 'var(--color-gray-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Role Management:</strong> Assign roles and permissions to team members
                </Text>
              </Row>
              <Row alignItems="center" gap={8}>
                <ArrowRight size={14} style={{ color: 'var(--color-gray-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Client Access:</strong> Control which team members can access specific clients
                </Text>
              </Row>
              <Row alignItems="center" gap={8}>
                <ArrowRight size={14} style={{ color: 'var(--color-gray-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Collaboration:</strong> Work together on client compliance and document management
                </Text>
              </Row>
            </Stack>
          </Stack>
        </Stack>
      </HelpSection>

      {/* Acknowledgements */}
      <HelpSection id="acknowledgements" icon={Briefcase} title="Acknowledgements">
        <Stack gap={20}>
          <Paragraph style={{ color: 'var(--color-gray-11)' }}>
            Manage and track acknowledgements for safety documents, policies, and compliance
            requirements that your clients must sign. Create acknowledgement forms and monitor
            completion status.
          </Paragraph>

          <Stack gap={8}>
            <H3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-gray-12)' }}>
              How It Works
            </H3>
            <Stack gap={8} style={{ marginTop: 8 }}>
              <Row alignItems="center" gap={12}>
                <FileText size={18} style={{ color: 'var(--color-orange-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  Create acknowledgement forms for documents that require client signature
                </Text>
              </Row>
              <Row alignItems="center" gap={12}>
                <Mail size={18} style={{ color: 'var(--color-orange-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  Send forms to clients for review and electronic signature
                </Text>
              </Row>
              <Row alignItems="center" gap={12}>
                <CheckCircle size={18} style={{ color: 'var(--color-orange-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  Track who has acknowledged and who is pending completion
                </Text>
              </Row>
              <Row alignItems="center" gap={12}>
                <Clock size={18} style={{ color: 'var(--color-orange-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  Monitor acknowledgement deadlines and send reminders
                </Text>
              </Row>
            </Stack>
          </Stack>
        </Stack>
      </HelpSection>

      {/* Notifications */}
      <HelpSection id="notifications" icon={Bell} title="Notifications & Approvals">
        <Stack gap={20}>
          <Paragraph style={{ color: 'var(--color-gray-11)' }}>
            The Notifications page keeps you informed about important updates, approvals, and action items
            from clients, team members, and system alerts.
          </Paragraph>

          <Stack gap={8}>
            <H3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-gray-12)' }}>
              Notification Types
            </H3>
            <Stack gap={8} style={{ marginTop: 8 }}>
              <Row alignItems="center" gap={12}>
                <CheckCircle size={18} style={{ color: 'var(--color-green-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Document Approvals:</strong> Notifications when clients upload documents requiring your review
                </Text>
              </Row>
              <Row alignItems="center" gap={12}>
                <Shield size={18} style={{ color: 'var(--color-blue-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Compliance Alerts:</strong> Warnings about expiring policies or compliance gaps
                </Text>
              </Row>
              <Row alignItems="center" gap={12}>
                <Users size={18} style={{ color: 'var(--color-purple-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Client Activity:</strong> New client connections, profile updates, or requests
                </Text>
              </Row>
              <Row alignItems="center" gap={12}>
                <Clock size={18} style={{ color: 'var(--color-orange-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Policy Renewals:</strong> Reminders about upcoming policy expiration dates
                </Text>
              </Row>
              <Row alignItems="center" gap={12}>
                <Users size={18} style={{ color: 'var(--color-teal-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Team Updates:</strong> Activity from team members or team management changes
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
                  View all notifications in one centralized location
                </Text>
              </Row>
              <Row alignItems="center" gap={8}>
                <ArrowRight size={14} style={{ color: 'var(--color-gray-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  Filter by type, client, or team member
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

      {/* Settings */}
      <HelpSection id="settings" icon={Settings} title="Settings & Preferences">
        <Stack gap={20}>
          <Paragraph style={{ color: 'var(--color-gray-11)' }}>
            Manage your account settings, agency information, client preferences, and notification
            preferences from the Settings section.
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
                <Briefcase size={18} style={{ color: 'var(--color-orange-9)', marginTop: 2 }} />
                <Stack gap={4}>
                  <Text weight="semibold" size="sm" style={{ color: 'var(--color-gray-12)' }}>
                    Agency Settings
                  </Text>
                  <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                    Manage your broker agency information, business details, and organization profile
                  </Text>
                </Stack>
              </Row>
              <Row alignItems="flex-start" gap={12}>
                <Users size={18} style={{ color: 'var(--color-orange-9)', marginTop: 2 }} />
                <Stack gap={4}>
                  <Text weight="semibold" size="sm" style={{ color: 'var(--color-gray-12)' }}>
                    Client Settings
                  </Text>
                  <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                    Configure default settings and preferences for client management
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
                    Configure how and when you receive notifications about compliance, approvals, and updates
                  </Text>
                </Stack>
              </Row>
              <Row alignItems="flex-start" gap={12}>
                <Gift size={18} style={{ color: 'var(--color-orange-9)', marginTop: 2 }} />
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
          <Accordion.Item value="invite">
            <Accordion.Trigger>
              How do I add a new client?
            </Accordion.Trigger>
            <Accordion.Content>
              <Paragraph style={{ color: 'var(--color-gray-11)' }}>
                Go to the Clients page and click the &quot;Invite Clients&quot; button. You can either
                send an email invitation directly to the client, or generate a connection code that
                the client can enter when signing up or logging in to ForSured. Once they accept,
                they&apos;ll appear in your client list.
              </Paragraph>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="documents">
            <Accordion.Trigger>
              Where do I upload client documents?
            </Accordion.Trigger>
            <Accordion.Content>
              <Paragraph style={{ color: 'var(--color-gray-11)' }}>
                Documents are uploaded at the client level. Navigate to Clients, select a client,
                then click on the &quot;Documents&quot; tab. From there you can drag and drop PDF files
                or click to browse. Choose a category (Compliance, Insurance, Contract, or General)
                before uploading.
              </Paragraph>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="policies">
            <Accordion.Trigger>
              How do I view a client&apos;s insurance policies?
            </Accordion.Trigger>
            <Accordion.Content>
              <Paragraph style={{ color: 'var(--color-gray-11)' }}>
                From the Clients page, click on a client to view their profile. Select the
                &quot;Policies&quot; tab to see all their active and expired insurance policies,
                including coverage details, effective dates, and status.
              </Paragraph>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="compliance-score">
            <Accordion.Trigger>
              What does the compliance score mean?
            </Accordion.Trigger>
            <Accordion.Content>
              <Paragraph style={{ color: 'var(--color-gray-11)' }}>
                The compliance score indicates how well a client meets their insurance requirements.
                A score of 90-100% means they&apos;re fully compliant. 70-89% means some items need
                attention (like expiring policies or missing documents). Below 70% indicates
                significant gaps that require urgent action.
              </Paragraph>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="client-types">
            <Accordion.Trigger>
              What&apos;s the difference between Managers and Contractors?
            </Accordion.Trigger>
            <Accordion.Content>
              <Paragraph style={{ color: 'var(--color-gray-11)' }}>
                &quot;Managers&quot; (also called General Contractors or GCs) are companies that
                manage construction projects and hire subcontractors. &quot;Contractors&quot; are
                subcontractors who work on specific trade scopes within projects. Both types can
                be your clients, and the compliance requirements may differ based on their role.
              </Paragraph>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="notifications">
            <Accordion.Trigger>
              How do I get notified about expiring policies?
            </Accordion.Trigger>
            <Accordion.Content>
              <Paragraph style={{ color: 'var(--color-gray-11)' }}>
                ForSured automatically tracks policy expiration dates and creates tasks when
                policies are approaching their expiration date. Check your Tasks page regularly
                to see upcoming renewals. You&apos;ll also see expiring policies highlighted in
                the dashboard compliance overview. Configure notification preferences in Settings
                to control how you receive these alerts.
              </Paragraph>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="team-management">
            <Accordion.Trigger>
              How do I manage my broker team?
            </Accordion.Trigger>
            <Accordion.Content>
              <Paragraph style={{ color: 'var(--color-gray-11)' }}>
                Go to the Team page to invite team members, assign roles and permissions, and
                control access to your clients. Team members can collaborate on client management,
                upload documents, and help track compliance. You can manage team member access
                and remove members as needed.
              </Paragraph>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="acknowledgements">
            <Accordion.Trigger>
              How do I create acknowledgement forms?
            </Accordion.Trigger>
            <Accordion.Content>
              <Paragraph style={{ color: 'var(--color-gray-11)' }}>
                Navigate to the Acknowledgements page to create forms that require client signatures.
                You can create forms for safety documents, policies, or compliance requirements.
                Send forms to clients for electronic signature and track completion status. The
                system will notify you when clients acknowledge documents.
              </Paragraph>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="view-notifications">
            <Accordion.Trigger>
              How do I view my notifications?
            </Accordion.Trigger>
            <Accordion.Content>
              <Paragraph style={{ color: 'var(--color-gray-11)' }}>
                Go to the Notifications page to see all your notifications in one place. You can filter by type,
                client, or team member, mark items as read or unread, and configure notification preferences
                in Settings. Notifications include document approvals, compliance alerts, client activity,
                policy renewals, and team updates.
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
                profile, agency information, client settings, notification preferences, and referral program
                participation. Changes are saved automatically.
              </Paragraph>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="support">
            <Accordion.Trigger>
              How do I get additional support?
            </Accordion.Trigger>
            <Accordion.Content>
              <Paragraph style={{ color: 'var(--color-gray-11)' }}>
                If you need additional help or have questions not covered here, please contact
                our support team at support@forsured.com. We&apos;re here to help you manage
                your clients&apos; insurance compliance effectively.
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
