import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';
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
    <div className="bg-surface rounded-lg border border-border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">
          Broker Certification
        </h3>
        {isSigned && (
          <div className="flex items-center space-x-2 text-success-600">
            <CheckCircle size={20} />
            <span className="text-sm font-medium">Signed</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-text-primary mb-2">
            Agency Name <span className="text-error-500">*</span>
          </label>
          <input
            type="text"
            value={agencyName}
            onChange={(e) => setAgencyName(e.target.value)}
            disabled={disabled || isSigned}
            placeholder="Insurance brokerage name"
            className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-bg-secondary disabled:text-text-tertiary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Broker Full Name / Title <span className="text-error-500">*</span>
          </label>
          <input
            type="text"
            value={brokerFullName}
            onChange={(e) => setBrokerFullName(e.target.value)}
            disabled={disabled || isSigned}
            placeholder="Full name"
            className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-bg-secondary disabled:text-text-tertiary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Title <span className="text-error-500">*</span>
          </label>
          <input
            type="text"
            value={brokerTitle}
            onChange={(e) => setBrokerTitle(e.target.value)}
            disabled={disabled || isSigned}
            placeholder="Job title"
            className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-bg-secondary disabled:text-text-tertiary"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-text-primary mb-2">
            Digital Signature <span className="text-error-500">*</span>
          </label>
          <input
            type="text"
            value={digitalSignature}
            onChange={(e) => setDigitalSignature(e.target.value)}
            disabled={disabled || isSigned}
            placeholder="Type your full name to sign"
            className="w-full border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent font-signature text-lg disabled:bg-bg-secondary disabled:text-text-tertiary"
            style={{ fontFamily: 'cursive' }}
          />
          <p className="text-xs text-text-secondary mt-1">
            By typing your name, you are providing a legal digital signature
          </p>
        </div>

        {existingSignature && (
          <div className="md:col-span-2 bg-success-50 border border-success-200 rounded-lg p-3">
            <p className="text-sm text-success-900">
              Signed on{' '}
              {new Date(existingSignature.signature_date).toLocaleDateString()}{' '}
              at{' '}
              {new Date(existingSignature.signature_date).toLocaleTimeString()}
            </p>
          </div>
        )}
      </div>

      {!isSigned && !disabled && (
        <div className="flex justify-end pt-4 border-t border-border">
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
        </div>
      )}
    </div>
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
    <div className="bg-surface rounded-lg border border-border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">
          Subcontractor Certification
        </h3>
        {isSigned && (
          <div className="flex items-center space-x-2 text-success-600">
            <CheckCircle size={20} />
            <span className="text-sm font-medium">Signed</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-text-primary mb-2">
            Subcontractor Company Name <span className="text-error-500">*</span>
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            disabled={disabled || isSigned}
            placeholder="Must match CSLB license name"
            className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-bg-secondary disabled:text-text-tertiary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Authorized Representative Name{' '}
            <span className="text-error-500">*</span>
          </label>
          <input
            type="text"
            value={repName}
            onChange={(e) => setRepName(e.target.value)}
            disabled={disabled || isSigned}
            placeholder="Full name"
            className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-bg-secondary disabled:text-text-tertiary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Title <span className="text-error-500">*</span>
          </label>
          <input
            type="text"
            value={repTitle}
            onChange={(e) => setRepTitle(e.target.value)}
            disabled={disabled || isSigned}
            placeholder="Job title"
            className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-bg-secondary disabled:text-text-tertiary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Contractor License Number <span className="text-error-500">*</span>
          </label>
          <input
            type="text"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            disabled={disabled || isSigned}
            placeholder="As per CSLB"
            className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-bg-secondary disabled:text-text-tertiary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Scope of Work / Trade <span className="text-error-500">*</span>
          </label>
          <input
            type="text"
            value={scopeOfWork}
            onChange={(e) => setScopeOfWork(e.target.value)}
            disabled={disabled || isSigned}
            placeholder="Trade discipline"
            className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-bg-secondary disabled:text-text-tertiary"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-text-primary mb-2">
            Digital Signature <span className="text-error-500">*</span>
          </label>
          <input
            type="text"
            value={digitalSignature}
            onChange={(e) => setDigitalSignature(e.target.value)}
            disabled={disabled || isSigned}
            placeholder="Type your full name to sign"
            className="w-full border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent font-signature text-lg disabled:bg-bg-secondary disabled:text-text-tertiary"
            style={{ fontFamily: 'cursive' }}
          />
          <p className="text-xs text-text-secondary mt-1">
            By typing your name, you are providing a legal digital signature
          </p>
        </div>

        {existingSignature && (
          <div className="md:col-span-2 bg-success-50 border border-success-200 rounded-lg p-3">
            <p className="text-sm text-success-900">
              Signed on{' '}
              {new Date(existingSignature.signature_date).toLocaleDateString()}{' '}
              at{' '}
              {new Date(existingSignature.signature_date).toLocaleTimeString()}
            </p>
          </div>
        )}
      </div>

      {!isSigned && !disabled && (
        <div className="flex justify-end pt-4 border-t border-border">
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
        </div>
      )}
    </div>
  );
}
