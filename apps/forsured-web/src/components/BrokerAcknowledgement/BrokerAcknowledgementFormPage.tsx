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
} from 'lucide-react';
import { YStack, XStack, Text, Card, Spinner } from '@unicornlove/ui';
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
      <YStack alignItems="center" justifyContent="center" height={256}>
        <AlertCircle size={48} color="$red10" marginBottom="$4" />
        <Text fontSize="$7" fontWeight="600" color="$color12" marginBottom="$2">
          No Form Selected
        </Text>
        <Text color="$color11" marginBottom="$6">
          Please select a form to view or edit.
        </Text>
        <XStack
          as="button"
          onPress={() => navigate('/broker/acknowledgements')}
          alignItems="center"
          gap="$2"
          color="$blue10"
          hoverStyle={{
            color: '$blue12',
          }}
        >
          <ArrowLeft size={20} />
          <Text>Back to Forms List</Text>
        </XStack>
      </YStack>
    );
  }

  if (loading || !currentForm) {
    return (
      <YStack alignItems="center" justifyContent="center" height={256}>
        <Spinner size="large" color="$blue10" />
      </YStack>
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
    <YStack gap="$6" paddingBottom="$12">
      <XStack alignItems="center" justifyContent="space-between">
        <YStack>
          <XStack
            as="button"
            onPress={() => navigate('/broker/acknowledgements')}
            alignItems="center"
            gap="$2"
            color="$color11"
            hoverStyle={{
              color: '$color12',
            }}
            marginBottom="$4"
          >
            <ArrowLeft size={20} />
            <Text>Back</Text>
          </XStack>
          <Text fontSize="$8" fontWeight="bold" color="$color12">
            Broker Acknowledgement Form - Tier 1
          </Text>
          <Text color="$color11" marginTop="$1">
            {currentForm.gc_project_name}
          </Text>
        </YStack>

        <XStack alignItems="center" gap="$3">
          {saveMessage && (
            <Text
              fontSize="$2"
              color={saveMessage.includes('Error') ? '$red10' : '$green10'}
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
                <XStack alignItems="center" gap="$2">
                  <Save size={16} />
                  <Text>{isSaving ? 'Saving...' : 'Save Draft'}</Text>
                </XStack>
              </Button>
              <Button onClick={handleSubmit}>
                <XStack alignItems="center" gap="$2">
                  <Send size={16} />
                  <Text>Submit Form</Text>
                </XStack>
              </Button>
            </>
          )}
        </XStack>
      </XStack>

      {isReadOnly && (
        <Card
          backgroundColor="$blue3"
          borderWidth={1}
          borderColor="$blue6"
          borderRadius="$4"
          padding="$4"
        >
          <XStack alignItems="flex-start" gap="$3">
            <Info size={20} color="$blue10" marginTop="$0.5" flexShrink={0} />
            <YStack>
              <Text fontWeight="500" color="$blue11">
              Form Status: {currentForm.status}
              </Text>
              <Text fontSize="$2" color="$blue10" marginTop="$1">
              This form has been submitted and is locked for editing.
              </Text>
            </YStack>
          </XStack>
        </Card>
      )}

      <Card borderWidth={1} borderColor="$borderColor" padding="$6">
        <Text fontSize="$6" fontWeight="600" color="$color12" marginBottom="$4">
          General Information
        </Text>
        <XStack
          flexWrap="wrap"
          gap="$4"
          $gtMd={{
            flexWrap: 'nowrap',
          }}
        >
          <YStack flex={1} minWidth="200px">
            <Text fontSize="$2" fontWeight="500" color="$color11" display="block" marginBottom="$1">
              Subcontractor Company
            </Text>
            <Text color="$color12" fontWeight="500">
              {currentForm.subcontractor_company_name}
            </Text>
          </YStack>
          <YStack flex={1} minWidth="200px">
            <Text fontSize="$2" fontWeight="500" color="$color11" display="block" marginBottom="$1">
              Broker / Agency
            </Text>
            <Text color="$color12" fontWeight="500">
              {currentForm.broker_agency_name}
            </Text>
          </YStack>
          <YStack flex={1} minWidth="200px">
            <Text fontSize="$2" fontWeight="500" color="$color11" display="block" marginBottom="$1">
              Broker Contact
            </Text>
            <Text color="$color12" fontWeight="500">
              {currentForm.broker_contact_name}
            </Text>
          </YStack>
          <YStack flex={1} minWidth="200px">
            <Text fontSize="$2" fontWeight="500" color="$color11" display="block" marginBottom="$1">
              Broker Email
            </Text>
            <Text color="$color12" fontWeight="500">
              {currentForm.broker_email}
            </Text>
          </YStack>
          <YStack flex={1} minWidth="200px">
            <Text fontSize="$2" fontWeight="500" color="$color11" display="block" marginBottom="$1">
              Date Issued
            </Text>
            <Text color="$color12" fontWeight="500">
              {new Date(currentForm.date_issued).toLocaleDateString()}
            </Text>
          </YStack>
          <YStack flex={1} minWidth="200px">
            <Text fontSize="$2" fontWeight="500" color="$color11" display="block" marginBottom="$1">
              Due Date
            </Text>
            <Text color="$color12" fontWeight="500">
              {new Date(currentForm.date_due).toLocaleDateString()}
            </Text>
          </YStack>
        </XStack>
      </Card>

      <Card
        backgroundColor="$orange3"
        borderWidth={1}
        borderColor="$orange6"
        borderRadius="$4"
        padding="$4"
      >
        <XStack alignItems="flex-start" gap="$3">
        <AlertCircle
          size={20}
            color="$orange10"
            marginTop="$0.5"
            flexShrink={0}
          />
          <YStack fontSize="$2" color="$orange11">
            <Text fontWeight="500" marginBottom="$1">Important Notes:</Text>
            <YStack gap="$1" paddingLeft="$4">
              <Text>• No new insurance should be purchased until the project contract is executed</Text>
              <Text>• All endorsement forms must include corresponding policy numbers</Text>
              <Text>• Endorsements must match the insured name and W-9 provided in Phase 1</Text>
              <Text>• Incomplete forms or missing endorsements will delay onboarding</Text>
            </YStack>
          </YStack>
        </XStack>
      </Card>

      <YStack gap="$6">
        <Text fontSize="$7" fontWeight="bold" color="$color12">
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

        <Card borderWidth={1} borderColor="$borderColor" padding="$6">
          <Text fontSize="$6" fontWeight="600" color="$color12" marginBottom="$4">
            (6) Hazardous Materials Work
          </Text>
          <Text fontSize="$2" color="$color11" marginBottom="$4">
            If the subcontractor's scope involves creating, hauling, or
            disposing of hazardous waste, pollution coverage must include the
            appropriate endorsements.
          </Text>
          <XStack
            as="label"
            alignItems="center"
            gap="$3"
          >
            <input
              type="checkbox"
              checked={hasHazardousMaterials}
              onChange={(e) => setHasHazardousMaterials(e.target.checked)}
              disabled={isReadOnly}
            />
            <Text fontSize="$2" color="$color12">
              Yes, hazardous materials work is included in scope
            </Text>
          </XStack>
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

        <Card borderWidth={1} borderColor="$borderColor" padding="$6">
          <Text fontSize="$6" fontWeight="600" color="$color12" marginBottom="$4">
            (9) Trenching or Excavation Work
          </Text>
          <Text fontSize="$2" color="$color11" marginBottom="$4">
            If trenching, excavation, or underground work is part of scope, the
            following must be confirmed.
          </Text>
          <XStack
            as="label"
            alignItems="center"
            gap="$3"
          >
            <input
              type="checkbox"
              checked={hasTrenching}
              onChange={(e) => setHasTrenching(e.target.checked)}
              disabled={isReadOnly}
            />
            <Text fontSize="$2" color="$color12">
              Yes, trenching / digging work is included in scope
            </Text>
          </XStack>
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
      </YStack>

      <YStack gap="$6">
        <Text fontSize="$7" fontWeight="bold" color="$color12">Certifications</Text>

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
      </YStack>

      {currentForm.compliance_score > 0 && (
        <Card borderWidth={1} borderColor="$borderColor" padding="$6">
          <Text fontSize="$6" fontWeight="600" color="$color12" marginBottom="$4">
            Compliance Summary
          </Text>
          <XStack
            flexWrap="wrap"
            gap="$4"
            $gtMd={{
              flexWrap: 'nowrap',
            }}
          >
            <Card
              alignItems="center"
              padding="$4"
              backgroundColor="$blue3"
              borderRadius="$4"
              flex={1}
              minWidth="200px"
            >
              <Text fontSize="$9" fontWeight="bold" color="$blue10">
                {currentForm.compliance_score}%
              </Text>
              <Text fontSize="$2" color="$color11" marginTop="$1">
                Compliance Score
              </Text>
            </Card>
            <Card
              alignItems="center"
              padding="$4"
              backgroundColor="$green3"
              borderRadius="$4"
              flex={1}
              minWidth="200px"
            >
              <CheckCircle
                color="$green10"
                size={24}
                marginBottom="$2"
              />
              <Text fontSize="$2" fontWeight="500" color="$color12">
                {
                  coverageItems.filter(
                    (i) => i.verification_status === 'included'
                  ).length
                }{' '}
                Included
              </Text>
            </Card>
            <Card
              alignItems="center"
              padding="$4"
              backgroundColor="$red3"
              borderRadius="$4"
              flex={1}
              minWidth="200px"
            >
              <AlertCircle color="$red10" size={24} marginBottom="$2" />
              <Text fontSize="$2" fontWeight="500" color="$color12">
                {
                  coverageItems.filter(
                    (i) => i.verification_status === 'excluded'
                  ).length
                }{' '}
                Missing
              </Text>
            </Card>
          </XStack>

          {currentForm.missing_endorsements &&
            currentForm.missing_endorsements.length > 0 && (
              <Card
                marginTop="$4"
                backgroundColor="$orange3"
                borderWidth={1}
                borderColor="$orange6"
                borderRadius="$4"
                padding="$4"
              >
                <Text fontWeight="500" color="$orange11" marginBottom="$2">
                  Missing Endorsements:
                </Text>
                <YStack gap="$1" paddingLeft="$4">
                  {currentForm.missing_endorsements.map((item, index) => (
                    <Text key={index} fontSize="$2" color="$orange10">
                      • {item}
                    </Text>
                  ))}
                </YStack>
              </Card>
            )}
        </Card>
      )}
    </YStack>
  );
}
