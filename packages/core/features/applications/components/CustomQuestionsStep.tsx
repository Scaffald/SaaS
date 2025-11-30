import type { CustomQuestionAnswer } from '@app/schemas'
import { ToggleSwitch } from '@scaffald/tamagui-ui'
import { ArrowLeft } from '@tamagui/lucide-icons'
import { useState } from 'react'
import { Button, Input, Label, Text, TextArea, XStack, YStack } from 'tamagui'

export interface CustomQuestion {
  id: string
  question: string
  type: 'short_text' | 'long_text' | 'single_choice' | 'multiple_choice' | 'yes_no'
  required: boolean
  options?: string[]
  min_length?: number // Minimum characters for text questions (default: 50 for required)
  max_length?: number // Maximum characters for text questions (default: 1000)
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
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})

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
   * Get character count for text answer
   */
  const getCharacterCount = (questionId: string): number => {
    const answer = getAnswer(questionId)
    if (typeof answer === 'string') {
      return answer.length
    }
    return 0
  }

  /**
   * Get minimum length for a question
   */
  const getMinLength = (question: CustomQuestion): number => {
    if (question.min_length !== undefined) {
      return question.min_length
    }
    // Default: 50 characters for required questions, 0 for optional
    return question.required ? 50 : 0
  }

  /**
   * Get maximum length for a question
   */
  const getMaxLength = (question: CustomQuestion): number => {
    return question.max_length ?? 1000
  }

  /**
   * Validate a single question
   */
  const validateQuestion = (question: CustomQuestion): string | undefined => {
    const answer = getAnswer(question.id)

    // Required field validation
    if (question.required) {
      if (answer === undefined || answer === null || answer === '') {
        return 'This question is required'
      }

      if (Array.isArray(answer) && answer.length === 0) {
        return 'Please select at least one option'
      }
    }

    // Text length validation
    if (typeof answer === 'string' && answer.length > 0) {
      const minLength = getMinLength(question)
      const maxLength = getMaxLength(question)

      if (answer.length < minLength) {
        return `Please provide at least ${minLength} characters`
      }

      if (answer.length > maxLength) {
        return `Maximum ${maxLength} characters allowed`
      }
    }

    return undefined
  }

  /**
   * Validate all questions before continuing
   */
  const validateAndContinue = () => {
    const newErrors: Record<string, string> = {}

    for (const question of questions) {
      const error = validateQuestion(question)
      if (error) {
        newErrors[question.id] = error
      }
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      onContinue()
    }
  }

  /**
   * Handle text change with length validation
   */
  const handleTextChange = (
    questionId: string,
    question: string,
    type: 'short_text' | 'long_text',
    text: string,
    maxLength: number
  ) => {
    // Enforce maximum length
    const truncatedText = text.slice(0, maxLength)
    updateAnswer(questionId, question, type, truncatedText)

    // Clear error if validation passes
    const questionObj = questions.find((q) => q.id === questionId)
    if (questionObj) {
      const error = validateQuestion(questionObj)
      if (!error && errors[questionId]) {
        const newErrors = { ...errors }
        newErrors[questionId] = undefined
        setErrors(newErrors)
      }
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
          The employer has requested additional information
        </Text>
      </YStack>

      {/* Validation Summary */}
      {Object.entries(errors).some(([, error]) => error !== undefined) && (
        <YStack p="$4" rounded="$4" bg="$red2" borderWidth={1} borderColor="$red7" gap="$2">
          <Text fontSize="$4" fontWeight="600" color="$red11">
            Please complete the following:
          </Text>
          <YStack gap="$1">
            {Object.entries(errors)
              .filter(([, error]) => error !== undefined)
              .map(([questionId, error]) => {
                const question = questions.find((q) => q.id === questionId)
                return (
                  <Text key={questionId} fontSize="$3" color="$red11">
                    • {question?.question || 'Question'}: {error}
                  </Text>
                )
              })}
          </YStack>
        </YStack>
      )}

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
              <YStack gap="$2">
                <Input
                  value={(getAnswer(question.id) as string) || ''}
                  onChangeText={(text) =>
                    handleTextChange(
                      question.id,
                      question.question,
                      'short_text',
                      text,
                      getMaxLength(question)
                    )
                  }
                  placeholder="Type your answer here..."
                  borderColor={errors[question.id] ? '$red9' : '$borderColor'}
                  disabled={isSubmitting}
                  maxLength={getMaxLength(question)}
                />
                <XStack justify="flex-end">
                  <Text
                    fontSize="$2"
                    color={
                      getCharacterCount(question.id) > getMaxLength(question) ? '$red10' : '$gray11'
                    }
                  >
                    {getCharacterCount(question.id)} / {getMaxLength(question)} characters
                  </Text>
                </XStack>
              </YStack>
            )}

            {/* Long Text Input */}
            {question.type === 'long_text' && (
              <YStack gap="$2">
                <TextArea
                  value={(getAnswer(question.id) as string) || ''}
                  onChangeText={(text) =>
                    handleTextChange(
                      question.id,
                      question.question,
                      'long_text',
                      text,
                      getMaxLength(question)
                    )
                  }
                  placeholder="Type your answer here..."
                  style={{ minHeight: 120 }}
                  borderColor={errors[question.id] ? '$red9' : '$borderColor'}
                  disabled={isSubmitting}
                  maxLength={getMaxLength(question)}
                />
                <XStack justify="flex-end">
                  <Text
                    fontSize="$2"
                    color={
                      getCharacterCount(question.id) > getMaxLength(question) ? '$red10' : '$gray11'
                    }
                  >
                    {getCharacterCount(question.id)} / {getMaxLength(question)} characters
                  </Text>
                </XStack>
              </YStack>
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
        <Button
          size="$4"
          theme="info"
          onPress={validateAndContinue}
          disabled={isSubmitting || Object.values(errors).some((error) => error !== undefined)}
        >
          {isSubmitting ? 'Saving...' : 'Continue'}
        </Button>
      </XStack>
    </YStack>
  )
}
