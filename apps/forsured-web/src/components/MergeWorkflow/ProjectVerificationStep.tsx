/**
 * ProjectVerificationStep - Project list with confirmation checkboxes
 * Merge project verification step
 * Merge workflow - conflict resolution and data verification
 *
 * Shows list of projects the manual user was associated with,
 * allowing the real user to confirm which ones to transfer.
 */
import { useState, useCallback } from 'react'
import { Stack, Row, Text, H2, Card } from '@unicornlove/beyond-ui'
import { Building, Calendar, User, Check, AlertTriangle } from 'lucide-react'
import Button from '../Common/Button'

interface Project {
  id: string
  name: string
  role: string
  addedBy: string
  addedAt: string
}

interface ProjectVerificationStepProps {
  projects: Project[]
  selectedProjectIds: string[]
  onComplete: (projectIds: string[]) => void
  onBack: () => void
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Format role for display
 */
function formatRole(role: string): string {
  const roleMap: Record<string, string> = {
    contractor: 'Contractor',
    subcontractor: 'Subcontractor',
    gc: 'General Contractor',
    broker: 'Insurance Broker',
    manager: 'Project Manager',
    member: 'Team Member',
  }
  return roleMap[role] || role.charAt(0).toUpperCase() + role.slice(1)
}

export function ProjectVerificationStep({
  projects,
  selectedProjectIds,
  onComplete,
  onBack,
}: ProjectVerificationStepProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedProjectIds))
  const [showSkipWarning, setShowSkipWarning] = useState(false)

  // Handle checkbox toggle
  const handleToggle = useCallback((projectId: string) => {
    setSelected((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(projectId)) {
        newSet.delete(projectId)
      } else {
        newSet.add(projectId)
      }
      return newSet
    })
  }, [])

  // Handle Select All
  const handleSelectAll = useCallback(() => {
    setSelected(new Set(projects.map((p) => p.id)))
  }, [projects])

  // Handle Deselect All
  const handleDeselectAll = useCallback(() => {
    setSelected(new Set())
  }, [])

  // Handle continue
  const handleContinue = useCallback(() => {
    if (selected.size === 0) {
      setShowSkipWarning(true)
      return
    }
    onComplete(Array.from(selected))
  }, [selected, onComplete])

  // Handle confirm skip
  const handleConfirmSkip = useCallback(() => {
    onComplete([])
  }, [onComplete])

  // If no projects, skip this step
  if (projects.length === 0) {
    return (
      <Stack alignItems="center" gap={24}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: 'var(--color-gray-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Building size={32} style={{ color: 'var(--color-text-muted)' }} />
        </div>
        <Stack alignItems="center" gap={8}>
          <H2 style={{ fontSize: 24, fontWeight: 700 }}>No Projects Found</H2>
          <Text size="md" muted style={{ textAlign: 'center' }}>
            There are no projects associated with the manual account to transfer.
          </Text>
        </Stack>
        <Button variant="primary" onPress={() => onComplete([])} size="lg">
          Continue
        </Button>
      </Stack>
    )
  }

  return (
    <Stack gap={24}>
      {/* Header */}
      <Stack gap={8}>
        <H2 style={{ fontSize: 28, fontWeight: 700 }}>Verify Projects</H2>
        <Text size="md" muted>
          The following projects were associated with your manual profile. Select which ones you
          want to transfer to your new account.
        </Text>
      </Stack>

      {/* Selection actions */}
      <Row alignItems="center" justifyContent="space-between">
        <Text size="sm" weight="medium">
          {selected.size} of {projects.length} selected
        </Text>
        <Row gap={8}>
          <Button variant="ghost" size="sm" onPress={handleSelectAll}>
            Select All
          </Button>
          <Button variant="ghost" size="sm" onPress={handleDeselectAll}>
            Deselect All
          </Button>
        </Row>
      </Row>

      {/* Project cards */}
      <Stack gap={12}>
        {projects.map((project) => {
          const isSelected = selected.has(project.id)

          return (
            <Card
              key={project.id}
              onPress={() => handleToggle(project.id)}
              style={{
                padding: 16,
                cursor: 'pointer',
                backgroundColor: isSelected ? 'var(--color-blue-2)' : 'var(--color-background)',
                border: isSelected
                  ? '2px solid var(--color-blue-8)'
                  : '1px solid var(--color-border)',
                borderRadius: 12,
                transition: 'all 0.15s ease',
              }}
              role="checkbox"
              aria-checked={isSelected}
            >
              <Row alignItems="flex-start" gap={16}>
                {/* Checkbox */}
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    border: isSelected ? 'none' : '2px solid var(--color-border)',
                    backgroundColor: isSelected ? 'var(--color-blue-10)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  {isSelected && <Check size={14} color="white" strokeWidth={3} />}
                </div>

                {/* Project info */}
                <Stack gap={8} style={{ flex: 1 }}>
                  <Text size="md" weight="semibold">
                    {project.name}
                  </Text>

                  <Row gap={16} style={{ flexWrap: 'wrap' }}>
                    <Row alignItems="center" gap={6}>
                      <Building size={14} style={{ color: 'var(--color-text-muted)' }} />
                      <Text size="sm" muted>
                        {formatRole(project.role)}
                      </Text>
                    </Row>

                    <Row alignItems="center" gap={6}>
                      <User size={14} style={{ color: 'var(--color-text-muted)' }} />
                      <Text size="sm" muted>
                        Added by {project.addedBy}
                      </Text>
                    </Row>

                    <Row alignItems="center" gap={6}>
                      <Calendar size={14} style={{ color: 'var(--color-text-muted)' }} />
                      <Text size="sm" muted>
                        {formatDate(project.addedAt)}
                      </Text>
                    </Row>
                  </Row>
                </Stack>
              </Row>
            </Card>
          )
        })}
      </Stack>

      {/* Skip warning modal */}
      {showSkipWarning && (
        <Card
          style={{
            padding: 20,
            backgroundColor: 'var(--color-orange-2)',
            border: '1px solid var(--color-orange-6)',
            borderRadius: 12,
          }}
        >
          <Row alignItems="flex-start" gap={12}>
            <AlertTriangle
              size={20}
              style={{ color: 'var(--color-orange-10)', flexShrink: 0, marginTop: 2 }}
            />
            <Stack gap={12} style={{ flex: 1 }}>
              <Stack gap={4}>
                <Text size="md" weight="semibold" style={{ color: 'var(--color-orange-11)' }}>
                  Skip All Projects?
                </Text>
                <Text size="sm" style={{ color: 'var(--color-orange-11)' }}>
                  You haven't selected any projects. These projects will remain associated with the
                  manual profile and you may lose access to them.
                </Text>
              </Stack>
              <Row gap={8}>
                <Button variant="secondary" size="sm" onPress={() => setShowSkipWarning(false)}>
                  Go Back
                </Button>
                <Button variant="ghost" size="sm" onPress={handleConfirmSkip}>
                  Skip Anyway
                </Button>
              </Row>
            </Stack>
          </Row>
        </Card>
      )}

      {/* Navigation buttons */}
      <Row gap={12} style={{ marginTop: 16 }}>
        <Button variant="ghost" onPress={onBack} style={{ flex: 1 }}>
          Back
        </Button>
        <Button variant="primary" onPress={handleContinue} style={{ flex: 2 }}>
          Continue
        </Button>
      </Row>
    </Stack>
  )
}

export default ProjectVerificationStep
