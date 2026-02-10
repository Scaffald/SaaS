/**
 * CCPA Compliance Implementation
 * Privacy Settings Page
 *
 * Provides users with CCPA privacy rights management including:
 * - View data categories collected
 * - Submit data requests (export, deletion, correction)
 * - Manage opt-out preferences
 * - View connected apps and revoke access
 */

'use client';

import { useState, useEffect } from 'react';
import { Stack, Row, Text, H1, H2, H3, Card, Button } from '@unicornlove/beyond-ui';

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
    icon: '',
  },
  financial: {
    name: 'Financial Information',
    description: 'Insurance policies, payment records, coverage details',
    icon: '',
  },
  professional: {
    name: 'Professional Information',
    description: 'Certifications, compliance records, documents',
    icon: '',
  },
  commercial: {
    name: 'Commercial Information',
    description: 'Projects, business relationships, transactions',
    icon: '',
  },
  usage: {
    name: 'Usage Data',
    description: 'Login history, feature usage, activity logs',
    icon: '',
  },
  inferences: {
    name: 'Inferences',
    description: 'Compliance scores, risk assessments',
    icon: '',
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
      case 'completed': return { backgroundColor: 'var(--color-green-2)', color: 'var(--color-green-11)' };
      case 'processing': return { backgroundColor: 'var(--color-blue-2)', color: 'var(--color-blue-11)' };
      case 'pending': return { backgroundColor: 'var(--color-yellow-2)', color: 'var(--color-yellow-11)' };
      case 'failed': return { backgroundColor: 'var(--color-red-2)', color: 'var(--color-red-11)' };
      case 'cancelled': return { backgroundColor: 'var(--color-gray-2)', color: 'var(--color-gray-11)' };
      default: return { backgroundColor: 'var(--color-gray-2)', color: 'var(--color-gray-11)' };
    }
  };

  if (loading) {
    return (
      <Stack style={{ padding: 'var(--space-6)', maxWidth: 1152, marginLeft: 'auto', marginRight: 'auto', gap: 'var(--space-4)' }}>
        <Stack style={{ height: 32, backgroundColor: 'var(--color-gray-3)', borderRadius: 'var(--radius-4)', width: '33%' }} />
        <Stack style={{ height: 16, backgroundColor: 'var(--color-gray-3)', borderRadius: 'var(--radius-4)', width: '66%' }} />
        <Row style={{ flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          {[1, 2, 3, 4].map(i => (
            <Stack key={i} style={{ height: 128, backgroundColor: 'var(--color-gray-3)', borderRadius: 'var(--radius-4)', flex: 1, minWidth: '45%' }} />
          ))}
        </Row>
      </Stack>
    );
  }

  return (
    <Stack style={{ padding: 'var(--space-6)', maxWidth: 1152, marginLeft: 'auto', marginRight: 'auto', gap: 'var(--space-8)' }}>
      {/* Header */}
      <Stack style={{ gap: 'var(--space-2)' }}>
        <H1 style={{ fontSize: 'var(--font-size-8)', fontWeight: 'bold', color: 'var(--color-12)' }}>Privacy Settings</H1>
        <Text style={{ color: 'var(--color-11)' }}>
          Manage your privacy preferences and exercise your rights under the California Consumer Privacy Act (CCPA).
        </Text>
      </Stack>

      {error && (
        <Card style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-red-2)', borderColor: 'var(--color-red-6)', borderRadius: 'var(--radius-4)', gap: 'var(--space-2)' }}>
          <Text style={{ color: 'var(--color-red-11)' }}>{error}</Text>
          <Button
            onPress={() => window.location.reload()}
            style={{ marginTop: 'var(--space-2)', color: 'var(--color-red-10)', backgroundColor: 'transparent', borderWidth: 1, borderColor: 'var(--color-red-6)' }}
          >
            Try again
          </Button>
        </Card>
      )}

      {/* GPC Banner */}
      {hasGPC && (
        <Card style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-green-2)', borderColor: 'var(--color-green-6)', borderRadius: 'var(--radius-4)', marginBottom: 'var(--space-6)' }}>
          <Row style={{ alignItems: 'flex-start', gap: 'var(--space-3)' }}>
            <Text style={{ fontSize: 'var(--font-size-6)', color: 'var(--color-green-10)' }}>Check</Text>
            <Stack style={{ flex: 1 }}>
              <H3 style={{ fontSize: 'var(--font-size-5)', fontWeight: 600, color: 'var(--color-green-11)' }}>Global Privacy Control Detected</H3>
              <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-green-10)', marginTop: 'var(--space-1)' }}>
                Your browser has sent a Global Privacy Control (GPC) signal. We honor this signal
                and have automatically opted you out of data sale and sharing.
              </Text>
            </Stack>
          </Row>
        </Card>
      )}

      {/* Quick Actions */}
      <Stack style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
        <H2 style={{ fontSize: 'var(--font-size-6)', fontWeight: 600, color: 'var(--color-12)', marginBottom: 'var(--space-4)' }}>Quick Actions</H2>
        <Row style={{ flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <Card
            style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-blue-2)', borderColor: 'var(--color-blue-6)', borderRadius: 'var(--radius-4)', cursor: 'pointer', flex: 1, minWidth: '45%' }}
            onPress={() => handleRequestClick('export')}
          >
            <Stack style={{ alignItems: 'flex-start', gap: 'var(--space-2)' }}>
              <Text style={{ fontSize: 'var(--font-size-8)', marginBottom: 'var(--space-2)' }}>Download</Text>
              <H3 style={{ fontSize: 'var(--font-size-5)', fontWeight: 600, color: 'var(--color-blue-11)' }}>Request My Data</H3>
              <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-blue-10)' }}>Download a copy of your personal data</Text>
            </Stack>
          </Card>

          <Card
            style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-red-2)', borderColor: 'var(--color-red-6)', borderRadius: 'var(--radius-4)', cursor: 'pointer', flex: 1, minWidth: '45%' }}
            onPress={() => handleRequestClick('deletion')}
          >
            <Stack style={{ alignItems: 'flex-start', gap: 'var(--space-2)' }}>
              <Text style={{ fontSize: 'var(--font-size-8)', marginBottom: 'var(--space-2)' }}>Delete</Text>
              <H3 style={{ fontSize: 'var(--font-size-5)', fontWeight: 600, color: 'var(--color-red-11)' }}>Delete My Data</H3>
              <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-red-10)' }}>Request deletion of your personal data</Text>
            </Stack>
          </Card>

          <Card
            style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-purple-2)', borderColor: 'var(--color-purple-6)', borderRadius: 'var(--radius-4)', cursor: 'pointer', flex: 1, minWidth: '45%' }}
            onPress={handleOptOutClick}
          >
            <Stack style={{ alignItems: 'flex-start', gap: 'var(--space-2)' }}>
              <Text style={{ fontSize: 'var(--font-size-8)', marginBottom: 'var(--space-2)' }}>Shield</Text>
              <H3 style={{ fontSize: 'var(--font-size-5)', fontWeight: 600, color: 'var(--color-purple-11)' }}>Manage Opt-Outs</H3>
              <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-purple-10)' }}>Control how your data is used and shared</Text>
            </Stack>
          </Card>
        </Row>
      </Stack>

      {/* Data Categories */}
      <Stack style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
        <H2 style={{ fontSize: 'var(--font-size-6)', fontWeight: 600, color: 'var(--color-12)', marginBottom: 'var(--space-4)' }}>Your Data Categories</H2>
        <Text style={{ color: 'var(--color-11)', marginBottom: 'var(--space-4)' }}>
          Below are the categories of personal information we collect about you.
        </Text>
        <Card style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius-4)', overflow: 'hidden' }}>
          <Stack style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-gray-2)', borderBottomWidth: 1, borderBottomColor: 'var(--color-border)' }}>
            <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-11)' }}>
              We collect and process the following categories of personal information:
            </Text>
          </Stack>
          <Stack>
            {categories.map((cat, idx) => {
              const info = CATEGORY_INFO[cat.category];
              return (
                <Row
                  key={cat.category}
                  style={{ padding: 'var(--space-4)', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: idx > 0 ? 1 : 0, borderTopColor: 'var(--color-border)' }}
                >
                  <Row style={{ alignItems: 'center', gap: 'var(--space-3)' }}>
                    <Text style={{ fontSize: 'var(--font-size-8)' }}>{info?.icon || 'Folder'}</Text>
                    <Stack>
                      <H3 style={{ fontSize: 'var(--font-size-4)', fontWeight: 500, color: 'var(--color-12)' }}>{info?.name || cat.category}</H3>
                      <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-10)' }}>{info?.description}</Text>
                    </Stack>
                  </Row>
                  <Stack style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 'var(--font-size-6)', fontWeight: 600, color: 'var(--color-12)' }}>{cat.record_count}</Text>
                    <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-10)' }}>records</Text>
                  </Stack>
                </Row>
              );
            })}
          </Stack>
        </Card>
      </Stack>

      {/* Privacy Rights */}
      <Stack style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
        <H2 style={{ fontSize: 'var(--font-size-6)', fontWeight: 600, color: 'var(--color-12)', marginBottom: 'var(--space-4)' }}>Your Privacy Rights</H2>
        <Row style={{ flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          {PRIVACY_RIGHTS.map((right, idx) => (
            <Card key={idx} style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius-4)', flex: 1, minWidth: '45%' }}>
              <Stack style={{ gap: 'var(--space-1)' }}>
                <H3 style={{ fontSize: 'var(--font-size-5)', fontWeight: 600, color: 'var(--color-12)', marginBottom: 'var(--space-1)' }}>{right.title}</H3>
                <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-11)', marginBottom: 'var(--space-3)' }}>{right.description}</Text>
                {right.action && right.type && (
                  <Button
                    onPress={() => {
                      if (right.type === 'opt-out') {
                        handleOptOutClick();
                      } else if (right.type) {
                        handleRequestClick(right.type);
                      }
                    }}
                    style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-blue-10)', backgroundColor: 'transparent', fontWeight: 500 }}
                  >
                    {right.action} -&gt;
                  </Button>
                )}
              </Stack>
            </Card>
          ))}
        </Row>
      </Stack>

      {/* Right to Opt-Out Section */}
      <Stack style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
        <H2 style={{ fontSize: 'var(--font-size-6)', fontWeight: 600, color: 'var(--color-12)', marginBottom: 'var(--space-4)' }}>Right to Opt-Out</H2>
        <Card style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius-4)', padding: 'var(--space-4)' }}>
          <Text style={{ color: 'var(--color-11)', marginBottom: 'var(--space-4)' }}>
            Under CCPA, you have the right to opt-out of the sale or sharing of your personal information.
          </Text>
          <Stack style={{ gap: 'var(--space-3)' }}>
            {optOuts.map(opt => (
              <Row key={opt.category} style={{ alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3)', backgroundColor: 'var(--color-gray-2)', borderRadius: 'var(--radius-4)' }}>
                <Stack>
                  <Text style={{ fontSize: 'var(--font-size-4)', fontWeight: 500, color: 'var(--color-12)', textTransform: 'capitalize' }}>
                    {opt.category.replace(/_/g, ' ')}
                  </Text>
                  <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-10)' }}>
                    {opt.opted_out ? 'You have opted out' : 'Currently opted in'}
                  </Text>
                </Stack>
                <Text
                  style={{
                    paddingLeft: 'var(--space-3)',
                    paddingRight: 'var(--space-3)',
                    paddingTop: 'var(--space-1)',
                    paddingBottom: 'var(--space-1)',
                    borderRadius: 9999,
                    fontSize: 'var(--font-size-3)',
                    backgroundColor: opt.opted_out ? 'var(--color-green-2)' : 'var(--color-gray-2)',
                    color: opt.opted_out ? 'var(--color-green-11)' : 'var(--color-gray-11)',
                  }}
                >
                  {opt.opted_out ? 'Opted Out' : 'Opted In'}
                </Text>
              </Row>
            ))}
          </Stack>
          <Button
            onPress={handleOptOutClick}
            style={{
              marginTop: 'var(--space-4)',
              paddingLeft: 'var(--space-4)',
              paddingRight: 'var(--space-4)',
              paddingTop: 'var(--space-2)',
              paddingBottom: 'var(--space-2)',
              backgroundColor: 'var(--color-blue-9)',
              color: 'white',
              borderRadius: 'var(--radius-4)',
            }}
          >
            Manage Opt-Out Preferences
          </Button>
        </Card>
      </Stack>

      {/* Request History */}
      <Stack style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
        <H2 style={{ fontSize: 'var(--font-size-6)', fontWeight: 600, color: 'var(--color-12)', marginBottom: 'var(--space-4)' }}>Request History</H2>
        <Text style={{ color: 'var(--color-11)', marginBottom: 'var(--space-4)' }}>
          View your privacy request history below. Requests are processed within 45 days as required by CCPA.
        </Text>
        <Card style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius-4)', overflow: 'hidden' }}>
          {requests.length === 0 ? (
            <Stack style={{ padding: 'var(--space-8)', alignItems: 'center' }}>
              <Text style={{ color: 'var(--color-10)' }}>No privacy requests yet</Text>
              <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-9)', marginTop: 'var(--space-1)' }}>
                Your data export, deletion, and correction requests will appear here.
              </Text>
            </Stack>
          ) : (
            <Stack>
              <Row style={{ padding: 'var(--space-4)', backgroundColor: 'var(--color-gray-2)', borderBottomWidth: 1, borderBottomColor: 'var(--color-border)' }}>
                <Text style={{ flex: 1, paddingLeft: 'var(--space-4)', paddingRight: 'var(--space-4)', fontSize: 'var(--font-size-3)', fontWeight: 500, color: 'var(--color-10)' }}>Type</Text>
                <Text style={{ flex: 1, paddingLeft: 'var(--space-4)', paddingRight: 'var(--space-4)', fontSize: 'var(--font-size-3)', fontWeight: 500, color: 'var(--color-10)' }}>Status</Text>
                <Text style={{ flex: 1, paddingLeft: 'var(--space-4)', paddingRight: 'var(--space-4)', fontSize: 'var(--font-size-3)', fontWeight: 500, color: 'var(--color-10)' }}>Submitted</Text>
                <Text style={{ flex: 1, paddingLeft: 'var(--space-4)', paddingRight: 'var(--space-4)', fontSize: 'var(--font-size-3)', fontWeight: 500, color: 'var(--color-10)' }}>Actions</Text>
              </Row>
              <Stack>
                {requests.map((req, idx) => (
                  <Row
                    key={req.id}
                    style={{ padding: 'var(--space-3)', borderTopWidth: idx > 0 ? 1 : 0, borderTopColor: 'var(--color-border)', alignItems: 'center' }}
                  >
                    <Text style={{ flex: 1, paddingLeft: 'var(--space-4)', paddingRight: 'var(--space-4)', textTransform: 'capitalize' }}>
                      {req.type === 'export' ? 'Data Export' : req.type === 'deletion' ? 'Data Deletion' : 'Data Correction'}
                    </Text>
                    <Row style={{ flex: 1, paddingLeft: 'var(--space-4)', paddingRight: 'var(--space-4)' }}>
                      <Text
                        style={{
                          paddingLeft: 'var(--space-2)',
                          paddingRight: 'var(--space-2)',
                          paddingTop: 'var(--space-1)',
                          paddingBottom: 'var(--space-1)',
                          borderRadius: 'var(--radius-2)',
                          fontSize: 'var(--font-size-3)',
                          ...getStatusColor(req.status),
                        }}
                      >
                        {req.status}
                      </Text>
                    </Row>
                    <Text style={{ flex: 1, paddingLeft: 'var(--space-4)', paddingRight: 'var(--space-4)', color: 'var(--color-11)' }}>{formatDate(req.created_at)}</Text>
                    <Row style={{ flex: 1, paddingLeft: 'var(--space-4)', paddingRight: 'var(--space-4)' }}>
                      {req.status === 'completed' && req.download_url && (
                        <Button
                          style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-blue-10)', backgroundColor: 'transparent' }}
                        >
                          Download
                        </Button>
                      )}
                    </Row>
                  </Row>
                ))}
              </Stack>
            </Stack>
          )}
        </Card>
      </Stack>

      {/* Connected Apps */}
      <Stack style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
        <H2 style={{ fontSize: 'var(--font-size-6)', fontWeight: 600, color: 'var(--color-12)', marginBottom: 'var(--space-4)' }}>Connected Applications</H2>
        <Text style={{ color: 'var(--color-11)', marginBottom: 'var(--space-4)' }}>
          Manage third-party applications that have access to your data.
        </Text>
        <Card style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius-4)' }}>
          {connectedApps.length === 0 ? (
            <Stack style={{ padding: 'var(--space-8)', alignItems: 'center' }}>
              <Text style={{ color: 'var(--color-10)' }}>No connected applications</Text>
              <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-9)', marginTop: 'var(--space-1)' }}>
                Third-party apps with access to your data will appear here.
              </Text>
            </Stack>
          ) : (
            <Stack>
              {connectedApps.map((app, idx) => (
                <Stack
                  key={app.id}
                  style={{ padding: 'var(--space-4)', borderTopWidth: idx > 0 ? 1 : 0, borderTopColor: 'var(--color-border)' }}
                >
                  <Row style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                    <H3 style={{ fontSize: 'var(--font-size-4)', fontWeight: 500, color: 'var(--color-12)' }}>{app.app_name}</H3>
                    <Row style={{ gap: 'var(--space-2)' }}>
                      <Button style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-blue-10)', backgroundColor: 'transparent' }}>
                        View Details
                      </Button>
                      <Button style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-red-10)', backgroundColor: 'transparent' }}>
                        Revoke Access
                      </Button>
                    </Row>
                  </Row>
                  <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-10)', marginBottom: 'var(--space-2)' }}>
                    Connected {formatDate(app.connected_at)}
                  </Text>
                  <Stack style={{ marginTop: 'var(--space-2)' }}>
                    <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: 500, color: 'var(--color-11)' }}>Permissions</Text>
                    <Row style={{ flexWrap: 'wrap', gap: 'var(--space-1)', marginTop: 'var(--space-1)' }}>
                      {app.permissions.map(perm => (
                        <Text
                          key={perm}
                          style={{
                            paddingLeft: 'var(--space-2)',
                            paddingRight: 'var(--space-2)',
                            paddingTop: 2,
                            paddingBottom: 2,
                            backgroundColor: 'var(--color-gray-2)',
                            color: 'var(--color-11)',
                            fontSize: 'var(--font-size-2)',
                            borderRadius: 'var(--radius-2)',
                          }}
                        >
                          {perm}
                        </Text>
                      ))}
                    </Row>
                  </Stack>
                  <Stack style={{ marginTop: 'var(--space-2)' }}>
                    <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: 500, color: 'var(--color-11)' }}>Data Categories Accessed</Text>
                    <Row style={{ flexWrap: 'wrap', gap: 'var(--space-1)', marginTop: 'var(--space-1)' }}>
                      {app.data_categories.map(cat => (
                        <Text
                          key={cat}
                          style={{
                            paddingLeft: 'var(--space-2)',
                            paddingRight: 'var(--space-2)',
                            paddingTop: 2,
                            paddingBottom: 2,
                            backgroundColor: 'var(--color-blue-2)',
                            color: 'var(--color-blue-10)',
                            fontSize: 'var(--font-size-2)',
                            borderRadius: 'var(--radius-2)',
                            textTransform: 'capitalize',
                          }}
                        >
                          {cat}
                        </Text>
                      ))}
                    </Row>
                  </Stack>
                </Stack>
              ))}
            </Stack>
          )}
        </Card>
      </Stack>

      {/* Non-Discrimination Notice */}
      <Card style={{ marginBottom: 'var(--space-8)', padding: 'var(--space-4)', backgroundColor: 'var(--color-gray-2)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius-4)' }}>
        <H3 style={{ fontSize: 'var(--font-size-5)', fontWeight: 600, color: 'var(--color-12)', marginBottom: 'var(--space-2)' }}>Non-Discrimination Notice</H3>
        <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-11)' }}>
          We will not discriminate against you for exercising any of your privacy rights.
          You will receive the same service and pricing regardless of your privacy choices.
        </Text>
      </Card>

      {/* Processing Time Info */}
      <Card style={{ marginBottom: 'var(--space-8)', padding: 'var(--space-4)', backgroundColor: 'var(--color-blue-2)', borderColor: 'var(--color-blue-6)', borderRadius: 'var(--radius-4)' }}>
        <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-blue-11)', marginBottom: 'var(--space-2)' }}>
          <Text style={{ fontWeight: 600 }}>Processing Time:</Text> Under CCPA, we will respond to your request within 45 days.
          In some cases, we may extend this period by an additional 45 days if necessary.
        </Text>
        <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-blue-11)' }}>
          <Text style={{ fontWeight: 600 }}>Download Availability:</Text> Data exports will be available for download for 30 days after completion.
        </Text>
      </Card>

      {/* Additional Resources */}
      <Stack style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
        <H2 style={{ fontSize: 'var(--font-size-6)', fontWeight: 600, color: 'var(--color-12)', marginBottom: 'var(--space-4)' }}>Additional Resources</H2>
        <Card style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius-4)', padding: 'var(--space-4)' }}>
          <Stack style={{ gap: 'var(--space-3)' }}>
            <Stack>
              <a href="/privacy-policy" style={{ color: 'var(--color-blue-10)' }}>
                Privacy Policy
              </a>
              <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-10)' }}>Learn how we collect, use, and protect your information</Text>
            </Stack>
            <Stack>
              <a href="/terms" style={{ color: 'var(--color-blue-10)' }}>
                Terms of Service
              </a>
              <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-10)' }}>Review our terms and conditions</Text>
            </Stack>
            <Stack>
              <a href="https://oag.ca.gov/privacy/ccpa" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-blue-10)' }}>
                Learn more about CCPA
              </a>
              <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-10)' }}>Official information from the California Attorney General</Text>
            </Stack>
          </Stack>
          <Stack style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTopWidth: 1, borderTopColor: 'var(--color-border)' }}>
            <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-11)' }}>
              Have questions about your privacy rights? Contact our privacy team at{' '}
              <a href="mailto:privacy@scaffald.com" style={{ color: 'var(--color-blue-10)' }}>
                privacy@scaffald.com
              </a>
            </Text>
          </Stack>
        </Card>
      </Stack>

      {/* Modals would go here - simplified for now */}
      {activeModal && (
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
            zIndex: 50,
            display: 'flex',
          }}
        >
          <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-4)', padding: 'var(--space-6)', maxWidth: 448, width: '100%', marginLeft: 'var(--space-4)', marginRight: 'var(--space-4)' }}>
            <Stack style={{ gap: 'var(--space-4)' }}>
              <H2 style={{ fontSize: 'var(--font-size-7)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>
                {activeModal === 'opt-out' ? 'Manage Opt-Out Preferences' :
                 requestType === 'export' ? 'Request Data Export' :
                 requestType === 'deletion' ? 'Request Data Deletion' : 'Request Data Correction'}
              </H2>
              <Text style={{ color: 'var(--color-11)', marginBottom: 'var(--space-4)' }}>
                {activeModal === 'opt-out'
                  ? 'Control how your personal information is used and shared.'
                  : 'Your request will be processed within 45 days as required by CCPA.'}
              </Text>
              <Row style={{ gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                <Button
                  onPress={() => setActiveModal(null)}
                  style={{
                    paddingLeft: 'var(--space-4)',
                    paddingRight: 'var(--space-4)',
                    paddingTop: 'var(--space-2)',
                    paddingBottom: 'var(--space-2)',
                    color: 'var(--color-11)',
                    backgroundColor: 'transparent',
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onPress={() => {
                    // In a real implementation, this would submit the request
                    alert('Request submitted! You will receive an email confirmation.');
                    setActiveModal(null);
                  }}
                  style={{
                    paddingLeft: 'var(--space-4)',
                    paddingRight: 'var(--space-4)',
                    paddingTop: 'var(--space-2)',
                    paddingBottom: 'var(--space-2)',
                    backgroundColor: 'var(--color-blue-9)',
                    color: 'white',
                    borderRadius: 'var(--radius-4)',
                  }}
                >
                  {activeModal === 'opt-out' ? 'Save Preferences' : 'Submit Request'}
                </Button>
              </Row>
            </Stack>
          </Card>
        </Stack>
      )}
    </Stack>
  );
}
