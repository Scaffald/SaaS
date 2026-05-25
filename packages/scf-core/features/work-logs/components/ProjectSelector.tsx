import { ResponsiveSelect } from "@scaffald/ui";
import { AlertCircle, RefreshCw } from "lucide-react-native";
import { memo, useMemo } from "react";
import { Button, Spinner, Text, Row, Stack, useThemeContext } from "@scaffald/ui";
import { colors } from "@scaffald/ui/tokens";

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
  const { theme } = useThemeContext();
  const t = theme === "dark" ? "dark" : "light";

  const filteredProjects = useMemo(() => {
    if (!organizationFilter) {
      return projects;
    }
    return projects.filter(
      (project) => project.organizationId === organizationFilter
    );
  }, [organizationFilter, projects]);

  const hasMultipleOrganizations = organizations.length > 1;

  return (
    <Stack gap={8}>
      <Text>Project</Text>

      {hasMultipleOrganizations && (
        <Stack gap={4}>
          <Text style={{ color: colors.text[t].secondary }}>Organization</Text>
          <ResponsiveSelect
            value={organizationFilter ?? "all"}
            onValueChange={(nextValue) => {
              if (nextValue === "all") {
                onOrganizationFilterChange(null);
              } else {
                onOrganizationFilterChange(nextValue);
              }
            }}
            placeholder="All organizations"
            size="md"
            options={[
              { value: "all", label: "All organizations" },
              ...organizations.map((organization) => ({
                value: organization.id,
                label: organization.name,
              })),
            ]}
          />
        </Stack>
      )}

      <Stack gap={4}>
        <Text style={{ color: colors.text[t].secondary }}>
          Select a project to associate with this work log.
        </Text>
        <ResponsiveSelect
          value={value}
          onValueChange={onChange}
          placeholder={isLoading ? "Loading projects..." : "Select a project"}
          size="md"
          disabled={disabled || isLoading || filteredProjects.length === 0}
          options={filteredProjects.map((project) => ({
            value: project.id,
            label: `${project.name}${project.isArchived ? " (Archived)" : ""}`,
          }))}
        />
      </Stack>

      {isLoading && (
        <Row gap={8} align="center">
          <Spinner variant="ios" size="sm" />
          <Text>Loading projects…</Text>
        </Row>
      )}

      {error && (
        <Row
          gap={8}
          align="center"
          borderRadius={12}
          paddingHorizontal={12}
          paddingVertical={8}
          style={{
            backgroundColor: t === "dark" ? colors.error[900] : colors.error[50],
            borderColor: colors.border[t].default,
            borderWidth: 1,
          }}
        >
          <AlertCircle size={20} color={t === "dark" ? colors.error[300] : colors.error[600]} />
          <Text style={{ flex: 1, color: t === "dark" ? colors.error[300] : colors.error[600] }}>
            {error}
          </Text>
          {onRetry && (
            <Button
              size="sm"
              variant="outline"
              iconStart={RefreshCw}
              onPress={onRetry}
              aria-label="Retry loading projects"
            />
          )}
        </Row>
      )}

      {helperText && <Text style={{ color: colors.text[t].secondary }}>{helperText}</Text>}

      {!isLoading && !error && filteredProjects.length === 0 && (
        <Text style={{ color: colors.text[t].secondary }}>
          No projects available for the selected organization.
        </Text>
      )}
    </Stack>
  );
});
