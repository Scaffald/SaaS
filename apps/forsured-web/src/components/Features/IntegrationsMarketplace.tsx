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
import { YStack, XStack, Text, H1, H2, H3, Card, Button as TamaguiButton, Input } from '@unicornlove/ui';
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
    <YStack gap="$6">
      {/* Header */}
      <XStack alignItems="center" justifyContent="space-between">
        <YStack>
          <H1 fontSize="$8" fontWeight="700" color="$color12">
            Integrations Marketplace
          </H1>
          <Text color="$color11">
            Connect Simple Insurance with your existing construction tech stack
          </Text>
        </YStack>
        <XStack alignItems="center" gap="$3">
          <Text fontSize="$3" color="$color11">
            <Text fontWeight="500" color="$green11">
              {connectedCount}
            </Text>{' '}
            connected
          </Text>
          <TamaguiButton
            paddingHorizontal="$4"
            paddingVertical="$2"
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius="$4"
            backgroundColor="transparent"
            hoverStyle={{ backgroundColor: '$backgroundHover' }}
          >
            <XStack alignItems="center" gap="$2">
              <Filter size={16} />
              <Text>Filter</Text>
            </XStack>
          </TamaguiButton>
        </XStack>
      </XStack>

      {/* Stats Cards */}
      <XStack flexWrap="wrap" gap="$6">
        <Card backgroundColor="$background" borderRadius="$4" elevation={1} borderWidth={1} borderColor="$borderColor" padding="$6" flex={1} minWidth="45%" $gtMd={{ minWidth: '22%' }}>
          <XStack alignItems="center" justifyContent="space-between">
            <YStack>
              <Text fontSize="$3" color="$color11">Connected</Text>
              <Text fontSize="$9" fontWeight="700" color="$green11">
                {connectedCount}
              </Text>
            </YStack>
            <XStack backgroundColor="$green2" padding="$3" borderRadius={9999}>
              <CheckCircle size={24} color="$green11" />
            </XStack>
          </XStack>
          <Text fontSize="$3" color="$color11" marginTop="$3">
            Active integrations
          </Text>
        </Card>

        <Card backgroundColor="$background" borderRadius="$4" elevation={1} borderWidth={1} borderColor="$borderColor" padding="$6" flex={1} minWidth="45%" $gtMd={{ minWidth: '22%' }}>
          <XStack alignItems="center" justifyContent="space-between">
            <YStack>
              <Text fontSize="$3" color="$color11">Recommended</Text>
              <Text fontSize="$9" fontWeight="700" color="$blue11">
                {recommendedCount}
              </Text>
            </YStack>
            <XStack backgroundColor="$blue2" padding="$3" borderRadius={9999}>
              <Star size={24} color="$blue11" />
            </XStack>
          </XStack>
          <Text fontSize="$3" color="$color11" marginTop="$3">
            Suggested for you
          </Text>
        </Card>

        <Card backgroundColor="$background" borderRadius="$4" elevation={1} borderWidth={1} borderColor="$borderColor" padding="$6" flex={1} minWidth="45%" $gtMd={{ minWidth: '22%' }}>
          <XStack alignItems="center" justifyContent="space-between">
            <YStack>
              <Text fontSize="$3" color="$color11">Available</Text>
              <Text fontSize="$9" fontWeight="700" color="$color12">
                {integrations.length}
              </Text>
            </YStack>
            <XStack backgroundColor="$backgroundHover" padding="$3" borderRadius={9999}>
              <Settings size={24} color="$color11" />
            </XStack>
          </XStack>
          <Text fontSize="$3" color="$color11" marginTop="$3">
            Total integrations
          </Text>
        </Card>

        <Card backgroundColor="$background" borderRadius="$4" elevation={1} borderWidth={1} borderColor="$borderColor" padding="$6" flex={1} minWidth="45%" $gtMd={{ minWidth: '22%' }}>
          <XStack alignItems="center" justifyContent="space-between">
            <YStack>
              <Text fontSize="$3" color="$color11">Setup Time</Text>
              <Text fontSize="$9" fontWeight="700" color="$gray10">5m</Text>
            </YStack>
            <XStack backgroundColor="$gray2" padding="$3" borderRadius={9999}>
              <Clock size={24} color="$gray10" />
            </XStack>
          </XStack>
          <Text fontSize="$3" color="$color11" marginTop="$3">Average setup</Text>
        </Card>
      </XStack>

      {/* Search and Filters */}
      <Card backgroundColor="$background" borderRadius="$4" elevation={1} borderWidth={1} borderColor="$borderColor" padding="$4">
        <XStack flexDirection="column" $gtSm={{ flexDirection: 'row' }} gap="$3">
          {/* Search Bar */}
          <XStack position="relative" flex={1}>
            <Search
              position="absolute"
              left={12}
              top="50%"
              style={{ transform: 'translateY(-50%)' }}
              size={20}
              color="$color10"
              zIndex={1}
            />
            <Input
              type="text"
              placeholder="Search integrations..."
              width="100%"
              paddingLeft="$10"
              paddingRight="$4"
              paddingVertical="$2.5"
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius="$4"
              backgroundColor="$background"
              color="$color12"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </XStack>

          {/* Filter Dropdown */}
          <YStack position="relative" ref={filterRef}>
            <TamaguiButton
              onPress={() => setIsFilterOpen(!isFilterOpen)}
              paddingHorizontal="$4"
              paddingVertical="$2.5"
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius="$4"
              backgroundColor="transparent"
              hoverStyle={{ backgroundColor: '$backgroundHover' }}
              minWidth={180}
            >
              <XStack alignItems="center" justifyContent="space-between" width="100%">
                <XStack alignItems="center" gap="$2">
                  <Filter size={18} />
                  <Text fontSize="$3" fontWeight="500">
                    {categories.find((c) => c.id === selectedCategory)?.name ||
                      'All Integrations'}
                  </Text>
                </XStack>
                <ChevronDown
                  size={16}
                  style={{ transform: isFilterOpen ? 'rotate(180deg)' : 'none' }}
                />
              </XStack>
            </TamaguiButton>

            {isFilterOpen && (
              <Card
                position="absolute"
                top="100%"
                right={0}
                marginTop="$2"
                width={288}
                backgroundColor="$background"
                borderWidth={1}
                borderColor="$borderColor"
                borderRadius="$4"
                elevation={4}
                zIndex={10}
                paddingVertical="$2"
              >
                <YStack paddingHorizontal="$3" paddingVertical="$2" borderBottomWidth={1} borderColor="$borderColor">
                  <Text fontSize="$2" fontWeight="500" color="$color11" textTransform="uppercase">
                    Filter by Category
                  </Text>
                </YStack>
                <YStack maxHeight={384} overflow="scroll">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    const isSelected = selectedCategory === category.id;
                    return (
                      <TamaguiButton
                        key={category.id}
                        unstyled
                        onPress={() => {
                          setSelectedCategory(category.id);
                          setIsFilterOpen(false);
                        }}
                        width="100%"
                        paddingHorizontal="$4"
                        paddingVertical="$2.5"
                        backgroundColor={isSelected ? '$blue2' : 'transparent'}
                        hoverStyle={{ backgroundColor: '$backgroundHover' }}
                      >
                        <XStack alignItems="center" justifyContent="space-between" width="100%">
                          <XStack alignItems="center" gap="$3">
                            <Icon
                              size={18}
                              color={isSelected ? '$blue11' : '$color11'}
                            />
                            <Text
                              fontSize="$3"
                              color={isSelected ? '$blue11' : '$color12'}
                              fontWeight={isSelected ? '500' : '400'}
                            >
                              {category.name}
                            </Text>
                          </XStack>
                          {isSelected && (
                            <Check size={16} color="$blue11" />
                          )}
                        </XStack>
                      </TamaguiButton>
                    );
                  })}
                </YStack>
                <YStack paddingHorizontal="$4" paddingVertical="$2" borderTopWidth={1} borderColor="$borderColor">
                  <XStack alignItems="center" gap="$2">
                    <input
                      type="checkbox"
                      checked={showConnected}
                      onChange={(e) => setShowConnected(e.target.checked)}
                      style={{ borderRadius: '4px' }}
                    />
                    <Text fontSize="$3" color="$color12">
                      Show connected only
                    </Text>
                  </XStack>
                </YStack>
              </Card>
            )}
          </YStack>
        </XStack>
      </Card>

      {/* Featured/Recommended Section */}
      {!showConnected && selectedCategory === 'all' && (
        <Card backgroundColor="$blue2" borderRadius="$4" padding="$6" borderWidth={1} borderColor="$blue6">
          <XStack alignItems="center" gap="$2" marginBottom="$4">
            <Star size={20} color="$blue11" />
            <H2 fontSize="$6" fontWeight="600" color="$color12">
              Recommended for Construction Teams
            </H2>
          </XStack>
          <XStack flexWrap="wrap" gap="$4">
            {integrations
              .filter((i) => i.recommended && !i.connected)
              .slice(0, 3)
              .map((integration) => (
                <Card
                  key={integration.id}
                  backgroundColor="$background"
                  padding="$4"
                  borderRadius="$4"
                  borderWidth={1}
                  borderColor="$blue6"
                  flex={1}
                  minWidth="45%"
                  $gtMd={{ minWidth: '30%' }}
                >
                  <XStack alignItems="center" gap="$3" marginBottom="$3">
                    <Text fontSize="$8">{integration.logo}</Text>
                    <YStack>
                      <Text fontWeight="500" color="$color12">
                        {integration.name}
                      </Text>
                      <XStack alignItems="center" gap="$1">
                        <Star size={12} color="$yellow10" fill="currentColor" />
                        <Text fontSize="$2" color="$color11">
                          {integration.rating}
                        </Text>
                      </XStack>
                    </YStack>
                  </XStack>
                  <Text fontSize="$3" color="$color11" marginBottom="$3">
                    {integration.description}
                  </Text>
                  <TamaguiButton
                    onPress={() =>
                      handleConnect(integration.id, integration.name)
                    }
                    width="100%"
                    backgroundColor="$blue10"
                    color="white"
                    paddingHorizontal="$3"
                    paddingVertical="$2"
                    borderRadius="$4"
                    hoverStyle={{ backgroundColor: '$blue11' }}
                  >
                    <Text fontSize="$3">Connect Now</Text>
                  </TamaguiButton>
                </Card>
              ))}
          </XStack>
        </Card>
      )}

      {/* Integrations Grid */}
      <XStack flexWrap="wrap" gap="$6">
        {filteredIntegrations.map((integration) => (
          <Card
            key={integration.id}
            backgroundColor="$background"
            borderRadius="$4"
            elevation={1}
            borderWidth={1}
            borderColor="$borderColor"
            hoverStyle={{ elevation: 2 }}
            flex={1}
            minWidth="45%"
            $gtLg={{ minWidth: '30%' }}
          >
            <YStack padding="$6">
              {/* Header */}
              <XStack alignItems="flex-start" justifyContent="space-between" marginBottom="$4">
                <YStack flex={1}>
                  <XStack alignItems="center" gap="$3" marginBottom="$2">
                    <Text fontSize="$9">{integration.logo}</Text>
                    <H3 fontSize="$6" fontWeight="600" color="$color12">
                      {integration.name}
                    </H3>
                  </XStack>
                  <XStack alignItems="center" gap="$2" marginBottom="$2" flexWrap="wrap">
                    {integration.popular && (
                      <Text fontSize="$2" paddingHorizontal="$2" paddingVertical="$1" backgroundColor="$green2" color="$green12" borderRadius={9999}>
                        Popular
                      </Text>
                    )}
                    {integration.recommended && (
                      <Text fontSize="$2" paddingHorizontal="$2" paddingVertical="$1" backgroundColor="$blue2" color="$blue12" borderRadius={9999}>
                        Recommended
                      </Text>
                    )}
                    {integration.connected && (
                      <Text fontSize="$2" paddingHorizontal="$2" paddingVertical="$1" backgroundColor="$backgroundHover" color="$color12" borderRadius={9999}>
                        Connected
                      </Text>
                    )}
                  </XStack>
                </YStack>
              </XStack>

              {/* Description */}
              <Text color="$color11" marginBottom="$4" fontSize="$3">
                {integration.description}
              </Text>

              {/* Features */}
              <YStack marginBottom="$4">
                <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2">
                  Key Features
                </Text>
                <YStack gap="$1">
                  {integration.features.slice(0, 3).map((feature, index) => (
                    <XStack
                      key={index}
                      alignItems="center"
                      gap="$2"
                    >
                      <YStack width={6} height={6} backgroundColor="$green10" borderRadius={9999} />
                      <Text fontSize="$3" color="$color11">
                        {feature}
                      </Text>
                    </XStack>
                  ))}
                </YStack>
              </YStack>

              {/* Data Sync */}
              <YStack marginBottom="$4">
                <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2">
                  Data Sync
                </Text>
                <XStack flexWrap="wrap" gap="$1">
                  {integration.dataSync.slice(0, 3).map((data, index) => (
                    <Text
                      key={index}
                      fontSize="$2"
                      paddingHorizontal="$2"
                      paddingVertical="$1"
                      backgroundColor="$backgroundHover"
                      color="$color12"
                      borderRadius="$2"
                    >
                      {data}
                    </Text>
                  ))}
                  {integration.dataSync.length > 3 && (
                    <Text fontSize="$2" color="$color11">
                      +{integration.dataSync.length - 3} more
                    </Text>
                  )}
                </XStack>
              </YStack>

              {/* Setup Info */}
              <XStack alignItems="center" justifyContent="space-between" fontSize="$3" color="$color11" marginBottom="$4">
                <XStack alignItems="center" gap="$1">
                  <Clock size={14} />
                  <Text>{integration.setupTime} setup</Text>
                </XStack>
                <Text fontWeight="500" color="$green11">
                  {integration.pricing}
                </Text>
              </XStack>

              {/* Actions */}
              <XStack gap="$2">
                {integration.connected ? (
                  <>
                    <TamaguiButton
                      flex={1}
                      backgroundColor="$backgroundHover"
                      color="$color12"
                      paddingHorizontal="$4"
                      paddingVertical="$2"
                      borderRadius="$4"
                      hoverStyle={{ backgroundColor: '$background' }}
                    >
                      <XStack alignItems="center" justifyContent="center" gap="$2">
                        <Settings size={16} />
                        <Text>Configure</Text>
                      </XStack>
                    </TamaguiButton>
                    <TamaguiButton
                      onPress={() => handleDisconnect(integration.id)}
                      paddingHorizontal="$3"
                      paddingVertical="$2"
                      borderWidth={1}
                      borderColor="$red6"
                      color="$red11"
                      borderRadius="$4"
                      backgroundColor="transparent"
                      hoverStyle={{ backgroundColor: '$red2' }}
                    >
                      Disconnect
                    </TamaguiButton>
                  </>
                ) : (
                  <>
                    <TamaguiButton
                      onPress={() =>
                        handleConnect(integration.id, integration.name)
                      }
                      flex={1}
                      backgroundColor="$blue10"
                      color="white"
                      paddingHorizontal="$4"
                      paddingVertical="$2"
                      borderRadius="$4"
                      hoverStyle={{ backgroundColor: '$blue11' }}
                    >
                      <XStack alignItems="center" justifyContent="center" gap="$2">
                        <Plus size={16} />
                        <Text>Connect</Text>
                      </XStack>
                    </TamaguiButton>
                    <TamaguiButton
                      paddingHorizontal="$3"
                      paddingVertical="$2"
                      borderWidth={1}
                      borderColor="$borderColor"
                      borderRadius="$4"
                      backgroundColor="transparent"
                      hoverStyle={{ backgroundColor: '$backgroundHover' }}
                    >
                      <ExternalLink size={16} />
                    </TamaguiButton>
                  </>
                )}
              </XStack>
            </YStack>
          </Card>
        ))}
      </XStack>

      {/* Empty State */}
      {filteredIntegrations.length === 0 && (
        <Card backgroundColor="$background" borderRadius="$4" elevation={1} borderWidth={1} borderColor="$borderColor" padding="$12" alignItems="center">
          <Search size={48} color="$gray8" marginBottom="$4" />
          <H3 fontSize="$6" fontWeight="500" color="$color12" marginBottom="$2">
            No integrations found
          </H3>
          <Text color="$color11">
            Try adjusting your search terms or category filters
          </Text>
        </Card>
      )}

      {/* Connection Status Panel */}
      {connectedCount > 0 && (
        <div className="bg-surface rounded-lg shadow-sm border border-border">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-text-primary">
              Connected Integrations
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {mockIntegrations
                .filter((i) => i.connected)
                .map((integration) => (
                  <div
                    key={integration.name}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          integration.status === 'active'
                            ? 'bg-success-500'
                            : integration.status === 'error'
                              ? 'bg-error-500'
                              : 'bg-warning-500'
                        }`}
                      ></div>
                      <div>
                        <p className="font-medium text-text-primary">
                          {integration.name}
                        </p>
                        <p className="text-sm text-text-secondary">
                          {integration.lastSync
                            ? `Last sync: ${integration.lastSync.toLocaleString()}`
                            : 'Never synced'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          integration.status === 'active'
                            ? 'bg-success-100 text-green-800'
                            : integration.status === 'error'
                              ? 'bg-error-400/20 text-red-800'
                              : 'bg-warning-100 text-yellow-800'
                        }`}
                      >
                        {integration.status}
                      </span>
                      <button className="p-1 text-text-tertiary hover:text-text-secondary">
                        <Settings size={16} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
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
    </div>
  );
}
