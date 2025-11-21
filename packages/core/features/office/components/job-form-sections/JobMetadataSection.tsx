import { Input, ResponsiveSelect, Text, ToggleSwitch, UserSearch, XStack, YStack } from '@app/ui'
import { useState } from 'react'
import { Label } from 'tamagui'

interface JobMetadataSectionProps {
  internalJobCode?: string
  department?: string
  costCenter?: string
  hiringManagerId?: string
  recruiterId?: string
  numberOfOpenings?: number
  priorityLevel?: 'urgent' | 'high' | 'normal' | 'low'
  requisitionNumber?: string
  jobCategory?: string
  isConfidential?: boolean
  applicationDeadline?: string
  targetStartDate?: string
  estimatedHireDate?: string
  onUpdate: (data: {
    internal_job_code?: string
    department?: string
    cost_center?: string
    hiring_manager_id?: string
    recruiter_id?: string
    number_of_openings?: number
    priority_level?: 'urgent' | 'high' | 'normal' | 'low'
    requisition_number?: string
    job_category?: string
    is_confidential?: boolean
    application_deadline?: string
    target_start_date?: string
    estimated_hire_date?: string
  }) => void
}

const PRIORITY_LEVELS = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Low' },
]

export function JobMetadataSection({
  internalJobCode,
  department,
  costCenter,
  hiringManagerId,
  recruiterId,
  numberOfOpenings,
  priorityLevel,
  requisitionNumber,
  jobCategory,
  isConfidential,
  applicationDeadline,
  targetStartDate,
  estimatedHireDate,
  onUpdate,
}: JobMetadataSectionProps) {
  const [localState, setLocalState] = useState({
    internal_job_code: internalJobCode,
    department,
    cost_center: costCenter,
    hiring_manager_id: hiringManagerId,
    recruiter_id: recruiterId,
    number_of_openings: numberOfOpenings,
    priority_level: priorityLevel,
    requisition_number: requisitionNumber,
    job_category: jobCategory,
    is_confidential: isConfidential,
    application_deadline: applicationDeadline,
    target_start_date: targetStartDate,
    estimated_hire_date: estimatedHireDate,
  })

  const handleChange = (
    key: keyof typeof localState,
    value: string | number | boolean | undefined
  ) => {
    const newState = { ...localState, [key]: value }
    setLocalState(newState)
    onUpdate(newState)
  }

  return (
    <YStack
      gap="$4"
      p="$4"
      bg="$background"
      rounded="$4"
      borderWidth={1}
      borderColor="$borderColor"
    >
      <Text fontSize="$6" fontWeight="600">
        Job Metadata & Management
      </Text>
      <Text fontSize="$2" color="$color10">
        Internal tracking and management information
      </Text>

      {/* Internal Job Code */}
      <YStack gap="$2">
        <Label>Internal job code</Label>
        <Input
          placeholder="e.g. JOB-2025-001"
          value={localState.internal_job_code || ''}
          onChangeText={(text) => handleChange('internal_job_code', text || undefined)}
        />
      </YStack>

      {/* Department */}
      <YStack gap="$2">
        <Label>Department</Label>
        <Input
          placeholder="e.g. Operations, Sales, Engineering"
          value={localState.department || ''}
          onChangeText={(text) => handleChange('department', text || undefined)}
        />
      </YStack>

      {/* Cost Center */}
      <YStack gap="$2">
        <Label>Cost center</Label>
        <Input
          placeholder="e.g. CC-1234"
          value={localState.cost_center || ''}
          onChangeText={(text) => handleChange('cost_center', text || undefined)}
        />
      </YStack>

      {/* Hiring Manager */}
      <YStack gap="$2">
        <Label>Hiring manager</Label>
        <UserSearch
          value={localState.hiring_manager_id}
          onUserSelect={(userId, _userName) => {
            handleChange('hiring_manager_id', userId)
          }}
          onChange={(userId) => {
            handleChange('hiring_manager_id', userId || undefined)
          }}
          placeholder="Search for hiring manager..."
        />
      </YStack>

      {/* Recruiter */}
      <YStack gap="$2">
        <Label>Recruiter</Label>
        <UserSearch
          value={localState.recruiter_id}
          onUserSelect={(userId, _userName) => {
            handleChange('recruiter_id', userId)
          }}
          onChange={(userId) => {
            handleChange('recruiter_id', userId || undefined)
          }}
          placeholder="Search for recruiter..."
        />
      </YStack>

      {/* Number of Openings */}
      <YStack gap="$2">
        <Label>Number of openings</Label>
        <Input
          placeholder="1"
          keyboardType="numeric"
          value={localState.number_of_openings?.toString() || ''}
          onChangeText={(text) => {
            const num = Number.parseInt(text, 10)
            handleChange('number_of_openings', Number.isNaN(num) ? undefined : num)
          }}
        />
      </YStack>

      {/* Priority Level */}
      <YStack gap="$2">
        <Label>Priority level</Label>
        <ResponsiveSelect
          value={localState.priority_level || ''}
          onValueChange={(value) => handleChange('priority_level', value || undefined)}
          placeholder="Select priority"
          options={PRIORITY_LEVELS.map((level) => ({
            value: level.value,
            label: level.label,
          }))}
        />
      </YStack>

      {/* Requisition Number */}
      <YStack gap="$2">
        <Label>Requisition number</Label>
        <Input
          placeholder="e.g. REQ-2025-001"
          value={localState.requisition_number || ''}
          onChangeText={(text) => handleChange('requisition_number', text || undefined)}
        />
      </YStack>

      {/* Job Category */}
      <YStack gap="$2">
        <Label>Job category</Label>
        <Input
          placeholder="e.g. Trade Skills, Management, Administrative"
          value={localState.job_category || ''}
          onChangeText={(text) => handleChange('job_category', text || undefined)}
        />
      </YStack>

      {/* Is Confidential */}
      <XStack gap="$3" items="center" justify="space-between">
        <YStack gap="$1" flex={1}>
          <Label>Confidential posting</Label>
          <Text fontSize="$2" color="$color10">
            Hide company name and details from job listings
          </Text>
        </YStack>
        <ToggleSwitch
          checked={localState.is_confidential || false}
          onCheckedChange={(checked) => handleChange('is_confidential', checked)}
          aria-label="Confidential posting"
        />
      </XStack>

      {/* Date Fields */}
      <YStack gap="$2">
        <Label>Application deadline</Label>
        <Input
          placeholder="YYYY-MM-DD"
          value={localState.application_deadline || ''}
          onChangeText={(text) => handleChange('application_deadline', text || undefined)}
        />
        <Text fontSize="$2" color="$color10">
          Last date to accept applications
        </Text>
      </YStack>

      <YStack gap="$2">
        <Label>Target start date</Label>
        <Input
          placeholder="YYYY-MM-DD"
          value={localState.target_start_date || ''}
          onChangeText={(text) => handleChange('target_start_date', text || undefined)}
        />
        <Text fontSize="$2" color="$color10">
          When you want the hire to start
        </Text>
      </YStack>

      <YStack gap="$2">
        <Label>Estimated hire date</Label>
        <Input
          placeholder="YYYY-MM-DD"
          value={localState.estimated_hire_date || ''}
          onChangeText={(text) => handleChange('estimated_hire_date', text || undefined)}
        />
        <Text fontSize="$2" color="$color10">
          When you expect to make a hire
        </Text>
      </YStack>
    </YStack>
  )
}
