/**
 * AddSubcontractorToProjectModal - Modal for adding subcontractors to a project
 *
 * Features:
 * - Search/select from existing subcontractors linked to the organization
 * - Add new subcontractor if none exist or user wants to create new
 * - Adds to project_subcontractors table (and subcontractors table for new subs)
 */

'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  X,
  Search,
  Plus,
  UserPlus,
  Building,
  Loader2,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { Stack, Row, Text, H2, Input } from '@scaffald/ui';
import Button from '../Common/Button';
import {
  useOrganizationSubcontractors,
  type OrganizationSubcontractor,
} from '../../hooks/useOrganizationSubcontractors';
import { useProjectSubcontractors } from '../../hooks/useProjectSubcontractors';

interface AddSubcontractorToProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  organizationId?: string;
  currentUserId?: string;
  onSubcontractorAdded?: () => void;
}

type ModalView = 'select' | 'create';

interface NewSubcontractorForm {
  company: string;
  name: string;
  email: string;
  phone: string;
  trade_type: string;
}

export function AddSubcontractorToProjectModal({
  isOpen,
  onClose,
  projectId,
  organizationId,
  currentUserId,
  onSubcontractorAdded,
}: AddSubcontractorToProjectModalProps) {
  const { subcontractors, loading, createSubcontractor } = useOrganizationSubcontractors({
    organizationId,
  });

  const { addSubcontractorToProject } = useProjectSubcontractors({ projectId });

  const [view, setView] = useState<ModalView>('select');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubcontractor, setSelectedSubcontractor] = useState<OrganizationSubcontractor | null>(
    null
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newSubForm, setNewSubForm] = useState<NewSubcontractorForm>({
    company: '',
    name: '',
    email: '',
    phone: '',
    trade_type: '',
  });

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setView(subcontractors.length === 0 ? 'create' : 'select');
      setSearchQuery('');
      setSelectedSubcontractor(null);
      setError(null);
      setNewSubForm({ company: '', name: '', email: '', phone: '', trade_type: '' });
      // Focus search input when modal opens
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen, subcontractors.length]);

  // Filter subcontractors based on search
  const filteredSubcontractors = useMemo(() => {
    if (!searchQuery.trim()) return subcontractors;

    const query = searchQuery.toLowerCase();
    return subcontractors.filter(
      (sub) =>
        sub.company.toLowerCase().includes(query) ||
        sub.name.toLowerCase().includes(query) ||
        sub.trade_type?.toLowerCase().includes(query)
    );
  }, [subcontractors, searchQuery]);

  const handleSelectSubcontractor = useCallback((sub: OrganizationSubcontractor) => {
    setSelectedSubcontractor(sub);
    setError(null);
  }, []);

  const handleAddSelectedToProject = useCallback(async () => {
    if (!selectedSubcontractor || !currentUserId) {
      setError('Please select a subcontractor');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await addSubcontractorToProject({
        subcontractor_id: selectedSubcontractor.id,
        invited_by: currentUserId,
        status: 'invited',
      });
      onSubcontractorAdded?.();
      onClose();
    } catch (err) {
      console.error('[AddSubcontractorToProjectModal] Error adding subcontractor:', err);
      setError(err instanceof Error ? err.message : 'Failed to add subcontractor to project');
    } finally {
      setSaving(false);
    }
  }, [selectedSubcontractor, currentUserId, addSubcontractorToProject, onSubcontractorAdded, onClose]);

  const handleCreateAndAdd = useCallback(async () => {
    if (!newSubForm.company.trim() || !newSubForm.name.trim()) {
      setError('Company name and contact name are required');
      return;
    }

    if (!currentUserId) {
      setError('Missing user information');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // First create the subcontractor in the organization
      const newSub = await createSubcontractor({
        company: newSubForm.company,
        name: newSubForm.name,
        email: newSubForm.email,
        phone: newSubForm.phone,
        trade_type: newSubForm.trade_type,
      });

      // Then add to project
      await addSubcontractorToProject({
        subcontractor_id: newSub.id,
        invited_by: currentUserId,
        status: 'invited',
      });

      onSubcontractorAdded?.();
      onClose();
    } catch (err) {
      console.error('[AddSubcontractorToProjectModal] Error creating subcontractor:', err);
      setError(err instanceof Error ? err.message : 'Failed to create subcontractor');
    } finally {
      setSaving(false);
    }
  }, [newSubForm, currentUserId, createSubcontractor, addSubcontractorToProject, onSubcontractorAdded, onClose]);

  const handleFormChange = useCallback((field: keyof NewSubcontractorForm, value: string) => {
    setNewSubForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  }, [error]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  if (!isOpen) return null;

  const hasSubcontractors = subcontractors.length > 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-sub-modal-title"
      tabIndex={-1}
    >
      <div
        role="document"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 16,
          width: 520,
          maxWidth: '90vw',
          maxHeight: '85vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {/* Header */}
        <Row
          style={{
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 24,
            borderBottom: '1px solid var(--color-4)',
          }}
        >
          <Row style={{ alignItems: 'center', gap: 12 }}>
            {view === 'create' && hasSubcontractors && (
              <button
                type="button"
                onClick={() => setView('select')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                }}
              >
                <ArrowLeft size={20} color="var(--color-11)" />
              </button>
            )}
            <H2 id="add-sub-modal-title" style={{ margin: 0 }}>
              {view === 'create' ? 'Add New Subcontractor' : 'Add Subcontractor to Project'}
            </H2>
          </Row>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} color="var(--color-11)" />
          </button>
        </Row>

        {/* Body */}
        <Stack style={{ padding: 24, gap: 16, overflowY: 'auto', flex: 1 }}>
          {/* Error Message */}
          {error && (
            <Row
              style={{
                padding: 12,
                backgroundColor: 'var(--color-red2)',
                borderRadius: 8,
                gap: 8,
              }}
            >
              <Text style={{ fontSize: 14, color: 'var(--color-red11)' }}>{error}</Text>
            </Row>
          )}

          {loading ? (
            <Stack style={{ alignItems: 'center', paddingTop: 32, paddingBottom: 32 }}>
              <Loader2
                size={32}
                color="var(--color-10)"
                style={{ animation: 'spin 1s linear infinite' }}
              />
              <Text style={{ color: 'var(--color-10)', marginTop: 8 }}>Loading subcontractors...</Text>
            </Stack>
          ) : view === 'select' ? (
            // Select Existing Subcontractor View
            <Stack style={{ gap: 16 }}>
              {/* Search Input */}
              <Row
                style={{
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 12px',
                  backgroundColor: 'var(--color-2)',
                  borderRadius: 8,
                  border: '1px solid var(--color-6)',
                }}
              >
                <Search size={18} color="var(--color-10)" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search subcontractors by name or trade..."
                  style={{
                    flex: 1,
                    border: 'none',
                    background: 'none',
                    fontSize: 14,
                    color: 'var(--color-12)',
                    outline: 'none',
                  }}
                />
              </Row>

              {/* Subcontractor List */}
              <Stack style={{ gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                {filteredSubcontractors.length > 0 ? (
                  filteredSubcontractors.map((sub) => (
                    <Row
                      key={sub.id}
                      onClick={() => handleSelectSubcontractor(sub)}
                      style={{
                        alignItems: 'center',
                        gap: 12,
                        padding: 12,
                        borderRadius: 8,
                        cursor: 'pointer',
                        backgroundColor:
                          selectedSubcontractor?.id === sub.id
                            ? 'var(--color-blue2)'
                            : 'var(--color-2)',
                        border:
                          selectedSubcontractor?.id === sub.id
                            ? '2px solid var(--color-blue8)'
                            : '1px solid var(--color-4)',
                      }}
                    >
                      <Row
                        style={{
                          width: 40,
                          height: 40,
                          backgroundColor: 'var(--color-blue9)',
                          borderRadius: 8,
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Building size={20} color="white" />
                      </Row>
                      <Stack style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: 'var(--color-12)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {sub.company}
                        </Text>
                        <Text style={{ fontSize: 12, color: 'var(--color-10)' }}>
                          {sub.name}
                          {sub.trade_type && ` · ${sub.trade_type}`}
                        </Text>
                      </Stack>
                      {selectedSubcontractor?.id === sub.id && (
                        <Check size={20} color="var(--color-blue10)" />
                      )}
                    </Row>
                  ))
                ) : (
                  <Stack
                    style={{ alignItems: 'center', paddingTop: 24, paddingBottom: 24, gap: 8 }}
                  >
                    <Text style={{ color: 'var(--color-10)' }}>
                      {searchQuery
                        ? 'No subcontractors match your search'
                        : 'No subcontractors found'}
                    </Text>
                  </Stack>
                )}
              </Stack>

              {/* Add New Button */}
              <Row
                onClick={() => setView('create')}
                style={{
                  alignItems: 'center',
                  gap: 8,
                  padding: 12,
                  borderRadius: 8,
                  cursor: 'pointer',
                  backgroundColor: 'var(--color-2)',
                  border: '1px dashed var(--color-6)',
                }}
              >
                <Plus size={18} color="var(--color-blue10)" />
                <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-blue10)' }}>
                  Add New Subcontractor
                </Text>
              </Row>
            </Stack>
          ) : (
            // Create New Subcontractor View
            <Stack style={{ gap: 16 }}>
              {/* Company Name */}
              <Stack style={{ gap: 6 }}>
                <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-11)' }}>
                  Company Name *
                </Text>
                <Input
                  value={newSubForm.company}
                  onChange={(e) => handleFormChange('company', e.target.value)}
                  placeholder="Enter company name..."
                  style={{
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: '1px solid var(--color-6)',
                    fontSize: 14,
                  }}
                />
              </Stack>

              {/* Contact Name */}
              <Stack style={{ gap: 6 }}>
                <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-11)' }}>
                  Contact Name *
                </Text>
                <Input
                  value={newSubForm.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  placeholder="Enter contact name..."
                  style={{
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: '1px solid var(--color-6)',
                    fontSize: 14,
                  }}
                />
              </Stack>

              {/* Trade Type */}
              <Stack style={{ gap: 6 }}>
                <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-11)' }}>
                  Trade / Specialty
                </Text>
                <Input
                  value={newSubForm.trade_type}
                  onChange={(e) => handleFormChange('trade_type', e.target.value)}
                  placeholder="e.g., Electrical, Plumbing, HVAC..."
                  style={{
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: '1px solid var(--color-6)',
                    fontSize: 14,
                  }}
                />
              </Stack>

              {/* Email and Phone Row */}
              <Row style={{ gap: 16 }}>
                <Stack style={{ gap: 6, flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-11)' }}>
                    Email
                  </Text>
                  <Input
                    type="email"
                    value={newSubForm.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                    placeholder="email@company.com"
                    style={{
                      padding: '12px 16px',
                      borderRadius: 8,
                      border: '1px solid var(--color-6)',
                      fontSize: 14,
                    }}
                  />
                </Stack>
                <Stack style={{ gap: 6, flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-11)' }}>
                    Phone
                  </Text>
                  <Input
                    type="tel"
                    value={newSubForm.phone}
                    onChange={(e) => handleFormChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                    style={{
                      padding: '12px 16px',
                      borderRadius: 8,
                      border: '1px solid var(--color-6)',
                      fontSize: 14,
                    }}
                  />
                </Stack>
              </Row>
            </Stack>
          )}
        </Stack>

        {/* Footer */}
        <Row
          style={{
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 12,
            padding: 24,
            borderTop: '1px solid var(--color-4)',
            backgroundColor: 'var(--color-1)',
          }}
        >
          <Button color="gray" onPress={onClose} disabled={saving}>
            Cancel
          </Button>

          {view === 'select' ? (
            <Button
              color="primary"
              onPress={handleAddSelectedToProject}
              disabled={!selectedSubcontractor || saving}
              iconStart={saving ? Loader2 : UserPlus}
            >
              {saving ? 'Adding...' : 'Add to Project'}
            </Button>
          ) : (
            <Button
              color="primary"
              onPress={handleCreateAndAdd}
              disabled={!newSubForm.company.trim() || !newSubForm.name.trim() || saving}
              iconStart={saving ? Loader2 : UserPlus}
            >
              {saving ? 'Creating...' : 'Create & Add to Project'}
            </Button>
          )}
        </Row>
      </div>
    </div>
  );
}

export default AddSubcontractorToProjectModal;
