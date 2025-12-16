import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { YStack, XStack, Text, Card } from '@unicornlove/ui';
import { AcknowledgementSignature } from '../../types';
import Button from '../Common/Button';

interface BrokerCertificationProps {
  formId: string;
  existingSignature?: AcknowledgementSignature;
  onSave: (signature: Partial<AcknowledgementSignature>) => Promise<void>;
  disabled?: boolean;
}

export function BrokerCertification({
  formId,
  existingSignature,
  onSave,
  disabled = false,
}: BrokerCertificationProps) {
  const [agencyName, setAgencyName] = useState(
    existingSignature?.agency_name || ''
  );
  const [brokerFullName, setBrokerFullName] = useState(
    existingSignature?.broker_full_name || ''
  );
  const [brokerTitle, setBrokerTitle] = useState(
    existingSignature?.broker_title || ''
  );
  const [digitalSignature, setDigitalSignature] = useState(
    existingSignature?.digital_signature || ''
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!agencyName || !brokerFullName || !brokerTitle || !digitalSignature) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        form_id: formId,
        signature_type: 'broker',
        agency_name: agencyName,
        broker_full_name: brokerFullName,
        broker_title: brokerTitle,
        digital_signature: digitalSignature,
        signature_date: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error saving broker certification:', error);
      alert('Failed to save certification');
    } finally {
      setSaving(false);
    }
  };

  const isSigned = !!existingSignature?.digital_signature;

  return (
    <Card borderWidth={1} borderColor="$borderColor" padding="$6">
      <YStack gap="$4">
        <XStack alignItems="center" justifyContent="space-between">
          <Text fontSize="$6" fontWeight="600" color="$color12">
            Broker Certification
          </Text>
          {isSigned && (
            <XStack alignItems="center" gap="$2" color="$green10">
              <CheckCircle size={20} />
              <Text fontSize="$2" fontWeight="500">Signed</Text>
            </XStack>
          )}
        </XStack>

        <XStack
          flexWrap="wrap"
          gap="$4"
          $gtMd={{
            flexWrap: 'nowrap',
          }}
        >
          <YStack flex={1} minWidth="100%" $gtMd={{ minWidth: '50%' }}>
            <Text fontSize="$2" fontWeight="500" color="$color12" display="block" marginBottom="$2">
              Agency Name <Text color="$red10">*</Text>
            </Text>
            <input
              type="text"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              disabled={disabled || isSigned}
              placeholder="Insurance brokerage name"
              style={{
                width: '100%',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-4)',
                padding: 'var(--space-2) var(--space-4)',
              }}
            />
          </YStack>

          <YStack flex={1} minWidth="100%" $gtMd={{ minWidth: '50%' }}>
            <Text fontSize="$2" fontWeight="500" color="$color12" display="block" marginBottom="$2">
              Broker Full Name / Title <Text color="$red10">*</Text>
            </Text>
            <input
              type="text"
              value={brokerFullName}
              onChange={(e) => setBrokerFullName(e.target.value)}
              disabled={disabled || isSigned}
              placeholder="Full name"
              style={{
                width: '100%',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-4)',
                padding: 'var(--space-2) var(--space-4)',
              }}
            />
          </YStack>

          <YStack flex={1} minWidth="100%" $gtMd={{ minWidth: '50%' }}>
            <Text fontSize="$2" fontWeight="500" color="$color12" display="block" marginBottom="$2">
              Title <Text color="$red10">*</Text>
            </Text>
            <input
              type="text"
              value={brokerTitle}
              onChange={(e) => setBrokerTitle(e.target.value)}
              disabled={disabled || isSigned}
              placeholder="Job title"
              style={{
                width: '100%',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-4)',
                padding: 'var(--space-2) var(--space-4)',
              }}
            />
          </YStack>

          <YStack flex={1} minWidth="100%" $gtMd={{ minWidth: '100%' }}>
            <Text fontSize="$2" fontWeight="500" color="$color12" display="block" marginBottom="$2">
              Digital Signature <Text color="$red10">*</Text>
            </Text>
            <input
              type="text"
              value={digitalSignature}
              onChange={(e) => setDigitalSignature(e.target.value)}
              disabled={disabled || isSigned}
              placeholder="Type your full name to sign"
              style={{
                width: '100%',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-4)',
                padding: 'var(--space-3) var(--space-4)',
                fontFamily: 'cursive',
                fontSize: 'var(--font-size-6)',
              }}
            />
            <Text fontSize="$1" color="$color11" marginTop="$1">
              By typing your name, you are providing a legal digital signature
            </Text>
          </YStack>

          {existingSignature && (
            <YStack flex={1} minWidth="100%" $gtMd={{ minWidth: '100%' }}>
              <Card backgroundColor="$green3" borderWidth={1} borderColor="$green6" borderRadius="$4" padding="$3">
                <Text fontSize="$2" color="$green11">
                  Signed on{' '}
                  {new Date(existingSignature.signature_date).toLocaleDateString()}{' '}
                  at{' '}
                  {new Date(existingSignature.signature_date).toLocaleTimeString()}
                </Text>
              </Card>
            </YStack>
          )}
        </XStack>

        {!isSigned && !disabled && (
          <XStack justifyContent="flex-end" paddingTop="$4" borderTopWidth={1} borderTopColor="$borderColor">
            <Button
              onClick={handleSave}
              disabled={
                saving ||
                !agencyName ||
                !brokerFullName ||
                !brokerTitle ||
                !digitalSignature
              }
            >
              {saving ? 'Saving...' : 'Save Broker Certification'}
            </Button>
          </XStack>
        )}
      </YStack>
    </Card>
  );
}

interface SubcontractorCertificationProps {
  formId: string;
  existingSignature?: AcknowledgementSignature;
  onSave: (signature: Partial<AcknowledgementSignature>) => Promise<void>;
  disabled?: boolean;
  defaultCompanyName?: string;
  defaultLicenseNumber?: string;
}

export function SubcontractorCertification({
  formId,
  existingSignature,
  onSave,
  disabled = false,
  defaultCompanyName = '',
  defaultLicenseNumber = '',
}: SubcontractorCertificationProps) {
  const [companyName, setCompanyName] = useState(
    existingSignature?.subcontractor_company_name || defaultCompanyName
  );
  const [repName, setRepName] = useState(
    existingSignature?.authorized_rep_name || ''
  );
  const [repTitle, setRepTitle] = useState(
    existingSignature?.authorized_rep_title || ''
  );
  const [licenseNumber, setLicenseNumber] = useState(
    existingSignature?.contractor_license_number || defaultLicenseNumber
  );
  const [scopeOfWork, setScopeOfWork] = useState(
    existingSignature?.scope_of_work || ''
  );
  const [digitalSignature, setDigitalSignature] = useState(
    existingSignature?.digital_signature || ''
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (
      !companyName ||
      !repName ||
      !repTitle ||
      !licenseNumber ||
      !scopeOfWork ||
      !digitalSignature
    ) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        form_id: formId,
        signature_type: 'subcontractor',
        subcontractor_company_name: companyName,
        authorized_rep_name: repName,
        authorized_rep_title: repTitle,
        contractor_license_number: licenseNumber,
        scope_of_work: scopeOfWork,
        digital_signature: digitalSignature,
        signature_date: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error saving subcontractor certification:', error);
      alert('Failed to save certification');
    } finally {
      setSaving(false);
    }
  };

  const isSigned = !!existingSignature?.digital_signature;

  return (
    <Card borderWidth={1} borderColor="$borderColor" padding="$6">
      <YStack gap="$4">
        <XStack alignItems="center" justifyContent="space-between">
          <Text fontSize="$6" fontWeight="600" color="$color12">
            Subcontractor Certification
          </Text>
          {isSigned && (
            <XStack alignItems="center" gap="$2" color="$green10">
              <CheckCircle size={20} />
              <Text fontSize="$2" fontWeight="500">Signed</Text>
            </XStack>
          )}
        </XStack>

        <XStack
          flexWrap="wrap"
          gap="$4"
          $gtMd={{
            flexWrap: 'nowrap',
          }}
        >
          <YStack flex={1} minWidth="100%" $gtMd={{ minWidth: '100%' }}>
            <Text fontSize="$2" fontWeight="500" color="$color12" display="block" marginBottom="$2">
              Subcontractor Company Name <Text color="$red10">*</Text>
            </Text>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={disabled || isSigned}
              placeholder="Must match CSLB license name"
              style={{
                width: '100%',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-4)',
                padding: 'var(--space-2) var(--space-4)',
              }}
            />
          </YStack>

          <YStack flex={1} minWidth="100%" $gtMd={{ minWidth: '50%' }}>
            <Text fontSize="$2" fontWeight="500" color="$color12" display="block" marginBottom="$2">
              Authorized Representative Name{' '}
              <Text color="$red10">*</Text>
            </Text>
            <input
              type="text"
              value={repName}
              onChange={(e) => setRepName(e.target.value)}
              disabled={disabled || isSigned}
              placeholder="Full name"
              style={{
                width: '100%',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-4)',
                padding: 'var(--space-2) var(--space-4)',
              }}
            />
          </YStack>

          <YStack flex={1} minWidth="100%" $gtMd={{ minWidth: '50%' }}>
            <Text fontSize="$2" fontWeight="500" color="$color12" display="block" marginBottom="$2">
              Title <Text color="$red10">*</Text>
            </Text>
            <input
              type="text"
              value={repTitle}
              onChange={(e) => setRepTitle(e.target.value)}
              disabled={disabled || isSigned}
              placeholder="Job title"
              style={{
                width: '100%',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-4)',
                padding: 'var(--space-2) var(--space-4)',
              }}
            />
          </YStack>

          <YStack flex={1} minWidth="100%" $gtMd={{ minWidth: '50%' }}>
            <Text fontSize="$2" fontWeight="500" color="$color12" display="block" marginBottom="$2">
              Contractor License Number <Text color="$red10">*</Text>
            </Text>
            <input
              type="text"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              disabled={disabled || isSigned}
              placeholder="As per CSLB"
              style={{
                width: '100%',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-4)',
                padding: 'var(--space-2) var(--space-4)',
              }}
            />
          </YStack>

          <YStack flex={1} minWidth="100%" $gtMd={{ minWidth: '50%' }}>
            <Text fontSize="$2" fontWeight="500" color="$color12" display="block" marginBottom="$2">
              Scope of Work / Trade <Text color="$red10">*</Text>
            </Text>
            <input
              type="text"
              value={scopeOfWork}
              onChange={(e) => setScopeOfWork(e.target.value)}
              disabled={disabled || isSigned}
              placeholder="Trade discipline"
              style={{
                width: '100%',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-4)',
                padding: 'var(--space-2) var(--space-4)',
              }}
            />
          </YStack>

          <YStack flex={1} minWidth="100%" $gtMd={{ minWidth: '100%' }}>
            <Text fontSize="$2" fontWeight="500" color="$color12" display="block" marginBottom="$2">
              Digital Signature <Text color="$red10">*</Text>
            </Text>
            <input
              type="text"
              value={digitalSignature}
              onChange={(e) => setDigitalSignature(e.target.value)}
              disabled={disabled || isSigned}
              placeholder="Type your full name to sign"
              style={{
                width: '100%',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-4)',
                padding: 'var(--space-3) var(--space-4)',
                fontFamily: 'cursive',
                fontSize: 'var(--font-size-6)',
              }}
            />
            <Text fontSize="$1" color="$color11" marginTop="$1">
              By typing your name, you are providing a legal digital signature
            </Text>
          </YStack>

          {existingSignature && (
            <YStack flex={1} minWidth="100%" $gtMd={{ minWidth: '100%' }}>
              <Card backgroundColor="$green3" borderWidth={1} borderColor="$green6" borderRadius="$4" padding="$3">
                <Text fontSize="$2" color="$green11">
                  Signed on{' '}
                  {new Date(existingSignature.signature_date).toLocaleDateString()}{' '}
                  at{' '}
                  {new Date(existingSignature.signature_date).toLocaleTimeString()}
                </Text>
              </Card>
            </YStack>
          )}
        </XStack>

        {!isSigned && !disabled && (
          <XStack justifyContent="flex-end" paddingTop="$4" borderTopWidth={1} borderTopColor="$borderColor">
            <Button
              onClick={handleSave}
              disabled={
                saving ||
                !companyName ||
                !repName ||
                !repTitle ||
                !licenseNumber ||
                !scopeOfWork ||
                !digitalSignature
              }
            >
              {saving ? 'Saving...' : 'Save Subcontractor Certification'}
            </Button>
          </XStack>
        )}
      </YStack>
    </Card>
  );
}
