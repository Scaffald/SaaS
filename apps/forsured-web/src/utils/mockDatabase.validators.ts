import MockDatabase from './mockDataStore';

// Supabase-compatible error interface
export interface ValidationError {
  message: string;
  code: string;
  details?: string;
  hint?: string;
}

// Validation rule types
export type ValidationRule =
  | { type: 'required'; field: string }
  | { type: 'enum'; field: string; allowedValues: string[] }
  | { type: 'unique'; field: string }
  | { type: 'foreignKey'; field: string; table: string }
  | {
      type: 'check';
      condition: (record: any) => boolean;
      message: string;
      field?: string;
    };

// Schema validation rules for each table
export const SCHEMA_RULES: Record<string, ValidationRule[]> = {
  users: [
    { type: 'required', field: 'email' },
    { type: 'required', field: 'role' },
    { type: 'unique', field: 'email' },
    {
      type: 'enum',
      field: 'role',
      allowedValues: ['admin', 'manager', 'subcontractor', 'broker'],
    },
  ],
  projects: [
    { type: 'required', field: 'name' },
    { type: 'required', field: 'manager_org_id' },
    { type: 'required', field: 'start_date' },
    { type: 'required', field: 'end_date' },
    {
      type: 'check',
      condition: (r) =>
        !r.start_date ||
        !r.end_date ||
        new Date(r.end_date) > new Date(r.start_date),
      message: 'end_date must be after start_date',
      field: 'end_date',
    },
    {
      type: 'enum',
      field: 'compliance_status',
      allowedValues: ['compliant', 'warning', 'critical', 'unknown'],
    },
  ],
  subcontractors: [
    { type: 'required', field: 'company_name' },
    { type: 'required', field: 'organization_id' },
    {
      type: 'enum',
      field: 'risk_level',
      allowedValues: ['low', 'medium', 'high', 'critical'],
    },
  ],
  documents: [
    { type: 'required', field: 'name' },
    { type: 'required', field: 'type' },
    { type: 'required', field: 'status' },
    { type: 'required', field: 'owner_user_id' },
    { type: 'foreignKey', field: 'owner_user_id', table: 'users' },
    { type: 'foreignKey', field: 'uploaded_by_user_id', table: 'users' },
    { type: 'foreignKey', field: 'project_id', table: 'projects' },
    { type: 'foreignKey', field: 'subcontractor_id', table: 'subcontractors' },
    { type: 'foreignKey', field: 'policy_id', table: 'policies' },
    {
      type: 'enum',
      field: 'status',
      allowedValues: ['pending', 'accepted', 'rejected', 'pending_review'],
    },
    {
      type: 'enum',
      field: 'type',
      allowedValues: [
        'certificate_of_insurance',
        'policy_document',
        'endorsement',
        'other',
      ],
    },
  ],
  policies: [
    { type: 'required', field: 'subcontractor_id' },
    { type: 'required', field: 'policy_type' },
    { type: 'required', field: 'policy_number' },
    { type: 'required', field: 'carrier' },
    { type: 'required', field: 'effective_date' },
    { type: 'required', field: 'expiration_date' },
    { type: 'unique', field: 'policy_number' },
    { type: 'foreignKey', field: 'subcontractor_id', table: 'subcontractors' },
    {
      type: 'enum',
      field: 'policy_type',
      allowedValues: [
        'general_liability',
        'workers_comp',
        'commercial_auto',
        'umbrella_excess',
        'professional_liability',
        'builders_risk',
      ],
    },
    {
      type: 'enum',
      field: 'status',
      allowedValues: ['active', 'expired', 'cancelled', 'pending'],
    },
    {
      type: 'check',
      condition: (r) =>
        !r.effective_date ||
        !r.expiration_date ||
        new Date(r.expiration_date) > new Date(r.effective_date),
      message: 'expiration_date must be after effective_date',
      field: 'expiration_date',
    },
  ],
  endorsements: [
    { type: 'required', field: 'policy_id' },
    { type: 'required', field: 'endorsement_type' },
    { type: 'required', field: 'endorsement_number' },
    { type: 'foreignKey', field: 'policy_id', table: 'policies' },
    { type: 'foreignKey', field: 'verified_by_user_id', table: 'users' },
    {
      type: 'enum',
      field: 'endorsement_type',
      allowedValues: [
        'additional_insured',
        'waiver_of_subrogation',
        'primary_non_contributory',
        'notice_of_cancellation',
        'other',
      ],
    },
  ],
  requirements: [
    { type: 'required', field: 'requirement_type' },
    { type: 'required', field: 'requirement_name' },
    { type: 'required', field: 'policy_type' },
    { type: 'foreignKey', field: 'project_id', table: 'projects' },
    {
      type: 'enum',
      field: 'requirement_type',
      allowedValues: [
        'coverage_limit',
        'endorsement',
        'certification',
        'document',
      ],
    },
    {
      type: 'enum',
      field: 'policy_type',
      allowedValues: [
        'general_liability',
        'workers_comp',
        'commercial_auto',
        'umbrella_excess',
        'professional_liability',
        'builders_risk',
      ],
    },
  ],
  compliance_scores: [
    { type: 'required', field: 'project_id' },
    { type: 'required', field: 'subcontractor_id' },
    { type: 'required', field: 'overall_score' },
    { type: 'required', field: 'status' },
    { type: 'foreignKey', field: 'project_id', table: 'projects' },
    { type: 'foreignKey', field: 'subcontractor_id', table: 'subcontractors' },
    { type: 'foreignKey', field: 'evaluated_by_user_id', table: 'users' },
    {
      type: 'check',
      condition: (r) =>
        r.overall_score === undefined ||
        (r.overall_score >= 0 && r.overall_score <= 100),
      message: 'overall_score must be between 0 and 100',
      field: 'overall_score',
    },
    {
      type: 'enum',
      field: 'status',
      allowedValues: ['compliant', 'warning', 'critical', 'non_compliant'],
    },
  ],
  tasks: [
    { type: 'required', field: 'title' },
    { type: 'required', field: 'status' },
    { type: 'required', field: 'created_by_user_id' },
    { type: 'foreignKey', field: 'created_by_user_id', table: 'users' },
    { type: 'foreignKey', field: 'assigned_to_user_id', table: 'users' },
    { type: 'foreignKey', field: 'project_id', table: 'projects' },
    {
      type: 'enum',
      field: 'status',
      allowedValues: ['pending', 'in_progress', 'completed', 'cancelled'],
    },
    {
      type: 'enum',
      field: 'priority',
      allowedValues: ['low', 'medium', 'high', 'urgent'],
    },
  ],
};

// Validation functions
export function validateRequired(
  value: any,
  fieldName: string
): ValidationError | null {
  if (value === null || value === undefined || value === '') {
    return {
      code: '23502',
      message: `null value in column "${fieldName}" violates not-null constraint`,
      details: `Failing row contains null in column "${fieldName}"`,
      hint: `Provide a value for "${fieldName}"`,
    };
  }
  return null;
}

export function validateEnum(
  value: any,
  allowedValues: string[],
  fieldName: string
): ValidationError | null {
  if (value !== null && value !== undefined && !allowedValues.includes(value)) {
    return {
      code: '23514',
      message: `invalid input value for enum column "${fieldName}": "${value}"`,
      details: `Allowed values are: ${allowedValues.join(', ')}`,
      hint: `Use one of the allowed values: ${allowedValues.join(', ')}`,
    };
  }
  return null;
}

export function validateUnique(
  table: string,
  field: string,
  value: any,
  excludeId?: string
): ValidationError | null {
  if (value === null || value === undefined) {
    return null; // Unique constraint doesn't apply to null values
  }

  const existingRecords = MockDatabase.getAll(table);
  const duplicate = existingRecords.find(
    (record: any) => record[field] === value && record.id !== excludeId
  );

  if (duplicate) {
    return {
      code: '23505',
      message: `duplicate key value violates unique constraint "${table}_${field}_key"`,
      details: `Key (${field})=(${value}) already exists.`,
      hint: `Ensure the value of "${field}" is unique`,
    };
  }
  return null;
}

export function validateForeignKey(
  table: string,
  id: any,
  fieldName: string
): ValidationError | null {
  if (id === null || id === undefined) {
    return null; // FK constraint doesn't apply to null values (unless NOT NULL is also set)
  }

  const record = MockDatabase.findById(table, id);
  if (!record) {
    return {
      code: '23503',
      message: `insert or update on table violates foreign key constraint`,
      details: `Key (${fieldName})=(${id}) is not present in table "${table}".`,
      hint: `Ensure the referenced record exists in "${table}"`,
    };
  }
  return null;
}

export function validateCheck(
  condition: boolean,
  message: string,
  fieldName?: string
): ValidationError | null {
  if (!condition) {
    return {
      code: '23514',
      message: `new row violates check constraint: ${message}`,
      details: message,
      hint: fieldName ? `Check the value of "${fieldName}"` : undefined,
    };
  }
  return null;
}

// Main validation function
export function validateRecord(
  table: string,
  record: any,
  excludeId?: string
): ValidationError | null {
  const rules = SCHEMA_RULES[table];
  if (!rules) {
    return null; // No validation rules for this table
  }

  for (const rule of rules) {
    let error: ValidationError | null = null;

    switch (rule.type) {
      case 'required':
        error = validateRequired(record[rule.field], rule.field);
        break;

      case 'enum':
        error = validateEnum(
          record[rule.field],
          rule.allowedValues,
          rule.field
        );
        break;

      case 'unique':
        error = validateUnique(table, rule.field, record[rule.field], excludeId);
        break;

      case 'foreignKey':
        error = validateForeignKey(
          rule.table,
          record[rule.field],
          rule.field
        );
        break;

      case 'check':
        error = validateCheck(rule.condition(record), rule.message, rule.field);
        break;
    }

    if (error) {
      return error; // Return first error encountered
    }
  }

  return null; // All validations passed
}
