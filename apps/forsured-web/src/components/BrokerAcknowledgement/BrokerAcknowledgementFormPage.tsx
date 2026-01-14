/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Send,
  AlertCircle,
  CheckCircle,
  Info,
  Loader2,
} from 'lucide-react';
import { Stack, Row, Text, Card } from '@unicornlove/beyond-ui';
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
      name: 'Additional Insured - Ongoing Operations (CG 2010 or equivalent)',
      description: '',
    },
    {
      name: 'Additional Insured - Completed Operations (CG 2037 or equivalent)',
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
      <Stack style={{ alignItems: 'center', justifyContent: 'center', height: 256 }}>
        <AlertCircle size={48} style={{ color: 'var(--color-red-10)', marginBottom: 'var(--space-4)' }} />
        <Text style={{ fontSize: 'var(--font-size-7)', fontWeight: 600, color: 'var(--color-gray-12)', marginBottom: 'var(--space-2)' }}>
          No Form Selected
        </Text>
        <Text style={{ color: 'var(--color-gray-11)', marginBottom: 'var(--space-6)' }}>
          Please select a form to view or edit.
        </Text>
        <button
          onClick={() => navigate('/broker/acknowledgements')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            color: 'var(--color-blue-10)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={20} />
          <Text>Back to Forms List</Text>
        </button>
      </Stack>
    );
  }

  if (loading || !currentForm) {
    return (
      <Stack style={{ alignItems: 'center', justifyContent: 'center', height: 256 }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-blue-10)' }} />
      </Stack>
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
    <Stack style={{ gap: 'var(--space-6)', paddingBottom: 'var(--space-12)' }}>
      <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack>
          <button
            onClick={() => navigate('/broker/acknowledgements')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              color: 'var(--color-gray-11)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              marginBottom: 'var(--space-4)',
            }}
          >
            <ArrowLeft size={20} />
            <Text>Back</Text>
          </button>
          <Text style={{ fontSize: 'var(--font-size-8)', fontWeight: 'bold', color: 'var(--color-gray-12)' }}>
            Broker Acknowledgement Form - Tier 1
          </Text>
          <Text style={{ color: 'var(--color-gray-11)', marginTop: 'var(--space-1)' }}>
            {currentForm.gc_project_name}
          </Text>
        </Stack>

        <Row style={{ alignItems: 'center', gap: 'var(--space-3)' }}>
          {saveMessage && (
            <Text
              style={{
                fontSize: 'var(--font-size-2)',
                color: saveMessage.includes('Error') ? 'var(--color-red-10)' : 'var(--color-green-10)',
              }}
            >
              {saveMessage}
            </Text>
          )}
          {!isReadOnly && (
            <>
              <Button
                variant="outline"
                onClick={() => handleSave()}
                disabled={isSaving}
              >
                <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Save size={16} />
                  <Text>{isSaving ? 'Saving...' : 'Save Draft'}</Text>
                </Row>
              </Button>
              <Button onPress={handleSubmit}>
                <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Send size={16} />
                  <Text>Submit Form</Text>
                </Row>
              </Button>
            </>
          )}
        </Row>
      </Row>

      {isReadOnly && (
        <Card
          style={{
            backgroundColor: 'var(--color-blue-3)',
            border: '1px solid var(--color-blue-6)',
            borderRadius: 'var(--radius-4)',
            padding: 'var(--space-4)',
          }}
        >
          <Row style={{ alignItems: 'flex-start', gap: 'var(--space-3)' }}>
            <Info size={20} style={{ color: 'var(--color-blue-10)', marginTop: 'var(--space-0-5)', flexShrink: 0 }} />
            <Stack>
              <Text style={{ fontWeight: 500, color: 'var(--color-blue-11)' }}>
              Form Status: {currentForm.status}
              </Text>
              <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-blue-10)', marginTop: 'var(--space-1)' }}>
              This form has been submitted and is locked for editing.
              </Text>
            </Stack>
          </Row>
        </Card>
      )}

      <Card style={{ border: '1px solid var(--color-border)', padding: 'var(--space-6)' }}>
        <Text style={{ fontSize: 'var(--font-size-6)', fontWeight: 600, color: 'var(--color-gray-12)', marginBottom: 'var(--space-4)' }}>
          General Information
        </Text>
        <Row
          style={{
            flexWrap: 'wrap',
            gap: 'var(--space-4)',
          }}
        >
          <Stack style={{ flex: 1, minWidth: '200px' }}>
            <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-gray-11)', display: 'block', marginBottom: 'var(--space-1)' }}>
              Subcontractor Company
            </Text>
            <Text style={{ color: 'var(--color-gray-12)', fontWeight: 500 }}>
              {currentForm.subcontractor_company_name}
            </Text>
          </Stack>
          <Stack style={{ flex: 1, minWidth: '200px' }}>
            <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-gray-11)', display: 'block', marginBottom: 'var(--space-1)' }}>
              Broker / Agency
            </Text>
            <Text style={{ color: 'var(--color-gray-12)', fontWeight: 500 }}>
              {currentForm.broker_agency_name}
            </Text>
          </Stack>
          <Stack style={{ flex: 1, minWidth: '200px' }}>
            <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-gray-11)', display: 'block', marginBottom: 'var(--space-1)' }}>
              Broker Contact
            </Text>
            <Text style={{ color: 'var(--color-gray-12)', fontWeight: 500 }}>
              {currentForm.broker_contact_name}
            </Text>
          </Stack>
          <Stack style={{ flex: 1, minWidth: '200px' }}>
            <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-gray-11)', display: 'block', marginBottom: 'var(--space-1)' }}>
              Broker Email
            </Text>
            <Text style={{ color: 'var(--color-gray-12)', fontWeight: 500 }}>
              {currentForm.broker_email}
            </Text>
          </Stack>
          <Stack style={{ flex: 1, minWidth: '200px' }}>
            <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-gray-11)', display: 'block', marginBottom: 'var(--space-1)' }}>
              Date Issued
            </Text>
            <Text style={{ color: 'var(--color-gray-12)', fontWeight: 500 }}>
              {new Date(currentForm.date_issued).toLocaleDateString()}
            </Text>
          </Stack>
          <Stack style={{ flex: 1, minWidth: '200px' }}>
            <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-gray-11)', display: 'block', marginBottom: 'var(--space-1)' }}>
              Due Date
            </Text>
            <Text style={{ color: 'var(--color-gray-12)', fontWeight: 500 }}>
              {new Date(currentForm.date_due).toLocaleDateString()}
            </Text>
          </Stack>
        </Row>
      </Card>

      <Card
        style={{
          backgroundColor: 'var(--color-orange-3)',
          border: '1px solid var(--color-orange-6)',
          borderRadius: 'var(--radius-4)',
          padding: 'var(--space-4)',
        }}
      >
        <Row style={{ alignItems: 'flex-start', gap: 'var(--space-3)' }}>
        <AlertCircle
          size={20}
            style={{ color: 'var(--color-orange-10)', marginTop: 'var(--space-0-5)', flexShrink: 0 }}
          />
          <Stack style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-orange-11)' }}>
            <Text style={{ fontWeight: 500, marginBottom: 'var(--space-1)' }}>Important Notes:</Text>
            <Stack style={{ gap: 'var(--space-1)', paddingLeft: 'var(--space-4)' }}>
              <Text>- No new insurance should be purchased until the project contract is executed</Text>
              <Text>- All endorsement forms must include corresponding policy numbers</Text>
              <Text>- Endorsements must match the insured name and W-9 provided in Phase 1</Text>
              <Text>- Incomplete forms or missing endorsements will delay onboarding</Text>
            </Stack>
          </Stack>
        </Row>
      </Card>

      <Stack style={{ gap: 'var(--space-6)' }}>
        <Text style={{ fontSize: 'var(--font-size-7)', fontWeight: 'bold', color: 'var(--color-gray-12)' }}>
          Insurance Coverage Verification
        </Text>

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

        <Card style={{ border: '1px solid var(--color-border)', padding: 'var(--space-6)' }}>
          <Text style={{ fontSize: 'var(--font-size-6)', fontWeight: 600, color: 'var(--color-gray-12)', marginBottom: 'var(--space-4)' }}>
            (6) Hazardous Materials Work
          </Text>
          <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-gray-11)', marginBottom: 'var(--space-4)' }}>
            If the subcontractor's scope involves creating, hauling, or
            disposing of hazardous waste, pollution coverage must include the
            appropriate endorsements.
          </Text>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
            }}
          >
            <input
              type="checkbox"
              checked={hasHazardousMaterials}
              onChange={(e) => setHasHazardousMaterials(e.target.checked)}
              disabled={isReadOnly}
            />
            <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-gray-12)' }}>
              Yes, hazardous materials work is included in scope
            </Text>
          </label>
        </Card>

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

        <Card style={{ border: '1px solid var(--color-border)', padding: 'var(--space-6)' }}>
          <Text style={{ fontSize: 'var(--font-size-6)', fontWeight: 600, color: 'var(--color-gray-12)', marginBottom: 'var(--space-4)' }}>
            (9) Trenching or Excavation Work
          </Text>
          <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-gray-11)', marginBottom: 'var(--space-4)' }}>
            If trenching, excavation, or underground work is part of scope, the
            following must be confirmed.
          </Text>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
            }}
          >
            <input
              type="checkbox"
              checked={hasTrenching}
              onChange={(e) => setHasTrenching(e.target.checked)}
              disabled={isReadOnly}
            />
            <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-gray-12)' }}>
              Yes, trenching / digging work is included in scope
            </Text>
          </label>
        </Card>

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
      </Stack>

      <Stack style={{ gap: 'var(--space-6)' }}>
        <Text style={{ fontSize: 'var(--font-size-7)', fontWeight: 'bold', color: 'var(--color-gray-12)' }}>Certifications</Text>

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
      </Stack>

      {currentForm.compliance_score > 0 && (
        <Card style={{ border: '1px solid var(--color-border)', padding: 'var(--space-6)' }}>
          <Text style={{ fontSize: 'var(--font-size-6)', fontWeight: 600, color: 'var(--color-gray-12)', marginBottom: 'var(--space-4)' }}>
            Compliance Summary
          </Text>
          <Row
            style={{
              flexWrap: 'wrap',
              gap: 'var(--space-4)',
            }}
          >
            <Card
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: 'var(--space-4)',
                backgroundColor: 'var(--color-blue-3)',
                borderRadius: 'var(--radius-4)',
                flex: 1,
                minWidth: '200px',
              }}
            >
              <Text style={{ fontSize: 'var(--font-size-9)', fontWeight: 'bold', color: 'var(--color-blue-10)' }}>
                {currentForm.compliance_score}%
              </Text>
              <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-gray-11)', marginTop: 'var(--space-1)' }}>
                Compliance Score
              </Text>
            </Card>
            <Card
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: 'var(--space-4)',
                backgroundColor: 'var(--color-green-3)',
                borderRadius: 'var(--radius-4)',
                flex: 1,
                minWidth: '200px',
              }}
            >
              <CheckCircle
                style={{ color: 'var(--color-green-10)', marginBottom: 'var(--space-2)' }}
                size={24}
              />
              <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-gray-12)' }}>
                {
                  coverageItems.filter(
                    (i) => i.verification_status === 'included'
                  ).length
                }{' '}
                Included
              </Text>
            </Card>
            <Card
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: 'var(--space-4)',
                backgroundColor: 'var(--color-red-3)',
                borderRadius: 'var(--radius-4)',
                flex: 1,
                minWidth: '200px',
              }}
            >
              <AlertCircle style={{ color: 'var(--color-red-10)', marginBottom: 'var(--space-2)' }} size={24} />
              <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-gray-12)' }}>
                {
                  coverageItems.filter(
                    (i) => i.verification_status === 'excluded'
                  ).length
                }{' '}
                Missing
              </Text>
            </Card>
          </Row>

          {currentForm.missing_endorsements &&
            currentForm.missing_endorsements.length > 0 && (
              <Card
                style={{
                  marginTop: 'var(--space-4)',
                  backgroundColor: 'var(--color-orange-3)',
                  border: '1px solid var(--color-orange-6)',
                  borderRadius: 'var(--radius-4)',
                  padding: 'var(--space-4)',
                }}
              >
                <Text style={{ fontWeight: 500, color: 'var(--color-orange-11)', marginBottom: 'var(--space-2)' }}>
                  Missing Endorsements:
                </Text>
                <Stack style={{ gap: 'var(--space-1)', paddingLeft: 'var(--space-4)' }}>
                  {currentForm.missing_endorsements.map((item, index) => (
                    <Text key={index} style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-orange-10)' }}>
                      - {item}
                    </Text>
                  ))}
                </Stack>
              </Card>
            )}
        </Card>
      )}
    </Stack>
  );
}
