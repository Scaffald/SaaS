/**
 * Template management UI for creating, editing, and deleting message templates.
 *
 * @see Issue #89
 */

import { Plus, Trash2, Edit3, Save, X } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, ScrollView } from 'react-native'
import {
  Button,
  Card,
  H2,
  Text,
  TextArea,
  Input,
  Row,
  Stack,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import type { ApplicationStatus } from '../../mock-data/ats-mock-data'
import type { MessageTemplate } from './message-templates'
import { STAGE_LABELS, TEMPLATE_VARIABLES } from './message-templates'

const STAGE_OPTIONS: Array<ApplicationStatus | 'all'> = [
  'all',
  'new',
  'screen',
  'inquired',
  'interview',
  'offer',
  'hired',
  'rejected',
]

interface MessageTemplatesManagerProps {
  templates: MessageTemplate[]
  onCreate: (template: Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'isDefault'>) => void
  onUpdate: (id: string, updates: Partial<Pick<MessageTemplate, 'name' | 'body' | 'stage' | 'variables'>>) => void
  onDelete: (id: string) => void
  onClose: () => void
}

export function MessageTemplatesManager({
  templates,
  onCreate,
  onUpdate,
  onDelete,
  onClose,
}: MessageTemplatesManagerProps) {
  const { theme } = useThemeContext()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formBody, setFormBody] = useState('')
  const [formStage, setFormStage] = useState<ApplicationStatus | 'all'>('all')

  const resetForm = () => {
    setFormName('')
    setFormBody('')
    setFormStage('all')
    setIsCreating(false)
    setEditingId(null)
  }

  const startCreate = () => {
    resetForm()
    setIsCreating(true)
  }

  const startEdit = (template: MessageTemplate) => {
    setFormName(template.name)
    setFormBody(template.body)
    setFormStage(template.stage)
    setEditingId(template.id)
    setIsCreating(false)
  }

  const handleSave = () => {
    if (!formName.trim() || !formBody.trim()) return

    // Extract variables from body
    const variables = TEMPLATE_VARIABLES
      .filter((v) => formBody.includes(v.key))
      .map((v) => v.key)

    if (isCreating) {
      onCreate({ name: formName.trim(), body: formBody.trim(), stage: formStage, variables })
    } else if (editingId) {
      onUpdate(editingId, { name: formName.trim(), body: formBody.trim(), stage: formStage, variables })
    }
    resetForm()
  }

  const insertVariable = (key: string) => {
    setFormBody((prev) => `${prev}${key}`)
  }

  const isEditing = isCreating || editingId !== null

  return (
    <Stack gap={16} style={{ flex: 1 }}>
      {/* Header */}
      <Row justify="space-between" align="center">
        <H2>Message Templates</H2>
        <Row gap={8}>
          {!isEditing && (
            <Button size="sm" color="primary" onPress={startCreate} iconStart={Plus}>
              New Template
            </Button>
          )}
          <Button size="sm" variant="outline" onPress={onClose} iconStart={X}>
            Close
          </Button>
        </Row>
      </Row>

      {/* Form */}
      {isEditing && (
        <Card padding="md" style={{ backgroundColor: colors.bg[theme].subtle }}>
          <Stack gap={12}>
            <Text style={{ color: colors.text[theme].primary }}>
              {isCreating ? 'New Template' : 'Edit Template'}
            </Text>

            <Input
              placeholder="Template name"
              value={formName}
              onChangeText={setFormName}
            />

            {/* Stage selector */}
            <Stack gap={4}>
              <Text style={{ color: colors.text[theme].secondary, fontSize: 12 }}>Stage</Text>
              <Row gap={4} style={{ flexWrap: 'wrap' }}>
                {STAGE_OPTIONS.map((stage) => (
                  <Pressable key={stage} onPress={() => setFormStage(stage)}>
                    <Stack
                      padding="xs"
                      style={{
                        backgroundColor:
                          formStage === stage
                            ? colors.fg[theme].active
                            : colors.bg[theme].default,
                        borderRadius: 6,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderWidth: 1,
                        borderColor: colors.border[theme].default,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          color:
                            formStage === stage
                              ? '#fff'
                              : colors.text[theme].secondary,
                        }}
                      >
                        {STAGE_LABELS[stage]}
                      </Text>
                    </Stack>
                  </Pressable>
                ))}
              </Row>
            </Stack>

            <TextArea
              placeholder="Template body..."
              value={formBody}
              onChangeText={setFormBody}
              style={{ minHeight: 120 }}
            />

            {/* Variable insertion buttons */}
            <Stack gap={4}>
              <Text style={{ color: colors.text[theme].tertiary, fontSize: 11 }}>
                Insert variable:
              </Text>
              <Row gap={4} style={{ flexWrap: 'wrap' }}>
                {TEMPLATE_VARIABLES.map((v) => (
                  <Pressable key={v.key} onPress={() => insertVariable(v.key)}>
                    <Stack
                      style={{
                        backgroundColor: colors.bg[theme].default,
                        borderRadius: 4,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderWidth: 1,
                        borderColor: colors.border[theme].default,
                      }}
                    >
                      <Text style={{ fontSize: 11, color: colors.text[theme].secondary }}>
                        {v.label}
                      </Text>
                    </Stack>
                  </Pressable>
                ))}
              </Row>
            </Stack>

            <Row gap={8} justify="flex-end">
              <Button size="sm" variant="outline" onPress={resetForm}>
                Cancel
              </Button>
              <Button
                size="sm"
                color="primary"
                onPress={handleSave}
                disabled={!formName.trim() || !formBody.trim()}
                iconStart={Save}
              >
                Save
              </Button>
            </Row>
          </Stack>
        </Card>
      )}

      {/* Template List */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <Stack gap={8}>
          {templates.map((template) => (
            <Card
              key={template.id}
              padding="md"
              style={{
                backgroundColor: colors.bg[theme].default,
                borderWidth: 1,
                borderColor:
                  editingId === template.id
                    ? colors.border[theme].active
                    : colors.border[theme].default,
              }}
            >
              <Row justify="space-between" align="flex-start">
                <Stack style={{ flex: 1 }} gap={4}>
                  <Row gap={8} align="center">
                    <Text style={{ color: colors.text[theme].primary }}>
                      {template.name}
                    </Text>
                    <Stack
                      style={{
                        backgroundColor: colors.bg[theme].subtle,
                        borderRadius: 4,
                        paddingHorizontal: 6,
                        paddingVertical: 1,
                      }}
                    >
                      <Text style={{ fontSize: 10, color: colors.text[theme].tertiary }}>
                        {STAGE_LABELS[template.stage]}
                      </Text>
                    </Stack>
                    {template.isDefault && (
                      <Text style={{ fontSize: 10, color: colors.text[theme].tertiary }}>
                        Built-in
                      </Text>
                    )}
                  </Row>
                  <Text
                    style={{ color: colors.text[theme].tertiary, fontSize: 12 }}
                    numberOfLines={2}
                  >
                    {template.body}
                  </Text>
                  {template.usageCount > 0 && (
                    <Text style={{ color: colors.text[theme].tertiary, fontSize: 10 }}>
                      Used {template.usageCount} times
                    </Text>
                  )}
                </Stack>

                <Row gap={4}>
                  <Pressable onPress={() => startEdit(template)}>
                    <Edit3 size={16} color={colors.icon[theme].default} />
                  </Pressable>
                  {!template.isDefault && (
                    <Pressable onPress={() => onDelete(template.id)}>
                      <Trash2 size={16} color={colors.error[500]} />
                    </Pressable>
                  )}
                </Row>
              </Row>
            </Card>
          ))}
        </Stack>
      </ScrollView>
    </Stack>
  )
}
