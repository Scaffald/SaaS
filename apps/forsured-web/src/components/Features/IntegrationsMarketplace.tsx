import { useState, useRef, useEffect } from 'react';
import {
  Search,
  Plus,
  CheckCircle,
  Settings,
  ExternalLink,
  Filter,
  Star,
  Shield,
  FileText,
  DollarSign,
  BarChart3,
  Users,
  Building,
  Clock,
  AlertTriangle,
  ChevronDown,
  Check,
} from 'lucide-react';
import { Stack, Row, Text } from '@unicornlove/beyond-ui';
import { IntegrationStatus } from '../../types';
import { mockIntegrations } from '../../utils/mockData';
import ConnectionWizard from '../Integrations/ConnectionWizard';

interface Integration {
  id: string;
  name: string;
  category:
    | 'construction-mgmt'
    | 'accounting'
    | 'insurance'
    | 'compliance'
    | 'analytics'
    | 'communication';
  description: string;
  features: string[];
  pricing: string;
  rating: number;
  reviews: number;
  logo: string;
  connected: boolean;
  popular: boolean;
  recommended: boolean;
  setupTime: string;
  dataSync: string[];
}

export default function IntegrationsMarketplace() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showConnected, setShowConnected] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [selectedIntegration, setSelectedIntegration] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const integrations: Integration[] = [
    {
      id: 'procore',
      name: 'Procore',
      category: 'construction-mgmt',
      description:
        'Leading construction management platform with project tracking, document management, and team collaboration.',
      features: [
        'Project sync',
        'Document sharing',
        'Contractor lists',
        'Real-time updates',
      ],
      pricing: '$150/month',
      rating: 4.8,
      reviews: 2847,
      logo: '🏗️',
      connected: true,
      popular: true,
      recommended: true,
      setupTime: '5 minutes',
      dataSync: ['Projects', 'Contractors', 'Documents', 'Compliance status'],
    },
    {
      id: 'mycoi',
      name: 'myCOI',
      category: 'insurance',
      description:
        'Certificate of Insurance tracking and management platform for construction projects.',
      features: [
        'COI tracking',
        'Expiration alerts',
        'Compliance monitoring',
        'Automated requests',
      ],
      pricing: 'Free integration',
      rating: 4.6,
      reviews: 1523,
      logo: '📋',
      connected: false,
      popular: true,
      recommended: true,
      setupTime: '3 minutes',
      dataSync: [
        'COI documents',
        'Expiration dates',
        'Compliance status',
        'Contractor info',
      ],
    },
    {
      id: 'autodesk-acc',
      name: 'Autodesk Construction Cloud',
      category: 'construction-mgmt',
      description:
        'Comprehensive construction management suite with BIM coordination and project delivery tools.',
      features: [
        'BIM integration',
        'Document control',
        'Field management',
        'Quality control',
      ],
      pricing: 'Free integration',
      rating: 4.7,
      reviews: 1892,
      logo: '🏢',
      connected: true,
      popular: true,
      recommended: false,
      setupTime: '10 minutes',
      dataSync: [
        'Project data',
        'Contractor assignments',
        'Document status',
        'Quality reports',
      ],
    },
    {
      id: 'quickbooks',
      name: 'QuickBooks',
      category: 'accounting',
      description:
        'Small business accounting software with expense tracking and financial reporting.',
      features: [
        'Expense tracking',
        'Invoice management',
        'Financial reports',
        'Tax preparation',
      ],
      pricing: 'Free integration',
      rating: 4.5,
      reviews: 5672,
      logo: '💰',
      connected: true,
      popular: true,
      recommended: false,
      setupTime: '5 minutes',
      dataSync: [
        'Insurance expenses',
        'Contractor payments',
        'Premium tracking',
        'Tax documents',
      ],
    },
    {
      id: 'sage-300',
      name: 'Sage 300',
      category: 'accounting',
      description:
        'Enterprise accounting and business management solution for construction companies.',
      features: [
        'Job costing',
        'Project accounting',
        'Financial reporting',
        'Multi-company support',
      ],
      pricing: 'Free integration',
      rating: 4.3,
      reviews: 892,
      logo: '📊',
      connected: false,
      popular: false,
      recommended: false,
      setupTime: '15 minutes',
      dataSync: [
        'Project costs',
        'Insurance expenses',
        'Contractor payments',
        'Budget tracking',
      ],
    },
    {
      id: 'xero',
      name: 'Xero',
      category: 'accounting',
      description:
        'Cloud-based accounting software with real-time financial data and collaboration tools.',
      features: [
        'Real-time reporting',
        'Bank reconciliation',
        'Expense claims',
        'Multi-currency',
      ],
      pricing: 'Free integration',
      rating: 4.4,
      reviews: 3421,
      logo: '💼',
      connected: false,
      popular: true,
      recommended: false,
      setupTime: '5 minutes',
      dataSync: [
        'Insurance premiums',
        'Contractor expenses',
        'Financial reports',
        'Tax data',
      ],
    },
    {
      id: 'buildertrend',
      name: 'BuilderTrend',
      category: 'construction-mgmt',
      description:
        'Construction project management software with scheduling, budgeting, and customer management.',
      features: [
        'Project scheduling',
        'Budget tracking',
        'Customer portal',
        'Change orders',
      ],
      pricing: 'Free integration',
      rating: 4.2,
      reviews: 1247,
      logo: '🔨',
      connected: false,
      popular: false,
      recommended: false,
      setupTime: '8 minutes',
      dataSync: [
        'Project schedules',
        'Contractor assignments',
        'Budget data',
        'Change orders',
      ],
    },
    {
      id: 'smartsheet',
      name: 'Smartsheet',
      category: 'construction-mgmt',
      description:
        'Work execution platform that enables teams to plan, track, automate, and report on work.',
      features: [
        'Project tracking',
        'Automated workflows',
        'Resource management',
        'Reporting',
      ],
      pricing: 'Free integration',
      rating: 4.4,
      reviews: 2156,
      logo: '📈',
      connected: false,
      popular: true,
      recommended: false,
      setupTime: '7 minutes',
      dataSync: [
        'Project data',
        'Task assignments',
        'Progress tracking',
        'Resource allocation',
      ],
    },
    {
      id: 'docusign',
      name: 'DocuSign',
      category: 'compliance',
      description:
        'Electronic signature platform for secure document signing and contract management.',
      features: [
        'E-signatures',
        'Document templates',
        'Audit trails',
        'Mobile signing',
      ],
      pricing: 'Free integration',
      rating: 4.6,
      reviews: 4523,
      logo: '✍️',
      connected: false,
      popular: true,
      recommended: true,
      setupTime: '3 minutes',
      dataSync: [
        'Signed documents',
        'Contract status',
        'Compliance records',
        'Audit trails',
      ],
    },
    {
      id: 'slack',
      name: 'Slack',
      category: 'communication',
      description:
        'Team communication platform with channels, direct messaging, and file sharing.',
      features: [
        'Team messaging',
        'File sharing',
        'Workflow automation',
        'App integrations',
      ],
      pricing: 'Free integration',
      rating: 4.5,
      reviews: 8934,
      logo: '💬',
      connected: false,
      popular: true,
      recommended: false,
      setupTime: '2 minutes',
      dataSync: [
        'Compliance alerts',
        'Expiration notifications',
        'Team updates',
        'Document sharing',
      ],
    },
  ];

  const categories = [
    { id: 'all', name: 'All Integrations', icon: Settings },
    {
      id: 'construction-mgmt',
      name: 'Construction Management',
      icon: Building,
    },
    { id: 'accounting', name: 'Accounting & Finance', icon: DollarSign },
    { id: 'insurance', name: 'Insurance & Risk', icon: Shield },
    { id: 'compliance', name: 'Compliance & Legal', icon: FileText },
    { id: 'analytics', name: 'Analytics & Reporting', icon: BarChart3 },
    { id: 'communication', name: 'Communication', icon: Users },
  ];

  const filteredIntegrations = integrations.filter((integration) => {
    const matchesSearch =
      integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || integration.category === selectedCategory;
    const matchesConnected = !showConnected || integration.connected;
    return matchesSearch && matchesCategory && matchesConnected;
  });

  const connectedCount = integrations.filter((i) => i.connected).length;
  const recommendedCount = integrations.filter(
    (i) => i.recommended && !i.connected
  ).length;

  const handleConnect = (integrationId: string, integrationName: string) => {
    setSelectedIntegration({ id: integrationId, name: integrationName });
  };

  const handleDisconnect = (integrationId: string) => {
    // Mock disconnection logic
    console.log(`Disconnecting from ${integrationId}`);
  };

  return (
    <Stack style={{ gap: 24 }}>
      {/* Header */}
      <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack>
          <Text style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-12)' }}>
            Integrations Marketplace
          </Text>
          <Text style={{ color: 'var(--color-11)' }}>
            Connect Simple Insurance with your existing construction tech stack
          </Text>
        </Stack>
        <Row style={{ alignItems: 'center', gap: 12 }}>
          <Text style={{ fontSize: 14, color: 'var(--color-11)' }}>
            <Text style={{ fontWeight: 500, color: 'var(--color-green-11)' }}>
              {connectedCount}
            </Text>{' '}
            connected
          </Text>
          <button
            style={{
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 8,
              paddingBottom: 8,
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: 'var(--color-border)',
              borderRadius: 8,
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Filter size={16} />
            <Text>Filter</Text>
          </button>
        </Row>
      </Row>

      {/* Stats Cards */}
      <Row style={{ flexWrap: 'wrap', gap: 24 }}>
        <div style={{ backgroundColor: 'var(--color-background)', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--color-border)', padding: 24, flex: 1, minWidth: '45%' }}>
          <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Stack>
              <Text style={{ fontSize: 14, color: 'var(--color-11)' }}>Connected</Text>
              <Text style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-green-11)' }}>
                {connectedCount}
              </Text>
            </Stack>
            <Row style={{ backgroundColor: 'var(--color-green-2)', padding: 12, borderRadius: 9999 }}>
              <CheckCircle size={24} color="var(--color-green-11)" />
            </Row>
          </Row>
          <Text style={{ fontSize: 14, color: 'var(--color-11)', marginTop: 12 }}>
            Active integrations
          </Text>
        </div>

        <div style={{ backgroundColor: 'var(--color-background)', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--color-border)', padding: 24, flex: 1, minWidth: '45%' }}>
          <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Stack>
              <Text style={{ fontSize: 14, color: 'var(--color-11)' }}>Recommended</Text>
              <Text style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-blue-11)' }}>
                {recommendedCount}
              </Text>
            </Stack>
            <Row style={{ backgroundColor: 'var(--color-blue-2)', padding: 12, borderRadius: 9999 }}>
              <Star size={24} color="var(--color-blue-11)" />
            </Row>
          </Row>
          <Text style={{ fontSize: 14, color: 'var(--color-11)', marginTop: 12 }}>
            Suggested for you
          </Text>
        </div>

        <div style={{ backgroundColor: 'var(--color-background)', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--color-border)', padding: 24, flex: 1, minWidth: '45%' }}>
          <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Stack>
              <Text style={{ fontSize: 14, color: 'var(--color-11)' }}>Available</Text>
              <Text style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-12)' }}>
                {integrations.length}
              </Text>
            </Stack>
            <Row style={{ backgroundColor: 'var(--color-background-hover)', padding: 12, borderRadius: 9999 }}>
              <Settings size={24} color="var(--color-11)" />
            </Row>
          </Row>
          <Text style={{ fontSize: 14, color: 'var(--color-11)', marginTop: 12 }}>
            Total integrations
          </Text>
        </div>

        <div style={{ backgroundColor: 'var(--color-background)', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--color-border)', padding: 24, flex: 1, minWidth: '45%' }}>
          <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Stack>
              <Text style={{ fontSize: 14, color: 'var(--color-11)' }}>Setup Time</Text>
              <Text style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-gray-10)' }}>5m</Text>
            </Stack>
            <Row style={{ backgroundColor: 'var(--color-gray-2)', padding: 12, borderRadius: 9999 }}>
              <Clock size={24} color="var(--color-gray-10)" />
            </Row>
          </Row>
          <Text style={{ fontSize: 14, color: 'var(--color-11)', marginTop: 12 }}>Average setup</Text>
        </div>
      </Row>

      {/* Search and Filters */}
      <div style={{ backgroundColor: 'var(--color-background)', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--color-border)', padding: 16 }}>
        <Row style={{ gap: 12, flexWrap: 'wrap' }}>
          {/* Search Bar */}
          <Row style={{ position: 'relative', flex: 1 }}>
            <Search
              size={20}
              color="var(--color-10)"
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1
              }}
            />
            <input
              type="text"
              placeholder="Search integrations..."
              style={{
                width: '100%',
                paddingLeft: 40,
                paddingRight: 16,
                paddingTop: 10,
                paddingBottom: 10,
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: 'var(--color-border)',
                borderRadius: 8,
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-12)',
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Row>

          {/* Filter Dropdown */}
          <Stack style={{ position: 'relative' }} ref={filterRef}>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              style={{
                paddingLeft: 16,
                paddingRight: 16,
                paddingTop: 10,
                paddingBottom: 10,
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: 'var(--color-border)',
                borderRadius: 8,
                backgroundColor: 'transparent',
                minWidth: 180,
                cursor: 'pointer',
              }}
            >
              <Row style={{ alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <Row style={{ alignItems: 'center', gap: 8 }}>
                  <Filter size={18} />
                  <Text style={{ fontSize: 14, fontWeight: 500 }}>
                    {categories.find((c) => c.id === selectedCategory)?.name ||
                      'All Integrations'}
                  </Text>
                </Row>
                <ChevronDown
                  size={16}
                  style={{ transform: isFilterOpen ? 'rotate(180deg)' : 'none' }}
                />
              </Row>
            </button>

            {isFilterOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 8,
                  width: 288,
                  backgroundColor: 'var(--color-background)',
                  borderWidth: 1,
                  borderStyle: 'solid',
                  borderColor: 'var(--color-border)',
                  borderRadius: 8,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  zIndex: 10,
                  paddingTop: 8,
                  paddingBottom: 8,
                }}
              >
                <Stack style={{ paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--color-border)' }}>
                  <Text style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-11)', textTransform: 'uppercase' }}>
                    Filter by Category
                  </Text>
                </Stack>
                <Stack style={{ maxHeight: 384, overflow: 'auto' }}>
                  {categories.map((category) => {
                    const Icon = category.icon;
                    const isSelected = selectedCategory === category.id;
                    return (
                      <button
                        key={category.id}
                        onClick={() => {
                          setSelectedCategory(category.id);
                          setIsFilterOpen(false);
                        }}
                        style={{
                          width: '100%',
                          paddingLeft: 16,
                          paddingRight: 16,
                          paddingTop: 10,
                          paddingBottom: 10,
                          backgroundColor: isSelected ? 'var(--color-blue-2)' : 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <Row style={{ alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <Row style={{ alignItems: 'center', gap: 12 }}>
                            <Icon
                              size={18}
                              color={isSelected ? 'var(--color-blue-11)' : 'var(--color-11)'}
                            />
                            <Text
                              style={{
                                fontSize: 14,
                                color: isSelected ? 'var(--color-blue-11)' : 'var(--color-12)',
                                fontWeight: isSelected ? 500 : 400,
                              }}
                            >
                              {category.name}
                            </Text>
                          </Row>
                          {isSelected && (
                            <Check size={16} color="var(--color-blue-11)" />
                          )}
                        </Row>
                      </button>
                    );
                  })}
                </Stack>
                <Stack style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 8, paddingBottom: 8, borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: 'var(--color-border)' }}>
                  <Row style={{ alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={showConnected}
                      onChange={(e) => setShowConnected(e.target.checked)}
                      style={{ borderRadius: 4 }}
                    />
                    <Text style={{ fontSize: 14, color: 'var(--color-12)' }}>
                      Show connected only
                    </Text>
                  </Row>
                </Stack>
              </div>
            )}
          </Stack>
        </Row>
      </div>

      {/* Featured/Recommended Section */}
      {!showConnected && selectedCategory === 'all' && (
        <div style={{ backgroundColor: 'var(--color-blue-2)', borderRadius: 8, padding: 24, borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--color-blue-6)' }}>
          <Row style={{ alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Star size={20} color="var(--color-blue-11)" />
            <Text style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-12)' }}>
              Recommended for Construction Teams
            </Text>
          </Row>
          <Row style={{ flexWrap: 'wrap', gap: 16 }}>
            {integrations
              .filter((i) => i.recommended && !i.connected)
              .slice(0, 3)
              .map((integration) => (
                <div
                  key={integration.id}
                  style={{
                    backgroundColor: 'var(--color-background)',
                    padding: 16,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderStyle: 'solid',
                    borderColor: 'var(--color-blue-6)',
                    flex: 1,
                    minWidth: '45%',
                  }}
                >
                  <Row style={{ alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <Text style={{ fontSize: 28 }}>{integration.logo}</Text>
                    <Stack>
                      <Text style={{ fontWeight: 500, color: 'var(--color-12)' }}>
                        {integration.name}
                      </Text>
                      <Row style={{ alignItems: 'center', gap: 4 }}>
                        <Star size={12} color="var(--color-yellow-10)" fill="currentColor" />
                        <Text style={{ fontSize: 12, color: 'var(--color-11)' }}>
                          {integration.rating}
                        </Text>
                      </Row>
                    </Stack>
                  </Row>
                  <Text style={{ fontSize: 14, color: 'var(--color-11)', marginBottom: 12 }}>
                    {integration.description}
                  </Text>
                  <button
                    onClick={() =>
                      handleConnect(integration.id, integration.name)
                    }
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--color-blue-10)',
                      color: 'white',
                      paddingLeft: 12,
                      paddingRight: 12,
                      paddingTop: 8,
                      paddingBottom: 8,
                      borderRadius: 8,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <Text style={{ fontSize: 14, color: 'white' }}>Connect Now</Text>
                  </button>
                </div>
              ))}
          </Row>
        </div>
      )}

      {/* Integrations Grid */}
      <Row style={{ flexWrap: 'wrap', gap: 24 }}>
        {filteredIntegrations.map((integration) => (
          <div
            key={integration.id}
            style={{
              backgroundColor: 'var(--color-background)',
              borderRadius: 8,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: 'var(--color-border)',
              flex: 1,
              minWidth: '45%',
            }}
          >
            <Stack style={{ padding: 24 }}>
              {/* Header */}
              <Row style={{ alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <Stack style={{ flex: 1 }}>
                  <Row style={{ alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <Text style={{ fontSize: 28 }}>{integration.logo}</Text>
                    <Text style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-12)' }}>
                      {integration.name}
                    </Text>
                  </Row>
                  <Row style={{ alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    {integration.popular && (
                      <Text style={{ fontSize: 12, paddingLeft: 8, paddingRight: 8, paddingTop: 4, paddingBottom: 4, backgroundColor: 'var(--color-green-2)', color: 'var(--color-green-12)', borderRadius: 9999 }}>
                        Popular
                      </Text>
                    )}
                    {integration.recommended && (
                      <Text style={{ fontSize: 12, paddingLeft: 8, paddingRight: 8, paddingTop: 4, paddingBottom: 4, backgroundColor: 'var(--color-blue-2)', color: 'var(--color-blue-12)', borderRadius: 9999 }}>
                        Recommended
                      </Text>
                    )}
                    {integration.connected && (
                      <Text style={{ fontSize: 12, paddingLeft: 8, paddingRight: 8, paddingTop: 4, paddingBottom: 4, backgroundColor: 'var(--color-background-hover)', color: 'var(--color-12)', borderRadius: 9999 }}>
                        Connected
                      </Text>
                    )}
                  </Row>
                </Stack>
              </Row>

              {/* Description */}
              <Text style={{ color: 'var(--color-11)', marginBottom: 16, fontSize: 14 }}>
                {integration.description}
              </Text>

              {/* Features */}
              <Stack style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-12)', marginBottom: 8 }}>
                  Key Features
                </Text>
                <Stack style={{ gap: 4 }}>
                  {integration.features.slice(0, 3).map((feature, index) => (
                    <Row
                      key={index}
                      style={{ alignItems: 'center', gap: 8 }}
                    >
                      <div style={{ width: 6, height: 6, backgroundColor: 'var(--color-green-10)', borderRadius: 9999 }} />
                      <Text style={{ fontSize: 14, color: 'var(--color-11)' }}>
                        {feature}
                      </Text>
                    </Row>
                  ))}
                </Stack>
              </Stack>

              {/* Data Sync */}
              <Stack style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-12)', marginBottom: 8 }}>
                  Data Sync
                </Text>
                <Row style={{ flexWrap: 'wrap', gap: 4 }}>
                  {integration.dataSync.slice(0, 3).map((data, index) => (
                    <Text
                      key={index}
                      style={{
                        fontSize: 12,
                        paddingLeft: 8,
                        paddingRight: 8,
                        paddingTop: 4,
                        paddingBottom: 4,
                        backgroundColor: 'var(--color-background-hover)',
                        color: 'var(--color-12)',
                        borderRadius: 4,
                      }}
                    >
                      {data}
                    </Text>
                  ))}
                  {integration.dataSync.length > 3 && (
                    <Text style={{ fontSize: 12, color: 'var(--color-11)' }}>
                      +{integration.dataSync.length - 3} more
                    </Text>
                  )}
                </Row>
              </Stack>

              {/* Setup Info */}
              <Row style={{ alignItems: 'center', justifyContent: 'space-between', fontSize: 14, color: 'var(--color-11)', marginBottom: 16 }}>
                <Row style={{ alignItems: 'center', gap: 4 }}>
                  <Clock size={14} />
                  <Text>{integration.setupTime} setup</Text>
                </Row>
                <Text style={{ fontWeight: 500, color: 'var(--color-green-11)' }}>
                  {integration.pricing}
                </Text>
              </Row>

              {/* Actions */}
              <Row style={{ gap: 8 }}>
                {integration.connected ? (
                  <>
                    <button
                      style={{
                        flex: 1,
                        backgroundColor: 'var(--color-background-hover)',
                        color: 'var(--color-12)',
                        paddingLeft: 16,
                        paddingRight: 16,
                        paddingTop: 8,
                        paddingBottom: 8,
                        borderRadius: 8,
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                      }}
                    >
                      <Settings size={16} />
                      <Text>Configure</Text>
                    </button>
                    <button
                      onClick={() => handleDisconnect(integration.id)}
                      style={{
                        paddingLeft: 12,
                        paddingRight: 12,
                        paddingTop: 8,
                        paddingBottom: 8,
                        borderWidth: 1,
                        borderStyle: 'solid',
                        borderColor: 'var(--color-red-6)',
                        color: 'var(--color-red-11)',
                        borderRadius: 8,
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                      }}
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() =>
                        handleConnect(integration.id, integration.name)
                      }
                      style={{
                        flex: 1,
                        backgroundColor: 'var(--color-blue-10)',
                        color: 'white',
                        paddingLeft: 16,
                        paddingRight: 16,
                        paddingTop: 8,
                        paddingBottom: 8,
                        borderRadius: 8,
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                      }}
                    >
                      <Plus size={16} />
                      <Text style={{ color: 'white' }}>Connect</Text>
                    </button>
                    <button
                      style={{
                        paddingLeft: 12,
                        paddingRight: 12,
                        paddingTop: 8,
                        paddingBottom: 8,
                        borderWidth: 1,
                        borderStyle: 'solid',
                        borderColor: 'var(--color-border)',
                        borderRadius: 8,
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                      }}
                    >
                      <ExternalLink size={16} />
                    </button>
                  </>
                )}
              </Row>
            </Stack>
          </div>
        ))}
      </Row>

      {/* Empty State */}
      {filteredIntegrations.length === 0 && (
        <div style={{ backgroundColor: 'var(--color-background)', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--color-border)', padding: 48, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Search size={48} color="var(--color-gray-8)" style={{ marginBottom: 16 }} />
          <Text style={{ fontSize: 18, fontWeight: 500, color: 'var(--color-12)', marginBottom: 8 }}>
            No integrations found
          </Text>
          <Text style={{ color: 'var(--color-11)' }}>
            Try adjusting your search terms or category filters
          </Text>
        </div>
      )}

      {/* Connection Status Panel */}
      {connectedCount > 0 && (
        <div style={{ backgroundColor: 'var(--color-background)', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--color-border)' }}>
          <Stack style={{ padding: 24, borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--color-border)' }}>
            <Text style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-12)' }}>
              Connected Integrations
            </Text>
          </Stack>
          <Stack style={{ padding: 24 }}>
            <Stack style={{ gap: 16 }}>
              {mockIntegrations
                .filter((i) => i.connected)
                .map((integration) => (
                  <Row
                    key={integration.name}
                    style={{
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 16,
                      borderWidth: 1,
                      borderStyle: 'solid',
                      borderColor: 'var(--color-border)',
                      borderRadius: 8,
                    }}
                  >
                    <Row style={{ alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 9999,
                          backgroundColor:
                            integration.status === 'active'
                              ? 'var(--color-green-10)'
                              : integration.status === 'error'
                                ? 'var(--color-red-10)'
                                : 'var(--color-yellow-10)',
                        }}
                      />
                      <Stack>
                        <Text style={{ fontWeight: 500, color: 'var(--color-12)' }}>
                          {integration.name}
                        </Text>
                        <Text style={{ fontSize: 14, color: 'var(--color-11)' }}>
                          {integration.lastSync
                            ? `Last sync: ${integration.lastSync.toLocaleString()}`
                            : 'Never synced'}
                        </Text>
                      </Stack>
                    </Row>
                    <Row style={{ alignItems: 'center', gap: 8 }}>
                      <Text
                        style={{
                          fontSize: 12,
                          paddingLeft: 8,
                          paddingRight: 8,
                          paddingTop: 4,
                          paddingBottom: 4,
                          borderRadius: 9999,
                          fontWeight: 500,
                          backgroundColor:
                            integration.status === 'active'
                              ? 'var(--color-green-2)'
                              : integration.status === 'error'
                                ? 'var(--color-red-2)'
                                : 'var(--color-yellow-2)',
                          color:
                            integration.status === 'active'
                              ? 'var(--color-green-12)'
                              : integration.status === 'error'
                                ? 'var(--color-red-12)'
                                : 'var(--color-yellow-12)',
                        }}
                      >
                        {integration.status}
                      </Text>
                      <button
                        style={{
                          padding: 4,
                          color: 'var(--color-10)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <Settings size={16} />
                      </button>
                    </Row>
                  </Row>
                ))}
            </Stack>
          </Stack>
        </div>
      )}

      {/* Connection Wizard */}
      {selectedIntegration && (
        <ConnectionWizard
          integrationId={selectedIntegration.id}
          integrationName={selectedIntegration.name}
          isOpen={!!selectedIntegration}
          onClose={() => setSelectedIntegration(null)}
          onSuccess={() => {
            // Refresh the page or update connection status
            setSelectedIntegration(null);
            // In a real app, you'd refresh the integrations list here
          }}
        />
      )}
    </Stack>
  );
}
