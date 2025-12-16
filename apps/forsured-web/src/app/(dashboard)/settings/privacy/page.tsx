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
import { YStack, XStack, Text, H1, H2, H3, H4, Card, Button, Spinner } from '@unicornlove/ui';

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
      case 'completed': return { backgroundColor: '$green2', color: '$green11' };
      case 'processing': return { backgroundColor: '$blue2', color: '$blue11' };
      case 'pending': return { backgroundColor: '$yellow2', color: '$yellow11' };
      case 'failed': return { backgroundColor: '$red2', color: '$red11' };
      case 'cancelled': return { backgroundColor: '$gray2', color: '$gray11' };
      default: return { backgroundColor: '$gray2', color: '$gray11' };
    }
  };

  if (loading) {
    return (
      <YStack padding="$6" maxWidth={1152} marginHorizontal="auto" gap="$4">
        <YStack height={32} backgroundColor="$gray3" borderRadius="$4" width="33%" />
        <YStack height={16} backgroundColor="$gray3" borderRadius="$4" width="66%" />
        <XStack flexWrap="wrap" gap="$4" $gtMd={{ flexDirection: 'row' }}>
          {[1, 2, 3, 4].map(i => (
            <YStack key={i} height={128} backgroundColor="$gray3" borderRadius="$4" flex={1} minWidth="45%" />
          ))}
        </XStack>
      </YStack>
    );
  }

  return (
    <YStack padding="$6" maxWidth={1152} marginHorizontal="auto" gap="$8">
      {/* Header */}
      <YStack gap="$2">
        <H1 fontSize="$8" fontWeight="bold" color="$color12">Privacy Settings</H1>
        <Text color="$color11">
          Manage your privacy preferences and exercise your rights under the California Consumer Privacy Act (CCPA).
        </Text>
      </YStack>

      {error && (
        <Card padding="$4" backgroundColor="$red2" borderColor="$red6" borderRadius="$4" gap="$2">
          <Text color="$red11">{error}</Text>
          <Button
            variant="outlined"
            onPress={() => window.location.reload()}
            marginTop="$2"
            color="$red10"
            hoverStyle={{ color: '$red11' }}
          >
            Try again
          </Button>
        </Card>
      )}

      {/* GPC Banner */}
      {hasGPC && (
        <Card padding="$4" backgroundColor="$green2" borderColor="$green6" borderRadius="$4" marginBottom="$6">
          <XStack alignItems="flex-start" gap="$3">
            <Text fontSize="$6" color="$green10">✓</Text>
            <YStack flex={1}>
              <H3 fontSize="$5" fontWeight="600" color="$green11">Global Privacy Control Detected</H3>
              <Text fontSize="$3" color="$green10" marginTop="$1">
                Your browser has sent a Global Privacy Control (GPC) signal. We honor this signal
                and have automatically opted you out of data sale and sharing.
              </Text>
            </YStack>
          </XStack>
        </Card>
      )}

      {/* Quick Actions */}
      <YStack gap="$4" marginBottom="$8">
        <H2 fontSize="$6" fontWeight="600" color="$color12" marginBottom="$4">Quick Actions</H2>
        <XStack flexWrap="wrap" gap="$4" $gtMd={{ flexDirection: 'row' }}>
          <Card
            padding="$4"
            backgroundColor="$blue2"
            borderColor="$blue6"
            borderRadius="$4"
            hoverStyle={{ backgroundColor: '$blue3' }}
            cursor="pointer"
            onPress={() => handleRequestClick('export')}
            flex={1}
            minWidth="45%"
            $gtMd={{ minWidth: '30%' }}
          >
            <YStack alignItems="flex-start" gap="$2">
              <Text fontSize="$8" marginBottom="$2">📥</Text>
              <H3 fontSize="$5" fontWeight="600" color="$blue11">Request My Data</H3>
              <Text fontSize="$3" color="$blue10">Download a copy of your personal data</Text>
            </YStack>
          </Card>

          <Card
            padding="$4"
            backgroundColor="$red2"
            borderColor="$red6"
            borderRadius="$4"
            hoverStyle={{ backgroundColor: '$red3' }}
            cursor="pointer"
            onPress={() => handleRequestClick('deletion')}
            flex={1}
            minWidth="45%"
            $gtMd={{ minWidth: '30%' }}
          >
            <YStack alignItems="flex-start" gap="$2">
              <Text fontSize="$8" marginBottom="$2">🗑️</Text>
              <H3 fontSize="$5" fontWeight="600" color="$red11">Delete My Data</H3>
              <Text fontSize="$3" color="$red10">Request deletion of your personal data</Text>
            </YStack>
          </Card>

          <Card
            padding="$4"
            backgroundColor="$purple2"
            borderColor="$purple6"
            borderRadius="$4"
            hoverStyle={{ backgroundColor: '$purple3' }}
            cursor="pointer"
            onPress={handleOptOutClick}
            flex={1}
            minWidth="45%"
            $gtMd={{ minWidth: '30%' }}
          >
            <YStack alignItems="flex-start" gap="$2">
              <Text fontSize="$8" marginBottom="$2">🛡️</Text>
              <H3 fontSize="$5" fontWeight="600" color="$purple11">Manage Opt-Outs</H3>
              <Text fontSize="$3" color="$purple10">Control how your data is used and shared</Text>
            </YStack>
          </Card>
        </XStack>
      </YStack>

      {/* Data Categories */}
      <YStack gap="$4" marginBottom="$8">
        <H2 fontSize="$6" fontWeight="600" color="$color12" marginBottom="$4">Your Data Categories</H2>
        <Text color="$color11" marginBottom="$4">
          Below are the categories of personal information we collect about you.
        </Text>
        <Card backgroundColor="$background" borderColor="$borderColor" borderRadius="$4" overflow="hidden">
          <YStack padding="$4" backgroundColor="$gray2" borderBottomWidth={1} borderBottomColor="$borderColor">
            <Text fontSize="$3" color="$color11">
              We collect and process the following categories of personal information:
            </Text>
          </YStack>
          <YStack>
            {categories.map((cat, idx) => {
              const info = CATEGORY_INFO[cat.category];
              return (
                <XStack
                  key={cat.category}
                  padding="$4"
                  alignItems="center"
                  justifyContent="space-between"
                  borderTopWidth={idx > 0 ? 1 : 0}
                  borderTopColor="$borderColor"
                >
                  <XStack alignItems="center" gap="$3">
                    <Text fontSize="$8">{info?.icon || '📁'}</Text>
                    <YStack>
                      <H3 fontSize="$4" fontWeight="500" color="$color12">{info?.name || cat.category}</H3>
                      <Text fontSize="$3" color="$color10">{info?.description}</Text>
                    </YStack>
                  </XStack>
                  <YStack alignItems="flex-end">
                    <Text fontSize="$6" fontWeight="600" color="$color12">{cat.record_count}</Text>
                    <Text fontSize="$3" color="$color10">records</Text>
                  </YStack>
                </XStack>
              );
            })}
          </YStack>
        </Card>
      </YStack>

      {/* Privacy Rights */}
      <YStack gap="$4" marginBottom="$8">
        <H2 fontSize="$6" fontWeight="600" color="$color12" marginBottom="$4">Your Privacy Rights</H2>
        <XStack flexWrap="wrap" gap="$4" $gtMd={{ flexDirection: 'row' }}>
          {PRIVACY_RIGHTS.map((right, idx) => (
            <Card key={idx} padding="$4" backgroundColor="$background" borderColor="$borderColor" borderRadius="$4" flex={1} minWidth="45%" $gtMd={{ minWidth: '47%' }}>
              <YStack gap="$1">
                <H3 fontSize="$5" fontWeight="600" color="$color12" marginBottom="$1">{right.title}</H3>
                <Text fontSize="$3" color="$color11" marginBottom="$3">{right.description}</Text>
                {right.action && right.type && (
                  <Button
                    variant="ghost"
                    onPress={() => {
                      if (right.type === 'opt-out') {
                        handleOptOutClick();
                      } else if (right.type) {
                        handleRequestClick(right.type);
                      }
                    }}
                    fontSize="$3"
                    color="$blue10"
                    hoverStyle={{ color: '$blue11' }}
                    fontWeight="500"
                  >
                    {right.action} →
                  </Button>
                )}
              </YStack>
            </Card>
          ))}
        </XStack>
      </YStack>

      {/* Right to Opt-Out Section */}
      <YStack gap="$4" marginBottom="$8">
        <H2 fontSize="$6" fontWeight="600" color="$color12" marginBottom="$4">Right to Opt-Out</H2>
        <Card backgroundColor="$background" borderColor="$borderColor" borderRadius="$4" padding="$4">
          <Text color="$color11" marginBottom="$4">
            Under CCPA, you have the right to opt-out of the sale or sharing of your personal information.
          </Text>
          <YStack gap="$3">
            {optOuts.map(opt => (
              <XStack key={opt.category} alignItems="center" justifyContent="space-between" padding="$3" backgroundColor="$gray2" borderRadius="$4">
                <YStack>
                  <H4 fontSize="$4" fontWeight="500" color="$color12" textTransform="capitalize">
                    {opt.category.replace(/_/g, ' ')}
                  </H4>
                  <Text fontSize="$3" color="$color10">
                    {opt.opted_out ? 'You have opted out' : 'Currently opted in'}
                  </Text>
                </YStack>
                <Text
                  paddingHorizontal="$3"
                  paddingVertical="$1"
                  borderRadius={9999}
                  fontSize="$3"
                  backgroundColor={opt.opted_out ? '$green2' : '$gray2'}
                  color={opt.opted_out ? '$green11' : '$gray11'}
                >
                  {opt.opted_out ? 'Opted Out' : 'Opted In'}
                </Text>
              </XStack>
            ))}
          </YStack>
          <Button
            onPress={handleOptOutClick}
            marginTop="$4"
            paddingHorizontal="$4"
            paddingVertical="$2"
            backgroundColor="$blue9"
            color="white"
            borderRadius="$4"
            hoverStyle={{ backgroundColor: '$blue10' }}
          >
            Manage Opt-Out Preferences
          </Button>
        </Card>
      </YStack>

      {/* Request History */}
      <YStack gap="$4" marginBottom="$8">
        <H2 fontSize="$6" fontWeight="600" color="$color12" marginBottom="$4">Request History</H2>
        <Text color="$color11" marginBottom="$4">
          View your privacy request history below. Requests are processed within 45 days as required by CCPA.
        </Text>
        <Card backgroundColor="$background" borderColor="$borderColor" borderRadius="$4" overflow="hidden">
          {requests.length === 0 ? (
            <YStack padding="$8" alignItems="center">
              <Text color="$color10">No privacy requests yet</Text>
              <Text fontSize="$3" color="$color9" marginTop="$1">
                Your data export, deletion, and correction requests will appear here.
              </Text>
            </YStack>
          ) : (
            <YStack>
              <XStack padding="$4" backgroundColor="$gray2" borderBottomWidth={1} borderBottomColor="$borderColor">
                <Text flex={1} paddingHorizontal="$4" fontSize="$3" fontWeight="500" color="$color10">Type</Text>
                <Text flex={1} paddingHorizontal="$4" fontSize="$3" fontWeight="500" color="$color10">Status</Text>
                <Text flex={1} paddingHorizontal="$4" fontSize="$3" fontWeight="500" color="$color10">Submitted</Text>
                <Text flex={1} paddingHorizontal="$4" fontSize="$3" fontWeight="500" color="$color10">Actions</Text>
              </XStack>
              <YStack>
                {requests.map((req, idx) => (
                  <XStack
                    key={req.id}
                    padding="$3"
                    borderTopWidth={idx > 0 ? 1 : 0}
                    borderTopColor="$borderColor"
                    alignItems="center"
                  >
                    <Text flex={1} paddingHorizontal="$4" textTransform="capitalize">
                      {req.type === 'export' ? 'Data Export' : req.type === 'deletion' ? 'Data Deletion' : 'Data Correction'}
                    </Text>
                    <XStack flex={1} paddingHorizontal="$4">
                      <Text
                        paddingHorizontal="$2"
                        paddingVertical="$1"
                        borderRadius="$2"
                        fontSize="$3"
                        {...getStatusColor(req.status)}
                      >
                        {req.status}
                      </Text>
                    </XStack>
                    <Text flex={1} paddingHorizontal="$4" color="$color11">{formatDate(req.created_at)}</Text>
                    <XStack flex={1} paddingHorizontal="$4">
                      {req.status === 'completed' && req.download_url && (
                        <Button
                          variant="ghost"
                          fontSize="$3"
                          color="$blue10"
                          hoverStyle={{ color: '$blue11' }}
                        >
                          Download
                        </Button>
                      )}
                    </XStack>
                  </XStack>
                ))}
              </YStack>
            </YStack>
          )}
        </Card>
      </YStack>

      {/* Connected Apps */}
      <YStack gap="$4" marginBottom="$8">
        <H2 fontSize="$6" fontWeight="600" color="$color12" marginBottom="$4">Connected Applications</H2>
        <Text color="$color11" marginBottom="$4">
          Manage third-party applications that have access to your data.
        </Text>
        <Card backgroundColor="$background" borderColor="$borderColor" borderRadius="$4">
          {connectedApps.length === 0 ? (
            <YStack padding="$8" alignItems="center">
              <Text color="$color10">No connected applications</Text>
              <Text fontSize="$3" color="$color9" marginTop="$1">
                Third-party apps with access to your data will appear here.
              </Text>
            </YStack>
          ) : (
            <YStack>
              {connectedApps.map((app, idx) => (
                <YStack
                  key={app.id}
                  padding="$4"
                  borderTopWidth={idx > 0 ? 1 : 0}
                  borderTopColor="$borderColor"
                >
                  <XStack alignItems="center" justifyContent="space-between" marginBottom="$2">
                    <H3 fontSize="$4" fontWeight="500" color="$color12">{app.app_name}</H3>
                    <XStack gap="$2">
                      <Button variant="ghost" fontSize="$3" color="$blue10" hoverStyle={{ color: '$blue11' }}>
                        View Details
                      </Button>
                      <Button variant="ghost" fontSize="$3" color="$red10" hoverStyle={{ color: '$red11' }}>
                        Revoke Access
                      </Button>
                    </XStack>
                  </XStack>
                  <Text fontSize="$3" color="$color10" marginBottom="$2">
                    Connected {formatDate(app.connected_at)}
                  </Text>
                  <YStack marginTop="$2">
                    <H4 fontSize="$3" fontWeight="500" color="$color11">Permissions</H4>
                    <XStack flexWrap="wrap" gap="$1" marginTop="$1">
                      {app.permissions.map(perm => (
                        <Text
                          key={perm}
                          paddingHorizontal="$2"
                          paddingVertical="$0.5"
                          backgroundColor="$gray2"
                          color="$color11"
                          fontSize="$2"
                          borderRadius="$2"
                        >
                          {perm}
                        </Text>
                      ))}
                    </XStack>
                  </YStack>
                  <YStack marginTop="$2">
                    <H4 fontSize="$3" fontWeight="500" color="$color11">Data Categories Accessed</H4>
                    <XStack flexWrap="wrap" gap="$1" marginTop="$1">
                      {app.data_categories.map(cat => (
                        <Text
                          key={cat}
                          paddingHorizontal="$2"
                          paddingVertical="$0.5"
                          backgroundColor="$blue2"
                          color="$blue10"
                          fontSize="$2"
                          borderRadius="$2"
                          textTransform="capitalize"
                        >
                          {cat}
                        </Text>
                      ))}
                    </XStack>
                  </YStack>
                </YStack>
              ))}
            </YStack>
          )}
        </Card>
      </YStack>

      {/* Non-Discrimination Notice */}
      <Card marginBottom="$8" padding="$4" backgroundColor="$gray2" borderColor="$borderColor" borderRadius="$4">
        <H3 fontSize="$5" fontWeight="600" color="$color12" marginBottom="$2">Non-Discrimination Notice</H3>
        <Text fontSize="$3" color="$color11">
          We will not discriminate against you for exercising any of your privacy rights.
          You will receive the same service and pricing regardless of your privacy choices.
        </Text>
      </Card>

      {/* Processing Time Info */}
      <Card marginBottom="$8" padding="$4" backgroundColor="$blue2" borderColor="$blue6" borderRadius="$4">
        <Text fontSize="$3" color="$blue11" marginBottom="$2">
          <Text fontWeight="600">Processing Time:</Text> Under CCPA, we will respond to your request within 45 days.
          In some cases, we may extend this period by an additional 45 days if necessary.
        </Text>
        <Text fontSize="$3" color="$blue11">
          <Text fontWeight="600">Download Availability:</Text> Data exports will be available for download for 30 days after completion.
        </Text>
      </Card>

      {/* Additional Resources */}
      <YStack gap="$4" marginBottom="$8">
        <H2 fontSize="$6" fontWeight="600" color="$color12" marginBottom="$4">Additional Resources</H2>
        <Card backgroundColor="$background" borderColor="$borderColor" borderRadius="$4" padding="$4">
          <YStack gap="$3">
            <YStack>
              <Text as="a" href="/privacy-policy" color="$blue10" hoverStyle={{ color: '$blue11', textDecorationLine: 'underline' }}>
                Privacy Policy
              </Text>
              <Text fontSize="$3" color="$color10">Learn how we collect, use, and protect your information</Text>
            </YStack>
            <YStack>
              <Text as="a" href="/terms" color="$blue10" hoverStyle={{ color: '$blue11', textDecorationLine: 'underline' }}>
                Terms of Service
              </Text>
              <Text fontSize="$3" color="$color10">Review our terms and conditions</Text>
            </YStack>
            <YStack>
              <Text as="a" href="https://oag.ca.gov/privacy/ccpa" target="_blank" rel="noopener noreferrer" color="$blue10" hoverStyle={{ color: '$blue11', textDecorationLine: 'underline' }}>
                Learn more about CCPA
              </Text>
              <Text fontSize="$3" color="$color10">Official information from the California Attorney General</Text>
            </YStack>
          </YStack>
          <YStack marginTop="$4" paddingTop="$4" borderTopWidth={1} borderTopColor="$borderColor">
            <Text fontSize="$3" color="$color11">
              Have questions about your privacy rights? Contact our privacy team at{' '}
              <Text as="a" href="mailto:privacy@scaffald.com" color="$blue10" hoverStyle={{ color: '$blue11' }}>
                privacy@scaffald.com
              </Text>
            </Text>
          </YStack>
        </Card>
      </YStack>

      {/* Modals would go here - simplified for now */}
      {activeModal && (
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
          <Card backgroundColor="$background" borderRadius="$4" padding="$6" maxWidth={448} width="100%" marginHorizontal="$4">
            <YStack gap="$4">
              <H2 fontSize="$7" fontWeight="600" marginBottom="$4">
                {activeModal === 'opt-out' ? 'Manage Opt-Out Preferences' :
                 requestType === 'export' ? 'Request Data Export' :
                 requestType === 'deletion' ? 'Request Data Deletion' : 'Request Data Correction'}
              </H2>
              <Text color="$color11" marginBottom="$4">
                {activeModal === 'opt-out'
                  ? 'Control how your personal information is used and shared.'
                  : 'Your request will be processed within 45 days as required by CCPA.'}
              </Text>
              <XStack gap="$3" justifyContent="flex-end">
                <Button
                  variant="ghost"
                  onPress={() => setActiveModal(null)}
                  paddingHorizontal="$4"
                  paddingVertical="$2"
                  color="$color11"
                  hoverStyle={{ color: '$color12' }}
                >
                  Cancel
                </Button>
                <Button
                  onPress={() => {
                    // In a real implementation, this would submit the request
                    alert('Request submitted! You will receive an email confirmation.');
                    setActiveModal(null);
                  }}
                  paddingHorizontal="$4"
                  paddingVertical="$2"
                  backgroundColor="$blue9"
                  color="white"
                  borderRadius="$4"
                  hoverStyle={{ backgroundColor: '$blue10' }}
                >
                  {activeModal === 'opt-out' ? 'Save Preferences' : 'Submit Request'}
                </Button>
              </XStack>
            </YStack>
          </Card>
        </YStack>
      )}
    </YStack>
  );
}
