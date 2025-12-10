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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Subcontractors
          </h1>
          <p className="text-text-secondary">
            Manage subcontractor compliance and documentation
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="ghost" leftIcon={Upload} iconSize={16}>
            Import
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            variant="primary"
            leftIcon={Plus}
            iconSize={16}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Add Subcontractor
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-surface rounded-lg shadow-sm border border-border p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary"
              size={20}
            />
            <input
              type="text"
              placeholder="Search subcontractors or companies..."
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" leftIcon={Filter} iconSize={16}>
            Filter
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subcontractor List */}
        <div className="lg:col-span-1 bg-surface rounded-lg shadow-sm border border-border">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-text-primary">
              Subcontractors ({filteredSubcontractors.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {filteredSubcontractors.map((subcontractor) => (
              <button
                key={subcontractor.id}
                onClick={() => setSelectedSubcontractor(subcontractor.id)}
                className={`w-full p-4 text-left hover:bg-bg-secondary transition-colors ${
                  selectedSubcontractor === subcontractor.id
                    ? 'bg-primary-50 border-r-2 border-blue-600'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-text-primary">
                    {subcontractor.name}
                  </h3>
                  <StatusBadge
                    status={subcontractor.status}
                    size="sm"
                    showIcon={false}
                  />
                </div>
                <p className="text-sm text-text-secondary mb-2">
                  {subcontractor.company}
                </p>
                <div className="flex items-center justify-between">
                  <ComplianceScore
                    score={subcontractor.complianceScore}
                    size="sm"
                    showTrend={false}
                  />
                  <span className="text-xs text-text-secondary">
                    {subcontractor.documents.length} docs
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Subcontractor Details */}
        <div className="lg:col-span-2">
          {selectedSubcontractorData ? (
            <div className="space-y-6">
              {/* Subcontractor Info */}
              <div className="bg-surface rounded-lg shadow-sm border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-text-primary">
                      {selectedSubcontractorData.name}
                    </h2>
                    <p className="text-text-secondary">
                      {selectedSubcontractorData.company}
                    </p>
                  </div>
                  <ComplianceScore
                    score={selectedSubcontractorData.complianceScore}
                    trend="up"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-text-secondary">Email:</span>
                    <p className="font-medium">
                      {selectedSubcontractorData.email}
                    </p>
                  </div>
                  <div>
                    <span className="text-text-secondary">Phone:</span>
                    <p className="font-medium">
                      {selectedSubcontractorData.phone}
                    </p>
                  </div>
                  <div>
                    <span className="text-text-secondary">Status:</span>
                    <div className="mt-1">
                      <StatusBadge status={selectedSubcontractorData.status} />
                    </div>
                  </div>
                  <div>
                    <span className="text-text-secondary">Last Updated:</span>
                    <p className="font-medium">
                      {selectedSubcontractorData.lastUpdated.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="bg-surface rounded-lg shadow-sm border border-border">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold text-text-primary">Documents</h3>
                  <Button
                    variant="ghost"
                    leftIcon={Upload}
                    iconSize={16}
                    className="text-primary-600 hover:text-blue-700"
                  >
                    Upload
                  </Button>
                </div>
                <div className="p-4">
                  {selectedSubcontractorData.documents.length > 0 ? (
                    <div className="space-y-3">
                      {selectedSubcontractorData.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 border border-border rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            {doc.status === 'verified' && (
                              <CheckCircle
                                className="text-success-600"
                                size={16}
                              />
                            )}
                            {doc.status === 'pending' && (
                              <AlertTriangle
                                className="text-warning-600"
                                size={16}
                              />
                            )}
                            {doc.status === 'expired' && (
                              <XCircle className="text-error-600" size={16} />
                            )}
                            <div>
                              <p className="font-medium text-text-primary">
                                {doc.name}
                              </p>
                              <div className="flex items-center space-x-2 text-sm text-text-secondary">
                                <span className="capitalize">{doc.type}</span>
                                {doc.expiryDate && (
                                  <>
                                    <span>•</span>
                                    <span>
                                      Expires:{' '}
                                      {doc.expiryDate.toLocaleDateString()}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
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
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-text-secondary">
                      <Upload
                        size={48}
                        className="mx-auto mb-3 text-gray-300"
                      />
                      <p>No documents uploaded</p>
                      <p className="text-sm">
                        Upload certificates and licenses to get started
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Insurance Policies */}
              <div className="bg-surface rounded-lg shadow-sm border border-border">
                <div className="p-4 border-b border-border">
                  <h3 className="font-semibold text-text-primary">
                    Insurance Policies
                  </h3>
                </div>
                <div className="p-4">
                  {selectedSubcontractorData.insurancePolicies.length > 0 ? (
                    <div className="space-y-3">
                      {selectedSubcontractorData.insurancePolicies.map(
                        (policy) => (
                          <div
                            key={policy.id}
                            className="p-4 border border-border rounded-lg"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-text-primary">
                                {policy.type}
                              </h4>
                              <StatusBadge status={policy.status} size="sm" />
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-text-secondary">
                                  Provider:
                                </span>
                                <p className="font-medium">{policy.provider}</p>
                              </div>
                              <div>
                                <span className="text-text-secondary">
                                  Policy #:
                                </span>
                                <p className="font-medium">
                                  {policy.policyNumber}
                                </p>
                              </div>
                              <div>
                                <span className="text-text-secondary">
                                  Coverage:
                                </span>
                                <p className="font-medium">
                                  ${policy.coverage.toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <span className="text-text-secondary">
                                  Expires:
                                </span>
                                <p className="font-medium">
                                  {policy.endDate.toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-text-secondary">
                      <p>No insurance policies on file</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface rounded-lg shadow-sm border border-border p-12 text-center">
              <div className="text-text-tertiary mb-4">
                <Eye size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-text-primary mb-2">
                Select a Subcontractor
              </h3>
              <p className="text-text-secondary">
                Choose a subcontractor from the list to view their details and
                documents
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Subcontractor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Add New Subcontractor
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  className="w-full border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Company
                </label>
                <input
                  type="text"
                  className="w-full border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  className="w-full border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button onClick={() => setShowAddModal(false)} variant="ghost">
                Cancel
              </Button>
              <Button
                onClick={() => setShowAddModal(false)}
                variant="primary"
                className="bg-blue-600 hover:bg-blue-700"
              >
                Add Subcontractor
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
