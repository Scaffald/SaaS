import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Users,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  FileText,
  AlertTriangle,
  DollarSign,
  Building,
  Award,
  Clock,
  BarChart3,
  Handshake,
} from 'lucide-react';
import ForsuredLogo from '../Common/ForsuredLogo';
import Button from '../Common/Button';
import { useUser } from '../../contexts/UserContext';
import { User } from '../../types';

export default function HomePage() {
  const navigate = useNavigate();
  const { setCurrentUser } = useUser();

  const handleGetStarted = (role: 'manager' | 'subcontractor' | 'broker') => {
    const mockUser: User = {
      id: '1',
      name:
        role === 'manager'
          ? 'Steve Massei'
          : role === 'subcontractor'
            ? 'Mike Rodriguez'
            : 'Jennifer Walsh',
      email:
        role === 'manager'
          ? 'steve@masseiconstruction.com'
          : role === 'subcontractor'
            ? 'mike@contractor.com'
            : 'jennifer@insurancebroker.com',
      role: role,
      company:
        role === 'manager'
          ? 'MRC'
          : role === 'subcontractor'
            ? 'Rodriguez Construction LLC'
            : 'Walsh Insurance Partners',
      avatar: '',
    };

    setCurrentUser(mockUser);
    navigate(`/${role}/onboarding`);
  };
  const features = [
    {
      icon: Shield,
      title: 'AI-Powered Compliance',
      description:
        'Automatically verify COIs, licenses, and bonds with advanced OCR and fraud detection',
    },
    {
      icon: TrendingUp,
      title: 'Real-Time Risk Monitoring',
      description:
        'Live compliance dashboards with renewal alerts and safety record tracking',
    },
    {
      icon: DollarSign,
      title: 'Embedded Insurance Marketplace',
      description:
        'Purchase coverage directly in-platform with instant COI issuance',
    },
    {
      icon: AlertTriangle,
      title: 'Predictive Alerts',
      description:
        'AI notifications for policy expirations and regulatory changes',
    },
    {
      icon: Building,
      title: 'Construction Tech Integration',
      description:
        'Seamless sync with Procore, Autodesk, Sage, and accounting platforms',
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description:
        'Compliance heatmaps, risk trends, and exportable audit reports',
    },
  ];

  const stats = [
    { value: '500+', label: 'Construction Companies' },
    { value: '10,000+', label: 'Contractors Verified' },
    { value: '99.8%', label: 'Accuracy Rate' },
    { value: '60%', label: 'Time Savings' },
  ];

  return (
    <div className="min-h-screen bg-bg-secondary">
      {/* Header */}
      <header className="bg-surface border-b border-border shadow-sm backdrop-blur-sm bg-opacity-90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <ForsuredLogo className="h-7" />
            <nav className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className="text-text-secondary hover:text-primary-500 transition-colors font-medium"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-text-secondary hover:text-primary-500 transition-colors font-medium"
              >
                Pricing
              </a>
              <a
                href="#about"
                className="text-text-secondary hover:text-primary-500 transition-colors font-medium"
              >
                About
              </a>
              <Button
                onClick={() => navigate('/colors')}
                variant="ghost"
                className="text-primary-500 hover:text-primary-600"
              >
                Design System
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Quick Testing Links - Development Helper */}
      <div className="bg-warning-50 dark:bg-warning-900/20 earth:bg-orange-100 border-b border-warning-200 dark:border-warning-800 earth:border-orange-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm font-medium text-warning-800 dark:text-warning-300 earth:text-orange-800">
              Quick Links:
            </span>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate('/manager/onboarding')}
                className="text-xs"
              >
                Manager Onboarding
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate('/subcontractor/onboarding')}
                className="text-xs"
              >
                Subcontractor Onboarding
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate('/broker/onboarding')}
                className="text-xs"
              >
                Broker Onboarding
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate('/manager/dashboard')}
                className="text-xs"
              >
                Manager Dashboard
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate('/subcontractor/dashboard')}
                className="text-xs"
              >
                Subcontractor Dashboard
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate('/broker/dashboard')}
                className="text-xs"
              >
                Broker Dashboard
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate('/colors')}
                className="text-xs"
              >
                Colors/UI Kit
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section - Dynamic theme-aware backgrounds */}
      <section className="relative py-24 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 earth:from-orange-900 earth:via-orange-800 earth:to-orange-700">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary-400 blur-3xl dark:bg-blue-500 earth:bg-orange-400"></div>
          <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-primary-600 blur-3xl dark:bg-blue-600 earth:bg-yellow-500"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center">
            <h1 className="font-display text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
              Construction Compliance
              <span className="block text-primary-300 dark:text-primary-400 earth:text-orange-300">
                Built for the Field
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 dark:text-slate-200 earth:text-orange-50 mb-12 max-w-3xl mx-auto leading-relaxed">
              AI-powered contractor vetting, real-time risk monitoring, and
              instant insurance coverage. From the job site to the back office.
            </p>

            {/* Primary CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Button
                onClick={() => handleGetStarted('manager')}
                variant="primary"
                size="lg"
                leftIcon={Users}
                rightIcon={ArrowRight}
                iconSize={24}
                className="min-w-64 transform hover:scale-105 hover:-translate-y-1"
              >
                For Managers
              </Button>
              <Button
                onClick={() => handleGetStarted('subcontractor')}
                variant="secondary"
                size="lg"
                leftIcon={Award}
                rightIcon={ArrowRight}
                iconSize={24}
                className="min-w-64 transform hover:scale-105 hover:-translate-y-1"
              >
                For Subcontractors
              </Button>
              <Button
                onClick={() => handleGetStarted('broker')}
                size="lg"
                leftIcon={Handshake}
                rightIcon={ArrowRight}
                iconSize={24}
                className="bg-text-primary hover:bg-text-primary min-w-64 transform hover:scale-105 hover:-translate-y-1"
              >
                For Brokers
              </Button>
            </div>

            {/* Value Props */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <div className="bg-surface p-8 rounded-xl shadow-md border border-border hover:shadow-xl hover:border-primary-300 dark:hover:border-blue-500 earth:hover:border-orange-400 transition-all duration-300 hover:-translate-y-1">
                <Shield
                  className="text-primary-500 dark:text-blue-500 earth:text-orange-500 mb-4 mx-auto"
                  size={40}
                />
                <h3 className="font-display font-semibold text-text-primary mb-2 text-lg">
                  Automated Verification
                </h3>
                <p className="text-text-secondary">
                  AI-powered document verification with 99.8% accuracy
                </p>
              </div>
              <div className="bg-surface p-8 rounded-xl shadow-md border border-border hover:shadow-xl hover:border-secondary-300 dark:hover:border-teal-500 earth:hover:border-yellow-500 transition-all duration-300 hover:-translate-y-1">
                <Clock
                  className="text-secondary-500 dark:text-teal-500 earth:text-yellow-600 mb-4 mx-auto"
                  size={40}
                />
                <h3 className="font-display font-semibold text-text-primary mb-2 text-lg">
                  Save 60% Time
                </h3>
                <p className="text-text-secondary">
                  Reduce compliance management from hours to minutes
                </p>
              </div>
              <div className="bg-surface p-8 rounded-xl shadow-md border border-border hover:shadow-xl hover:border-warning-300 dark:hover:border-yellow-500 earth:hover:border-orange-300 transition-all duration-300 hover:-translate-y-1">
                <DollarSign
                  className="text-warning-500 dark:text-yellow-500 earth:text-orange-400 mb-4 mx-auto"
                  size={40}
                />
                <h3 className="font-display font-semibold text-text-primary mb-2 text-lg">
                  Instant Coverage
                </h3>
                <p className="text-text-secondary">
                  Purchase insurance and get COIs issued immediately
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Theme-aware dark backgrounds */}
      <section className="py-20 bg-gray-900 dark:bg-gray-950 earth:bg-orange-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500 dark:bg-blue-500 earth:bg-orange-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary-500 dark:bg-teal-500 earth:bg-yellow-500 rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Trusted by Construction Leaders
            </h2>
            <p className="text-gray-300 dark:text-gray-400 earth:text-orange-200 text-xl">
              Join thousands of construction professionals building with
              confidence
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="font-display text-5xl md:text-6xl font-bold text-primary-400 dark:text-blue-400 earth:text-orange-400 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-400 dark:text-gray-500 earth:text-orange-300 text-lg">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-text-primary mb-6">
              Built for Construction
            </h2>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
              From automated document verification to predictive risk
              monitoring, Forsured delivers comprehensive compliance management
              designed for the field.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-surface p-8 rounded-xl border-2 border-border hover:border-primary-500 dark:hover:border-blue-500 earth:hover:border-orange-500 hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="bg-primary-100 dark:bg-blue-100 earth:bg-orange-100 w-14 h-14 rounded-xl flex items-center justify-center mb-5 group-hover:bg-primary-500 dark:group-hover:bg-blue-500 earth:group-hover:bg-orange-500 transition-colors">
                    <Icon
                      className="text-primary-600 dark:text-blue-600 earth:text-orange-600 group-hover:text-white transition-colors"
                      size={28}
                    />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-text-primary mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-text-secondary leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-24 bg-bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Construction Managers */}
            <div className="bg-surface p-8 rounded-xl shadow-lg border-2 border-border hover:border-primary-500 dark:hover:border-blue-500 earth:hover:border-orange-500 transition-all duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-primary-100 dark:bg-blue-100 earth:bg-orange-100 p-3 rounded-xl">
                  <Users
                    className="text-primary-600 dark:text-blue-600 earth:text-orange-600"
                    size={28}
                  />
                </div>
                <h3 className="font-display text-2xl font-bold text-text-primary">
                  For Managers
                </h3>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start space-x-3">
                  <CheckCircle
                    className="text-primary-500 mt-1 flex-shrink-0"
                    size={20}
                  />
                  <span className="text-text-secondary">
                    Automatically verify subcontractor compliance across all
                    projects
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle
                    className="text-primary-500 mt-1 flex-shrink-0"
                    size={20}
                  />
                  <span className="text-text-secondary">
                    Real-time risk monitoring with predictive alerts
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle
                    className="text-primary-500 mt-1 flex-shrink-0"
                    size={20}
                  />
                  <span className="text-text-secondary">
                    Generate compliance reports for audits and stakeholders
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle
                    className="text-primary-500 mt-1 flex-shrink-0"
                    size={20}
                  />
                  <span className="text-text-secondary">
                    Integrate with existing construction management tools
                  </span>
                </li>
              </ul>
              <Button
                onClick={() => handleGetStarted('manager')}
                variant="primary"
                rightIcon={ArrowRight}
                iconSize={18}
                fullWidth
              >
                Get Started
              </Button>
            </div>

            {/* Subcontractors */}
            <div className="bg-surface p-8 rounded-xl shadow-lg border-2 border-border hover:border-secondary-500 dark:hover:border-teal-500 earth:hover:border-yellow-500 transition-all duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-secondary-100 dark:bg-teal-100 earth:bg-yellow-100 p-3 rounded-xl">
                  <Award
                    className="text-secondary-600 dark:text-teal-600 earth:text-yellow-700"
                    size={28}
                  />
                </div>
                <h3 className="font-display text-2xl font-bold text-text-primary">
                  For Subcontractors
                </h3>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start space-x-3">
                  <CheckCircle
                    className="text-secondary-500 mt-1 flex-shrink-0"
                    size={20}
                  />
                  <span className="text-text-secondary">
                    Upload documents and get instant compliance scoring
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle
                    className="text-secondary-500 mt-1 flex-shrink-0"
                    size={20}
                  />
                  <span className="text-text-secondary">
                    Receive personalized insurance recommendations
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle
                    className="text-secondary-500 mt-1 flex-shrink-0"
                    size={20}
                  />
                  <span className="text-text-secondary">
                    Purchase coverage and get COIs issued instantly
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle
                    className="text-secondary-500 mt-1 flex-shrink-0"
                    size={20}
                  />
                  <span className="text-text-secondary">
                    Track renewal dates and maintain compliance status
                  </span>
                </li>
              </ul>
              <Button
                onClick={() => handleGetStarted('subcontractor')}
                variant="secondary"
                rightIcon={ArrowRight}
                iconSize={18}
                fullWidth
              >
                Get Started
              </Button>
            </div>

            {/* Insurance Brokers */}
            <div className="bg-surface p-8 rounded-xl shadow-lg border-2 border-border hover:border-gray-600 dark:hover:border-gray-400 earth:hover:border-orange-600 transition-all duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-gray-100 dark:bg-gray-700 earth:bg-orange-100 p-3 rounded-xl">
                  <Handshake
                    className="text-gray-700 dark:text-gray-300 earth:text-orange-700"
                    size={28}
                  />
                </div>
                <h3 className="font-display text-2xl font-bold text-text-primary">
                  For Brokers
                </h3>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start space-x-3">
                  <CheckCircle
                    className="text-text-secondary mt-1 flex-shrink-0"
                    size={20}
                  />
                  <span className="text-text-secondary">
                    Access qualified construction leads with verified needs
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle
                    className="text-text-secondary mt-1 flex-shrink-0"
                    size={20}
                  />
                  <span className="text-text-secondary">
                    Streamline quote generation and policy management
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle
                    className="text-text-secondary mt-1 flex-shrink-0"
                    size={20}
                  />
                  <span className="text-text-secondary">
                    Automated COI generation and compliance tracking
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle
                    className="text-text-secondary mt-1 flex-shrink-0"
                    size={20}
                  />
                  <span className="text-text-secondary">
                    Expand your construction industry client base
                  </span>
                </li>
              </ul>
              <Button
                onClick={() => handleGetStarted('broker')}
                rightIcon={ArrowRight}
                iconSize={18}
                fullWidth
                className="bg-text-primary hover:bg-text-primary"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Theme-aware vibrant gradients */}
      <section className="py-24 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 dark:from-blue-700 dark:via-blue-800 dark:to-gray-900 earth:from-orange-600 earth:via-orange-700 earth:to-orange-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-secondary-500 dark:bg-teal-500 earth:bg-yellow-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-warning-500 dark:bg-blue-400 earth:bg-orange-400 rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Build with Confidence?
          </h2>
          <p className="text-xl md:text-2xl text-primary-100 dark:text-blue-100 earth:text-orange-100 mb-12 leading-relaxed">
            Join thousands of construction professionals managing compliance the
            modern way.
          </p>
        </div>
      </section>

      {/* Footer - Theme-aware dark backgrounds */}
      <footer className="bg-gray-900 dark:bg-gray-950 earth:bg-orange-950 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div>
              <ForsuredLogo className="h-8 mb-6" color="white" />
              <p className="text-gray-400 dark:text-gray-500 earth:text-orange-300 leading-relaxed">
                AI-powered compliance and insurance management for the
                construction industry.
              </p>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-4 text-white">
                Product
              </h4>
              <ul className="space-y-3 text-gray-400 dark:text-gray-500 earth:text-orange-300">
                <li>
                  <a
                    href="#"
                    className="hover:text-primary-400 dark:hover:text-blue-400 earth:hover:text-orange-400 transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary-400 dark:hover:text-blue-400 earth:hover:text-orange-400 transition-colors"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary-400 dark:hover:text-blue-400 earth:hover:text-orange-400 transition-colors"
                  >
                    Integrations
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary-400 dark:hover:text-blue-400 earth:hover:text-orange-400 transition-colors"
                  >
                    API
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-4 text-white">
                Company
              </h4>
              <ul className="space-y-3 text-gray-400 dark:text-gray-500 earth:text-orange-300">
                <li>
                  <a
                    href="#"
                    className="hover:text-primary-400 dark:hover:text-blue-400 earth:hover:text-orange-400 transition-colors"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary-400 dark:hover:text-blue-400 earth:hover:text-orange-400 transition-colors"
                  >
                    Careers
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary-400 dark:hover:text-blue-400 earth:hover:text-orange-400 transition-colors"
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary-400 dark:hover:text-blue-400 earth:hover:text-orange-400 transition-colors"
                  >
                    Blog
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-4 text-white">
                Support
              </h4>
              <ul className="space-y-3 text-gray-400 dark:text-gray-500 earth:text-orange-300">
                <li>
                  <a
                    href="#"
                    className="hover:text-primary-400 dark:hover:text-blue-400 earth:hover:text-orange-400 transition-colors"
                  >
                    Help Center
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary-400 dark:hover:text-blue-400 earth:hover:text-orange-400 transition-colors"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary-400 dark:hover:text-blue-400 earth:hover:text-orange-400 transition-colors"
                  >
                    Status
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary-400 dark:hover:text-blue-400 earth:hover:text-orange-400 transition-colors"
                  >
                    Security
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 dark:border-gray-900 earth:border-orange-900 mt-12 pt-8 text-center text-gray-400 dark:text-gray-500 earth:text-orange-300">
            <p>&copy; 2024 Forsured. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
