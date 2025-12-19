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
import { YStack, XStack, Text, H1, H2, H3, Card, Button as TamaguiButton } from '@unicornlove/ui'
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
    <YStack minHeight="100vh" backgroundColor="$backgroundHover">
      {/* Header */}
      <YStack
        as="header"
        backgroundColor="$background"
        borderBottomWidth={1}
        borderColor="$borderColor"
        elevation={1}
        opacity={0.9}
      >
        <XStack
          maxWidth={1280}
          marginHorizontal="auto"
          paddingHorizontal="$4"
          $gtSm={{ paddingHorizontal: '$6' }}
          $gtLg={{ paddingHorizontal: '$8' }}
        >
          <XStack alignItems="center" justifyContent="space-between" height={80}>
            <ForsuredLogo height={28} />
            <XStack
              as="nav"
              display="none"
              $gtMd={{ display: 'flex' }}
              alignItems="center"
              gap="$8"
            >
              <TamaguiButton
                unstyled
                href="#features"
                color="$color11"
                hoverStyle={{ color: '$blue10' }}
                fontWeight="500"
              >
                Features
              </TamaguiButton>
              <TamaguiButton
                unstyled
                href="#pricing"
                color="$color11"
                hoverStyle={{ color: '$blue10' }}
                fontWeight="500"
              >
                Pricing
              </TamaguiButton>
              <TamaguiButton
                unstyled
                href="#about"
                color="$color11"
                hoverStyle={{ color: '$blue10' }}
                fontWeight="500"
              >
                About
              </TamaguiButton>
              <TamaguiButton
                unstyled
                onPress={() => navigate('/colors')}
                color="$blue10"
                hoverStyle={{ color: '$blue11' }}
              >
                Design System
              </TamaguiButton>
            </XStack>
          </XStack>
        </XStack>
      </YStack>

      {/* Quick Testing Links - Development Helper */}
      <YStack backgroundColor="$yellow2" borderBottomWidth={1} borderColor="$yellow6">
        <XStack
          maxWidth={1280}
          marginHorizontal="auto"
          paddingHorizontal="$4"
          $gtSm={{ paddingHorizontal: '$6' }}
          $gtLg={{ paddingHorizontal: '$8' }}
          paddingVertical="$3"
        >
          <XStack alignItems="center" justifyContent="space-between" flexWrap="wrap" gap="$2">
            <Text fontSize="$3" fontWeight="500" color="$yellow12">
              Quick Links:
            </Text>
            <XStack flexWrap="wrap" gap="$2">
              <TamaguiButton
                unstyled
                size="$2"
                onPress={() => navigate('/manager/onboarding')}
                fontSize="$2"
                color="$yellow12"
                hoverStyle={{ color: '$yellow11' }}
              >
                Manager Onboarding
              </TamaguiButton>
              <TamaguiButton
                unstyled
                size="$2"
                onPress={() => navigate('/subcontractor/onboarding')}
                fontSize="$2"
                color="$yellow12"
                hoverStyle={{ color: '$yellow11' }}
              >
                Subcontractor Onboarding
              </TamaguiButton>
              <TamaguiButton
                unstyled
                size="$2"
                onPress={() => navigate('/broker/onboarding')}
                fontSize="$2"
                color="$yellow12"
                hoverStyle={{ color: '$yellow11' }}
              >
                Broker Onboarding
              </TamaguiButton>
              <TamaguiButton
                unstyled
                size="$2"
                onPress={() => navigate('/manager/dashboard')}
                fontSize="$2"
                color="$yellow12"
                hoverStyle={{ color: '$yellow11' }}
              >
                Manager Dashboard
              </TamaguiButton>
              <TamaguiButton
                unstyled
                size="$2"
                onPress={() => navigate('/subcontractor/dashboard')}
                fontSize="$2"
                color="$yellow12"
                hoverStyle={{ color: '$yellow11' }}
              >
                Subcontractor Dashboard
              </TamaguiButton>
              <TamaguiButton
                unstyled
                size="$2"
                onPress={() => navigate('/broker/dashboard')}
                fontSize="$2"
                color="$yellow12"
                hoverStyle={{ color: '$yellow11' }}
              >
                Broker Dashboard
              </TamaguiButton>
              <TamaguiButton
                unstyled
                size="$2"
                onPress={() => navigate('/colors')}
                fontSize="$2"
                color="$yellow12"
                hoverStyle={{ color: '$yellow11' }}
              >
                Colors/UI Kit
              </TamaguiButton>
            </XStack>
          </XStack>
        </XStack>
      </YStack>

      {/* Hero Section - Dynamic theme-aware backgrounds */}
      <YStack as="section" position="relative" paddingVertical="$12" backgroundColor="$blue12">
        <YStack position="absolute" top={0} left={0} right={0} bottom={0} opacity={0.1}>
          <YStack
            position="absolute"
            top={0}
            right={0}
            width="33%"
            height="33%"
            backgroundColor="$blue9"
            opacity={0.5}
          />
          <YStack
            position="absolute"
            bottom={0}
            left={0}
            width="33%"
            height="33%"
            backgroundColor="$blue10"
            opacity={0.5}
          />
        </YStack>
        <YStack
          maxWidth={1280}
          marginHorizontal="auto"
          paddingHorizontal="$4"
          $gtSm={{ paddingHorizontal: '$6' }}
          $gtLg={{ paddingHorizontal: '$8' }}
          position="relative"
        >
          <YStack alignItems="center">
            <H1
              fontSize="$10"
              $gtMd={{ fontSize: '$12' }}
              fontWeight="700"
              color="white"
              marginBottom="$6"
              letterSpacing="-0.02em"
            >
              Construction Compliance
              <Text display="block" color="$blue4">
                Built for the Field
              </Text>
            </H1>
            <Text
              fontSize="$6"
              $gtMd={{ fontSize: '$8' }}
              color="rgba(255,255,255,0.9)"
              marginBottom="$12"
              maxWidth={768}
              marginHorizontal="auto"
              lineHeight={1.6}
            >
              AI-powered contractor vetting, real-time risk monitoring, and instant insurance
              coverage. From the job site to the back office.
            </Text>

            {/* Primary CTAs */}
            <XStack
              flexDirection="column"
              $gtSm={{ flexDirection: 'row' }}
              gap="$4"
              justifyContent="center"
              alignItems="center"
              marginBottom="$10"
            >
              <Button
                onClick={() => handleGetStarted('manager')}
                variant="primary"
                size="lg"
                leftIcon={Users}
                rightIcon={ArrowRight}
                iconSize={24}
                minWidth={256}
                hoverStyle={{ scale: 1.05, y: -4 }}
                animation="quick"
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
                minWidth={256}
                hoverStyle={{ scale: 1.05, y: -4 }}
                animation="quick"
              >
                For Subcontractors
              </Button>
              <Button
                onClick={() => handleGetStarted('broker')}
                size="lg"
                leftIcon={Handshake}
                rightIcon={ArrowRight}
                iconSize={24}
                minWidth={256}
                backgroundColor="$color12"
                hoverStyle={{ scale: 1.05, y: -4, backgroundColor: '$color12' }}
                animation="quick"
              >
                For Brokers
              </Button>
            </XStack>

            {/* Value Props */}
            <XStack flexWrap="wrap" gap="$6" maxWidth={1024} marginHorizontal="auto">
              <Card
                backgroundColor="$background"
                padding="$8"
                borderRadius="$4"
                elevation={2}
                borderWidth={1}
                borderColor="$borderColor"
                hoverStyle={{ elevation: 4, borderColor: '$blue6' }}
                flex={1}
                minWidth="45%"
                $gtMd={{ minWidth: '30%' }}
              >
                <Shield size={40} color="$blue10" marginBottom="$4" />
                <H3 fontWeight="600" color="$color12" marginBottom="$2" fontSize="$6">
                  Automated Verification
                </H3>
                <Text color="$color11">AI-powered document verification with 99.8% accuracy</Text>
              </Card>
              <Card
                backgroundColor="$background"
                padding="$8"
                borderRadius="$4"
                elevation={2}
                borderWidth={1}
                borderColor="$borderColor"
                hoverStyle={{ elevation: 4, borderColor: '$gray6' }}
                flex={1}
                minWidth="45%"
                $gtMd={{ minWidth: '30%' }}
              >
                <Clock size={40} color="$gray10" marginBottom="$4" />
                <H3 fontWeight="600" color="$color12" marginBottom="$2" fontSize="$6">
                  Save 60% Time
                </H3>
                <Text color="$color11">Reduce compliance management from hours to minutes</Text>
              </Card>
              <Card
                backgroundColor="$background"
                padding="$8"
                borderRadius="$4"
                elevation={2}
                borderWidth={1}
                borderColor="$borderColor"
                hoverStyle={{ elevation: 4, borderColor: '$yellow6' }}
                flex={1}
                minWidth="45%"
                $gtMd={{ minWidth: '30%' }}
              >
                <DollarSign size={40} color="$yellow10" marginBottom="$4" />
                <H3 fontWeight="600" color="$color12" marginBottom="$2" fontSize="$6">
                  Instant Coverage
                </H3>
                <Text color="$color11">Purchase insurance and get COIs issued immediately</Text>
              </Card>
            </XStack>
          </YStack>
        </YStack>
      </YStack>

      {/* Stats Section - Theme-aware dark backgrounds */}
      <YStack
        as="section"
        paddingVertical="$10"
        backgroundColor="$gray12"
        color="white"
        position="relative"
        overflow="hidden"
      >
        <YStack position="absolute" top={0} left={0} right={0} bottom={0} opacity={0.1}>
          <YStack
            position="absolute"
            top={0}
            left="25%"
            width={384}
            height={384}
            backgroundColor="$blue10"
            borderRadius={9999}
            opacity={0.5}
          />
          <YStack
            position="absolute"
            bottom={0}
            right="25%"
            width={384}
            height={384}
            backgroundColor="$gray10"
            borderRadius={9999}
            opacity={0.5}
          />
        </YStack>
        <YStack
          maxWidth={1280}
          marginHorizontal="auto"
          paddingHorizontal="$4"
          $gtSm={{ paddingHorizontal: '$6' }}
          $gtLg={{ paddingHorizontal: '$8' }}
          position="relative"
        >
          <YStack alignItems="center" marginBottom="$10">
            <H2 fontSize="$9" $gtMd={{ fontSize: '$10' }} fontWeight="700" marginBottom="$4">
              Trusted by Construction Leaders
            </H2>
            <Text fontSize="$6" color="rgba(255,255,255,0.7)">
              Join thousands of construction professionals building with confidence
            </Text>
          </YStack>
          <XStack flexWrap="wrap" gap="$8">
            {stats.map((stat, index) => (
              <YStack
                key={index}
                alignItems="center"
                flex={1}
                minWidth="45%"
                $gtMd={{ minWidth: '22%' }}
              >
                <Text
                  fontSize="$10"
                  $gtMd={{ fontSize: '$11' }}
                  fontWeight="700"
                  color="$blue9"
                  marginBottom="$2"
                >
                  {stat.value}
                </Text>
                <Text fontSize="$6" color="rgba(255,255,255,0.6)">
                  {stat.label}
                </Text>
              </YStack>
            ))}
          </XStack>
        </YStack>
      </YStack>

      {/* Features Section */}
      <YStack as="section" id="features" paddingVertical="$12" backgroundColor="$background">
        <YStack
          maxWidth={1280}
          marginHorizontal="auto"
          paddingHorizontal="$4"
          $gtSm={{ paddingHorizontal: '$6' }}
          $gtLg={{ paddingHorizontal: '$8' }}
        >
          <YStack alignItems="center" marginBottom="$10">
            <H2
              fontSize="$9"
              $gtMd={{ fontSize: '$10' }}
              fontWeight="700"
              color="$color12"
              marginBottom="$6"
            >
              Built for Construction
            </H2>
            <Text
              fontSize="$6"
              color="$color11"
              maxWidth={768}
              marginHorizontal="auto"
              lineHeight={1.6}
            >
              From automated document verification to predictive risk monitoring, Forsured delivers
              comprehensive compliance management designed for the field.
            </Text>
          </YStack>

          <XStack flexWrap="wrap" gap="$8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card
                  key={index}
                  backgroundColor="$background"
                  padding="$8"
                  borderRadius="$4"
                  borderWidth={2}
                  borderColor="$borderColor"
                  hoverStyle={{ borderColor: '$blue10', elevation: 4 }}
                  flex={1}
                  minWidth="45%"
                  $gtMd={{ minWidth: '30%' }}
                >
                  <XStack
                    backgroundColor="$blue2"
                    width={56}
                    height={56}
                    borderRadius="$4"
                    alignItems="center"
                    justifyContent="center"
                    marginBottom="$5"
                    hoverStyle={{ backgroundColor: '$blue10' }}
                  >
                    <Icon size={28} color="$blue11" />
                  </XStack>
                  <H3 fontSize="$6" fontWeight="600" color="$color12" marginBottom="$3">
                    {feature.title}
                  </H3>
                  <Text color="$color11" lineHeight={1.6}>
                    {feature.description}
                  </Text>
                </Card>
              )
            })}
          </XStack>
        </YStack>
      </YStack>

      {/* Use Cases Section */}
      <YStack as="section" paddingVertical="$12" backgroundColor="$backgroundHover">
        <YStack
          maxWidth={1280}
          marginHorizontal="auto"
          paddingHorizontal="$4"
          $gtSm={{ paddingHorizontal: '$6' }}
          $gtLg={{ paddingHorizontal: '$8' }}
        >
          <XStack flexWrap="wrap" gap="$8">
            {/* Construction Managers */}
            <Card
              backgroundColor="$background"
              padding="$8"
              borderRadius="$4"
              elevation={3}
              borderWidth={2}
              borderColor="$borderColor"
              hoverStyle={{ borderColor: '$blue10' }}
              flex={1}
              minWidth="45%"
              $gtLg={{ minWidth: '30%' }}
            >
              <XStack alignItems="center" gap="$3" marginBottom="$6">
                <XStack backgroundColor="$blue2" padding="$3" borderRadius="$4">
                  <Users size={28} color="$blue11" />
                </XStack>
                <H3 fontSize="$8" fontWeight="700" color="$color12">
                  For Managers
                </H3>
              </XStack>
              <YStack gap="$4" marginBottom="$8">
                <XStack alignItems="flex-start" gap="$3">
                  <CheckCircle size={20} color="$blue10" marginTop="$1" flexShrink={0} />
                  <Text color="$color11">
                    Automatically verify subcontractor compliance across all projects
                  </Text>
                </XStack>
                <XStack alignItems="flex-start" gap="$3">
                  <CheckCircle size={20} color="$blue10" marginTop="$1" flexShrink={0} />
                  <Text color="$color11">Real-time risk monitoring with predictive alerts</Text>
                </XStack>
                <XStack alignItems="flex-start" gap="$3">
                  <CheckCircle size={20} color="$blue10" marginTop="$1" flexShrink={0} />
                  <Text color="$color11">
                    Generate compliance reports for audits and stakeholders
                  </Text>
                </XStack>
                <XStack alignItems="flex-start" gap="$3">
                  <CheckCircle size={20} color="$blue10" marginTop="$1" flexShrink={0} />
                  <Text color="$color11">
                    Integrate with existing construction management tools
                  </Text>
                </XStack>
              </YStack>
              <Button
                onClick={() => handleGetStarted('manager')}
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
              backgroundColor="$background"
              padding="$8"
              borderRadius="$4"
              elevation={3}
              borderWidth={2}
              borderColor="$borderColor"
              hoverStyle={{ borderColor: '$gray10' }}
              flex={1}
              minWidth="45%"
              $gtLg={{ minWidth: '30%' }}
            >
              <XStack alignItems="center" gap="$3" marginBottom="$6">
                <XStack backgroundColor="$gray2" padding="$3" borderRadius="$4">
                  <Award size={28} color="$gray11" />
                </XStack>
                <H3 fontSize="$8" fontWeight="700" color="$color12">
                  For Subcontractors
                </H3>
              </XStack>
              <YStack gap="$4" marginBottom="$8">
                <XStack alignItems="flex-start" gap="$3">
                  <CheckCircle size={20} color="$gray10" marginTop="$1" flexShrink={0} />
                  <Text color="$color11">Upload documents and get instant compliance scoring</Text>
                </XStack>
                <XStack alignItems="flex-start" gap="$3">
                  <CheckCircle size={20} color="$gray10" marginTop="$1" flexShrink={0} />
                  <Text color="$color11">Receive personalized insurance recommendations</Text>
                </XStack>
                <XStack alignItems="flex-start" gap="$3">
                  <CheckCircle size={20} color="$gray10" marginTop="$1" flexShrink={0} />
                  <Text color="$color11">Purchase coverage and get COIs issued instantly</Text>
                </XStack>
                <XStack alignItems="flex-start" gap="$3">
                  <CheckCircle size={20} color="$gray10" marginTop="$1" flexShrink={0} />
                  <Text color="$color11">Track renewal dates and maintain compliance status</Text>
                </XStack>
              </YStack>
              <Button
                onClick={() => handleGetStarted('subcontractor')}
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
              backgroundColor="$background"
              padding="$8"
              borderRadius="$4"
              elevation={3}
              borderWidth={2}
              borderColor="$borderColor"
              hoverStyle={{ borderColor: '$gray11' }}
              flex={1}
              minWidth="45%"
              $gtLg={{ minWidth: '30%' }}
            >
              <XStack alignItems="center" gap="$3" marginBottom="$6">
                <XStack backgroundColor="$gray2" padding="$3" borderRadius="$4">
                  <Handshake size={28} color="$gray11" />
                </XStack>
                <H3 fontSize="$8" fontWeight="700" color="$color12">
                  For Brokers
                </H3>
              </XStack>
              <YStack gap="$4" marginBottom="$8">
                <XStack alignItems="flex-start" gap="$3">
                  <CheckCircle size={20} color="$color11" marginTop="$1" flexShrink={0} />
                  <Text color="$color11">
                    Access qualified construction leads with verified needs
                  </Text>
                </XStack>
                <XStack alignItems="flex-start" gap="$3">
                  <CheckCircle size={20} color="$color11" marginTop="$1" flexShrink={0} />
                  <Text color="$color11">Streamline quote generation and policy management</Text>
                </XStack>
                <XStack alignItems="flex-start" gap="$3">
                  <CheckCircle size={20} color="$color11" marginTop="$1" flexShrink={0} />
                  <Text color="$color11">Automated COI generation and compliance tracking</Text>
                </XStack>
                <XStack alignItems="flex-start" gap="$3">
                  <CheckCircle size={20} color="$color11" marginTop="$1" flexShrink={0} />
                  <Text color="$color11">Expand your construction industry client base</Text>
                </XStack>
              </YStack>
              <Button
                onClick={() => handleGetStarted('broker')}
                rightIcon={ArrowRight}
                iconSize={18}
                fullWidth
                backgroundColor="$color12"
                hoverStyle={{ backgroundColor: '$color12' }}
              >
                Get Started
              </Button>
            </Card>
          </XStack>
        </YStack>
      </YStack>

      {/* CTA Section - Theme-aware vibrant gradients */}
      <YStack
        as="section"
        paddingVertical="$12"
        backgroundColor="$blue11"
        position="relative"
        overflow="hidden"
      >
        <YStack position="absolute" top={0} left={0} right={0} bottom={0} opacity={0.1}>
          <YStack
            position="absolute"
            top={0}
            right={0}
            width={384}
            height={384}
            backgroundColor="$gray10"
            borderRadius={9999}
            opacity={0.5}
          />
          <YStack
            position="absolute"
            bottom={0}
            left={0}
            width={384}
            height={384}
            backgroundColor="$yellow10"
            borderRadius={9999}
            opacity={0.5}
          />
        </YStack>
        <YStack
          maxWidth={896}
          marginHorizontal="auto"
          alignItems="center"
          paddingHorizontal="$4"
          $gtSm={{ paddingHorizontal: '$6' }}
          $gtLg={{ paddingHorizontal: '$8' }}
          position="relative"
        >
          <H2
            fontSize="$9"
            $gtMd={{ fontSize: '$10' }}
            fontWeight="700"
            color="white"
            marginBottom="$6"
          >
            Ready to Build with Confidence?
          </H2>
          <Text
            fontSize="$6"
            $gtMd={{ fontSize: '$8' }}
            color="rgba(255,255,255,0.9)"
            marginBottom="$12"
            lineHeight={1.6}
          >
            Join thousands of construction professionals managing compliance the modern way.
          </Text>
        </YStack>
      </YStack>

      {/* Footer - Theme-aware dark backgrounds */}
      <YStack as="footer" backgroundColor="$gray12" color="white" paddingVertical="$8">
        <YStack
          maxWidth={1280}
          marginHorizontal="auto"
          paddingHorizontal="$4"
          $gtSm={{ paddingHorizontal: '$6' }}
          $gtLg={{ paddingHorizontal: '$8' }}
        >
          <XStack flexWrap="wrap" gap="$12">
            <YStack flex={1} minWidth="45%" $gtMd={{ minWidth: '22%' }}>
              <ForsuredLogo height={32} marginBottom="$6" color="white" />
              <Text color="rgba(255,255,255,0.6)" lineHeight={1.6}>
                AI-powered compliance and insurance management for the construction industry.
              </Text>
            </YStack>
            <YStack flex={1} minWidth="45%" $gtMd={{ minWidth: '22%' }}>
              <H3 fontWeight="600" marginBottom="$4" color="white">
                Product
              </H3>
              <YStack gap="$3">
                <TamaguiButton
                  unstyled
                  href="#"
                  color="rgba(255,255,255,0.6)"
                  hoverStyle={{ color: '$blue9' }}
                >
                  Features
                </TamaguiButton>
                <TamaguiButton
                  unstyled
                  href="#"
                  color="rgba(255,255,255,0.6)"
                  hoverStyle={{ color: '$blue9' }}
                >
                  Pricing
                </TamaguiButton>
                <TamaguiButton
                  unstyled
                  href="#"
                  color="rgba(255,255,255,0.6)"
                  hoverStyle={{ color: '$blue9' }}
                >
                  Integrations
                </TamaguiButton>
                <TamaguiButton
                  unstyled
                  href="#"
                  color="rgba(255,255,255,0.6)"
                  hoverStyle={{ color: '$blue9' }}
                >
                  API
                </TamaguiButton>
              </YStack>
            </YStack>
            <YStack flex={1} minWidth="45%" $gtMd={{ minWidth: '22%' }}>
              <H3 fontWeight="600" marginBottom="$4" color="white">
                Company
              </H3>
              <YStack gap="$3">
                <TamaguiButton
                  unstyled
                  href="#"
                  color="rgba(255,255,255,0.6)"
                  hoverStyle={{ color: '$blue9' }}
                >
                  About
                </TamaguiButton>
                <TamaguiButton
                  unstyled
                  href="#"
                  color="rgba(255,255,255,0.6)"
                  hoverStyle={{ color: '$blue9' }}
                >
                  Careers
                </TamaguiButton>
                <TamaguiButton
                  unstyled
                  href="#"
                  color="rgba(255,255,255,0.6)"
                  hoverStyle={{ color: '$blue9' }}
                >
                  Contact
                </TamaguiButton>
                <TamaguiButton
                  unstyled
                  href="#"
                  color="rgba(255,255,255,0.6)"
                  hoverStyle={{ color: '$blue9' }}
                >
                  Blog
                </TamaguiButton>
              </YStack>
            </YStack>
            <YStack flex={1} minWidth="45%" $gtMd={{ minWidth: '22%' }}>
              <H3 fontWeight="600" marginBottom="$4" color="white">
                Support
              </H3>
              <YStack gap="$3">
                <TamaguiButton
                  unstyled
                  href="#"
                  color="rgba(255,255,255,0.6)"
                  hoverStyle={{ color: '$blue9' }}
                >
                  Help Center
                </TamaguiButton>
                <TamaguiButton
                  unstyled
                  href="#"
                  color="rgba(255,255,255,0.6)"
                  hoverStyle={{ color: '$blue9' }}
                >
                  Documentation
                </TamaguiButton>
                <TamaguiButton
                  unstyled
                  href="#"
                  color="rgba(255,255,255,0.6)"
                  hoverStyle={{ color: '$blue9' }}
                >
                  Status
                </TamaguiButton>
                <TamaguiButton
                  unstyled
                  href="#"
                  color="rgba(255,255,255,0.6)"
                  hoverStyle={{ color: '$blue9' }}
                >
                  Security
                </TamaguiButton>
              </YStack>
            </YStack>
          </XStack>
          <YStack
            borderTopWidth={1}
            borderColor="$gray11"
            marginTop="$12"
            paddingTop="$8"
            alignItems="center"
          >
            <Text color="rgba(255,255,255,0.6)">&copy; 2024 Forsured. All rights reserved.</Text>
          </YStack>
        </YStack>
      </YStack>
    </YStack>
  )
}
