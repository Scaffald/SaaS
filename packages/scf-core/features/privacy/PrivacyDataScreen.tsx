/**
 * Privacy & Data Management Screen (GDPR/CCPA)
 *
 * Allows users to:
 * - View what data is collected about them
 * - Submit data export, deletion, or correction requests
 * - Manage opt-out preferences (sale, sharing, targeted ads)
 * - Track status of existing requests
 *
 * @see Issue #94
 */

import { useState, useCallback } from 'react'
import { ScrollView } from 'react-native'
import {
  Button,
  Card,
  H2,
  Modal,
  ModalActions,
  ModalContent,
  ModalHeader,
  Row,
  Separator,
  Spinner,
  Stack,
  Text,
  Input,
  Toggle,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Download,
  FileText,
  Lock,
  Shield,
  ShieldCheck,
  Trash2,
  XCircle,
} from 'lucide-react-native'
import {
  useCCPADataSummary,
  useCCPAMyRequests,
  useCCPAMyOptOuts,
  useCCPASubmitRequestMutation,
  useCCPASetOptOutMutation,
} from '@scf/core/utils/ccpa-sdk-hooks'
import type { CCPARequestType, CCPAOptOutCategory } from '@scaffald/sdk'

// ============================================================================
// Helper Components
// ============================================================================

function DataCategoryCard({
  label,
  description,
  hasData,
  itemCount,
}: {
  label: string
  description: string
  hasData: boolean
  itemCount?: number
}) {
  const { theme } = useThemeContext()
  return (
    <Row
      gap={12}
      align="center"
      style={{
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: colors.bg[theme].subtle,
      }}
    >
      <Stack
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: hasData ? colors.info[600] : colors.bg[theme].muted,
        }}
      />
      <Stack flex={1}>
        <Row justify="space-between">
          <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text[theme].primary }}>
            {label}
          </Text>
          {hasData && itemCount !== undefined && (
            <Text style={{ fontSize: 12, color: colors.text[theme].tertiary }}>
              {itemCount} item{itemCount !== 1 ? 's' : ''}
            </Text>
          )}
        </Row>
        <Text style={{ fontSize: 12, color: colors.text[theme].secondary }}>{description}</Text>
      </Stack>
      {hasData ? (
        <CheckCircle size={16} color={colors.info[600]} />
      ) : (
        <XCircle size={16} color={colors.icon[theme].muted} />
      )}
    </Row>
  )
}

function RequestStatusBadge({ status }: { status: string }) {
  const { theme: badgeTheme } = useThemeContext()
  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: badgeTheme === 'dark' ? colors.warning[900] : colors.warning[50], text: colors.warning[700], label: 'Pending' },
    processing: { bg: badgeTheme === 'dark' ? colors.info[900] : colors.info[100], text: colors.info[700], label: 'Processing' },
    completed: { bg: badgeTheme === 'dark' ? colors.success[900] : colors.success[100], text: colors.success[700], label: 'Completed' },
    denied: { bg: badgeTheme === 'dark' ? colors.error[900] : colors.error[50], text: colors.error[800], label: 'Denied' },
  }
  const config = statusConfig[status] ?? statusConfig.pending
  return (
    <Stack
      style={{
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        backgroundColor: config.bg,
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: '600', color: config.text }}>{config.label}</Text>
    </Stack>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function PrivacyDataScreen() {
  const { theme } = useThemeContext()
  const [requestModalOpen, setRequestModalOpen] = useState(false)
  const [requestType, setRequestType] = useState<CCPARequestType>('export')
  const [confirmText, setConfirmText] = useState('')

  // SDK hooks
  const { data: dataSummary, isLoading: isLoadingSummary } = useCCPADataSummary()
  const { data: myRequests, isLoading: isLoadingRequests } = useCCPAMyRequests()
  const { data: optOuts } = useCCPAMyOptOuts()

  const submitRequest = useCCPASubmitRequestMutation({
    onSuccess: () => {
      setRequestModalOpen(false)
      setConfirmText('')
    },
  })

  const setOptOut = useCCPASetOptOutMutation()

  const handleSubmitRequest = useCallback(() => {
    submitRequest.mutate({
      type: requestType,
      ...(requestType === 'correction' && confirmText.trim()
        ? { correctionDetails: confirmText.trim() }
        : {}),
    })
  }, [requestType, confirmText, submitRequest])

  const handleOptOutToggle = useCallback(
    (category: CCPAOptOutCategory, currentValue: boolean) => {
      setOptOut.mutate({ category, optOut: !currentValue })
    },
    [setOptOut]
  )

  const openRequestModal = useCallback((type: CCPARequestType) => {
    setRequestType(type)
    setConfirmText('')
    setRequestModalOpen(true)
  }, [])

  // Fallback data for when API isn't connected
  const categories = dataSummary?.categories ?? [
    { id: 'profile', label: 'Profile Information', description: 'Name, email, phone, location, bio', hasData: true, itemCount: 1 },
    { id: 'skills', label: 'Skills & Certifications', description: 'Skill assessments, certifications, licenses', hasData: true, itemCount: 12 },
    { id: 'employment', label: 'Employment History', description: 'Work experience, job history, references', hasData: true, itemCount: 4 },
    { id: 'applications', label: 'Job Applications', description: 'Applied jobs, application status, cover letters', hasData: true, itemCount: 7 },
    { id: 'assessments', label: 'Career Assessments', description: 'RIASEC scores, personality assessments', hasData: true, itemCount: 2 },
    { id: 'messages', label: 'Messages & Communications', description: 'Recruiter messages, notifications', hasData: true, itemCount: 23 },
    { id: 'activity', label: 'Activity & Usage Data', description: 'Login history, page views, search queries', hasData: true },
    { id: 'documents', label: 'Uploaded Documents', description: 'Resume, portfolio, certifications', hasData: true, itemCount: 3 },
  ]

  const requests = myRequests?.requests ?? []

  // Always populate all known categories so toggles render even when the API
  // returns only categories the user has already opted out of.
  const ALL_OPT_OUT_CATEGORIES: CCPAOptOutCategory[] = ['sale', 'sharing', 'targeted_advertising', 'sensitive_data']
  const apiOptOuts = optOuts?.optOuts ?? []
  const optOutStatuses = ALL_OPT_OUT_CATEGORIES.map((category) => {
    const existing = apiOptOuts.find((o) => o.category === category)
    return existing ?? { category, opted_out: false, opted_out_at: null, source: 'default' as const }
  })

  const optOutLabels: Record<string, { title: string; desc: string }> = {
    sale: { title: 'Sale of Personal Data', desc: 'Prevent your data from being sold to third parties' },
    sharing: { title: 'Data Sharing', desc: 'Prevent sharing data with partners for cross-context behavioral ads' },
    targeted_advertising: { title: 'Targeted Advertising', desc: 'Opt out of personalized ads based on your profile' },
    sensitive_data: { title: 'Sensitive Data Processing', desc: 'Limit processing of sensitive personal information' },
  }

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <Stack gap={24} style={{ paddingBottom: 40 }}>
        {/* Header */}
        <Stack gap={4}>
          <H2>Privacy & Data Management</H2>
          <Text style={{ color: colors.text[theme].secondary }}>
            Manage your personal data, privacy preferences, and submit GDPR/CCPA requests
          </Text>
        </Stack>

        {/* Rights Banner */}
        <Card padding="md" style={{ backgroundColor: colors.bg[theme].subtle }}>
          <Row gap={12} align="center">
            <Shield size={24} color={colors.fg[theme].active} />
            <Stack flex={1}>
              <Text style={{ fontWeight: '600', color: colors.text[theme].primary }}>
                Your Privacy Rights
              </Text>
              <Text style={{ fontSize: 13, color: colors.text[theme].secondary }}>
                Under GDPR and CCPA, you have the right to access, export, correct, or delete your
                personal data. Requests are processed within 30 days.
              </Text>
            </Stack>
          </Row>
        </Card>

        {/* Data Summary */}
        <Stack gap={12}>
          <Row gap={8} align="center">
            <Database size={18} color={colors.text[theme].primary} />
            <Text style={{ fontWeight: '600', fontSize: 16, color: colors.text[theme].primary }}>
              Your Data Summary
            </Text>
          </Row>

          {isLoadingSummary ? (
            <Stack align="center" style={{ paddingVertical: 20 }}>
              <Spinner size="md" />
            </Stack>
          ) : (
            <Stack gap={6}>
              {categories.map((cat) => (
                <DataCategoryCard
                  key={cat.id}
                  label={cat.label}
                  description={cat.description}
                  hasData={cat.hasData}
                  itemCount={cat.itemCount}
                />
              ))}
            </Stack>
          )}
        </Stack>

        <Separator />

        {/* Data Request Actions */}
        <Stack gap={12}>
          <Row gap={8} align="center">
            <FileText size={18} color={colors.text[theme].primary} />
            <Text style={{ fontWeight: '600', fontSize: 16, color: colors.text[theme].primary }}>
              Data Requests
            </Text>
          </Row>

          <Row gap={12} style={{ flexWrap: 'wrap' }}>
            <Card padding="md" style={{ flex: 1, minWidth: 200, backgroundColor: colors.bg[theme].default }}>
              <Stack gap={8} align="center">
                <Download size={24} color={colors.info[600]} />
                <Text style={{ fontWeight: '600', color: colors.text[theme].primary }}>Export Data</Text>
                <Text style={{ fontSize: 12, color: colors.text[theme].secondary, textAlign: 'center' }}>
                  Download a copy of all your personal data
                </Text>
                <Button size="sm" variant="outline" onPress={() => openRequestModal('export')}>
                  Request Export
                </Button>
              </Stack>
            </Card>

            <Card padding="md" style={{ flex: 1, minWidth: 200, backgroundColor: colors.bg[theme].default }}>
              <Stack gap={8} align="center">
                <Trash2 size={24} color={colors.error[600]} />
                <Text style={{ fontWeight: '600', color: colors.text[theme].primary }}>Delete Data</Text>
                <Text style={{ fontSize: 12, color: colors.text[theme].secondary, textAlign: 'center' }}>
                  Request permanent deletion of your data
                </Text>
                <Button size="sm" variant="outline" onPress={() => openRequestModal('deletion')}>
                  Request Deletion
                </Button>
              </Stack>
            </Card>

            <Card padding="md" style={{ flex: 1, minWidth: 200, backgroundColor: colors.bg[theme].default }}>
              <Stack gap={8} align="center">
                <ShieldCheck size={24} color={colors.success[500]} />
                <Text style={{ fontWeight: '600', color: colors.text[theme].primary }}>Correct Data</Text>
                <Text style={{ fontSize: 12, color: colors.text[theme].secondary, textAlign: 'center' }}>
                  Request corrections to inaccurate data
                </Text>
                <Button size="sm" variant="outline" onPress={() => openRequestModal('correction')}>
                  Request Correction
                </Button>
              </Stack>
            </Card>
          </Row>
        </Stack>

        {/* Existing Requests */}
        {(requests.length > 0 || isLoadingRequests) && (
          <>
            <Separator />
            <Stack gap={12}>
              <Row gap={8} align="center">
                <Clock size={18} color={colors.text[theme].primary} />
                <Text style={{ fontWeight: '600', fontSize: 16, color: colors.text[theme].primary }}>
                  Request History
                </Text>
              </Row>

              {isLoadingRequests ? (
                <Stack align="center" style={{ paddingVertical: 20 }}>
                  <Spinner size="md" />
                </Stack>
              ) : (
                <Stack gap={8}>
                  {requests.map((req) => (
                    <Card key={req.id} padding="md" style={{ backgroundColor: colors.bg[theme].default }}>
                      <Row justify="space-between" align="center">
                        <Stack gap={2}>
                          <Text style={{ fontWeight: '500', color: colors.text[theme].primary }}>
                            {req.type.charAt(0).toUpperCase() + req.type.slice(1)} Request
                          </Text>
                          <Text style={{ fontSize: 12, color: colors.text[theme].tertiary }}>
                            Submitted {new Date(req.created_at).toLocaleDateString()}
                            {req.deadline_at && ` • Due ${new Date(req.deadline_at).toLocaleDateString()}`}
                          </Text>
                        </Stack>
                        <RequestStatusBadge status={req.status} />
                      </Row>
                    </Card>
                  ))}
                </Stack>
              )}
            </Stack>
          </>
        )}

        <Separator />

        {/* Opt-Out Preferences */}
        <Stack gap={12}>
          <Row gap={8} align="center">
            <Lock size={18} color={colors.text[theme].primary} />
            <Text style={{ fontWeight: '600', fontSize: 16, color: colors.text[theme].primary }}>
              Opt-Out Preferences
            </Text>
          </Row>

          <Stack gap={8}>
            {optOutStatuses.map((optOut) => {
              const info = optOutLabels[optOut.category]
              if (!info) return null

              return (
                <Card key={optOut.category} padding="md" style={{ backgroundColor: colors.bg[theme].default }}>
                  <Row justify="space-between" align="center">
                    <Stack flex={1} gap={2}>
                      <Text style={{ fontWeight: '500', color: colors.text[theme].primary }}>
                        {info.title}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.text[theme].secondary }}>
                        {info.desc}
                      </Text>
                    </Stack>
                    <Toggle
                      checked={optOut.opted_out}
                      onChange={() => handleOptOutToggle(optOut.category, optOut.opted_out)}
                    />
                  </Row>
                </Card>
              )
            })}
          </Stack>
        </Stack>
      </Stack>

      {/* Request Modal */}
      <Modal visible={requestModalOpen} onClose={() => setRequestModalOpen(false)} width={480}>
        <ModalHeader
          title={
            requestType === 'export'
              ? 'Export Your Data'
              : requestType === 'deletion'
                ? 'Delete Your Data'
                : 'Correct Your Data'
          }
          onClose={() => setRequestModalOpen(false)}
        />
        <ModalContent>
          <Stack gap={16}>
            {requestType === 'deletion' && (
              <Card padding="md" style={{ backgroundColor: colors.bg[theme].muted }}>
                <Row gap={12} align="center">
                  <AlertTriangle size={20} color={colors.fg[theme].error} />
                  <Stack flex={1}>
                    <Text style={{ fontWeight: '600', color: colors.fg[theme].error }}>
                      This action is permanent
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.fg[theme].error }}>
                      Once processed, your data cannot be recovered. This includes your profile,
                      applications, messages, and all associated information.
                    </Text>
                  </Stack>
                </Row>
              </Card>
            )}

            <Text style={{ color: colors.text[theme].secondary }}>
              {requestType === 'export'
                ? 'We will prepare a downloadable archive of all your personal data. You will be notified by email when your export is ready.'
                : requestType === 'deletion'
                  ? 'To confirm, type "DELETE" below. Your request will be processed within 30 days as required by law.'
                  : 'Describe what data needs to be corrected. Our team will review and process your request within 30 days.'}
            </Text>

            {requestType === 'deletion' && (
              <Input
                placeholder='Type "DELETE" to confirm'
                value={confirmText}
                onChangeText={setConfirmText}
              />
            )}

            {requestType === 'correction' && (
              <Input
                placeholder="Describe what needs to be corrected..."
                value={confirmText}
                onChangeText={setConfirmText}
                multiline
                numberOfLines={4}
              />
            )}
          </Stack>
        </ModalContent>
        <ModalActions
          orientation="right"
          primaryAction={{
            label: submitRequest.isPending
              ? 'Submitting...'
              : requestType === 'export'
                ? 'Submit Export Request'
                : requestType === 'deletion'
                  ? 'Confirm Deletion'
                  : 'Submit Correction',
            onPress: handleSubmitRequest,
            disabled:
              submitRequest.isPending ||
              (requestType === 'deletion' && confirmText !== 'DELETE') ||
              (requestType === 'correction' && !confirmText.trim()),
            color: requestType === 'deletion' ? 'error' : undefined,
          }}
          secondaryAction={{
            label: 'Cancel',
            onPress: () => setRequestModalOpen(false),
            disabled: submitRequest.isPending,
          }}
        />
      </Modal>
    </ScrollView>
  )
}
