import { RouteBuilder } from '@app/core/constants/routes'
import { api } from '@app/core/utils/api'
import { CheckCircle, Clock, Eye, EyeOff, Plus, XCircle } from '@tamagui/lucide-icons'
import { useLocalSearchParams } from 'expo-router'
import { Button, Card, Spinner, Text, XStack, YStack } from '@unicornlove/ui'

export default function ProjectDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>()

  const { data, isLoading } = api.projects.get.useQuery({ id: id as string }, { enabled: !!id })

  if (!id) {
    return (
      <YStack flex={1} padding="$4" gap="$4">
        <Text fontSize="$8" fontWeight="600">
          Project Not Found
        </Text>
        <Text>Project ID is required</Text>
      </YStack>
    )
  }

  if (isLoading) {
    return (
      <YStack flex={1} padding="$4" gap="$4" alignItems="center" justifyContent="center">
        <Text fontSize="$8" fontWeight="600">
          Loading Project...
        </Text>
        <Spinner />
      </YStack>
    )
  }

  if (!data?.project) {
    return (
      <YStack flex={1} padding="$4" gap="$4">
        <Text fontSize="$8" fontWeight="600">
          Project Not Found
        </Text>
        <Text>Project not found</Text>
      </YStack>
    )
  }

  const project = data.project
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
    <YStack flex={1} padding="$4" gap="$4">
      <YStack gap="$2">
        <Text fontSize="$8" fontWeight="600">
          {project.name}
        </Text>
        {project.description && (
          <Text fontSize="$4" color="$gray11">
            {project.description}
          </Text>
        )}
      </YStack>
      <YStack gap="$4">
        {/* Project Info */}
        <Card padding="$4">
          <YStack gap="$4">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$8" fontWeight="600">
                {project.name}
              </Text>
              <Button
                onPress={() => {
                  // Navigate to edit page
                  window.location.href = RouteBuilder.projectEdit(project.id)
                }}
              >
                Edit
              </Button>
            </XStack>

            {project.description && <Text>{project.description}</Text>}

            <XStack gap="$4" flexWrap="wrap">
              <YStack gap="$1">
                <Text fontSize="$2" color="$gray10">
                  Status
                </Text>
                <Text fontWeight="600">
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </Text>
              </YStack>

              {project.start_date && (
                <YStack gap="$1">
                  <Text fontSize="$2" color="$gray10">
                    Start Date
                  </Text>
                  <Text fontWeight="600">{project.start_date}</Text>
                </YStack>
              )}

              {project.end_date && (
                <YStack gap="$1">
                  <Text fontSize="$2" color="$gray10">
                    End Date
                  </Text>
                  <Text fontWeight="600">{project.end_date}</Text>
                </YStack>
              )}

              <YStack gap="$1">
                <Text fontSize="$2" color="$gray10">
                  Location Visibility
                </Text>
                <XStack gap="$2" alignItems="center">
                  {getVisibilityIcon(project.location_visibility)({ size: 16 })}
                  <Text fontWeight="600">{getVisibilityLabel(project.location_visibility)}</Text>
                  {project.location_visibility_override && (
                    <Text fontSize="$1" color="$yellow10">
                      (Override)
                    </Text>
                  )}
                </XStack>
              </YStack>
            </XStack>
          </YStack>
        </Card>

        {/* Location Section */}
        <Card padding="$4">
          <YStack gap="$4">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$6" fontWeight="600">
                Location
              </Text>
              <Button size="$2" icon={Plus}>
                Add Site
              </Button>
            </XStack>

            {sites.length === 0 && addresses.length === 0 ? (
              <Text color="$gray10">No location data added yet</Text>
            ) : (
              <YStack gap="$4">
                {sites.length > 0 && (
                  <YStack gap="$2">
                    <Text fontWeight="600">Site Boundaries</Text>
                    {sites.map((ps: (typeof sites)[0]) => (
                      <Card key={ps.id} padding="$2" backgroundColor="$gray2">
                        <Text>
                          {ps.site?.site_identifier || `Site ${ps.site?.id?.slice(0, 8)}`}
                        </Text>
                        {ps.site?.area_sqft && (
                          <Text fontSize="$2" color="$gray10">
                            Area: {ps.site.area_sqft.toLocaleString()} sq ft
                          </Text>
                        )}
                      </Card>
                    ))}
                  </YStack>
                )}

                {addresses.length > 0 && (
                  <YStack gap="$2">
                    <Text fontWeight="600">Property Addresses</Text>
                    {addresses.map((pa: (typeof addresses)[0]) => (
                      <Card key={pa.id} padding="$2" backgroundColor="$gray2">
                        <Text>
                          {pa.address?.address?.street || ''}
                          {pa.address?.address?.city && `, ${pa.address.address.city}`}
                          {pa.address?.address?.state && `, ${pa.address.address.state}`}
                          {pa.address?.address?.zip && ` ${pa.address.address.zip}`}
                        </Text>
                        {pa.address?.property_type && (
                          <Text fontSize="$2" color="$gray10">
                            Type: {pa.address.property_type}
                          </Text>
                        )}
                      </Card>
                    ))}
                  </YStack>
                )}

                {/* TODO: Add Mapbox map display here */}
                <Text fontSize="$2" color="$gray10" fontStyle="italic">
                  Map display coming soon - will show site boundaries and address pins
                </Text>
              </YStack>
            )}
          </YStack>
        </Card>

        {/* Workers Section */}
        <Card padding="$4">
          <YStack gap="$4">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$6" fontWeight="600">
                Workers
              </Text>
              <Button size="$2" icon={Plus}>
                Add Worker
              </Button>
            </XStack>

            {workers.length === 0 ? (
              <Text color="$gray10">No workers assigned yet</Text>
            ) : (
              <YStack gap="$2">
                {workers.map((worker: (typeof workers)[0]) => {
                  const StatusIcon = getWorkerStatusIcon(worker.status)
                  const statusColor = getWorkerStatusColor(worker.status)

                  return (
                    <Card key={worker.id} padding="$3" backgroundColor="$gray2">
                      <XStack justifyContent="space-between" alignItems="center">
                        <YStack gap="$1" flex={1}>
                          <XStack gap="$2" alignItems="center">
                            <StatusIcon size={16} color={statusColor} />
                            <Text fontWeight="600">Worker {worker.user_id?.slice(0, 8)}</Text>
                          </XStack>
                          {worker.role_on_project && (
                            <Text fontSize="$2" color="$gray10">
                              Role: {worker.role_on_project}
                            </Text>
                          )}
                          {worker.start_date && worker.end_date && (
                            <Text fontSize="$2" color="$gray10">
                              {worker.start_date} - {worker.end_date}
                            </Text>
                          )}
                          {worker.claimed_by_worker && (
                            <Text fontSize="$2" color="$blue10">
                              Claimed by worker
                            </Text>
                          )}
                          {worker.assigned_by_manager && (
                            <Text fontSize="$2" color="$green10">
                              Assigned by manager
                            </Text>
                          )}
                        </YStack>
                        {worker.status === 'pending' && (
                          <XStack gap="$2">
                            <Button
                              size="$2"
                              backgroundColor="$green9"
                              color="$green12"
                              onPress={async () => {
                                // TODO: Implement approve
                                console.log('Approve worker', worker.id)
                              }}
                            >
                              Approve
                            </Button>
                            <Button
                              size="$2"
                              backgroundColor="$red9"
                              color="$red12"
                              onPress={async () => {
                                // TODO: Implement reject
                                console.log('Reject worker', worker.id)
                              }}
                            >
                              Reject
                            </Button>
                          </XStack>
                        )}
                      </XStack>
                    </Card>
                  )
                })}
              </YStack>
            )}

            {/* Claim Work Button for current user */}
            <Button
              theme="blue"
              onPress={async () => {
                // TODO: Implement claim work
                console.log('Claim work on project', project.id)
              }}
            >
              Claim I Worked Here
            </Button>
          </YStack>
        </Card>
      </YStack>
    </YStack>
  )
}
