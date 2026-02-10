/**
 * Data Request Form Component
 * REQ-3: CCPA Compliance Implementation
 *
 * Form for users to submit CCPA data requests:
 * - Data export (Right to Know)
 * - Data deletion (Right to Delete)
 * - Data correction (Right to Correct)
 */

import { useState } from 'react'
import { Button, Text, Row, Stack, Spinner } from '@unicornlove/beyond-ui'
import { api } from '@scf/core/utils/api'

/**
 * Request type options
 */
export type DataRequestType = 'export' | 'deletion' | 'correction'

/**
 * Props for DataRequestForm
 */
interface DataRequestFormProps {
  onSuccess?: (requestId: string) => void
  onCancel?: () => void
  initialType?: DataRequestType
}

/**
 * Request type metadata
 */
const REQUEST_TYPE_INFO: Record<
  DataRequestType,
  {
    title: string
    description: string
    confirmText: string
    buttonColor: string
    warning?: string
  }
> = {
  export: {
    title: 'Request My Data',
    description:
      'Request a copy of all personal information we have collected about you. This includes your profile information, documents, activities, and any other data associated with your account.',
    confirmText: 'Submit Export Request',
    buttonColor: '$blue10',
  },
  deletion: {
    title: 'Request Data Deletion',
    description:
      'Request the deletion of your personal information. Please note that some information may be retained for legal, regulatory, or business purposes as permitted under CCPA.',
    confirmText: 'Submit Deletion Request',
    buttonColor: '$red10',
    warning:
      'This action cannot be undone. Some data may be anonymized rather than deleted due to retention requirements. Financial and compliance records may be retained for up to 7 years.',
  },
  correction: {
    title: 'Request Data Correction',
    description:
      'Request correction of inaccurate personal information. Please describe what information is incorrect and what the correct information should be.',
    confirmText: 'Submit Correction Request',
    buttonColor: '$purple10',
  },
}

/**
 * Data categories that can be selected for export/deletion
 */
const DATA_CATEGORIES = [
  { id: 'profile', label: 'Profile Information', description: 'Name, email, phone, company info' },
  { id: 'documents', label: 'Documents', description: 'Uploaded files and certificates' },
  { id: 'policies', label: 'Insurance Policies', description: 'Policy records and coverage info' },
  { id: 'tasks', label: 'Tasks & Activities', description: 'Task history and completions' },
  { id: 'projects', label: 'Projects', description: 'Project data and assignments' },
  { id: 'compliance', label: 'Compliance Records', description: 'Compliance scores and issues' },
  { id: 'usage', label: 'Usage Data', description: 'Login history and feature usage' },
]

/**
 * Checkbox component
 */
function Checkbox({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
}) {
  return (
    <Row
      padding="$3"
      backgroundColor={checked ? '$blue2' : '$color2'}
      borderRadius="$2"
      borderWidth={1}
      borderColor={checked ? '$blue6' : '$borderColor'}
      cursor="pointer"
      onPress={() => onChange(!checked)}
      gap="$3"
      alignItems="flex-start"
    >
      <Stack
        width={20}
        height={20}
        borderRadius={4}
        borderWidth={2}
        borderColor={checked ? '$blue10' : '$color8'}
        backgroundColor={checked ? '$blue10' : 'transparent'}
        alignItems="center"
        justifyContent="center"
        marginTop={2}
      >
        {checked && (
          <Text color="white" fontSize="$2" fontWeight="bold">
            ✓
          </Text>
        )}
      </Stack>
      <Stack flex={1} gap="$1">
        <Text fontSize="$3" fontWeight="500">
          {label}
        </Text>
        {description && (
          <Text fontSize="$2" color="$color10">
            {description}
          </Text>
        )}
      </Stack>
    </Row>
  )
}

/**
 * Radio button component
 */
function RadioButton({
  selected,
  onSelect,
  label,
  description,
}: {
  selected: boolean
  onSelect: () => void
  label: string
  description?: string
}) {
  return (
    <Row
      padding="$3"
      backgroundColor={selected ? '$blue2' : '$color2'}
      borderRadius="$2"
      borderWidth={1}
      borderColor={selected ? '$blue6' : '$borderColor'}
      cursor="pointer"
      onPress={onSelect}
      gap="$3"
      alignItems="flex-start"
    >
      <Stack
        width={20}
        height={20}
        borderRadius={10}
        borderWidth={2}
        borderColor={selected ? '$blue10' : '$color8'}
        alignItems="center"
        justifyContent="center"
        marginTop={2}
      >
        {selected && (
          <Stack width={10} height={10} borderRadius={5} backgroundColor="$blue10" />
        )}
      </Stack>
      <Stack flex={1} gap="$1">
        <Text fontSize="$3" fontWeight="500">
          {label}
        </Text>
        {description && (
          <Text fontSize="$2" color="$color10">
            {description}
          </Text>
        )}
      </Stack>
    </Row>
  )
}

/**
 * Data Request Form Component
 */
export function DataRequestForm({ onSuccess, onCancel, initialType = 'export' }: DataRequestFormProps) {
  const [requestType, setRequestType] = useState<DataRequestType>(initialType)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [correctionDetails, _setCorrectionDetails] = useState('')
  const [confirmChecked, setConfirmChecked] = useState(false)
  const [step, setStep] = useState<'type' | 'categories' | 'confirm' | 'submitted'>('type')

  // Submit request mutation
  const submitRequest = api.ccpa.submitRequest.useMutation({
    onSuccess: (data) => {
      setStep('submitted')
      onSuccess?.(data.id)
    },
  })

  const typeInfo = REQUEST_TYPE_INFO[requestType]

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const selectAllCategories = () => {
    setSelectedCategories(DATA_CATEGORIES.map((c) => c.id))
  }

  const handleSubmit = () => {
    submitRequest.mutate({
      type: requestType,
      categories: selectedCategories.length > 0 ? selectedCategories : undefined,
      correctionDetails: requestType === 'correction' ? correctionDetails : undefined,
    })
  }

  // Submitted state
  if (step === 'submitted') {
    return (
      <Stack padding="$4" gap="$4" alignItems="center">
        <Stack
          width={80}
          height={80}
          borderRadius={40}
          backgroundColor="$green3"
          alignItems="center"
          justifyContent="center"
        >
          <Text fontSize="$8" color="$green10">
            ✓
          </Text>
        </Stack>
        <Text fontSize="$6" fontWeight="600" textAlign="center">
          Request Submitted
        </Text>
        <Text fontSize="$3" color="$color11" textAlign="center">
          Your {requestType === 'export' ? 'data export' : requestType === 'deletion' ? 'deletion' : 'correction'}{' '}
          request has been submitted. We will process your request within 45 days as required by CCPA.
        </Text>
        <Text fontSize="$3" color="$color11" textAlign="center">
          You will receive email updates about the status of your request.
        </Text>
        <Button onPress={onCancel} marginTop="$4">
          Close
        </Button>
      </Stack>
    )
  }

  return (
    <Stack gap="$4" padding="$4">
      {/* Header */}
      <Stack gap="$2">
        <Text fontSize="$6" fontWeight="600">
          {typeInfo.title}
        </Text>
        <Text fontSize="$3" color="$color11">
          {typeInfo.description}
        </Text>
      </Stack>

      {/* Step 1: Select Request Type */}
      {step === 'type' && (
        <Stack gap="$3">
          <Text fontSize="$4" fontWeight="500">
            Select Request Type
          </Text>
          <Stack gap="$2">
            <RadioButton
              selected={requestType === 'export'}
              onSelect={() => setRequestType('export')}
              label="Request My Data (Export)"
              description="Get a copy of all your personal information"
            />
            <RadioButton
              selected={requestType === 'deletion'}
              onSelect={() => setRequestType('deletion')}
              label="Delete My Data"
              description="Request deletion of your personal information"
            />
            <RadioButton
              selected={requestType === 'correction'}
              onSelect={() => setRequestType('correction')}
              label="Correct My Data"
              description="Request correction of inaccurate information"
            />
          </Stack>

          <Row gap="$3" justifyContent="flex-end" marginTop="$4">
            <Button variant="outlined" onPress={onCancel}>
              Cancel
            </Button>
            <Button onPress={() => setStep('categories')}>
              Next
            </Button>
          </Row>
        </Stack>
      )}

      {/* Step 2: Select Data Categories */}
      {step === 'categories' && (
        <Stack gap="$3">
          <Row justifyContent="space-between" alignItems="center">
            <Text fontSize="$4" fontWeight="500">
              {requestType === 'correction' ? 'Describe Correction' : 'Select Data Categories'}
            </Text>
            {requestType !== 'correction' && (
              <Button size="$2" variant="outlined" onPress={selectAllCategories}>
                Select All
              </Button>
            )}
          </Row>

          {requestType === 'correction' ? (
            <Stack gap="$2">
              <Text fontSize="$3" color="$color11">
                Please describe what information is incorrect and what the correct information should be:
              </Text>
              <Stack
                as="textarea"
                minHeight={150}
                padding="$3"
                backgroundColor="$color2"
                borderRadius="$2"
                borderWidth={1}
                borderColor="$borderColor"
              >
                <Text
                  fontSize="$3"
                  color={correctionDetails ? '$color12' : '$color10'}
                >
                  {correctionDetails || 'Enter correction details here...'}
                </Text>
              </Stack>
            </Stack>
          ) : (
            <Stack gap="$2">
              {DATA_CATEGORIES.map((category) => (
                <Checkbox
                  key={category.id}
                  checked={selectedCategories.includes(category.id)}
                  onChange={() => toggleCategory(category.id)}
                  label={category.label}
                  description={category.description}
                />
              ))}
            </Stack>
          )}

          <Row gap="$3" justifyContent="flex-end" marginTop="$4">
            <Button variant="outlined" onPress={() => setStep('type')}>
              Back
            </Button>
            <Button
              onPress={() => setStep('confirm')}
              disabled={
                (requestType !== 'correction' && selectedCategories.length === 0) ||
                (requestType === 'correction' && !correctionDetails.trim())
              }
            >
              Next
            </Button>
          </Row>
        </Stack>
      )}

      {/* Step 3: Confirmation */}
      {step === 'confirm' && (
        <Stack gap="$3">
          <Text fontSize="$4" fontWeight="500">
            Confirm Your Request
          </Text>

          {/* Summary */}
          <Stack
            padding="$3"
            backgroundColor="$color2"
            borderRadius="$2"
            gap="$2"
          >
            <Text fontSize="$3" fontWeight="500">
              Request Type: {REQUEST_TYPE_INFO[requestType].title}
            </Text>
            {requestType !== 'correction' && (
              <Text fontSize="$3" color="$color11">
                Categories: {selectedCategories.length === DATA_CATEGORIES.length
                  ? 'All categories'
                  : selectedCategories
                      .map((id) => DATA_CATEGORIES.find((c) => c.id === id)?.label)
                      .join(', ')}
              </Text>
            )}
          </Stack>

          {/* Warning for deletion */}
          {typeInfo.warning && (
            <Row
              padding="$3"
              backgroundColor="$red2"
              borderRadius="$2"
              borderWidth={1}
              borderColor="$red6"
            >
              <Text fontSize="$3" color="$red11">
                ⚠️ {typeInfo.warning}
              </Text>
            </Row>
          )}

          {/* Processing time info */}
          <Row
            padding="$3"
            backgroundColor="$blue2"
            borderRadius="$2"
          >
            <Text fontSize="$3" color="$blue11">
              Your request will be processed within 45 days as required by CCPA. You will receive
              email notifications about the status of your request.
            </Text>
          </Row>

          {/* Confirmation checkbox */}
          <Checkbox
            checked={confirmChecked}
            onChange={setConfirmChecked}
            label="I understand and confirm this request"
            description={
              requestType === 'deletion'
                ? 'I understand that some data may be retained for legal purposes and this action cannot be undone.'
                : 'I confirm that I want to submit this privacy request.'
            }
          />

          <Row gap="$3" justifyContent="flex-end" marginTop="$4">
            <Button variant="outlined" onPress={() => setStep('categories')}>
              Back
            </Button>
            <Button
              onPress={handleSubmit}
              disabled={!confirmChecked || submitRequest.isPending}
              theme={requestType === 'deletion' ? 'red' : undefined}
            >
              {submitRequest.isPending ? (
                <Row gap="$2" alignItems="center">
                  <Spinner size="small" />
                  <Text>Submitting...</Text>
                </Row>
              ) : (
                typeInfo.confirmText
              )}
            </Button>
          </Row>
        </Stack>
      )}
    </Stack>
  )
}

export default DataRequestForm
