import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { YStack, XStack, Text, Card, Button as TamaguiButton } from '@unicornlove/ui';
import { useBrokerAcknowledgements } from '../../hooks/useBrokerAcknowledgements';
import { useProjects } from '../../hooks/useProjects';
import Button from '../Common/Button';

interface CreateBrokerAckFormModalProps {
  onClose: () => void;
  onCreated: (formId: string) => void;
}

export default function CreateBrokerAckFormModal({
  onClose,
  onCreated,
}: CreateBrokerAckFormModalProps) {
  const { createForm } = useBrokerAcknowledgements();
  const { projects } = useProjects();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (selectedProject) {
      setFormData((prev) => ({
        ...prev,
        gc_project_name: selectedProject.name,
      }));
    }
  }, [selectedProject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!formData.project_id) {
        throw new Error('Please select a project');
      }
      if (!formData.subcontractor_company_name) {
        throw new Error('Please enter subcontractor company name');
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
                    marginTop="$0.5"
                  />
                  <YStack>
                    <Text fontWeight="500" color="$red11">Error</Text>
                    <Text fontSize="$2" color="$red10" marginTop="$1">{error}</Text>
                  </YStack>
                </XStack>
              </Card>
            )}

            <YStack>
              <Text fontSize="$2" fontWeight="500" color="$color12" display="block" marginBottom="$2">
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
              <Text fontSize="$6" fontWeight="600" color="$color12" marginBottom="$4">
                Subcontractor Information
              </Text>

              <YStack gap="$4">
                <YStack>
                  <Text fontSize="$2" fontWeight="500" color="$color12" display="block" marginBottom="$2">
                    Company Name <Text color="$red10">*</Text>
                  </Text>
                  <input
                    type="text"
                    value={formData.subcontractor_company_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        subcontractor_company_name: e.target.value,
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
              </YStack>
            </YStack>

            <YStack paddingTop="$6" borderTopWidth={1} borderTopColor="$borderColor">
              <Text fontSize="$6" fontWeight="600" color="$color12" marginBottom="$4">
                Broker Information
              </Text>

              <YStack gap="$4">
                <YStack>
                  <Text fontSize="$2" fontWeight="500" color="$color12" display="block" marginBottom="$2">
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
                    <Text fontSize="$2" fontWeight="500" color="$color12" display="block" marginBottom="$2">
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
                    <Text fontSize="$2" fontWeight="500" color="$color12" display="block" marginBottom="$2">
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
                  <Text fontSize="$2" fontWeight="500" color="$color12" display="block" marginBottom="$2">
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
              <Text fontSize="$6" fontWeight="600" color="$color12" marginBottom="$4">
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
