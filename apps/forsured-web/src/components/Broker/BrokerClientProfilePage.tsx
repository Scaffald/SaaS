import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Building,
  Mail,
  Phone,
  MapPin,
  Shield,
  AlertTriangle,
  CheckCircle,
  FileText,
  TrendingUp,
  Users,
  Calendar,
  Upload,
  Download,
  Trash2,
  Loader2,
} from 'lucide-react'
import { Stack, Row, Text, H1, H3, Card, Grid, Chip, CardHeader, CardContent, ButtonGroup } from '@scaffald/ui'
import { Tabs as TabsCustom } from '../../ui/Tabs'
import { useClients } from '../../hooks/useClients'
import { usePolicies } from '../../hooks/usePolicies'
import { useProjects } from '../../hooks/useProjects'
import { useClientDocuments } from '../../hooks/useClientDocuments'
import { useAuth } from '../../contexts/AuthContext'
import Button from '../Common/Button'
import { DashboardSkeleton } from '../Common/SkeletonLoader'

export default function BrokerClientProfilePage() {
  const { clientId } = useParams<{ clientId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { clients, loading: clientsLoading } = useClients()
  const { policies, loading: policiesLoading } = usePolicies()
  const { projects, loading: projectsLoading } = useProjects()
  const {
    documents,
    loading: documentsLoading,
    uploading,
    uploadDocument,
    deleteDocument,
  } = useClientDocuments({ clientId: clientId || '' })

  // File upload state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadCategory, setUploadCategory] = useState<
    'compliance' | 'insurance' | 'contract' | 'general'
  >('general')
  const [isDragging, setIsDragging] = useState(false)

  const client = clients.find((c) => c.id === clientId)
  const clientPolicies = policies.filter((p) => p.client_id === clientId)
  const clientProjects = projects.filter((p) => p.client_id === clientId)

  const validTabs = ['overview', 'compliance', 'policies', 'projects', 'documents']
  const tabFromUrl = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState<string>(
    tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : 'overview'
  )

  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    setSearchParams({ tab: tabId })
  }

  const isLoading = clientsLoading || policiesLoading || projectsLoading

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (!client) {
    return (
      <Stack gap={24} style={{ width: '100%' }}>
        <Row alignItems="center" gap={8} onPress={() => navigate(-1)} style={{ cursor: 'pointer' }}>
          <ArrowLeft size={20} color="var(--color-text-muted)" />
          <Text muted>Back</Text>
        </Row>
        <Card
          variant="outlined"
          padding="xl"
          radius="lg"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <AlertTriangle color="var(--color-red-10)" size={64} style={{ marginBottom: 16 }} />
          <H3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Client Not Found</H3>
          <Text muted>The client you're looking for doesn't exist or has been deleted.</Text>
        </Card>
      </Stack>
    )
  }

  const getRiskBadge = (risk: string): React.CSSProperties => {
    const styles: Record<string, React.CSSProperties> = {
      low: {
        backgroundColor: 'var(--color-green-2)',
        color: 'var(--color-green-11)',
        borderColor: 'var(--color-green-6)',
      },
      medium: {
        backgroundColor: 'var(--color-yellow-2)',
        color: 'var(--color-yellow-11)',
        borderColor: 'var(--color-yellow-6)',
      },
      high: {
        backgroundColor: 'var(--color-red-2)',
        color: 'var(--color-red-11)',
        borderColor: 'var(--color-red-6)',
      },
    }
    return styles[risk] || styles.medium
  }

  const getComplianceColor = (score: number): string => {
    if (score >= 90) return 'var(--color-green-10)'
    if (score >= 70) return 'var(--color-yellow-10)'
    return 'var(--color-red-10)'
  }

  const getComplianceBg = (score: number): string => {
    if (score >= 90) return 'var(--color-green-9)'
    if (score >= 70) return 'var(--color-yellow-9)'
    return 'var(--color-red-9)'
  }


  const getStatusStyle = (status: string): React.CSSProperties => {
    switch (status) {
      case 'active':
        return { backgroundColor: 'var(--color-green-2)', color: 'var(--color-green-11)' }
      case 'expiring':
        return { backgroundColor: 'var(--color-yellow-2)', color: 'var(--color-yellow-11)' }
      case 'completed':
        return { backgroundColor: 'var(--color-gray-2)', color: 'var(--color-gray-11)' }
      default:
        return { backgroundColor: 'var(--color-red-2)', color: 'var(--color-red-11)' }
    }
  }

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Building,
      content: (
        <Stack gap={24} style={{ width: '100%' }}>
          <Grid columns={{ base: 1, sm: 2, lg: 4 }} gap={16}>
            <Card variant="elevated" padding="md" radius="lg" elevation="sm">
              <Row alignItems="center" gap={8} style={{ marginBottom: 8 }}>
                <Shield color="var(--color-text-muted)" size={18} />
                <Text size="sm" weight="medium" muted>
                  Compliance Score
                </Text>
              </Row>
              <Text
                size="2xl"
                weight="bold"
                style={{ color: getComplianceColor(client.compliance_score) }}
              >
                {client.compliance_score}%
              </Text>
            </Card>
            <Card variant="elevated" padding="md" radius="lg" elevation="sm">
              <Row alignItems="center" gap={8} style={{ marginBottom: 8 }}>
                <FileText color="var(--color-text-muted)" size={18} />
                <Text size="sm" weight="medium" muted>
                  Active Policies
                </Text>
              </Row>
              <Text size="2xl" weight="bold">
                {clientPolicies.filter((p) => p.status === 'active').length}
              </Text>
            </Card>
            <Card variant="elevated" padding="md" radius="lg" elevation="sm">
              <Row alignItems="center" gap={8} style={{ marginBottom: 8 }}>
                <Building color="var(--color-text-muted)" size={18} />
                <Text size="sm" weight="medium" muted>
                  Active Projects
                </Text>
              </Row>
              <Text size="2xl" weight="bold">
                {clientProjects.filter((p) => p.status === 'active').length}
              </Text>
            </Card>
            <Card variant="elevated" padding="md" radius="lg" elevation="sm">
              <Row alignItems="center" gap={8} style={{ marginBottom: 8 }}>
                <TrendingUp color="var(--color-text-muted)" size={18} />
                <Text size="sm" weight="medium" muted>
                  Risk Level
                </Text>
              </Row>
              <Chip
                size="sm"
                style={{
                  backgroundColor: getRiskBadge(client.risk_level).backgroundColor,
                  borderColor: getRiskBadge(client.risk_level).borderColor,
                  borderWidth: 1,
                }}
                textStyle={{
                  color: getRiskBadge(client.risk_level).color,
                }}
              >
                {client.risk_level.charAt(0).toUpperCase() + client.risk_level.slice(1)}
              </Chip>
            </Card>
          </Grid>

          <Card variant="outlined" padding="lg" radius="lg">
            <CardHeader>
              <H3 style={{ fontSize: 18, fontWeight: 600 }}>Contact Information</H3>
            </CardHeader>
            <CardContent>
            <Grid columns={{ base: 1, sm: 2 }} gap={16}>
              {client.primary_contact && (
                <Row alignItems="center" gap={12}>
                  <Users color="var(--color-text-muted)" size={18} />
                  <Stack>
                    <Text size="sm" muted>
                      Primary Contact
                    </Text>
                    <Text weight="medium">{client.primary_contact}</Text>
                  </Stack>
                </Row>
              )}
              {client.email && (
                <Row alignItems="center" gap={12}>
                  <Mail color="var(--color-text-muted)" size={18} />
                  <Stack>
                    <Text size="sm" muted>
                      Email
                    </Text>
                    <Text weight="medium">{client.email}</Text>
                  </Stack>
                </Row>
              )}
              {client.phone && (
                <Row alignItems="center" gap={12}>
                  <Phone color="var(--color-text-muted)" size={18} />
                  <Stack>
                    <Text size="sm" muted>
                      Phone
                    </Text>
                    <Text weight="medium">{client.phone}</Text>
                  </Stack>
                </Row>
              )}
              {client.address && (
                <Row alignItems="center" gap={12}>
                  <MapPin color="var(--color-text-muted)" size={18} />
                  <Stack>
                    <Text size="sm" muted>
                      Address
                    </Text>
                    <Text weight="medium">{client.address}</Text>
                  </Stack>
                </Row>
              )}
            </Grid>
            </CardContent>
          </Card>

          {client.notes && (
            <Card variant="outlined" padding="lg" radius="lg">
              <CardHeader>
                <H3 style={{ fontSize: 18, fontWeight: 600 }}>Notes</H3>
              </CardHeader>
              <CardContent>
                <Text muted>{client.notes}</Text>
              </CardContent>
            </Card>
          )}
        </Stack>
      ),
    },
    {
      id: 'compliance',
      label: 'Compliance',
      icon: Shield,
      content: (
        <Stack gap={24} style={{ width: '100%' }}>
          <Card variant="outlined" padding="lg" radius="lg">
            <CardHeader>
              <H3 style={{ fontSize: 18, fontWeight: 600 }}>Compliance Overview</H3>
            </CardHeader>
            <CardContent>
            <Row alignItems="center" gap={16} style={{ marginBottom: 24 }}>
              <Stack style={{ width: 128, height: 128, position: 'relative' }}>
                <Stack
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    size="3xl"
                    weight="bold"
                    style={{ color: getComplianceColor(client.compliance_score) }}
                  >
                    {client.compliance_score}%
                  </Text>
                </Stack>
                <svg width={128} height={128} style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="64" cy="64" r="56" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke={getComplianceBg(client.compliance_score)}
                    strokeWidth="12"
                    strokeDasharray={`${(client.compliance_score / 100) * 352} 352`}
                    strokeLinecap="round"
                  />
                </svg>
              </Stack>
              <Stack style={{ flex: 1 }}>
                <Text muted style={{ marginBottom: 8 }}>
                  {client.compliance_score >= 90
                    ? 'Excellent compliance status. All requirements are being met.'
                    : client.compliance_score >= 70
                      ? 'Good compliance status with some areas needing attention.'
                      : 'Compliance issues detected. Immediate action required.'}
                </Text>
                <Row alignItems="center" gap={16}>
                  <Row alignItems="center" gap={4}>
                    <CheckCircle color="var(--color-green-10)" size={16} />
                    <Text size="sm" muted>
                      {clientPolicies.filter((p) => p.status === 'active').length} Active Policies
                    </Text>
                  </Row>
                  <Row alignItems="center" gap={4}>
                    <AlertTriangle color="var(--color-yellow-10)" size={16} />
                    <Text size="sm" muted>
                      {clientPolicies.filter((p) => p.status === 'expiring').length} Expiring Soon
                    </Text>
                  </Row>
                </Row>
              </Stack>
            </Row>
            </CardContent>
          </Card>

          <Card variant="outlined" padding="lg" radius="lg">
            <CardHeader>
              <H3 style={{ fontSize: 18, fontWeight: 600 }}>Coverage Status</H3>
            </CardHeader>
            <CardContent>
            <Stack gap={16}>
              {clientPolicies.length > 0 ? (
                clientPolicies.map((policy) => {
                  const statusStyle = getStatusStyle(policy.status)
                  return (
                    <Card
                      key={policy.id}
                      variant="elevated"
                      padding="md"
                      radius="lg"
                      elevation="sm"
                    >
                      <Row alignItems="center" justifyContent="space-between">
                        <Stack>
                          <Text weight="medium">{policy.policy_type}</Text>
                          <Text size="sm" muted>
                            {policy.carrier} - {policy.policy_number}
                          </Text>
                        </Stack>
                        <Chip
                          size="sm"
                          style={{
                            backgroundColor: statusStyle.backgroundColor,
                          }}
                          textStyle={{
                            color: statusStyle.color,
                          }}
                        >
                          {policy.status}
                        </Chip>
                      </Row>
                    </Card>
                  )
                })
              ) : (
                <Text muted style={{ textAlign: 'center', padding: '16px 0' }}>
                  No policies found for this client.
                </Text>
              )}
            </Stack>
            </CardContent>
          </Card>
        </Stack>
      ),
    },
    {
      id: 'policies',
      label: 'Policies',
      icon: FileText,
      badge: clientPolicies.length,
      content: (
        <Stack gap={16} style={{ width: '100%' }}>
          {clientPolicies.length > 0 ? (
            clientPolicies.map((policy) => {
              const statusStyle = getStatusStyle(policy.status)
              return (
                <Card
                  key={policy.id}
                  variant="outlined"
                  padding="lg"
                  radius="lg"
                  pressable
                  onPress={() => navigate(`/broker/policies/${policy.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <Row
                    alignItems="flex-start"
                    justifyContent="space-between"
                    style={{ marginBottom: 16 }}
                  >
                    <Stack>
                      <Text size="md" weight="semibold">
                        {policy.policy_type}
                      </Text>
                      <Text size="sm" muted>
                        {policy.carrier}
                      </Text>
                    </Stack>
                    <Chip
                      size="sm"
                      style={{
                        backgroundColor: statusStyle.backgroundColor,
                      }}
                      textStyle={{
                        color: statusStyle.color,
                      }}
                    >
                      {policy.status}
                    </Chip>
                  </Row>
                  <Grid columns={{ base: 1, sm: 2, lg: 4 }} gap={16}>
                    <Stack>
                      <Text size="sm" muted>
                        Policy Number
                      </Text>
                      <Text weight="medium">{policy.policy_number}</Text>
                    </Stack>
                    <Stack>
                      <Text size="sm" muted>
                        Coverage Limit
                      </Text>
                      <Text weight="medium">${(policy.coverage_limit / 1000000).toFixed(1)}M</Text>
                    </Stack>
                    <Stack>
                      <Text size="sm" muted>
                        Start Date
                      </Text>
                      <Text weight="medium">
                        {new Date(policy.start_date).toLocaleDateString()}
                      </Text>
                    </Stack>
                    <Stack>
                      <Text size="sm" muted>
                        End Date
                      </Text>
                      <Text weight="medium">{new Date(policy.end_date).toLocaleDateString()}</Text>
                    </Stack>
                  </Grid>
                </Card>
              )
            })
          ) : (
            <Card
              variant="outlined"
              padding="xl"
              radius="lg"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <FileText color="var(--color-text-muted)" size={48} style={{ marginBottom: 16 }} />
              <H3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No Policies Found</H3>
              <Text muted>This client doesn't have any policies on record.</Text>
            </Card>
          )}
        </Stack>
      ),
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: Building,
      badge: clientProjects.length,
      content: (
        <Stack gap={16} style={{ width: '100%' }}>
          {clientProjects.length > 0 ? (
            clientProjects.map((project) => {
              const statusStyle = getStatusStyle(project.status)
              return (
                <Card
                  key={project.id}
                  variant="outlined"
                  padding="lg"
                  radius="lg"
                  pressable
                  onPress={() => navigate(`/broker/projects/${project.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <Row
                    alignItems="flex-start"
                    justifyContent="space-between"
                    style={{ marginBottom: 16 }}
                  >
                    <Stack>
                      <Text size="md" weight="semibold">
                        {project.name}
                      </Text>
                      {project.location && (
                        <Row alignItems="center" gap={4} style={{ marginTop: 4 }}>
                          <MapPin size={14} color="var(--color-text-muted)" />
                          <Text size="sm" muted>
                            {project.location}
                          </Text>
                        </Row>
                      )}
                    </Stack>
                    <Chip
                      size="sm"
                      style={{
                        backgroundColor: statusStyle.backgroundColor,
                      }}
                      textStyle={{
                        color: statusStyle.color,
                      }}
                    >
                      {project.status}
                    </Chip>
                  </Row>
                  <Row alignItems="center" gap={24}>
                    <Row alignItems="center" gap={4}>
                      <Calendar size={14} color="var(--color-text-muted)" />
                      <Text size="sm" muted>
                        {new Date(project.start_date).toLocaleDateString()} -{' '}
                        {new Date(project.end_date).toLocaleDateString()}
                      </Text>
                    </Row>
                    <Row alignItems="center" gap={4}>
                      <Shield size={14} color="var(--color-text-muted)" />
                      <Text size="sm" muted>
                        {project.compliance_status}
                      </Text>
                    </Row>
                  </Row>
                </Card>
              )
            })
          ) : (
            <Card
              variant="outlined"
              padding="xl"
              radius="lg"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Building color="var(--color-text-muted)" size={48} style={{ marginBottom: 16 }} />
              <H3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No Projects Found</H3>
              <Text muted>This client doesn't have any projects on record.</Text>
            </Card>
          )}
        </Stack>
      ),
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: FileText,
      badge: documents.length || undefined,
      content: (
        <Stack gap={24} style={{ width: '100%' }}>
          {/* Upload Section */}
          <Card variant="outlined" padding="lg" radius="lg">
            <CardHeader>
              <H3 style={{ fontSize: 18, fontWeight: 600 }}>Upload Documents</H3>
            </CardHeader>
            <CardContent>
            {/* Category Selection */}
            <ButtonGroup
              items={(['compliance', 'insurance', 'contract', 'general'] as const).map((cat) => ({
                id: cat,
                label: cat.charAt(0).toUpperCase() + cat.slice(1),
              }))}
              mode="single"
              value={uploadCategory}
              onChange={(value) => setUploadCategory(value as typeof uploadCategory)}
              size="sm"
              style={{ marginBottom: 16 }}
            />

            {/* Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                setIsDragging(false)
              }}
              onDrop={async (e) => {
                e.preventDefault()
                setIsDragging(false)
                const files = e.dataTransfer.files
                if (files.length > 0 && user?.id) {
                  try {
                    await uploadDocument(files[0], user.id, uploadCategory)
                  } catch (err) {
                    // Error already handled in hook
                  }
                }
              }}
              style={{
                border: `2px dashed ${isDragging ? 'var(--color-orange-9)' : 'var(--color-border)'}`,
                borderRadius: 12,
                padding: 32,
                textAlign: 'center',
                backgroundColor: isDragging ? 'var(--color-orange-2)' : 'var(--color-gray-1)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (file && user?.id) {
                    try {
                      await uploadDocument(file, user.id, uploadCategory)
                    } catch (err) {
                      // Error already handled in hook
                    }
                  }
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
              />
              {uploading ? (
                <Row alignItems="center" justifyContent="center" gap={8}>
                  <Loader2
                    size={24}
                    className="animate-spin"
                    style={{ color: 'var(--color-orange-9)' }}
                  />
                  <Text>Uploading...</Text>
                </Row>
              ) : (
                <Stack alignItems="center" gap={8}>
                  <Upload size={32} style={{ color: 'var(--color-text-muted)' }} />
                  <Text weight="medium">Drop PDF files here or click to browse</Text>
                  <Text size="sm" muted>
                    Maximum file size: 10MB
                  </Text>
                </Stack>
              )}
            </div>
            </CardContent>
          </Card>

          {/* Documents Table */}
          <Card variant="outlined" padding="lg" radius="lg">
            <CardHeader>
              <H3 style={{ fontSize: 18, fontWeight: 600 }}>
                Client Documents ({documents.length})
              </H3>
            </CardHeader>
            <CardContent>

            {documentsLoading ? (
              <Row alignItems="center" justifyContent="center" style={{ padding: 48 }}>
                <Loader2
                  size={32}
                  className="animate-spin"
                  style={{ color: 'var(--color-orange-9)' }}
                />
              </Row>
            ) : documents.length > 0 ? (
              <Stack gap={8}>
                {documents.map((doc) => (
                    <Card
                      key={doc.id}
                      variant="elevated"
                      padding="md"
                      radius="md"
                      elevation="sm"
                    >
                    <Row alignItems="center" justifyContent="space-between">
                      <Row alignItems="center" gap={12} style={{ flex: 1 }}>
                        <FileText size={20} style={{ color: 'var(--color-text-muted)' }} />
                        <Stack style={{ flex: 1 }}>
                          <Text weight="medium" style={{ wordBreak: 'break-word' }}>
                            {doc.file_name}
                          </Text>
                          <Row gap={12} style={{ marginTop: 4 }}>
                            <Text size="xs" muted>
                              {(doc.file_size / 1024).toFixed(1)} KB
                            </Text>
                            <Text size="xs" muted>
                              {new Date(doc.uploaded_at).toLocaleDateString()}
                            </Text>
                            <Chip
                              size="sm"
                              style={{
                                backgroundColor: 'var(--color-blue-2)',
                              }}
                              textStyle={{
                                color: 'var(--color-blue-11)',
                                fontSize: 11,
                              }}
                            >
                              {doc.category}
                            </Chip>
                          </Row>
                        </Stack>
                      </Row>
                      <Row gap={8}>
                        <Button
                          variant="text"
                          color="gray"
                          size="sm"
                          iconOnly
                          onPress={() => window.open(doc.file_url, '_blank')}
                          iconStart={Download}
                          accessibilityLabel="Download"
                        />
                        <Button
                          variant="text"
                          color="error"
                          size="sm"
                          iconOnly
                          onPress={() => {
                            if (window.confirm('Are you sure you want to delete this document?')) {
                              deleteDocument(doc.id)
                            }
                          }}
                          iconStart={Trash2}
                          accessibilityLabel="Delete"
                        />
                      </Row>
                    </Row>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Stack alignItems="center" style={{ padding: 48 }}>
                <FileText
                  size={48}
                  style={{ color: 'var(--color-text-muted)', marginBottom: 16 }}
                />
                <Text weight="medium" style={{ marginBottom: 4 }}>
                  No Documents
                </Text>
                <Text size="sm" muted>
                  Upload documents using the form above
                </Text>
              </Stack>
            )}
            </CardContent>
          </Card>
        </Stack>
      ),
    },
  ]

  return (
    <Stack gap={24} style={{ width: '100%' }}>
      <Row alignItems="center" justifyContent="space-between">
        <Row alignItems="center" gap={16}>
          <Button
            variant="text"
            color="gray"
            onPress={() => navigate('/broker/clients')}
            iconStart={ArrowLeft}
            size="sm"
          >
            Back to Clients
          </Button>
          <Stack>
            <H1 style={{ fontSize: 28, fontWeight: 'bold' }}>{client.company_name}</H1>
            <Row alignItems="center" gap={12} style={{ marginTop: 4 }}>
              <Chip
                size="sm"
                style={{
                  backgroundColor:
                    client.client_type === 'subcontractor'
                      ? 'var(--color-blue-2)'
                      : 'var(--color-purple-2)',
                }}
                textStyle={{
                  color:
                    client.client_type === 'subcontractor'
                      ? 'var(--color-blue-11)'
                      : 'var(--color-purple-11)',
                }}
              >
                {client.client_type === 'subcontractor' ? 'Subcontractor' : 'General Contractor'}
              </Chip>
              <Chip
                size="sm"
                style={{
                  backgroundColor: getRiskBadge(client.risk_level).backgroundColor,
                  borderColor: getRiskBadge(client.risk_level).borderColor,
                  borderWidth: 1,
                }}
                textStyle={{
                  color: getRiskBadge(client.risk_level).color,
                }}
              >
                {client.risk_level} risk
              </Chip>
            </Row>
          </Stack>
        </Row>
        <Row alignItems="center" gap={12}>
          <Button
            variant="outline"
            color="gray"
            onPress={() => {
              // TODO: Implement edit client functionality
              console.log('Edit client:', clientId)
            }}
          >
            Edit Client
          </Button>
          <Button
            variant="filled"
            color="primary"
            onPress={() => {
              // TODO: Implement add policy functionality
              console.log('Add policy for client:', clientId)
            }}
          >
            Add Policy
          </Button>
        </Row>
      </Row>

      <TabsCustom tabs={tabs} variant="enclosed" activeTab={activeTab} onChange={handleTabChange} />
    </Stack>
  )
}
