import { RouteBuilder } from '@scf/core/constants/routes'
import { useProject } from '@scf/core/utils/projects-sdk-hooks'
import { CheckCircle, Clock, Eye, EyeOff, Plus, XCircle } from 'lucide-react-native'
import { useLocalSearchParams } from 'expo-router'
import { Button, Card, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'

export default function ProjectDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>()

  const { data, isLoading } = useProject(id as string, { enabled: !!id })

  if (!id) {
    return (
      <Stack padding={16} gap={16}>
        <Text>
          Project Not Found
        </Text>
        <Text>Project ID is required</Text>
      </Stack>
    )
  }

  if (isLoading) {
    return (
      <Stack padding={16} gap={16} align="center" justify="center">
        <Text>
          Loading Project...
        </Text>
        <Spinner />
      </Stack>
    )
  }

  if (!data) {
    return (
      <Stack padding={16} gap={16}>
        <Text>
          Project Not Found
        </Text>
        <Text>Project not found</Text>
      </Stack>
    )
  }

  const project = data
  const sites = project.project_sites || []
  const addresses = project.project_addresses || []
  const workers = project.project_workers || []

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public':
      case 'authenticated':
        return Eye
      default:
        return EyeOff
    }
  }

  const getVisibilityLabel = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return 'Public'
      case 'authenticated':
        return 'Authenticated'
      case 'organization_only':
        return 'Organization Only'
      case 'private':
        return 'Private'
      default:
        return 'Unknown'
    }
  }

  const getWorkerStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return CheckCircle
      case 'pending':
        return Clock
      case 'rejected':
        return XCircle
      default:
        return Clock
    }
  }

  const getWorkerStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '$green10'
      case 'pending':
        return '$yellow10'
      case 'rejected':
        return '$red10'
      default:
        return '$gray10'
    }
  }

  return (
    <Stack padding={16} gap={16}>
      <Stack gap={8}>
        <Text>
          {project.name}
        </Text>
        {project.description && (
          <Text color="$gray11">
            {project.description}
          </Text>
        )}
      </Stack>
      <Stack gap={16}>
        {/* Project Info */}
        <Card padding="md">
          <Stack gap={16}>
            <Row justify="space-between" align="center">
              <Text>
                {project.name}
              </Text>
              <Button
                onPress={() => {
                  // Navigate to edit page
                  window.location.href = RouteBuilder.projectEdit(project.id)
                }}
              >Edit</Button>
            </Row>

            {project.description && <Text>{project.description}</Text>}

            <Row gap={16}>
              <Stack gap={4}>
                <Text color="$gray10">
                  Status
                </Text>
                <Text>
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </Text>
              </Stack>

              {project.start_date && (
                <Stack gap={4}>
                  <Text color="$gray10">
                    Start Date
                  </Text>
                  <Text>{project.start_date}</Text>
                </Stack>
              )}

              {project.end_date && (
                <Stack gap={4}>
                  <Text color="$gray10">
                    End Date
                  </Text>
                  <Text>{project.end_date}</Text>
                </Stack>
              )}

              <Stack gap={4}>
                <Text color="$gray10">
                  Location Visibility
                </Text>
                <Row gap={8} align="center">
                  {getVisibilityIcon(project.location_visibility)({ size: 16 })}
                  <Text>{getVisibilityLabel(project.location_visibility)}</Text>
                  {project.location_visibility_override && (
                    <Text color="$yellow10">
                      (Override)
                    </Text>
                  )}
                </Row>
              </Stack>
            </Row>
          </Stack>
        </Card>

        {/* Location Section */}
        <Card padding="md">
          <Stack gap={16}>
            <Row justify="space-between" align="center">
              <Text>
                Location
              </Text>
              <Button size="md" iconStart={Plus}>
                Add Site
              </Button>
            </Row>

            {sites.length === 0 && addresses.length === 0 ? (
              <Text color="$gray10">No location data added yet</Text>
            ) : (
              <Stack gap={16}>
                {sites.length > 0 && (
                  <Stack gap={8}>
                    <Text>Site Boundaries</Text>
                    {sites.map((ps: (typeof sites)[0]) => (
                      <Card key={ps.id} padding={8}>
                        <Text>
                          {ps.site?.site_identifier || `Site ${ps.site?.id?.slice(0, 8)}`}
                        </Text>
                        {ps.site?.area_sqft && (
                          <Text color="$gray10">
                            Area: {ps.site.area_sqft.toLocaleString()} sq ft
                          </Text>
                        )}
                      </Card>
                    ))}
                  </Stack>
                )}

                {addresses.length > 0 && (
                  <Stack gap={8}>
                    <Text>Property Addresses</Text>
                    {addresses.map((pa: (typeof addresses)[0]) => (
                      <Card key={pa.id} padding={8}>
                        <Text>
                          {pa.address?.address?.street || ''}
                          {pa.address?.address?.city && `, ${pa.address.address.city}`}
                          {pa.address?.address?.state && `, ${pa.address.address.state}`}
                          {pa.address?.address?.zip && ` ${pa.address.address.zip}`}
                        </Text>
                        {pa.address?.property_type && (
                          <Text color="$gray10">
                            Type: {pa.address.property_type}
                          </Text>
                        )}
                      </Card>
                    ))}
                  </Stack>
                )}

                {/* TODO: Add Mapbox map display here */}
                <Text color="$gray10">
                  Map display coming soon - will show site boundaries and address pins
                </Text>
              </Stack>
            )}
          </Stack>
        </Card>

        {/* Workers Section */}
        <Card padding="md">
          <Stack gap={16}>
            <Row justify="space-between" align="center">
              <Text>
                Workers
              </Text>
              <Button size="md" iconStart={Plus}>
                Add Worker
              </Button>
            </Row>

            {workers.length === 0 ? (
              <Text color="$gray10">No workers assigned yet</Text>
            ) : (
              <Stack gap={8}>
                {workers.map((worker: (typeof workers)[0]) => {
                  const StatusIcon = getWorkerStatusIcon(worker.status)
                  const statusColor = getWorkerStatusColor(worker.status)

                  return (
                    <Card key={worker.id} padding={12}>
                      <Row justify="space-between" align="center">
                        <Stack gap={4}>
                          <Row gap={8} align="center">
                            <StatusIcon size="lg" color={statusColor} />
                            <Text>Worker {worker.user_id?.slice(0, 8)}</Text>
                          </Row>
                          {worker.role_on_project && (
                            <Text color="$gray10">
                              Role: {worker.role_on_project}
                            </Text>
                          )}
                          {worker.start_date && worker.end_date && (
                            <Text color="$gray10">
                              {worker.start_date} - {worker.end_date}
                            </Text>
                          )}
                          {worker.claimed_by_worker && (
                            <Text color="$blue10">
                              Claimed by worker
                            </Text>
                          )}
                          {worker.assigned_by_manager && (
                            <Text color="green">
                              Assigned by manager
                            </Text>
                          )}
                        </Stack>
                        {worker.status === 'pending' && (
                          <Row gap={8}>
                            <Button
                              size="md"
                             
                              color="$green12"
                              onPress={async () => {
                                // TODO: Implement approve
                                console.log('Approve worker', worker.id)
                              }}
                            >Approve</Button>
                            <Button
                              size="md"
                             
                              color="$red12"
                              onPress={async () => {
                                // TODO: Implement reject
                                console.log('Reject worker', worker.id)
                              }}
                            >Reject</Button>
                          </Row>
                        )}
                      </Row>
                    </Card>
                  )
                })}
              </Stack>
            )}

            {/* Claim Work Button for current user */}
            <Button
              theme="blue"
              onPress={async () => {
                // TODO: Implement claim work
                console.log('Claim work on project', project.id)
              }}
            >Claim I Worked Here</Button>
          </Stack>
        </Card>
      </Stack>
    </Stack>
  )
}
