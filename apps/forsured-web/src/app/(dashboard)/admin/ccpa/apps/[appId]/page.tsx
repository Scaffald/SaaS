/**
 * REQ-6: CCPA Admin OAuth App Configuration Page
 * TASK-5: Build OAuth App CCPA Configuration Management Pages
 *
 * Configuration form with 5 sections:
 * 1. Data Mapping
 * 2. Request Type Support
 * 3. Integration Hooks (Webhooks)
 * 4. SLA Overrides
 * 5. Testing Tools
 */

'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  YStack,
  XStack,
  Text,
  Button,
  Card,
  H2,
  H3,
  Input,
  TextArea,
  Checkbox,
  Spinner,
  Switch,
} from '@unicornlove/ui'
import { useRouter, useParams } from 'next/navigation'
import { trpc } from '../../../../../../lib/trpc'

// Data category options
const DEFAULT_DATA_CATEGORIES = [
  { name: 'user_profile', description: 'User account and profile information' },
  { name: 'insurance_policies', description: 'Insurance policy records and documents' },
  { name: 'compliance_records', description: 'Compliance verification and audit records' },
  { name: 'documents', description: 'Uploaded documents and certificates' },
  { name: 'activity_logs', description: 'User activity and interaction logs' },
  { name: 'communications', description: 'Emails and notifications sent to user' },
]

// PII type options
const PII_TYPES = [
  'name',
  'email',
  'phone',
  'address',
  'ssn',
  'drivers_license',
  'financial_info',
  'health_info',
  'geolocation',
  'ip_address',
  'device_ids',
]

// Request types
const REQUEST_TYPES = [
  { key: 'access', label: 'Data Export (Access)', description: 'Allow users to export their data' },
  { key: 'deletion', label: 'Data Deletion', description: 'Allow users to request data deletion' },
  {
    key: 'correction',
    label: 'Data Correction',
    description: 'Allow users to correct their data',
  },
  {
    key: 'portability',
    label: 'Data Portability',
    description: 'Provide data in portable format',
  },
  { key: 'opt_out', label: 'Opt Out', description: 'Allow users to opt out of data sale/sharing' },
  { key: 'opt_in', label: 'Opt In', description: 'Allow users to opt back in' },
]

type TestResult = {
  success: boolean
  status: number
  duration: number
  response: string
  error: string | null
  testedAt: string
}

export default function CCPAAppConfigPage() {
  const router = useRouter()
  const params = useParams()
  const appId = params.appId as string

  // Form state
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [selectedPiiTypes, setSelectedPiiTypes] = useState<Set<string>>(new Set())
  const [requestTypeSupport, setRequestTypeSupport] = useState<Record<string, boolean>>({
    access: true,
    deletion: true,
    correction: false,
    portability: false,
    opt_out: true,
    opt_in: true,
  })
  const [slaAcknowledgmentDays, setSlaAcknowledgmentDays] = useState<string>('')
  const [slaCompletionDays, setSlaCompletionDays] = useState<string>('')
  const [slaJustification, setSlaJustification] = useState('')
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [formDirty, setFormDirty] = useState(false)

  // Queries
  const {
    data,
    isLoading,
    error,
    refetch,
  } = trpc.ccpaAdmin.getAppConfig.useQuery(
    { appId },
    {
      enabled: !!appId,
      onSuccess: (result) => {
        // Initialize form with existing config
        if (result.ccpaConfig) {
          setWebhookUrl(result.ccpaConfig.webhookUrl || '')
          setIsActive(result.ccpaConfig.isActive)

          const categories = (result.ccpaConfig.dataCategories as Array<{ name: string }>) ?? []
          setSelectedCategories(new Set(categories.map((c) => c.name)))
        }
      },
    }
  )

  // Mutations
  const updateConfig = trpc.ccpaAdmin.updateAppConfig.useMutation({
    onSuccess: () => {
      refetch()
      setFormDirty(false)
    },
  })

  const testIntegration = trpc.ccpaAdmin.testAppIntegration.useMutation({
    onSuccess: (result) => {
      setTestResult(result)
    },
  })

  // Computed
  const app = data?.app
  const ccpaConfig = data?.ccpaConfig

  const dataCategories = useMemo(() => {
    return DEFAULT_DATA_CATEGORIES.map((cat) => ({
      ...cat,
      selected: selectedCategories.has(cat.name),
      piiTypes: selectedPiiTypes,
    }))
  }, [selectedCategories, selectedPiiTypes])

  // Handlers
  const toggleCategory = useCallback(
    (categoryName: string) => {
      setSelectedCategories((prev) => {
        const next = new Set(prev)
        if (next.has(categoryName)) {
          next.delete(categoryName)
        } else {
          next.add(categoryName)
        }
        return next
      })
      setFormDirty(true)
    },
    []
  )

  const togglePiiType = useCallback((piiType: string) => {
    setSelectedPiiTypes((prev) => {
      const next = new Set(prev)
      if (next.has(piiType)) {
        next.delete(piiType)
      } else {
        next.add(piiType)
      }
      return next
    })
    setFormDirty(true)
  }, [])

  const toggleRequestType = useCallback((requestType: string) => {
    setRequestTypeSupport((prev) => ({
      ...prev,
      [requestType]: !prev[requestType],
    }))
    setFormDirty(true)
  }, [])

  const handleSave = useCallback(async () => {
    try {
      await updateConfig.mutateAsync({
        appId,
        dataCategories: Array.from(selectedCategories).map((name) => ({
          name,
          description: DEFAULT_DATA_CATEGORIES.find((c) => c.name === name)?.description,
          piiTypes: Array.from(selectedPiiTypes),
        })),
        webhookUrl,
        webhookSecret: webhookSecret || undefined,
        isActive,
        supportedRequestTypes: requestTypeSupport as {
          access: boolean
          deletion: boolean
          correction: boolean
          portability: boolean
          opt_out: boolean
          opt_in: boolean
        },
        slaOverrides:
          slaAcknowledgmentDays || slaCompletionDays
            ? {
                acknowledgmentDays: slaAcknowledgmentDays
                  ? parseInt(slaAcknowledgmentDays, 10)
                  : undefined,
                completionDays: slaCompletionDays ? parseInt(slaCompletionDays, 10) : undefined,
                justification: slaJustification || undefined,
              }
            : undefined,
      })
    } catch (err) {
      console.error('Failed to save config:', err)
    }
  }, [
    appId,
    selectedCategories,
    selectedPiiTypes,
    webhookUrl,
    webhookSecret,
    isActive,
    requestTypeSupport,
    slaAcknowledgmentDays,
    slaCompletionDays,
    slaJustification,
    updateConfig,
  ])

  const handleTest = useCallback(
    async (requestType: string) => {
      try {
        await testIntegration.mutateAsync({
          appId,
          requestType: requestType as 'access' | 'deletion' | 'correction' | 'portability' | 'opt_out' | 'opt_in',
        })
      } catch (err) {
        console.error('Test failed:', err)
      }
    },
    [appId, testIntegration]
  )

  // Loading state
  if (isLoading) {
    return (
      <YStack padding="$6" maxWidth={1200} marginHorizontal="auto">
        <YStack alignItems="center" justifyContent="center" minHeight={400}>
          <Spinner size="large" />
          <Text color="$gray11" marginTop="$4">
            Loading app configuration...
          </Text>
        </YStack>
      </YStack>
    )
  }

  // Error state
  if (error || !app) {
    return (
      <YStack padding="$6" maxWidth={1200} marginHorizontal="auto">
        <YStack
          padding="$4"
          backgroundColor="$red2"
          borderWidth={1}
          borderColor="$red6"
          borderRadius="$4"
        >
          <Text fontWeight="600" color="$red11">
            Error loading app configuration
          </Text>
          <Text color="$red10" fontSize="$2" marginTop="$2">
            {error?.message || 'App not found'}
          </Text>
          <XStack gap="$2" marginTop="$3">
            <Button
              size="$3"
              backgroundColor="$red9"
              color="white"
              hoverStyle={{ backgroundColor: '$red10' }}
              onPress={() => refetch()}
            >
              Retry
            </Button>
            <Button
              size="$3"
              backgroundColor="$gray3"
              color="$gray11"
              hoverStyle={{ backgroundColor: '$gray4' }}
              onPress={() => router.push('/admin/ccpa/apps')}
            >
              Back to List
            </Button>
          </XStack>
        </YStack>
      </YStack>
    )
  }

  return (
    <YStack padding="$6" maxWidth={1200} marginHorizontal="auto">
      {/* Header */}
      <XStack alignItems="flex-start" justifyContent="space-between" marginBottom="$6">
        <YStack>
          <H2 marginBottom="$2">{app.displayName} - CCPA Configuration</H2>
          <Text color="$gray11">{app.description || app.name}</Text>
          {ccpaConfig && (
            <XStack
              marginTop="$2"
              paddingHorizontal="$2"
              paddingVertical="$1"
              borderRadius="$2"
              backgroundColor="$green2"
              alignSelf="flex-start"
            >
              <Text fontSize="$2" color="$green11">
                Configuration exists - Last updated: {new Date(ccpaConfig.updatedAt).toLocaleDateString()}
              </Text>
            </XStack>
          )}
        </YStack>
        <XStack gap="$2">
          <Button
            backgroundColor="$gray3"
            color="$gray11"
            hoverStyle={{ backgroundColor: '$gray4' }}
            onPress={() => router.push('/admin/ccpa/apps')}
          >
            Back to List
          </Button>
          <Button
            backgroundColor="$blue9"
            color="white"
            hoverStyle={{ backgroundColor: '$blue10' }}
            onPress={handleSave}
            disabled={!formDirty || updateConfig.isPending}
          >
            {updateConfig.isPending ? 'Saving...' : 'Save Configuration'}
          </Button>
        </XStack>
      </XStack>

      {/* Success/Error Messages */}
      {updateConfig.isSuccess && (
        <Card
          padding="$3"
          marginBottom="$4"
          backgroundColor="$green2"
          borderWidth={1}
          borderColor="$green6"
        >
          <Text color="$green11">Configuration saved successfully!</Text>
        </Card>
      )}
      {updateConfig.isError && (
        <Card
          padding="$3"
          marginBottom="$4"
          backgroundColor="$red2"
          borderWidth={1}
          borderColor="$red6"
        >
          <Text color="$red11">
            Failed to save: {updateConfig.error?.message || 'Unknown error'}
          </Text>
        </Card>
      )}

      <XStack gap="$6" flexWrap="wrap">
        {/* Left Column */}
        <YStack flex={2} minWidth={400} gap="$6">
          {/* Section 1: Data Mapping */}
          <Card padding="$4">
            <H3 marginBottom="$4">Data Categories</H3>
            <Text color="$gray11" marginBottom="$4">
              Select the data categories this application handles.
            </Text>
            <YStack gap="$3">
              {dataCategories.map((category) => (
                <XStack
                  key={category.name}
                  padding="$3"
                  backgroundColor={category.selected ? '$blue2' : '$gray2'}
                  borderRadius="$2"
                  alignItems="center"
                  gap="$3"
                  pressStyle={{ opacity: 0.9 }}
                  onPress={() => toggleCategory(category.name)}
                  cursor="pointer"
                >
                  <Checkbox
                    checked={category.selected}
                    onCheckedChange={() => toggleCategory(category.name)}
                  />
                  <YStack flex={1}>
                    <Text fontWeight="500" color="$gray12">
                      {category.name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Text>
                    <Text fontSize="$2" color="$gray11">
                      {category.description}
                    </Text>
                  </YStack>
                </XStack>
              ))}
            </YStack>

            {selectedCategories.size > 0 && (
              <YStack marginTop="$4">
                <Text fontWeight="500" color="$gray12" marginBottom="$2">
                  PII Types Stored
                </Text>
                <XStack gap="$2" flexWrap="wrap">
                  {PII_TYPES.map((piiType) => (
                    <XStack
                      key={piiType}
                      padding="$2"
                      backgroundColor={selectedPiiTypes.has(piiType) ? '$orange2' : '$gray2'}
                      borderRadius="$2"
                      alignItems="center"
                      gap="$2"
                      pressStyle={{ opacity: 0.9 }}
                      onPress={() => togglePiiType(piiType)}
                      cursor="pointer"
                    >
                      <Checkbox
                        checked={selectedPiiTypes.has(piiType)}
                        onCheckedChange={() => togglePiiType(piiType)}
                        size="$2"
                      />
                      <Text fontSize="$2" color="$gray11">
                        {piiType.replace(/_/g, ' ')}
                      </Text>
                    </XStack>
                  ))}
                </XStack>
              </YStack>
            )}
          </Card>

          {/* Section 2: Request Type Support */}
          <Card padding="$4">
            <H3 marginBottom="$4">Request Type Support</H3>
            <Text color="$gray11" marginBottom="$4">
              Configure which CCPA request types this application supports.
            </Text>
            <YStack gap="$3">
              {REQUEST_TYPES.map((reqType) => (
                <XStack
                  key={reqType.key}
                  padding="$3"
                  backgroundColor={requestTypeSupport[reqType.key] ? '$green2' : '$gray2'}
                  borderRadius="$2"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <YStack flex={1}>
                    <Text fontWeight="500" color="$gray12">
                      {reqType.label}
                    </Text>
                    <Text fontSize="$2" color="$gray11">
                      {reqType.description}
                    </Text>
                  </YStack>
                  <Switch
                    checked={requestTypeSupport[reqType.key]}
                    onCheckedChange={() => toggleRequestType(reqType.key)}
                  />
                </XStack>
              ))}
            </YStack>
          </Card>

          {/* Section 3: Integration Hooks */}
          <Card padding="$4">
            <H3 marginBottom="$4">Integration Hooks</H3>
            <Text color="$gray11" marginBottom="$4">
              Configure the webhook endpoint for receiving CCPA requests.
            </Text>
            <YStack gap="$4">
              <YStack gap="$2">
                <Text fontWeight="500" color="$gray12">
                  Webhook URL
                </Text>
                <Input
                  placeholder="https://your-app.com/api/ccpa/webhook"
                  value={webhookUrl}
                  onChangeText={(text) => {
                    setWebhookUrl(text)
                    setFormDirty(true)
                  }}
                />
                <Text fontSize="$1" color="$gray10">
                  POST requests will be sent to this URL for CCPA operations
                </Text>
              </YStack>
              <YStack gap="$2">
                <Text fontWeight="500" color="$gray12">
                  Webhook Secret (optional)
                </Text>
                <Input
                  placeholder="Enter a secret for webhook signature verification"
                  value={webhookSecret}
                  onChangeText={(text) => {
                    setWebhookSecret(text)
                    setFormDirty(true)
                  }}
                  secureTextEntry
                />
                <Text fontSize="$1" color="$gray10">
                  Used to sign webhook payloads for verification
                </Text>
              </YStack>
              <XStack alignItems="center" gap="$3">
                <Switch
                  checked={isActive}
                  onCheckedChange={(checked) => {
                    setIsActive(checked)
                    setFormDirty(true)
                  }}
                />
                <YStack>
                  <Text fontWeight="500" color="$gray12">
                    Integration Active
                  </Text>
                  <Text fontSize="$2" color="$gray11">
                    When disabled, CCPA requests will not be sent to this app
                  </Text>
                </YStack>
              </XStack>
            </YStack>
          </Card>
        </YStack>

        {/* Right Column */}
        <YStack flex={1} minWidth={300} gap="$6">
          {/* Section 4: SLA Overrides */}
          <Card padding="$4">
            <H3 marginBottom="$4">SLA Overrides</H3>
            <Text color="$gray11" marginBottom="$4">
              Configure custom SLA deadlines (defaults: 10 day acknowledgment, 45 day completion).
            </Text>
            <YStack gap="$4">
              <YStack gap="$2">
                <Text fontWeight="500" color="$gray12">
                  Acknowledgment Deadline (days)
                </Text>
                <Input
                  placeholder="10"
                  value={slaAcknowledgmentDays}
                  onChangeText={(text) => {
                    setSlaAcknowledgmentDays(text.replace(/\D/g, ''))
                    setFormDirty(true)
                  }}
                  keyboardType="numeric"
                />
              </YStack>
              <YStack gap="$2">
                <Text fontWeight="500" color="$gray12">
                  Completion Deadline (days)
                </Text>
                <Input
                  placeholder="45"
                  value={slaCompletionDays}
                  onChangeText={(text) => {
                    setSlaCompletionDays(text.replace(/\D/g, ''))
                    setFormDirty(true)
                  }}
                  keyboardType="numeric"
                />
              </YStack>
              {(slaAcknowledgmentDays || slaCompletionDays) && (
                <YStack gap="$2">
                  <Text fontWeight="500" color="$gray12">
                    Justification (required for custom SLAs)
                  </Text>
                  <TextArea
                    placeholder="Explain why custom SLA deadlines are needed..."
                    value={slaJustification}
                    onChangeText={(text) => {
                      setSlaJustification(text)
                      setFormDirty(true)
                    }}
                    rows={3}
                  />
                </YStack>
              )}
            </YStack>
          </Card>

          {/* Section 5: Testing Tools */}
          <Card padding="$4">
            <H3 marginBottom="$4">Testing Tools</H3>
            <Text color="$gray11" marginBottom="$4">
              Send test requests to verify webhook integration.
            </Text>
            <YStack gap="$3">
              {ccpaConfig?.webhookUrl ? (
                <>
                  <XStack gap="$2" flexWrap="wrap">
                    <Button
                      size="$3"
                      backgroundColor="$blue9"
                      color="white"
                      hoverStyle={{ backgroundColor: '$blue10' }}
                      onPress={() => handleTest('access')}
                      disabled={testIntegration.isPending}
                    >
                      Test Export
                    </Button>
                    <Button
                      size="$3"
                      backgroundColor="$red9"
                      color="white"
                      hoverStyle={{ backgroundColor: '$red10' }}
                      onPress={() => handleTest('deletion')}
                      disabled={testIntegration.isPending}
                    >
                      Test Deletion
                    </Button>
                    <Button
                      size="$3"
                      backgroundColor="$green9"
                      color="white"
                      hoverStyle={{ backgroundColor: '$green10' }}
                      onPress={() => handleTest('opt_out')}
                      disabled={testIntegration.isPending}
                    >
                      Test Opt-Out
                    </Button>
                  </XStack>

                  {testIntegration.isPending && (
                    <XStack alignItems="center" gap="$2">
                      <Spinner size="small" />
                      <Text color="$gray11">Sending test request...</Text>
                    </XStack>
                  )}

                  {testResult && (
                    <YStack
                      padding="$3"
                      backgroundColor={testResult.success ? '$green2' : '$red2'}
                      borderRadius="$2"
                      gap="$2"
                    >
                      <XStack justifyContent="space-between">
                        <Text fontWeight="500" color={testResult.success ? '$green11' : '$red11'}>
                          {testResult.success ? 'Test Passed' : 'Test Failed'}
                        </Text>
                        <Text fontSize="$2" color="$gray11">
                          {testResult.duration}ms
                        </Text>
                      </XStack>
                      <Text fontSize="$2" color="$gray11">
                        Status: {testResult.status}
                      </Text>
                      {testResult.error && (
                        <Text fontSize="$2" color="$red11">
                          Error: {testResult.error}
                        </Text>
                      )}
                      {testResult.response && (
                        <YStack>
                          <Text fontSize="$2" color="$gray11">
                            Response:
                          </Text>
                          <Text
                            fontSize="$1"
                            color="$gray10"
                            fontFamily="monospace"
                            backgroundColor="$gray3"
                            padding="$2"
                            borderRadius="$1"
                          >
                            {testResult.response.substring(0, 200)}
                            {testResult.response.length > 200 ? '...' : ''}
                          </Text>
                        </YStack>
                      )}
                    </YStack>
                  )}
                </>
              ) : (
                <YStack
                  padding="$4"
                  backgroundColor="$gray2"
                  borderRadius="$2"
                  alignItems="center"
                >
                  <Text color="$gray11" textAlign="center">
                    Save configuration with a webhook URL to enable testing.
                  </Text>
                </YStack>
              )}
            </YStack>
          </Card>

          {/* App Info */}
          <Card padding="$4">
            <H3 marginBottom="$4">App Information</H3>
            <YStack gap="$2">
              <XStack justifyContent="space-between">
                <Text color="$gray11">Name</Text>
                <Text fontWeight="500" color="$gray12">
                  {app.name}
                </Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text color="$gray11">Status</Text>
                <Text fontWeight="500" color="$gray12">
                  {app.status}
                </Text>
              </XStack>
              {app.ownerEmail && (
                <XStack justifyContent="space-between">
                  <Text color="$gray11">Owner</Text>
                  <Text fontWeight="500" color="$gray12">
                    {app.ownerEmail}
                  </Text>
                </XStack>
              )}
              {app.homepageUrl && (
                <XStack justifyContent="space-between">
                  <Text color="$gray11">Homepage</Text>
                  <Text fontWeight="500" color="$blue11" fontSize="$2">
                    {app.homepageUrl}
                  </Text>
                </XStack>
              )}
            </YStack>
          </Card>
        </YStack>
      </XStack>
    </YStack>
  )
}
