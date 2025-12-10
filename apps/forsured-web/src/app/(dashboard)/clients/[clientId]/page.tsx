/**
 * Client Profile Page
 * REQ-274: Clickable Client Navigation
 * TASK-1: Create Client Profile Route and Page Component
 * TASK-2: Implement Client Profile Data Fetching
 * TASK-3: Render GC Relationships with Compliance Status and Activity Feed
 *
 * Displays client profile with:
 * - Client header with name
 * - GC Relationships section with compliance status
 * - Recent Activity feed
 */

import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Building2, Clock } from 'lucide-react';
import { trpc } from '../../../../lib/trpc';
import StatusBadge from '../../../../components/Common/StatusBadge';

// TODO: Replace with real organization ID from auth context
const MOCK_ORG_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
}

export default function ClientProfilePage() {
  const params = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const clientId = params.clientId as string;

  // Fetch client profile data
  const {
    data: profileData,
    isLoading,
    error,
  } = trpc.clientProfile.getProfile.useQuery(
    {
      organizationId: MOCK_ORG_ID,
      clientId,
    },
    {
      enabled: !!clientId,
    }
  );

  const handleBack = () => {
    navigate(-1);
  };

  // Loading state
  if (isLoading) {
    return (
      <div
        className="min-h-screen bg-gray-50"
        data-testid="client-profile-container"
      >
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
          data-testid="client-profile-content"
        >
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className="min-h-screen bg-gray-50"
        data-testid="client-profile-container"
      >
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
          data-testid="client-profile-content"
        >
          <button
            onClick={handleBack}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <h2 className="text-lg font-semibold text-red-800">
                Error Loading Client
              </h2>
            </div>
            <p className="mt-2 text-sm text-red-600">
              {error.message || 'Failed to load client profile'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const clientName = profileData?.client.name || 'Unknown Client';
  const gcRelationships = profileData?.gcRelationships || [];
  const recentActivity = profileData?.recentActivity || [];

  return (
    <div
      className="min-h-screen bg-gray-50"
      data-testid="client-profile-container"
    >
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        data-testid="client-profile-content"
      >
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Client Profile</h1>
          <p className="mt-2 text-lg text-gray-700" data-testid="client-name">
            {clientName}
          </p>
          <p className="mt-1 text-xs text-gray-400" data-testid="client-id">
            {clientId}
          </p>
        </div>

        {/* GC Relationships Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            GC Relationships
          </h2>
          {gcRelationships.length > 0 ? (
            <div className="space-y-3" data-testid="gc-relationships-list">
              {gcRelationships.map((relationship) => (
                <div
                  key={relationship.gcId}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100"
                  data-testid="gc-relationship-item"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <Link
                        to={`/clients/${relationship.gcId}`}
                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        data-testid="gc-name-link"
                      >
                        {relationship.gcName}
                      </Link>
                      <p className="text-sm text-gray-500">
                        Compliance Score: {relationship.complianceScore}%
                      </p>
                    </div>
                  </div>
                  <StatusBadge
                    status={relationship.complianceStatus as 'compliant' | 'warning' | 'critical'}
                    size="sm"
                    data-testid="compliance-badge"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              No GC relationships found for this client
            </p>
          )}
        </div>

        {/* Compliance Status Section - Summary view */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Compliance Status
          </h2>
          {gcRelationships.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="compliance-summary">
              <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                <p className="text-sm text-green-600 font-medium">Compliant</p>
                <p className="text-2xl font-bold text-green-700">
                  {gcRelationships.filter((r) => r.complianceStatus === 'compliant').length}
                </p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                <p className="text-sm text-yellow-600 font-medium">Warning</p>
                <p className="text-2xl font-bold text-yellow-700">
                  {gcRelationships.filter((r) => r.complianceStatus === 'warning').length}
                </p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                <p className="text-sm text-red-600 font-medium">Critical</p>
                <p className="text-2xl font-bold text-red-700">
                  {gcRelationships.filter((r) => r.complianceStatus === 'critical').length}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              No compliance data available
            </p>
          )}
        </div>

        {/* Recent Activity Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>
          {recentActivity.length > 0 ? (
            <div className="space-y-0 max-h-80 overflow-y-auto" data-testid="activity-feed">
              {recentActivity.map((activity, index) => (
                <div
                  key={activity.id}
                  className={`flex items-start gap-3 py-3 ${
                    index !== recentActivity.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                  data-testid="activity-item"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500">
                      {formatTimestamp(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              No recent activity
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
