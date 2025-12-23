import { useState, useEffect, useMemo } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { YStack, XStack, Text, Card, Button as TamaguiButton } from '@unicornlove/ui';
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
    <YStack
      position="fixed"
      inset={0}
      backgroundColor="rgba(0,0,0,0.5)"
      alignItems="center"
      justifyContent="center"
      zIndex={50}
      padding="$4"
    >
      <Card
        maxWidth={672}
        width="100%"
        maxHeight="90vh"
        overflowY="auto"
        elevation={24}
      >
        <XStack
          position="sticky"
          top={0}
          borderBottomWidth={1}
          borderBottomColor="$borderColor"
          paddingHorizontal="$6"
          paddingVertical="$4"
          alignItems="center"
          justifyContent="space-between"
          backgroundColor="$background"
        >
          <Text fontSize="$7" fontWeight="bold" color="$color12">
            Create Broker Acknowledgement Form
          </Text>
          <TamaguiButton
            onPress={onClose}
            padding="$1"
            backgroundColor="transparent"
            color="$color11"
            hoverStyle={{
              color: '$color12',
            }}
          >
            <X size={24} />
          </TamaguiButton>
        </XStack>

        <form onSubmit={handleSubmit}>
          <YStack padding="$6" gap="$6">
            {error && (
              <Card
                backgroundColor="$red3"
                borderWidth={1}
                borderColor="$red6"
                borderRadius="$4"
                padding="$4"
              >
                <XStack alignItems="flex-start" gap="$3">
                  <AlertCircle
                    size={20}
                    color="$red10"
                    flexShrink={0}
                    mt="$0.5"
                  />
                  <YStack>
                    <Text fontWeight="500" color="$red11">Error</Text>
                    <Text fontSize="$2" color="$red10" mt="$1">{error}</Text>
                  </YStack>
                </XStack>
              </Card>
            )}

            <YStack>
              <Text fontSize="$2" fontWeight="500" color="$color12" display="block" mb="$2">
                Project <Text color="$red10">*</Text>
              </Text>
              <select
                value={formData.project_id}
                onChange={(e) =>
                  setFormData({ ...formData, project_id: e.target.value })
                }
                required
                style={{
                  width: '100%',
                  paddingHorizontal: 'var(--space-4)',
                  paddingVertical: 'var(--space-2)',
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
            </YStack>

            <YStack paddingTop="$6" borderTopWidth={1} borderTopColor="$borderColor">
              <Text fontSize="$6" fontWeight="600" color="$color12" mb="$4">
                Subcontractor Information
              </Text>

              <YStack gap="$4">
                <YStack>
                  <Text fontSize="$2" fontWeight="500" color="$color12" display="block" mb="$2">
                    Subcontractor <Text color="$red10">*</Text>
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
                      paddingHorizontal: 'var(--space-4)',
                      paddingVertical: 'var(--space-2)',
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
                </YStack>
              </YStack>
            </YStack>

            <YStack paddingTop="$6" borderTopWidth={1} borderTopColor="$borderColor">
              <Text fontSize="$6" fontWeight="600" color="$color12" mb="$4">
                Broker Information
              </Text>

              <YStack gap="$4">
                <YStack>
                  <Text fontSize="$2" fontWeight="500" color="$color12" display="block" mb="$2">
                    Agency Name <Text color="$red10">*</Text>
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
                      paddingHorizontal: 'var(--space-4)',
                      paddingVertical: 'var(--space-2)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-4)',
                    }}
                  />
                </YStack>

                <XStack
                  flexWrap="wrap"
                  gap="$4"
                  $gtMd={{
                    flexWrap: 'nowrap',
                  }}
                >
                  <YStack flex={1} minWidth="200px">
                    <Text fontSize="$2" fontWeight="500" color="$color12" display="block" mb="$2">
                      Contact Name <Text color="$red10">*</Text>
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
                        paddingHorizontal: 'var(--space-4)',
                        paddingVertical: 'var(--space-2)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-4)',
                      }}
                    />
                  </YStack>

                  <YStack flex={1} minWidth="200px">
                    <Text fontSize="$2" fontWeight="500" color="$color12" display="block" mb="$2">
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
                        paddingHorizontal: 'var(--space-4)',
                        paddingVertical: 'var(--space-2)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-4)',
                      }}
                    />
                  </YStack>
                </XStack>

                <YStack>
                  <Text fontSize="$2" fontWeight="500" color="$color12" display="block" mb="$2">
                    Email <Text color="$red10">*</Text>
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
                      paddingHorizontal: 'var(--space-4)',
                      paddingVertical: 'var(--space-2)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-4)',
                    }}
                  />
                </YStack>
              </YStack>
            </YStack>

            <YStack paddingTop="$6" borderTopWidth={1} borderTopColor="$borderColor">
              <Text fontSize="$6" fontWeight="600" color="$color12" mb="$4">
                Coverage Requirements
              </Text>

              <YStack gap="$3">
                <XStack
                  as="label"
                  alignItems="center"
                  gap="$3"
                >
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
                  <Text fontSize="$2" color="$color12">
                    Requires Pollution Liability
                  </Text>
                </XStack>

                <XStack
                  as="label"
                  alignItems="center"
                  gap="$3"
                >
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
                  <Text fontSize="$2" color="$color12">
                    Requires Professional Liability
                  </Text>
                </XStack>

                <XStack
                  as="label"
                  alignItems="center"
                  gap="$3"
                >
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
                  <Text fontSize="$2" color="$color12">
                    Involves Residential Construction
                  </Text>
                </XStack>
              </YStack>
            </YStack>

            <XStack justifyContent="flex-end" gap="$3" paddingTop="$6" borderTopWidth={1} borderTopColor="$borderColor">
              <Button
                variant="outline"
                onClick={onClose}
                type="button"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Form'}
              </Button>
            </XStack>
          </YStack>
        </form>
      </Card>
    </YStack>
  );
}
