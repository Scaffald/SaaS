import { ResponsiveSelect } from '@unicornlove/beyond-ui'
import { AlertCircle, RefreshCw } from 'lucide-react-native'
import { memo, useMemo } from 'react'
import { Button, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'

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
    <Stack gap={8}>
      <Text>
        Project
      </Text>

      {hasMultipleOrganizations && (
        <Stack gap={4}>
          <Text color="gray">
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
            size={16}
            options={[
              { value: 'all', label: 'All organizations' },
              ...organizations.map((organization) => ({
                value: organization.id,
                label: organization.name,
              })),
            ]}
          />
        </Stack>
      )}

      <Stack gap={4}>
        <Text color="gray">
          Select a project to associate with this work log.
        </Text>
        <ResponsiveSelect
          value={value}
          onValueChange={onChange}
          placeholder={isLoading ? 'Loading projects...' : 'Select a project'}
          size={16}
          disabled={disabled || isLoading || filteredProjects.length === 0}
          options={filteredProjects.map((project) => ({
            value: project.id,
            label: `${project.name}${project.isArchived ? ' (Archived)' : ''}`,
          }))}
        />
      </Stack>

      {isLoading && (
        <Row gap={8} align="center">
          <Spinner size="sm" />
          <Text>Loading projects…</Text>
        </Row>
      )}

      {error && (
        <Row
          gap={8}
          align="center"
          backgroundColor="$red3"
          borderColor="$red6"
          borderWidth={1}
          borderRadius={12}
          paddingHorizontal={12}
          paddingVertical={8}
        >
          <AlertCircle size={16} color="$red10" />
          <Text flex={1} color="$red10">
            {error}
          </Text>
          {onRetry && (
            <Button
              size={8}
              variant="outline"
              icon={RefreshCw}
              onPress={onRetry}
              aria-label="Retry loading projects"
            />
          )}
        </Row>
      )}

      {helperText && (
        <Text color="gray">
          {helperText}
        </Text>
      )}

      {!isLoading && !error && filteredProjects.length === 0 && (
        <Text color="gray">
          No projects available for the selected organization.
        </Text>
      )}
    </Stack>
  )
})
