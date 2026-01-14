/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  AlertCircle,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { Stack, Row, Text, Card } from '@unicornlove/beyond-ui';
import { useBrokerAcknowledgements } from '../../hooks/useBrokerAcknowledgements';
import Button from '../Common/Button';
import StatusBadge from '../Common/StatusBadge';
import CreateBrokerAckFormModal from './CreateBrokerAckFormModal';

const getComplianceColor = (score: number): React.CSSProperties => {
  if (score >= 90) return { color: 'var(--color-green-10)' };
  if (score >= 70) return { color: 'var(--color-orange-10)' };
  return { color: 'var(--color-red-10)' };
};

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

  if (loading) {
    return (
      <Stack style={{ gap: 'var(--space-4)' }}>
        <Card style={{ height: 32, backgroundColor: 'var(--color-gray-3)', borderRadius: 'var(--radius-4)' }} />
        <Card style={{ height: 128, backgroundColor: 'var(--color-gray-3)', borderRadius: 'var(--radius-4)' }} />
        <Card style={{ height: 128, backgroundColor: 'var(--color-gray-3)', borderRadius: 'var(--radius-4)' }} />
      </Stack>
    );
  }

  return (
    <Stack style={{ gap: 'var(--space-6)' }}>
      <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack>
          <Text style={{ fontSize: 'var(--font-size-8)', fontWeight: 'bold', color: 'var(--color-gray-12)' }}>
            Broker Acknowledgement Forms
          </Text>
          <Text style={{ color: 'var(--color-gray-11)', marginTop: 'var(--space-1)' }}>
            Manage insurance verification forms for subcontractor projects
          </Text>
        </Stack>
        <Button onClick={() => setShowCreateModal(true)}>
          <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
            <Plus size={16} />
            <Text>New Form</Text>
          </Row>
        </Button>
      </Row>

      <Card style={{ border: '1px solid var(--color-border)', padding: 'var(--space-4)' }}>
        <Row
          style={{
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}
        >
          <Stack style={{ flex: 1, position: 'relative' }}>
            <Row
              style={{
                position: 'absolute',
                left: 'var(--space-3)',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1,
              }}
            >
              <Search size={20} style={{ color: 'var(--color-gray-11)' }} />
            </Row>
            <input
              type="text"
              placeholder="Search by company, project, or broker..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: 'var(--space-10)',
                paddingRight: 'var(--space-4)',
                paddingTop: 'var(--space-2)',
                paddingBottom: 'var(--space-2)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-4)',
              }}
            />
          </Stack>
          <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
            <Filter size={20} style={{ color: 'var(--color-gray-11)' }} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                paddingLeft: 'var(--space-4)',
                paddingRight: 'var(--space-4)',
                paddingTop: 'var(--space-2)',
                paddingBottom: 'var(--space-2)',
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
          </Row>
        </Row>
      </Card>

      {filteredForms.length === 0 ? (
        <Card style={{ border: '1px solid var(--color-border)', padding: 'var(--space-12)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <FileText size={48} style={{ color: 'var(--color-gray-11)', marginBottom: 'var(--space-4)' }} />
          <Text style={{ fontSize: 'var(--font-size-6)', fontWeight: 600, color: 'var(--color-gray-12)', marginBottom: 'var(--space-2)' }}>
            {searchTerm || statusFilter !== 'all'
              ? 'No forms found'
              : 'No acknowledgement forms yet'}
          </Text>
          <Text style={{ color: 'var(--color-gray-11)', marginBottom: 'var(--space-6)' }}>
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Create your first broker acknowledgement form to get started'}
          </Text>
          {!searchTerm && statusFilter === 'all' && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
                <Plus size={16} />
                <Text>Create First Form</Text>
              </Row>
            </Button>
          )}
        </Card>
      ) : (
        <Stack style={{ gap: 'var(--space-4)' }}>
          {filteredForms.map((form) => (
            <Card
              key={form.id}
              style={{
                border: '1px solid var(--color-border)',
                padding: 'var(--space-6)',
                cursor: 'pointer',
              }}
              onClick={() => navigate(`/broker/acknowledgements/${form.id}`)}
            >
              <Row style={{ alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                <Stack style={{ flex: 1 }}>
                  <Row style={{ alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                    <Text style={{ fontSize: 'var(--font-size-6)', fontWeight: 600, color: 'var(--color-gray-12)' }}>
                      {form.subcontractor_company_name}
                    </Text>
                    <StatusBadge status={form.status as any} size="xs" />
                  </Row>
                  <Text style={{ color: 'var(--color-gray-11)' }}>{form.gc_project_name}</Text>
                </Stack>
                <Stack style={{ alignItems: 'flex-end' }}>
                  <Text
                    style={{
                      fontSize: 'var(--font-size-8)',
                      fontWeight: 'bold',
                      ...getComplianceColor(form.compliance_score),
                    }}
                  >
                    {form.compliance_score}%
                  </Text>
                  <Text style={{ fontSize: 'var(--font-size-1)', color: 'var(--color-gray-11)' }}>Compliance</Text>
                </Stack>
              </Row>

              <Row
                style={{
                  flexWrap: 'wrap',
                  gap: 'var(--space-4)',
                  marginBottom: 'var(--space-4)',
                }}
              >
                <Stack style={{ flex: 1, minWidth: '200px' }}>
                  <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-gray-11)' }}>Broker Agency</Text>
                  <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-gray-12)' }}>
                    {form.broker_agency_name}
                  </Text>
                </Stack>
                <Stack style={{ flex: 1, minWidth: '200px' }}>
                  <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-gray-11)' }}>Broker Contact</Text>
                  <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-gray-12)' }}>
                    {form.broker_contact_name}
                  </Text>
                </Stack>
                <Row style={{ alignItems: 'center', gap: 'var(--space-2)', flex: 1, minWidth: '200px' }}>
                  <Calendar size={16} style={{ color: 'var(--color-gray-11)' }} />
                  <Stack>
                    <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-gray-11)' }}>Due Date</Text>
                    <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-gray-12)' }}>
                      {new Date(form.date_due).toLocaleDateString()}
                    </Text>
                  </Stack>
                </Row>
              </Row>

              {form.missing_endorsements &&
                form.missing_endorsements.length > 0 && (
                  <Card
                    style={{
                      backgroundColor: 'var(--color-orange-3)',
                      border: '1px solid var(--color-orange-6)',
                      borderRadius: 'var(--radius-4)',
                      padding: 'var(--space-3)',
                    }}
                  >
                    <Row style={{ alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                      <AlertCircle
                        size={16}
                        style={{ color: 'var(--color-orange-10)', marginTop: 'var(--space-0-5)', flexShrink: 0 }}
                      />
                      <Stack>
                        <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-orange-11)' }}>
                          {form.missing_endorsements.length} Missing Endorsement
                          {form.missing_endorsements.length !== 1 ? 's' : ''}
                        </Text>
                        <Text style={{ fontSize: 'var(--font-size-1)', color: 'var(--color-orange-10)', marginTop: 'var(--space-1)' }}>
                          Click to view details and resolve issues
                        </Text>
                      </Stack>
                    </Row>
                  </Card>
                )}

              {form.status === 'approved' && form.date_reviewed && (
                <Card
                  style={{
                    backgroundColor: 'var(--color-green-3)',
                    border: '1px solid var(--color-green-6)',
                    borderRadius: 'var(--radius-4)',
                    padding: 'var(--space-3)',
                  }}
                >
                  <Row style={{ alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                    <CheckCircle
                      size={16}
                      style={{ color: 'var(--color-green-10)', marginTop: 'var(--space-0-5)', flexShrink: 0 }}
                    />
                    <Stack>
                      <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-green-11)' }}>
                        Approved on{' '}
                        {new Date(form.date_reviewed).toLocaleDateString()}
                      </Text>
                      {form.manager_notes && (
                        <Text style={{ fontSize: 'var(--font-size-1)', color: 'var(--color-green-10)', marginTop: 'var(--space-1)' }}>
                          {form.manager_notes}
                        </Text>
                      )}
                    </Stack>
                  </Row>
                </Card>
              )}
            </Card>
          ))}
        </Stack>
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
    </Stack>
  );
}
