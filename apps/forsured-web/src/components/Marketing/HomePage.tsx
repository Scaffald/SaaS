import { useNavigate } from 'react-router-dom'
import {
  Shield,
  Users,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  AlertTriangle,
  DollarSign,
  Building,
  Award,
  Clock,
  BarChart3,
  Handshake,
} from 'lucide-react'
import { Stack, Row, Text, Card } from '@unicornlove/beyond-ui'
import ForsuredLogo from '../Common/ForsuredLogo'
import Button from '../Common/Button'
import { useUser } from '../../contexts/UserContext'
import type { User } from '../../types'

export default function HomePage() {
  const navigate = useNavigate()
  const { setCurrentUser } = useUser()

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
    }

    setCurrentUser(mockUser)
    navigate(`/${role}/onboarding`)
  }
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
      description: 'Live compliance dashboards with renewal alerts and safety record tracking',
    },
    {
      icon: DollarSign,
      title: 'Embedded Insurance Marketplace',
      description: 'Purchase coverage directly in-platform with instant COI issuance',
    },
    {
      icon: AlertTriangle,
      title: 'Predictive Alerts',
      description: 'AI notifications for policy expirations and regulatory changes',
    },
    {
      icon: Building,
      title: 'Construction Tech Integration',
      description: 'Seamless sync with Procore, Autodesk, Sage, and accounting platforms',
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Compliance heatmaps, risk trends, and exportable audit reports',
    },
  ]

  const stats = [
    { value: '500+', label: 'Construction Companies' },
    { value: '10,000+', label: 'Contractors Verified' },
    { value: '99.8%', label: 'Accuracy Rate' },
    { value: '60%', label: 'Time Savings' },
  ]

  return (
    <Stack style={{ minHeight: '100vh', backgroundColor: 'var(--color-background-hover)' }}>
      {/* Header */}
      <header
        style={{
          backgroundColor: 'var(--color-background)',
          borderBottom: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
          opacity: 0.9,
        }}
      >
        <Row
          style={{
            maxWidth: 1280,
            marginLeft: 'auto',
            marginRight: 'auto',
            paddingLeft: 'var(--space-4)',
            paddingRight: 'var(--space-4)',
          }}
        >
          <Row style={{ alignItems: 'center', justifyContent: 'space-between', height: 80 }}>
            <ForsuredLogo height={28} />
            <nav
              style={{
                display: 'none',
                alignItems: 'center',
                gap: 'var(--space-8)',
              }}
              className="nav-desktop"
            >
              <a
                href="#features"
                style={{
                  color: 'var(--color-text-tertiary)',
                  fontWeight: '500',
                  textDecoration: 'none',
                }}
              >
                Features
              </a>
              <a
                href="#pricing"
                style={{
                  color: 'var(--color-text-tertiary)',
                  fontWeight: '500',
                  textDecoration: 'none',
                }}
              >
                Pricing
              </a>
              <a
                href="#about"
                style={{
                  color: 'var(--color-text-tertiary)',
                  fontWeight: '500',
                  textDecoration: 'none',
                }}
              >
                About
              </a>
              <button
                onClick={() => navigate('/colors')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-blue-10)',
                  cursor: 'pointer',
                }}
              >
                Design System
              </button>
            </nav>
          </Row>
        </Row>
      </header>

      {/* Quick Testing Links - Development Helper */}
      <Stack style={{ backgroundColor: 'var(--color-yellow-2)', borderBottom: '1px solid var(--color-yellow-6)' }}>
        <Row
          style={{
            maxWidth: 1280,
            marginLeft: 'auto',
            marginRight: 'auto',
            paddingLeft: 'var(--space-4)',
            paddingRight: 'var(--space-4)',
            paddingTop: 'var(--space-3)',
            paddingBottom: 'var(--space-3)',
          }}
        >
          <Row style={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: '500', color: 'var(--color-yellow-12)' }}>
              Quick Links:
            </Text>
            <Row style={{ flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              <button
                onClick={() => navigate('/manager/onboarding')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 'var(--font-size-2)',
                  color: 'var(--color-yellow-12)',
                  cursor: 'pointer',
                }}
              >
                Manager Onboarding
              </button>
              <button
                onClick={() => navigate('/subcontractor/onboarding')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 'var(--font-size-2)',
                  color: 'var(--color-yellow-12)',
                  cursor: 'pointer',
                }}
              >
                Subcontractor Onboarding
              </button>
              <button
                onClick={() => navigate('/broker/onboarding')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 'var(--font-size-2)',
                  color: 'var(--color-yellow-12)',
                  cursor: 'pointer',
                }}
              >
                Broker Onboarding
              </button>
              <button
                onClick={() => navigate('/manager/dashboard')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 'var(--font-size-2)',
                  color: 'var(--color-yellow-12)',
                  cursor: 'pointer',
                }}
              >
                Manager Dashboard
              </button>
              <button
                onClick={() => navigate('/subcontractor/dashboard')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 'var(--font-size-2)',
                  color: 'var(--color-yellow-12)',
                  cursor: 'pointer',
                }}
              >
                Subcontractor Dashboard
              </button>
              <button
                onClick={() => navigate('/broker/dashboard')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 'var(--font-size-2)',
                  color: 'var(--color-yellow-12)',
                  cursor: 'pointer',
                }}
              >
                Broker Dashboard
              </button>
              <button
                onClick={() => navigate('/colors')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 'var(--font-size-2)',
                  color: 'var(--color-yellow-12)',
                  cursor: 'pointer',
                }}
              >
                Colors/UI Kit
              </button>
            </Row>
          </Row>
        </Row>
      </Stack>

      {/* Hero Section - Dynamic theme-aware backgrounds */}
      <section style={{ position: 'relative', paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-12)', backgroundColor: 'var(--color-blue-12)' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1 }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '33%',
              height: '33%',
              backgroundColor: 'var(--color-blue-9)',
              opacity: 0.5,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '33%',
              height: '33%',
              backgroundColor: 'var(--color-blue-10)',
              opacity: 0.5,
            }}
          />
        </div>
        <Stack
          style={{
            maxWidth: 1280,
            marginLeft: 'auto',
            marginRight: 'auto',
            paddingLeft: 'var(--space-4)',
            paddingRight: 'var(--space-4)',
            position: 'relative',
          }}
        >
          <Stack style={{ alignItems: 'center' }}>
            <h1
              style={{
                fontSize: 'var(--font-size-10)',
                fontWeight: '700',
                color: 'white',
                marginBottom: 'var(--space-6)',
                letterSpacing: '-0.02em',
                textAlign: 'center',
              }}
            >
              Construction Compliance
              <span style={{ display: 'block', color: 'var(--color-blue-4)' }}>
                Built for the Field
              </span>
            </h1>
            <Text
              style={{
                fontSize: 'var(--font-size-6)',
                color: 'rgba(255,255,255,0.9)',
                marginBottom: 'var(--space-12)',
                maxWidth: 768,
                marginLeft: 'auto',
                marginRight: 'auto',
                lineHeight: 1.6,
                textAlign: 'center',
              }}
            >
              AI-powered contractor vetting, real-time risk monitoring, and instant insurance
              coverage. From the job site to the back office.
            </Text>

            {/* Primary CTAs */}
            <Row
              style={{
                flexDirection: 'column',
                gap: 'var(--space-4)',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 'var(--space-10)',
              }}
            >
              <Button
                onPress={() => handleGetStarted('manager')}
                variant="primary"
                size="lg"
                leftIcon={Users}
                rightIcon={ArrowRight}
                iconSize={24}
                style={{ minWidth: 256 }}
              >
                For Managers
              </Button>
              <Button
                onPress={() => handleGetStarted('subcontractor')}
                variant="secondary"
                size="lg"
                leftIcon={Award}
                rightIcon={ArrowRight}
                iconSize={24}
                style={{ minWidth: 256 }}
              >
                For Subcontractors
              </Button>
              <Button
                onPress={() => handleGetStarted('broker')}
                size="lg"
                leftIcon={Handshake}
                rightIcon={ArrowRight}
                iconSize={24}
                style={{ minWidth: 256, backgroundColor: 'var(--color-gray-12)' }}
              >
                For Brokers
              </Button>
            </Row>

            {/* Value Props */}
            <Row style={{ flexWrap: 'wrap', gap: 'var(--space-6)', maxWidth: 1024, marginLeft: 'auto', marginRight: 'auto' }}>
              <Card
                style={{
                  backgroundColor: 'var(--color-background)',
                  padding: 'var(--space-8)',
                  borderRadius: 'var(--radius-4)',
                  boxShadow: 'var(--shadow-md)',
                  borderWidth: 1,
                  borderColor: 'var(--color-border)',
                  flex: 1,
                  minWidth: '45%',
                }}
              >
                <Shield size={40} color="var(--color-blue-10)" style={{ marginBottom: 'var(--space-4)' }} />
                <h3 style={{ fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)', fontSize: 'var(--font-size-6)' }}>
                  Automated Verification
                </h3>
                <Text style={{ color: 'var(--color-text-tertiary)' }}>AI-powered document verification with 99.8% accuracy</Text>
              </Card>
              <Card
                style={{
                  backgroundColor: 'var(--color-background)',
                  padding: 'var(--space-8)',
                  borderRadius: 'var(--radius-4)',
                  boxShadow: 'var(--shadow-md)',
                  borderWidth: 1,
                  borderColor: 'var(--color-border)',
                  flex: 1,
                  minWidth: '45%',
                }}
              >
                <Clock size={40} color="var(--color-gray-10)" style={{ marginBottom: 'var(--space-4)' }} />
                <h3 style={{ fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)', fontSize: 'var(--font-size-6)' }}>
                  Save 60% Time
                </h3>
                <Text style={{ color: 'var(--color-text-tertiary)' }}>Reduce compliance management from hours to minutes</Text>
              </Card>
              <Card
                style={{
                  backgroundColor: 'var(--color-background)',
                  padding: 'var(--space-8)',
                  borderRadius: 'var(--radius-4)',
                  boxShadow: 'var(--shadow-md)',
                  borderWidth: 1,
                  borderColor: 'var(--color-border)',
                  flex: 1,
                  minWidth: '45%',
                }}
              >
                <DollarSign size={40} color="var(--color-yellow-10)" style={{ marginBottom: 'var(--space-4)' }} />
                <h3 style={{ fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)', fontSize: 'var(--font-size-6)' }}>
                  Instant Coverage
                </h3>
                <Text style={{ color: 'var(--color-text-tertiary)' }}>Purchase insurance and get COIs issued immediately</Text>
              </Card>
            </Row>
          </Stack>
        </Stack>
      </section>

      {/* Stats Section - Theme-aware dark backgrounds */}
      <section
        style={{
          paddingTop: 'var(--space-10)',
          paddingBottom: 'var(--space-10)',
          backgroundColor: 'var(--color-gray-12)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1 }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '25%',
              width: 384,
              height: 384,
              backgroundColor: 'var(--color-blue-10)',
              borderRadius: 9999,
              opacity: 0.5,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: '25%',
              width: 384,
              height: 384,
              backgroundColor: 'var(--color-gray-10)',
              borderRadius: 9999,
              opacity: 0.5,
            }}
          />
        </div>
        <Stack
          style={{
            maxWidth: 1280,
            marginLeft: 'auto',
            marginRight: 'auto',
            paddingLeft: 'var(--space-4)',
            paddingRight: 'var(--space-4)',
            position: 'relative',
          }}
        >
          <Stack style={{ alignItems: 'center', marginBottom: 'var(--space-10)' }}>
            <h2 style={{ fontSize: 'var(--font-size-9)', fontWeight: '700', marginBottom: 'var(--space-4)', color: 'white' }}>
              Trusted by Construction Leaders
            </h2>
            <Text style={{ fontSize: 'var(--font-size-6)', color: 'rgba(255,255,255,0.7)' }}>
              Join thousands of construction professionals building with confidence
            </Text>
          </Stack>
          <Row style={{ flexWrap: 'wrap', gap: 'var(--space-8)' }}>
            {stats.map((stat, index) => (
              <Stack
                key={index}
                style={{
                  alignItems: 'center',
                  flex: 1,
                  minWidth: '45%',
                }}
              >
                <Text
                  style={{
                    fontSize: 'var(--font-size-10)',
                    fontWeight: '700',
                    color: 'var(--color-blue-9)',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  {stat.value}
                </Text>
                <Text style={{ fontSize: 'var(--font-size-6)', color: 'rgba(255,255,255,0.6)' }}>
                  {stat.label}
                </Text>
              </Stack>
            ))}
          </Row>
        </Stack>
      </section>

      {/* Features Section */}
      <section id="features" style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-12)', backgroundColor: 'var(--color-background)' }}>
        <Stack
          style={{
            maxWidth: 1280,
            marginLeft: 'auto',
            marginRight: 'auto',
            paddingLeft: 'var(--space-4)',
            paddingRight: 'var(--space-4)',
          }}
        >
          <Stack style={{ alignItems: 'center', marginBottom: 'var(--space-10)' }}>
            <h2
              style={{
                fontSize: 'var(--font-size-9)',
                fontWeight: '700',
                color: 'var(--color-text-primary)',
                marginBottom: 'var(--space-6)',
              }}
            >
              Built for Construction
            </h2>
            <Text
              style={{
                fontSize: 'var(--font-size-6)',
                color: 'var(--color-text-tertiary)',
                maxWidth: 768,
                marginLeft: 'auto',
                marginRight: 'auto',
                lineHeight: 1.6,
                textAlign: 'center',
              }}
            >
              From automated document verification to predictive risk monitoring, Forsured delivers
              comprehensive compliance management designed for the field.
            </Text>
          </Stack>

          <Row style={{ flexWrap: 'wrap', gap: 'var(--space-8)' }}>
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card
                  key={index}
                  style={{
                    backgroundColor: 'var(--color-background)',
                    padding: 'var(--space-8)',
                    borderRadius: 'var(--radius-4)',
                    borderWidth: 2,
                    borderColor: 'var(--color-border)',
                    flex: 1,
                    minWidth: '45%',
                  }}
                >
                  <Row
                    style={{
                      backgroundColor: 'var(--color-blue-2)',
                      width: 56,
                      height: 56,
                      borderRadius: 'var(--radius-4)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 'var(--space-5)',
                    }}
                  >
                    <Icon size={28} color="var(--color-blue-11)" />
                  </Row>
                  <h3 style={{ fontSize: 'var(--font-size-6)', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: 'var(--space-3)' }}>
                    {feature.title}
                  </h3>
                  <Text style={{ color: 'var(--color-text-tertiary)', lineHeight: 1.6 }}>
                    {feature.description}
                  </Text>
                </Card>
              )
            })}
          </Row>
        </Stack>
      </section>

      {/* Use Cases Section */}
      <section style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-12)', backgroundColor: 'var(--color-background-hover)' }}>
        <Stack
          style={{
            maxWidth: 1280,
            marginLeft: 'auto',
            marginRight: 'auto',
            paddingLeft: 'var(--space-4)',
            paddingRight: 'var(--space-4)',
          }}
        >
          <Row style={{ flexWrap: 'wrap', gap: 'var(--space-8)' }}>
            {/* Construction Managers */}
            <Card
              style={{
                backgroundColor: 'var(--color-background)',
                padding: 'var(--space-8)',
                borderRadius: 'var(--radius-4)',
                boxShadow: 'var(--shadow-md)',
                borderWidth: 2,
                borderColor: 'var(--color-border)',
                flex: 1,
                minWidth: '45%',
              }}
            >
              <Row style={{ alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
                <Row style={{ backgroundColor: 'var(--color-blue-2)', padding: 'var(--space-3)', borderRadius: 'var(--radius-4)' }}>
                  <Users size={28} color="var(--color-blue-11)" />
                </Row>
                <h3 style={{ fontSize: 'var(--font-size-8)', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                  For Managers
                </h3>
              </Row>
              <Stack style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
                <Row style={{ alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                  <CheckCircle size={20} color="var(--color-blue-10)" style={{ marginTop: 'var(--space-1)', flexShrink: 0 }} />
                  <Text style={{ color: 'var(--color-text-tertiary)' }}>
                    Automatically verify subcontractor compliance across all projects
                  </Text>
                </Row>
                <Row style={{ alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                  <CheckCircle size={20} color="var(--color-blue-10)" style={{ marginTop: 'var(--space-1)', flexShrink: 0 }} />
                  <Text style={{ color: 'var(--color-text-tertiary)' }}>Real-time risk monitoring with predictive alerts</Text>
                </Row>
                <Row style={{ alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                  <CheckCircle size={20} color="var(--color-blue-10)" style={{ marginTop: 'var(--space-1)', flexShrink: 0 }} />
                  <Text style={{ color: 'var(--color-text-tertiary)' }}>
                    Generate compliance reports for audits and stakeholders
                  </Text>
                </Row>
                <Row style={{ alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                  <CheckCircle size={20} color="var(--color-blue-10)" style={{ marginTop: 'var(--space-1)', flexShrink: 0 }} />
                  <Text style={{ color: 'var(--color-text-tertiary)' }}>
                    Integrate with existing construction management tools
                  </Text>
                </Row>
              </Stack>
              <Button
                onPress={() => handleGetStarted('manager')}
                variant="primary"
                rightIcon={ArrowRight}
                iconSize={18}
                fullWidth
              >
                Get Started
              </Button>
            </Card>

            {/* Subcontractors */}
            <Card
              style={{
                backgroundColor: 'var(--color-background)',
                padding: 'var(--space-8)',
                borderRadius: 'var(--radius-4)',
                boxShadow: 'var(--shadow-md)',
                borderWidth: 2,
                borderColor: 'var(--color-border)',
                flex: 1,
                minWidth: '45%',
              }}
            >
              <Row style={{ alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
                <Row style={{ backgroundColor: 'var(--color-gray-2)', padding: 'var(--space-3)', borderRadius: 'var(--radius-4)' }}>
                  <Award size={28} color="var(--color-gray-11)" />
                </Row>
                <h3 style={{ fontSize: 'var(--font-size-8)', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                  For Subcontractors
                </h3>
              </Row>
              <Stack style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
                <Row style={{ alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                  <CheckCircle size={20} color="var(--color-gray-10)" style={{ marginTop: 'var(--space-1)', flexShrink: 0 }} />
                  <Text style={{ color: 'var(--color-text-tertiary)' }}>Upload documents and get instant compliance scoring</Text>
                </Row>
                <Row style={{ alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                  <CheckCircle size={20} color="var(--color-gray-10)" style={{ marginTop: 'var(--space-1)', flexShrink: 0 }} />
                  <Text style={{ color: 'var(--color-text-tertiary)' }}>Receive personalized insurance recommendations</Text>
                </Row>
                <Row style={{ alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                  <CheckCircle size={20} color="var(--color-gray-10)" style={{ marginTop: 'var(--space-1)', flexShrink: 0 }} />
                  <Text style={{ color: 'var(--color-text-tertiary)' }}>Purchase coverage and get COIs issued instantly</Text>
                </Row>
                <Row style={{ alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                  <CheckCircle size={20} color="var(--color-gray-10)" style={{ marginTop: 'var(--space-1)', flexShrink: 0 }} />
                  <Text style={{ color: 'var(--color-text-tertiary)' }}>Track renewal dates and maintain compliance status</Text>
                </Row>
              </Stack>
              <Button
                onPress={() => handleGetStarted('subcontractor')}
                variant="secondary"
                rightIcon={ArrowRight}
                iconSize={18}
                fullWidth
              >
                Get Started
              </Button>
            </Card>

            {/* Insurance Brokers */}
            <Card
              style={{
                backgroundColor: 'var(--color-background)',
                padding: 'var(--space-8)',
                borderRadius: 'var(--radius-4)',
                boxShadow: 'var(--shadow-md)',
                borderWidth: 2,
                borderColor: 'var(--color-border)',
                flex: 1,
                minWidth: '45%',
              }}
            >
              <Row style={{ alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
                <Row style={{ backgroundColor: 'var(--color-gray-2)', padding: 'var(--space-3)', borderRadius: 'var(--radius-4)' }}>
                  <Handshake size={28} color="var(--color-gray-11)" />
                </Row>
                <h3 style={{ fontSize: 'var(--font-size-8)', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                  For Brokers
                </h3>
              </Row>
              <Stack style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
                <Row style={{ alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                  <CheckCircle size={20} color="var(--color-text-tertiary)" style={{ marginTop: 'var(--space-1)', flexShrink: 0 }} />
                  <Text style={{ color: 'var(--color-text-tertiary)' }}>
                    Access qualified construction leads with verified needs
                  </Text>
                </Row>
                <Row style={{ alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                  <CheckCircle size={20} color="var(--color-text-tertiary)" style={{ marginTop: 'var(--space-1)', flexShrink: 0 }} />
                  <Text style={{ color: 'var(--color-text-tertiary)' }}>Streamline quote generation and policy management</Text>
                </Row>
                <Row style={{ alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                  <CheckCircle size={20} color="var(--color-text-tertiary)" style={{ marginTop: 'var(--space-1)', flexShrink: 0 }} />
                  <Text style={{ color: 'var(--color-text-tertiary)' }}>Automated COI generation and compliance tracking</Text>
                </Row>
                <Row style={{ alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                  <CheckCircle size={20} color="var(--color-text-tertiary)" style={{ marginTop: 'var(--space-1)', flexShrink: 0 }} />
                  <Text style={{ color: 'var(--color-text-tertiary)' }}>Expand your construction industry client base</Text>
                </Row>
              </Stack>
              <Button
                onPress={() => handleGetStarted('broker')}
                rightIcon={ArrowRight}
                iconSize={18}
                fullWidth
                style={{ backgroundColor: 'var(--color-gray-12)' }}
              >
                Get Started
              </Button>
            </Card>
          </Row>
        </Stack>
      </section>

      {/* CTA Section - Theme-aware vibrant gradients */}
      <section
        style={{
          paddingTop: 'var(--space-12)',
          paddingBottom: 'var(--space-12)',
          backgroundColor: 'var(--color-blue-11)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1 }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 384,
              height: 384,
              backgroundColor: 'var(--color-gray-10)',
              borderRadius: 9999,
              opacity: 0.5,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: 384,
              height: 384,
              backgroundColor: 'var(--color-yellow-10)',
              borderRadius: 9999,
              opacity: 0.5,
            }}
          />
        </div>
        <Stack
          style={{
            maxWidth: 896,
            marginLeft: 'auto',
            marginRight: 'auto',
            alignItems: 'center',
            paddingLeft: 'var(--space-4)',
            paddingRight: 'var(--space-4)',
            position: 'relative',
          }}
        >
          <h2
            style={{
              fontSize: 'var(--font-size-9)',
              fontWeight: '700',
              color: 'white',
              marginBottom: 'var(--space-6)',
              textAlign: 'center',
            }}
          >
            Ready to Build with Confidence?
          </h2>
          <Text
            style={{
              fontSize: 'var(--font-size-6)',
              color: 'rgba(255,255,255,0.9)',
              marginBottom: 'var(--space-12)',
              lineHeight: 1.6,
              textAlign: 'center',
            }}
          >
            Join thousands of construction professionals managing compliance the modern way.
          </Text>
        </Stack>
      </section>

      {/* Footer - Theme-aware dark backgrounds */}
      <footer style={{ backgroundColor: 'var(--color-gray-12)', color: 'white', paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-8)' }}>
        <Stack
          style={{
            maxWidth: 1280,
            marginLeft: 'auto',
            marginRight: 'auto',
            paddingLeft: 'var(--space-4)',
            paddingRight: 'var(--space-4)',
          }}
        >
          <Row style={{ flexWrap: 'wrap', gap: 'var(--space-12)' }}>
            <Stack style={{ flex: 1, minWidth: '45%' }}>
              <ForsuredLogo height={32} style={{ marginBottom: 'var(--space-6)' }} color="white" />
              <Text style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                AI-powered compliance and insurance management for the construction industry.
              </Text>
            </Stack>
            <Stack style={{ flex: 1, minWidth: '45%' }}>
              <h3 style={{ fontWeight: '600', marginBottom: 'var(--space-4)', color: 'white' }}>
                Product
              </h3>
              <Stack style={{ gap: 'var(--space-3)' }}>
                <a href="#" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Features</a>
                <a href="#" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Pricing</a>
                <a href="#" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Integrations</a>
                <a href="#" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>API</a>
              </Stack>
            </Stack>
            <Stack style={{ flex: 1, minWidth: '45%' }}>
              <h3 style={{ fontWeight: '600', marginBottom: 'var(--space-4)', color: 'white' }}>
                Company
              </h3>
              <Stack style={{ gap: 'var(--space-3)' }}>
                <a href="#" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>About</a>
                <a href="#" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Careers</a>
                <a href="#" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Contact</a>
                <a href="#" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Blog</a>
              </Stack>
            </Stack>
            <Stack style={{ flex: 1, minWidth: '45%' }}>
              <h3 style={{ fontWeight: '600', marginBottom: 'var(--space-4)', color: 'white' }}>
                Support
              </h3>
              <Stack style={{ gap: 'var(--space-3)' }}>
                <a href="#" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Help Center</a>
                <a href="#" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Documentation</a>
                <a href="#" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Status</a>
                <a href="#" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Security</a>
              </Stack>
            </Stack>
          </Row>
          <Stack
            style={{
              borderTop: '1px solid var(--color-gray-11)',
              marginTop: 'var(--space-12)',
              paddingTop: 'var(--space-8)',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.6)' }}>&copy; 2024 Forsured. All rights reserved.</Text>
          </Stack>
        </Stack>
      </footer>
    </Stack>
  )
}
