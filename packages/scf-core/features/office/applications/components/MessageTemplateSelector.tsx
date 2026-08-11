/**
 * Template selector for recruiter messaging.
 * Shows available templates for the current stage with preview and variable substitution.
 *
 * @see Issue #89
 */

import { BookTemplate, ChevronDown, ChevronUp, FileText } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, ScrollView } from 'react-native'
import { Button, Card, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import type { ApplicationStatus } from '../types'
import type { MessageTemplate } from './message-templates'
import { STAGE_LABELS } from './message-templates'

interface MessageTemplateSelectorProps {
  /** Current application stage */
  stage: ApplicationStatus
  /** Available templates for this stage */
  templates: MessageTemplate[]
  /** Called when a template is selected */
  onSelect: (template: MessageTemplate) => void
  /** Called to open the template manager */
  onManageTemplates?: () => void
}

export function MessageTemplateSelector({
  stage,
  templates,
  onSelect,
  onManageTemplates,
}: MessageTemplateSelectorProps) {
  const { theme } = useThemeContext()
  const [isExpanded, setIsExpanded] = useState(false)

  if (templates.length === 0) {
    return null
  }

  return (
    <Stack gap={8}>
      <Pressable onPress={() => setIsExpanded(!isExpanded)}>
        <Row
          gap={8}
          align="center"
          padding="sm"
          style={{
            backgroundColor: colors.bg[theme].subtle,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border[theme].default,
          }}
        >
          <BookTemplate size={16} color={colors.icon[theme].default} />
          <Text style={{ flex: 1, color: colors.text[theme].secondary }}>
            Templates for {STAGE_LABELS[stage] || stage}
          </Text>
          <Text style={{ color: colors.text[theme].tertiary }}>
            {templates.length}
          </Text>
          {isExpanded ? (
            <ChevronUp size={16} color={colors.icon[theme].default} />
          ) : (
            <ChevronDown size={16} color={colors.icon[theme].default} />
          )}
        </Row>
      </Pressable>

      {isExpanded && (
        <Stack gap={4}>
          <ScrollView
            style={{ maxHeight: 200 }}
            showsVerticalScrollIndicator={false}
          >
            <Stack gap={4}>
              {templates.map((template) => (
                <Pressable
                  key={template.id}
                  onPress={() => {
                    onSelect(template)
                    setIsExpanded(false)
                  }}
                >
                  <Card
                    padding="sm"
                    style={{
                      backgroundColor: colors.bg[theme].default,
                      borderWidth: 1,
                      borderColor: colors.border[theme].default,
                    }}
                  >
                    <Row gap={8} align="center">
                      <FileText size={14} color={colors.icon[theme].default} />
                      <Stack style={{ flex: 1 }}>
                        <Text style={{ color: colors.text[theme].primary }}>
                          {template.name}
                        </Text>
                        <Text
                          style={{
                            color: colors.text[theme].tertiary,
                            fontSize: 12,
                          }}
                          numberOfLines={1}
                        >
                          {template.body.substring(0, 80)}...
                        </Text>
                      </Stack>
                      {template.isDefault && (
                        <Text
                          style={{
                            color: colors.text[theme].tertiary,
                            fontSize: 10,
                          }}
                        >
                          Default
                        </Text>
                      )}
                    </Row>
                  </Card>
                </Pressable>
              ))}
            </Stack>
          </ScrollView>

          {onManageTemplates && (
            <Button
              variant="outline"
              size="sm"
              onPress={onManageTemplates}
            >
              Manage Templates
            </Button>
          )}
        </Stack>
      )}
    </Stack>
  )
}
