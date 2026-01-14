/**
 * Admin User Set Types Management Page
 * REQ-4: Multi-Industry User Set Type System with Configurable Lexicon
 * TASK-9: Build admin user set type management UI
 *
 * Allows administrators to:
 * - View all user set types
 * - Create new user set types
 * - Edit existing user set types
 * - Toggle active/inactive status
 * - Delete user set types
 */
import { useState } from 'react';
import {
  PlusCircle,
  Edit,
  Trash2,
  RefreshCcw,
  X,
  RotateCcw,
  Building2,
  Users,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { Stack, Row, Text, Button, Card, H1, H3, Spinner, Input } from '@unicornlove/beyond-ui';
import { EmptyState } from '../../ui/EmptyState';
import Textarea from '../../components/Common/Textarea';
import { trpc } from '../../lib/trpc';

interface UserSetTypeFormData {
  name: string;
  slug: string;
  managerLabelSingular: string;
  managerLabelPlural: string;
  contractorLabelSingular: string;
  contractorLabelPlural: string;
  description: string;
}

const DEFAULT_FORM_DATA: UserSetTypeFormData = {
  name: '',
  slug: '',
  managerLabelSingular: '',
  managerLabelPlural: '',
  contractorLabelSingular: '',
  contractorLabelPlural: '',
  description: '',
};

function AdminUserSetTypes() {
  // State
  const [showInactive, setShowInactive] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<UserSetTypeFormData>(DEFAULT_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // tRPC queries and mutations
  const {
    data: userSetTypes,
    isLoading,
    error,
    refetch,
  } = trpc.userSetTypes.list.useQuery();

  const createMutation = trpc.userSetTypes.create.useMutation();
  const updateMutation = trpc.userSetTypes.update.useMutation();
  const toggleActiveMutation = trpc.userSetTypes.toggleActive.useMutation();

  // Filter by active status
  const displayedTypes = userSetTypes?.filter(
    (ust) => showInactive || ust.isActive
  ) ?? [];

  // Count stats
  const activeCount = userSetTypes?.filter((ust) => ust.isActive).length ?? 0;
  const totalCount = userSetTypes?.length ?? 0;

  const handleRefresh = () => {
    refetch();
  };

  const openAddModal = () => {
    setModalMode('add');
    setEditingId(null);
    setFormData(DEFAULT_FORM_DATA);
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (userSetType: typeof displayedTypes[0]) => {
    setModalMode('edit');
    setEditingId(userSetType.id);
    setFormData({
      name: userSetType.name,
      slug: userSetType.slug,
      managerLabelSingular: userSetType.managerLabelSingular,
      managerLabelPlural: userSetType.managerLabelPlural,
      contractorLabelSingular: userSetType.contractorLabelSingular,
      contractorLabelPlural: userSetType.contractorLabelPlural,
      description: userSetType.description ?? '',
    });
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormError(null);
  };

  // Generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      // Auto-generate slug when adding new type
      ...(modalMode === 'add' ? { slug: generateSlug(name) } : {}),
    }));
  };

  const handleSubmit = async (e?: React.FormEvent | any) => {
    e?.preventDefault?.();

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (modalMode === 'add') {
        await createMutation.mutateAsync({
          name: formData.name,
          slug: formData.slug,
          managerLabelSingular: formData.managerLabelSingular,
          managerLabelPlural: formData.managerLabelPlural,
          contractorLabelSingular: formData.contractorLabelSingular,
          contractorLabelPlural: formData.contractorLabelPlural,
          description: formData.description || undefined,
        });
      } else if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          name: formData.name,
          managerLabelSingular: formData.managerLabelSingular,
          managerLabelPlural: formData.managerLabelPlural,
          contractorLabelSingular: formData.contractorLabelSingular,
          contractorLabelPlural: formData.contractorLabelPlural,
          description: formData.description || undefined,
        });
      }

      closeModal();
      refetch();
    } catch (err) {
      console.error('Failed to save user set type:', err);
      setFormError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, currentlyActive: boolean) => {
    const action = currentlyActive ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} this user set type?`)) return;

    setActionInProgress(id);
    try {
      await toggleActiveMutation.mutateAsync({
        id,
        isActive: !currentlyActive,
      });
      refetch();
    } catch (err) {
      console.error('Failed to toggle active status:', err);
      alert(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setActionInProgress(null);
    }
  };

  if (isLoading) {
    return (
      <Stack style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-6)' }}>
        <Spinner size="large" />
        <Text style={{ marginLeft: 'var(--space-2)' }}>Loading user set types...</Text>
      </Stack>
    );
  }

  return (
    <Stack>
      <Row style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <Stack>
          <H1 style={{ fontSize: 'var(--font-size-8)', fontWeight: 'bold' }}>Industry Verticals</H1>
          <Text style={{ color: 'var(--color-gray-11)', fontSize: 'var(--font-size-3)', marginTop: 'var(--space-1)' }}>
            Manage user set types for different industry verticals (Construction, Property Management, etc.)
          </Text>
        </Stack>
        <Row style={{ alignItems: 'center', gap: 'var(--space-3)' }}>
          <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
            />
            <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-gray-11)' }}>
              Show inactive ({totalCount - activeCount})
            </Text>
          </Row>
          <Button
            onPress={handleRefresh}
            disabled={isLoading}
            variant="outline"
            iconStart={isLoading ? undefined : RefreshCcw}
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
          <Button
            color="primary"
            iconStart={PlusCircle}
            onPress={openAddModal}
          >
            Add Industry
          </Button>
        </Row>
      </Row>

      {error && (
        <Stack style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-4)', backgroundColor: 'var(--color-red-2)', borderWidth: 1, borderColor: 'var(--color-red-6)', borderRadius: 'var(--radius-4)' }}>
          <Text style={{ color: 'var(--color-red-10)' }}>Error: {error.message}</Text>
        </Stack>
      )}

      {/* Summary Cards */}
      <Row style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
        <Card style={{ flex: 1, minWidth: 200, padding: 'var(--space-4)' }}>
          <Row style={{ alignItems: 'center', gap: 'var(--space-3)' }}>
            <Stack style={{ padding: 'var(--space-2)', backgroundColor: 'var(--color-blue-3)', borderRadius: 'var(--radius-4)' }}>
              <Building2 size={20} color="var(--color-blue-9)" />
            </Stack>
            <Stack>
              <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-gray-11)' }}>Total Industries</Text>
              <Text style={{ fontSize: 'var(--font-size-8)', fontWeight: 'bold' }}>{totalCount}</Text>
            </Stack>
          </Row>
        </Card>
        <Card style={{ flex: 1, minWidth: 200, padding: 'var(--space-4)' }}>
          <Row style={{ alignItems: 'center', gap: 'var(--space-3)' }}>
            <Stack style={{ padding: 'var(--space-2)', backgroundColor: 'var(--color-green-3)', borderRadius: 'var(--radius-4)' }}>
              <Check size={20} color="var(--color-green-9)" />
            </Stack>
            <Stack>
              <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-gray-11)' }}>Active</Text>
              <Text style={{ fontSize: 'var(--font-size-8)', fontWeight: 'bold' }}>{activeCount}</Text>
            </Stack>
          </Row>
        </Card>
        <Card style={{ flex: 1, minWidth: 200, padding: 'var(--space-4)' }}>
          <Row style={{ alignItems: 'center', gap: 'var(--space-3)' }}>
            <Stack style={{ padding: 'var(--space-2)', backgroundColor: 'var(--color-gray-3)', borderRadius: 'var(--radius-4)' }}>
              <Users size={20} color="var(--color-gray-11)" />
            </Stack>
            <Stack>
              <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-gray-11)' }}>Users Assigned</Text>
              <Text style={{ fontSize: 'var(--font-size-8)', fontWeight: 'bold' }}>
                {userSetTypes?.reduce((sum, ust) => sum + (ust.userCount ?? 0), 0) ?? 0}
              </Text>
            </Stack>
          </Row>
        </Card>
      </Row>

      {/* User Set Types Table */}
      <Card style={{ padding: 'var(--space-6)' }}>
        {displayedTypes.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={showInactive ? "No inactive industries found" : "No industry verticals yet"}
            description={showInactive
              ? "All industry verticals are currently active. Deactivate one to see it here."
              : "Create your first industry vertical to customize terminology and user roles for different business types."}
            action={!showInactive ? {
              label: "Create Industry",
              onClick: openAddModal,
            } : undefined}
          />
        ) : (
          <Stack>
            <Row style={{ borderBottomWidth: 1, borderColor: 'var(--color-border)', paddingTop: 'var(--space-2)', paddingBottom: 'var(--space-2)', paddingLeft: 'var(--space-4)', paddingRight: 'var(--space-4)' }}>
              <Text style={{ flex: 2, fontWeight: 600 }}>Industry</Text>
              <Text style={{ flex: 1, fontWeight: 600 }}>Slug</Text>
              <Text style={{ flex: 1, fontWeight: 600 }}>Manager Label</Text>
              <Text style={{ flex: 1, fontWeight: 600 }}>Contractor Label</Text>
              <Text style={{ flex: 0.5, fontWeight: 600, textAlign: 'center' }}>Users</Text>
              <Text style={{ flex: 0.5, fontWeight: 600 }}>Status</Text>
              <Text style={{ flex: 0.5, fontWeight: 600 }}>Actions</Text>
            </Row>
            {displayedTypes.map((ust) => (
              <Row
                key={ust.id}
                style={{
                  borderBottomWidth: 1,
                  borderColor: 'var(--color-border)',
                  paddingTop: 'var(--space-3)',
                  paddingBottom: 'var(--space-3)',
                  paddingLeft: 'var(--space-4)',
                  paddingRight: 'var(--space-4)',
                  opacity: !ust.isActive ? 0.6 : 1,
                  backgroundColor: !ust.isActive ? 'var(--color-gray-2)' : 'transparent'
                }}
              >
                <Stack style={{ flex: 2 }}>
                  <Text style={{ fontWeight: 500 }}>{ust.name}</Text>
                  {ust.description && (
                    <Text style={{ fontSize: 'var(--font-size-1)', color: 'var(--color-gray-11)', marginTop: 'var(--space-1)' }}>{ust.description}</Text>
                  )}
                </Stack>
                <Text style={{ flex: 1, fontFamily: 'monospace', fontSize: 'var(--font-size-3)', color: 'var(--color-gray-11)' }}>
                  {ust.slug}
                </Text>
                <Stack style={{ flex: 1 }}>
                  <Text style={{ fontSize: 'var(--font-size-3)' }}>{ust.managerLabelSingular}</Text>
                  <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-gray-11)' }}>({ust.managerLabelPlural})</Text>
                </Stack>
                <Stack style={{ flex: 1 }}>
                  <Text style={{ fontSize: 'var(--font-size-3)' }}>{ust.contractorLabelSingular}</Text>
                  <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-gray-11)' }}>({ust.contractorLabelPlural})</Text>
                </Stack>
                <Row style={{ flex: 0.5, justifyContent: 'center' }}>
                  <Text
                    style={{
                      paddingLeft: 'var(--space-2)',
                      paddingRight: 'var(--space-2)',
                      paddingTop: 'var(--space-1)',
                      paddingBottom: 'var(--space-1)',
                      backgroundColor: 'var(--color-gray-3)',
                      borderRadius: 'var(--radius-2)',
                      fontSize: 'var(--font-size-3)'
                    }}
                  >
                    {ust.userCount ?? 0}
                  </Text>
                </Row>
                <Row style={{ flex: 0.5 }}>
                  <Text
                    style={{
                      paddingLeft: 'var(--space-2)',
                      paddingRight: 'var(--space-2)',
                      paddingTop: 'var(--space-1)',
                      paddingBottom: 'var(--space-1)',
                      borderRadius: 'var(--radius-2)',
                      fontSize: 'var(--font-size-1)',
                      backgroundColor: ust.isActive ? 'var(--color-green-3)' : 'var(--color-gray-3)',
                      color: ust.isActive ? 'var(--color-green-10)' : 'var(--color-gray-11)'
                    }}
                  >
                    {ust.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </Row>
                <Row style={{ flex: 0.5, alignItems: 'center', gap: 'var(--space-1)' }}>
                  <Button
                    onPress={() => openEditModal(ust)}
                    disabled={actionInProgress === ust.id}
                    variant="outline"
                    size="sm"
                    iconStart={Edit}
                    iconOnly
                    style={{ opacity: actionInProgress === ust.id ? 0.5 : 1 }}
                  />
                  {ust.isActive ? (
                    <Button
                      onPress={() => handleToggleActive(ust.id, true)}
                      disabled={actionInProgress === ust.id || (ust.userCount ?? 0) > 0}
                      variant="outline"
                      size="sm"
                      iconStart={actionInProgress === ust.id ? undefined : Trash2}
                      iconOnly
                      style={{ opacity: actionInProgress === ust.id || (ust.userCount ?? 0) > 0 ? 0.5 : 1, color: 'var(--color-red-9)' }}
                    />
                  ) : (
                    <Button
                      onPress={() => handleToggleActive(ust.id, false)}
                      disabled={actionInProgress === ust.id}
                      variant="outline"
                      size="sm"
                      iconStart={actionInProgress === ust.id ? undefined : RotateCcw}
                      iconOnly
                      style={{ opacity: actionInProgress === ust.id ? 0.5 : 1, color: 'var(--color-green-9)' }}
                    />
                  )}
                </Row>
              </Row>
            ))}
          </Stack>
        )}
      </Card>

      {/* Add/Edit Modal */}
      {showModal && (
        <Stack
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50
          }}
        >
          <Card
            style={{
              backgroundColor: 'white',
              borderRadius: 'var(--radius-4)',
              width: '100%',
              maxWidth: 600,
              marginLeft: 'var(--space-4)',
              marginRight: 'var(--space-4)',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
          >
            <Row
              style={{
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-4)',
                borderBottomWidth: 1,
                borderColor: 'var(--color-border)',
                position: 'sticky',
                top: 0,
                backgroundColor: 'white'
              }}
            >
              <H3 style={{ fontSize: 'var(--font-size-5)', fontWeight: 600 }}>
                {modalMode === 'add' ? 'Add Industry Vertical' : 'Edit Industry Vertical'}
              </H3>
              <Button
                onPress={closeModal}
                variant="outline"
                size="sm"
                iconStart={X}
                iconOnly
                style={{ color: 'var(--color-gray-11)' }}
              />
            </Row>

            <Stack style={{ padding: 'var(--space-4)', gap: 'var(--space-4)' }}>
              {formError && (
                <Row
                  style={{
                    padding: 'var(--space-3)',
                    backgroundColor: 'var(--color-red-2)',
                    borderWidth: 1,
                    borderColor: 'var(--color-red-6)',
                    borderRadius: 'var(--radius-2)',
                    color: 'var(--color-red-10)',
                    fontSize: 'var(--font-size-3)',
                    alignItems: 'flex-start',
                    gap: 'var(--space-2)'
                  }}
                >
                  <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                  <Text style={{ color: 'var(--color-red-10)', fontSize: 'var(--font-size-3)' }}>{formError}</Text>
                </Row>
              )}

              <Stack style={{ gap: 'var(--space-4)' }}>
                <Stack>
                  <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: 500, color: 'var(--color-gray-12)', marginBottom: 'var(--space-1)' }}>
                    Industry Name *
                  </Text>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g., Construction, Property Management"
                    style={{ borderWidth: 1, borderColor: 'var(--color-border)', borderRadius: 'var(--radius-2)', padding: 'var(--space-2)', width: '100%' }}
                  />
                </Stack>

                <Stack>
                  <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: 500, color: 'var(--color-gray-12)', marginBottom: 'var(--space-1)' }}>
                    Slug *
                  </Text>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    disabled={modalMode === 'edit'}
                    placeholder="e.g., construction"
                    style={{
                      borderWidth: 1,
                      borderColor: 'var(--color-border)',
                      borderRadius: 'var(--radius-2)',
                      padding: 'var(--space-2)',
                      width: '100%',
                      fontFamily: 'monospace',
                      backgroundColor: modalMode === 'edit' ? 'var(--color-gray-3)' : 'white'
                    }}
                  />
                  {modalMode === 'edit' && (
                    <Text style={{ marginTop: 'var(--space-1)', fontSize: 'var(--font-size-1)', color: 'var(--color-gray-11)' }}>
                      Slug cannot be changed after creation
                    </Text>
                  )}
                </Stack>
              </Stack>

              <Stack style={{ borderTopWidth: 1, borderColor: 'var(--color-border)', paddingTop: 'var(--space-4)' }}>
                <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: 500, color: 'var(--color-gray-12)', marginBottom: 'var(--space-3)' }}>
                  Manager Role Labels
                </Text>
                <Row style={{ gap: 'var(--space-4)' }}>
                  <Stack style={{ flex: 1 }}>
                    <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-gray-11)', marginBottom: 'var(--space-1)' }}>
                      Singular *
                    </Text>
                    <Input
                      value={formData.managerLabelSingular}
                      onChange={(e) => setFormData((prev) => ({ ...prev, managerLabelSingular: e.target.value }))}
                      placeholder="e.g., General Contractor"
                      style={{ borderWidth: 1, borderColor: 'var(--color-border)', borderRadius: 'var(--radius-2)', padding: 'var(--space-2)', width: '100%' }}
                    />
                  </Stack>
                  <Stack style={{ flex: 1 }}>
                    <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-gray-11)', marginBottom: 'var(--space-1)' }}>
                      Plural *
                    </Text>
                    <Input
                      value={formData.managerLabelPlural}
                      onChange={(e) => setFormData((prev) => ({ ...prev, managerLabelPlural: e.target.value }))}
                      placeholder="e.g., General Contractors"
                      style={{ borderWidth: 1, borderColor: 'var(--color-border)', borderRadius: 'var(--radius-2)', padding: 'var(--space-2)', width: '100%' }}
                    />
                  </Stack>
                </Row>
              </Stack>

              <Stack style={{ borderTopWidth: 1, borderColor: 'var(--color-border)', paddingTop: 'var(--space-4)' }}>
                <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: 500, color: 'var(--color-gray-12)', marginBottom: 'var(--space-3)' }}>
                  Contractor Role Labels
                </Text>
                <Row style={{ gap: 'var(--space-4)' }}>
                  <Stack style={{ flex: 1 }}>
                    <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-gray-11)', marginBottom: 'var(--space-1)' }}>
                      Singular *
                    </Text>
                    <Input
                      value={formData.contractorLabelSingular}
                      onChange={(e) => setFormData((prev) => ({ ...prev, contractorLabelSingular: e.target.value }))}
                      placeholder="e.g., Subcontractor"
                      style={{ borderWidth: 1, borderColor: 'var(--color-border)', borderRadius: 'var(--radius-2)', padding: 'var(--space-2)', width: '100%' }}
                    />
                  </Stack>
                  <Stack style={{ flex: 1 }}>
                    <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-gray-11)', marginBottom: 'var(--space-1)' }}>
                      Plural *
                    </Text>
                    <Input
                      value={formData.contractorLabelPlural}
                      onChange={(e) => setFormData((prev) => ({ ...prev, contractorLabelPlural: e.target.value }))}
                      placeholder="e.g., Subcontractors"
                      style={{ borderWidth: 1, borderColor: 'var(--color-border)', borderRadius: 'var(--radius-2)', padding: 'var(--space-2)', width: '100%' }}
                    />
                  </Stack>
                </Row>
              </Stack>

              <Stack style={{ borderTopWidth: 1, borderColor: 'var(--color-border)', paddingTop: 'var(--space-4)' }}>
                <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: 500, color: 'var(--color-gray-12)', marginBottom: 'var(--space-1)' }}>
                  Description (optional)
                </Text>
                <TextArea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this industry vertical"
                  style={{ borderWidth: 1, borderColor: 'var(--color-border)', borderRadius: 'var(--radius-2)', padding: 'var(--space-2)', width: '100%', minHeight: 60 }}
                />
              </Stack>

              <Row style={{ justifyContent: 'flex-end', gap: 'var(--space-3)', paddingTop: 'var(--space-4)', borderTopWidth: 1, borderColor: 'var(--color-border)' }}>
                <Button
                  onPress={closeModal}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onPress={(e) => {
                    e?.preventDefault?.();
                    handleSubmit(e as unknown as React.FormEvent);
                  }}
                  disabled={isSubmitting}
                  color="primary"
                >
                  {isSubmitting ? 'Saving...' : (modalMode === 'add' ? 'Create Industry' : 'Save Changes')}
                </Button>
              </Row>
            </Stack>
          </Card>
        </Stack>
      )}
    </Stack>
  );
}

export default AdminUserSetTypes;
