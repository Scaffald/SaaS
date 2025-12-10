import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Download,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Eye,
} from 'lucide-react';
import Button from '../Common/Button';
import DocumentDetailModal from '../Document/DocumentDetailModal';

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
  const [filter, setFilter] = useState<
    'all' | 'verified' | 'pending' | 'expiring'
  >('all');
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(
    null
  );

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
        return <CheckCircle className="text-success-600" size={20} />;
      case 'expiring':
      case 'expired':
        return <AlertTriangle className="text-warning-600" size={20} />;
      case 'pending':
        return <Calendar className="text-primary-600" size={20} />;
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Documents</h1>
          <p className="text-text-secondary">
            Manage your certificates, licenses, and compliance documents
          </p>
        </div>
        <Button className="flex items-center space-x-2">
          <Upload size={18} />
          <span>Upload Document</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Total Documents</p>
              <p className="text-3xl font-bold text-text-primary mt-1">
                {stats.total}
              </p>
            </div>
            <div className="bg-primary-100 p-3 rounded-lg">
              <FileText className="text-primary-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Verified</p>
              <p className="text-3xl font-bold text-success-600 mt-1">
                {stats.verified}
              </p>
            </div>
            <div className="bg-success-100 p-3 rounded-lg">
              <CheckCircle className="text-success-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Pending Review</p>
              <p className="text-3xl font-bold text-primary-600 mt-1">
                {stats.pending}
              </p>
            </div>
            <div className="bg-primary-100 p-3 rounded-lg">
              <Calendar className="text-primary-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Expiring Soon</p>
              <p className="text-3xl font-bold text-warning-600 mt-1">
                {stats.expiring}
              </p>
            </div>
            <div className="bg-warning-100 p-3 rounded-lg">
              <AlertTriangle className="text-warning-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-lg shadow-sm border border-border p-6">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${
              filter === 'all'
                ? 'bg-primary-500 text-white'
                : 'bg-neutral-100 text-text-secondary hover:bg-neutral-200'
            }`}
          >
            All ({mockDocuments.length})
          </button>
          <button
            onClick={() => setFilter('verified')}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${
              filter === 'verified'
                ? 'bg-primary-500 text-white'
                : 'bg-neutral-100 text-text-secondary hover:bg-neutral-200'
            }`}
          >
            Verified ({stats.verified})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${
              filter === 'pending'
                ? 'bg-primary-500 text-white'
                : 'bg-neutral-100 text-text-secondary hover:bg-neutral-200'
            }`}
          >
            Pending ({stats.pending})
          </button>
          <button
            onClick={() => setFilter('expiring')}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${
              filter === 'expiring'
                ? 'bg-primary-500 text-white'
                : 'bg-neutral-100 text-text-secondary hover:bg-neutral-200'
            }`}
          >
            Expiring ({stats.expiring})
          </button>
        </div>
      </div>

      <div className="bg-surface rounded-lg shadow-sm border border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-bg-tertiary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Document
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Upload Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Expiry
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border">
              {filteredDocuments.map((doc) => {
                const daysUntilExpiry = getDaysUntilExpiry(doc.expiryDate);
                return (
                  <tr
                    key={doc.id}
                    className="hover:bg-surface-hover transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="text-primary-600 mr-3" size={20} />
                        <div>
                          <div className="text-sm font-medium text-text-primary">
                            {doc.name}
                          </div>
                          <div className="text-xs text-text-secondary">
                            Uploaded by {doc.uploadedBy}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary-100 text-primary-700">
                        {getTypeLabel(doc.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(doc.status)}
                        <span className="text-sm text-text-primary capitalize">
                          {doc.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {new Date(doc.uploadDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {doc.expiryDate ? (
                        <div>
                          <div className="text-sm text-text-primary">
                            {new Date(doc.expiryDate).toLocaleDateString()}
                          </div>
                          {daysUntilExpiry !== null &&
                            daysUntilExpiry <= 30 && (
                              <div className="text-xs text-warning-600">
                                {daysUntilExpiry} days left
                              </div>
                            )}
                        </div>
                      ) : (
                        <span className="text-sm text-text-secondary">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {doc.fileSize}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedDocument(doc)}
                          className="text-primary-600 hover:text-primary-900 p-1"
                        >
                          <Eye size={16} />
                        </button>
                        <button className="text-primary-600 hover:text-primary-900 p-1">
                          <Download size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredDocuments.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto text-text-tertiary mb-4" size={48} />
            <p className="text-text-primary font-medium mb-2">
              No documents found
            </p>
            <p className="text-text-secondary text-sm">
              Upload documents to get started
            </p>
          </div>
        )}
      </div>

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
    </div>
  );
}
