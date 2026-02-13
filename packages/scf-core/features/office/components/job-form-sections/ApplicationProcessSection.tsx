import { colors } from '@scaffald/ui/tokens'
import {
  Button,
  Card,
  Input,
  Label,
  ResponsiveSelect,
  Sheet,
  Switch,
  Text,
  ToggleSwitch,
  Row,
  Stack,
  useThemeContext,
} from '@scaffald/ui'
import { Plus, X } from 'lucide-react-native'
import { useState } from 'react'

interface CapabilityQuestion {
  name: string
  label: string
  type: 'boolean' | 'number' | 'text'
  unit?: string
  required: boolean
}

interface ApplicationProcessSectionProps {
  requiresAssessment?: boolean
  assessmentDetails?: string
  requiresVideoInterview?: boolean
  estimatedApplicationTimeMinutes?: number
  applicationExpiryDays?: number
  inquiryCapabilityQuestions?: CapabilityQuestion[]
  onUpdate: (data: {
    requires_assessment?: boolean
    assessment_details?: string
    requires_video_interview?: boolean
    estimated_application_time_minutes?: number
    application_expiry_days?: number
    inquiry_capability_questions?: CapabilityQuestion[]
  }) => void
}

export function ApplicationProcessSection({
  requiresAssessment,
  assessmentDetails,
  requiresVideoInterview,
  estimatedApplicationTimeMinutes,
  applicationExpiryDays,
  inquiryCapabilityQuestions,
  onUpdate,
}: ApplicationProcessSectionProps) {
  const { theme } = useThemeContext()
  const [localState, setLocalState] = useState({
    requires_assessment: requiresAssessment,
    assessment_details: assessmentDetails,
    requires_video_interview: requiresVideoInterview,
    estimated_application_time_minutes: estimatedApplicationTimeMinutes,
    application_expiry_days: applicationExpiryDays,
    inquiry_capability_questions: inquiryCapabilityQuestions || [],
  })

  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false)
  const [newQuestion, setNewQuestion] = useState<Partial<CapabilityQuestion>>({
    name: '',
    label: '',
    type: 'boolean',
    unit: '',
    required: false,
  })

  const handleChange = (
    key: keyof typeof localState,
    value: string | number | boolean | undefined | CapabilityQuestion[]
  ) => {
    const newState = { ...localState, [key]: value }
    setLocalState(newState)
    onUpdate(newState)
  }

  const handleAddQuestion = () => {
    if (!newQuestion.label || !newQuestion.type) return

    // Generate name from label if not provided
    let name =
      newQuestion.name ||
      newQuestion.label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')

    // Check if name already exists and make it unique
    const existingNames = (localState.inquiry_capability_questions || []).map((q) => q.name)
    if (existingNames.includes(name)) {
      let counter = 1
      let uniqueName = `${name}_${counter}`
      while (existingNames.includes(uniqueName)) {
        counter++
        uniqueName = `${name}_${counter}`
      }
      name = uniqueName
    }

    const question: CapabilityQuestion = {
      name,
      label: newQuestion.label,
      type: newQuestion.type as 'boolean' | 'number' | 'text',
      unit: newQuestion.type === 'number' ? newQuestion.unit : undefined,
      required: newQuestion.required || false,
    }

    const updated = [...(localState.inquiry_capability_questions || []), question]
    handleChange('inquiry_capability_questions', updated)

    setNewQuestion({ name: '', label: '', type: 'boolean', unit: '', required: false })
    setShowAddQuestionModal(false)
  }

  const handleRemoveQuestion = (index: number) => {
    const updated = (localState.inquiry_capability_questions || []).filter((_, i) => i !== index)
    handleChange('inquiry_capability_questions', updated)
  }

  return (
    <Stack
      gap={16}
      padding="md"
      style={{ backgroundColor: colors.bg[theme].default }}
      borderRadius={16}
      borderWidth={1}
      borderColor={colors.border[theme].default}
    >
      <Text>Application Process</Text>
      <Text style={{ color: colors.text[theme].secondary }}>
        Configure the application process and requirements
      </Text>

      {/* Requires Assessment */}
      <Row gap={12} align="center" justify="space-between">
        <Stack gap={4} flex={1}>
          <Label>Requires assessment</Label>
          <Text style={{ color: colors.text[theme].secondary }}>
            Skills or aptitude test required
          </Text>
        </Stack>
        <ToggleSwitch
          checked={localState.requires_assessment || false}
          onChange={(checked) => handleChange('requires_assessment', checked)}
          aria-label="Requires assessment"
        />
      </Row>

      {localState.requires_assessment && (
        <Stack gap={8}>
          <Label>Assessment details</Label>
          <Input
            placeholder="Describe the assessment or test"
            value={localState.assessment_details || ''}
            onChangeText={(text) => handleChange('assessment_details', text || undefined)}
          />
        </Stack>
      )}

      {/* Requires Video Interview */}
      <Row gap={12} align="center" justify="space-between">
        <Stack gap={4} flex={1}>
          <Label>Requires video interview</Label>
          <Text style={{ color: colors.text[theme].secondary }}>
            Pre-recorded video interview required
          </Text>
        </Stack>
        <ToggleSwitch
          checked={localState.requires_video_interview || false}
          onChange={(checked) => handleChange('requires_video_interview', checked)}
          aria-label="Requires video interview"
        />
      </Row>

      {/* Estimated Application Time */}
      <Stack gap={8}>
        <Label>Estimated application time (minutes)</Label>
        <Input
          placeholder="e.g. 15"
          keyboardType="numeric"
          value={localState.estimated_application_time_minutes?.toString() || ''}
          onChangeText={(text) => {
            const num = Number.parseInt(text, 10)
            handleChange('estimated_application_time_minutes', Number.isNaN(num) ? undefined : num)
          }}
        />
        <Text style={{ color: colors.text[theme].secondary }}>
          How long it takes to complete the application
        </Text>
      </Stack>

      {/* Application Expiry */}
      <Stack gap={8}>
        <Label>Application expiry (days)</Label>
        <Input
          placeholder="e.g. 30"
          keyboardType="numeric"
          value={localState.application_expiry_days?.toString() || ''}
          onChangeText={(text) => {
            const num = Number.parseInt(text, 10)
            handleChange('application_expiry_days', Number.isNaN(num) ? undefined : num)
          }}
        />
        <Text style={{ color: colors.text[theme].secondary }}>
          Days after which started applications expire
        </Text>
      </Stack>

      {/* Inquiry Capability Questions */}
      <Stack
        gap={12}
        marginTop={16}
        paddingTop={16}
        borderTopWidth={1}
        borderTopColor={colors.border[theme].default}
      >
        <Stack gap={4}>
          <Text>Inquiry Capability Questions</Text>
          <Text style={{ color: colors.text[theme].secondary }}>
            Define capability questions that will be asked during the inquiry phase
          </Text>
        </Stack>

        {/* Existing Questions */}
        {localState.inquiry_capability_questions &&
          localState.inquiry_capability_questions.length > 0 && (
            <Stack gap={8}>
              {localState.inquiry_capability_questions.map((question, index) => (
                <Card
                  key={question.name}
                  padding="sm"
                  gap={8}
                  style={{ backgroundColor: colors.bg[theme].subtle }}
                >
                  <Row justify="space-between" align="center">
                    <Stack flex={1} gap={4}>
                      <Text>{question.label}</Text>
                      <Row gap={8}>
                        <Text style={{ color: colors.text[theme].secondary }}>
                          Type: {question.type}
                        </Text>
                        {question.unit && (
                          <Text style={{ color: colors.text[theme].secondary }}>
                            Unit: {question.unit}
                          </Text>
                        )}
                        {question.required && (
                          <Text style={{ color: colors.text[theme].info }}>Required</Text>
                        )}
                      </Row>
                    </Stack>
                    <Button
                      size="xs"
                      variant="outline"
                      iconStart={X}
                      onPress={() => handleRemoveQuestion(index)}
                      aria-label="Remove question"
                    />
                  </Row>
                </Card>
              ))}
            </Stack>
          )}

        {/* Add Question Button */}
        <Button variant="outline" iconStart={Plus} onPress={() => setShowAddQuestionModal(true)}>
          Add Capability Question
        </Button>

        {/* Add Question Modal */}
        <Sheet
          modal
          open={showAddQuestionModal}
          onOpenChange={(nextOpen: boolean) => {
            setShowAddQuestionModal(nextOpen)
            if (!nextOpen) {
              setNewQuestion({ name: '', label: '', type: 'boolean', unit: '', required: false })
            }
          }}
        >
          <Sheet.Frame padding="md" gap={16}>
            <Stack gap={12}>
              <Text>Add Capability Question</Text>

              {/* Question Label */}
              <Stack gap={8}>
                <Label>Question Label *</Label>
                <Input
                  placeholder="e.g., Are you able to lift heavy objects?"
                  value={newQuestion.label || ''}
                  onChangeText={(text) =>
                    setNewQuestion({
                      ...newQuestion,
                      label: text,
                      name: text
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '_')
                        .replace(/^_+|_+$/g, ''),
                    })
                  }
                />
              </Stack>

              {/* Question Type */}
              <Stack gap={8}>
                <Label>Question Type *</Label>
                <ResponsiveSelect
                  value={newQuestion.type || 'boolean'}
                  onValueChange={(type) =>
                    setNewQuestion({
                      ...newQuestion,
                      type: type as 'boolean' | 'number' | 'text',
                    })
                  }
                  placeholder="Select type"
                  options={[
                    { value: 'boolean', label: 'Yes/No' },
                    { value: 'number', label: 'Numeric' },
                    { value: 'text', label: 'Text' },
                  ]}
                />
              </Stack>

              {/* Unit (for number type) */}
              {newQuestion.type === 'number' && (
                <Stack gap={8}>
                  <Label>Unit (optional)</Label>
                  <Input
                    placeholder="e.g., Pounds, Hours, Miles"
                    value={newQuestion.unit || ''}
                    onChangeText={(text) => setNewQuestion({ ...newQuestion, unit: text })}
                  />
                </Stack>
              )}

              {/* Required */}
              <Row gap={8} align="center">
                <Switch
                  checked={newQuestion.required || false}
                  onChange={(checked) => setNewQuestion({ ...newQuestion, required: checked })}
                />
                <Text>Required</Text>
              </Row>

              {/* Actions */}
              <Row gap={12} justify="flex-end" marginTop={8}>
                <Button
                  variant="outline"
                  onPress={() => {
                    setShowAddQuestionModal(false)
                    setNewQuestion({
                      name: '',
                      label: '',
                      type: 'boolean',
                      unit: '',
                      required: false,
                    })
                  }}
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onPress={handleAddQuestion}
                  disabled={!newQuestion.label || !newQuestion.type}
                >
                  Add Question
                </Button>
              </Row>
            </Stack>
          </Sheet.Frame>
          <Sheet.Overlay />
        </Sheet>
      </Stack>
    </Stack>
  )
}
