import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building, Filter, Eye, Shield, Calendar } from 'lucide-react'
import { Stack, Row, Text, H1, H2, Card, Grid } from '@unicornlove/beyond-ui'
import { useProjects } from '../../hooks/useProjects'
import { useClients } from '../../hooks/useClients'
import ProjectCard from '../Shared/ProjectCard'
import { DashboardSkeleton } from '../Common/SkeletonLoader'

export default function BrokerProjectsPage() {
  const navigate = useNavigate()
  const { projects, loading: projectsLoading } = useProjects()
  const { clients, loading: clientsLoading } = useClients()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [clientFilter, setClientFilter] = useState<string>('all')
  const [complianceFilter, setComplianceFilter] = useState<string>('all')

  const filteredProjects = projects.filter((project) => {
    if (statusFilter !== 'all' && project.status !== statusFilter) return false
    if (clientFilter !== 'all' && project.client_id !== clientFilter) return false
    if (complianceFilter !== 'all' && project.compliance_status !== complianceFilter) return false
    return true
  })

  const getClientName = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId)
    return client?.company_name || 'Client'
  }

  const getProjectStats = () => {
    return {
      total: projects.length,
      active: projects.filter((p) => p.status === 'active').length,
      compliant: projects.filter((p) => p.compliance_status === 'compliant').length,
      needsAttention: projects.filter(
        (p) => p.compliance_status === 'critical' || p.compliance_status === 'warning'
      ).length,
    }
  }

  const stats = getProjectStats()

  if (projectsLoading || clientsLoading) {
    return <DashboardSkeleton />
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-background)',
    borderRadius: 12,
    padding: 24,
    border: '1px solid var(--color-border)',
  }

  const iconBoxStyle = (color: string): React.CSSProperties => ({
    backgroundColor: `var(--color-${color}-3)`,
    padding: 12,
    borderRadius: 8,
  })

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 16px',
    border: '1px solid var(--color-border)',
    borderRadius: 8,
    fontSize: 14,
    backgroundColor: 'var(--color-background)',
    color: 'var(--color-text)',
  }

  return (
    <Stack gap={24}>
      <Stack>
        <H1 style={{ fontSize: 24, fontWeight: 'bold' }}>Projects</H1>
        <Text muted>Manage all client projects and monitor compliance</Text>
      </Stack>

      <Grid columns={{ base: 1, sm: 2, lg: 4 }} gap={24}>
        <Card style={cardStyle}>
          <Row alignItems="center" justifyContent="space-between">
            <Stack>
              <Text size="sm" muted>
                Total Projects
              </Text>
              <Text size="2xl" weight="bold" style={{ marginTop: 4 }}>
                {stats.total}
              </Text>
            </Stack>
            <div style={iconBoxStyle('blue')}>
              <Building color="var(--color-blue-10)" size={24} />
            </div>
          </Row>
        </Card>

        <Card style={cardStyle}>
          <Row alignItems="center" justifyContent="space-between">
            <Stack>
              <Text size="sm" muted>
                Active Projects
              </Text>
              <Text
                size="2xl"
                weight="bold"
                style={{ color: 'var(--color-blue-10)', marginTop: 4 }}
              >
                {stats.active}
              </Text>
            </Stack>
            <div style={iconBoxStyle('blue')}>
              <Eye color="var(--color-blue-10)" size={24} />
            </div>
          </Row>
        </Card>

        <Card style={cardStyle}>
          <Row alignItems="center" justifyContent="space-between">
            <Stack>
              <Text size="sm" muted>
                Compliant
              </Text>
              <Text
                size="2xl"
                weight="bold"
                style={{ color: 'var(--color-green-10)', marginTop: 4 }}
              >
                {stats.compliant}
              </Text>
            </Stack>
            <div style={iconBoxStyle('green')}>
              <Shield color="var(--color-green-10)" size={24} />
            </div>
          </Row>
        </Card>

        <Card style={cardStyle}>
          <Row alignItems="center" justifyContent="space-between">
            <Stack>
              <Text size="sm" muted>
                Needs Attention
              </Text>
              <Text
                size="2xl"
                weight="bold"
                style={{ color: 'var(--color-yellow-10)', marginTop: 4 }}
              >
                {stats.needsAttention}
              </Text>
            </Stack>
            <div style={iconBoxStyle('yellow')}>
              <Calendar color="var(--color-yellow-10)" size={24} />
            </div>
          </Row>
        </Card>
      </Grid>

      <Card
        style={{
          backgroundColor: 'var(--color-background)',
          borderRadius: 12,
          border: '1px solid var(--color-border)',
          padding: 24,
        }}
      >
        <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: 24 }}>
          <Row alignItems="center" gap={8}>
            <Filter size={20} color="var(--color-text-muted)" />
            <H2 style={{ fontSize: 18, fontWeight: 600 }}>Filter Projects</H2>
          </Row>
          <button
            onClick={() => {
              setStatusFilter('all')
              setClientFilter('all')
              setComplianceFilter('all')
            }}
            style={{
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 8,
              paddingBottom: 8,
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--color-text-muted)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              backgroundColor: 'transparent',
              cursor: 'pointer',
            }}
          >
            Clear Filters
          </button>
        </Row>

        <Grid columns={{ base: 1, sm: 3 }} gap={16}>
          <Stack>
            <Text size="sm" weight="medium" muted style={{ marginBottom: 8 }}>
              Status
            </Text>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={selectStyle}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </Stack>

          <Stack>
            <Text size="sm" weight="medium" muted style={{ marginBottom: 8 }}>
              Client
            </Text>
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              style={selectStyle}
            >
              <option value="all">All Clients</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.company_name}
                </option>
              ))}
            </select>
          </Stack>

          <Stack>
            <Text size="sm" weight="medium" muted style={{ marginBottom: 8 }}>
              Compliance
            </Text>
            <select
              value={complianceFilter}
              onChange={(e) => setComplianceFilter(e.target.value)}
              style={selectStyle}
            >
              <option value="all">All Compliance Levels</option>
              <option value="compliant">Compliant</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </Stack>
        </Grid>
      </Card>

      <Grid columns={{ base: 1, md: 2 }} gap={24}>
        {filteredProjects.map((project) => (
          <Stack key={project.id} style={{ position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                top: 16,
                left: 16,
                zIndex: 10,
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  backgroundColor: 'var(--color-background)',
                  paddingLeft: 12,
                  paddingRight: 12,
                  paddingTop: 4,
                  paddingBottom: 4,
                  borderRadius: 9999,
                  border: '1px solid var(--color-border)',
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--color-text-muted)',
                }}
              >
                {getClientName(project.client_id)}
              </span>
            </div>
            <div style={{ paddingTop: 32 }}>
              <ProjectCard
                project={project}
                userRole="broker"
                showActions={false}
                onClick={() => navigate(`/broker/projects/${project.id}`)}
              />
            </div>
          </Stack>
        ))}
      </Grid>

      {filteredProjects.length === 0 && (
        <Card
          style={{
            backgroundColor: 'var(--color-background)',
            borderRadius: 12,
            border: '1px solid var(--color-border)',
            padding: 48,
          }}
        >
          <Stack alignItems="center">
            <Building color="var(--color-text-muted)" size={48} style={{ marginBottom: 16 }} />
            <Text weight="medium" style={{ marginBottom: 8 }}>
              No projects found
            </Text>
            <Text size="sm" muted>
              Try adjusting your filters
            </Text>
          </Stack>
        </Card>
      )}
    </Stack>
  )
}
