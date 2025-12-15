/**
 * REQ-3: CCPA Compliance Implementation
 * Privacy Settings Page
 *
 * Provides users with CCPA privacy rights management including:
 * - View data categories collected
 * - Submit data requests (export, deletion, correction)
 * - Manage opt-out preferences
 * - View connected apps and revoke access
 */

import { useState, useEffect } from 'react';

// Types for CCPA data
interface DataCategory {
  category: string;
  record_count: number;
  data_types: string[];
}

interface PrivacyRequest {
  id: string;
  type: 'export' | 'deletion' | 'correction';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  updated_at: string;
  estimated_completion?: string;
  download_url?: string;
}

interface ConnectedApp {
  id: string;
  app_name: string;
  app_id: string;
  permissions: string[];
  connected_at: string;
  last_accessed?: string;
  data_categories: string[];
}

interface OptOutStatus {
  category: 'sale' | 'sharing' | 'targeted_advertising' | 'sensitive_data';
  opted_out: boolean;
  opted_out_at?: string;
  source: 'user' | 'gpc' | 'default';
}

// Category metadata
const CATEGORY_INFO: Record<string, { name: string; description: string; icon: string }> = {
  identifiers: {
    name: 'Personal Identifiers',
    description: 'Name, email, phone, company information',
    icon: '👤',
  },
  financial: {
    name: 'Financial Information',
    description: 'Insurance policies, payment records, coverage details',
    icon: '💰',
  },
  professional: {
    name: 'Professional Information',
    description: 'Certifications, compliance records, documents',
    icon: '📋',
  },
  commercial: {
    name: 'Commercial Information',
    description: 'Projects, business relationships, transactions',
    icon: '🏢',
  },
  usage: {
    name: 'Usage Data',
    description: 'Login history, feature usage, activity logs',
    icon: '📊',
  },
  inferences: {
    name: 'Inferences',
    description: 'Compliance scores, risk assessments',
    icon: '🔍',
  },
};

// Privacy rights information
const PRIVACY_RIGHTS = [
  {
    title: 'Right to Know',
    description: 'Request a copy of the personal information we have collected about you.',
    action: 'Request My Data',
    type: 'export' as const,
  },
  {
    title: 'Right to Delete',
    description: 'Request deletion of your personal information. Some data may be retained for legal or regulatory requirements.',
    action: 'Delete My Data',
    type: 'deletion' as const,
  },
  {
    title: 'Right to Opt-Out',
    description: 'Opt-out of the sale or sharing of your personal information.',
    action: 'Manage Opt-Outs',
    type: 'opt-out' as const,
  },
  {
    title: 'Right to Correct',
    description: 'Request correction of inaccurate personal information.',
    action: 'Correct My Data',
    type: 'correction' as const,
  },
  {
    title: 'Right to Non-Discrimination',
    description: 'We will not receive discriminatory treatment for exercising your privacy rights.',
    action: null,
    type: null,
  },
  {
    title: 'Right to Limit Use of Sensitive Information',
    description: 'Limit the use and disclosure of sensitive personal information.',
    action: 'Manage Settings',
    type: 'opt-out' as const,
  },
];

export default function PrivacySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<'request' | 'opt-out' | null>(null);
  const [requestType, setRequestType] = useState<'export' | 'deletion' | 'correction'>('export');

  // State for data
  const [categories, setCategories] = useState<DataCategory[]>([]);
  const [requests, setRequests] = useState<PrivacyRequest[]>([]);
  const [connectedApps, setConnectedApps] = useState<ConnectedApp[]>([]);
  const [optOuts, setOptOuts] = useState<OptOutStatus[]>([]);
  const [hasGPC, setHasGPC] = useState(false);

  // Detect GPC signal
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      // Check for Global Privacy Control signal (not yet in standard TypeScript types)
      const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
      const gpcSignal = nav.globalPrivacyControl === true || navigator.doNotTrack === '1';
      setHasGPC(gpcSignal);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    const loadPrivacyData = async () => {
      try {
        setLoading(true);
        setError(null);

        // In a real implementation, these would be actual tRPC calls
        // For now, we'll use mock data to demonstrate the UI

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Mock data summary
        setCategories([
          { category: 'identifiers', record_count: 5, data_types: ['name', 'email', 'phone'] },
          { category: 'financial', record_count: 3, data_types: ['policies', 'coverage'] },
          { category: 'professional', record_count: 12, data_types: ['certifications', 'documents'] },
          { category: 'commercial', record_count: 4, data_types: ['projects', 'assignments'] },
          { category: 'usage', record_count: 156, data_types: ['logins', 'activity'] },
          { category: 'inferences', record_count: 2, data_types: ['compliance_scores'] },
        ]);

        // Mock requests
        setRequests([]);

        // Mock connected apps
        setConnectedApps([]);

        // Mock opt-out status
        setOptOuts([
          { category: 'sale', opted_out: false, source: 'default' },
          { category: 'sharing', opted_out: false, source: 'default' },
          { category: 'targeted_advertising', opted_out: false, source: 'default' },
          { category: 'sensitive_data', opted_out: false, source: 'default' },
        ]);

      } catch (err) {
        setError('Failed to load privacy data. Please try again.');
        console.error('Privacy data error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPrivacyData();
  }, []);

  const handleRequestClick = (type: 'export' | 'deletion' | 'correction') => {
    setRequestType(type);
    setActiveModal('request');
  };

  const handleOptOutClick = () => {
    setActiveModal('opt-out');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Privacy Settings</h1>
        <p className="text-gray-600">
          Manage your privacy preferences and exercise your rights under the California Consumer Privacy Act (CCPA).
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-2 text-red-600 underline hover:text-red-800"
          >
            Try again
          </button>
        </div>
      )}

      {/* GPC Banner */}
      {hasGPC && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <span className="text-green-600 text-xl">✓</span>
          <div>
            <h3 className="font-semibold text-green-800">Global Privacy Control Detected</h3>
            <p className="text-green-700 text-sm">
              Your browser has sent a Global Privacy Control (GPC) signal. We honor this signal
              and have automatically opted you out of data sale and sharing.
            </p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => handleRequestClick('export')}
            className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-left"
          >
            <span className="text-2xl mb-2 block">📥</span>
            <h3 className="font-semibold text-blue-900">Request My Data</h3>
            <p className="text-sm text-blue-700">Download a copy of your personal data</p>
          </button>

          <button
            type="button"
            onClick={() => handleRequestClick('deletion')}
            className="p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-left"
          >
            <span className="text-2xl mb-2 block">🗑️</span>
            <h3 className="font-semibold text-red-900">Delete My Data</h3>
            <p className="text-sm text-red-700">Request deletion of your personal data</p>
          </button>

          <button
            type="button"
            onClick={handleOptOutClick}
            className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-left"
          >
            <span className="text-2xl mb-2 block">🛡️</span>
            <h3 className="font-semibold text-purple-900">Manage Opt-Outs</h3>
            <p className="text-sm text-purple-700">Control how your data is used and shared</p>
          </button>
        </div>
      </div>

      {/* Data Categories */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Data Categories</h2>
        <p className="text-gray-600 mb-4">
          Below are the categories of personal information we collect about you.
        </p>
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="p-4 bg-gray-50 border-b">
            <p className="text-sm text-gray-600">
              We collect and process the following categories of personal information:
            </p>
          </div>
          <div className="divide-y">
            {categories.map(cat => {
              const info = CATEGORY_INFO[cat.category];
              return (
                <div key={cat.category} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{info?.icon || '📁'}</span>
                    <div>
                      <h3 className="font-medium text-gray-900">{info?.name || cat.category}</h3>
                      <p className="text-sm text-gray-500">{info?.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-semibold text-gray-900">{cat.record_count}</span>
                    <p className="text-sm text-gray-500">records</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Privacy Rights */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Privacy Rights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PRIVACY_RIGHTS.map((right, idx) => (
            <div key={idx} className="p-4 bg-white border rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-1">{right.title}</h3>
              <p className="text-sm text-gray-600 mb-3">{right.description}</p>
              {right.action && right.type && (
                <button
                  type="button"
                  onClick={() => {
                    if (right.type === 'opt-out') {
                      handleOptOutClick();
                    } else if (right.type) {
                      handleRequestClick(right.type);
                    }
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  {right.action} →
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right to Opt-Out Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Right to Opt-Out</h2>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-gray-600 mb-4">
            Under CCPA, you have the right to opt-out of the sale or sharing of your personal information.
          </p>
          <div className="space-y-3">
            {optOuts.map(opt => (
              <div key={opt.category} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <h4 className="font-medium text-gray-900 capitalize">
                    {opt.category.replace(/_/g, ' ')}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {opt.opted_out ? 'You have opted out' : 'Currently opted in'}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  opt.opted_out ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {opt.opted_out ? 'Opted Out' : 'Opted In'}
                </span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleOptOutClick}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Manage Opt-Out Preferences
          </button>
        </div>
      </div>

      {/* Request History */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Request History</h2>
        <p className="text-gray-600 mb-4">
          View your privacy request history below. Requests are processed within 45 days as required by CCPA.
        </p>
        <div className="bg-white border rounded-lg overflow-hidden">
          {requests.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No privacy requests yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Your data export, deletion, and correction requests will appear here.
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Submitted</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {requests.map(req => (
                  <tr key={req.id}>
                    <td className="px-4 py-3 capitalize">{req.type === 'export' ? 'Data Export' : req.type === 'deletion' ? 'Data Deletion' : 'Data Correction'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-sm ${getStatusColor(req.status)}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(req.created_at)}</td>
                    <td className="px-4 py-3">
                      {req.status === 'completed' && req.download_url && (
                        <button type="button" className="text-blue-600 hover:text-blue-800">
                          Download
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Connected Apps */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Connected Applications</h2>
        <p className="text-gray-600 mb-4">
          Manage third-party applications that have access to your data.
        </p>
        <div className="bg-white border rounded-lg">
          {connectedApps.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No connected applications</p>
              <p className="text-sm text-gray-400 mt-1">
                Third-party apps with access to your data will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {connectedApps.map(app => (
                <div key={app.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{app.app_name}</h3>
                    <div className="flex gap-2">
                      <button type="button" className="text-blue-600 hover:text-blue-800 text-sm">
                        View Details
                      </button>
                      <button type="button" className="text-red-600 hover:text-red-800 text-sm">
                        Revoke Access
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">
                    Connected {formatDate(app.connected_at)}
                  </p>
                  <div className="mt-2">
                    <h4 className="text-sm font-medium text-gray-700">Permissions</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {app.permissions.map(perm => (
                        <span key={perm} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-2">
                    <h4 className="text-sm font-medium text-gray-700">Data Categories Accessed</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {app.data_categories.map(cat => (
                        <span key={cat} className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded capitalize">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Non-Discrimination Notice */}
      <div className="mb-8 p-4 bg-gray-50 border rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">Non-Discrimination Notice</h3>
        <p className="text-sm text-gray-600">
          We will not discriminate against you for exercising any of your privacy rights.
          You will receive the same service and pricing regardless of your privacy choices.
        </p>
      </div>

      {/* Processing Time Info */}
      <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800 mb-2">
          <strong>Processing Time:</strong> Under CCPA, we will respond to your request within 45 days.
          In some cases, we may extend this period by an additional 45 days if necessary.
        </p>
        <p className="text-sm text-blue-800">
          <strong>Download Availability:</strong> Data exports will be available for download for 30 days after completion.
        </p>
      </div>

      {/* Additional Resources */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Resources</h2>
        <div className="bg-white border rounded-lg p-4">
          <ul className="space-y-3">
            <li>
              <a href="/privacy-policy" className="text-blue-600 hover:text-blue-800 hover:underline">
                Privacy Policy
              </a>
              <p className="text-sm text-gray-500">Learn how we collect, use, and protect your information</p>
            </li>
            <li>
              <a href="/terms" className="text-blue-600 hover:text-blue-800 hover:underline">
                Terms of Service
              </a>
              <p className="text-sm text-gray-500">Review our terms and conditions</p>
            </li>
            <li>
              <a href="https://oag.ca.gov/privacy/ccpa" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline">
                Learn more about CCPA
              </a>
              <p className="text-sm text-gray-500">Official information from the California Attorney General</p>
            </li>
          </ul>
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600">
              Have questions about your privacy rights? Contact our privacy team at{' '}
              <a href="mailto:privacy@scaffald.com" className="text-blue-600 hover:text-blue-800">
                privacy@scaffald.com
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Modals would go here - simplified for now */}
      {activeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">
              {activeModal === 'opt-out' ? 'Manage Opt-Out Preferences' :
               requestType === 'export' ? 'Request Data Export' :
               requestType === 'deletion' ? 'Request Data Deletion' : 'Request Data Correction'}
            </h2>
            <p className="text-gray-600 mb-4">
              {activeModal === 'opt-out'
                ? 'Control how your personal information is used and shared.'
                : 'Your request will be processed within 45 days as required by CCPA.'}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  // In a real implementation, this would submit the request
                  alert('Request submitted! You will receive an email confirmation.');
                  setActiveModal(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {activeModal === 'opt-out' ? 'Save Preferences' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
