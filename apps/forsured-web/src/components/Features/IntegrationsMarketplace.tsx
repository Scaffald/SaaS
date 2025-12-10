import React, { useState, useRef, useEffect } from 'react';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Integrations Marketplace
          </h1>
          <p className="text-text-secondary">
            Connect Simple Insurance with your existing construction tech stack
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-text-secondary">
            <span className="font-medium text-success-600">
              {connectedCount}
            </span>{' '}
            connected
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 border border-border rounded-lg hover:bg-bg-secondary transition-colors">
            <Filter size={16} />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Connected</p>
              <p className="text-3xl font-bold text-success-600">
                {connectedCount}
              </p>
            </div>
            <div className="bg-success-100 p-3 rounded-full">
              <CheckCircle className="text-success-600" size={24} />
            </div>
          </div>
          <div className="mt-3 text-sm text-text-secondary">
            Active integrations
          </div>
        </div>

        <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Recommended</p>
              <p className="text-3xl font-bold text-primary-600">
                {recommendedCount}
              </p>
            </div>
            <div className="bg-primary-100 p-3 rounded-full">
              <Star className="text-primary-600" size={24} />
            </div>
          </div>
          <div className="mt-3 text-sm text-text-secondary">
            Suggested for you
          </div>
        </div>

        <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Available</p>
              <p className="text-3xl font-bold text-text-primary">
                {integrations.length}
              </p>
            </div>
            <div className="bg-bg-secondary p-3 rounded-full">
              <Settings className="text-text-secondary" size={24} />
            </div>
          </div>
          <div className="mt-3 text-sm text-text-secondary">
            Total integrations
          </div>
        </div>

        <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Setup Time</p>
              <p className="text-3xl font-bold text-secondary-500">5m</p>
            </div>
            <div className="bg-secondary-100 p-3 rounded-full">
              <Clock className="text-secondary-500" size={24} />
            </div>
          </div>
          <div className="mt-3 text-sm text-text-secondary">Average setup</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-surface rounded-lg shadow-sm border border-border p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary"
              size={20}
            />
            <input
              type="text"
              placeholder="Search integrations..."
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-bg-primary text-text-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter Dropdown */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center space-x-2 px-4 py-2.5 border border-border rounded-lg hover:bg-surface-hover transition-colors text-text-primary min-w-[180px] justify-between"
            >
              <div className="flex items-center space-x-2">
                <Filter size={18} />
                <span className="text-sm font-medium">
                  {categories.find((c) => c.id === selectedCategory)?.name ||
                    'All Integrations'}
                </span>
              </div>
              <ChevronDown
                size={16}
                className={`transition-transform ${isFilterOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isFilterOpen && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-surface border border-border rounded-lg shadow-lg z-10 py-2">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-xs font-medium text-text-secondary uppercase">
                    Filter by Category
                  </p>
                </div>
                <div className="max-h-96 overflow-y-auto">
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
                        className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-surface-hover transition-colors ${
                          isSelected
                            ? 'bg-primary-50 dark:bg-primary-900/20'
                            : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon
                            size={18}
                            className={
                              isSelected
                                ? 'text-primary-600'
                                : 'text-text-secondary'
                            }
                          />
                          <span
                            className={`text-sm ${isSelected ? 'text-primary-600 font-medium' : 'text-text-primary'}`}
                          >
                            {category.name}
                          </span>
                        </div>
                        {isSelected && (
                          <Check size={16} className="text-primary-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="px-4 py-2 border-t border-border">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showConnected}
                      onChange={(e) => setShowConnected(e.target.checked)}
                      className="rounded border-border text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-text-primary">
                      Show connected only
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Featured/Recommended Section */}
      {!showConnected && selectedCategory === 'all' && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center space-x-2 mb-4">
            <Star className="text-primary-600" size={20} />
            <h2 className="text-lg font-semibold text-text-primary">
              Recommended for Construction Teams
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {integrations
              .filter((i) => i.recommended && !i.connected)
              .slice(0, 3)
              .map((integration) => (
                <div
                  key={integration.id}
                  className="bg-surface p-4 rounded-lg border border-blue-200"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="text-2xl">{integration.logo}</div>
                    <div>
                      <h3 className="font-medium text-text-primary">
                        {integration.name}
                      </h3>
                      <div className="flex items-center space-x-1">
                        <Star
                          className="text-yellow-400 fill-current"
                          size={12}
                        />
                        <span className="text-xs text-text-secondary">
                          {integration.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-text-secondary mb-3">
                    {integration.description}
                  </p>
                  <button
                    onClick={() =>
                      handleConnect(integration.id, integration.name)
                    }
                    className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Connect Now
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredIntegrations.map((integration) => (
          <div
            key={integration.id}
            className="bg-surface rounded-lg shadow-sm border border-border hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="text-3xl">{integration.logo}</div>
                    <h3 className="text-lg font-semibold text-text-primary">
                      {integration.name}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    {integration.popular && (
                      <span className="bg-success-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        Popular
                      </span>
                    )}
                    {integration.recommended && (
                      <span className="bg-primary-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        Recommended
                      </span>
                    )}
                    {integration.connected && (
                      <span className="bg-bg-secondary text-text-primary text-xs px-2 py-1 rounded-full">
                        Connected
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-text-secondary mb-4 text-sm">
                {integration.description}
              </p>

              {/* Features */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-text-primary mb-2">
                  Key Features
                </h4>
                <ul className="space-y-1">
                  {integration.features.slice(0, 3).map((feature, index) => (
                    <li
                      key={index}
                      className="text-sm text-text-secondary flex items-center space-x-2"
                    >
                      <div className="w-1.5 h-1.5 bg-success-500 rounded-full"></div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Data Sync */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-text-primary mb-2">
                  Data Sync
                </h4>
                <div className="flex flex-wrap gap-1">
                  {integration.dataSync.slice(0, 3).map((data, index) => (
                    <span
                      key={index}
                      className="bg-bg-secondary text-text-primary text-xs px-2 py-1 rounded"
                    >
                      {data}
                    </span>
                  ))}
                  {integration.dataSync.length > 3 && (
                    <span className="text-xs text-text-secondary">
                      +{integration.dataSync.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Setup Info */}
              <div className="flex items-center justify-between text-sm text-text-secondary mb-4">
                <div className="flex items-center space-x-1">
                  <Clock size={14} />
                  <span>{integration.setupTime} setup</span>
                </div>
                <span className="font-medium text-success-600">
                  {integration.pricing}
                </span>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                {integration.connected ? (
                  <>
                    <button className="flex-1 bg-bg-secondary text-text-primary px-4 py-2 rounded-lg hover:bg-bg-tertiary transition-colors flex items-center justify-center space-x-2">
                      <Settings size={16} />
                      <span>Configure</span>
                    </button>
                    <button
                      onClick={() => handleDisconnect(integration.id)}
                      className="px-3 py-2 border border-red-300 text-error-600 rounded-lg hover:bg-error-50 transition-colors"
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
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Plus size={16} />
                      <span>Connect</span>
                    </button>
                    <button className="px-3 py-2 border border-border rounded-lg hover:bg-bg-secondary transition-colors">
                      <ExternalLink size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredIntegrations.length === 0 && (
        <div className="bg-surface rounded-lg shadow-sm border border-border p-12 text-center">
          <Search size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-text-primary mb-2">
            No integrations found
          </h3>
          <p className="text-text-secondary">
            Try adjusting your search terms or category filters
          </p>
        </div>
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
