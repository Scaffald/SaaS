import React, { useState } from 'react';
import {
  Search,
  Upload,
  Eye,
  Download,
  Filter,
  Plus,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { Stack, Row, Text, H1, H2, H3, Card, Input } from '@unicornlove/beyond-ui';
import ComplianceScore from '../Common/ComplianceScore';
import StatusBadge from '../Common/StatusBadge';
import Button from '../Common/Button';
import IconButton from '../Common/IconButton';
import { mockSubcontractors } from '../../utils/mockData';

export default function SubcontractorVetting() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubcontractor, setSelectedSubcontractor] = useState<
    string | null
  >(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredSubcontractors = mockSubcontractors.filter(
    (subcontractor) =>
      subcontractor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subcontractor.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedSubcontractorData = selectedSubcontractor
    ? mockSubcontractors.find((c) => c.id === selectedSubcontractor)
    : null;

  return (
    <Stack style={{ gap: '24px' }}>
      {/* Header */}
      <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack>
          <H1 style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--color-12)' }}>
            Subcontractors
          </H1>
          <Text style={{ color: 'var(--color-11)' }}>
            Manage subcontractor compliance and documentation
          </Text>
        </Stack>
        <Row style={{ alignItems: 'center', gap: '12px' }}>
          <Button variant="ghost" leftIcon={Upload} iconSize={16}>
            Import
          </Button>
          <Button
            onPress={() => setShowAddModal(true)}
            variant="primary"
            leftIcon={Plus}
            iconSize={16}
            style={{ backgroundColor: 'var(--color-blue-9)' }}
          >
            Add Subcontractor
          </Button>
        </Row>
      </Row>

      {/* Search and Filters */}
      <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: '8px', boxShadow: '0 1px 3px var(--color-shadow)', border: '1px solid var(--color-border)', padding: '16px' }}>
        <Row style={{ flexDirection: 'column', gap: '16px' }}>
          <Row style={{ flex: 1, position: 'relative' }}>
            <Search
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
              color="var(--color-10)"
              size={20}
            />
            <Input
              type="text"
              placeholder="Search subcontractors or companies..."
              style={{
                width: '100%',
                paddingLeft: '40px',
                paddingRight: '16px',
                paddingTop: '8px',
                paddingBottom: '8px',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
              }}
            />
          </Row>
          <Button variant="outline" leftIcon={Filter} iconSize={16}>
            Filter
          </Button>
        </Row>
      </Card>

      <Row style={{ flexDirection: 'column', gap: '24px' }}>
        {/* Subcontractor List */}
        <Card style={{ flex: 1, backgroundColor: 'var(--color-background)', borderRadius: '8px', boxShadow: '0 1px 3px var(--color-shadow)', border: '1px solid var(--color-border)' }}>
          <Stack style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
            <Text style={{ fontWeight: 600, color: 'var(--color-12)' }}>
              Subcontractors ({filteredSubcontractors.length})
            </Text>
          </Stack>
          <Stack style={{ maxHeight: 384, overflowY: 'auto' }}>
            {filteredSubcontractors.map((subcontractor) => (
              <Button
                key={subcontractor.id}
                onPress={() => setSelectedSubcontractor(subcontractor.id)}
                variant="ghost"
                style={{
                  width: '100%',
                  padding: '16px',
                  justifyContent: 'flex-start',
                  backgroundColor: selectedSubcontractor === subcontractor.id ? 'var(--color-blue-3)' : 'transparent',
                  borderRight: selectedSubcontractor === subcontractor.id ? '2px solid var(--color-blue-9)' : 'none',
                }}
              >
                <Stack style={{ width: '100%' }}>
                  <Row style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <Text style={{ fontWeight: 500, color: 'var(--color-12)' }}>
                      {subcontractor.name}
                    </Text>
                    <StatusBadge
                      status={subcontractor.status}
                      size="sm"
                      showIcon={false}
                    />
                  </Row>
                  <Text style={{ fontSize: '14px', color: 'var(--color-11)', marginBottom: '8px' }}>
                    {subcontractor.company}
                  </Text>
                  <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                    <ComplianceScore
                      score={subcontractor.complianceScore}
                      size="sm"
                      showTrend={false}
                    />
                    <Text style={{ fontSize: '12px', color: 'var(--color-11)' }}>
                      {subcontractor.documents.length} docs
                    </Text>
                  </Row>
                </Stack>
              </Button>
            ))}
          </Stack>
        </Card>

        {/* Subcontractor Details */}
        <Stack style={{ flex: 2 }}>
          {selectedSubcontractorData ? (
            <Stack style={{ gap: '24px' }}>
              {/* Subcontractor Info */}
              <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: '8px', boxShadow: '0 1px 3px var(--color-shadow)', border: '1px solid var(--color-border)', padding: '24px' }}>
                <Row style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <Stack>
                    <H2 style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--color-12)' }}>
                      {selectedSubcontractorData.name}
                    </H2>
                    <Text style={{ color: 'var(--color-11)' }}>
                      {selectedSubcontractorData.company}
                    </Text>
                  </Stack>
                  <ComplianceScore
                    score={selectedSubcontractorData.complianceScore}
                    trend="up"
                  />
                </Row>

                <Row style={{ gap: '16px', flexWrap: 'wrap', fontSize: '14px' }}>
                  <Stack style={{ flex: 1, minWidth: 200 }}>
                    <Text style={{ color: 'var(--color-11)' }}>Email:</Text>
                    <Text style={{ fontWeight: 500 }}>
                      {selectedSubcontractorData.email}
                    </Text>
                  </Stack>
                  <Stack style={{ flex: 1, minWidth: 200 }}>
                    <Text style={{ color: 'var(--color-11)' }}>Phone:</Text>
                    <Text style={{ fontWeight: 500 }}>
                      {selectedSubcontractorData.phone}
                    </Text>
                  </Stack>
                  <Stack style={{ flex: 1, minWidth: 200 }}>
                    <Text style={{ color: 'var(--color-11)' }}>Status:</Text>
                    <Stack style={{ marginTop: '4px' }}>
                      <StatusBadge status={selectedSubcontractorData.status} />
                    </Stack>
                  </Stack>
                  <Stack style={{ flex: 1, minWidth: 200 }}>
                    <Text style={{ color: 'var(--color-11)' }}>Last Updated:</Text>
                    <Text style={{ fontWeight: 500 }}>
                      {selectedSubcontractorData.lastUpdated.toLocaleDateString()}
                    </Text>
                  </Stack>
                </Row>
              </Card>

              {/* Documents */}
              <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: '8px', boxShadow: '0 1px 3px var(--color-shadow)', border: '1px solid var(--color-border)' }}>
                <Row style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontWeight: 600, color: 'var(--color-12)' }}>Documents</Text>
                  <Button
                    variant="ghost"
                    leftIcon={Upload}
                    iconSize={16}
                    style={{ color: 'var(--color-blue-9)' }}
                  >
                    Upload
                  </Button>
                </Row>
                <Stack style={{ padding: '16px' }}>
                  {selectedSubcontractorData.documents.length > 0 ? (
                    <Stack style={{ gap: '12px' }}>
                      {selectedSubcontractorData.documents.map((doc) => (
                        <Row
                          key={doc.id}
                          style={{
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px',
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px',
                          }}
                        >
                          <Row style={{ alignItems: 'center', gap: '12px' }}>
                            {doc.status === 'verified' && (
                              <CheckCircle color="var(--color-green-9)" size={16} />
                            )}
                            {doc.status === 'pending' && (
                              <AlertTriangle color="var(--color-yellow-9)" size={16} />
                            )}
                            {doc.status === 'expired' && (
                              <XCircle color="var(--color-red-9)" size={16} />
                            )}
                            <Stack>
                              <Text style={{ fontWeight: 500, color: 'var(--color-12)' }}>
                                {doc.name}
                              </Text>
                              <Row style={{ alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--color-11)' }}>
                                <Text style={{ fontSize: '14px', color: 'var(--color-11)', textTransform: 'capitalize' }}>{doc.type}</Text>
                                {doc.expiryDate && (
                                  <>
                                    <Text>•</Text>
                                    <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>
                                      Expires: {doc.expiryDate.toLocaleDateString()}
                                    </Text>
                                  </>
                                )}
                              </Row>
                            </Stack>
                          </Row>
                          <Row style={{ alignItems: 'center', gap: '8px' }}>
                            <StatusBadge status={doc.status} size="sm" />
                            <IconButton
                              icon={Eye}
                              size="sm"
                              variant="ghost"
                              tooltip="View document"
                            />
                            <IconButton
                              icon={Download}
                              size="sm"
                              variant="ghost"
                              tooltip="Download document"
                            />
                          </Row>
                        </Row>
                      ))}
                    </Stack>
                  ) : (
                    <Stack style={{ alignItems: 'center', paddingTop: '32px', paddingBottom: '32px' }}>
                      <Upload size={48} color="var(--color-gray-8)" style={{ marginBottom: '12px' }} />
                      <Text style={{ color: 'var(--color-11)' }}>No documents uploaded</Text>
                      <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>
                        Upload certificates and licenses to get started
                      </Text>
                    </Stack>
                  )}
                </Stack>
              </Card>

              {/* Insurance Policies */}
              <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: '8px', boxShadow: '0 1px 3px var(--color-shadow)', border: '1px solid var(--color-border)' }}>
                <Stack style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
                  <Text style={{ fontWeight: 600, color: 'var(--color-12)' }}>
                    Insurance Policies
                  </Text>
                </Stack>
                <Stack style={{ padding: '16px' }}>
                  {selectedSubcontractorData.insurancePolicies.length > 0 ? (
                    <Stack style={{ gap: '12px' }}>
                      {selectedSubcontractorData.insurancePolicies.map(
                        (policy) => (
                          <Card
                            key={policy.id}
                            style={{
                              padding: '16px',
                              border: '1px solid var(--color-border)',
                              borderRadius: '8px',
                            }}
                          >
                            <Row style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <Text style={{ fontWeight: 500, color: 'var(--color-12)' }}>
                                {policy.type}
                              </Text>
                              <StatusBadge status={policy.status} size="sm" />
                            </Row>
                            <Row style={{ gap: '16px', flexWrap: 'wrap', fontSize: '14px' }}>
                              <Stack style={{ flex: 1, minWidth: 200 }}>
                                <Text style={{ color: 'var(--color-11)' }}>Provider:</Text>
                                <Text style={{ fontWeight: 500 }}>{policy.provider}</Text>
                              </Stack>
                              <Stack style={{ flex: 1, minWidth: 200 }}>
                                <Text style={{ color: 'var(--color-11)' }}>Policy #:</Text>
                                <Text style={{ fontWeight: 500 }}>
                                  {policy.policyNumber}
                                </Text>
                              </Stack>
                              <Stack style={{ flex: 1, minWidth: 200 }}>
                                <Text style={{ color: 'var(--color-11)' }}>Coverage:</Text>
                                <Text style={{ fontWeight: 500 }}>
                                  ${policy.coverage.toLocaleString()}
                                </Text>
                              </Stack>
                              <Stack style={{ flex: 1, minWidth: 200 }}>
                                <Text style={{ color: 'var(--color-11)' }}>Expires:</Text>
                                <Text style={{ fontWeight: 500 }}>
                                  {policy.endDate.toLocaleDateString()}
                                </Text>
                              </Stack>
                            </Row>
                          </Card>
                        )
                      )}
                    </Stack>
                  ) : (
                    <Stack style={{ alignItems: 'center', paddingTop: '32px', paddingBottom: '32px' }}>
                      <Text style={{ color: 'var(--color-11)' }}>No insurance policies on file</Text>
                    </Stack>
                  )}
                </Stack>
              </Card>
            </Stack>
          ) : (
            <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: '8px', boxShadow: '0 1px 3px var(--color-shadow)', border: '1px solid var(--color-border)', padding: '48px', alignItems: 'center', display: 'flex', flexDirection: 'column' }}>
              <Stack style={{ alignItems: 'center', marginBottom: '16px' }}>
                <Eye size={48} color="var(--color-10)" />
              </Stack>
              <H3 style={{ fontSize: '24px', fontWeight: 500, color: 'var(--color-12)', marginBottom: '8px' }}>
                Select a Subcontractor
              </H3>
              <Text style={{ color: 'var(--color-11)', textAlign: 'center' }}>
                Choose a subcontractor from the list to view their details and
                documents
              </Text>
            </Card>
          )}
        </Stack>
      </Row>

      {/* Add Subcontractor Modal */}
      {showAddModal && (
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
            display: 'flex',
            zIndex: 50,
          }}
        >
          <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: '8px', padding: '24px', width: '100%', maxWidth: 448 }}>
            <H3 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-12)', marginBottom: '16px' }}>
              Add New Subcontractor
            </H3>
            <Stack style={{ gap: '16px' }}>
              <Stack>
                <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-12)', marginBottom: '4px' }}>
                  Full Name
                </Text>
                <Input
                  type="text"
                  style={{
                    width: '100%',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    paddingLeft: '12px',
                    paddingRight: '12px',
                    paddingTop: '8px',
                    paddingBottom: '8px',
                  }}
                />
              </Stack>
              <Stack>
                <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-12)', marginBottom: '4px' }}>
                  Company
                </Text>
                <Input
                  type="text"
                  style={{
                    width: '100%',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    paddingLeft: '12px',
                    paddingRight: '12px',
                    paddingTop: '8px',
                    paddingBottom: '8px',
                  }}
                />
              </Stack>
              <Stack>
                <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-12)', marginBottom: '4px' }}>
                  Email
                </Text>
                <Input
                  type="email"
                  style={{
                    width: '100%',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    paddingLeft: '12px',
                    paddingRight: '12px',
                    paddingTop: '8px',
                    paddingBottom: '8px',
                  }}
                />
              </Stack>
              <Stack>
                <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-12)', marginBottom: '4px' }}>
                  Phone
                </Text>
                <Input
                  type="tel"
                  style={{
                    width: '100%',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    paddingLeft: '12px',
                    paddingRight: '12px',
                    paddingTop: '8px',
                    paddingBottom: '8px',
                  }}
                />
              </Stack>
            </Stack>
            <Row style={{ justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <Button onPress={() => setShowAddModal(false)} variant="ghost">
                Cancel
              </Button>
              <Button
                onPress={() => setShowAddModal(false)}
                variant="primary"
                style={{ backgroundColor: 'var(--color-blue-9)' }}
              >
                Add Subcontractor
              </Button>
            </Row>
          </Card>
        </Stack>
      )}
    </Stack>
  );
}
