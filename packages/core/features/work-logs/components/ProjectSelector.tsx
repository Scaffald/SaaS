import { memo, useMemo } from "react";
import { Select, Spinner, YStack, Text, XStack, Button } from "tamagui";
import { AlertCircle, ChevronDown, RefreshCw } from "@tamagui/lucide-icons";

export interface ProjectSelectorOrganization {
  id: string;
  name: string;
  isAdmin: boolean;
  isOwner: boolean;
}

export interface ProjectSelectorProject {
  id: string;
  name: string;
  organizationId: string;
  status: string | null;
  isArchived: boolean;
  startsAt: string | null;
  endsAt: string | null;
}

export interface ProjectSelectorProps {
  value: string;
  onChange: (projectId: string) => void;
  organizations: ProjectSelectorOrganization[];
  projects: ProjectSelectorProject[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  organizationFilter: string | null;
  onOrganizationFilterChange: (organizationId: string | null) => void;
  disabled?: boolean;
  helperText?: string;
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
      return projects;
    }
    return projects.filter((project) => project.organizationId === organizationFilter);
  }, [organizationFilter, projects]);

  const hasMultipleOrganizations = organizations.length > 1;

  return (
    <YStack gap="$2">
      <Text fontWeight="600" fontSize="$4">
        Project
      </Text>

      {hasMultipleOrganizations && (
        <YStack gap="$1">
          <Text fontSize="$3" color="$colorMuted">
            Organization
          </Text>
          <Select
            value={organizationFilter ?? "all"}
            onValueChange={(nextValue) => {
              if (nextValue === "all") {
                onOrganizationFilterChange(null);
              } else {
                onOrganizationFilterChange(nextValue);
              }
            }}
            disablePreventBodyScroll
            size="$4"
          >
            <Select.Trigger bordered iconAfter={ChevronDown}>
              <Select.Value placeholder="All organizations" />
            </Select.Trigger>
            <Select.Content zIndex={1_000_000}>
              <Select.ScrollUpButton />
              <Select.Viewport>
                <Select.Group>
                  <Select.Label>Organizations</Select.Label>
                  <Select.Item index={0} value="all">
                    <Select.ItemText>All organizations</Select.ItemText>
                  </Select.Item>
                  {organizations.map((organization, index) => (
                    <Select.Item
                      key={organization.id}
                      index={index + 1}
                      value={organization.id}
                    >
                      <Select.ItemText>{organization.name}</Select.ItemText>
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Group>
              </Select.Viewport>
              <Select.ScrollDownButton />
            </Select.Content>
          </Select>
        </YStack>
      )}

      <YStack gap="$1">
        <Text fontSize="$3" color="$colorMuted">
          Select a project to associate with this work log.
        </Text>
        <Select
          value={value}
          onValueChange={onChange}
          size="$4"
          disablePreventBodyScroll
          disabled={disabled || isLoading || filteredProjects.length === 0}
        >
          <Select.Trigger bordered iconAfter={ChevronDown}>
            <Select.Value placeholder={isLoading ? "Loading projects..." : "Select a project"} />
          </Select.Trigger>

          <Select.Content zIndex={1_000_000}>
            <Select.ScrollUpButton />
            <Select.Viewport>
              <Select.Group>
                <Select.Label>Projects</Select.Label>
                {filteredProjects.map((project, index) => (
                  <Select.Item key={project.id} index={index} value={project.id}>
                    <Select.ItemText>
                      {project.name}
                      {project.isArchived ? " (Archived)" : ""}
                    </Select.ItemText>
                    <Select.ItemIndicator />
                  </Select.Item>
                ))}
              </Select.Group>
            </Select.Viewport>
            <Select.ScrollDownButton />
          </Select.Content>
        </Select>
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
        <Text fontSize="$2" color="$colorMuted">
          {helperText}
        </Text>
      )}

      {!isLoading && !error && filteredProjects.length === 0 && (
        <Text fontSize="$3" color="$colorMuted">
          No projects available for the selected organization.
        </Text>
      )}
    </YStack>
  );
});

