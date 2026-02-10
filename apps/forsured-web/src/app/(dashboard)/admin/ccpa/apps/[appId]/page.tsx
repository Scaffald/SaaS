/**
 * CCPA Admin OAuth App Configuration Page
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
  Stack,
  Row,
  Text,
  Button,
  Card,
  Heading,
  Input,
  Spinner,
  Switch,
  colors,
  spacing,
} from '@unicornlove/beyond-ui'
import Checkbox from '../../../../../../ui/Checkbox'
import Textarea from '../../../../../../components/Common/Textarea'
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
      <Stack style={{ padding: spacing[24], maxWidth: 1200, marginHorizontal: 'auto' }}>
        <Stack style={{ alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
          <Spinner size="lg" />
          <Text color={colors.text.light.secondary} style={{ marginTop: spacing[16] }}>
            Loading app configuration...
          </Text>
        </Stack>
      </Stack>
    )
  }

  // Error state
  if (error || !app) {
    return (
      <Stack style={{ padding: spacing[24], maxWidth: 1200, marginHorizontal: 'auto' }}>
        <Stack
          style={{
            padding: spacing[16],
            backgroundColor: colors.error[200],
            borderWidth: 1,
            borderColor: colors.error[400],
            borderRadius: spacing[16],
          }}
        >
          <Text weight="semibold" color={colors.error[600]}>
            Error loading app configuration
          </Text>
          <Text color={colors.error[500]} size="xs" style={{ marginTop: spacing[8] }}>
            {error?.message || 'App not found'}
          </Text>
          <Row gap={spacing[8]} style={{ marginTop: spacing[12] }}>
            <Button
              size="sm"
              color="error"
              variant="filled"
              onPress={() => refetch()}
            >
              Retry
            </Button>
            <Button
              size="sm"
              variant="outline"
              color="gray"
              onPress={() => router.push('/admin/ccpa/apps')}
            >
              Back to List
            </Button>
          </Row>
        </Stack>
      </Stack>
    )
  }

  return (
    <Stack style={{ padding: spacing[24], maxWidth: 1200, marginHorizontal: 'auto' }}>
      {/* Header */}
      <Row alignItems="flex-start" justifyContent="space-between" style={{ marginBottom: spacing[24] }}>
        <Stack>
          <Heading level={2} style={{ marginBottom: spacing[8] }}>{app.displayName} - CCPA Configuration</Heading>
          <Text color={colors.text.light.secondary}>{app.description || app.name}</Text>
          {ccpaConfig && (
            <Row
              style={{
                marginTop: spacing[8],
                paddingHorizontal: spacing[8],
                paddingVertical: spacing[4],
                borderRadius: 8,
                backgroundColor: colors.success[200],
                alignSelf: 'flex-start',
              }}
            >
              <Text size="xs" color={colors.success[600]}>
                Configuration exists - Last updated: {new Date(ccpaConfig.updatedAt).toLocaleDateString()}
              </Text>
            </Row>
          )}
        </Stack>
        <Row gap={spacing[8]}>
          <Button
            variant="outline"
            color="gray"
            onPress={() => router.push('/admin/ccpa/apps')}
          >
            Back to List
          </Button>
          <Button
            color="primary"
            variant="filled"
            onPress={handleSave}
            disabled={!formDirty || updateConfig.isPending}
            loading={updateConfig.isPending}
          >
            {updateConfig.isPending ? 'Saving...' : 'Save Configuration'}
          </Button>
        </Row>
      </Row>

      {/* Success/Error Messages */}
      {updateConfig.isSuccess && (
        <Card
          style={{
            padding: spacing[12],
            marginBottom: spacing[16],
            backgroundColor: colors.success[200],
            borderWidth: 1,
            borderColor: colors.success[400],
          }}
        >
          <Text color={colors.success[600]}>Configuration saved successfully!</Text>
        </Card>
      )}
      {updateConfig.isError && (
        <Card
          style={{
            padding: spacing[12],
            marginBottom: spacing[16],
            backgroundColor: colors.error[200],
            borderWidth: 1,
            borderColor: colors.error[400],
          }}
        >
          <Text color={colors.error[600]}>
            Failed to save: {updateConfig.error?.message || 'Unknown error'}
          </Text>
        </Card>
      )}

      <Row gap={spacing[24]} style={{ flexWrap: 'wrap' }}>
        {/* Left Column */}
        <Stack style={{ flex: 2, minWidth: 400 }} gap={spacing[24]}>
          {/* Section 1: Data Mapping */}
          <Card style={{ padding: spacing[16] }}>
            <Heading level={3} style={{ marginBottom: spacing[16] }}>Data Categories</Heading>
            <Text color={colors.text.light.secondary} style={{ marginBottom: spacing[16] }}>
              Select the data categories this application handles.
            </Text>
            <Stack gap={spacing[12]}>
              {dataCategories.map((category) => (
                <Row
                  key={category.name}
                  style={{
                    padding: spacing[12],
                    backgroundColor: category.selected ? colors.primary[200] : colors.gray[100],
                    borderRadius: 8,
                    alignItems: 'center',
                    gap: spacing[12],
                    cursor: 'pointer',
                  }}
                  onPress={() => toggleCategory(category.name)}
                >
                  <Checkbox
                    checked={category.selected}
                    onCheckedChange={() => toggleCategory(category.name)}
                  />
                  <Stack style={{ flex: 1 }}>
                    <Text weight="medium" color={colors.text.light.primary}>
                      {category.name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Text>
                    <Text size="xs" color={colors.text.light.secondary}>
                      {category.description}
                    </Text>
                  </Stack>
                </Row>
              ))}
            </Stack>

            {selectedCategories.size > 0 && (
              <Stack style={{ marginTop: spacing[16] }}>
                <Text weight="medium" color={colors.text.light.primary} style={{ marginBottom: spacing[8] }}>
                  PII Types Stored
                </Text>
                <Row gap={spacing[8]} style={{ flexWrap: 'wrap' }}>
                  {PII_TYPES.map((piiType) => (
                    <Row
                      key={piiType}
                      style={{
                        padding: spacing[8],
                        backgroundColor: selectedPiiTypes.has(piiType) ? colors.warning[200] : colors.gray[100],
                        borderRadius: 8,
                        alignItems: 'center',
                        gap: spacing[8],
                        cursor: 'pointer',
                      }}
                      onPress={() => togglePiiType(piiType)}
                    >
                      <Checkbox
                        checked={selectedPiiTypes.has(piiType)}
                        onCheckedChange={() => togglePiiType(piiType)}
                        size="sm"
                      />
                      <Text size="xs" color={colors.text.light.secondary}>
                        {piiType.replace(/_/g, ' ')}
                      </Text>
                    </Row>
                  ))}
                </Row>
              </Stack>
            )}
          </Card>

          {/* Section 2: Request Type Support */}
          <Card style={{ padding: spacing[16] }}>
            <Heading level={3} style={{ marginBottom: spacing[16] }}>Request Type Support</Heading>
            <Text color={colors.text.light.secondary} style={{ marginBottom: spacing[16] }}>
              Configure which CCPA request types this application supports.
            </Text>
            <Stack gap={spacing[12]}>
              {REQUEST_TYPES.map((reqType) => (
                <Row
                  key={reqType.key}
                  style={{
                    padding: spacing[12],
                    backgroundColor: requestTypeSupport[reqType.key] ? colors.success[200] : colors.gray[100],
                    borderRadius: 8,
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Stack style={{ flex: 1 }}>
                    <Text weight="medium" color={colors.text.light.primary}>
                      {reqType.label}
                    </Text>
                    <Text size="xs" color={colors.text.light.secondary}>
                      {reqType.description}
                    </Text>
                  </Stack>
                  <Switch
                    checked={requestTypeSupport[reqType.key]}
                    onCheckedChange={() => toggleRequestType(reqType.key)}
                  />
                </Row>
              ))}
            </Stack>
          </Card>

          {/* Section 3: Integration Hooks */}
          <Card style={{ padding: spacing[16] }}>
            <Heading level={3} style={{ marginBottom: spacing[16] }}>Integration Hooks</Heading>
            <Text color={colors.text.light.secondary} style={{ marginBottom: spacing[16] }}>
              Configure the webhook endpoint for receiving CCPA requests.
            </Text>
            <Stack gap={spacing[16]}>
              <Stack gap={spacing[8]}>
                <Text weight="medium" color={colors.text.light.primary}>
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
                <Text size="xs" color={colors.text.light.tertiary}>
                  POST requests will be sent to this URL for CCPA operations
                </Text>
              </Stack>
              <Stack gap={spacing[8]}>
                <Text weight="medium" color={colors.text.light.primary}>
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
                <Text size="xs" color={colors.text.light.tertiary}>
                  Used to sign webhook payloads for verification
                </Text>
              </Stack>
              <Row alignItems="center" gap={spacing[12]}>
                <Switch
                  checked={isActive}
                  onCheckedChange={(checked) => {
                    setIsActive(checked)
                    setFormDirty(true)
                  }}
                />
                <Stack>
                  <Text weight="medium" color={colors.text.light.primary}>
                    Integration Active
                  </Text>
                  <Text size="xs" color={colors.text.light.secondary}>
                    When disabled, CCPA requests will not be sent to this app
                  </Text>
                </Stack>
              </Row>
            </Stack>
          </Card>
        </Stack>

        {/* Right Column */}
        <Stack style={{ flex: 1, minWidth: 300 }} gap={spacing[24]}>
          {/* Section 4: SLA Overrides */}
          <Card style={{ padding: spacing[16] }}>
            <Heading level={3} style={{ marginBottom: spacing[16] }}>SLA Overrides</Heading>
            <Text color={colors.text.light.secondary} style={{ marginBottom: spacing[16] }}>
              Configure custom SLA deadlines (defaults: 10 day acknowledgment, 45 day completion).
            </Text>
            <Stack gap={spacing[16]}>
              <Stack gap={spacing[8]}>
                <Text weight="medium" color={colors.text.light.primary}>
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
              </Stack>
              <Stack gap={spacing[8]}>
                <Text weight="medium" color={colors.text.light.primary}>
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
              </Stack>
              {(slaAcknowledgmentDays || slaCompletionDays) && (
                <Stack gap={spacing[8]}>
                  <Text weight="medium" color={colors.text.light.primary}>
                    Justification (required for custom SLAs)
                  </Text>
                  <Textarea
                    placeholder="Explain why custom SLA deadlines are needed..."
                    value={slaJustification}
                    onChange={(e) => {
                      setSlaJustification(e.target.value)
                      setFormDirty(true)
                    }}
                    rows={3}
                  />
                </Stack>
              )}
            </Stack>
          </Card>

          {/* Section 5: Testing Tools */}
          <Card style={{ padding: spacing[16] }}>
            <Heading level={3} style={{ marginBottom: spacing[16] }}>Testing Tools</Heading>
            <Text color={colors.text.light.secondary} style={{ marginBottom: spacing[16] }}>
              Send test requests to verify webhook integration.
            </Text>
            <Stack gap={spacing[12]}>
              {ccpaConfig?.webhookUrl ? (
                <>
                  <Row gap={spacing[8]} style={{ flexWrap: 'wrap' }}>
                    <Button
                      size="sm"
                      color="primary"
                      variant="filled"
                      onPress={() => handleTest('access')}
                      disabled={testIntegration.isPending}
                    >
                      Test Export
                    </Button>
                    <Button
                      size="sm"
                      color="error"
                      variant="filled"
                      onPress={() => handleTest('deletion')}
                      disabled={testIntegration.isPending}
                    >
                      Test Deletion
                    </Button>
                    <Button
                      size="sm"
                      color="success"
                      variant="filled"
                      onPress={() => handleTest('opt_out')}
                      disabled={testIntegration.isPending}
                    >
                      Test Opt-Out
                    </Button>
                  </Row>

                  {testIntegration.isPending && (
                    <Row alignItems="center" gap={spacing[8]}>
                      <Spinner size="sm" />
                      <Text color={colors.text.light.secondary}>Sending test request...</Text>
                    </Row>
                  )}

                  {testResult && (
                    <Stack
                      style={{
                        padding: spacing[12],
                        backgroundColor: testResult.success ? colors.success[200] : colors.error[200],
                        borderRadius: 8,
                        gap: spacing[8],
                      }}
                    >
                      <Row justifyContent="space-between">
                        <Text weight="medium" color={testResult.success ? colors.success[600] : colors.error[600]}>
                          {testResult.success ? 'Test Passed' : 'Test Failed'}
                        </Text>
                        <Text size="xs" color={colors.text.light.secondary}>
                          {testResult.duration}ms
                        </Text>
                      </Row>
                      <Text size="xs" color={colors.text.light.secondary}>
                        Status: {testResult.status}
                      </Text>
                      {testResult.error && (
                        <Text size="xs" color={colors.error[600]}>
                          Error: {testResult.error}
                        </Text>
                      )}
                      {testResult.response && (
                        <Stack>
                          <Text size="xs" color={colors.text.light.secondary}>
                            Response:
                          </Text>
                          <Text
                            size="xs"
                            color={colors.text.light.tertiary}
                            style={{
                              fontFamily: 'monospace',
                              backgroundColor: colors.gray[150],
                              padding: spacing[8],
                              borderRadius: 4,
                            }}
                          >
                            {testResult.response.substring(0, 200)}
                            {testResult.response.length > 200 ? '...' : ''}
                          </Text>
                        </Stack>
                      )}
                    </Stack>
                  )}
                </>
              ) : (
                <Stack
                  style={{
                    padding: spacing[16],
                    backgroundColor: colors.gray[100],
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                >
                  <Text color={colors.text.light.secondary} style={{ textAlign: 'center' }}>
                    Save configuration with a webhook URL to enable testing.
                  </Text>
                </Stack>
              )}
            </Stack>
          </Card>

          {/* App Info */}
          <Card style={{ padding: spacing[16] }}>
            <Heading level={3} style={{ marginBottom: spacing[16] }}>App Information</Heading>
            <Stack gap={spacing[8]}>
              <Row justifyContent="space-between">
                <Text color={colors.text.light.secondary}>Name</Text>
                <Text weight="medium" color={colors.text.light.primary}>
                  {app.name}
                </Text>
              </Row>
              <Row justifyContent="space-between">
                <Text color={colors.text.light.secondary}>Status</Text>
                <Text weight="medium" color={colors.text.light.primary}>
                  {app.status}
                </Text>
              </Row>
              {app.ownerEmail && (
                <Row justifyContent="space-between">
                  <Text color={colors.text.light.secondary}>Owner</Text>
                  <Text weight="medium" color={colors.text.light.primary}>
                    {app.ownerEmail}
                  </Text>
                </Row>
              )}
              {app.homepageUrl && (
                <Row justifyContent="space-between">
                  <Text color={colors.text.light.secondary}>Homepage</Text>
                  <Text weight="medium" color={colors.primary[600]} size="xs">
                    {app.homepageUrl}
                  </Text>
                </Row>
              )}
            </Stack>
          </Card>
        </Stack>
      </Row>
    </Stack>
  )
}
