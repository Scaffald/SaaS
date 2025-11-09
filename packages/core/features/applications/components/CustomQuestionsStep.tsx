import { useState } from 'react'
import { Button, Input, Label, Text, TextArea, XStack, YStack } from 'tamagui'
import { ArrowLeft } from '@tamagui/lucide-icons'
import type { CustomQuestionAnswer } from '@app/schemas'
import { ToggleSwitch } from '@app/ui'

export interface CustomQuestion {
  id: string
  question: string
  type: 'short_text' | 'long_text' | 'single_choice' | 'multiple_choice' | 'yes_no'
  required: boolean
  options?: string[]
}

export interface CustomQuestionsStepProps {
  /**
   * Array of custom questions to display
   */
  questions: CustomQuestion[]

  /**
   * Current answers
   */
  answers: CustomQuestionAnswer[]

  /**
   * Callback when answers change
   */
  onAnswersChange: (answers: CustomQuestionAnswer[]) => void

  /**
   * Callback to go to previous step
   */
  onPrevious: () => void

  /**
   * Callback to continue to next step
   */
  onContinue: () => void

  /**
   * Whether the form is being submitted
   */
  isSubmitting?: boolean
}

/**
 * CustomQuestionsStep - Renders dynamic job-specific questions
 *
 * Question types:
 * - Short text (single line input)
 * - Long text (textarea)
 * - Single choice (radio buttons)
 * - Multiple choice (checkboxes)
 * - Yes/No (toggle switch)
 */
export function CustomQuestionsStep({
  questions,
  answers,
  onAnswersChange,
  onPrevious,
  onContinue,
  isSubmitting = false,
}: CustomQuestionsStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  /**
   * Get answer for a specific question
   */
  const getAnswer = (questionId: string): string | string[] | boolean | undefined => {
    const answer = answers.find((a) => a.question_id === questionId)
    return answer?.answer
  }

  /**
   * Update answer for a specific question
   */
  const updateAnswer = (
    questionId: string,
    question: string,
    type: CustomQuestion['type'],
    value: string | string[] | boolean
  ) => {
    const newAnswers = [...answers]
    const existingIndex = newAnswers.findIndex((a) => a.question_id === questionId)

    const newAnswer: CustomQuestionAnswer = {
      question_id: questionId,
      question,
      type,
      answer: value,
    }

    if (existingIndex >= 0) {
      newAnswers[existingIndex] = newAnswer
    } else {
      newAnswers.push(newAnswer)
    }

    onAnswersChange(newAnswers)

    // Clear error for this question
    if (errors[questionId]) {
      const newErrors = { ...errors }
      delete newErrors[questionId]
      setErrors(newErrors)
    }
  }

  /**
   * Validate all required questions before continuing
   */
  const validateAndContinue = () => {
    const newErrors: Record<string, string> = {}

    for (const question of questions) {
      if (question.required) {
        const answer = getAnswer(question.id)

        if (answer === undefined || answer === null || answer === '') {
          newErrors[question.id] = 'This question is required'
        } else if (Array.isArray(answer) && answer.length === 0) {
          newErrors[question.id] = 'Please select at least one option'
        }
      }
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      onContinue()
    }
  }

  return (
    <YStack gap="$6" width="100%" maxW={800} p="$4">
      {/* Header */}
      <YStack gap="$2">
        <Text fontSize="$8" fontWeight="bold" color="$color12">
          Additional Questions
        </Text>
        <Text fontSize="$4" color="$color11">
          Please answer the following questions about this position.
        </Text>
      </YStack>

      {/* Questions */}
      <YStack gap="$5">
        {questions.map((question, index) => (
          <YStack key={question.id} gap="$2">
            <Label fontSize="$4" fontWeight="600">
              {index + 1}. {question.question}
              {question.required && (
                <Text color="$red10" ml="$1">
                  *
                </Text>
              )}
            </Label>

            {/* Short Text Input */}
            {question.type === 'short_text' && (
              <Input
                value={(getAnswer(question.id) as string) || ''}
                onChangeText={(text) =>
                  updateAnswer(question.id, question.question, 'short_text', text)
                }
                placeholder="Your answer"
                borderColor={errors[question.id] ? '$red9' : '$borderColor'}
                disabled={isSubmitting}
              />
            )}

            {/* Long Text Input */}
            {question.type === 'long_text' && (
              <TextArea
                value={(getAnswer(question.id) as string) || ''}
                onChangeText={(text) =>
                  updateAnswer(question.id, question.question, 'long_text', text)
                }
                placeholder="Your answer"
                style={{ height: 120 }}
                borderColor={errors[question.id] ? '$red9' : '$borderColor'}
                disabled={isSubmitting}
              />
            )}

            {/* Single Choice (Radio Buttons) */}
            {question.type === 'single_choice' && question.options && (
              <YStack gap="$2">
                {question.options.map((option) => (
                  <XStack
                    key={option}
                    gap="$3"
                    items="center"
                    p="$3"
                    rounded="$4"
                    borderWidth={1}
                    borderColor={
                      getAnswer(question.id) === option
                        ? '$blue9'
                        : errors[question.id]
                          ? '$red9'
                          : '$borderColor'
                    }
                    bg={getAnswer(question.id) === option ? '$blue2' : '$background'}
                    pressStyle={{ scale: 0.98 }}
                    onPress={() =>
                      updateAnswer(question.id, question.question, 'single_choice', option)
                    }
                    cursor="pointer"
                    disabled={isSubmitting}
                  >
                    <YStack
                      width={20}
                      height={20}
                      rounded="$12"
                      borderWidth={2}
                      borderColor={getAnswer(question.id) === option ? '$blue9' : '$borderColor'}
                      justify="center"
                      items="center"
                      bg="$background"
                    >
                      {getAnswer(question.id) === option && (
                        <YStack width={12} height={12} rounded="$12" bg="$blue9" />
                      )}
                    </YStack>
                    <Text fontSize="$3" color="$color12" flex={1}>
                      {option}
                    </Text>
                  </XStack>
                ))}
              </YStack>
            )}

            {/* Multiple Choice (Checkboxes) */}
            {question.type === 'multiple_choice' && question.options && (
              <YStack gap="$2">
                {question.options.map((option) => {
                  const currentAnswers = (getAnswer(question.id) as string[]) || []
                  const isSelected = currentAnswers.includes(option)

                  return (
                    <XStack
                      key={option}
                      gap="$3"
                      items="center"
                      p="$3"
                      rounded="$4"
                      borderWidth={1}
                      borderColor={
                        isSelected ? '$blue9' : errors[question.id] ? '$red9' : '$borderColor'
                      }
                      bg={isSelected ? '$blue2' : '$background'}
                      pressStyle={{ scale: 0.98 }}
                      onPress={() => {
                        const newAnswers = isSelected
                          ? currentAnswers.filter((a) => a !== option)
                          : [...currentAnswers, option]
                        updateAnswer(question.id, question.question, 'multiple_choice', newAnswers)
                      }}
                      cursor="pointer"
                      disabled={isSubmitting}
                    >
                      <YStack
                        width={20}
                        height={20}
                        rounded="$2"
                        borderWidth={2}
                        borderColor={isSelected ? '$blue9' : '$borderColor'}
                        justify="center"
                        items="center"
                        bg={isSelected ? '$blue9' : '$background'}
                      >
                        {isSelected && (
                          <Text fontSize="$3" fontWeight="bold" color="white">
                            ✓
                          </Text>
                        )}
                      </YStack>
                      <Text fontSize="$3" color="$color12" flex={1}>
                        {option}
                      </Text>
                    </XStack>
                  )
                })}
              </YStack>
            )}

            {/* Yes/No Toggle */}
            {question.type === 'yes_no' && (
              <XStack gap="$4" items="center">
                <ToggleSwitch
                  checked={(getAnswer(question.id) as boolean) || false}
                  onCheckedChange={(checked) =>
                    updateAnswer(question.id, question.question, 'yes_no', checked)
                  }
                  disabled={isSubmitting}
                  aria-label={`${question.question} toggle`}
                />
                <Text fontSize="$3" color="$color11">
                  {(getAnswer(question.id) as boolean) ? 'Yes' : 'No'}
                </Text>
              </XStack>
            )}

            {/* Error Message */}
            {errors[question.id] && (
              <Text fontSize="$2" color="$red10">
                {errors[question.id]}
              </Text>
            )}
          </YStack>
        ))}
      </YStack>

      {/* No Questions Message */}
      {questions.length === 0 && (
        <YStack
          p="$6"
          items="center"
          gap="$2"
          bg="$background"
          rounded="$4"
          borderWidth={1}
          borderColor="$borderColor"
        >
          <Text fontSize="$4" color="$color11" text="center">
            This position has no additional questions.
          </Text>
          <Text fontSize="$3" color="$color10" text="center">
            You can proceed to the next step.
          </Text>
        </YStack>
      )}

      {/* Navigation Buttons */}
      <XStack gap="$3" justify="space-between" mt="$4">
        <Button
          size="$4"
          variant="outlined"
          icon={ArrowLeft}
          onPress={onPrevious}
          disabled={isSubmitting}
        >
          Previous
        </Button>
        <Button size="$4" theme="info" onPress={validateAndContinue} disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Continue'}
        </Button>
      </XStack>
    </YStack>
  )
}
