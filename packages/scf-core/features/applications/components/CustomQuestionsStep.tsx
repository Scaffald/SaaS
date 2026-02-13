import type { CustomQuestionAnswer } from '@scf/schemas'
import { ToggleSwitch } from '@unicornlove/beyond-ui'
import { ArrowLeft } from 'lucide-react-native'
import { useState } from 'react'
import { Button, Input, Label, Text, TextArea, Row, Stack } from '@unicornlove/beyond-ui'

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
    <Stack gap={24} width="100%" maxWidth={800} padding={16}>
      {/* Header */}
      <Stack gap={8}>
        <Text color="gray">Additional Questions</Text>
        <Text color="gray">The employer has requested additional information</Text>
      </Stack>

      {/* Validation Summary */}
      {Object.entries(errors).some(([, error]) => error !== undefined) && (
        <Stack
          padding={16}
          borderRadius={16}
          backgroundColor="$red2"
          borderWidth={1}
          borderColor="$red7"
          gap={8}
        >
          <Text color="$red11">Please complete the following:</Text>
          <Stack gap={4}>
            {Object.entries(errors)
              .filter(([, error]) => error !== undefined)
              .map(([questionId, error]) => {
                const question = questions.find((q) => q.id === questionId)
                return (
                  <Text key={questionId} color="$red11">
                    • {question?.question || 'Question'}: {error}
                  </Text>
                )
              })}
          </Stack>
        </Stack>
      )}

      {/* Questions */}
      <Stack gap={20}>
        {questions.map((question, index) => (
          <Stack key={question.id} gap={8}>
            <Label>
              {index + 1}. {question.question}
              {question.required && (
                <Text color="$red10" marginLeft={4}>
                  *
                </Text>
              )}
            </Label>

            {/* Short Text Input */}
            {question.type === 'short_text' && (
              <Stack gap={8}>
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
                <Row justify="flex-end">
                  <Text
                    color={
                      getCharacterCount(question.id) > getMaxLength(question) ? '$red10' : '$gray11'
                    }
                  >
                    {getCharacterCount(question.id)} / {getMaxLength(question)} characters
                  </Text>
                </Row>
              </Stack>
            )}

            {/* Long Text Input */}
            {question.type === 'long_text' && (
              <Stack gap={8}>
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
                <Row justify="flex-end">
                  <Text
                    color={
                      getCharacterCount(question.id) > getMaxLength(question) ? '$red10' : '$gray11'
                    }
                  >
                    {getCharacterCount(question.id)} / {getMaxLength(question)} characters
                  </Text>
                </Row>
              </Stack>
            )}

            {/* Single Choice (Radio Buttons) */}
            {question.type === 'single_choice' && question.options && (
              <Stack gap={8}>
                {question.options.map((option) => (
                  <Row
                    key={option}
                    gap={12}
                    align="center"
                    padding={12}
                    borderRadius={16}
                    borderWidth={1}
                    borderColor={
                      getAnswer(question.id) === option
                        ? '$blue9'
                        : errors[question.id]
                          ? '$red9'
                          : '$borderColor'
                    }
                    backgroundColor={getAnswer(question.id) === option ? '$blue2' : '$background'}
                    pressStyle={{ scale: 0.98 }}
                    onPress={() =>
                      updateAnswer(question.id, question.question, 'single_choice', option)
                    }
                    cursor="pointer"
                    disabled={isSubmitting}
                  >
                    <Stack
                      width={20}
                      height={20}
                      borderRadius="$12"
                      borderWidth={2}
                      borderColor={getAnswer(question.id) === option ? '$blue9' : '$borderColor'}
                      justify="center"
                      align="center"
                      backgroundColor="$background"
                    >
                      {getAnswer(question.id) === option && (
                        <Stack width={12} height={12} borderRadius="$12" backgroundColor="$blue9" />
                      )}
                    </Stack>
                    <Text color="gray" flex={1}>
                      {option}
                    </Text>
                  </Row>
                ))}
              </Stack>
            )}

            {/* Multiple Choice (Checkboxes) */}
            {question.type === 'multiple_choice' && question.options && (
              <Stack gap={8}>
                {question.options.map((option) => {
                  const currentAnswers = (getAnswer(question.id) as string[]) || []
                  const isSelected = currentAnswers.includes(option)

                  return (
                    <Row
                      key={option}
                      gap={12}
                      align="center"
                      padding={12}
                      borderRadius={16}
                      borderWidth={1}
                      borderColor={
                        isSelected ? '$blue9' : errors[question.id] ? '$red9' : '$borderColor'
                      }
                      backgroundColor={isSelected ? '$blue2' : '$background'}
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
                      <Stack
                        width={20}
                        height={20}
                        borderRadius={8}
                        borderWidth={2}
                        borderColor={isSelected ? '$blue9' : '$borderColor'}
                        justify="center"
                        align="center"
                        backgroundColor={isSelected ? '$blue9' : '$background'}
                      >
                        {isSelected && <Text color="white">✓</Text>}
                      </Stack>
                      <Text color="gray" flex={1}>
                        {option}
                      </Text>
                    </Row>
                  )
                })}
              </Stack>
            )}

            {/* Yes/No Toggle */}
            {question.type === 'yes_no' && (
              <Row gap={16} align="center">
                <ToggleSwitch
                  checked={(getAnswer(question.id) as boolean) || false}
                  onCheckedChange={(checked) =>
                    updateAnswer(question.id, question.question, 'yes_no', checked)
                  }
                  disabled={isSubmitting}
                  aria-label={`${question.question} toggle`}
                />
                <Text color="gray">{(getAnswer(question.id) as boolean) ? 'Yes' : 'No'}</Text>
              </Row>
            )}

            {/* Error Message */}
            {errors[question.id] && <Text color="$red10">{errors[question.id]}</Text>}
          </Stack>
        ))}
      </Stack>

      {/* No Questions Message */}
      {questions.length === 0 && (
        <Stack
          padding={24}
          align="center"
          gap={8}
          backgroundColor="$background"
          borderRadius={16}
          borderWidth={1}
          borderColor="$borderColor"
        >
          <Text color="gray" textAlign="center">
            This position has no additional questions.
          </Text>
          <Text color="gray" textAlign="center">
            You can proceed to the next step.
          </Text>
        </Stack>
      )}

      {/* Navigation Buttons */}
      <Row gap={12} justify="space-between" marginTop={16}>
        <Button
          size={16}
          variant="outline"
          icon={ArrowLeft}
          onPress={onPrevious}
          disabled={isSubmitting}
        >
          Previous
        </Button>
        <Button
          size={16}
          theme="info"
          onPress={validateAndContinue}
          disabled={isSubmitting || Object.values(errors).some((error) => error !== undefined)}
        >
          {isSubmitting ? 'Saving...' : 'Continue'}
        </Button>
      </Row>
    </Stack>
  )
}
