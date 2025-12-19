import { useState } from 'react';
import {
  FileText,
  Upload,
  Download,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Eye,
} from 'lucide-react';
import { YStack, XStack, Text, Card, Button, H1 } from '@unicornlove/ui';
import CommonButton from '../Common/Button';
import DocumentDetailModal from '../Document/DocumentDetailModal';
import Modal from '../Common/Modal';
import { FileUploadZone } from '../documents/FileUploadZone';
import { useUser } from '../../contexts/UserContext';
import type { Document } from '../../types/document';

interface DocumentItem {
  id: string;
  name: string;
  type: 'coi' | 'license' | 'bond' | 'certification' | 'w9' | 'contract';
  status: 'verified' | 'pending' | 'expired' | 'expiring';
  uploadDate: string;
  expiryDate?: string;
  fileSize: string;
  uploadedBy: string;
}

export default function DocumentsPage() {
  const { currentUser } = useUser();
  const [filter, setFilter] = useState<
    'all' | 'verified' | 'pending' | 'expiring'
  >('all');
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(
    null
  );
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const mockDocuments: DocumentItem[] = [
    {
      id: '1',
      name: 'General Liability Certificate',
      type: 'coi',
      status: 'verified',
      uploadDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      expiryDate: new Date(
        Date.now() + 335 * 24 * 60 * 60 * 1000
      ).toISOString(),
      fileSize: '2.4 MB',
      uploadedBy: 'Mike Rodriguez',
    },
    {
      id: '2',
      name: 'Contractors License',
      type: 'license',
      status: 'verified',
      uploadDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      expiryDate: new Date(
        Date.now() + 305 * 24 * 60 * 60 * 1000
      ).toISOString(),
      fileSize: '1.8 MB',
      uploadedBy: 'Mike Rodriguez',
    },
    {
      id: '3',
      name: 'Performance Bond',
      type: 'bond',
      status: 'verified',
      uploadDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      expiryDate: new Date(
        Date.now() + 350 * 24 * 60 * 60 * 1000
      ).toISOString(),
      fileSize: '3.1 MB',
      uploadedBy: 'Mike Rodriguez',
    },
    {
      id: '4',
      name: 'Workers Compensation Certificate',
      type: 'coi',
      status: 'expiring',
      uploadDate: new Date(
        Date.now() - 330 * 24 * 60 * 60 * 1000
      ).toISOString(),
      expiryDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
      fileSize: '2.2 MB',
      uploadedBy: 'Mike Rodriguez',
    },
    {
      id: '5',
      name: 'OSHA 30 Certification',
      type: 'certification',
      status: 'verified',
      uploadDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      expiryDate: new Date(
        Date.now() + 1005 * 24 * 60 * 60 * 1000
      ).toISOString(),
      fileSize: '1.5 MB',
      uploadedBy: 'Mike Rodriguez',
    },
    {
      id: '6',
      name: 'W-9 Tax Form',
      type: 'w9',
      status: 'pending',
      uploadDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      fileSize: '890 KB',
      uploadedBy: 'Mike Rodriguez',
    },
  ];

  const filteredDocuments = mockDocuments.filter((doc) => {
    if (filter === 'all') return true;
    return doc.status === filter;
  });

  const stats = {
    total: mockDocuments.length,
    verified: mockDocuments.filter((d) => d.status === 'verified').length,
    pending: mockDocuments.filter((d) => d.status === 'pending').length,
    expiring: mockDocuments.filter(
      (d) => d.status === 'expiring' || d.status === 'expired'
    ).length,
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      coi: 'Certificate of Insurance',
      license: 'License',
      bond: 'Bond',
      certification: 'Certification',
      w9: 'Tax Form',
      contract: 'Contract',
    };
    return labels[type] || type;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle color="$green10" size={20} />;
      case 'expiring':
      case 'expired':
        return <AlertTriangle color="$orange10" size={20} />;
      case 'pending':
        return <Calendar color="$blue10" size={20} />;
      default:
        return null;
    }
  };

  const getDaysUntilExpiry = (expiryDate?: string) => {
    if (!expiryDate) return null;
    const days = Math.ceil(
      (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  const handleUploadDocument = (document: Document) => {
    console.log('Document uploaded:', document);
    // TODO: Refresh document list after upload
    // This would typically refetch documents from the API
  };

  const handleUploadError = (error: string) => {
    setUploadError(error);
    console.error('Upload error:', error);
  };

  return (
    <YStack gap="$6">
      <XStack alignItems="center" justifyContent="space-between">
        <YStack>
          <H1 fontSize="$8" fontWeight="bold" color="$color12">
            Documents
          </H1>
          <Text color="$color11">
            Manage your certificates, licenses, and compliance documents
          </Text>
        </YStack>
        <CommonButton onPress={() => setUploadModalOpen(true)}>
          <XStack alignItems="center" gap="$2">
            <Upload size={18} />
            <Text>Upload Document</Text>
          </XStack>
        </CommonButton>
      </XStack>

      <XStack
        flexWrap="wrap"
        gap="$6"
        // Use media query hook or conditional rendering instead of $gtMd prop
        // $gtMd responsive props can leak to DOM in some Tamagui versions
      >
        <Card
          padding="$6"
          elevation={1}
          borderWidth={1}
          borderColor="$borderColor"
          flex={1}
          minWidth="200px"
        >
          <XStack alignItems="center" justifyContent="space-between">
            <YStack>
              <Text color="$color11" fontSize="$2">Total Documents</Text>
              <Text fontSize="$9" fontWeight="bold" color="$color12" marginTop="$1">
                {stats.total}
              </Text>
            </YStack>
            <Card backgroundColor="$blue3" padding="$3" borderRadius="$4">
              <FileText color="$blue10" size={24} />
            </Card>
          </XStack>
        </Card>

        <Card
          padding="$6"
          elevation={1}
          borderWidth={1}
          borderColor="$borderColor"
          flex={1}
          minWidth="200px"
        >
          <XStack alignItems="center" justifyContent="space-between">
            <YStack>
              <Text color="$color11" fontSize="$2">Verified</Text>
              <Text fontSize="$9" fontWeight="bold" color="$green10" marginTop="$1">
                {stats.verified}
              </Text>
            </YStack>
            <Card backgroundColor="$green3" padding="$3" borderRadius="$4">
              <CheckCircle color="$green10" size={24} />
            </Card>
          </XStack>
        </Card>

        <Card
          padding="$6"
          elevation={1}
          borderWidth={1}
          borderColor="$borderColor"
          flex={1}
          minWidth="200px"
        >
          <XStack alignItems="center" justifyContent="space-between">
            <YStack>
              <Text color="$color11" fontSize="$2">Pending Review</Text>
              <Text fontSize="$9" fontWeight="bold" color="$blue10" marginTop="$1">
                {stats.pending}
              </Text>
            </YStack>
            <Card backgroundColor="$blue3" padding="$3" borderRadius="$4">
              <Calendar color="$blue10" size={24} />
            </Card>
          </XStack>
        </Card>

        <Card
          padding="$6"
          elevation={1}
          borderWidth={1}
          borderColor="$borderColor"
          flex={1}
          minWidth="200px"
        >
          <XStack alignItems="center" justifyContent="space-between">
            <YStack>
              <Text color="$color11" fontSize="$2">Expiring Soon</Text>
              <Text fontSize="$9" fontWeight="bold" color="$orange10" marginTop="$1">
                {stats.expiring}
              </Text>
            </YStack>
            <Card backgroundColor="$orange3" padding="$3" borderRadius="$4">
              <AlertTriangle color="$orange10" size={24} />
            </Card>
          </XStack>
        </Card>
      </XStack>

      <Card
        elevation={1}
        borderWidth={1}
        borderColor="$borderColor"
        padding="$6"
      >
        <XStack alignItems="center" gap="$2">
          <Button
            onPress={() => setFilter('all')}
            paddingHorizontal="$4"
            paddingVertical="$2"
            fontSize="$2"
            fontWeight="500"
            borderRadius="$4"
            backgroundColor={filter === 'all' ? '$blue9' : '$gray3'}
            color={filter === 'all' ? 'white' : '$color11'}
            hoverStyle={{
              backgroundColor: filter === 'all' ? '$blue9' : '$gray4',
            }}
          >
            All ({mockDocuments.length})
          </Button>
          <Button
            onPress={() => setFilter('verified')}
            paddingHorizontal="$4"
            paddingVertical="$2"
            fontSize="$2"
            fontWeight="500"
            borderRadius="$4"
            backgroundColor={filter === 'verified' ? '$blue9' : '$gray3'}
            color={filter === 'verified' ? 'white' : '$color11'}
            hoverStyle={{
              backgroundColor: filter === 'verified' ? '$blue9' : '$gray4',
            }}
          >
            Verified ({stats.verified})
          </Button>
          <Button
            onPress={() => setFilter('pending')}
            paddingHorizontal="$4"
            paddingVertical="$2"
            fontSize="$2"
            fontWeight="500"
            borderRadius="$4"
            backgroundColor={filter === 'pending' ? '$blue9' : '$gray3'}
            color={filter === 'pending' ? 'white' : '$color11'}
            hoverStyle={{
              backgroundColor: filter === 'pending' ? '$blue9' : '$gray4',
            }}
          >
            Pending ({stats.pending})
          </Button>
          <Button
            onPress={() => setFilter('expiring')}
            paddingHorizontal="$4"
            paddingVertical="$2"
            fontSize="$2"
            fontWeight="500"
            borderRadius="$4"
            backgroundColor={filter === 'expiring' ? '$blue9' : '$gray3'}
            color={filter === 'expiring' ? 'white' : '$color11'}
            hoverStyle={{
              backgroundColor: filter === 'expiring' ? '$blue9' : '$gray4',
            }}
          >
            Expiring ({stats.expiring})
          </Button>
        </XStack>
      </Card>

      <Card elevation={1} borderWidth={1} borderColor="$borderColor">
        <YStack overflowX="auto">
          <table width="100%">
            <thead>
              <tr>
                <th>
                  <XStack paddingHorizontal="$6" paddingVertical="$3">
                    <Text textAlign="left" fontSize="$1" fontWeight="500" color="$color11" textTransform="uppercase" letterSpacing={0.05}>
                      Document
                    </Text>
                  </XStack>
                </th>
                <th>
                  <XStack paddingHorizontal="$6" paddingVertical="$3">
                    <Text textAlign="left" fontSize="$1" fontWeight="500" color="$color11" textTransform="uppercase" letterSpacing={0.05}>
                      Type
                    </Text>
                  </XStack>
                </th>
                <th>
                  <XStack paddingHorizontal="$6" paddingVertical="$3">
                    <Text textAlign="left" fontSize="$1" fontWeight="500" color="$color11" textTransform="uppercase" letterSpacing={0.05}>
                      Status
                    </Text>
                  </XStack>
                </th>
                <th>
                  <XStack paddingHorizontal="$6" paddingVertical="$3">
                    <Text textAlign="left" fontSize="$1" fontWeight="500" color="$color11" textTransform="uppercase" letterSpacing={0.05}>
                      Upload Date
                    </Text>
                  </XStack>
                </th>
                <th>
                  <XStack paddingHorizontal="$6" paddingVertical="$3">
                    <Text textAlign="left" fontSize="$1" fontWeight="500" color="$color11" textTransform="uppercase" letterSpacing={0.05}>
                      Expiry
                    </Text>
                  </XStack>
                </th>
                <th>
                  <XStack paddingHorizontal="$6" paddingVertical="$3">
                    <Text textAlign="left" fontSize="$1" fontWeight="500" color="$color11" textTransform="uppercase" letterSpacing={0.05}>
                      Size
                    </Text>
                  </XStack>
                </th>
                <th>
                  <XStack paddingHorizontal="$6" paddingVertical="$3" justifyContent="flex-end">
                    <Text textAlign="right" fontSize="$1" fontWeight="500" color="$color11" textTransform="uppercase" letterSpacing={0.05}>
                      Actions
                    </Text>
                  </XStack>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.map((doc) => {
                const daysUntilExpiry = getDaysUntilExpiry(doc.expiryDate);
                return (
                  <tr key={doc.id}>
                    <td>
                      <XStack paddingHorizontal="$6" paddingVertical="$4" alignItems="center" gap="$3">
                        <FileText color="$blue10" size={20} />
                        <YStack>
                          <Text fontSize="$2" fontWeight="500" color="$color12">
                            {doc.name}
                          </Text>
                          <Text fontSize="$1" color="$color11">
                            Uploaded by {doc.uploadedBy}
                          </Text>
                        </YStack>
                      </XStack>
                    </td>
                    <td>
                      <XStack paddingHorizontal="$6" paddingVertical="$4">
                        <XStack
                          display="inline-flex"
                          alignItems="center"
                          paddingHorizontal="$2"
                          paddingVertical="$1"
                          borderRadius="$2"
                          backgroundColor="$blue3"
                        >
                          <Text fontSize="$1" fontWeight="500" color="$blue11">
                            {getTypeLabel(doc.type)}
                          </Text>
                        </XStack>
                      </XStack>
                    </td>
                    <td>
                      <XStack paddingHorizontal="$6" paddingVertical="$4" alignItems="center" gap="$2">
                        {getStatusIcon(doc.status)}
                        <Text fontSize="$2" color="$color12" textTransform="capitalize">
                          {doc.status}
                        </Text>
                      </XStack>
                    </td>
                    <td>
                      <XStack paddingHorizontal="$6" paddingVertical="$4">
                        <Text fontSize="$2" color="$color11">
                          {new Date(doc.uploadDate).toLocaleDateString()}
                        </Text>
                      </XStack>
                    </td>
                    <td>
                      <XStack paddingHorizontal="$6" paddingVertical="$4">
                        {doc.expiryDate ? (
                          <YStack>
                            <Text fontSize="$2" color="$color12">
                              {new Date(doc.expiryDate).toLocaleDateString()}
                            </Text>
                            {daysUntilExpiry !== null &&
                              daysUntilExpiry <= 30 && (
                                <Text fontSize="$1" color="$orange10">
                                  {daysUntilExpiry} days left
                                </Text>
                              )}
                          </YStack>
                        ) : (
                          <Text fontSize="$2" color="$color11">N/A</Text>
                        )}
                      </XStack>
                    </td>
                    <td>
                      <XStack paddingHorizontal="$6" paddingVertical="$4">
                        <Text fontSize="$2" color="$color11">
                          {doc.fileSize}
                        </Text>
                      </XStack>
                    </td>
                    <td>
                      <XStack paddingHorizontal="$6" paddingVertical="$4" alignItems="center" justifyContent="flex-end" gap="$2">
                        <Button
                          onPress={() => setSelectedDocument(doc)}
                          padding="$1"
                          backgroundColor="transparent"
                          color="$blue10"
                          hoverStyle={{
                            color: '$blue12',
                          }}
                        >
                          <Eye size={16} />
                        </Button>
                        <Button
                          padding="$1"
                          backgroundColor="transparent"
                          color="$blue10"
                          hoverStyle={{
                            color: '$blue12',
                          }}
                        >
                          <Download size={16} />
                        </Button>
                      </XStack>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </YStack>

        {filteredDocuments.length === 0 && (
          <YStack alignItems="center" paddingVertical="$12" gap="$4">
            <FileText color="$color10" size={48} />
            <YStack alignItems="center" gap="$2">
              <Text color="$color12" fontWeight="500">
              No documents found
            </Text>
              <Text color="$color11" fontSize="$2">
                Upload documents to get started
              </Text>
            </YStack>
          </YStack>
        )}
      </Card>

      {/* Document Detail Modal */}
      {selectedDocument && (
        <DocumentDetailModal
          documentId={selectedDocument.id}
          documentName={selectedDocument.name}
          documentType={getTypeLabel(selectedDocument.type)}
          uploadDate={selectedDocument.uploadDate}
          expiryDate={selectedDocument.expiryDate}
          uploadedBy={selectedDocument.uploadedBy}
          status={selectedDocument.status}
          fileSize={selectedDocument.fileSize}
          isOpen={!!selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}

      {/* Upload Document Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => {
          setUploadModalOpen(false);
          setUploadError(null);
        }}
        title="Upload Document"
        size="medium"
      >
        <YStack gap="$4">
          <Text color="$color11">
            Upload your compliance documents, certificates, licenses, or other required files.
          </Text>

          {uploadError && (
            <Card
              backgroundColor="$red2"
              borderColor="$red6"
              borderWidth={1}
              borderRadius="$4"
              padding="$4"
            >
              <Text color="$red11" fontSize="$3">
                {uploadError}
              </Text>
            </Card>
          )}

          {currentUser?.organization_id && currentUser?.id ? (
            <FileUploadZone
              projectId="general"
              uploaderId={currentUser.id}
              organizationId={currentUser.organization_id}
              subcontractorId={currentUser.id}
              maxFiles={5}
              onUpload={handleUploadDocument}
              onError={handleUploadError}
            />
          ) : (
            <Card
              backgroundColor="$yellow2"
              borderColor="$yellow6"
              borderWidth={1}
              borderRadius="$4"
              padding="$4"
            >
              <Text color="$yellow11" fontSize="$3">
                Unable to upload documents. Please ensure you are logged in and have a valid organization.
              </Text>
            </Card>
          )}

          <XStack justifyContent="flex-end" paddingTop="$4">
            <Button
              variant="ghost"
              onPress={() => {
                setUploadModalOpen(false);
                setUploadError(null);
              }}
            >
              Close
            </Button>
          </XStack>
        </YStack>
      </Modal>
    </YStack>
  );
}
