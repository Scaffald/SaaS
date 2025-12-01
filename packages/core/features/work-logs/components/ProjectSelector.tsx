import { ResponsiveSelect } from '@unicornlove/ui'
import { AlertCircle, RefreshCw } from '@tamagui/lucide-icons'
import { memo, useMemo } from 'react'
import { Button, Spinner, Text, XStack, YStack } from 'tamagui'

export interface ProjectSelectorOrganization {
  id: string
  name: string
  isAdmin: boolean
  isOwner: boolean
}

export interface ProjectSelectorProject {
  id: string
  name: string
  organizationId: string
  status: string | null
  isArchived: boolean
  startsAt: string | null
  endsAt: string | null
}

export interface ProjectSelectorProps {
  value: string
  onChange: (projectId: string) => void
  organizations: ProjectSelectorOrganization[]
  projects: ProjectSelectorProject[]
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
  organizationFilter: string | null
  onOrganizationFilterChange: (organizationId: string | null) => void
  disabled?: boolean
  helperText?: string
}

export const ProjectSelector = memo(function ProjectSelector({
  value,
  onChange,
  organizations,
  projects,
  isLoading = false,
  error,
  onRetry,
  organizationFilter,
  onOrganizationFilterChange,
  disabled = false,
  helperText,
}: ProjectSelectorProps) {
  const filteredProjects = useMemo(() => {
    if (!organizationFilter) {
      return projects
    }
    return projects.filter((project) => project.organizationId === organizationFilter)
  }, [organizationFilter, projects])

  const hasMultipleOrganizations = organizations.length > 1

  return (
    <YStack gap="$2">
      <Text fontWeight="600" fontSize="$4">
        Project
      </Text>

      {hasMultipleOrganizations && (
        <YStack gap="$1">
          <Text fontSize="$3" color="$color10">
            Organization
          </Text>
          <ResponsiveSelect
            value={organizationFilter ?? 'all'}
            onValueChange={(nextValue) => {
              if (nextValue === 'all') {
                onOrganizationFilterChange(null)
              } else {
                onOrganizationFilterChange(nextValue)
              }
            }}
            placeholder="All organizations"
            size="$4"
            options={[
              { value: 'all', label: 'All organizations' },
              ...organizations.map((organization) => ({
                value: organization.id,
                label: organization.name,
              })),
            ]}
          />
        </YStack>
      )}

      <YStack gap="$1">
        <Text fontSize="$3" color="$color10">
          Select a project to associate with this work log.
        </Text>
        <ResponsiveSelect
          value={value}
          onValueChange={onChange}
          placeholder={isLoading ? 'Loading projects...' : 'Select a project'}
          size="$4"
          disabled={disabled || isLoading || filteredProjects.length === 0}
          options={filteredProjects.map((project) => ({
            value: project.id,
            label: `${project.name}${project.isArchived ? ' (Archived)' : ''}`,
          }))}
        />
      </YStack>

      {isLoading && (
        <XStack gap="$2" items="center">
          <Spinner size="small" />
          <Text fontSize="$3">Loading projects…</Text>
        </XStack>
      )}

      {error && (
        <XStack
          gap="$2"
          items="center"
          bg="$red3"
          borderColor="$red6"
          borderWidth={1}
          rounded="$3"
          px="$3"
          py="$2"
        >
          <AlertCircle size={16} color="$red10" />
          <Text flex={1} fontSize="$3" color="$red10">
            {error}
          </Text>
          {onRetry && (
            <Button
              size="$2"
              variant="outlined"
              icon={RefreshCw}
              onPress={onRetry}
              aria-label="Retry loading projects"
            />
          )}
        </XStack>
      )}

      {helperText && (
        <Text fontSize="$2" color="$color10">
          {helperText}
        </Text>
      )}

      {!isLoading && !error && filteredProjects.length === 0 && (
        <Text fontSize="$3" color="$color10">
          No projects available for the selected organization.
        </Text>
      )}
    </YStack>
  )
})
