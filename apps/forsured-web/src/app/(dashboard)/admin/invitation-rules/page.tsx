/**
 * Invitation rules admin dashboard
 *
 * Administrative interface for managing invitation rules:
 * - View all invitation rules (active and inactive)
 * - Toggle rule active status
 * - Edit rule details
 * - View invitation statistics
 */

import { useState } from 'react'
import {
  Stack,
  Row,
  Text,
  Button,
  Card,
  Heading,
  Input,
  colors,
  spacing,
} from '@scaffald/ui'
import Switch from '../../../../ui/Switch'
import Textarea from '../../../../components/Common/Textarea'
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
  broker: { bg: colors.purple[200], text: colors.purple[600] },
  manager: { bg: colors.primary[200], text: colors.primary[600] },
  contractor: { bg: colors.success[200], text: colors.success[600] },
  client: { bg: colors.warning[200], text: colors.warning[600] },
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
      <Stack style={{ padding: spacing[24], maxWidth: 1120, marginHorizontal: 'auto' }}>
        <Stack style={{ opacity: 0.5 }}>
          <Stack
            style={{
              height: 32,
              backgroundColor: colors.gray[200],
              borderRadius: 8,
              width: '40%',
              marginBottom: spacing[16],
            }}
          />
          <Row style={{ flexWrap: 'wrap', gap: spacing[16], marginBottom: spacing[32] }}>
            {[1, 2, 3, 4].map((i) => (
              <Stack
                key={i}
                style={{
                  height: 96,
                  backgroundColor: colors.gray[200],
                  borderRadius: 8,
                  flex: 1,
                  minWidth: 200,
                }}
              />
            ))}
          </Row>
        </Stack>
      </Stack>
    )
  }

  if (rulesError) {
    return (
      <Stack style={{ padding: spacing[24], maxWidth: 1120, marginHorizontal: 'auto' }}>
        <Stack
          style={{
            padding: spacing[16],
            backgroundColor: colors.error[200],
            borderWidth: 1,
            borderColor: colors.error[400],
            borderRadius: spacing[16],
          }}
        >
          <Text weight="semibold" color={colors.error[600]}>
            Error loading invitation rules
          </Text>
          <Text color={colors.error[500]} size="xs" style={{ marginTop: spacing[8] }}>
            {rulesError.message || 'Failed to load data. Please try again.'}
          </Text>
          <Button
            style={{ marginTop: spacing[12] }}
            size="sm"
            color="error"
            variant="filled"
            onPress={() => window.location.reload()}
          >
            Retry
          </Button>
        </Stack>
      </Stack>
    )
  }

  return (
    <Stack style={{ padding: spacing[24], maxWidth: 1120, marginHorizontal: 'auto' }}>
      {/* Header */}
      <Stack style={{ marginBottom: spacing[32] }}>
        <Heading level={2} style={{ marginBottom: spacing[8] }}>
          Invitation Rules
        </Heading>
        <Text color={colors.text.light.secondary}>
          Configure which user types can invite others and how relationships are established.
        </Text>
      </Stack>

      {/* Statistics */}
      <Stack style={{ marginBottom: spacing[32] }}>
        <Heading level={3} style={{ marginBottom: spacing[16] }}>
          Statistics
        </Heading>
        <Row style={{ flexWrap: 'wrap', gap: spacing[16] }}>
          <Card style={{ padding: spacing[16], flex: 1, minWidth: 180 }}>
            <Text
              size="xs"
              color={colors.text.light.secondary}
              style={{ marginBottom: spacing[4] }}
            >
              Total Invitations
            </Text>
            <Text style={{ fontSize: 32, fontWeight: '700' }} color={colors.text.light.primary}>
              {stats?.totalInvitations ?? 0}
            </Text>
          </Card>
          <Card style={{ padding: spacing[16], flex: 1, minWidth: 180 }}>
            <Text
              size="xs"
              color={colors.text.light.secondary}
              style={{ marginBottom: spacing[4] }}
            >
              Pending
            </Text>
            <Text style={{ fontSize: 32, fontWeight: '700' }} color={colors.warning[600]}>
              {stats?.pendingInvitations ?? 0}
            </Text>
          </Card>
          <Card style={{ padding: spacing[16], flex: 1, minWidth: 180 }}>
            <Text
              size="xs"
              color={colors.text.light.secondary}
              style={{ marginBottom: spacing[4] }}
            >
              Accepted
            </Text>
            <Text style={{ fontSize: 32, fontWeight: '700' }} color={colors.success[600]}>
              {stats?.acceptedInvitations ?? 0}
            </Text>
          </Card>
          <Card style={{ padding: spacing[16], flex: 1, minWidth: 180 }}>
            <Text
              size="xs"
              color={colors.text.light.secondary}
              style={{ marginBottom: spacing[4] }}
            >
              Active Relationships
            </Text>
            <Text style={{ fontSize: 32, fontWeight: '700' }} color={colors.primary[600]}>
              {stats?.activeRelationships ?? 0}
            </Text>
          </Card>
        </Row>
      </Stack>

      {/* Rules Management */}
      <Stack style={{ marginBottom: spacing[32] }}>
        <Row
          alignItems="center"
          justifyContent="space-between"
          style={{ marginBottom: spacing[16] }}
        >
          <Heading level={3}>Invitation Rules</Heading>
          <Button color="primary" variant="filled" onPress={() => setShowCreateForm(true)}>
            Add New Rule
          </Button>
        </Row>

        {/* Rules Table */}
        <Card style={{ overflow: 'hidden' }}>
          <Stack>
            {/* Table Header */}
            <Row
              style={{
                backgroundColor: colors.gray[100],
                paddingHorizontal: spacing[16],
                paddingVertical: spacing[12],
              }}
            >
              <Text
                style={{ flex: 2 }}
                size="xs"
                weight="medium"
                color={colors.text.light.secondary}
              >
                Rule Name
              </Text>
              <Text
                style={{ flex: 1 }}
                size="xs"
                weight="medium"
                color={colors.text.light.secondary}
              >
                Source Role
              </Text>
              <Text
                style={{ flex: 1 }}
                size="xs"
                weight="medium"
                color={colors.text.light.secondary}
              >
                Target Role
              </Text>
              <Text
                style={{ flex: 1 }}
                size="xs"
                weight="medium"
                color={colors.text.light.secondary}
              >
                Type
              </Text>
              <Text
                style={{ flex: 1 }}
                size="xs"
                weight="medium"
                color={colors.text.light.secondary}
                style={{ textAlign: 'center' }}
              >
                Active
              </Text>
              <Text
                style={{ flex: 1 }}
                size="xs"
                weight="medium"
                color={colors.text.light.secondary}
                style={{ textAlign: 'center' }}
              >
                Actions
              </Text>
            </Row>

            {/* Table Body */}
            {!rules || rules.length === 0 ? (
              <Stack style={{ padding: spacing[32], alignItems: 'center' }}>
                <Text color={colors.text.light.secondary}>No invitation rules configured.</Text>
              </Stack>
            ) : (
              <Stack>
                {rules.map((rule) => (
                  <Row
                    key={rule.id}
                    style={{
                      paddingHorizontal: spacing[16],
                      paddingVertical: spacing[12],
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border.light.default,
                      alignItems: 'center',
                      backgroundColor: !rule.is_active ? colors.gray[50] : 'transparent',
                      opacity: rule.is_active ? 1 : 0.7,
                    }}
                  >
                    {/* Rule Name */}
                    <Stack style={{ flex: 2 }}>
                      <Text weight="medium" color={colors.text.light.primary}>
                        {rule.name}
                      </Text>
                      {rule.description && (
                        <Text
                          size="xs"
                          color={colors.text.light.secondary}
                          style={{ marginTop: spacing[4] }}
                        >
                          {rule.description}
                        </Text>
                      )}
                    </Stack>

                    {/* Source Role */}
                    <Stack style={{ flex: 1 }}>
                      <Row
                        style={{
                          paddingHorizontal: spacing[8],
                          paddingVertical: spacing[4],
                          borderRadius: 8,
                          backgroundColor: ROLE_COLORS[rule.source_role]?.bg ?? colors.gray[100],
                          alignSelf: 'flex-start',
                        }}
                      >
                        <Text
                          size="xs"
                          color={ROLE_COLORS[rule.source_role]?.text ?? colors.text.light.secondary}
                        >
                          {rule.source_role}
                        </Text>
                      </Row>
                    </Stack>

                    {/* Target Role */}
                    <Stack style={{ flex: 1 }}>
                      <Row
                        style={{
                          paddingHorizontal: spacing[8],
                          paddingVertical: spacing[4],
                          borderRadius: 8,
                          backgroundColor: ROLE_COLORS[rule.target_role]?.bg ?? colors.gray[100],
                          alignSelf: 'flex-start',
                        }}
                      >
                        <Text
                          size="xs"
                          color={ROLE_COLORS[rule.target_role]?.text ?? colors.text.light.secondary}
                        >
                          {rule.target_role}
                        </Text>
                      </Row>
                    </Stack>

                    {/* Relationship Type */}
                    <Stack style={{ flex: 1 }}>
                      <Text size="xs" color={colors.text.light.secondary}>
                        {RELATIONSHIP_TYPE_LABELS[rule.relationship_type]}
                      </Text>
                      {rule.requires_project && (
                        <Text
                          size="xs"
                          color={colors.text.light.tertiary}
                          style={{ marginTop: spacing[4] }}
                        >
                          Requires project
                        </Text>
                      )}
                    </Stack>

                    {/* Active Toggle */}
                    <Stack style={{ flex: 1, alignItems: 'center' }}>
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={() => handleToggleActive(rule.id, rule.is_active)}
                        disabled={toggleRuleMutation.isPending}
                      />
                    </Stack>

                    {/* Actions */}
                    <Row style={{ flex: 1, justifyContent: 'center', gap: spacing[8] }}>
                      <Button
                        size="sm"
                        variant="text"
                        color="primary"
                        onPress={() => setEditingRule(rule)}
                      >
                        Edit
                      </Button>
                    </Row>
                  </Row>
                ))}
              </Stack>
            )}
          </Stack>
        </Card>
      </Stack>

      {/* Info Box */}
      <Stack
        style={{
          padding: spacing[16],
          backgroundColor: colors.info[200],
          borderWidth: 1,
          borderColor: colors.info[400],
          borderRadius: spacing[16],
        }}
      >
        <Text weight="semibold" color={colors.info[600]} style={{ marginBottom: spacing[8] }}>
          Relationship Types Explained
        </Text>
        <Stack gap={spacing[8]}>
          <Text size="xs" color={colors.info[600]}>
            <Text weight="semibold">One-to-One:</Text> Target can only have one relationship of this
            type (e.g., one broker per client)
          </Text>
          <Text size="xs" color={colors.info[600]}>
            <Text weight="semibold">One-to-Many:</Text> Target can have multiple relationships
            (e.g., broker works with many managers)
          </Text>
          <Text size="xs" color={colors.info[600]}>
            <Text weight="semibold">One-to-Many (Project):</Text> Relationship tied to a specific
            project (e.g., subcontractor assigned to project)
          </Text>
        </Stack>
      </Stack>

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
    </Stack>
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
    <Stack
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
    >
      <Card style={{ padding: spacing[24], width: 500, maxWidth: '90%' }}>
        <Heading level={3} style={{ marginBottom: spacing[16] }}>
          Edit Rule: {rule.name}
        </Heading>

        <Stack gap={spacing[16]}>
          <Stack gap={spacing[8]}>
            <Text size="xs" weight="medium">
              Rule Name
            </Text>
            <Input value={name} onChangeText={setName} placeholder="Enter rule name" />
          </Stack>

          <Stack gap={spacing[8]}>
            <Text size="xs" weight="medium">
              Description
            </Text>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description (optional)"
              rows={2}
            />
          </Stack>

          <Stack gap={spacing[8]}>
            <Text size="xs" weight="medium">
              Constraint Message
            </Text>
            <Textarea
              value={constraintMessage}
              onChange={(e) => setConstraintMessage(e.target.value)}
              placeholder="Message shown when constraint is violated (optional)"
              rows={2}
            />
          </Stack>

          <Row alignItems="center" gap={spacing[12]}>
            <Switch checked={allowReferralOnly} onCheckedChange={setAllowReferralOnly} />
            <Stack>
              <Text size="xs" weight="medium">
                Allow Referral-Only
              </Text>
              <Text size="xs" color={colors.text.light.secondary}>
                If constraint fails, still track referral credit
              </Text>
            </Stack>
          </Row>
        </Stack>

        <Row justifyContent="flex-end" gap={spacing[12]} style={{ marginTop: spacing[24] }}>
          <Button variant="outline" onPress={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            color="primary"
            variant="filled"
            onPress={handleSubmit}
            disabled={isSaving || !name}
            loading={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Row>
      </Card>
    </Stack>
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
    <Stack
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
    >
      <Card style={{ padding: spacing[24], width: 500, maxWidth: '90%' }}>
        <Heading level={3} style={{ marginBottom: spacing[16] }}>
          Create New Rule
        </Heading>

        <Stack gap={spacing[16]}>
          <Row gap={spacing[16]}>
            <Stack style={{ flex: 1 }} gap={spacing[8]}>
              <Text size="xs" weight="medium">
                Source Role
              </Text>
              <Input value={sourceRole} onChangeText={setSourceRole} placeholder="e.g., broker" />
            </Stack>
            <Stack style={{ flex: 1 }} gap={spacing[8]}>
              <Text size="xs" weight="medium">
                Target Role
              </Text>
              <Input value={targetRole} onChangeText={setTargetRole} placeholder="e.g., client" />
            </Stack>
          </Row>

          <Stack gap={spacing[8]}>
            <Text size="xs" weight="medium">
              Rule Name
            </Text>
            <Input value={name} onChangeText={setName} placeholder="e.g., Invite Client" />
          </Stack>

          <Stack gap={spacing[8]}>
            <Text size="xs" weight="medium">
              Relationship Type
            </Text>
            <Row gap={spacing[8]} style={{ flexWrap: 'wrap' }}>
              {(['one-to-one', 'one-to-many', 'one-to-many-via-project'] as RelationshipType[]).map(
                (type) => (
                  <Button
                    key={type}
                    size="sm"
                    color={relationshipType === type ? 'primary' : 'gray'}
                    variant={relationshipType === type ? 'filled' : 'outline'}
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
            </Row>
          </Stack>

          <Stack gap={spacing[8]}>
            <Text size="xs" weight="medium">
              Description
            </Text>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description (optional)"
              rows={2}
            />
          </Stack>

          <Row alignItems="center" gap={spacing[12]}>
            <Switch
              checked={requiresProject}
              onCheckedChange={setRequiresProject}
              disabled={relationshipType === 'one-to-many-via-project'}
            />
            <Text size="xs">Requires Project Context</Text>
          </Row>
        </Stack>

        <Row justifyContent="flex-end" gap={spacing[12]} style={{ marginTop: spacing[24] }}>
          <Button variant="outline" onPress={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            color="primary"
            variant="filled"
            onPress={handleSubmit}
            disabled={isCreating || !isValid}
            loading={isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Rule'}
          </Button>
        </Row>
      </Card>
    </Stack>
  )
}
