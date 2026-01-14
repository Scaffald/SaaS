// src/pages/gc/help/index.tsx
// Manager (GC) Help Center with comprehensive documentation

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
  Building,
  UserPlus,
  HelpCircle,
  BookOpen,
  Zap,
  Eye,
  Upload,
  Download,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Briefcase,
  Send,
  Link,
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

export default function GCHelp() {
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
          Manager Help Center
        </H1>
        <Text size="lg" style={{ color: 'var(--color-gray-11)', maxWidth: 600 }}>
          Everything you need to manage your projects, subcontractors, and compliance requirements.
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
            icon={Building}
            title="Managing Projects"
            description="Create projects and track subcontractor compliance"
            onClick={() => scrollToSection('projects')}
          />
          <QuickLink
            icon={Users}
            title="Subcontractors"
            description="Invite, manage, and monitor your subcontractors"
            onClick={() => scrollToSection('subcontractors')}
          />
          <QuickLink
            icon={FileText}
            title="Documents"
            description="Upload and manage compliance documents"
            onClick={() => scrollToSection('documents')}
          />
          <QuickLink
            icon={CheckSquare}
            title="Tasks"
            description="Stay on top of action items and deadlines"
            onClick={() => scrollToSection('tasks')}
          />
        </Row>
      </Stack>

      {/* Getting Started */}
      <HelpSection id="getting-started" icon={Zap} title="Getting Started">
        <Paragraph style={{ color: 'var(--color-gray-11)', marginBottom: 20 }}>
          Welcome to ForSured! As a General Contractor (Manager), you can create projects,
          invite subcontractors, track their insurance compliance, and manage all your
          documentation in one centralized platform.
        </Paragraph>
        <Stack gap={8}>
          <StepItem
            number={1}
            title="Create Your First Project"
            description="Navigate to Projects and click 'Create Project' to set up a new construction project with its compliance requirements."
          />
          <StepItem
            number={2}
            title="Invite Subcontractors"
            description="Add subcontractors to your projects by sending email invitations or sharing connection codes."
          />
          <StepItem
            number={3}
            title="Set Compliance Requirements"
            description="Define the insurance and documentation requirements for each project that subcontractors must meet."
          />
          <StepItem
            number={4}
            title="Monitor Compliance"
            description="Use the dashboard to track compliance status across all your projects and subcontractors."
          />
        </Stack>
      </HelpSection>

      {/* Managing Projects */}
      <HelpSection id="projects" icon={Building} title="Managing Projects">
        <Stack gap={20}>
          <Stack gap={8}>
            <H3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-gray-12)' }}>
              Creating Projects
            </H3>
            <Paragraph style={{ color: 'var(--color-gray-11)' }}>
              Projects are the foundation of compliance management in ForSured. Each project
              can have its own set of requirements and assigned subcontractors.
            </Paragraph>
            <Stack gap={12} style={{ marginTop: 8 }}>
              <Row alignItems="center" gap={12}>
                <Building size={18} style={{ color: 'var(--color-orange-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Project Name:</strong> Give your project a clear, identifiable name
                </Text>
              </Row>
              <Row alignItems="center" gap={12}>
                <Clock size={18} style={{ color: 'var(--color-orange-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Timeline:</strong> Set start and end dates for the project
                </Text>
              </Row>
              <Row alignItems="center" gap={12}>
                <Shield size={18} style={{ color: 'var(--color-orange-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Requirements:</strong> Define insurance minimums and document requirements
                </Text>
              </Row>
            </Stack>
          </Stack>

          <Stack gap={8}>
            <H3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-gray-12)' }}>
              Project Dashboard
            </H3>
            <Paragraph style={{ color: 'var(--color-gray-11)' }}>
              Each project has a detailed dashboard showing:
            </Paragraph>
            <Stack gap={8} style={{ marginTop: 8, marginLeft: 16 }}>
              <Row alignItems="center" gap={8}>
                <ArrowRight size={14} style={{ color: 'var(--color-gray-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Overview:</strong> Project details and overall compliance status
                </Text>
              </Row>
              <Row alignItems="center" gap={8}>
                <ArrowRight size={14} style={{ color: 'var(--color-gray-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Subcontractors:</strong> List of assigned subs and their compliance status
                </Text>
              </Row>
              <Row alignItems="center" gap={8}>
                <ArrowRight size={14} style={{ color: 'var(--color-gray-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Documents:</strong> All project-related documents and certificates
                </Text>
              </Row>
              <Row alignItems="center" gap={8}>
                <ArrowRight size={14} style={{ color: 'var(--color-gray-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Requirements:</strong> Insurance and compliance requirements for the project
                </Text>
              </Row>
            </Stack>
          </Stack>
        </Stack>
      </HelpSection>

      {/* Managing Subcontractors */}
      <HelpSection id="subcontractors" icon={Users} title="Managing Subcontractors">
        <Stack gap={20}>
          <Stack gap={8}>
            <H3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-gray-12)' }}>
              Inviting Subcontractors
            </H3>
            <Paragraph style={{ color: 'var(--color-gray-11)' }}>
              Add subcontractors to your network using one of these methods:
            </Paragraph>
            <Stack gap={12} style={{ marginTop: 8 }}>
              <Row alignItems="center" gap={12}>
                <Send size={18} style={{ color: 'var(--color-orange-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Email Invitation:</strong> Send a direct invitation to their email address
                </Text>
              </Row>
              <Row alignItems="center" gap={12}>
                <Link size={18} style={{ color: 'var(--color-orange-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Connection Code:</strong> Share a unique code they can enter to connect
                </Text>
              </Row>
              <Row alignItems="center" gap={12}>
                <UserPlus size={18} style={{ color: 'var(--color-orange-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Project Assignment:</strong> Invite directly when adding to a project
                </Text>
              </Row>
            </Stack>
          </Stack>

          <Stack gap={8}>
            <H3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-gray-12)' }}>
              Subcontractor Profiles
            </H3>
            <Paragraph style={{ color: 'var(--color-gray-11)' }}>
              View detailed information about each subcontractor:
            </Paragraph>
            <Stack gap={8} style={{ marginTop: 8, marginLeft: 16 }}>
              <Row alignItems="center" gap={8}>
                <CheckCircle size={14} style={{ color: 'var(--color-green-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  Company information and contact details
                </Text>
              </Row>
              <Row alignItems="center" gap={8}>
                <CheckCircle size={14} style={{ color: 'var(--color-green-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  Insurance policies and coverage details
                </Text>
              </Row>
              <Row alignItems="center" gap={8}>
                <CheckCircle size={14} style={{ color: 'var(--color-green-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  Compliance status across all assigned projects
                </Text>
              </Row>
              <Row alignItems="center" gap={8}>
                <CheckCircle size={14} style={{ color: 'var(--color-green-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  Uploaded documents and certificates
                </Text>
              </Row>
            </Stack>
          </Stack>

          <Stack gap={8}>
            <H3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-gray-12)' }}>
              Compliance Tracking
            </H3>
            <Row gap={16} style={{ marginTop: 12, flexWrap: 'wrap' }}>
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
                  Compliant - Ready to work
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
                  Needs Attention
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
                  Non-Compliant
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
            The Documents section allows you to manage all compliance-related files for your
            organization and projects.
          </Paragraph>

          <Stack gap={8}>
            <H3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-gray-12)' }}>
              Uploading Documents
            </H3>
            <Stack gap={12}>
              <Row alignItems="center" gap={12}>
                <Upload size={18} style={{ color: 'var(--color-orange-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  Drag and drop files or click to browse
                </Text>
              </Row>
              <Row alignItems="center" gap={12}>
                <FileText size={18} style={{ color: 'var(--color-orange-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  Supported formats: PDF (up to 10MB)
                </Text>
              </Row>
              <Row alignItems="center" gap={12}>
                <CheckCircle size={18} style={{ color: 'var(--color-orange-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  Documents are automatically categorized and tracked
                </Text>
              </Row>
            </Stack>
          </Stack>

          <Stack gap={8}>
            <H3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-gray-12)' }}>
              Document Types
            </H3>
            <Row gap={12} style={{ flexWrap: 'wrap', marginTop: 8 }}>
              {[
                { name: 'COI', desc: 'Certificates of Insurance' },
                { name: 'Licenses', desc: 'Trade and business licenses' },
                { name: 'Contracts', desc: 'Signed agreements' },
                { name: 'Safety', desc: 'Safety certifications' },
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
                  <strong>View:</strong> Preview documents directly in the browser
                </Text>
              </Row>
              <Row alignItems="center" gap={12}>
                <Download size={18} style={{ color: 'var(--color-gray-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Download:</strong> Save documents to your device
                </Text>
              </Row>
              <Row alignItems="center" gap={12}>
                <AlertTriangle size={18} style={{ color: 'var(--color-gray-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Expiration Tracking:</strong> Get notified before documents expire
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
            Stay organized with tasks that help you track compliance items, follow-ups,
            and important deadlines across all your projects.
          </Paragraph>

          <Stack gap={8}>
            <H3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-gray-12)' }}>
              Task Types
            </H3>
            <Stack gap={8} style={{ marginTop: 8 }}>
              <Row alignItems="center" gap={12}>
                <Clock size={18} style={{ color: 'var(--color-orange-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Expiring Documents:</strong> COIs and certificates nearing expiration
                </Text>
              </Row>
              <Row alignItems="center" gap={12}>
                <AlertTriangle size={18} style={{ color: 'var(--color-orange-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Compliance Issues:</strong> Subcontractors with missing or expired coverage
                </Text>
              </Row>
              <Row alignItems="center" gap={12}>
                <FileText size={18} style={{ color: 'var(--color-orange-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Document Requests:</strong> Pending document submissions from subcontractors
                </Text>
              </Row>
              <Row alignItems="center" gap={12}>
                <Users size={18} style={{ color: 'var(--color-orange-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Onboarding:</strong> New subcontractors awaiting setup completion
                </Text>
              </Row>
            </Stack>
          </Stack>

          <Stack gap={8}>
            <H3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-gray-12)' }}>
              Dashboard Overview
            </H3>
            <Paragraph style={{ color: 'var(--color-gray-11)' }}>
              Your dashboard provides a comprehensive view of your compliance status:
            </Paragraph>
            <Stack gap={8} style={{ marginTop: 8, marginLeft: 16 }}>
              <Row alignItems="center" gap={8}>
                <ArrowRight size={14} style={{ color: 'var(--color-gray-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Compliance Summary:</strong> Overall compliance across all projects
                </Text>
              </Row>
              <Row alignItems="center" gap={8}>
                <ArrowRight size={14} style={{ color: 'var(--color-gray-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Active Projects:</strong> Quick access to your current projects
                </Text>
              </Row>
              <Row alignItems="center" gap={8}>
                <ArrowRight size={14} style={{ color: 'var(--color-gray-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Recent Activity:</strong> Latest updates and notifications
                </Text>
              </Row>
              <Row alignItems="center" gap={8}>
                <ArrowRight size={14} style={{ color: 'var(--color-gray-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Tasks Inbox:</strong> Prioritized list of action items
                </Text>
              </Row>
            </Stack>
          </Stack>
        </Stack>
      </HelpSection>

      {/* My Broker */}
      <HelpSection id="broker" icon={Shield} title="My Broker">
        <Stack gap={20}>
          <Paragraph style={{ color: 'var(--color-gray-11)' }}>
            Connect with your insurance broker to streamline communication and get help
            with your insurance needs.
          </Paragraph>

          <Stack gap={8}>
            <H3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-gray-12)' }}>
              Broker Connection
            </H3>
            <Stack gap={8} style={{ marginTop: 8 }}>
              <Row alignItems="center" gap={12}>
                <Link size={18} style={{ color: 'var(--color-orange-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Connect:</strong> Link your account to your insurance broker
                </Text>
              </Row>
              <Row alignItems="center" gap={12}>
                <Eye size={18} style={{ color: 'var(--color-orange-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Visibility:</strong> Your broker can view your compliance status
                </Text>
              </Row>
              <Row alignItems="center" gap={12}>
                <FileText size={18} style={{ color: 'var(--color-orange-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  <strong>Documents:</strong> Share documents directly with your broker
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
            Manage and track acknowledgements for safety documents, policies, and
            compliance requirements that subcontractors must sign.
          </Paragraph>

          <Stack gap={8}>
            <H3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-gray-12)' }}>
              How It Works
            </H3>
            <Stack gap={8} style={{ marginTop: 8 }}>
              <Row alignItems="center" gap={12}>
                <FileText size={18} style={{ color: 'var(--color-orange-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  Create documents that require acknowledgement
                </Text>
              </Row>
              <Row alignItems="center" gap={12}>
                <Send size={18} style={{ color: 'var(--color-orange-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  Send to subcontractors for review and signature
                </Text>
              </Row>
              <Row alignItems="center" gap={12}>
                <CheckCircle size={18} style={{ color: 'var(--color-orange-9)' }} />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  Track who has acknowledged and who is pending
                </Text>
              </Row>
            </Stack>
          </Stack>
        </Stack>
      </HelpSection>

      {/* FAQ */}
      <HelpSection id="faq" icon={HelpCircle} title="Frequently Asked Questions">
        <Accordion mode="single" width="full">
          <Accordion.Item value="create-project">
            <Accordion.Trigger>
              How do I create a new project?
            </Accordion.Trigger>
            <Accordion.Content>
              <Paragraph style={{ color: 'var(--color-gray-11)' }}>
                Navigate to the Projects page and click &quot;Create Project&quot;. Fill in the
                project details including name, address, start/end dates, and compliance
                requirements. Once created, you can start adding subcontractors to the project.
              </Paragraph>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="invite-sub">
            <Accordion.Trigger>
              How do I invite a subcontractor?
            </Accordion.Trigger>
            <Accordion.Content>
              <Paragraph style={{ color: 'var(--color-gray-11)' }}>
                Go to the Subcontractors page and click &quot;Invite Subcontractor&quot;. You can
                send an email invitation directly or generate a connection code to share.
                The subcontractor will receive instructions to join ForSured and connect
                with your organization.
              </Paragraph>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="compliance">
            <Accordion.Trigger>
              What does the compliance percentage mean?
            </Accordion.Trigger>
            <Accordion.Content>
              <Paragraph style={{ color: 'var(--color-gray-11)' }}>
                The compliance percentage shows how well a subcontractor meets your project&apos;s
                requirements. 90-100% means they&apos;re fully compliant and ready to work.
                70-89% indicates some items need attention. Below 70% means critical
                requirements are missing and they should not work until resolved.
              </Paragraph>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="assign-project">
            <Accordion.Trigger>
              How do I assign a subcontractor to a project?
            </Accordion.Trigger>
            <Accordion.Content>
              <Paragraph style={{ color: 'var(--color-gray-11)' }}>
                From the project page, go to the Subcontractors tab and click &quot;Add
                Subcontractor&quot;. Select from your existing network or invite a new
                subcontractor. Once assigned, they&apos;ll need to meet the project&apos;s specific
                compliance requirements.
              </Paragraph>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="expired-coi">
            <Accordion.Trigger>
              What happens when a subcontractor&apos;s COI expires?
            </Accordion.Trigger>
            <Accordion.Content>
              <Paragraph style={{ color: 'var(--color-gray-11)' }}>
                ForSured automatically tracks expiration dates and will notify both you
                and the subcontractor before a COI expires. Expired certificates will
                lower the subcontractor&apos;s compliance score and create a task for follow-up.
                The subcontractor must upload a renewed certificate to restore compliance.
              </Paragraph>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item value="broker-connection">
            <Accordion.Trigger>
              How do I connect with my insurance broker?
            </Accordion.Trigger>
            <Accordion.Content>
              <Paragraph style={{ color: 'var(--color-gray-11)' }}>
                Go to &quot;My Broker&quot; in the navigation menu. If your broker uses ForSured,
                you can connect using their broker code or accept an invitation from them.
                Once connected, your broker can help manage your insurance needs and view
                your compliance status.
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
                your subcontractor compliance effectively.
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
