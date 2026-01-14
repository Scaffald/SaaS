import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { Stack, Row, Text, Card } from '@unicornlove/beyond-ui';
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
    <Card style={{ border: '1px solid var(--color-border)', padding: 'var(--space-6)' }}>
      <Stack style={{ gap: 'var(--space-4)' }}>
        <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 'var(--font-size-6)', fontWeight: 600, color: 'var(--color-gray-12)' }}>
            Broker Certification
          </Text>
          {isSigned && (
            <Row style={{ alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-green-10)' }}>
              <CheckCircle size={20} />
              <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500 }}>Signed</Text>
            </Row>
          )}
        </Row>

        <Row
          style={{
            flexWrap: 'wrap',
            gap: 'var(--space-4)',
          }}
        >
          <Stack style={{ flex: 1, minWidth: '100%' }}>
            <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-gray-12)', display: 'block', marginBottom: 'var(--space-2)' }}>
              Agency Name <span style={{ color: 'var(--color-red-10)' }}>*</span>
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
          </Stack>

          <Stack style={{ flex: 1, minWidth: '100%' }}>
            <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-gray-12)', display: 'block', marginBottom: 'var(--space-2)' }}>
              Broker Full Name / Title <span style={{ color: 'var(--color-red-10)' }}>*</span>
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
          </Stack>

          <Stack style={{ flex: 1, minWidth: '100%' }}>
            <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-gray-12)', display: 'block', marginBottom: 'var(--space-2)' }}>
              Title <span style={{ color: 'var(--color-red-10)' }}>*</span>
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
          </Stack>

          <Stack style={{ flex: 1, minWidth: '100%' }}>
            <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-gray-12)', display: 'block', marginBottom: 'var(--space-2)' }}>
              Digital Signature <span style={{ color: 'var(--color-red-10)' }}>*</span>
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
            <Text style={{ fontSize: 'var(--font-size-1)', color: 'var(--color-gray-11)', marginTop: 'var(--space-1)' }}>
              By typing your name, you are providing a legal digital signature
            </Text>
          </Stack>

          {existingSignature && (
            <Stack style={{ flex: 1, minWidth: '100%' }}>
              <Card style={{ backgroundColor: 'var(--color-green-3)', border: '1px solid var(--color-green-6)', borderRadius: 'var(--radius-4)', padding: 'var(--space-3)' }}>
                <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-green-11)' }}>
                  Signed on{' '}
                  {new Date(existingSignature.signature_date).toLocaleDateString()}{' '}
                  at{' '}
                  {new Date(existingSignature.signature_date).toLocaleTimeString()}
                </Text>
              </Card>
            </Stack>
          )}
        </Row>

        {!isSigned && !disabled && (
          <Row style={{ justifyContent: 'flex-end', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
            <Button
              onPress={handleSave}
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
          </Row>
        )}
      </Stack>
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
    <Card style={{ border: '1px solid var(--color-border)', padding: 'var(--space-6)' }}>
      <Stack style={{ gap: 'var(--space-4)' }}>
        <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 'var(--font-size-6)', fontWeight: 600, color: 'var(--color-gray-12)' }}>
            Subcontractor Certification
          </Text>
          {isSigned && (
            <Row style={{ alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-green-10)' }}>
              <CheckCircle size={20} />
              <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500 }}>Signed</Text>
            </Row>
          )}
        </Row>

        <Row
          style={{
            flexWrap: 'wrap',
            gap: 'var(--space-4)',
          }}
        >
          <Stack style={{ flex: 1, minWidth: '100%' }}>
            <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-gray-12)', display: 'block', marginBottom: 'var(--space-2)' }}>
              Subcontractor Company Name <span style={{ color: 'var(--color-red-10)' }}>*</span>
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
          </Stack>

          <Stack style={{ flex: 1, minWidth: '100%' }}>
            <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-gray-12)', display: 'block', marginBottom: 'var(--space-2)' }}>
              Authorized Representative Name{' '}
              <span style={{ color: 'var(--color-red-10)' }}>*</span>
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
          </Stack>

          <Stack style={{ flex: 1, minWidth: '100%' }}>
            <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-gray-12)', display: 'block', marginBottom: 'var(--space-2)' }}>
              Title <span style={{ color: 'var(--color-red-10)' }}>*</span>
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
          </Stack>

          <Stack style={{ flex: 1, minWidth: '100%' }}>
            <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-gray-12)', display: 'block', marginBottom: 'var(--space-2)' }}>
              Contractor License Number <span style={{ color: 'var(--color-red-10)' }}>*</span>
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
          </Stack>

          <Stack style={{ flex: 1, minWidth: '100%' }}>
            <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-gray-12)', display: 'block', marginBottom: 'var(--space-2)' }}>
              Scope of Work / Trade <span style={{ color: 'var(--color-red-10)' }}>*</span>
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
          </Stack>

          <Stack style={{ flex: 1, minWidth: '100%' }}>
            <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-gray-12)', display: 'block', marginBottom: 'var(--space-2)' }}>
              Digital Signature <span style={{ color: 'var(--color-red-10)' }}>*</span>
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
            <Text style={{ fontSize: 'var(--font-size-1)', color: 'var(--color-gray-11)', marginTop: 'var(--space-1)' }}>
              By typing your name, you are providing a legal digital signature
            </Text>
          </Stack>

          {existingSignature && (
            <Stack style={{ flex: 1, minWidth: '100%' }}>
              <Card style={{ backgroundColor: 'var(--color-green-3)', border: '1px solid var(--color-green-6)', borderRadius: 'var(--radius-4)', padding: 'var(--space-3)' }}>
                <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-green-11)' }}>
                  Signed on{' '}
                  {new Date(existingSignature.signature_date).toLocaleDateString()}{' '}
                  at{' '}
                  {new Date(existingSignature.signature_date).toLocaleTimeString()}
                </Text>
              </Card>
            </Stack>
          )}
        </Row>

        {!isSigned && !disabled && (
          <Row style={{ justifyContent: 'flex-end', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
            <Button
              onPress={handleSave}
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
          </Row>
        )}
      </Stack>
    </Card>
  );
}
