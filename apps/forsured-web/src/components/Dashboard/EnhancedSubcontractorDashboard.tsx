/**
 * EnhancedSubcontractorDashboard - Subcontractor dashboard using Beyond UI
 * Shows account state and relationships with managers and brokers
 */
import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
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
  Users,
  Building,
  Loader2,
  UserCheck,
  UserX,
} from 'lucide-react'
import { Stack, Row, Text, Card, Grid, Button, H1, H3, Spinner } from '@unicornlove/beyond-ui'
import { EmptyState, LoadingContainer, ErrorContainer } from '../../ui'
import { useTasks } from '../../hooks/useTasks'
import { Task, SubcontractorTaskMetadata } from '../../types'
import ComplianceScore from '../Common/ComplianceScore'
import ButtonComponent from '../Common/Button'
import SubcontractorTasksPanel from '../Subcontractor/SubcontractorTasksPanel'
import InsuranceRequirementsModal from '../Subcontractor/InsuranceRequirementsModal'
import Modal from '../Common/Modal'
import Textarea from '../Common/Textarea'
import { useLexicon } from '../../contexts/LexiconContext'
import { useAuth } from '../../contexts/AuthContext'
import { useUser } from '../../contexts/UserContext'
import { useDatabase } from '../../contexts/DatabaseContext'
import { getUserOrganizationId } from '../../lib/supabase'
import { getUserInvitations, type RelationshipInvitation } from '../../lib/relationshipInvitations'
import { toast } from 'sonner'

export default function EnhancedSubcontractorDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { currentUser } = useUser()
  const { forsured } = useDatabase()
  const { t, getManagerLabel } = useLexicon()
  const { tasks, updateTask, loading: tasksLoading } = useTasks()
  
  // State
  const [loading, setLoading] = useState(true)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [connectedManagers, setConnectedManagers] = useState<RelationshipInvitation[]>([])
  const [connectedBrokers, setConnectedBrokers] = useState<RelationshipInvitation[]>([])
  const [pendingManagerInvites, setPendingManagerInvites] = useState<RelationshipInvitation[]>([])
  const [pendingBrokerInvites, setPendingBrokerInvites] = useState<RelationshipInvitation[]>([])
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([])
  const [complianceScore, setComplianceScore] = useState(0)
  const [documentsCount, setDocumentsCount] = useState(0)
  const [expiringDocuments, setExpiringDocuments] = useState(0)
  const [activePolicies, setActivePolicies] = useState(0)
  
  // Modal states
  const [requirementsModalOpen, setRequirementsModalOpen] = useState(false)
  const [contactBrokerModalOpen, setContactBrokerModalOpen] = useState(false)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [quoteModalOpen, setQuoteModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [quoteRequest, setQuoteRequest] = useState({ message: '' })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const userId = currentUser?.id ?? user?.id ?? null

  // Fetch organization ID
  useEffect(() => {
    async function fetchOrganization() {
      if (!userId) return

      try {
        const orgId = await getUserOrganizationId(userId)
        setOrganizationId(orgId)
      } catch (error) {
        console.error('[Dashboard] Error fetching organization:', error)
      }
    }

    fetchOrganization()
  }, [userId])

  // Fetch dashboard data
  useEffect(() => {
    async function fetchDashboardData() {
      if (!userId || !organizationId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        // Fetch relationship invitations
        const invitations = await getUserInvitations(userId)
        
        // Separate by type and status
        const managerInvites = invitations.filter(
          (inv) =>
            (inv.inviter_type === 'manager' && inv.invitee_type === 'subcontractor') ||
            (inv.inviter_type === 'subcontractor' && inv.invitee_type === 'manager')
        )
        const brokerInvites = invitations.filter(
          (inv) =>
            (inv.inviter_type === 'broker' && inv.invitee_type === 'subcontractor') ||
            (inv.inviter_type === 'subcontractor' && inv.invitee_type === 'broker')
        )

        setConnectedManagers(managerInvites.filter((inv) => inv.status === 'connected'))
        setConnectedBrokers(brokerInvites.filter((inv) => inv.status === 'connected'))
        setPendingManagerInvites(managerInvites.filter((inv) => inv.status === 'pending'))
        setPendingBrokerInvites(brokerInvites.filter((inv) => inv.status === 'pending'))

        // Fetch projects
        const { data: subcontractorData } = await forsured('subcontractors')
          .select('id')
          .eq('organization_id', organizationId)
          .maybeSingle()

        if (subcontractorData) {
          const { data: projectLinks } = await forsured('project_subcontractors')
            .select('project_id, projects(id, name)')
            .eq('subcontractor_id', subcontractorData.id)

          if (projectLinks) {
            const projectList = projectLinks
              .map((link: { project_id: string; projects: { id: string; name: string } | null }) => {
                if (link.projects) {
                  return { id: link.projects.id, name: link.projects.name }
                }
                return null
              })
              .filter((p): p is { id: string; name: string } => p !== null)
            setProjects(projectList)
          }

          // Fetch compliance score - only if subcontractor exists
          const { data: complianceData } = await forsured('compliance_scores')
            .select('score')
            .eq('subcontractor_id', subcontractorData.id)
            .order('last_evaluated', { ascending: false })
            .limit(1)
            .maybeSingle()

          setComplianceScore(complianceData?.score || 0)
        } else {
          setComplianceScore(0)
        }

        // Fetch documents count (mock - replace with real query)
        setDocumentsCount(8)
        setExpiringDocuments(2)
        setActivePolicies(4)
      } catch (error) {
        console.error('[Dashboard] Error fetching data:', error)
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    if (organizationId) {
      fetchDashboardData()
    }
  }, [userId, organizationId, forsured])

  // Computed metrics
  const tasksOverdue = useMemo(() => {
    return tasks.filter((t) => {
      if (!t.due_date) return false
      const dueDate = new Date(t.due_date)
      return dueDate < new Date() && t.status !== 'completed' && t.status !== 'cancelled'
    }).length
  }, [tasks])

  const tasksInProgress = useMemo(() => {
    return tasks.filter((t) => t.status === 'in_progress' || t.status === 'submitted').length
  }, [tasks])

  const tasksCompleted = useMemo(() => {
    return tasks.filter((t) => t.status === 'completed').length
  }, [tasks])

  const handleCompleteTask = async (taskId: string) => {
    await updateTask(taskId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
  }

  const handleViewRequirements = (task: Task) => {
    setSelectedTask(task)
    setRequirementsModalOpen(true)
  }

  const handleContactBroker = (task: Task) => {
    setSelectedTask(task)
    setContactBrokerModalOpen(true)
  }

  const handleUploadDocument = (task: Task) => {
    setSelectedTask(task)
    setUploadModalOpen(true)
  }

  const handleRequestQuote = (task: Task) => {
    setSelectedTask(task)
    setQuoteModalOpen(true)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
    }
  }

  const handleUploadSubmit = async () => {
    if (!selectedTask || !uploadedFile) return

    await updateTask(selectedTask.id, {
      status: 'submitted',
      updated_at: new Date().toISOString(),
    })

    setUploadedFile(null)
    setUploadModalOpen(false)
    setSelectedTask(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    toast.success('Document uploaded successfully! Your broker will review it.')
  }

  const handleQuoteSubmit = async () => {
    if (!selectedTask) return

    toast.success('Quote request submitted! Your broker will contact you soon.')
    setQuoteRequest({ message: '' })
    setQuoteModalOpen(false)
    setSelectedTask(null)
  }

  const getBrokerContact = (task: Task) => {
    const metadata = task.metadata as SubcontractorTaskMetadata | undefined
    return metadata?.broker_contact
  }

  const getQuoteDetails = (task: Task) => {
    const metadata = task.metadata as SubcontractorTaskMetadata | undefined
    if (metadata?.current_limit && metadata?.required_limit) {
      return {
        current: metadata.current_limit,
        required: metadata.required_limit,
        gap: metadata.gap_amount || metadata.required_limit - metadata.current_limit,
      }
    }
    return null
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-background)',
    borderRadius: 12,
    border: '1px solid var(--color-border)',
    padding: 20,
  }

  const iconBoxStyle = (color: string): React.CSSProperties => ({
    width: 40,
    height: 40,
    backgroundColor: `var(--color-${color}-3)`,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  })

  if (loading || tasksLoading) {
    return (
      <LoadingContainer>
        <Spinner size="lg" />
        <Text style={{ marginTop: 'var(--space-4)', color: 'var(--color-11)' }}>
          Loading dashboard...
        </Text>
      </LoadingContainer>
    )
  }

  return (
    <Stack gap={24} style={{ padding: 24 }}>
      {/* Header */}
      <Stack gap={8}>
        <H1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-gray-12)' }}>
          Dashboard
        </H1>
        <Text size="lg" style={{ color: 'var(--color-gray-11)' }}>
          Track your compliance status and manage relationships
        </Text>
      </Stack>

      {/* Account State Cards - TEST */}
      <Card style={cardStyle}>
        <Text size="lg" weight="bold">TEST CARD - Should appear</Text>
      </Card>

      {/* Account State Cards */}
      <Grid columns={{ base: 1, sm: 2, lg: 4 }} gap={16}>
        <Card style={cardStyle}>
          <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: 12 }}>
            <Stack style={iconBoxStyle('blue')}>
              <Shield size={20} style={{ color: 'var(--color-blue-10)' }} />
            </Stack>
            <Text size="2xl" weight="bold">
              {complianceScore}
            </Text>
          </Row>
          <Text size="sm" weight="medium" style={{ color: 'var(--color-gray-11)' }}>
            Compliance Score
          </Text>
          <Text size="xs" style={{ color: 'var(--color-gray-11)', marginTop: 4 }}>
            Overall health
          </Text>
        </Card>

        <Card style={cardStyle}>
          <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: 12 }}>
            <Stack style={iconBoxStyle('green')}>
              <FileText size={20} style={{ color: 'var(--color-green-10)' }} />
            </Stack>
            <Text size="2xl" weight="bold">
              {documentsCount}
            </Text>
          </Row>
          <Text size="sm" weight="medium" style={{ color: 'var(--color-gray-11)' }}>
            Documents
          </Text>
          <Text size="xs" style={{ color: 'var(--color-gray-11)', marginTop: 4 }}>
            {expiringDocuments > 0 ? `${expiringDocuments} expiring soon` : 'All verified'}
          </Text>
        </Card>

        <Card style={cardStyle}>
          <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: 12 }}>
            <Stack style={iconBoxStyle('orange')}>
              <Building size={20} style={{ color: 'var(--color-orange-10)' }} />
            </Stack>
            <Text size="2xl" weight="bold">
              {projects.length}
            </Text>
          </Row>
          <Text size="sm" weight="medium" style={{ color: 'var(--color-gray-11)' }}>
            Active Projects
          </Text>
          <Text size="xs" style={{ color: 'var(--color-gray-11)', marginTop: 4 }}>
            {tasks.length} total tasks
          </Text>
        </Card>

        <Card style={cardStyle}>
          <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: 12 }}>
            <Stack style={iconBoxStyle('green')}>
              <CheckCircle size={20} style={{ color: 'var(--color-green-10)' }} />
            </Stack>
            <Text size="2xl" weight="bold">
              {tasksCompleted}
            </Text>
          </Row>
          <Text size="sm" weight="medium" style={{ color: 'var(--color-gray-11)' }}>
            Completed Tasks
          </Text>
          <Text size="xs" style={{ color: 'var(--color-gray-11)', marginTop: 4 }}>
            {tasksInProgress} in progress
          </Text>
        </Card>
      </Grid>

      {/* Relationships Section */}
      <Grid columns={{ base: 1, lg: 2 }} gap={16}>
        {/* Managers Card */}
        <Card style={cardStyle}>
          <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: 16 }}>
            <Stack gap={4}>
              <H3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-gray-12)' }}>
                {getManagerLabel(true)}
              </H3>
              <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                Your {getManagerLabel(true).toLowerCase()} relationships
              </Text>
            </Stack>
            <Button
              size="sm"
              variant="outline"
              onPress={() => navigate('/subcontractor/relationships')}
            >
              Manage
            </Button>
          </Row>

          <Stack gap={12}>
            <Row alignItems="center" justifyContent="space-between" style={{ padding: 12, backgroundColor: 'var(--color-green-2)', borderRadius: 8 }}>
              <Row alignItems="center" gap={8}>
                <UserCheck size={18} color="var(--color-green-10)" />
                <Text size="sm" weight="semibold">
                  Connected
                </Text>
              </Row>
              <Text size="lg" weight="bold" style={{ color: 'var(--color-green-10)' }}>
                {connectedManagers.length}
              </Text>
            </Row>

            {pendingManagerInvites.length > 0 && (
              <Row alignItems="center" justifyContent="space-between" style={{ padding: 12, backgroundColor: 'var(--color-yellow-2)', borderRadius: 8 }}>
                <Row alignItems="center" gap={8}>
                  <Clock size={18} color="var(--color-yellow-10)" />
                  <Text size="sm" weight="semibold">
                    Pending Invitations
                  </Text>
                </Row>
                <Text size="lg" weight="bold" style={{ color: 'var(--color-yellow-10)' }}>
                  {pendingManagerInvites.length}
                </Text>
              </Row>
            )}

            {connectedManagers.length === 0 && pendingManagerInvites.length === 0 && (
              <Row alignItems="center" gap={8} style={{ padding: 12 }}>
                <UserX size={18} color="var(--color-gray-9)" />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  No {getManagerLabel(true).toLowerCase()} connections yet
                </Text>
              </Row>
            )}
          </Stack>
        </Card>

        {/* Brokers Card */}
        <Card style={cardStyle}>
          <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: 16 }}>
            <Stack gap={4}>
              <H3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-gray-12)' }}>
                Insurance Brokers
              </H3>
              <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                Your broker relationships
              </Text>
            </Stack>
            <Button
              size="sm"
              variant="outline"
              onPress={() => navigate('/subcontractor/broker')}
            >
              Manage
            </Button>
          </Row>

          <Stack gap={12}>
            <Row alignItems="center" justifyContent="space-between" style={{ padding: 12, backgroundColor: 'var(--color-green-2)', borderRadius: 8 }}>
              <Row alignItems="center" gap={8}>
                <UserCheck size={18} color="var(--color-green-10)" />
                <Text size="sm" weight="semibold">
                  Connected
                </Text>
              </Row>
              <Text size="lg" weight="bold" style={{ color: 'var(--color-green-10)' }}>
                {connectedBrokers.length}
              </Text>
            </Row>

            {pendingBrokerInvites.length > 0 && (
              <Row alignItems="center" justifyContent="space-between" style={{ padding: 12, backgroundColor: 'var(--color-yellow-2)', borderRadius: 8 }}>
                <Row alignItems="center" gap={8}>
                  <Clock size={18} color="var(--color-yellow-10)" />
                  <Text size="sm" weight="semibold">
                    Pending Invitations
                  </Text>
                </Row>
                <Text size="lg" weight="bold" style={{ color: 'var(--color-yellow-10)' }}>
                  {pendingBrokerInvites.length}
                </Text>
              </Row>
            )}

            {connectedBrokers.length === 0 && pendingBrokerInvites.length === 0 && (
              <Row alignItems="center" gap={8} style={{ padding: 12 }}>
                <UserX size={18} color="var(--color-gray-9)" />
                <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
                  No broker connections yet
                </Text>
              </Row>
            )}
          </Stack>
        </Card>
      </Grid>

      {/* Compliance Status Card */}
      <Card style={cardStyle}>
        <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: 16 }}>
          <Stack gap={4}>
            <H3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-gray-12)' }}>
              Compliance Status
            </H3>
            <Text size="sm" style={{ color: 'var(--color-gray-11)' }}>
              Your overall compliance health score
            </Text>
          </Stack>
          <ComplianceScore score={complianceScore} trend="up" size="lg" />
        </Row>

        <Grid columns={{ base: 1, sm: 2, lg: 3 }} gap={16}>
          <Stack
            alignItems="center"
            padding={16}
            style={{ backgroundColor: 'var(--color-green-2)', borderRadius: 8 }}
          >
            <CheckCircle color="var(--green10)" style={{ margin: '0 auto 8px' }} size={24} />
            <Text size="sm" weight="medium">
              All Current
            </Text>
            <Text size="sm" style={{ color: 'var(--color-green-10)' }}>
              {activePolicies} active policies
            </Text>
          </Stack>
          <Stack
            alignItems="center"
            padding={16}
            style={{ backgroundColor: expiringDocuments > 0 ? 'var(--color-yellow-2)' : 'var(--color-green-2)', borderRadius: 8 }}
          >
            <Clock color={expiringDocuments > 0 ? 'var(--yellow10)' : 'var(--green10)'} style={{ margin: '0 auto 8px' }} size={24} />
            <Text size="sm" weight="medium">
              {expiringDocuments > 0 ? `${expiringDocuments} Expiring Soon` : 'No Expiring'}
            </Text>
            <Text size="sm" style={{ color: expiringDocuments > 0 ? 'var(--color-yellow-10)' : 'var(--color-green-10)' }}>
              {expiringDocuments > 0 ? 'Renew within 30 days' : 'All policies current'}
            </Text>
          </Stack>
          <Stack
            alignItems="center"
            padding={16}
            style={{ backgroundColor: 'var(--color-blue-2)', borderRadius: 8 }}
          >
            <Shield color="var(--blue10)" style={{ margin: '0 auto 8px' }} size={24} />
            <Text size="sm" weight="medium">
              {complianceScore >= 80 ? 'Fully Compliant' : 'Needs Attention'}
            </Text>
            <Text size="sm" style={{ color: 'var(--color-blue-10)' }}>
              {complianceScore >= 80 ? 'Meeting all requirements' : 'Review required items'}
            </Text>
          </Stack>
        </Grid>
      </Card>

      {/* Tasks Section */}
      {tasks.length > 0 ? (
        <SubcontractorTasksPanel
          tasks={tasks}
          onCompleteTask={handleCompleteTask}
          onViewRequirements={handleViewRequirements}
          onContactBroker={handleContactBroker}
          onUploadDocument={handleUploadDocument}
          onRequestQuote={handleRequestQuote}
        />
      ) : (
        <Card style={cardStyle}>
          <Stack gap={16} alignItems="center" style={{ padding: 24 }}>
            <Briefcase size={48} color="var(--color-gray-9)" />
            <Stack gap={8} alignItems="center">
              <Text size="lg" weight="semibold" style={{ color: 'var(--color-gray-12)' }}>
                No Active Tasks
              </Text>
              <Text size="sm" style={{ color: 'var(--color-gray-11)', textAlign: 'center' }}>
                {`You haven't been assigned to any projects yet. Once a ${getManagerLabel().toLowerCase()} invites you to a project, you'll see your tasks and compliance requirements here.`}
              </Text>
              <Button
                variant="outline"
                onPress={() => navigate('/subcontractor/documents')}
                style={{ marginTop: 8 }}
              >
                View Documents
              </Button>
            </Stack>
          </Stack>
        </Card>
      )}

      {/* Quick Actions */}
      <Grid columns={{ base: 1, lg: 2 }} gap={16}>
        <Card style={cardStyle}>
          <Text size="sm" weight="medium" style={{ marginBottom: 16 }}>
            Quick Actions
          </Text>
          <Stack gap={12}>
            <ButtonComponent
              variant="ghost"
              fullWidth
              justifyContent="space-between"
              padding={16}
              style={{ backgroundColor: 'var(--color-blue-2)' }}
              hoverStyle={{ backgroundColor: 'var(--color-blue-3)' }}
              height="auto"
              onPress={() => navigate('/subcontractor/documents')}
            >
              <Row alignItems="center" gap={16}>
                <FileText color="var(--blue10)" size={20} />
                <Text weight="medium">Upload Documents</Text>
              </Row>
              <Text style={{ color: 'var(--color-blue-10)' }}>→</Text>
            </ButtonComponent>

            <ButtonComponent
              variant="ghost"
              fullWidth
              justifyContent="space-between"
              padding={16}
              style={{ backgroundColor: 'var(--color-green-2)' }}
              hoverStyle={{ backgroundColor: 'var(--color-green-3)' }}
              height="auto"
              onPress={() => navigate('/subcontractor/broker')}
            >
              <Row alignItems="center" gap={16}>
                <Shield color="var(--green10)" size={20} />
                <Text weight="medium">Manage Insurance</Text>
              </Row>
              <Text style={{ color: 'var(--color-green-10)' }}>→</Text>
            </ButtonComponent>

            <ButtonComponent
              variant="ghost"
              fullWidth
              justifyContent="space-between"
              padding={16}
              style={{ backgroundColor: 'var(--color-orange-2)' }}
              hoverStyle={{ backgroundColor: 'var(--color-orange-3)' }}
              height="auto"
              onPress={() => navigate('/subcontractor/projects')}
            >
              <Row alignItems="center" gap={16}>
                <Building color="var(--orange9)" size={20} />
                <Text weight="medium">View Projects</Text>
              </Row>
              <Text style={{ color: 'var(--color-orange-10)' }}>→</Text>
            </ButtonComponent>
          </Stack>
        </Card>

        <Card style={cardStyle}>
          <Text size="sm" weight="medium" style={{ marginBottom: 16 }}>
            Task Summary
          </Text>
          <Stack gap={12}>
            <Row alignItems="center" justifyContent="space-between" style={{ padding: 12 }}>
              <Row alignItems="center" gap={8}>
                <CheckCircle size={16} color="var(--color-green-10)" />
                <Text size="sm">Completed</Text>
              </Row>
              <Text size="sm" weight="semibold">
                {tasksCompleted}
              </Text>
            </Row>
            <Row alignItems="center" justifyContent="space-between" style={{ padding: 12 }}>
              <Row alignItems="center" gap={8}>
                <Clock size={16} color="var(--color-blue-10)" />
                <Text size="sm">In Progress</Text>
              </Row>
              <Text size="sm" weight="semibold">
                {tasksInProgress}
              </Text>
            </Row>
            {tasksOverdue > 0 && (
              <Row alignItems="center" justifyContent="space-between" style={{ padding: 12, backgroundColor: 'var(--color-red-2)', borderRadius: 8 }}>
                <Row alignItems="center" gap={8}>
                  <AlertTriangle size={16} color="var(--color-red-10)" />
                  <Text size="sm">Overdue</Text>
                </Row>
                <Text size="sm" weight="semibold" style={{ color: 'var(--color-red-10)' }}>
                  {tasksOverdue}
                </Text>
              </Row>
            )}
            <Row alignItems="center" justifyContent="space-between" style={{ padding: 12, borderTop: '1px solid var(--color-border)' }}>
              <Text size="sm" weight="medium">
                Total Tasks
              </Text>
              <Text size="sm" weight="bold">
                {tasks.length}
              </Text>
            </Row>
          </Stack>
        </Card>
      </Grid>

      {/* Modals */}
      <InsuranceRequirementsModal
        isOpen={requirementsModalOpen}
        onClose={() => {
          setRequirementsModalOpen(false)
          setSelectedTask(null)
        }}
        task={selectedTask}
      />

      {/* Contact Broker Modal */}
      <Modal
        isOpen={contactBrokerModalOpen}
        onClose={() => {
          setContactBrokerModalOpen(false)
          setSelectedTask(null)
        }}
        title="Contact Broker"
        size="medium"
      >
        {selectedTask &&
          (() => {
            const broker = getBrokerContact(selectedTask)
            if (!broker) {
              return (
                <Stack alignItems="center" style={{ paddingTop: 16, paddingBottom: 16 }}>
                  <Text>Broker contact information not available for this task.</Text>
                </Stack>
              )
            }
            return (
              <Stack gap={16}>
                <Stack
                  style={{ backgroundColor: 'var(--color-blue-2)', borderRadius: 8 }}
                  padding={16}
                  borderWidth={1}
                  borderColor="var(--color-blue-6)"
                >
                  <Text weight="medium" style={{ marginBottom: 16 }}>
                    {broker.name}
                  </Text>
                  <Stack gap={16}>
                    <Row
                      tag="a"
                      href={`mailto:${broker.email}`}
                      alignItems="center"
                      gap={16}
                      style={{ color: 'var(--color-blue-10)' }}
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
                        style={{ color: 'var(--color-blue-10)' }}
                      >
                        <Phone size={16} />
                        <Text>{broker.phone}</Text>
                      </Row>
                    )}
                  </Stack>
                </Stack>
                <Stack size="sm">
                  <Text style={{ marginBottom: 16 }}>
                    Task: <Text weight="medium">{selectedTask.title}</Text>
                  </Text>
                  {selectedTask.project_name && (
                    <Text>
                      Project: <Text weight="medium">{selectedTask.project_name}</Text>
                    </Text>
                  )}
                </Stack>
              </Stack>
            )
          })()}
      </Modal>

      {/* Upload Document Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => {
          setUploadModalOpen(false)
          setSelectedTask(null)
          setUploadedFile(null)
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        }}
        title="Upload Document"
        size="medium"
      >
        {selectedTask && (
          <Stack gap={16}>
            <Stack
              style={{ backgroundColor: 'var(--color-blue-2)', borderRadius: 8 }}
              padding={16}
              borderWidth={1}
              borderColor="var(--color-blue-6)"
            >
              <Text size="sm" weight="medium" style={{ marginBottom: 16 }}>
                {selectedTask.title}
              </Text>
              {selectedTask.description && <Text size="sm">{selectedTask.description}</Text>}
            </Stack>

            <Stack>
              <Text
                tag="label"
                display="block"
                size="sm"
                weight="medium"
                style={{ marginBottom: 16 }}
              >
                Select Document
              </Text>
              <Stack
                borderWidth={2}
                borderStyle="dashed"
                style={{ borderColor: 'var(--color-border)', borderRadius: 8 }}
                padding={16}
                alignItems="center"
              >
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
                  <Text size="sm">
                    {uploadedFile ? uploadedFile.name : 'Click to upload or drag and drop'}
                  </Text>
                  <Text size="sm">PDF, DOC, DOCX, PNG, JPG (Max 10MB)</Text>
                </Stack>
              </Stack>
            </Stack>

            {uploadedFile && (
              <Row
                alignItems="center"
                justifyContent="space-between"
                padding={16}
                style={{ backgroundColor: 'var(--color-green-2)', borderRadius: 8 }}
                borderWidth={1}
                borderColor="var(--color-green-6)"
              >
                <Row alignItems="center" gap={16}>
                  <FileText color="var(--green10)" size={16} />
                  <Text size="sm">{uploadedFile.name}</Text>
                </Row>
                <Row
                  tag="button"
                  onPress={() => {
                    setUploadedFile(null)
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ''
                    }
                  }}
                  style={{ color: 'var(--color-red-10)' }}
                  cursor="pointer"
                >
                  <X size={16} />
                </Row>
              </Row>
            )}

            <Row justifyContent="flex-end" gap={16} style={{ paddingTop: 16 }}>
              <ButtonComponent
                variant="ghost"
                onPress={() => {
                  setUploadModalOpen(false)
                  setSelectedTask(null)
                  setUploadedFile(null)
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
              >
                Cancel
              </ButtonComponent>
              <ButtonComponent onPress={handleUploadSubmit} disabled={!uploadedFile}>
                Upload Document
              </ButtonComponent>
            </Row>
          </Stack>
        )}
      </Modal>

      {/* Request Quote Modal */}
      <Modal
        isOpen={quoteModalOpen}
        onClose={() => {
          setQuoteModalOpen(false)
          setSelectedTask(null)
          setQuoteRequest({ message: '' })
        }}
        title="Request Quote"
        size="medium"
      >
        {selectedTask &&
          (() => {
            const quoteDetails = getQuoteDetails(selectedTask)
            return (
              <Stack gap={16}>
                <Stack
                  style={{ backgroundColor: 'var(--color-blue-2)', borderRadius: 8 }}
                  padding={16}
                  borderWidth={1}
                  borderColor="var(--color-blue-6)"
                >
                  <Text size="sm" weight="medium" style={{ marginBottom: 16 }}>
                    {selectedTask.title}
                  </Text>
                  {quoteDetails && (
                    <Stack gap={16} size="sm">
                      <Row justifyContent="space-between">
                        <Text>Current Limit:</Text>
                        <Text weight="medium">${(quoteDetails.current / 1000000).toFixed(1)}M</Text>
                      </Row>
                      <Row justifyContent="space-between">
                        <Text>Required Limit:</Text>
                        <Text weight="medium">
                          ${(quoteDetails.required / 1000000).toFixed(1)}M
                        </Text>
                      </Row>
                      <Row
                        justifyContent="space-between"
                        style={{ paddingTop: 16 }}
                        borderTopWidth={1}
                        borderTopColor="var(--color-blue-6)"
                      >
                        <Text>Gap Amount:</Text>
                        <Text weight="medium" style={{ color: 'var(--color-yellow-10)' }}>
                          ${(quoteDetails.gap / 1000000).toFixed(1)}M
                        </Text>
                      </Row>
                    </Stack>
                  )}
                </Stack>

                <Stack>
                  <Text
                    tag="label"
                    display="block"
                    size="sm"
                    weight="medium"
                    style={{ marginBottom: 16 }}
                  >
                    Additional Information (Optional)
                  </Text>
                  <Textarea
                    value={quoteRequest.message}
                    onChange={(e) => setQuoteRequest({ message: e.target.value })}
                    placeholder="Add any specific requirements or questions for your broker..."
                    rows={4}
                  />
                </Stack>

                <Row justifyContent="flex-end" gap={16} style={{ paddingTop: 16 }}>
                  <ButtonComponent
                    variant="ghost"
                    onPress={() => {
                      setQuoteModalOpen(false)
                      setSelectedTask(null)
                      setQuoteRequest({ message: '' })
                    }}
                  >
                    Cancel
                  </ButtonComponent>
                  <ButtonComponent onPress={handleQuoteSubmit}>Submit Request</ButtonComponent>
                </Row>
              </Stack>
            )
          })()}
      </Modal>
    </Stack>
  )
}
