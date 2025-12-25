/**
 * REQ-128: Invitation Rules Admin Dashboard
 *
 * Administrative interface for managing invitation rules:
 * - View all invitation rules (active and inactive)
 * - Toggle rule active status
 * - Edit rule details
 * - View invitation statistics
 */

import { useState } from 'react'
import { YStack, XStack, Text, Button, Card, H2, H3, Switch, Input, TextArea } from '@unicornlove/ui'
import { trpc } from '../../../../lib/trpc'

// Types for invitation rules
type RelationshipType = 'one-to-one' | 'one-to-many' | 'one-to-many-via-project'

type InvitationRule = {
  id: string
  source_role: string
  target_role: string
  relationship_type: RelationshipType
  name: string
  description?: string
  requires_project: boolean
  constraint_message?: string
  allow_referral_only: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

// Relationship type display labels
const RELATIONSHIP_TYPE_LABELS: Record<RelationshipType, string> = {
  'one-to-one': 'One-to-One',
  'one-to-many': 'One-to-Many',
  'one-to-many-via-project': 'One-to-Many (Project)',
}

// Role badge colors
const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  broker: { bg: '$purple2', text: '$purple11' },
  manager: { bg: '$blue2', text: '$blue11' },
  contractor: { bg: '$green2', text: '$green11' },
  client: { bg: '$orange2', text: '$orange11' },
}

export default function InvitationRulesAdminPage() {
  const [editingRule, setEditingRule] = useState<InvitationRule | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Fetch all rules
  const {
    data: rules,
    isLoading: rulesLoading,
    error: rulesError,
    refetch: refetchRules,
  } = trpc.genericInvitations.adminGetAllRules.useQuery()

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = trpc.genericInvitations.adminGetStats.useQuery()

  // Mutations
  const toggleRuleMutation = trpc.genericInvitations.adminToggleRule.useMutation({
    onSuccess: () => refetchRules(),
  })

  const updateRuleMutation = trpc.genericInvitations.adminUpdateRule.useMutation({
    onSuccess: () => {
      refetchRules()
      setEditingRule(null)
    },
  })

  const createRuleMutation = trpc.genericInvitations.adminCreateRule.useMutation({
    onSuccess: () => {
      refetchRules()
      setShowCreateForm(false)
    },
  })

  const handleToggleActive = async (ruleId: string, currentActive: boolean) => {
    await toggleRuleMutation.mutateAsync({
      ruleId,
      isActive: !currentActive,
    })
  }

  const loading = rulesLoading || statsLoading

  if (loading) {
    return (
      <YStack padding="$6" maxWidth={1120} marginHorizontal="auto">
        <YStack opacity={0.5}>
          <YStack height={32} backgroundColor="$gray4" borderRadius="$2" width="40%" marginBottom="$4" />
          <XStack flexWrap="wrap" gap="$4" marginBottom="$8">
            {[1, 2, 3, 4].map((i) => (
              <YStack key={i} height={96} backgroundColor="$gray4" borderRadius="$2" flex={1} minWidth={200} />
            ))}
          </XStack>
        </YStack>
      </YStack>
    )
  }

  if (rulesError) {
    return (
      <YStack padding="$6" maxWidth={1120} marginHorizontal="auto">
        <YStack padding="$4" backgroundColor="$red2" borderWidth={1} borderColor="$red6" borderRadius="$4">
          <Text fontWeight="600" color="$red11">
            Error loading invitation rules
          </Text>
          <Text color="$red10" fontSize="$2" marginTop="$2">
            {rulesError.message || 'Failed to load data. Please try again.'}
          </Text>
          <Button
            marginTop="$3"
            size="$3"
            backgroundColor="$red9"
            color="white"
            hoverStyle={{ backgroundColor: '$red10' }}
            onPress={() => window.location.reload()}
          >
            Retry
          </Button>
        </YStack>
      </YStack>
    )
  }

  return (
    <YStack padding="$6" maxWidth={1120} marginHorizontal="auto">
      {/* Header */}
      <YStack marginBottom="$8">
        <H2 marginBottom="$2">Invitation Rules</H2>
        <Text color="$gray11">
          Configure which user types can invite others and how relationships are established.
        </Text>
      </YStack>

      {/* Statistics */}
      <YStack marginBottom="$8">
        <H3 marginBottom="$4">Statistics</H3>
        <XStack flexWrap="wrap" gap="$4">
          <Card padding="$4" flex={1} minWidth={180}>
            <Text fontSize="$2" color="$gray11" marginBottom="$1">
              Total Invitations
            </Text>
            <Text fontSize="$8" fontWeight="700" color="$gray12">
              {stats?.totalInvitations ?? 0}
            </Text>
          </Card>
          <Card padding="$4" flex={1} minWidth={180}>
            <Text fontSize="$2" color="$gray11" marginBottom="$1">
              Pending
            </Text>
            <Text fontSize="$8" fontWeight="700" color="$yellow11">
              {stats?.pendingInvitations ?? 0}
            </Text>
          </Card>
          <Card padding="$4" flex={1} minWidth={180}>
            <Text fontSize="$2" color="$gray11" marginBottom="$1">
              Accepted
            </Text>
            <Text fontSize="$8" fontWeight="700" color="$green11">
              {stats?.acceptedInvitations ?? 0}
            </Text>
          </Card>
          <Card padding="$4" flex={1} minWidth={180}>
            <Text fontSize="$2" color="$gray11" marginBottom="$1">
              Active Relationships
            </Text>
            <Text fontSize="$8" fontWeight="700" color="$blue11">
              {stats?.activeRelationships ?? 0}
            </Text>
          </Card>
        </XStack>
      </YStack>

      {/* Rules Management */}
      <YStack marginBottom="$8">
        <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
          <H3>Invitation Rules</H3>
          <Button
            backgroundColor="$blue9"
            color="white"
            hoverStyle={{ backgroundColor: '$blue10' }}
            onPress={() => setShowCreateForm(true)}
          >
            Add New Rule
          </Button>
        </XStack>

        {/* Rules Table */}
        <Card overflow="hidden">
          <YStack>
            {/* Table Header */}
            <XStack backgroundColor="$gray2" paddingHorizontal="$4" paddingVertical="$3">
              <Text flex={2} fontSize="$2" fontWeight="500" color="$gray11">
                Rule Name
              </Text>
              <Text flex={1} fontSize="$2" fontWeight="500" color="$gray11">
                Source Role
              </Text>
              <Text flex={1} fontSize="$2" fontWeight="500" color="$gray11">
                Target Role
              </Text>
              <Text flex={1} fontSize="$2" fontWeight="500" color="$gray11">
                Type
              </Text>
              <Text flex={1} fontSize="$2" fontWeight="500" color="$gray11" textAlign="center">
                Active
              </Text>
              <Text flex={1} fontSize="$2" fontWeight="500" color="$gray11" textAlign="center">
                Actions
              </Text>
            </XStack>

            {/* Table Body */}
            {(!rules || rules.length === 0) ? (
              <YStack padding="$8" alignItems="center">
                <Text color="$gray11">No invitation rules configured.</Text>
              </YStack>
            ) : (
              <YStack>
                {rules.map((rule) => (
                  <XStack
                    key={rule.id}
                    paddingHorizontal="$4"
                    paddingVertical="$3"
                    borderBottomWidth={1}
                    borderColor="$borderColor"
                    alignItems="center"
                    backgroundColor={!rule.is_active ? '$gray1' : 'transparent'}
                    opacity={rule.is_active ? 1 : 0.7}
                  >
                    {/* Rule Name */}
                    <YStack flex={2}>
                      <Text fontWeight="500" color="$gray12">
                        {rule.name}
                      </Text>
                      {rule.description && (
                        <Text fontSize="$2" color="$gray11" marginTop="$1">
                          {rule.description}
                        </Text>
                      )}
                    </YStack>

                    {/* Source Role */}
                    <YStack flex={1}>
                      <XStack
                        paddingHorizontal="$2"
                        paddingVertical="$1"
                        borderRadius="$2"
                        backgroundColor={ROLE_COLORS[rule.source_role]?.bg ?? '$gray2'}
                        alignSelf="flex-start"
                      >
                        <Text fontSize="$2" color={ROLE_COLORS[rule.source_role]?.text ?? '$gray11'}>
                          {rule.source_role}
                        </Text>
                      </XStack>
                    </YStack>

                    {/* Target Role */}
                    <YStack flex={1}>
                      <XStack
                        paddingHorizontal="$2"
                        paddingVertical="$1"
                        borderRadius="$2"
                        backgroundColor={ROLE_COLORS[rule.target_role]?.bg ?? '$gray2'}
                        alignSelf="flex-start"
                      >
                        <Text fontSize="$2" color={ROLE_COLORS[rule.target_role]?.text ?? '$gray11'}>
                          {rule.target_role}
                        </Text>
                      </XStack>
                    </YStack>

                    {/* Relationship Type */}
                    <YStack flex={1}>
                      <Text fontSize="$2" color="$gray11">
                        {RELATIONSHIP_TYPE_LABELS[rule.relationship_type]}
                      </Text>
                      {rule.requires_project && (
                        <Text fontSize="$1" color="$gray10" marginTop="$1">
                          Requires project
                        </Text>
                      )}
                    </YStack>

                    {/* Active Toggle */}
                    <YStack flex={1} alignItems="center">
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={() => handleToggleActive(rule.id, rule.is_active)}
                        disabled={toggleRuleMutation.isPending}
                      />
                    </YStack>

                    {/* Actions */}
                    <XStack flex={1} justifyContent="center" gap="$2">
                      <Button
                        size="$2"
                        backgroundColor="transparent"
                        color="$blue11"
                        hoverStyle={{ backgroundColor: '$blue3' }}
                        onPress={() => setEditingRule(rule)}
                      >
                        Edit
                      </Button>
                    </XStack>
                  </XStack>
                ))}
              </YStack>
            )}
          </YStack>
        </Card>
      </YStack>

      {/* Info Box */}
      <YStack
        padding="$4"
        backgroundColor="$blue2"
        borderWidth={1}
        borderColor="$blue6"
        borderRadius="$4"
      >
        <Text fontWeight="600" color="$blue11" marginBottom="$2">
          Relationship Types Explained
        </Text>
        <YStack gap="$2">
          <Text fontSize="$2" color="$blue11">
            <Text fontWeight="600">One-to-One:</Text> Target can only have one relationship of this type
            (e.g., one broker per client)
          </Text>
          <Text fontSize="$2" color="$blue11">
            <Text fontWeight="600">One-to-Many:</Text> Target can have multiple relationships
            (e.g., broker works with many managers)
          </Text>
          <Text fontSize="$2" color="$blue11">
            <Text fontWeight="600">One-to-Many (Project):</Text> Relationship tied to a specific project
            (e.g., subcontractor assigned to project)
          </Text>
        </YStack>
      </YStack>

      {/* Edit Rule Modal */}
      {editingRule && (
        <EditRuleModal
          rule={editingRule}
          onClose={() => setEditingRule(null)}
          onSave={async (updates) => {
            await updateRuleMutation.mutateAsync({
              ruleId: editingRule.id,
              ...updates,
            })
          }}
          isSaving={updateRuleMutation.isPending}
        />
      )}

      {/* Create Rule Modal */}
      {showCreateForm && (
        <CreateRuleModal
          onClose={() => setShowCreateForm(false)}
          onCreate={async (data) => {
            await createRuleMutation.mutateAsync(data)
          }}
          isCreating={createRuleMutation.isPending}
        />
      )}
    </YStack>
  )
}

// Edit Rule Modal Component
function EditRuleModal({
  rule,
  onClose,
  onSave,
  isSaving,
}: {
  rule: InvitationRule
  onClose: () => void
  onSave: (updates: Partial<InvitationRule>) => Promise<void>
  isSaving: boolean
}) {
  const [name, setName] = useState(rule.name)
  const [description, setDescription] = useState(rule.description || '')
  const [constraintMessage, setConstraintMessage] = useState(rule.constraint_message || '')
  const [allowReferralOnly, setAllowReferralOnly] = useState(rule.allow_referral_only)

  const handleSubmit = async () => {
    await onSave({
      name,
      description: description || undefined,
      constraint_message: constraintMessage || undefined,
      allow_referral_only: allowReferralOnly,
    })
  }

  return (
    <YStack
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      backgroundColor="rgba(0,0,0,0.5)"
      justifyContent="center"
      alignItems="center"
      zIndex={1000}
    >
      <Card padding="$6" width={500} maxWidth="90%">
        <H3 marginBottom="$4">Edit Rule: {rule.name}</H3>

        <YStack gap="$4">
          <YStack gap="$2">
            <Text fontSize="$2" fontWeight="500">
              Rule Name
            </Text>
            <Input
              value={name}
              onChangeText={setName}
              placeholder="Enter rule name"
            />
          </YStack>

          <YStack gap="$2">
            <Text fontSize="$2" fontWeight="500">
              Description
            </Text>
            <TextArea
              value={description}
              onChangeText={setDescription}
              placeholder="Enter description (optional)"
              numberOfLines={2}
            />
          </YStack>

          <YStack gap="$2">
            <Text fontSize="$2" fontWeight="500">
              Constraint Message
            </Text>
            <TextArea
              value={constraintMessage}
              onChangeText={setConstraintMessage}
              placeholder="Message shown when constraint is violated (optional)"
              numberOfLines={2}
            />
          </YStack>

          <XStack alignItems="center" gap="$3">
            <Switch
              checked={allowReferralOnly}
              onCheckedChange={setAllowReferralOnly}
            />
            <YStack>
              <Text fontSize="$2" fontWeight="500">
                Allow Referral-Only
              </Text>
              <Text fontSize="$1" color="$gray11">
                If constraint fails, still track referral credit
              </Text>
            </YStack>
          </XStack>
        </YStack>

        <XStack justifyContent="flex-end" gap="$3" marginTop="$6">
          <Button
            variant="outlined"
            onPress={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            backgroundColor="$blue9"
            color="white"
            hoverStyle={{ backgroundColor: '$blue10' }}
            onPress={handleSubmit}
            disabled={isSaving || !name}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </XStack>
      </Card>
    </YStack>
  )
}

// Create Rule Modal Component
function CreateRuleModal({
  onClose,
  onCreate,
  isCreating,
}: {
  onClose: () => void
  onCreate: (data: {
    source_role: string
    target_role: string
    relationship_type: RelationshipType
    name: string
    description?: string
    requires_project?: boolean
    constraint_message?: string
    allow_referral_only?: boolean
  }) => Promise<void>
  isCreating: boolean
}) {
  const [sourceRole, setSourceRole] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [relationshipType, setRelationshipType] = useState<RelationshipType>('one-to-many')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [requiresProject, setRequiresProject] = useState(false)
  const [constraintMessage, setConstraintMessage] = useState('')
  const [allowReferralOnly, setAllowReferralOnly] = useState(true)

  const handleSubmit = async () => {
    await onCreate({
      source_role: sourceRole,
      target_role: targetRole,
      relationship_type: relationshipType,
      name,
      description: description || undefined,
      requires_project: requiresProject,
      constraint_message: constraintMessage || undefined,
      allow_referral_only: allowReferralOnly,
    })
  }

  const isValid = sourceRole && targetRole && name

  return (
    <YStack
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      backgroundColor="rgba(0,0,0,0.5)"
      justifyContent="center"
      alignItems="center"
      zIndex={1000}
    >
      <Card padding="$6" width={500} maxWidth="90%">
        <H3 marginBottom="$4">Create New Rule</H3>

        <YStack gap="$4">
          <XStack gap="$4">
            <YStack flex={1} gap="$2">
              <Text fontSize="$2" fontWeight="500">
                Source Role
              </Text>
              <Input
                value={sourceRole}
                onChangeText={setSourceRole}
                placeholder="e.g., broker"
              />
            </YStack>
            <YStack flex={1} gap="$2">
              <Text fontSize="$2" fontWeight="500">
                Target Role
              </Text>
              <Input
                value={targetRole}
                onChangeText={setTargetRole}
                placeholder="e.g., client"
              />
            </YStack>
          </XStack>

          <YStack gap="$2">
            <Text fontSize="$2" fontWeight="500">
              Rule Name
            </Text>
            <Input
              value={name}
              onChangeText={setName}
              placeholder="e.g., Invite Client"
            />
          </YStack>

          <YStack gap="$2">
            <Text fontSize="$2" fontWeight="500">
              Relationship Type
            </Text>
            <XStack gap="$2" flexWrap="wrap">
              {(['one-to-one', 'one-to-many', 'one-to-many-via-project'] as RelationshipType[]).map(
                (type) => (
                  <Button
                    key={type}
                    size="$3"
                    backgroundColor={relationshipType === type ? '$blue9' : '$gray3'}
                    color={relationshipType === type ? 'white' : '$gray11'}
                    hoverStyle={{
                      backgroundColor: relationshipType === type ? '$blue10' : '$gray4',
                    }}
                    onPress={() => {
                      setRelationshipType(type)
                      if (type === 'one-to-many-via-project') {
                        setRequiresProject(true)
                      }
                    }}
                  >
                    {RELATIONSHIP_TYPE_LABELS[type]}
                  </Button>
                )
              )}
            </XStack>
          </YStack>

          <YStack gap="$2">
            <Text fontSize="$2" fontWeight="500">
              Description
            </Text>
            <TextArea
              value={description}
              onChangeText={setDescription}
              placeholder="Enter description (optional)"
              numberOfLines={2}
            />
          </YStack>

          <XStack alignItems="center" gap="$3">
            <Switch
              checked={requiresProject}
              onCheckedChange={setRequiresProject}
              disabled={relationshipType === 'one-to-many-via-project'}
            />
            <Text fontSize="$2">Requires Project Context</Text>
          </XStack>
        </YStack>

        <XStack justifyContent="flex-end" gap="$3" marginTop="$6">
          <Button
            variant="outlined"
            onPress={onClose}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            backgroundColor="$blue9"
            color="white"
            hoverStyle={{ backgroundColor: '$blue10' }}
            onPress={handleSubmit}
            disabled={isCreating || !isValid}
          >
            {isCreating ? 'Creating...' : 'Create Rule'}
          </Button>
        </XStack>
      </Card>
    </YStack>
  )
}
