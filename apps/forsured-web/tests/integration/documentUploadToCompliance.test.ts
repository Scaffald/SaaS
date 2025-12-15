/**
 * Migrated from FRS-Prototype/tests/integration/documentUploadToCompliance.test.ts
 *
 * REQ-133: System Integration & End-to-End Testing
 * Integration Suite 1: Document Upload → OCR → Compliance Evaluation
 *
 * Tests the complete flow:
 * 1. Upload insurance document (REQ-124)
 * 2. Trigger OCR extraction (REQ-125)
 * 3. Edit extracted metadata (REQ-167)
 * 4. Evaluate compliance against requirements (REQ-128)
 * 5. Verify compliance score calculated correctly
 * 6. Verify gaps identified correctly
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestDatabase } from '../helpers/testDatabase';
import { ComplianceEvaluationEngine } from '@/lib/compliance/evaluator/evaluationEngine';
import { ExtractedPolicyData, ComplianceStatus } from '@/lib/compliance/evaluator/types';
import { CoverageType } from '@/lib/compliance/types';
import mockDatabase from '@/utils/mockDataStore';

describe('Integration Suite 1: Document Upload → OCR → Compliance Evaluation', () => {
  let manager: any;
  let subcontractor: any;
  let project: any;
  let requirements: any[];
  let evaluationEngine: ComplianceEvaluationEngine;

  beforeEach(async () => {
    // Clean and seed database
    await TestDatabase.cleanAll();
    const users = await TestDatabase.seedUsers();
    manager = users.manager;
    subcontractor = users.subcontractor;

    project = await TestDatabase.seedProject(manager.id);
    requirements = await TestDatabase.seedComplianceRequirements(manager.organization_id);

    evaluationEngine = new ComplianceEvaluationEngine();
  });

  afterEach(async () => {
    await TestDatabase.cleanAll();
  });

  describe('Full Compliance Flow', () => {
    it('successfully processes compliant document from upload to evaluation', async () => {
      // Step 1: Simulate document upload (REQ-124)
      const documentId = TestDatabase.generateId('doc');
      const uploadedDocument = {
        id: documentId,
        file_name: 'general_liability_coi.pdf',
        file_size: 256000,
        file_type: 'application/pdf',
        uploaded_by: subcontractor.id,
        entity_type: 'project' as const,
        entity_id: project.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockDatabase.seedData('attachments', [uploadedDocument]);

      // Step 2: Simulate OCR extraction (REQ-125)
      const ocrExtractedData: ExtractedPolicyData = {
        policy_number: 'GL-2024-12345',
        carrier: 'ABC Insurance Company',
        effective_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        expiration_date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        coverage_types: [
          {
            type: CoverageType.GENERAL_LIABILITY,
            per_occurrence_limit: 1000000,
            aggregate_limit: 2000000,
          },
          {
            type: CoverageType.WORKERS_COMP,
            per_occurrence_limit: 1000000,
          },
        ],
        endorsements: ['additional_insured', 'waiver_of_subrogation'],
      };

      const aiExtraction = {
        id: TestDatabase.generateId('extraction'),
        document_id: documentId,
        policy_number: ocrExtractedData.policy_number,
        carrier: ocrExtractedData.carrier,
        coverage_amounts: ocrExtractedData.coverage_types,
        effective_date: ocrExtractedData.effective_date,
        expiry_date: ocrExtractedData.expiration_date,
        named_insureds: [subcontractor.company],
        confidence: 95,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockDatabase.seedData('ai_extractions', [aiExtraction]);

      // Step 3: Edit extracted metadata (REQ-167) - simulated as user verification
      const verifiedData = { ...ocrExtractedData };

      // Step 4: Evaluate compliance (REQ-128)
      const evaluationRequest = {
        policy_id: TestDatabase.generateId('policy'),
        project_id: project.id,
        extracted_data: verifiedData,
      };

      const evaluationResult = await evaluationEngine.evaluate(
        evaluationRequest,
        requirements,
        project.start_date,
        project.end_date
      );

      // Step 5: Verify compliance score
      expect(evaluationResult.score).toBe(100);
      expect(evaluationResult.status).toBe(ComplianceStatus.COMPLIANT);

      // Step 6: Verify gaps (should be none)
      expect(evaluationResult.gaps).toHaveLength(0);

      // Verify metadata
      expect(evaluationResult.policy_id).toBe(evaluationRequest.policy_id);
      expect(evaluationResult.project_id).toBe(project.id);
      expect(evaluationResult.metadata.total_requirements_checked).toBe(2);
    });

    it('identifies gaps when document is non-compliant', async () => {
      // Step 1: Upload document
      const documentId = TestDatabase.generateId('doc');

      // Step 2: OCR extraction with insufficient coverage
      const ocrExtractedData: ExtractedPolicyData = {
        policy_number: 'GL-2024-67890',
        carrier: 'XYZ Insurance Company',
        effective_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        expiration_date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        coverage_types: [
          {
            type: CoverageType.GENERAL_LIABILITY,
            per_occurrence_limit: 500000, // Insufficient (requires 1M)
            aggregate_limit: 1000000, // Insufficient (requires 2M)
          },
          // Missing Workers Comp
        ],
        endorsements: ['additional_insured'], // Missing waiver_of_subrogation
      };

      // Step 3: Evaluate compliance
      const evaluationRequest = {
        policy_id: TestDatabase.generateId('policy'),
        project_id: project.id,
        extracted_data: ocrExtractedData,
      };

      const evaluationResult = await evaluationEngine.evaluate(
        evaluationRequest,
        requirements,
        project.start_date,
        project.end_date
      );

      // Verify score is reduced
      expect(evaluationResult.score).toBeLessThan(100);
      expect(evaluationResult.status).not.toBe(ComplianceStatus.COMPLIANT);

      // Verify gaps identified
      expect(evaluationResult.gaps.length).toBeGreaterThan(0);

      // Check for specific gaps
      const insufficientLimitGap = evaluationResult.gaps.find(
        (g) => g.type === 'insufficient_amount' && g.coverage_type === CoverageType.GENERAL_LIABILITY
      );
      expect(insufficientLimitGap).toBeDefined();
      expect(insufficientLimitGap?.current_value).toBe(500000);
      expect(insufficientLimitGap?.required_value).toBe(1000000);

      const missingCoverageGap = evaluationResult.gaps.find(
        (g) => g.type === 'missing_coverage' && g.coverage_type === CoverageType.WORKERS_COMP
      );
      expect(missingCoverageGap).toBeDefined();

      const missingEndorsementGap = evaluationResult.gaps.find(
        (g) => g.type === 'missing_endorsement' && g.endorsement === 'waiver_of_subrogation'
      );
      expect(missingEndorsementGap).toBeDefined();
    });

    it('handles low-confidence OCR extractions requiring manual edit', async () => {
      // Step 1: Upload document
      const documentId = TestDatabase.generateId('doc');

      // Step 2: OCR extraction with low confidence
      const lowConfidenceExtraction = {
        id: TestDatabase.generateId('extraction'),
        document_id: documentId,
        policy_number: 'UNCLEAR-12345',
        carrier: 'ABC Insurance',
        confidence: 45, // Low confidence - requires manual review
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockDatabase.seedData('ai_extractions', [lowConfidenceExtraction]);

      // Verify low confidence is flagged
      const extractions = await mockDatabase.query('ai_extractions', { document_id: documentId });
      expect(extractions[0].confidence).toBeLessThan(70); // Threshold for manual review

      // Step 3: Manual edit/correction (REQ-167)
      const correctedData: ExtractedPolicyData = {
        policy_number: 'GL-2024-CORRECTED',
        carrier: 'ABC Insurance Company',
        effective_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        expiration_date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        coverage_types: [
          {
            type: CoverageType.GENERAL_LIABILITY,
            per_occurrence_limit: 1000000,
            aggregate_limit: 2000000,
          },
          {
            type: CoverageType.WORKERS_COMP,
            per_occurrence_limit: 1000000,
          },
        ],
        endorsements: ['additional_insured', 'waiver_of_subrogation'],
      };

      // Update extraction with corrected data
      await mockDatabase.update('ai_extractions', lowConfidenceExtraction.id, {
        confidence: 100, // Manual verification = 100% confidence
        policy_number: correctedData.policy_number,
        carrier: correctedData.carrier,
        coverage_amounts: correctedData.coverage_types,
        effective_date: correctedData.effective_date,
        expiry_date: correctedData.expiration_date,
      });

      // Step 4: Evaluate with corrected data
      const evaluationRequest = {
        policy_id: TestDatabase.generateId('policy'),
        project_id: project.id,
        extracted_data: correctedData,
      };

      const evaluationResult = await evaluationEngine.evaluate(
        evaluationRequest,
        requirements,
        project.start_date,
        project.end_date
      );

      // Verify compliant after manual correction
      expect(evaluationResult.score).toBe(100);
      expect(evaluationResult.status).toBe(ComplianceStatus.COMPLIANT);
      expect(evaluationResult.gaps).toHaveLength(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles expired policy during evaluation', async () => {
      const expiredData: ExtractedPolicyData = {
        policy_number: 'EXPIRED-12345',
        carrier: 'Test Insurance',
        effective_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        expiration_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Expired
        coverage_types: [
          {
            type: CoverageType.GENERAL_LIABILITY,
            per_occurrence_limit: 1000000,
            aggregate_limit: 2000000,
          },
        ],
        endorsements: ['additional_insured', 'waiver_of_subrogation'],
      };

      const evaluationResult = await evaluationEngine.evaluate(
        {
          policy_id: TestDatabase.generateId('policy'),
          project_id: project.id,
          extracted_data: expiredData,
        },
        requirements,
        project.start_date,
        project.end_date
      );

      expect(evaluationResult.status).toBe(ComplianceStatus.CRITICAL);
      const expiredGap = evaluationResult.gaps.find((g) => g.type === 'expired_policy');
      expect(expiredGap).toBeDefined();
      expect(expiredGap?.severity).toBe('critical');
    });

    it('completes evaluation in under 5 seconds (performance requirement)', async () => {
      const startTime = Date.now();

      const evaluationData: ExtractedPolicyData = {
        policy_number: 'PERF-TEST-12345',
        carrier: 'Performance Test Insurance',
        effective_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        expiration_date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        coverage_types: [
          {
            type: CoverageType.GENERAL_LIABILITY,
            per_occurrence_limit: 1000000,
            aggregate_limit: 2000000,
          },
          {
            type: CoverageType.WORKERS_COMP,
            per_occurrence_limit: 1000000,
          },
        ],
        endorsements: ['additional_insured', 'waiver_of_subrogation'],
      };

      const evaluationResult = await evaluationEngine.evaluate(
        {
          policy_id: TestDatabase.generateId('policy'),
          project_id: project.id,
          extracted_data: evaluationData,
        },
        requirements,
        project.start_date,
        project.end_date
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000); // REQ-128 performance requirement
      expect(evaluationResult.metadata.evaluation_duration_ms).toBeLessThan(5000);
    });
  });
});
