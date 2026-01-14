import { useState, useEffect, useMemo } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Stack, Row, Text, Card, Button as BeyondButton } from '@unicornlove/beyond-ui';
import { useBrokerAcknowledgements } from '../../hooks/useBrokerAcknowledgements';
import { useProjects } from '../../hooks/useProjects';
import { useRelationships } from '../../hooks/useRelationships';
import { useDatabase } from '../../contexts/DatabaseContext';
import { authorizationService } from '../../lib/auth/authorizationService';
import Button from '../Common/Button';

interface CreateBrokerAckFormModalProps {
  onClose: () => void;
  onCreated: (formId: string) => void;
}

interface SubcontractorOption {
  id: string;
  org_id: string;
  company_name: string;
}

export default function CreateBrokerAckFormModal({
  onClose,
  onCreated,
}: CreateBrokerAckFormModalProps) {
  const { createForm } = useBrokerAcknowledgements();
  const { projects } = useProjects();
  const { forsured } = useDatabase();
  const managerOrgId = authorizationService.getOrganizationId();
  const { relationships, loading: relationshipsLoading } = useRelationships(managerOrgId || undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subcontractors, setSubcontractors] = useState<SubcontractorOption[]>([]);
  const [loadingSubcontractors, setLoadingSubcontractors] = useState(false);

  const [formData, setFormData] = useState({
    project_id: '',
    subcontractor_company_name: '',
    subcontractor_org_id: '',
    broker_agency_name: '',
    broker_contact_name: '',
    broker_email: '',
    broker_phone: '',
    broker_org_id: '',
    gc_project_name: '',
    requires_pollution_liability: false,
    requires_professional_liability: false,
    involves_residential_work: false,
  });

  const selectedProject = projects.find((p) => p.id === formData.project_id);

  // Get subcontractor organization IDs from relationships
  const subcontractorOrgIds = useMemo(() => {
    if (!managerOrgId || !relationships.length) return [];
    return relationships
      .filter((rel) => rel.manager_org_id === managerOrgId)
      .map((rel) => rel.subcontractor_org_id);
  }, [managerOrgId, relationships]);

  // Fetch subcontractors based on relationships
  useEffect(() => {
    async function fetchSubcontractors() {
      if (!subcontractorOrgIds.length || !forsured) {
        setSubcontractors([]);
        return;
      }

      setLoadingSubcontractors(true);
      try {
        const { data, error: queryError } = await forsured('subcontractors')
          .select('id, organization_id, company')
          .in('organization_id', subcontractorOrgIds)
          .order('company', { ascending: true });

        if (queryError) {
          console.error('Failed to fetch subcontractors:', queryError);
          setSubcontractors([]);
          return;
        }

        // Map and deduplicate by organization_id (since form uses subcontractor_org_id)
        const orgMap = new Map<string, SubcontractorOption>();
        (data || []).forEach((sub: { id: string; organization_id: string; company: string }) => {
          if (!orgMap.has(sub.organization_id)) {
            orgMap.set(sub.organization_id, {
              id: sub.id,
              org_id: sub.organization_id,
              company_name: sub.company,
            });
          }
        });

        setSubcontractors(Array.from(orgMap.values()));
      } catch (err) {
        console.error('Error fetching subcontractors:', err);
        setSubcontractors([]);
      } finally {
        setLoadingSubcontractors(false);
      }
    }

    fetchSubcontractors();
  }, [subcontractorOrgIds, forsured]);

  useEffect(() => {
    if (selectedProject) {
      setFormData((prev) => ({
        ...prev,
        gc_project_name: selectedProject.name,
      }));
    }
  }, [selectedProject]);

  // Update form data when subcontractor is selected
  useEffect(() => {
    if (formData.subcontractor_org_id) {
      const selectedSub = subcontractors.find((sub) => sub.org_id === formData.subcontractor_org_id);
      if (selectedSub) {
        setFormData((prev) => ({
          ...prev,
          subcontractor_company_name: selectedSub.company_name,
        }));
      }
    }
  }, [formData.subcontractor_org_id, subcontractors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!formData.project_id) {
        throw new Error('Please select a project');
      }
      if (!formData.subcontractor_org_id) {
        throw new Error('Please select a subcontractor');
      }
      if (!formData.broker_agency_name) {
        throw new Error('Please enter broker agency name');
      }
      if (!formData.broker_contact_name) {
        throw new Error('Please enter broker contact name');
      }
      if (!formData.broker_email) {
        throw new Error('Please enter broker email');
      }

      const newForm = await createForm({
        ...formData,
        gc_project_name: selectedProject?.name || '',
        manager_org_id: selectedProject?.gc_org_id || '',
        status: 'draft',
        compliance_status: 'pending',
        compliance_score: 0,
        missing_endorsements: [],
        date_issued: new Date().toISOString(),
        date_due: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      if (newForm?.id) {
        onCreated(newForm.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: 'var(--space-4)',
      }}
    >
      <Card
        style={{
          maxWidth: 672,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <Row
          style={{
            position: 'sticky',
            top: 0,
            borderBottom: '1px solid var(--color-border)',
            paddingLeft: 'var(--space-6)',
            paddingRight: 'var(--space-6)',
            paddingTop: 'var(--space-4)',
            paddingBottom: 'var(--space-4)',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--color-background)',
          }}
        >
          <Text style={{ fontSize: 'var(--font-size-7)', fontWeight: 'bold', color: 'var(--color-gray-12)' }}>
            Create Broker Acknowledgement Form
          </Text>
          <BeyondButton
            onPress={onClose}
            style={{
              padding: 'var(--space-1)',
              backgroundColor: 'transparent',
              color: 'var(--color-gray-11)',
            }}
          >
            <X size={24} />
          </BeyondButton>
        </Row>

        <form onSubmit={handleSubmit}>
          <Stack style={{ padding: 'var(--space-6)', gap: 'var(--space-6)' }}>
            {error && (
              <Card
                style={{
                  backgroundColor: 'var(--color-red-3)',
                  border: '1px solid var(--color-red-6)',
                  borderRadius: 'var(--radius-4)',
                  padding: 'var(--space-4)',
                }}
              >
                <Row style={{ alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                  <AlertCircle
                    size={20}
                    style={{ color: 'var(--color-red-10)', flexShrink: 0, marginTop: 'var(--space-0-5)' }}
                  />
                  <Stack>
                    <Text style={{ fontWeight: 500, color: 'var(--color-red-11)' }}>Error</Text>
                    <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-red-10)', marginTop: 'var(--space-1)' }}>{error}</Text>
                  </Stack>
                </Row>
              </Card>
            )}

            <Stack>
              <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-gray-12)', display: 'block', marginBottom: 'var(--space-2)' }}>
                Project <span style={{ color: 'var(--color-red-10)' }}>*</span>
              </Text>
              <select
                value={formData.project_id}
                onChange={(e) =>
                  setFormData({ ...formData, project_id: e.target.value })
                }
                required
                style={{
                  width: '100%',
                  paddingLeft: 'var(--space-4)',
                  paddingRight: 'var(--space-4)',
                  paddingTop: 'var(--space-2)',
                  paddingBottom: 'var(--space-2)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-4)',
                }}
              >
                <option value="">Select a project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </Stack>

            <Stack style={{ paddingTop: 'var(--space-6)', borderTop: '1px solid var(--color-border)' }}>
              <Text style={{ fontSize: 'var(--font-size-6)', fontWeight: 600, color: 'var(--color-gray-12)', marginBottom: 'var(--space-4)' }}>
                Subcontractor Information
              </Text>

              <Stack style={{ gap: 'var(--space-4)' }}>
                <Stack>
                  <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-gray-12)', display: 'block', marginBottom: 'var(--space-2)' }}>
                    Subcontractor <span style={{ color: 'var(--color-red-10)' }}>*</span>
                  </Text>
                  <select
                    value={formData.subcontractor_org_id}
                    onChange={(e) => {
                      const selectedSub = subcontractors.find((sub) => sub.org_id === e.target.value);
                      setFormData({
                        ...formData,
                        subcontractor_org_id: e.target.value,
                        subcontractor_company_name: selectedSub?.company_name || '',
                      });
                    }}
                    required
                    disabled={loadingSubcontractors || relationshipsLoading || subcontractors.length === 0}
                    style={{
                      width: '100%',
                      paddingLeft: 'var(--space-4)',
                      paddingRight: 'var(--space-4)',
                      paddingTop: 'var(--space-2)',
                      paddingBottom: 'var(--space-2)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-4)',
                      opacity: loadingSubcontractors || relationshipsLoading ? 0.6 : 1,
                    }}
                  >
                    <option value="">
                      {loadingSubcontractors || relationshipsLoading
                        ? 'Loading subcontractors...'
                        : subcontractors.length === 0
                        ? 'No subcontractors available'
                        : 'Select a subcontractor'}
                    </option>
                    {subcontractors.map((sub) => (
                      <option key={sub.org_id} value={sub.org_id}>
                        {sub.company_name}
                      </option>
                    ))}
                  </select>
                </Stack>
              </Stack>
            </Stack>

            <Stack style={{ paddingTop: 'var(--space-6)', borderTop: '1px solid var(--color-border)' }}>
              <Text style={{ fontSize: 'var(--font-size-6)', fontWeight: 600, color: 'var(--color-gray-12)', marginBottom: 'var(--space-4)' }}>
                Broker Information
              </Text>

              <Stack style={{ gap: 'var(--space-4)' }}>
                <Stack>
                  <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-gray-12)', display: 'block', marginBottom: 'var(--space-2)' }}>
                    Agency Name <span style={{ color: 'var(--color-red-10)' }}>*</span>
                  </Text>
                  <input
                    type="text"
                    value={formData.broker_agency_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        broker_agency_name: e.target.value,
                      })
                    }
                    required
                    style={{
                      width: '100%',
                      paddingLeft: 'var(--space-4)',
                      paddingRight: 'var(--space-4)',
                      paddingTop: 'var(--space-2)',
                      paddingBottom: 'var(--space-2)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-4)',
                    }}
                  />
                </Stack>

                <Row
                  style={{
                    flexWrap: 'wrap',
                    gap: 'var(--space-4)',
                  }}
                >
                  <Stack style={{ flex: 1, minWidth: '200px' }}>
                    <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-gray-12)', display: 'block', marginBottom: 'var(--space-2)' }}>
                      Contact Name <span style={{ color: 'var(--color-red-10)' }}>*</span>
                    </Text>
                    <input
                      type="text"
                      value={formData.broker_contact_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          broker_contact_name: e.target.value,
                        })
                      }
                      required
                      style={{
                        width: '100%',
                        paddingLeft: 'var(--space-4)',
                        paddingRight: 'var(--space-4)',
                        paddingTop: 'var(--space-2)',
                        paddingBottom: 'var(--space-2)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-4)',
                      }}
                    />
                  </Stack>

                  <Stack style={{ flex: 1, minWidth: '200px' }}>
                    <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-gray-12)', display: 'block', marginBottom: 'var(--space-2)' }}>
                      Phone
                    </Text>
                    <input
                      type="tel"
                      value={formData.broker_phone}
                      onChange={(e) =>
                        setFormData({ ...formData, broker_phone: e.target.value })
                      }
                      style={{
                        width: '100%',
                        paddingLeft: 'var(--space-4)',
                        paddingRight: 'var(--space-4)',
                        paddingTop: 'var(--space-2)',
                        paddingBottom: 'var(--space-2)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-4)',
                      }}
                    />
                  </Stack>
                </Row>

                <Stack>
                  <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-gray-12)', display: 'block', marginBottom: 'var(--space-2)' }}>
                    Email <span style={{ color: 'var(--color-red-10)' }}>*</span>
                  </Text>
                  <input
                    type="email"
                    value={formData.broker_email}
                    onChange={(e) =>
                      setFormData({ ...formData, broker_email: e.target.value })
                    }
                    required
                    style={{
                      width: '100%',
                      paddingLeft: 'var(--space-4)',
                      paddingRight: 'var(--space-4)',
                      paddingTop: 'var(--space-2)',
                      paddingBottom: 'var(--space-2)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-4)',
                    }}
                  />
                </Stack>
              </Stack>
            </Stack>

            <Stack style={{ paddingTop: 'var(--space-6)', borderTop: '1px solid var(--color-border)' }}>
              <Text style={{ fontSize: 'var(--font-size-6)', fontWeight: 600, color: 'var(--color-gray-12)', marginBottom: 'var(--space-4)' }}>
                Coverage Requirements
              </Text>

              <Stack style={{ gap: 'var(--space-3)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <input
                    type="checkbox"
                    checked={formData.requires_pollution_liability}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        requires_pollution_liability: e.target.checked,
                      })
                    }
                  />
                  <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-gray-12)' }}>
                    Requires Pollution Liability
                  </Text>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <input
                    type="checkbox"
                    checked={formData.requires_professional_liability}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        requires_professional_liability: e.target.checked,
                      })
                    }
                  />
                  <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-gray-12)' }}>
                    Requires Professional Liability
                  </Text>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <input
                    type="checkbox"
                    checked={formData.involves_residential_work}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        involves_residential_work: e.target.checked,
                      })
                    }
                  />
                  <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-gray-12)' }}>
                    Involves Residential Construction
                  </Text>
                </label>
              </Stack>
            </Stack>

            <Row style={{ justifyContent: 'flex-end', gap: 'var(--space-3)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--color-border)' }}>
              <Button
                variant="outline"
                onPress={onClose}
                type="button"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Form'}
              </Button>
            </Row>
          </Stack>
        </form>
      </Card>
    </Stack>
  );
}
