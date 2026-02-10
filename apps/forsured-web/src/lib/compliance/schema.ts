/**
 * Compliance Requirements Management System
 * JSON Schema validation for requirement definitions
 */

import {
  CoverageType,
  RequirementDefinition,
  ValidationError,
  ValidationResult
} from './types';

/**
 * JSON Schema version
 */
export const SCHEMA_VERSION = '1.0.0';

/**
 * Validates a requirement definition against JSON schema rules
 * @param definition The requirement definition to validate
 * @param type The coverage type for type-specific validation
 * @returns Validation result with any errors found
 */
export function validateRequirementDefinition(
  definition: RequirementDefinition,
  type: CoverageType
): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate coverage_limits
  if (!definition.coverage_limits) {
    errors.push({
      field: 'coverage_limits',
      message: 'Coverage limits are required'
    });
  } else {
    // Validate all numeric values are positive
    Object.entries(definition.coverage_limits).forEach(([key, value]) => {
      if (value !== undefined && (typeof value !== 'number' || value <= 0)) {
        errors.push({
          field: `coverage_limits.${key}`,
          message: 'Coverage amounts must be positive numbers'
        });
      }
    });

    // Type-specific validation
    switch (type) {
      case CoverageType.GENERAL_LIABILITY:
        if (!definition.coverage_limits.per_occurrence) {
          errors.push({
            field: 'coverage_limits.per_occurrence',
            message: 'Per occurrence limit is required for general liability'
          });
        }
        if (!definition.coverage_limits.aggregate) {
          errors.push({
            field: 'coverage_limits.aggregate',
            message: 'Aggregate limit is required for general liability'
          });
        }
        break;

      case CoverageType.WORKERS_COMP:
        // Workers comp typically uses statutory limits
        break;

      case CoverageType.AUTO_LIABILITY:
        if (!definition.coverage_limits.per_occurrence) {
          errors.push({
            field: 'coverage_limits.per_occurrence',
            message: 'Combined single limit is required for auto liability'
          });
        }
        break;

      case CoverageType.UMBRELLA:
        if (!definition.coverage_limits.per_occurrence) {
          errors.push({
            field: 'coverage_limits.per_occurrence',
            message: 'Coverage limit is required for umbrella policy'
          });
        }
        break;
    }
  }

  // Validate required_endorsements
  if (!definition.required_endorsements) {
    errors.push({
      field: 'required_endorsements',
      message: 'Required endorsements array is required'
    });
  } else if (!Array.isArray(definition.required_endorsements)) {
    errors.push({
      field: 'required_endorsements',
      message: 'Required endorsements must be an array'
    });
  } else {
    // Non-custom types must have at least one endorsement
    if (type !== CoverageType.CUSTOM && definition.required_endorsements.length === 0) {
      errors.push({
        field: 'required_endorsements',
        message: 'At least one endorsement is required for non-custom types'
      });
    }

    // Validate each endorsement
    definition.required_endorsements.forEach((endorsement, index) => {
      if (!endorsement.endorsement_type) {
        errors.push({
          field: `required_endorsements[${index}].endorsement_type`,
          message: 'Endorsement type is required'
        });
      }
      if (!endorsement.description) {
        errors.push({
          field: `required_endorsements[${index}].description`,
          message: 'Endorsement description is required'
        });
      }
    });
  }

  // Validate policy_conditions
  if (!definition.policy_conditions) {
    errors.push({
      field: 'policy_conditions',
      message: 'Policy conditions array is required'
    });
  } else if (!Array.isArray(definition.policy_conditions)) {
    errors.push({
      field: 'policy_conditions',
      message: 'Policy conditions must be an array'
    });
  } else {
    // Validate each condition if present
    definition.policy_conditions.forEach((condition, index) => {
      if (!condition.condition_type) {
        errors.push({
          field: `policy_conditions[${index}].condition_type`,
          message: 'Condition type is required'
        });
      }
      if (!condition.description) {
        errors.push({
          field: `policy_conditions[${index}].description`,
          message: 'Condition description is required'
        });
      }
    });

    // Type-specific condition validation
    if (type === CoverageType.WORKERS_COMP) {
      const hasStateRequirement = definition.policy_conditions.some(
        c => c.condition_type.toLowerCase().includes('state')
      );
      if (!hasStateRequirement) {
        errors.push({
          field: 'policy_conditions',
          message: 'Workers compensation must include state-specific requirements'
        });
      }
    }

    if (type === CoverageType.UMBRELLA) {
      const hasUnderlyingPolicies = definition.policy_conditions.some(
        c => c.condition_type.toLowerCase().includes('underlying') ||
             c.condition_type.toLowerCase().includes('excess')
      );
      if (!hasUnderlyingPolicies) {
        errors.push({
          field: 'policy_conditions',
          message: 'Umbrella policy must reference underlying policies'
        });
      }
    }
  }

  // Validate documentation_requirements
  if (!definition.documentation_requirements) {
    errors.push({
      field: 'documentation_requirements',
      message: 'Documentation requirements array is required'
    });
  } else if (!Array.isArray(definition.documentation_requirements)) {
    errors.push({
      field: 'documentation_requirements',
      message: 'Documentation requirements must be an array'
    });
  } else {
    // Must have at least one required document
    const hasRequiredDoc = definition.documentation_requirements.some(
      doc => doc.is_required
    );
    if (!hasRequiredDoc) {
      errors.push({
        field: 'documentation_requirements',
        message: 'At least one required document must be specified'
      });
    }

    // Validate each documentation requirement
    definition.documentation_requirements.forEach((doc, index) => {
      if (!doc.document_type) {
        errors.push({
          field: `documentation_requirements[${index}].document_type`,
          message: 'Document type is required'
        });
      }
      if (typeof doc.is_required !== 'boolean') {
        errors.push({
          field: `documentation_requirements[${index}].is_required`,
          message: 'is_required must be a boolean'
        });
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates that a requirement name is unique within an organization
 * @param name The requirement name
 * @param organizationId The organization ID
 * @param existingRequirements Array of existing requirements to check against
 * @param excludeId Optional ID to exclude from uniqueness check (for updates)
 * @returns Validation result
 */
export function validateUniqueName(
  name: string,
  organizationId: string,
  existingRequirements: Array<{ id: string; name: string; organization_id: string }>,
  excludeId?: string
): ValidationResult {
  const errors: ValidationError[] = [];

  const duplicate = existingRequirements.find(
    req =>
      req.name.toLowerCase() === name.toLowerCase() &&
      req.organization_id === organizationId &&
      req.id !== excludeId
  );

  if (duplicate) {
    errors.push({
      field: 'name',
      message: 'A requirement with this name already exists in your organization'
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates effective date is not in the past
 * @param effectiveDate The effective date to validate
 * @returns Validation result
 */
export function validateEffectiveDate(effectiveDate: string): ValidationResult {
  const errors: ValidationError[] = [];
  const date = new Date(effectiveDate);
  const now = new Date();

  // Set to start of day for comparison
  date.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  if (date < now) {
    errors.push({
      field: 'effective_date',
      message: 'Effective date cannot be in the past'
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
