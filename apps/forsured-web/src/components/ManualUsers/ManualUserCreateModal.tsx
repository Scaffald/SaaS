/**
 * ManualUserCreateModal - Modal wrapper for ManualUserForm
 * Manual user creation modal
 * Manual user creation modal
 *
 * Modal that opens when "Add Contractor" or "Add Client" button is clicked.
 * Reusable across manager and broker dashboards.
 */

'use client'

import React, { useEffect, useState } from 'react'
import { UserPlus, X } from 'lucide-react'
import { Stack, Row, Text, Button, Card, H2 } from '@unicornlove/beyond-ui'
import { toast } from 'sonner'
import { ManualUserForm, type ManualUserRole, type ManualUserFormData } from './ManualUserForm'
import { trpc } from '../../lib/trpc'

interface ManualUserCreateModalProps {
  isOpen: boolean
  onClose: () => void
  role: ManualUserRole
  organizationId: string
  onSuccess?: (userId: string) => void
  existingEmails?: string[]
}

export function ManualUserCreateModal({
  isOpen,
  onClose,
  role,
  organizationId,
  onSuccess,
  existingEmails = [],
}: ManualUserCreateModalProps) {
  const [loading, setLoading] = useState(false)

  const createMutation = trpc.manualUsers.create.useMutation()

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) {
      onClose()
    }
  }

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose, loading])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Handle form submit
  const handleSubmit = async (data: ManualUserFormData) => {
    setLoading(true)
    try {
      const result = await createMutation.mutateAsync({
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        userType: data.role,
        sendInvitation: data.sendInvitation,
      })

      const toastRoleLabel =
        data.role === 'contractor'
          ? 'Contractor'
          : data.role === 'broker'
            ? 'Broker'
            : data.role === 'manager'
              ? 'Manager'
              : 'Client'

      if (data.sendInvitation && data.email) {
        toast.success(`${toastRoleLabel} added and invitation sent`, {
          description: `${data.name} will receive an invitation at ${data.email}`,
        })
      } else {
        toast.success(`${toastRoleLabel} added successfully`, {
          description: `${data.name} has been added as a placeholder. They won't receive notifications until they register.`,
        })
      }

      onSuccess?.(result.user.id)
      onClose()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create user'
      toast.error('Failed to add user', { description: message })
      throw error // Re-throw to show in form
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const getRoleLabel = () => {
    switch (role) {
      case 'contractor':
        return 'Contractor'
      case 'broker':
        return 'Broker'
      case 'manager':
        return 'Manager'
      default:
        return 'Client'
    }
  }

  const getRoleDescription = () => {
    switch (role) {
      case 'contractor':
        return 'Add a contractor to your organization. They can be assigned tasks immediately.'
      case 'broker':
        return 'Add a broker to your network. You can invite them to connect later.'
      case 'manager':
        return 'Add a manager to your network. You can invite them to connect later.'
      default:
        return 'Add a client to your organization. You can manage their insurance and compliance.'
    }
  }

  const roleLabel = getRoleLabel()
  const roleDescription = getRoleDescription()

  return (
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
      role="dialog"
      aria-modal="true"
      aria-labelledby="manual-user-modal-title"
      onClick={handleBackdropClick}
    >
      <Card
        style={{
          backgroundColor: 'var(--color-background)',
          borderRadius: 8,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          width: '100%',
          maxWidth: 480,
          marginLeft: 16,
          marginRight: 16,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onPress={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Header */}
        <Row
          style={{
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 16,
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <Row style={{ alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: 'var(--color-blue-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UserPlus size={20} color="var(--color-blue-10)" />
            </div>
            <Stack>
              <H2
                id="manual-user-modal-title"
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: 'var(--color-gray-12)',
                }}
              >
                Add {roleLabel}
              </H2>
              <Text style={{ fontSize: 14, color: 'var(--color-gray-10)' }}>{roleDescription}</Text>
            </Stack>
          </Row>

          {/* Close Button */}
          <Button
            onPress={onClose}
            disabled={loading}
            variant="outline"
            size="sm"
            style={{ padding: 4, opacity: loading ? 0.5 : 1 }}
            aria-label="Close modal"
          >
            <X size={20} />
          </Button>
        </Row>

        {/* Form Content */}
        <Stack style={{ padding: 16 }}>
          <ManualUserForm
            role={role}
            onSubmit={handleSubmit}
            onCancel={onClose}
            loading={loading}
            existingEmails={existingEmails}
          />
        </Stack>
      </Card>
    </div>
  )
}

export default ManualUserCreateModal
