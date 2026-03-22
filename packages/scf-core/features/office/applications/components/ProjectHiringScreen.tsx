/**
 * Project-Based Hiring Screen
 *
 * Enables hiring for short-term/seasonal construction projects with
 * bulk hiring workflows, crew management, and project timeline tracking.
 *
 * @see Issue #99
 */

import { useState, useMemo, useCallback } from 'react'
import { ScrollView, Pressable } from 'react-native'
import {
  Button,
  Card,
  H2,
  Row,
  Stack,
  Text,
  Input,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import {
  Calendar,
  Check,
  CheckSquare,
  ChevronRight,
  Clock,
  HardHat,
  MapPin,
  Plus,
  Search,
  Users,
} from 'lucide-react-native'

// ============================================================================
// Types
// ============================================================================

interface ProjectRole {
  id: string
  title: string
  count: number
  filled: number
  payRate: string
  skills: string[]
}

interface ProjectCrewMember {
  id: string
  name: string
  role: string
  startDate: string
  status: 'active' | 'pending' | 'completed'
}

interface HiringProject {
  id: string
  name: string
  location: string
  client: string
  startDate: string
  endDate: string
  status: 'planning' | 'hiring' | 'active' | 'completed'
  roles: ProjectRole[]
  crew: ProjectCrewMember[]
  budget: string
  totalPositions: number
  filledPositions: number
}

// ============================================================================
// Mock Data
// ============================================================================

const MOCK_PROJECTS: HiringProject[] = [
  {
    id: 'proj-1',
    name: 'Downtown Office Tower — Phase 2',
    location: 'Portland, OR',
    client: 'Meridian Development Group',
    startDate: '2026-04-01',
    endDate: '2026-09-30',
    status: 'hiring',
    budget: '$2.4M Labor',
    totalPositions: 35,
    filledPositions: 18,
    roles: [
      { id: 'r1', title: 'Journeyman Electrician', count: 8, filled: 5, payRate: '$42–48/hr', skills: ['NEC Code', 'Commercial Wiring', 'Panel Install'] },
      { id: 'r2', title: 'Apprentice Electrician', count: 6, filled: 4, payRate: '$22–28/hr', skills: ['Conduit Bending', 'Wire Pulling'] },
      { id: 'r3', title: 'Plumber', count: 5, filled: 3, payRate: '$38–44/hr', skills: ['Copper Brazing', 'PEX Install', 'Code Compliance'] },
      { id: 'r4', title: 'HVAC Technician', count: 4, filled: 2, payRate: '$40–46/hr', skills: ['EPA 608', 'Ductwork', 'System Diagnostics'] },
      { id: 'r5', title: 'Laborer', count: 12, filled: 4, payRate: '$18–24/hr', skills: ['OSHA 10', 'General Labor'] },
    ],
    crew: [
      { id: 'c1', name: 'Mike Chen', role: 'Journeyman Electrician', startDate: '2026-04-01', status: 'pending' },
      { id: 'c2', name: 'Sarah Torres', role: 'Plumber', startDate: '2026-04-01', status: 'pending' },
      { id: 'c3', name: 'James Wilson', role: 'HVAC Technician', startDate: '2026-04-15', status: 'pending' },
    ],
  },
  {
    id: 'proj-2',
    name: 'Highway Bridge Repair — I-84',
    location: 'The Dalles, OR',
    client: 'ODOT',
    startDate: '2026-05-15',
    endDate: '2026-08-15',
    status: 'planning',
    budget: '$890K Labor',
    totalPositions: 16,
    filledPositions: 0,
    roles: [
      { id: 'r6', title: 'Ironworker', count: 6, filled: 0, payRate: '$44–52/hr', skills: ['Structural Steel', 'Welding', 'Rigging'] },
      { id: 'r7', title: 'Concrete Finisher', count: 4, filled: 0, payRate: '$36–42/hr', skills: ['Formwork', 'Finishing', 'Rebar'] },
      { id: 'r8', title: 'Equipment Operator', count: 3, filled: 0, payRate: '$38–46/hr', skills: ['Crane', 'Excavator', 'CDL'] },
      { id: 'r9', title: 'Laborer', count: 3, filled: 0, payRate: '$18–24/hr', skills: ['OSHA 30', 'Flagging'] },
    ],
    crew: [],
  },
  {
    id: 'proj-3',
    name: 'Residential Development — Hillsboro Oaks',
    location: 'Hillsboro, OR',
    client: 'Pacific Homes LLC',
    startDate: '2026-02-01',
    endDate: '2026-06-30',
    status: 'active',
    budget: '$1.1M Labor',
    totalPositions: 22,
    filledPositions: 22,
    roles: [
      { id: 'r10', title: 'Framing Carpenter', count: 8, filled: 8, payRate: '$32–38/hr', skills: ['Framing', 'Blueprint Reading', 'Power Tools'] },
      { id: 'r11', title: 'Roofer', count: 6, filled: 6, payRate: '$28–34/hr', skills: ['Shingle', 'Flat Roof', 'Safety'] },
      { id: 'r12', title: 'Siding Installer', count: 4, filled: 4, payRate: '$26–32/hr', skills: ['Vinyl Siding', 'Trim Work'] },
      { id: 'r13', title: 'Laborer', count: 4, filled: 4, payRate: '$18–24/hr', skills: ['General Labor', 'OSHA 10'] },
    ],
    crew: [],
  },
]

// ============================================================================
// Helper Components
// ============================================================================

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  planning: { bg: '#dbeafe', text: '#1e40af' },
  hiring: { bg: '#fef3c7', text: '#92400e' },
  active: { bg: '#d1fae5', text: '#065f46' },
  completed: { bg: '#e5e7eb', text: '#374151' },
}

function ProjectCard({ project, onPress }: { project: HiringProject; onPress: () => void }) {
  const { theme } = useThemeContext()
  const fillPct = project.totalPositions > 0
    ? Math.round((project.filledPositions / project.totalPositions) * 100)
    : 0
  const statusStyle = STATUS_COLORS[project.status] ?? STATUS_COLORS.planning

  return (
    <Pressable onPress={onPress}>
      <Card variant="glass" padding="md" style={{ backgroundColor: colors.bg[theme].default }}>
        <Stack gap={12}>
          <Row justify="space-between" align="center">
            <Stack flex={1} gap={2}>
              <Text style={{ fontWeight: '600', fontSize: 16, color: colors.text[theme].primary }}>
                {project.name}
              </Text>
              <Text style={{ fontSize: 13, color: colors.text[theme].secondary }}>
                {project.client}
              </Text>
            </Stack>
            <Stack
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12,
                backgroundColor: statusStyle.bg,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: statusStyle.text }}>
                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </Text>
            </Stack>
          </Row>

          <Row gap={16}>
            <Row gap={4} align="center">
              <MapPin size={14} color={colors.icon[theme].default} />
              <Text style={{ fontSize: 13, color: colors.text[theme].secondary }}>{project.location}</Text>
            </Row>
            <Row gap={4} align="center">
              <Calendar size={14} color={colors.icon[theme].default} />
              <Text style={{ fontSize: 13, color: colors.text[theme].secondary }}>
                {new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
                {new Date(project.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </Row>
          </Row>

          {/* Progress bar */}
          <Stack gap={4}>
            <Row justify="space-between">
              <Text style={{ fontSize: 12, color: colors.text[theme].secondary }}>
                Crew: {project.filledPositions}/{project.totalPositions} positions filled
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text[theme].primary }}>
                {fillPct}%
              </Text>
            </Row>
            <Stack
              style={{
                height: 6,
                borderRadius: 3,
                backgroundColor: colors.bg[theme].subtle,
                overflow: 'hidden',
              }}
            >
              <Stack
                style={{
                  width: `${fillPct}%`,
                  height: '100%',
                  borderRadius: 3,
                  backgroundColor: fillPct === 100 ? '#10b981' : '#3b82f6',
                }}
              />
            </Stack>
          </Stack>

          {/* Role summary */}
          <Row gap={8} style={{ flexWrap: 'wrap' }}>
            {project.roles.map((role) => (
              <Stack
                key={role.id}
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 8,
                  backgroundColor: colors.bg[theme].subtle,
                }}
              >
                <Text style={{ fontSize: 12, color: colors.text[theme].secondary }}>
                  {role.title}: {role.filled}/{role.count}
                </Text>
              </Stack>
            ))}
          </Row>

          <Row justify="space-between" align="center">
            <Text style={{ fontSize: 13, fontWeight: '500', color: colors.text[theme].tertiary }}>
              {project.budget}
            </Text>
            <ChevronRight size={16} color={colors.icon[theme].default} />
          </Row>
        </Stack>
      </Card>
    </Pressable>
  )
}

function ProjectDetailView({ project }: { project: HiringProject }) {
  const { theme } = useThemeContext()
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set())

  const toggleRole = useCallback((roleId: string) => {
    setSelectedRoles((prev) => {
      const next = new Set(prev)
      if (next.has(roleId)) next.delete(roleId)
      else next.add(roleId)
      return next
    })
  }, [])

  return (
    <Stack gap={16}>
      {/* Roles table */}
      <Card variant="glass" padding="md" style={{ backgroundColor: colors.bg[theme].default }}>
        <Stack gap={12}>
          <Row justify="space-between" align="center">
            <Text style={{ fontWeight: '600', fontSize: 15, color: colors.text[theme].primary }}>
              Open Positions
            </Text>
            {selectedRoles.size > 0 && (
              <Button size="sm" variant="filled" color="primary" iconStart={Users}>
                Bulk Hire ({selectedRoles.size})
              </Button>
            )}
          </Row>

          {project.roles.map((role) => {
            const remaining = role.count - role.filled
            const isSelected = selectedRoles.has(role.id)

            return (
              <Pressable key={role.id} onPress={() => toggleRole(role.id)}>
                <Row
                  gap={12}
                  align="center"
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    backgroundColor: isSelected ? colors.bg[theme].selected : colors.bg[theme].subtle,
                    borderWidth: isSelected ? 1 : 0,
                    borderColor: colors.border[theme].active,
                  }}
                >
                  <Stack
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      borderWidth: 1.5,
                      borderColor: isSelected ? colors.fg[theme].active : colors.border[theme].default,
                      backgroundColor: isSelected ? colors.fg[theme].active : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isSelected && <Check size={14} color="#fff" />}
                  </Stack>

                  <Stack flex={1} gap={4}>
                    <Row justify="space-between">
                      <Text style={{ fontWeight: '500', color: colors.text[theme].primary }}>
                        {role.title}
                      </Text>
                      <Text style={{ fontSize: 13, color: colors.text[theme].secondary }}>
                        {role.payRate}
                      </Text>
                    </Row>
                    <Row gap={8}>
                      <Text style={{ fontSize: 12, color: remaining > 0 ? colors.fg[theme].warning : colors.fg[theme].success }}>
                        {remaining > 0 ? `${remaining} needed` : 'Filled ✓'}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.text[theme].tertiary }}>
                        {role.filled}/{role.count} filled
                      </Text>
                    </Row>
                    <Row gap={6} style={{ flexWrap: 'wrap' }}>
                      {role.skills.map((skill) => (
                        <Stack
                          key={skill}
                          style={{
                            paddingHorizontal: 6,
                            paddingVertical: 1,
                            borderRadius: 6,
                            backgroundColor: colors.bg[theme].muted,
                          }}
                        >
                          <Text style={{ fontSize: 11, color: colors.text[theme].tertiary }}>{skill}</Text>
                        </Stack>
                      ))}
                    </Row>
                  </Stack>
                </Row>
              </Pressable>
            )
          })}
        </Stack>
      </Card>

      {/* Crew list */}
      {project.crew.length > 0 && (
        <Card variant="glass" padding="md" style={{ backgroundColor: colors.bg[theme].default }}>
          <Stack gap={12}>
            <Text style={{ fontWeight: '600', fontSize: 15, color: colors.text[theme].primary }}>
              Assigned Crew ({project.crew.length})
            </Text>
            {project.crew.map((member) => (
              <Row key={member.id} justify="space-between" align="center" style={{ paddingVertical: 6 }}>
                <Stack>
                  <Text style={{ color: colors.text[theme].primary }}>{member.name}</Text>
                  <Text style={{ fontSize: 12, color: colors.text[theme].secondary }}>{member.role}</Text>
                </Stack>
                <Row gap={8} align="center">
                  <Text style={{ fontSize: 12, color: colors.text[theme].tertiary }}>
                    Start: {new Date(member.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                  <Stack
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: member.status === 'active' ? '#10b981' : '#f59e0b',
                    }}
                  />
                </Row>
              </Row>
            ))}
          </Stack>
        </Card>
      )}

      {/* Project timeline */}
      <Card variant="glass" padding="md" style={{ backgroundColor: colors.bg[theme].default }}>
        <Stack gap={8}>
          <Text style={{ fontWeight: '600', fontSize: 15, color: colors.text[theme].primary }}>
            Project Timeline
          </Text>
          <Row gap={16}>
            <Row gap={6} align="center">
              <Clock size={14} color={colors.icon[theme].default} />
              <Text style={{ fontSize: 13, color: colors.text[theme].secondary }}>
                {Math.ceil(
                  (new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) /
                    (1000 * 60 * 60 * 24 * 7)
                )}{' '}
                weeks duration
              </Text>
            </Row>
            <Row gap={6} align="center">
              <Calendar size={14} color={colors.icon[theme].default} />
              <Text style={{ fontSize: 13, color: colors.text[theme].secondary }}>
                Starts {new Date(project.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </Text>
            </Row>
          </Row>
        </Stack>
      </Card>
    </Stack>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function ProjectHiringScreen() {
  const { theme } = useThemeContext()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedProject, setSelectedProject] = useState<HiringProject | null>(null)

  const filteredProjects = useMemo(() => {
    return MOCK_PROJECTS.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          p.name.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.client.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [searchQuery, statusFilter])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: MOCK_PROJECTS.length }
    for (const p of MOCK_PROJECTS) {
      counts[p.status] = (counts[p.status] ?? 0) + 1
    }
    return counts
  }, [])

  if (selectedProject) {
    return (
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <Stack gap={16} style={{ paddingBottom: 40 }}>
          <Row gap={8} align="center">
            <Button size="sm" variant="outline" onPress={() => setSelectedProject(null)}>
              ← Back
            </Button>
            <Text style={{ fontWeight: '600', fontSize: 18, color: colors.text[theme].primary }}>
              {selectedProject.name}
            </Text>
          </Row>
          <ProjectDetailView project={selectedProject} />
        </Stack>
      </ScrollView>
    )
  }

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <Stack gap={24} style={{ paddingBottom: 40 }}>
        {/* Header */}
        <Row justify="space-between" align="center">
          <Stack gap={4}>
            <H2>Project-Based Hiring</H2>
            <Text style={{ color: colors.text[theme].secondary }}>
              Manage crew hiring for construction projects and seasonal work
            </Text>
          </Stack>
          <Button variant="filled" color="primary" size="sm" iconStart={Plus}>
            New Project
          </Button>
        </Row>

        {/* Summary cards */}
        <Row gap={12} style={{ flexWrap: 'wrap' }}>
          <Card variant="glass" padding="md" style={{ flex: 1, minWidth: 140, backgroundColor: colors.bg[theme].subtle }}>
            <Stack gap={4}>
              <Row gap={6} align="center">
                <HardHat size={16} color={colors.icon[theme].default} />
                <Text style={{ fontSize: 12, color: colors.text[theme].secondary }}>Active Projects</Text>
              </Row>
              <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text[theme].primary }}>
                {MOCK_PROJECTS.filter((p) => p.status === 'active' || p.status === 'hiring').length}
              </Text>
            </Stack>
          </Card>
          <Card variant="glass" padding="md" style={{ flex: 1, minWidth: 140, backgroundColor: colors.bg[theme].subtle }}>
            <Stack gap={4}>
              <Row gap={6} align="center">
                <Users size={16} color={colors.icon[theme].default} />
                <Text style={{ fontSize: 12, color: colors.text[theme].secondary }}>Open Positions</Text>
              </Row>
              <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text[theme].primary }}>
                {MOCK_PROJECTS.reduce((sum, p) => sum + (p.totalPositions - p.filledPositions), 0)}
              </Text>
            </Stack>
          </Card>
          <Card variant="glass" padding="md" style={{ flex: 1, minWidth: 140, backgroundColor: colors.bg[theme].subtle }}>
            <Stack gap={4}>
              <Row gap={6} align="center">
                <CheckSquare size={16} color={colors.icon[theme].default} />
                <Text style={{ fontSize: 12, color: colors.text[theme].secondary }}>Positions Filled</Text>
              </Row>
              <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text[theme].primary }}>
                {MOCK_PROJECTS.reduce((sum, p) => sum + p.filledPositions, 0)}
              </Text>
            </Stack>
          </Card>
        </Row>

        {/* Search + Filters */}
        <Row gap={12} align="center">
          <Stack flex={1}>
            <Input
              placeholder="Search projects, locations, clients..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </Stack>
        </Row>

        {/* Status filter pills */}
        <Row gap={8}>
          {['all', 'planning', 'hiring', 'active', 'completed'].map((s) => (
            <Pressable key={s} onPress={() => setStatusFilter(s)}>
              <Stack
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 16,
                  backgroundColor:
                    statusFilter === s ? colors.fg[theme].active : colors.bg[theme].subtle,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    color: statusFilter === s ? '#fff' : colors.text[theme].secondary,
                  }}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)} ({statusCounts[s] ?? 0})
                </Text>
              </Stack>
            </Pressable>
          ))}
        </Row>

        {/* Project list */}
        <Stack gap={12}>
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onPress={() => setSelectedProject(project)}
            />
          ))}
          {filteredProjects.length === 0 && (
            <Card variant="glass" padding="lg" style={{ backgroundColor: colors.bg[theme].subtle }}>
              <Stack align="center" gap={8}>
                <Search size={24} color={colors.icon[theme].default} />
                <Text style={{ color: colors.text[theme].secondary }}>
                  No projects match your filters
                </Text>
              </Stack>
            </Card>
          )}
        </Stack>
      </Stack>
    </ScrollView>
  )
}
