/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
} from 'lucide-react';
import { YStack, XStack, Text, Card } from '@unicornlove/ui';
import { useBrokerAcknowledgements } from '../../hooks/useBrokerAcknowledgements';
import Button from '../Common/Button';
import StatusBadge from '../Common/StatusBadge';
import CreateBrokerAckFormModal from './CreateBrokerAckFormModal';

export default function BrokerAcknowledgementList() {
  const navigate = useNavigate();
  const { forms, loading } = useBrokerAcknowledgements();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredForms = forms.filter((form) => {
    const matchesSearch =
      form.subcontractor_company_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      form.gc_project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.broker_agency_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || form.status === statusFilter;

    return matchesSearch && matchesStatus;
  });
  const getComplianceColor = (score: number) => {
    if (score >= 90) return '$green10';
    if (score >= 70) return '$orange10';
    return '$red10';
  };

  if (loading) {
    return (
      <YStack gap="$4">
        <Card height={32} backgroundColor="$gray3" borderRadius="$4" />
        <Card height={128} backgroundColor="$gray3" borderRadius="$4" />
        <Card height={128} backgroundColor="$gray3" borderRadius="$4" />
      </YStack>
    );
  }

  return (
    <YStack gap="$6">
      <XStack alignItems="center" justifyContent="space-between">
        <YStack>
          <Text fontSize="$8" fontWeight="bold" color="$color12">
            Broker Acknowledgement Forms
          </Text>
          <Text color="$color11" mt="$1">
            Manage insurance verification forms for subcontractor projects
          </Text>
        </YStack>
        <Button onClick={() => setShowCreateModal(true)}>
          <XStack alignItems="center" gap="$2">
            <Plus size={16} />
            <Text>New Form</Text>
          </XStack>
        </Button>
      </XStack>

      <Card borderWidth={1} borderColor="$borderColor" padding="$4">
        <XStack
          flexDirection="column"
          gap="$4"
          $gtMd={{
            flexDirection: 'row',
          }}
        >
          <YStack flex={1} position="relative">
            <XStack
              position="absolute"
              left="$3"
              top="50%"
              transform="translateY(-50%)"
              zIndex={1}
            >
              <Search size={20} color="$color11" />
            </XStack>
            <input
              type="text"
              placeholder="Search by company, project, or broker..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: 'var(--space-10)',
                paddingRight: 'var(--space-4)',
                paddingVertical: 'var(--space-2)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-4)',
              }}
            />
          </YStack>
          <XStack alignItems="center" gap="$2">
            <Filter size={20} color="$color11" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                paddingHorizontal: 'var(--space-4)',
                paddingVertical: 'var(--space-2)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-4)',
              }}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending_broker">Pending Broker</option>
              <option value="pending_subcontractor">
                Pending Subcontractor
              </option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="changes_requested">Changes Requested</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </XStack>
        </XStack>
      </Card>

      {filteredForms.length === 0 ? (
        <Card borderWidth={1} borderColor="$borderColor" padding="$12" alignItems="center">
          <FileText size={48} color="$color11" mb="$4" />
          <Text fontSize="$6" fontWeight="600" color="$color12" mb="$2">
            {searchTerm || statusFilter !== 'all'
              ? 'No forms found'
              : 'No acknowledgement forms yet'}
          </Text>
          <Text color="$color11" mb="$6">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Create your first broker acknowledgement form to get started'}
          </Text>
          {!searchTerm && statusFilter === 'all' && (
            <Button onClick={() => setShowCreateModal(true)}>
              <XStack alignItems="center" gap="$2">
                <Plus size={16} />
                <Text>Create First Form</Text>
              </XStack>
            </Button>
          )}
        </Card>
      ) : (
        <YStack gap="$4">
          {filteredForms.map((form) => (
            <Card
              key={form.id}
              borderWidth={1}
              borderColor="$borderColor"
              padding="$6"
              cursor="pointer"
              hoverStyle={{
                borderColor: '$blue8',
              }}
              onPress={() => navigate(`/broker/acknowledgements/${form.id}`)}
            >
              <XStack alignItems="flex-start" justifyContent="space-between" mb="$4">
                <YStack flex={1}>
                  <XStack alignItems="center" gap="$3" mb="$2">
                    <Text fontSize="$6" fontWeight="600" color="$color12">
                      {form.subcontractor_company_name}
                    </Text>
                    <StatusBadge status={form.status as any} size="xs" />
                  </XStack>
                  <Text color="$color11">{form.gc_project_name}</Text>
                </YStack>
                <YStack alignItems="flex-end">
                  <Text
                    fontSize="$8"
                    fontWeight="bold"
                    color={getComplianceColor(form.compliance_score)}
                  >
                    {form.compliance_score}%
                  </Text>
                  <Text fontSize="$1" color="$color11">Compliance</Text>
                </YStack>
              </XStack>

              <XStack
                flexWrap="wrap"
                gap="$4"
                mb="$4"
                $gtMd={{
                  flexWrap: 'nowrap',
                }}
              >
                <YStack flex={1} minWidth="200px">
                  <Text fontSize="$2" color="$color11">Broker Agency</Text>
                  <Text fontSize="$2" fontWeight="500" color="$color12">
                    {form.broker_agency_name}
                  </Text>
                </YStack>
                <YStack flex={1} minWidth="200px">
                  <Text fontSize="$2" color="$color11">Broker Contact</Text>
                  <Text fontSize="$2" fontWeight="500" color="$color12">
                    {form.broker_contact_name}
                  </Text>
                </YStack>
                <XStack alignItems="center" gap="$2" flex={1} minWidth="200px">
                  <Calendar size={16} color="$color11" />
                  <YStack>
                    <Text fontSize="$2" color="$color11">Due Date</Text>
                    <Text fontSize="$2" fontWeight="500" color="$color12">
                      {new Date(form.date_due).toLocaleDateString()}
                    </Text>
                  </YStack>
                </XStack>
              </XStack>

              {form.missing_endorsements &&
                form.missing_endorsements.length > 0 && (
                  <Card
                    backgroundColor="$orange3"
                    borderWidth={1}
                    borderColor="$orange6"
                    borderRadius="$4"
                    padding="$3"
                  >
                    <XStack alignItems="flex-start" gap="$2">
                      <AlertCircle
                        size={16}
                        color="$orange10"
                        mt="$0.5"
                        flexShrink={0}
                      />
                      <YStack>
                        <Text fontSize="$2" fontWeight="500" color="$orange11">
                          {form.missing_endorsements.length} Missing Endorsement
                          {form.missing_endorsements.length !== 1 ? 's' : ''}
                        </Text>
                        <Text fontSize="$1" color="$orange10" mt="$1">
                          Click to view details and resolve issues
                        </Text>
                      </YStack>
                    </XStack>
                  </Card>
                )}

              {form.status === 'approved' && form.date_reviewed && (
                <Card
                  backgroundColor="$green3"
                  borderWidth={1}
                  borderColor="$green6"
                  borderRadius="$4"
                  padding="$3"
                >
                  <XStack alignItems="flex-start" gap="$2">
                    <CheckCircle
                      size={16}
                      color="$green10"
                      mt="$0.5"
                      flexShrink={0}
                    />
                    <YStack>
                      <Text fontSize="$2" fontWeight="500" color="$green11">
                        Approved on{' '}
                        {new Date(form.date_reviewed).toLocaleDateString()}
                      </Text>
                      {form.manager_notes && (
                        <Text fontSize="$1" color="$green10" mt="$1">
                          {form.manager_notes}
                        </Text>
                      )}
                    </YStack>
                  </XStack>
                </Card>
              )}
            </Card>
          ))}
        </YStack>
      )}

      {showCreateModal && (
        <CreateBrokerAckFormModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(formId) => {
            setShowCreateModal(false);
            navigate(`/broker/acknowledgements/${formId}`);
          }}
        />
      )}
    </YStack>
  );
}
