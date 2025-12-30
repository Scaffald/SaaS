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
import { YStack, XStack, Text, H1, H2, H3, Card, Input } from 'tamagui';
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
    <YStack gap="$6">
      {/* Header */}
      <XStack alignItems="center" justifyContent="space-between">
        <YStack>
          <H1 fontSize="$8" fontWeight="bold" color="$color12">
            Subcontractors
          </H1>
          <Text color="$color11">
            Manage subcontractor compliance and documentation
          </Text>
        </YStack>
        <XStack alignItems="center" gap="$3">
          <Button variant="ghost" leftIcon={Upload} iconSize={16}>
            Import
          </Button>
          <Button
            onPress={() => setShowAddModal(true)}
            variant="primary"
            leftIcon={Plus}
            iconSize={16}
            backgroundColor="$blue9"
            hoverStyle={{ backgroundColor: "$blue10" }}
          >
            Add Subcontractor
          </Button>
        </XStack>
      </XStack>

      {/* Search and Filters */}
      <Card backgroundColor="$background" borderRadius="$4" shadowColor="$shadowColor" shadowRadius="$1" borderWidth={1} borderColor="$borderColor" padding="$4">
        <XStack flexDirection="column" $gtSm={{ flexDirection: "row" }} gap="$4">
          <XStack flex={1} position="relative">
            <Search
              position="absolute"
              left="$3"
              top="50%"
              transform={[{ translateY: -10 }]}
              color="$color10"
              size={20}
            />
            <Input
              type="text"
              placeholder="Search subcontractors or companies..."
              width="100%"
              paddingLeft="$10"
              paddingRight="$4"
              paddingVertical="$2"
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius="$4"
            />
          </XStack>
          <Button variant="outline" leftIcon={Filter} iconSize={16}>
            Filter
          </Button>
        </XStack>
      </Card>

      <XStack flexDirection="column" $gtLg={{ flexDirection: "row" }} gap="$6">
        {/* Subcontractor List */}
        <Card flex={1} $gtLg={{ flex: "0 0 33.333%" }} backgroundColor="$background" borderRadius="$4" shadowColor="$shadowColor" shadowRadius="$1" borderWidth={1} borderColor="$borderColor">
          <YStack padding="$4" borderBottomWidth={1} borderColor="$borderColor">
            <Text fontWeight="600" color="$color12">
              Subcontractors ({filteredSubcontractors.length})
            </Text>
          </YStack>
          <YStack maxHeight={384} overflowY="auto">
            {filteredSubcontractors.map((subcontractor) => (
              <Button
                key={subcontractor.id}
                onPress={() => setSelectedSubcontractor(subcontractor.id)}
                variant="ghost"
                width="100%"
                padding="$4"
                justifyContent="flex-start"
                backgroundColor={selectedSubcontractor === subcontractor.id ? "$blue3" : "transparent"}
                borderRightWidth={selectedSubcontractor === subcontractor.id ? 2 : 0}
                borderRightColor={selectedSubcontractor === subcontractor.id ? "$blue9" : "transparent"}
                hoverStyle={{ backgroundColor: "$backgroundHover" }}
              >
                <YStack width="100%">
                  <XStack alignItems="center" justifyContent="space-between" mb="$2">
                    <Text fontWeight="500" color="$color12">
                      {subcontractor.name}
                    </Text>
                    <StatusBadge
                      status={subcontractor.status}
                      size="sm"
                      showIcon={false}
                    />
                  </XStack>
                  <Text fontSize="$3" color="$color11" mb="$2">
                    {subcontractor.company}
                  </Text>
                  <XStack alignItems="center" justifyContent="space-between">
                    <ComplianceScore
                      score={subcontractor.complianceScore}
                      size="sm"
                      showTrend={false}
                    />
                    <Text fontSize="$1" color="$color11">
                      {subcontractor.documents.length} docs
                    </Text>
                  </XStack>
                </YStack>
              </Button>
            ))}
          </YStack>
        </Card>

        {/* Subcontractor Details */}
        <YStack flex={2} $gtLg={{ flex: "0 0 66.666%" }}>
          {selectedSubcontractorData ? (
            <YStack gap="$6">
              {/* Subcontractor Info */}
              <Card backgroundColor="$background" borderRadius="$4" shadowColor="$shadowColor" shadowRadius="$1" borderWidth={1} borderColor="$borderColor" padding="$6">
                <XStack alignItems="center" justifyContent="space-between" mb="$4">
                  <YStack>
                    <H2 fontSize="$7" fontWeight="bold" color="$color12">
                      {selectedSubcontractorData.name}
                    </H2>
                    <Text color="$color11">
                      {selectedSubcontractorData.company}
                    </Text>
                  </YStack>
                  <ComplianceScore
                    score={selectedSubcontractorData.complianceScore}
                    trend="up"
                  />
                </XStack>

                <XStack gap="$4" flexWrap="wrap" fontSize="$3">
                  <YStack flex={1} minWidth={200}>
                    <Text color="$color11">Email:</Text>
                    <Text fontWeight="500">
                      {selectedSubcontractorData.email}
                    </Text>
                  </YStack>
                  <YStack flex={1} minWidth={200}>
                    <Text color="$color11">Phone:</Text>
                    <Text fontWeight="500">
                      {selectedSubcontractorData.phone}
                    </Text>
                  </YStack>
                  <YStack flex={1} minWidth={200}>
                    <Text color="$color11">Status:</Text>
                    <YStack mt="$1">
                      <StatusBadge status={selectedSubcontractorData.status} />
                    </YStack>
                  </YStack>
                  <YStack flex={1} minWidth={200}>
                    <Text color="$color11">Last Updated:</Text>
                    <Text fontWeight="500">
                      {selectedSubcontractorData.lastUpdated.toLocaleDateString()}
                    </Text>
                  </YStack>
                </XStack>
              </Card>

              {/* Documents */}
              <Card backgroundColor="$background" borderRadius="$4" shadowColor="$shadowColor" shadowRadius="$1" borderWidth={1} borderColor="$borderColor">
                <XStack padding="$4" borderBottomWidth={1} borderColor="$borderColor" alignItems="center" justifyContent="space-between">
                  <Text fontWeight="600" color="$color12">Documents</Text>
                  <Button
                    variant="ghost"
                    leftIcon={Upload}
                    iconSize={16}
                    color="$blue9"
                    hoverStyle={{ color: "$blue10" }}
                  >
                    Upload
                  </Button>
                </XStack>
                <YStack padding="$4">
                  {selectedSubcontractorData.documents.length > 0 ? (
                    <YStack gap="$3">
                      {selectedSubcontractorData.documents.map((doc) => (
                        <XStack
                          key={doc.id}
                          alignItems="center"
                          justifyContent="space-between"
                          padding="$3"
                          borderWidth={1}
                          borderColor="$borderColor"
                          borderRadius="$4"
                        >
                          <XStack alignItems="center" gap="$3">
                            {doc.status === 'verified' && (
                              <CheckCircle color="$green9" size={16} />
                            )}
                            {doc.status === 'pending' && (
                              <AlertTriangle color="$yellow9" size={16} />
                            )}
                            {doc.status === 'expired' && (
                              <XCircle color="$red9" size={16} />
                            )}
                            <YStack>
                              <Text fontWeight="500" color="$color12">
                                {doc.name}
                              </Text>
                              <XStack alignItems="center" gap="$2" fontSize="$3" color="$color11">
                                <Text fontSize="$3" color="$color11" textTransform="capitalize">{doc.type}</Text>
                                {doc.expiryDate && (
                                  <>
                                    <Text>•</Text>
                                    <Text fontSize="$3" color="$color11">
                                      Expires: {doc.expiryDate.toLocaleDateString()}
                                    </Text>
                                  </>
                                )}
                              </XStack>
                            </YStack>
                          </XStack>
                          <XStack alignItems="center" gap="$2">
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
                          </XStack>
                        </XStack>
                      ))}
                    </YStack>
                  ) : (
                    <YStack alignItems="center" paddingVertical="$8">
                      <Upload size={48} color="$gray8" mb="$3" />
                      <Text color="$color11">No documents uploaded</Text>
                      <Text fontSize="$3" color="$color11">
                        Upload certificates and licenses to get started
                      </Text>
                    </YStack>
                  )}
                </YStack>
              </Card>

              {/* Insurance Policies */}
              <Card backgroundColor="$background" borderRadius="$4" shadowColor="$shadowColor" shadowRadius="$1" borderWidth={1} borderColor="$borderColor">
                <YStack padding="$4" borderBottomWidth={1} borderColor="$borderColor">
                  <Text fontWeight="600" color="$color12">
                    Insurance Policies
                  </Text>
                </YStack>
                <YStack padding="$4">
                  {selectedSubcontractorData.insurancePolicies.length > 0 ? (
                    <YStack gap="$3">
                      {selectedSubcontractorData.insurancePolicies.map(
                        (policy) => (
                          <Card
                            key={policy.id}
                            padding="$4"
                            borderWidth={1}
                            borderColor="$borderColor"
                            borderRadius="$4"
                          >
                            <XStack alignItems="center" justifyContent="space-between" mb="$2">
                              <Text fontWeight="500" color="$color12">
                                {policy.type}
                              </Text>
                              <StatusBadge status={policy.status} size="sm" />
                            </XStack>
                            <XStack gap="$4" flexWrap="wrap" fontSize="$3">
                              <YStack flex={1} minWidth={200}>
                                <Text color="$color11">Provider:</Text>
                                <Text fontWeight="500">{policy.provider}</Text>
                              </YStack>
                              <YStack flex={1} minWidth={200}>
                                <Text color="$color11">Policy #:</Text>
                                <Text fontWeight="500">
                                  {policy.policyNumber}
                                </Text>
                              </YStack>
                              <YStack flex={1} minWidth={200}>
                                <Text color="$color11">Coverage:</Text>
                                <Text fontWeight="500">
                                  ${policy.coverage.toLocaleString()}
                                </Text>
                              </YStack>
                              <YStack flex={1} minWidth={200}>
                                <Text color="$color11">Expires:</Text>
                                <Text fontWeight="500">
                                  {policy.endDate.toLocaleDateString()}
                                </Text>
                              </YStack>
                            </XStack>
                          </Card>
                        )
                      )}
                    </YStack>
                  ) : (
                    <YStack alignItems="center" paddingVertical="$8">
                      <Text color="$color11">No insurance policies on file</Text>
                    </YStack>
                  )}
                </YStack>
              </Card>
            </YStack>
          ) : (
            <Card backgroundColor="$background" borderRadius="$4" shadowColor="$shadowColor" shadowRadius="$1" borderWidth={1} borderColor="$borderColor" padding="$12" alignItems="center">
              <YStack alignItems="center" mb="$4">
                <Eye size={48} color="$color10" />
              </YStack>
              <H3 fontSize="$6" fontWeight="500" color="$color12" mb="$2">
                Select a Subcontractor
              </H3>
              <Text color="$color11" style={{ textAlign: 'center' }}>
                Choose a subcontractor from the list to view their details and
                documents
              </Text>
            </Card>
          )}
        </YStack>
      </XStack>

      {/* Add Subcontractor Modal */}
      {showAddModal && (
        <YStack
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          backgroundColor="rgba(0,0,0,0.5)"
          alignItems="center"
          justifyContent="center"
          zIndex={50}
        >
          <Card backgroundColor="$background" borderRadius="$4" padding="$6" width="100%" maxWidth={448}>
            <H3 fontSize="$6" fontWeight="600" color="$color12" mb="$4">
              Add New Subcontractor
            </H3>
            <YStack gap="$4">
              <YStack>
                <Text fontSize="$3" fontWeight="500" color="$color12" mb="$1">
                  Full Name
                </Text>
                <Input
                  type="text"
                  width="100%"
                  borderWidth={1}
                  borderColor="$borderColor"
                  borderRadius="$4"
                  paddingHorizontal="$3"
                  paddingVertical="$2"
                />
              </YStack>
              <YStack>
                <Text fontSize="$3" fontWeight="500" color="$color12" mb="$1">
                  Company
                </Text>
                <Input
                  type="text"
                  width="100%"
                  borderWidth={1}
                  borderColor="$borderColor"
                  borderRadius="$4"
                  paddingHorizontal="$3"
                  paddingVertical="$2"
                />
              </YStack>
              <YStack>
                <Text fontSize="$3" fontWeight="500" color="$color12" mb="$1">
                  Email
                </Text>
                <Input
                  type="email"
                  width="100%"
                  borderWidth={1}
                  borderColor="$borderColor"
                  borderRadius="$4"
                  paddingHorizontal="$3"
                  paddingVertical="$2"
                />
              </YStack>
              <YStack>
                <Text fontSize="$3" fontWeight="500" color="$color12" mb="$1">
                  Phone
                </Text>
                <Input
                  type="tel"
                  width="100%"
                  borderWidth={1}
                  borderColor="$borderColor"
                  borderRadius="$4"
                  paddingHorizontal="$3"
                  paddingVertical="$2"
                />
              </YStack>
            </YStack>
            <XStack justifyContent="flex-end" gap="$3" mt="$6">
              <Button onPress={() => setShowAddModal(false)} variant="ghost">
                Cancel
              </Button>
              <Button
                onPress={() => setShowAddModal(false)}
                variant="primary"
                backgroundColor="$blue9"
                hoverStyle={{ backgroundColor: "$blue10" }}
              >
                Add Subcontractor
              </Button>
            </XStack>
          </Card>
        </YStack>
      )}
    </YStack>
  );
}
