/**
 * Evidence Panel - Manage skill evidence items (certs, projects, review excerpts, work logs)
 * Allows viewing, adding, and deleting evidence linked to skills.
 */

import { useState } from 'react'
import {
  DashboardWidget,
  DashboardWidgetHeader,
  Button,
  Spinner,
  Text,
  Row,
  Stack,
  ResponsiveModal,
  Input,
  TextArea,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import {
  Award,
  Briefcase,
  FileText,
  Link2,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Clock,
} from 'lucide-react-native'
import {
  useSkillEvidence,
  useCreateEvidenceMutation,
  useDeleteEvidenceMutation,
} from '../../../utils/skill-analytics-sdk-hooks'
// Types defined locally until SDK dist is rebuilt (TS2614 workaround)
type SkillEvidenceType = 'certification' | 'project' | 'review_excerpt' | 'work_log' | 'custom'

interface SkillEvidence {
  id: string
  userId: string
  softSkillId: string | null
  skillTaxonomy: string | null
  skillRefId: string | null
  evidenceType: SkillEvidenceType
  title: string
  description: string | null
  url: string | null
  verified: boolean
  verifiedBy: string | null
  verifiedAt: string | null
  createdAt: string
  updatedAt: string
}

const EVIDENCE_TYPE_CONFIG: Record<
  SkillEvidenceType,
  { label: string; icon: typeof Award; color: string }
> = {
  certification: { label: 'Certification', icon: Award, color: colors.blue[500] },
  project: { label: 'Project', icon: Briefcase, color: colors.purple[500] },
  review_excerpt: { label: 'Review Excerpt', icon: FileText, color: colors.green[500] },
  work_log: { label: 'Work Log', icon: Clock, color: colors.orange[500] },
  custom: { label: 'Custom', icon: Link2, color: colors.gray[500] },
}

interface EvidencePanelProps {
  softSkillId?: string
  skillTaxonomy?: string
  skillRefId?: string
  showAdd?: boolean
}

export function EvidencePanel({
  softSkillId,
  skillTaxonomy,
  skillRefId,
  showAdd = true,
}: EvidencePanelProps) {
  const { theme } = useThemeContext()
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [newType, setNewType] = useState<SkillEvidenceType>('custom')

  const { data: evidence, isLoading } = useSkillEvidence(
    softSkillId ? { softSkillId } : skillTaxonomy ? { skillTaxonomy, skillRefId } : undefined
  )

  const createMutation = useCreateEvidenceMutation()
  const deleteMutation = useDeleteEvidenceMutation()

  const handleAdd = async () => {
    if (!newTitle.trim()) return

    await createMutation.mutateAsync({
      softSkillId: softSkillId || undefined,
      skillTaxonomy: skillTaxonomy || undefined,
      skillRefId: skillRefId || undefined,
      evidenceType: newType,
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      url: newUrl.trim() || undefined,
    })

    setNewTitle('')
    setNewDescription('')
    setNewUrl('')
    setNewType('custom')
    setAddModalOpen(false)
  }

  const handleDelete = async (evidenceId: string) => {
    await deleteMutation.mutateAsync({ evidenceId })
  }

  if (isLoading) {
    return (
      <DashboardWidget>
        <Stack gap={10} align="center" paddingVertical={40}>
          <Spinner variant="ios" size="lg" color="primary" />
        </Stack>
      </DashboardWidget>
    )
  }

  const items = evidence?.evidence ?? []

  return (
    <DashboardWidget>
      <DashboardWidgetHeader
        title="Evidence"
        action={
          showAdd ? (
            <Button
              size="sm"
              variant="outline"
              iconStart={Plus}
              onPress={() => setAddModalOpen(true)}
            >
              Add
            </Button>
          ) : null
        }
      />

      {items.length === 0 ? (
        <Stack gap={8} align="center" paddingVertical={24}>
          <Text
            style={{
              color: colors.text[theme].tertiary,
              fontSize: 13,
              textAlign: 'center',
            }}
          >
            No evidence added yet. Add certifications, projects, or other proof of your skills.
          </Text>
        </Stack>
      ) : (
        <Stack gap={4}>
          {items.map((item: SkillEvidence) => {
            const config = EVIDENCE_TYPE_CONFIG[item.evidenceType as SkillEvidenceType] ??
              EVIDENCE_TYPE_CONFIG.custom
            const Icon = config.icon

            return (
              <Row
                key={item.id}
                gap={10}
                align="center"
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 8,
                  borderRadius: 6,
                  backgroundColor: colors.bg[theme].subtle,
                }}
              >
                <Icon size={16} color={config.color} />

                <Stack style={{ flex: 1 }} gap={2}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: colors.text[theme].primary,
                    }}
                  >
                    {item.title}
                  </Text>
                  {item.description && (
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.text[theme].tertiary,
                      }}
                      numberOfLines={1}
                    >
                      {item.description}
                    </Text>
                  )}
                </Stack>

                <Row gap={6} align="center">
                  {item.verified && (
                    <CheckCircle2 size={14} color={colors.green[500]} />
                  )}
                  {item.url && (
                    <ExternalLink size={14} color={colors.text[theme].tertiary} />
                  )}
                  {showAdd && (
                    <Button
                      size="sm"
                      variant="text"
                      iconStart={Trash2}
                      onPress={() => handleDelete(item.id)}
                      testID={`delete-evidence-${item.id}`}
                    />
                  )}
                </Row>
              </Row>
            )
          })}
        </Stack>
      )}

      {/* Add Evidence Modal */}
      <ResponsiveModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        title="Add Evidence"
        size="md"
      >
        <Stack gap={16} padding="md">
          {/* Evidence Type Selector */}
          <Stack gap={6}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text[theme].primary }}>
              Type
            </Text>
            <Row gap={6} style={{ flexWrap: 'wrap' }}>
              {(Object.keys(EVIDENCE_TYPE_CONFIG) as SkillEvidenceType[])
                .filter((t) => t !== 'review_excerpt') // auto-generated only
                .map((type) => {
                  const config = EVIDENCE_TYPE_CONFIG[type]
                  const isActive = newType === type
                  return (
                    <Button
                      key={type}
                      size="sm"
                      variant={isActive ? 'filled' : 'outline'}
                      color={isActive ? 'primary' : undefined}
                      onPress={() => setNewType(type)}
                    >
                      {config.label}
                    </Button>
                  )
                })}
            </Row>
          </Stack>

          {/* Title */}
          <Stack gap={4}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text[theme].primary }}>
              Title
            </Text>
            <Input
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="e.g. AWS Solutions Architect Certification"
            />
          </Stack>

          {/* Description */}
          <Stack gap={4}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text[theme].primary }}>
              Description (optional)
            </Text>
            <TextArea
              value={newDescription}
              onChangeText={setNewDescription}
              placeholder="Brief description of the evidence..."
              numberOfLines={3}
            />
          </Stack>

          {/* URL */}
          <Stack gap={4}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text[theme].primary }}>
              URL (optional)
            </Text>
            <Input
              value={newUrl}
              onChangeText={setNewUrl}
              placeholder="https://..."
            />
          </Stack>

          {/* Actions */}
          <Row gap={8} justify="flex-end">
            <Button variant="outline" onPress={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleAdd}
              disabled={!newTitle.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? 'Adding...' : 'Add Evidence'}
            </Button>
          </Row>
        </Stack>
      </ResponsiveModal>
    </DashboardWidget>
  )
}
