import {
  Button,
  Input,
  ResponsiveSelect,
  Sheet,
  Text,
  ToggleSwitch,
  XStack,
  YStack,
} from '@unicornlove/ui'
import { Plus, X } from '@tamagui/lucide-icons'
import { useState } from 'react'
import { Card, Label, Switch } from '@unicornlove/ui'

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
    <YStack
      gap="$4"
      padding="$4"
      backgroundColor="$background"
      borderRadius="$4"
      borderWidth={1}
      borderColor="$borderColor"
    >
      <Text fontSize="$6" fontWeight="600">
        Application Process
      </Text>
      <Text fontSize="$2" color="$color10">
        Configure the application process and requirements
      </Text>

      {/* Requires Assessment */}
      <XStack gap="$3" alignItems="center" justifyContent="space-between">
        <YStack gap="$1" flex={1}>
          <Label>Requires assessment</Label>
          <Text fontSize="$2" color="$color10">
            Skills or aptitude test required
          </Text>
        </YStack>
        <ToggleSwitch
          checked={localState.requires_assessment || false}
          onCheckedChange={(checked) => handleChange('requires_assessment', checked)}
          aria-label="Requires assessment"
        />
      </XStack>

      {localState.requires_assessment && (
        <YStack gap="$2">
          <Label>Assessment details</Label>
          <Input
            placeholder="Describe the assessment or test"
            value={localState.assessment_details || ''}
            onChangeText={(text) => handleChange('assessment_details', text || undefined)}
          />
        </YStack>
      )}

      {/* Requires Video Interview */}
      <XStack gap="$3" alignItems="center" justifyContent="space-between">
        <YStack gap="$1" flex={1}>
          <Label>Requires video interview</Label>
          <Text fontSize="$2" color="$color10">
            Pre-recorded video interview required
          </Text>
        </YStack>
        <ToggleSwitch
          checked={localState.requires_video_interview || false}
          onCheckedChange={(checked) => handleChange('requires_video_interview', checked)}
          aria-label="Requires video interview"
        />
      </XStack>

      {/* Estimated Application Time */}
      <YStack gap="$2">
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
        <Text fontSize="$2" color="$color10">
          How long it takes to complete the application
        </Text>
      </YStack>

      {/* Application Expiry */}
      <YStack gap="$2">
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
        <Text fontSize="$2" color="$color10">
          Days after which started applications expire
        </Text>
      </YStack>

      {/* Inquiry Capability Questions */}
      <YStack
        gap="$3"
        marginTop="$4"
        paddingTop="$4"
        borderTopWidth={1}
        borderTopColor="$borderColor"
      >
        <YStack gap="$1">
          <Text fontSize="$5" fontWeight="600">
            Inquiry Capability Questions
          </Text>
          <Text fontSize="$2" color="$color10">
            Define capability questions that will be asked during the inquiry phase
          </Text>
        </YStack>

        {/* Existing Questions */}
        {localState.inquiry_capability_questions &&
          localState.inquiry_capability_questions.length > 0 && (
            <YStack gap="$2">
              {localState.inquiry_capability_questions.map((question, index) => (
                <Card key={question.name} padding="$3" gap="$2" backgroundColor="$color2">
                  <XStack justifyContent="space-between" alignItems="center">
                    <YStack flex={1} gap="$1">
                      <Text fontSize="$4" fontWeight="500">
                        {question.label}
                      </Text>
                      <XStack gap="$2">
                        <Text fontSize="$2" color="$color11">
                          Type: {question.type}
                        </Text>
                        {question.unit && (
                          <Text fontSize="$2" color="$color11">
                            Unit: {question.unit}
                          </Text>
                        )}
                        {question.required && (
                          <Text fontSize="$2" color="$blue10" fontWeight="600">
                            Required
                          </Text>
                        )}
                      </XStack>
                    </YStack>
                    <Button
                      size="$2"
                      variant="outlined"
                      icon={X}
                      onPress={() => handleRemoveQuestion(index)}
                      aria-label="Remove question"
                    />
                  </XStack>
                </Card>
              ))}
            </YStack>
          )}

        {/* Add Question Button */}
        <Button variant="outlined" icon={Plus} onPress={() => setShowAddQuestionModal(true)}>
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
          <Sheet.Frame padding="$4" gap="$4">
            <YStack gap="$3">
              <Text fontSize="$6" fontWeight="600">
                Add Capability Question
              </Text>

              {/* Question Label */}
              <YStack gap="$2">
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
              </YStack>

              {/* Question Type */}
              <YStack gap="$2">
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
              </YStack>

              {/* Unit (for number type) */}
              {newQuestion.type === 'number' && (
                <YStack gap="$2">
                  <Label>Unit (optional)</Label>
                  <Input
                    placeholder="e.g., Pounds, Hours, Miles"
                    value={newQuestion.unit || ''}
                    onChangeText={(text) => setNewQuestion({ ...newQuestion, unit: text })}
                  />
                </YStack>
              )}

              {/* Required */}
              <XStack gap="$2" alignItems="center">
                <Switch
                  checked={newQuestion.required || false}
                  onCheckedChange={(checked) =>
                    setNewQuestion({ ...newQuestion, required: checked })
                  }
                />
                <Text fontSize="$3">Required</Text>
              </XStack>

              {/* Actions */}
              <XStack gap="$3" justifyContent="flex-end" marginTop="$2">
                <Button
                  variant="outlined"
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
                  theme="blue"
                  onPress={handleAddQuestion}
                  disabled={!newQuestion.label || !newQuestion.type}
                >
                  Add Question
                </Button>
              </XStack>
            </YStack>
          </Sheet.Frame>
          <Sheet.Overlay />
        </Sheet>
      </YStack>
    </YStack>
  )
}
