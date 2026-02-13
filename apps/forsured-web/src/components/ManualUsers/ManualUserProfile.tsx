/**
 * ManualUserProfile - Profile page for manually-added users
 * Manual user profile
 * Manual user profile page with "Manually Added" indicators
 *
 * Shows:
 * - User details with "Manually Added" badge
 * - Invitation status
 * - Actions: edit, send invitation, delete
 * - Warning about notification limitations
 */

'use client'

import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Edit2,
  Mail,
  Trash2,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Building,
  Phone,
} from 'lucide-react'
import { Stack, Row, Text, Button, Card, Input, H1 } from '@scaffald/ui'
import { toast } from 'sonner'
import { ManualUserBadge } from './ManualUserBadge'
import { trpc } from '../../lib/trpc'

interface InvitationStatus {
  status: 'not_invited' | 'pending' | 'accepted' | 'expired'
  invitedAt?: string
  acceptedAt?: string
  expiresAt?: string
}

/**
 * Get invitation status display info
 */
function getInvitationStatusDisplay(status: InvitationStatus) {
  switch (status.status) {
    case 'accepted':
      return {
        icon: CheckCircle,
        color: 'var(--color-green-10)',
        bgColor: 'var(--color-green-3)',
        text: 'Invitation Accepted',
        description: status.acceptedAt
          ? `Accepted on ${new Date(status.acceptedAt).toLocaleDateString()}`
          : 'User has completed registration',
      }
    case 'pending':
      return {
        icon: Clock,
        color: 'var(--color-blue-10)',
        bgColor: 'var(--color-blue-3)',
        text: 'Invitation Pending',
        description: status.invitedAt
          ? `Sent on ${new Date(status.invitedAt).toLocaleDateString()}`
          : 'Awaiting user registration',
      }
    case 'expired':
      return {
        icon: AlertTriangle,
        color: 'var(--color-orange-10)',
        bgColor: 'var(--color-orange-3)',
        text: 'Invitation Expired',
        description: 'Send a new invitation to allow registration',
      }
    case 'not_invited':
    default:
      return {
        icon: Mail,
        color: 'var(--color-gray-10)',
        bgColor: 'var(--color-gray-3)',
        text: 'Not Invited',
        description: 'Add an email address to send an invitation',
      }
  }
}

export function ManualUserProfile() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()

  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEmailPrompt, setShowEmailPrompt] = useState(false)
  const [newEmail, setNewEmail] = useState('')

  // Form state for editing
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editCompany, setEditCompany] = useState('')

  // Fetch user data
  const {
    data: userData,
    isLoading,
    error,
    refetch,
  } = trpc.manualUsers.getById.useQuery({ userId: userId! }, { enabled: !!userId })

  // Mutations
  const updateMutation = trpc.manualUsers.update.useMutation()
  const sendInvitationMutation = trpc.manualUsers.sendInvitation.useMutation()
  const deleteMutation = trpc.manualUsers.delete.useMutation()

  // Handle starting edit mode
  const handleStartEdit = () => {
    if (userData) {
      setEditName(userData.name || '')
      setEditEmail(userData.email || '')
      setEditPhone(userData.phone || '')
      setEditCompany(userData.company || '')
    }
    setIsEditing(true)
  }

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!userId) return

    try {
      await updateMutation.mutateAsync({
        userId,
        name: editName || undefined,
        email: editEmail || undefined,
        phone: editPhone || undefined,
        company: editCompany || undefined,
      })
      toast.success('Profile updated successfully')
      setIsEditing(false)
      refetch()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile'
      toast.error(message)
    }
  }

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  // Handle send invitation
  const handleSendInvitation = async () => {
    if (!userId) return

    // Check if user has email
    if (!userData?.email) {
      setShowEmailPrompt(true)
      return
    }

    try {
      await sendInvitationMutation.mutateAsync({ userId })
      toast.success('Invitation sent successfully', {
        description: `An invitation email was sent to ${userData.email}`,
      })
      refetch()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send invitation'
      toast.error(message)
    }
  }

  // Handle save email and send invitation
  const handleSaveEmailAndInvite = async () => {
    if (!userId || !newEmail) return

    try {
      // First update with email
      await updateMutation.mutateAsync({ userId, email: newEmail })
      // Then send invitation
      await sendInvitationMutation.mutateAsync({ userId })
      toast.success('Profile updated and invitation sent', {
        description: `An invitation email was sent to ${newEmail}`,
      })
      setShowEmailPrompt(false)
      setNewEmail('')
      refetch()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send invitation'
      toast.error(message)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!userId) return

    try {
      await deleteMutation.mutateAsync({ userId })
      toast.success('User deleted successfully')
      navigate(-1) // Go back
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete user'
      toast.error(message)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <Stack
        style={{
          minHeight: '50vh',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-blue-10)' }} />
        <Text muted>Loading profile...</Text>
      </Stack>
    )
  }

  // Error state
  if (error || !userData) {
    return (
      <Stack
        style={{
          minHeight: '50vh',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
        }}
      >
        <AlertTriangle size={48} style={{ color: 'var(--color-red-10)' }} />
        <Text size="lg" weight="semibold">
          User Not Found
        </Text>
        <Text muted>{error?.message || 'This user does not exist or you do not have access.'}</Text>
        <Button variant="secondary" onPress={() => navigate(-1)}>
          Go Back
        </Button>
      </Stack>
    )
  }

  const invitationStatus: InvitationStatus = {
    status: userData.invitationStatus || 'not_invited',
    invitedAt: userData.invitedAt,
    acceptedAt: userData.acceptedAt,
    expiresAt: userData.expiresAt,
  }

  const statusDisplay = getInvitationStatusDisplay(invitationStatus)
  const StatusIcon = statusDisplay.icon

  const canSendInvitation =
    invitationStatus.status === 'not_invited' || invitationStatus.status === 'expired'

  return (
    <Stack gap={24} style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      {/* Header */}
      <Row alignItems="center" gap={12}>
        <Button
          variant="ghost"
          size="sm"
          onPress={() => navigate(-1)}
          style={{ padding: 8 }}
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </Button>
        <H1 style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-gray-12)' }}>
          Manual User Profile
        </H1>
      </Row>

      {/* Info Banner */}
      <Card
        style={{
          backgroundColor: 'var(--color-orange-2)',
          border: '1px solid var(--color-orange-6)',
          padding: 16,
          borderRadius: 8,
        }}
      >
        <Row alignItems="flex-start" gap={12}>
          <AlertTriangle size={20} style={{ color: 'var(--color-orange-10)', flexShrink: 0 }} />
          <Stack gap={4}>
            <Text weight="semibold" style={{ color: 'var(--color-orange-11)' }}>
              Limited Functionality
            </Text>
            <Text size="sm" style={{ color: 'var(--color-orange-11)' }}>
              This user was manually added and has not registered yet. They will not receive
              notifications, cannot log in, and cannot complete tasks until they register with the
              email address on file.
            </Text>
          </Stack>
        </Row>
      </Card>

      {/* Profile Card */}
      <Card
        style={{
          backgroundColor: 'var(--color-background)',
          border: '1px solid var(--color-border)',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        {/* Profile Header */}
        <Row
          alignItems="center"
          justifyContent="space-between"
          style={{
            padding: 20,
            borderBottom: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-gray-2)',
          }}
        >
          <Row alignItems="center" gap={16}>
            {/* Avatar */}
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: 'var(--color-blue-3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <User size={32} style={{ color: 'var(--color-blue-10)' }} />
            </div>
            <Stack gap={4}>
              <Row alignItems="center" gap={8}>
                <Text size="xl" weight="semibold">
                  {userData.name}
                </Text>
                <ManualUserBadge size="sm" />
              </Row>
              <Text size="sm" muted style={{ textTransform: 'capitalize' }}>
                {userData.userType}
              </Text>
            </Stack>
          </Row>

          {/* Actions */}
          {!isEditing && (
            <Row gap={8}>
              <Button variant="secondary" size="sm" onPress={handleStartEdit}>
                <Row alignItems="center" gap={6}>
                  <Edit2 size={14} />
                  <Text>Edit</Text>
                </Row>
              </Button>
              {canSendInvitation && (
                <Button
                  variant="primary"
                  size="sm"
                  onPress={handleSendInvitation}
                  disabled={sendInvitationMutation.isPending}
                >
                  <Row alignItems="center" gap={6}>
                    {sendInvitationMutation.isPending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Mail size={14} />
                    )}
                    <Text>
                      {invitationStatus.status === 'expired'
                        ? 'Resend Invitation'
                        : 'Send Invitation'}
                    </Text>
                  </Row>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onPress={() => setShowDeleteConfirm(true)}
                style={{ color: 'var(--color-red-10)', borderColor: 'var(--color-red-6)' }}
              >
                <Row alignItems="center" gap={6}>
                  <Trash2 size={14} />
                  <Text>Delete</Text>
                </Row>
              </Button>
            </Row>
          )}
        </Row>

        {/* Profile Content */}
        <Stack style={{ padding: 20 }} gap={20}>
          {isEditing ? (
            /* Edit Mode */
            <Stack gap={16}>
              <Stack gap={4}>
                <label>
                  <Text size="sm" weight="medium" muted>
                    Name
                  </Text>
                </label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter name"
                  style={{ width: '100%' }}
                />
              </Stack>
              <Stack gap={4}>
                <label>
                  <Text size="sm" weight="medium" muted>
                    Email
                  </Text>
                </label>
                <Input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="Enter email"
                  style={{ width: '100%' }}
                />
              </Stack>
              <Stack gap={4}>
                <label>
                  <Text size="sm" weight="medium" muted>
                    Phone
                  </Text>
                </label>
                <Input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="Enter phone"
                  style={{ width: '100%' }}
                />
              </Stack>
              <Stack gap={4}>
                <label>
                  <Text size="sm" weight="medium" muted>
                    Company
                  </Text>
                </label>
                <Input
                  value={editCompany}
                  onChange={(e) => setEditCompany(e.target.value)}
                  placeholder="Enter company"
                  style={{ width: '100%' }}
                />
              </Stack>
              <Row gap={12} style={{ paddingTop: 8 }}>
                <Button
                  variant="primary"
                  onPress={handleSaveEdit}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    'Save Changes'
                  )}
                </Button>
                <Button variant="secondary" onPress={handleCancelEdit}>
                  Cancel
                </Button>
              </Row>
            </Stack>
          ) : (
            /* View Mode */
            <Stack gap={16}>
              {/* Email */}
              <Row alignItems="center" gap={12}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    backgroundColor: 'var(--color-gray-3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Mail size={18} style={{ color: 'var(--color-gray-10)' }} />
                </div>
                <Stack>
                  <Text size="sm" muted>
                    Email
                  </Text>
                  <Text>{userData.email || 'Not provided'}</Text>
                </Stack>
              </Row>

              {/* Phone */}
              <Row alignItems="center" gap={12}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    backgroundColor: 'var(--color-gray-3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Phone size={18} style={{ color: 'var(--color-gray-10)' }} />
                </div>
                <Stack>
                  <Text size="sm" muted>
                    Phone
                  </Text>
                  <Text>{userData.phone || 'Not provided'}</Text>
                </Stack>
              </Row>

              {/* Company */}
              <Row alignItems="center" gap={12}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    backgroundColor: 'var(--color-gray-3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Building size={18} style={{ color: 'var(--color-gray-10)' }} />
                </div>
                <Stack>
                  <Text size="sm" muted>
                    Company
                  </Text>
                  <Text>{userData.company || 'Not provided'}</Text>
                </Stack>
              </Row>
            </Stack>
          )}
        </Stack>

        {/* Invitation Status Section */}
        <div style={{ borderTop: '1px solid var(--color-border)', padding: 20 }}>
          <Text size="sm" weight="semibold" muted style={{ marginBottom: 12 }}>
            Invitation Status
          </Text>
          <Row alignItems="center" gap={12}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                backgroundColor: statusDisplay.bgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <StatusIcon size={20} style={{ color: statusDisplay.color }} />
            </div>
            <Stack>
              <Text weight="medium" style={{ color: statusDisplay.color }}>
                {statusDisplay.text}
              </Text>
              <Text size="sm" muted>
                {statusDisplay.description}
              </Text>
            </Stack>
          </Row>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <Card
            style={{
              backgroundColor: 'var(--color-background)',
              borderRadius: 12,
              padding: 24,
              maxWidth: 400,
              margin: 16,
            }}
            onPress={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <Stack gap={16}>
              <Row alignItems="center" gap={12}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-red-3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Trash2 size={20} style={{ color: 'var(--color-red-10)' }} />
                </div>
                <Text size="lg" weight="semibold">
                  Delete User
                </Text>
              </Row>
              <Text>
                Are you sure you want to delete <strong>{userData.name}</strong>? This action cannot
                be undone. Any pending invitations will also be cancelled.
              </Text>
              <Row gap={12} style={{ paddingTop: 8 }}>
                <Button
                  variant="primary"
                  onPress={handleDelete}
                  disabled={deleteMutation.isPending}
                  style={{ backgroundColor: 'var(--color-red-10)' }}
                >
                  {deleteMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    'Delete User'
                  )}
                </Button>
                <Button variant="secondary" onPress={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
              </Row>
            </Stack>
          </Card>
        </div>
      )}

      {/* Email Prompt Dialog */}
      {showEmailPrompt && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}
          onClick={() => setShowEmailPrompt(false)}
        >
          <Card
            style={{
              backgroundColor: 'var(--color-background)',
              borderRadius: 12,
              padding: 24,
              maxWidth: 400,
              margin: 16,
            }}
            onPress={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <Stack gap={16}>
              <Row alignItems="center" gap={12}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-blue-3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Mail size={20} style={{ color: 'var(--color-blue-10)' }} />
                </div>
                <Text size="lg" weight="semibold">
                  Add Email Address
                </Text>
              </Row>
              <Text>
                An email address is required to send an invitation. Enter an email for{' '}
                <strong>{userData.name}</strong>:
              </Text>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter email address"
                style={{ width: '100%' }}
              />
              <Row gap={12} style={{ paddingTop: 8 }}>
                <Button
                  variant="primary"
                  onPress={handleSaveEmailAndInvite}
                  disabled={
                    !newEmail || updateMutation.isPending || sendInvitationMutation.isPending
                  }
                >
                  {updateMutation.isPending || sendInvitationMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    'Save & Send Invitation'
                  )}
                </Button>
                <Button variant="secondary" onPress={() => setShowEmailPrompt(false)}>
                  Cancel
                </Button>
              </Row>
            </Stack>
          </Card>
        </div>
      )}
    </Stack>
  )
}

export default ManualUserProfile
