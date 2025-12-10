/**
 * REQ-165: Compliance Requirements Management System
 * List view for compliance requirements with filtering and actions
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ComplianceRequirement,
  CoverageType,
  RequirementStatus,
  RequirementFilters
} from '../../lib/compliance/types';
import { listRequirements, deleteRequirement } from '../../lib/compliance/requirementService';

interface RequirementListProps {
  organizationId: string;
  onViewRequirement?: (requirement: ComplianceRequirement) => void;
  onEditRequirement?: (requirement: ComplianceRequirement) => void;
  onCloneRequirement?: (requirement: ComplianceRequirement) => void;
  onCreateNew?: () => void;
}

export default function RequirementList({
  organizationId,
  onViewRequirement,
  onEditRequirement,
  onCloneRequirement,
  onCreateNew
}: RequirementListProps) {
  const [requirements, setRequirements] = useState<ComplianceRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<RequirementFilters>({
    organization_id: organizationId
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const loadRequirements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await listRequirements({
        filters: {
          ...filters,
          search: searchTerm || undefined
        },
        page,
        limit: 20,
        sort_by: 'created_at',
        ascending: false
      });

      setRequirements(result.data);
      setTotalPages(result.pagination.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requirements');
    } finally {
      setLoading(false);
    }
  }, [filters, page, searchTerm]);

  useEffect(() => {
    loadRequirements();
  }, [loadRequirements]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    loadRequirements();
  }

  async function handleDelete(requirement: ComplianceRequirement) {
    if (!confirm(`Are you sure you want to archive "${requirement.name}"?`)) {
      return;
    }

    try {
      await deleteRequirement(requirement.id);
      loadRequirements();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to archive requirement');
    }
  }

  function getTypeLabel(type: CoverageType): string {
    const labels = {
      [CoverageType.GENERAL_LIABILITY]: 'General Liability',
      [CoverageType.WORKERS_COMP]: 'Workers Comp',
      [CoverageType.AUTO_LIABILITY]: 'Auto Liability',
      [CoverageType.UMBRELLA]: 'Umbrella',
      [CoverageType.CUSTOM]: 'Custom'
    };
    return labels[type];
  }

  function getStatusBadge(status: RequirementStatus) {
    const colors = {
      [RequirementStatus.ACTIVE]: 'bg-green-100 text-green-800',
      [RequirementStatus.DRAFT]: 'bg-yellow-100 text-yellow-800',
      [RequirementStatus.ARCHIVED]: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  }

  if (loading && requirements.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading requirements...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">Error: {error}</p>
        <button
          onClick={() => loadRequirements()}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Compliance Requirements</h2>
        {onCreateNew && (
          <button
            onClick={onCreateNew}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Create Requirement
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Search requirements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={filters.type || ''}
                onChange={(e) =>
                  setFilters({ ...filters, type: e.target.value as CoverageType || undefined })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value={CoverageType.GENERAL_LIABILITY}>General Liability</option>
                <option value={CoverageType.WORKERS_COMP}>Workers Comp</option>
                <option value={CoverageType.AUTO_LIABILITY}>Auto Liability</option>
                <option value={CoverageType.UMBRELLA}>Umbrella</option>
                <option value={CoverageType.CUSTOM}>Custom</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value as RequirementStatus || undefined })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value={RequirementStatus.ACTIVE}>Active</option>
                <option value={RequirementStatus.DRAFT}>Draft</option>
                <option value={RequirementStatus.ARCHIVED}>Archived</option>
              </select>
            </div>

            {/* Template Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={filters.is_template === undefined ? '' : filters.is_template.toString()}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilters({
                    ...filters,
                    is_template: value === '' ? undefined : value === 'true'
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="true">Templates Only</option>
                <option value="false">Requirements Only</option>
              </select>
            </div>

            {/* Search Button */}
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Search
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Requirements Table */}
      {requirements.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 mb-4">No requirements found. Create your first requirement or load from templates.</p>
          {onCreateNew && (
            <button
              onClick={onCreateNew}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Create Requirement
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Version
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Template
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requirements.map((requirement) => (
                <tr
                  key={requirement.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onViewRequirement?.(requirement)}
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{requirement.name}</div>
                    {requirement.description && (
                      <div className="text-sm text-gray-500 truncate max-w-md">
                        {requirement.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{getTypeLabel(requirement.type)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(requirement.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    v{requirement.version}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {requirement.is_template ? 'Yes' : 'No'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {onEditRequirement && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditRequirement(requirement);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                      )}
                      {onCloneRequirement && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCloneRequirement(requirement);
                          }}
                          className="text-green-600 hover:text-green-900"
                        >
                          Clone
                        </button>
                      )}
                      {requirement.status !== RequirementStatus.ARCHIVED && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(requirement);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          Archive
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Page {page} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
