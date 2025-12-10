/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Send,
  AlertCircle,
  CheckCircle,
  Info,
} from 'lucide-react';
import { useBrokerAcknowledgements } from '../../hooks/useBrokerAcknowledgements';
import { AcknowledgementCoverageItem } from '../../types';
import CoverageVerificationSection from './CoverageVerificationSection';
import {
  BrokerCertification,
  SubcontractorCertification,
} from './CertificationSection';
import Button from '../Common/Button';

const COVERAGE_REQUIREMENTS = {
  general_liability: [
    {
      name: 'Additional Insured – Ongoing Operations (CG 2010 or equivalent)',
      description: '',
    },
    {
      name: 'Additional Insured – Completed Operations (CG 2037 or equivalent)',
      description: '',
    },
    { name: 'Primary and Non-Contributory Endorsement', description: '' },
    { name: 'Waiver of Subrogation', description: '' },
  ],
  auto_liability: [
    { name: 'Additional Insured Endorsement', description: '' },
    { name: 'Primary and Non-Contributory Endorsement', description: '' },
    { name: 'Waiver of Subrogation', description: '' },
  ],
  umbrella_excess: [
    {
      name: 'Coverage includes GL, Auto, and WC/Employers Liability following form',
      description: '',
    },
  ],
  workers_comp: [
    { name: 'Statutory coverage per jurisdiction', description: '' },
    { name: 'Waiver of Subrogation Endorsement', description: '' },
  ],
  pollution_liability: [
    { name: 'Additional Insured Endorsement', description: '' },
    { name: 'Waiver of Subrogation', description: '' },
  ],
  professional_liability: [
    { name: 'Additional Insured Endorsement', description: '' },
    { name: 'Waiver of Subrogation', description: '' },
  ],
  residential_construction: [
    {
      name: '"No Restriction for Residential or Custom Home Work" verbiage present',
      description: '',
    },
  ],
  subsidence_earth_movement: [
    {
      name: '"No Restriction for Subsidence and Earth Movement" verbiage included',
      description: '',
    },
  ],
  xcu_coverage: [
    { name: '"No Restriction for XCU" verbiage included', description: '' },
  ],
};

export default function BrokerAcknowledgementFormPage() {
  const navigate = useNavigate();
  const { formId } = useParams<{ formId: string }>();
  const {
    currentForm,
    loading,
    fetchFormById,
    updateForm,
    saveCoverageItems,
    saveSignature,
    submitForm,
    calculateComplianceScore,
    getMissingEndorsements,
  } = useBrokerAcknowledgements({ formId });

  const [coverageItems, setCoverageItems] = useState<
    AcknowledgementCoverageItem[]
  >([]);
  const [hasHazardousMaterials, setHasHazardousMaterials] = useState(false);
  const [hasTrenching, setHasTrenching] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (formId) {
      fetchFormById(formId);
    }
  }, [formId]);

  useEffect(() => {
    if (currentForm) {
      setCoverageItems(currentForm.coverage_items || []);
      setHasHazardousMaterials(currentForm.involves_hazardous_materials);
      setHasTrenching(currentForm.involves_trenching);
    }
  }, [currentForm]);

  const handleCoverageItemsChange = (
    items: Partial<AcknowledgementCoverageItem>[]
  ) => {
    setCoverageItems(items as AcknowledgementCoverageItem[]);
    triggerAutoSave(items);
  };

  const triggerAutoSave = (items: Partial<AcknowledgementCoverageItem>[]) => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    const timeout = setTimeout(async () => {
      await handleSave(items);
    }, 2000);

    setAutoSaveTimeout(timeout);
  };

  const handleSave = async (items?: Partial<AcknowledgementCoverageItem>[]) => {
    if (!formId) return;

    setIsSaving(true);
    setSaveMessage('');

    try {
      if (items) {
        await saveCoverageItems(items);
      }

      const score = calculateComplianceScore(coverageItems);
      const missingEndorsements = getMissingEndorsements(coverageItems);

      await updateForm(formId, {
        compliance_score: score,
        missing_endorsements: missingEndorsements,
        involves_hazardous_materials: hasHazardousMaterials,
        involves_trenching: hasTrenching,
      });

      setSaveMessage('Saved successfully');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error saving form:', error);
      setSaveMessage('Error saving form');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignatureSave = async (signature: unknown) => {
    if (!formId) return;
    await saveSignature(signature);
    await fetchFormById(formId);
  };

  const handleSubmit = async () => {
    if (!formId || !currentForm) return;

    const brokerSignature = currentForm.signatures?.find(
      (s) => s.signature_type === 'broker'
    );
    const subcontractorSignature = currentForm.signatures?.find(
      (s) => s.signature_type === 'subcontractor'
    );

    if (!brokerSignature || !subcontractorSignature) {
      alert(
        'Both broker and subcontractor certifications must be signed before submission.'
      );
      return;
    }

    const hasAllCoverageVerified = coverageItems.every(
      (item) => item.verification_status !== 'not_applicable'
    );

    if (!hasAllCoverageVerified) {
      const confirmSubmit = window.confirm(
        'Some coverage items are not yet verified. Are you sure you want to submit?'
      );
      if (!confirmSubmit) return;
    }

    try {
      await submitForm(formId);
      alert('Form submitted successfully!');
      navigate('/broker/acknowledgements');
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit form. Please try again.');
    }
  };

  if (!formId) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle size={48} className="text-error-600 mb-4" />
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          No Form Selected
        </h2>
        <p className="text-text-secondary mb-6">
          Please select a form to view or edit.
        </p>
        <button
          onClick={() => navigate('/broker/acknowledgements')}
          className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Forms List</span>
        </button>
      </div>
    );
  }

  if (loading || !currentForm) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const isReadOnly = [
    'submitted',
    'under_review',
    'approved',
    'rejected',
  ].includes(currentForm.status);

  const brokerSignature = currentForm.signatures?.find(
    (s) => s.signature_type === 'broker'
  );
  const subcontractorSignature = currentForm.signatures?.find(
    (s) => s.signature_type === 'subcontractor'
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/broker/acknowledgements')}
            className="flex items-center space-x-2 text-text-secondary hover:text-text-primary mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <h1 className="text-2xl font-bold text-text-primary">
            Broker Acknowledgement Form - Tier 1
          </h1>
          <p className="text-text-secondary mt-1">
            {currentForm.gc_project_name}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {saveMessage && (
            <span
              className={`text-sm ${
                saveMessage.includes('Error')
                  ? 'text-error-600'
                  : 'text-success-600'
              }`}
            >
              {saveMessage}
            </span>
          )}
          {!isReadOnly && (
            <>
              <Button
                variant="outline"
                onClick={() => handleSave()}
                disabled={isSaving}
              >
                <Save size={16} className="mr-2" />
                {isSaving ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button onClick={handleSubmit}>
                <Send size={16} className="mr-2" />
                Submit Form
              </Button>
            </>
          )}
        </div>
      </div>

      {isReadOnly && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 flex items-start space-x-3">
          <Info size={20} className="text-primary-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-primary-900">
              Form Status: {currentForm.status}
            </p>
            <p className="text-sm text-primary-700 mt-1">
              This form has been submitted and is locked for editing.
            </p>
          </div>
        </div>
      )}

      <div className="bg-surface rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          General Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary">
              Subcontractor Company
            </label>
            <p className="text-text-primary font-medium">
              {currentForm.subcontractor_company_name}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary">
              Broker / Agency
            </label>
            <p className="text-text-primary font-medium">
              {currentForm.broker_agency_name}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary">
              Broker Contact
            </label>
            <p className="text-text-primary font-medium">
              {currentForm.broker_contact_name}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary">
              Broker Email
            </label>
            <p className="text-text-primary font-medium">
              {currentForm.broker_email}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary">
              Date Issued
            </label>
            <p className="text-text-primary font-medium">
              {new Date(currentForm.date_issued).toLocaleDateString()}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary">
              Due Date
            </label>
            <p className="text-text-primary font-medium">
              {new Date(currentForm.date_due).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 flex items-start space-x-3">
        <AlertCircle
          size={20}
          className="text-warning-600 mt-0.5 flex-shrink-0"
        />
        <div className="text-sm text-warning-900">
          <p className="font-medium mb-1">Important Notes:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              No new insurance should be purchased until the project contract is
              executed
            </li>
            <li>
              All endorsement forms must include corresponding policy numbers
            </li>
            <li>
              Endorsements must match the insured name and W-9 provided in Phase
              1
            </li>
            <li>
              Incomplete forms or missing endorsements will delay onboarding
            </li>
          </ul>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold text-text-primary">
          Insurance Coverage Verification
        </h2>

        <CoverageVerificationSection
          title="(1) General Liability"
          minLimits="$1,000,000 per occurrence, $2,000,000 aggregate"
          requirements={COVERAGE_REQUIREMENTS.general_liability}
          coverageCategory="general_liability"
          formId={formId!}
          existingItems={coverageItems}
          onChange={handleCoverageItemsChange}
          disabled={isReadOnly}
        />

        <CoverageVerificationSection
          title="(2) Automobile Liability"
          minLimits="$1,000,000 combined single limit per accident"
          requirements={COVERAGE_REQUIREMENTS.auto_liability}
          coverageCategory="auto_liability"
          formId={formId!}
          existingItems={coverageItems}
          onChange={handleCoverageItemsChange}
          disabled={isReadOnly}
        />

        <CoverageVerificationSection
          title="(3) Umbrella / Excess Liability"
          minLimits="$3,000,000 per occurrence and aggregate"
          requirements={COVERAGE_REQUIREMENTS.umbrella_excess}
          coverageCategory="umbrella_excess"
          formId={formId!}
          existingItems={coverageItems}
          onChange={handleCoverageItemsChange}
          disabled={isReadOnly}
        />

        <CoverageVerificationSection
          title="(4) Workers' Compensation / Employers' Liability"
          minLimits="$1,000,000 per accident, per employee, per policy"
          requirements={COVERAGE_REQUIREMENTS.workers_comp}
          coverageCategory="workers_comp"
          formId={formId!}
          existingItems={coverageItems}
          onChange={handleCoverageItemsChange}
          disabled={isReadOnly}
        />

        {currentForm.requires_pollution_liability && (
          <CoverageVerificationSection
            title="(5) Pollution Liability"
            minLimits="$1,000,000"
            description="Applies to: Drywall, Fire Sprinklers, HVAC, Plumbing, Roofing, Stucco, Waterproofing, Glazing, Landscape/Irrigation"
            requirements={COVERAGE_REQUIREMENTS.pollution_liability}
            coverageCategory="pollution_liability"
            formId={formId!}
            existingItems={coverageItems}
            onChange={handleCoverageItemsChange}
            disabled={isReadOnly}
          />
        )}

        <div className="bg-surface rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            (6) Hazardous Materials Work
          </h3>
          <p className="text-sm text-text-secondary mb-4">
            If the subcontractor's scope involves creating, hauling, or
            disposing of hazardous waste, pollution coverage must include the
            appropriate endorsements.
          </p>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={hasHazardousMaterials}
              onChange={(e) => setHasHazardousMaterials(e.target.checked)}
              disabled={isReadOnly}
              className="rounded border-border text-primary-600"
            />
            <span className="text-sm text-text-primary">
              Yes, hazardous materials work is included in scope
            </span>
          </label>
        </div>

        {currentForm.requires_professional_liability && (
          <CoverageVerificationSection
            title="(7) Professional Liability"
            minLimits="$1,000,000"
            description="Required for trades involving design, engineering, or professional services"
            requirements={COVERAGE_REQUIREMENTS.professional_liability}
            coverageCategory="professional_liability"
            formId={formId!}
            existingItems={coverageItems}
            onChange={handleCoverageItemsChange}
            disabled={isReadOnly}
          />
        )}

        {currentForm.involves_residential_work && (
          <CoverageVerificationSection
            title="(8) Residential Construction Work"
            description="Required for new residential or custom home construction"
            requirements={COVERAGE_REQUIREMENTS.residential_construction}
            coverageCategory="residential_construction"
            formId={formId!}
            existingItems={coverageItems}
            onChange={handleCoverageItemsChange}
            disabled={isReadOnly}
          />
        )}

        <div className="bg-surface rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            (9) Trenching or Excavation Work
          </h3>
          <p className="text-sm text-text-secondary mb-4">
            If trenching, excavation, or underground work is part of scope, the
            following must be confirmed.
          </p>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={hasTrenching}
              onChange={(e) => setHasTrenching(e.target.checked)}
              disabled={isReadOnly}
              className="rounded border-border text-primary-600"
            />
            <span className="text-sm text-text-primary">
              Yes, trenching / digging work is included in scope
            </span>
          </label>
        </div>

        {hasTrenching && (
          <>
            <CoverageVerificationSection
              title="(10) Subsidence and Earth Movement"
              requirements={COVERAGE_REQUIREMENTS.subsidence_earth_movement}
              coverageCategory="subsidence_earth_movement"
              formId={formId!}
              existingItems={coverageItems}
              onChange={handleCoverageItemsChange}
              disabled={isReadOnly}
            />

            <CoverageVerificationSection
              title="(11) Explosive, Collapse, and Underground (XCU)"
              requirements={COVERAGE_REQUIREMENTS.xcu_coverage}
              coverageCategory="xcu_coverage"
              formId={formId!}
              existingItems={coverageItems}
              onChange={handleCoverageItemsChange}
              disabled={isReadOnly}
            />
          </>
        )}
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold text-text-primary">Certifications</h2>

        <BrokerCertification
          formId={formId!}
          existingSignature={brokerSignature}
          onSave={handleSignatureSave}
          disabled={isReadOnly}
        />

        <SubcontractorCertification
          formId={formId!}
          existingSignature={subcontractorSignature}
          onSave={handleSignatureSave}
          disabled={isReadOnly}
          defaultCompanyName={currentForm.subcontractor_company_name}
        />
      </div>

      {currentForm.compliance_score > 0 && (
        <div className="bg-surface rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Compliance Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-primary-50 rounded-lg">
              <p className="text-3xl font-bold text-primary-600">
                {currentForm.compliance_score}%
              </p>
              <p className="text-sm text-text-secondary mt-1">
                Compliance Score
              </p>
            </div>
            <div className="text-center p-4 bg-success-50 rounded-lg">
              <CheckCircle
                className="mx-auto text-success-600 mb-2"
                size={24}
              />
              <p className="text-sm font-medium text-text-primary">
                {
                  coverageItems.filter(
                    (i) => i.verification_status === 'included'
                  ).length
                }{' '}
                Included
              </p>
            </div>
            <div className="text-center p-4 bg-error-50 rounded-lg">
              <AlertCircle className="mx-auto text-error-600 mb-2" size={24} />
              <p className="text-sm font-medium text-text-primary">
                {
                  coverageItems.filter(
                    (i) => i.verification_status === 'excluded'
                  ).length
                }{' '}
                Missing
              </p>
            </div>
          </div>

          {currentForm.missing_endorsements &&
            currentForm.missing_endorsements.length > 0 && (
              <div className="mt-4 bg-warning-50 border border-warning-200 rounded-lg p-4">
                <p className="font-medium text-warning-900 mb-2">
                  Missing Endorsements:
                </p>
                <ul className="list-disc list-inside text-sm text-warning-800 space-y-1">
                  {currentForm.missing_endorsements.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
