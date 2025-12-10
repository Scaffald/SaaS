/**
 * REQ-106: MockDatabase Implementation
 *
 * In-memory database that mirrors Supabase API for frontend development.
 * Includes schema validation, RBAC filtering, and realistic seed data.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
// Note: `any` is intentionally used for dynamic table/column access in generic query builder

import { v4 as uuidv4 } from 'uuid';
import type {
  DatabaseResponse,
  DatabaseError,
  TableName,
  TableRow,
  DBProject,
  DBSubcontractor,
  DBDocument,
  DBPolicy,
  DBEndorsement,
  DBRequirement,
  DBComplianceScore,
  DBTask,
  DBUser,
  DBOrganization,
  UserRole,
  CoverageType,
  TaskStatus,
  EndorsementType,
} from '../../types/database.types';
import {
  createNotNullError,
  createUniqueViolationError,
  createForeignKeyError,
  createCheckViolationError,
  createRangeViolationError,
  createInvalidEnumError,
  createUndefinedColumnError,
  createUndefinedTableError,
  createNoRowsError,
  createMultipleRowsError,
  createGenericError,
} from './mockDatabase.errors';

// ==================== SCHEMA DEFINITIONS ====================

interface TableSchema {
  columns: {
    [key: string]: {
      type: string;
      required: boolean;
      unique?: boolean;
      enum?: readonly string[];
      min?: number;
      max?: number;
      foreignKey?: { table: TableName; column: string };
    };
  };
  constraints?: {
    checkFunctions?: ((row: any) => boolean)[];
    checkMessages?: string[];
  };
}

const SCHEMAS: Record<TableName, TableSchema> = {
  users: {
    columns: {
      id: { type: 'string', required: false },
      email: { type: 'string', required: true, unique: true },
      role: { type: 'string', required: true, enum: ['manager', 'subcontractor', 'broker', 'admin'] },
      created_at: { type: 'string', required: false },
    },
  },
  // REQ-214: Organizations table (simulates scaffald.organizations)
  organizations: {
    columns: {
      id: { type: 'string', required: false },
      name: { type: 'string', required: true },
      slug: { type: 'string', required: true, unique: true },
      type: { type: 'string', required: true, enum: ['broker', 'general_contractor', 'subcontractor'] },
      created_at: { type: 'string', required: false },
      updated_at: { type: 'string', required: false },
    },
  },
  projects: {
    columns: {
      id: { type: 'string', required: false },
      name: { type: 'string', required: true },
      manager_id: { type: 'string', required: true, foreignKey: { table: 'users', column: 'id' } },
      // REQ-214: Cross-schema FK to scaffald.organizations
      organization_id: { type: 'string', required: false, foreignKey: { table: 'organizations', column: 'id' } },
      created_at: { type: 'string', required: false },
      updated_at: { type: 'string', required: false },
    },
  },
  subcontractors: {
    columns: {
      id: { type: 'string', required: false },
      name: { type: 'string', required: true },
      company: { type: 'string', required: true },
      contact_info: { type: 'object', required: true },
      created_at: { type: 'string', required: false },
    },
  },
  documents: {
    columns: {
      id: { type: 'string', required: false },
      subcontractor_id: { type: 'string', required: true, foreignKey: { table: 'subcontractors', column: 'id' } },
      project_id: { type: 'string', required: true, foreignKey: { table: 'projects', column: 'id' } },
      file_url: { type: 'string', required: true },
      upload_date: { type: 'string', required: false },
      status: { type: 'string', required: true, enum: ['pending', 'approved', 'rejected'] },
      // REQ-214: Cross-schema FK to scaffald.users
      uploaded_by_scaffald_user_id: { type: 'string', required: false, foreignKey: { table: 'users', column: 'id' } },
    },
  },
  policies: {
    columns: {
      id: { type: 'string', required: false },
      document_id: { type: 'string', required: true, foreignKey: { table: 'documents', column: 'id' } },
      policy_number: { type: 'string', required: true, unique: true },
      carrier: { type: 'string', required: true },
      start_date: { type: 'string', required: true },
      end_date: { type: 'string', required: true },
      coverage_type: { type: 'string', required: true, enum: ['general_liability', 'workers_comp', 'umbrella', 'auto'] },
      coverage_amount: { type: 'number', required: true },
    },
    constraints: {
      checkFunctions: [
        (row: DBPolicy) => new Date(row.end_date) > new Date(row.start_date),
      ],
      checkMessages: ['end_date must be after start_date'],
    },
  },
  endorsements: {
    columns: {
      id: { type: 'string', required: false },
      policy_id: { type: 'string', required: true, foreignKey: { table: 'policies', column: 'id' } },
      type: { type: 'string', required: true, enum: ['additional_insured', 'waiver_of_subrogation', 'primary_non_contributory'] },
      details: { type: 'object', required: true },
    },
  },
  requirements: {
    columns: {
      id: { type: 'string', required: false },
      project_id: { type: 'string', required: true, foreignKey: { table: 'projects', column: 'id' } },
      coverage_type: { type: 'string', required: true, enum: ['general_liability', 'workers_comp', 'umbrella', 'auto'] },
      minimum_amount: { type: 'number', required: true },
      endorsements_required: { type: 'array', required: true },
    },
  },
  compliance_scores: {
    columns: {
      id: { type: 'string', required: false },
      project_id: { type: 'string', required: true, foreignKey: { table: 'projects', column: 'id' } },
      subcontractor_id: { type: 'string', required: true, foreignKey: { table: 'subcontractors', column: 'id' } },
      score: { type: 'number', required: true, min: 0, max: 100 },
      last_evaluated: { type: 'string', required: false },
      gaps: { type: 'array', required: true },
    },
  },
  tasks: {
    columns: {
      id: { type: 'string', required: false },
      project_id: { type: 'string', required: true, foreignKey: { table: 'projects', column: 'id' } },
      subcontractor_id: { type: 'string', required: true, foreignKey: { table: 'subcontractors', column: 'id' } },
      title: { type: 'string', required: true },
      description: { type: 'string', required: true },
      status: { type: 'string', required: true, enum: ['pending', 'in_progress', 'completed'] },
      created_at: { type: 'string', required: false },
      completed_at: { type: 'string', required: false },
    },
  },
};

// ==================== QUERY BUILDER ====================

interface CurrentUser {
  id: string;
  role: UserRole;
  subcontractor_id?: string;
}

class QueryBuilder<T extends TableName> {
  private tableName: T;
  private database: MockDatabase;
  private filters: Array<(row: TableRow<T>) => boolean> = [];
  private orderColumn?: keyof TableRow<T>;
  private orderAscending = true;
  private limitCount?: number;
  private selectColumns?: string[];
  private isSingle = false;
  private updateData?: Partial<TableRow<T>>;
  private deleteMode = false;
  private validationError?: DatabaseError;

  constructor(tableName: T, database: MockDatabase) {
    this.tableName = tableName;
    this.database = database;
  }

  select(columns?: string): this {
    if (columns && columns !== '*') {
      this.selectColumns = columns.split(',').map(c => c.trim());
    }
    return this;
  }

  insert(data: Partial<TableRow<T>> | Partial<TableRow<T>>[]): Promise<DatabaseResponse<TableRow<T>[]>> {
    const rows = Array.isArray(data) ? data : [data];
    const results: TableRow<T>[] = [];

    try {
      for (const row of rows) {
        // Validate and prepare row
        const preparedRow = this.prepareRow(row);
        const validation = this.validateRow(preparedRow);

        if (validation.error) {
          return Promise.resolve({ data: null, error: validation.error });
        }

        // Add to table
        this.database.addRow(this.tableName, preparedRow);
        results.push(preparedRow);
      }

      return Promise.resolve({ data: results, error: null });
    } catch (error) {
      return Promise.resolve({
        data: null,
        error: createGenericError(error instanceof Error ? error.message : String(error)),
      });
    }
  }

  update(data: Partial<TableRow<T>>): this {
    this.updateData = data;
    return this;
  }

  delete(): this {
    this.deleteMode = true;
    return this;
  }

  eq(column: string, value: any): this {
    // Validate column exists
    const schema = SCHEMAS[this.tableName];
    if (schema && !schema.columns[column]) {
      this.validationError = createUndefinedColumnError(
        column,
        this.tableName,
        Object.keys(schema.columns),
        'eq filter'
      );
    }
    this.filters.push((row: any) => row[column] === value);
    return this;
  }

  neq(column: string, value: any): this {
    // Validate column exists
    const schema = SCHEMAS[this.tableName];
    if (schema && !schema.columns[column]) {
      this.validationError = createUndefinedColumnError(
        column,
        this.tableName,
        Object.keys(schema.columns),
        'neq filter'
      );
    }
    this.filters.push((row: any) => row[column] !== value);
    return this;
  }

  in(column: string, values: any[]): this {
    // Validate column exists
    const schema = SCHEMAS[this.tableName];
    if (schema && !schema.columns[column]) {
      this.validationError = createUndefinedColumnError(
        column,
        this.tableName,
        Object.keys(schema.columns),
        'in filter'
      );
    }
    this.filters.push((row: any) => values.includes(row[column]));
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): this {
    this.orderColumn = column as keyof TableRow<T>;
    this.orderAscending = options?.ascending !== false;
    return this;
  }

  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  single(): this {
    this.isSingle = true;
    return this;
  }

  async then<TResult1 = DatabaseResponse<TableRow<T>[] | TableRow<T> | null>, TResult2 = never>(
    onfulfilled?: ((value: DatabaseResponse<TableRow<T>[] | TableRow<T> | null>) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2> {
    try {
      const result = await this.execute();
      return onfulfilled ? onfulfilled(result) : (result as any);
    } catch (error) {
      return onrejected ? onrejected(error) : Promise.reject(error);
    }
  }

  private async execute(): Promise<DatabaseResponse<TableRow<T>[] | TableRow<T> | null>> {
    try {
      // Check for validation errors from filter methods
      if (this.validationError) {
        return { data: null, error: this.validationError };
      }

      // Validate table exists
      if (!SCHEMAS[this.tableName]) {
        return {
          data: null,
          error: createUndefinedTableError(this.tableName),
        };
      }

      // Validate columns if selecting specific ones
      if (this.selectColumns) {
        const schema = SCHEMAS[this.tableName];
        const validColumns = Object.keys(schema.columns);
        const invalidCols = this.selectColumns.filter(c => !validColumns.includes(c));

        if (invalidCols.length > 0) {
          return {
            data: null,
            error: createUndefinedColumnError(
              invalidCols[0],
              this.tableName,
              validColumns,
              `select (invalid columns: ${invalidCols.join(', ')})`
            ),
          };
        }
      }

      // Handle update
      if (this.updateData) {
        return this.executeUpdate();
      }

      // Handle delete
      if (this.deleteMode) {
        return this.executeDelete();
      }

      // Handle select
      let rows = this.database.getRows(this.tableName);

      // Apply RBAC filtering
      rows = this.applyRBACFiltering(rows);

      // Apply filters
      for (const filter of this.filters) {
        rows = rows.filter(filter);
      }

      // Apply ordering
      if (this.orderColumn) {
        rows = this.applyOrdering(rows);
      }

      // Apply limit
      if (this.limitCount) {
        rows = rows.slice(0, this.limitCount);
      }

      // Apply column selection
      if (this.selectColumns) {
        rows = rows.map(row => {
          const selected: any = {};
          for (const col of this.selectColumns!) {
            selected[col] = (row as any)[col];
          }
          return selected;
        });
      }

      // Handle single
      if (this.isSingle) {
        if (rows.length === 0) {
          return {
            data: null,
            error: createNoRowsError(),
          };
        }
        if (rows.length > 1) {
          return {
            data: null,
            error: createMultipleRowsError(rows.length),
          };
        }
        return { data: rows[0] as any, error: null };
      }

      return { data: rows as any, error: null };
    } catch (error) {
      return {
        data: null,
        error: createGenericError(error instanceof Error ? error.message : String(error)),
      };
    }
  }

  private executeUpdate(): DatabaseResponse<TableRow<T>[]> {
    let rows = this.database.getRows(this.tableName);

    // Apply RBAC filtering
    rows = this.applyRBACFiltering(rows);

    // Apply filters
    for (const filter of this.filters) {
      rows = rows.filter(filter);
    }

    // Update rows
    const updated: TableRow<T>[] = [];
    for (const row of rows) {
      const updatedRow = {
        ...row,
        ...this.updateData,
        updated_at: new Date().toISOString(),
      } as TableRow<T>;

      // REQ-214: Validate FK constraints on update (like PostgreSQL does)
      const validation = this.validateRow(updatedRow);
      if (validation.error) {
        return { data: null, error: validation.error };
      }

      this.database.updateRow(this.tableName, row.id, updatedRow);
      updated.push(updatedRow);
    }

    return { data: updated, error: null };
  }

  private executeDelete(): DatabaseResponse<TableRow<T>[]> {
    let rows = this.database.getRows(this.tableName);

    // Apply RBAC filtering
    rows = this.applyRBACFiltering(rows);

    // Apply filters
    for (const filter of this.filters) {
      rows = rows.filter(filter);
    }

    // Delete rows
    for (const row of rows) {
      this.database.deleteRow(this.tableName, row.id);
    }

    return { data: rows, error: null };
  }

  private applyRBACFiltering(rows: TableRow<T>[]): TableRow<T>[] {
    const currentUser = this.database.getCurrentUser();
    if (!currentUser) {
      return rows;
    }

    // Admin sees everything
    if (currentUser.role === 'admin') {
      return rows;
    }

    // Manager sees only their projects and related data
    if (currentUser.role === 'manager') {
      if (this.tableName === 'projects') {
        return rows.filter((row: any) => row.manager_id === currentUser.id);
      }

      if (this.tableName === 'documents' || this.tableName === 'requirements' ||
          this.tableName === 'compliance_scores' || this.tableName === 'tasks') {
        // Get manager's project IDs
        const projects = this.database.getRows('projects')
          .filter((p: any) => p.manager_id === currentUser.id);
        const projectIds = projects.map((p: any) => p.id);

        return rows.filter((row: any) => projectIds.includes(row.project_id));
      }
    }

    // Subcontractor sees only their data
    if (currentUser.role === 'subcontractor' && currentUser.subcontractor_id) {
      if (this.tableName === 'documents' || this.tableName === 'compliance_scores' || this.tableName === 'tasks') {
        return rows.filter((row: any) => row.subcontractor_id === currentUser.subcontractor_id);
      }
    }

    return rows;
  }

  private applyOrdering(rows: TableRow<T>[]): TableRow<T>[] {
    return [...rows].sort((a, b) => {
      const aVal = (a as any)[this.orderColumn!];
      const bVal = (b as any)[this.orderColumn!];

      let comparison = 0;
      if (aVal < bVal) comparison = -1;
      if (aVal > bVal) comparison = 1;

      return this.orderAscending ? comparison : -comparison;
    });
  }

  private prepareRow(row: Partial<TableRow<T>>): TableRow<T> {
    const prepared: any = { ...row };

    // Generate ID if not provided
    if (!prepared.id) {
      prepared.id = uuidv4();
    }

    // Add timestamps
    const now = new Date().toISOString();
    if (!prepared.created_at && SCHEMAS[this.tableName].columns.created_at) {
      prepared.created_at = now;
    }
    if (!prepared.updated_at && SCHEMAS[this.tableName].columns.updated_at) {
      prepared.updated_at = now;
    }
    if (!prepared.upload_date && SCHEMAS[this.tableName].columns.upload_date) {
      prepared.upload_date = now;
    }
    if (!prepared.last_evaluated && SCHEMAS[this.tableName].columns.last_evaluated) {
      prepared.last_evaluated = now;
    }

    return prepared as TableRow<T>;
  }

  private validateRow(row: TableRow<T>): { error: DatabaseError | null } {
    const schema = SCHEMAS[this.tableName];

    // Check required fields
    for (const [columnName, columnSchema] of Object.entries(schema.columns)) {
      if (columnSchema.required && !(row as any)[columnName]) {
        return {
          error: createNotNullError(columnName, this.tableName),
        };
      }
    }

    // Check enum values
    for (const [columnName, columnSchema] of Object.entries(schema.columns)) {
      if (columnSchema.enum && (row as any)[columnName]) {
        if (!columnSchema.enum.includes((row as any)[columnName])) {
          return {
            error: createInvalidEnumError(columnName, (row as any)[columnName], columnSchema.enum),
          };
        }
      }
    }

    // Check min/max for numbers
    for (const [columnName, columnSchema] of Object.entries(schema.columns)) {
      if (columnSchema.type === 'number' && (row as any)[columnName] !== undefined) {
        const value = (row as any)[columnName];
        if (columnSchema.min !== undefined && value < columnSchema.min) {
          return {
            error: createRangeViolationError(columnName, value, columnSchema.min, columnSchema.max),
          };
        }
        if (columnSchema.max !== undefined && value > columnSchema.max) {
          return {
            error: createRangeViolationError(columnName, value, columnSchema.min, columnSchema.max),
          };
        }
      }
    }

    // Check unique constraints
    for (const [columnName, columnSchema] of Object.entries(schema.columns)) {
      if (columnSchema.unique && (row as any)[columnName]) {
        const existing = this.database.getRows(this.tableName)
          .find((r: any) => r[columnName] === (row as any)[columnName] && r.id !== row.id);

        if (existing) {
          return {
            error: createUniqueViolationError(this.tableName, columnName, (row as any)[columnName]),
          };
        }
      }
    }

    // Check foreign keys
    for (const [columnName, columnSchema] of Object.entries(schema.columns)) {
      if (columnSchema.foreignKey && (row as any)[columnName]) {
        const fkTable = columnSchema.foreignKey.table;
        const fkColumn = columnSchema.foreignKey.column;
        const fkValue = (row as any)[columnName];

        const exists = this.database.getRows(fkTable)
          .some((r: any) => r[fkColumn] === fkValue);

        if (!exists) {
          return {
            error: createForeignKeyError(columnName, fkValue, fkTable),
          };
        }
      }
    }

    // Check custom constraints
    if (schema.constraints?.checkFunctions) {
      for (let i = 0; i < schema.constraints.checkFunctions.length; i++) {
        const checkFn = schema.constraints.checkFunctions[i];
        const checkMsg = schema.constraints.checkMessages?.[i] || 'Constraint violation';

        if (!checkFn(row)) {
          return {
            error: createCheckViolationError(checkMsg),
          };
        }
      }
    }

    return { error: null };
  }
}

// ==================== MAIN DATABASE CLASS ====================

export class MockDatabase {
  private data: Record<TableName, any[]> = {
    users: [],
    organizations: [], // REQ-214: Cross-schema FK support
    projects: [],
    subcontractors: [],
    documents: [],
    policies: [],
    endorsements: [],
    requirements: [],
    compliance_scores: [],
    tasks: [],
  };

  private currentUser: CurrentUser | null = null;

  constructor() {
    // Initialize with empty tables
  }

  from<T extends TableName>(table: T): QueryBuilder<T> {
    // Validate table exists
    if (!SCHEMAS[table]) {
      const errorBuilder = new QueryBuilder(table, this);
      // Return a builder that will error when executed
      return errorBuilder;
    }

    return new QueryBuilder(table, this);
  }

  setCurrentUser(user: CurrentUser | null): void {
    this.currentUser = user;
  }

  getCurrentUser(): CurrentUser | null {
    return this.currentUser;
  }

  getRows<T extends TableName>(table: T): TableRow<T>[] {
    return [...(this.data[table] || [])];
  }

  addRow<T extends TableName>(table: T, row: TableRow<T>): void {
    this.data[table].push(row);
  }

  updateRow<T extends TableName>(table: T, id: string, row: TableRow<T>): void {
    const index = this.data[table].findIndex((r: any) => r.id === id);
    if (index !== -1) {
      this.data[table][index] = row;
    }
  }

  deleteRow<T extends TableName>(table: T, id: string): void {
    this.data[table] = this.data[table].filter((r: any) => r.id !== id);
  }

  seed(): void {
    // Will implement seed data next
    this.seedUsers();
    this.seedOrganizations(); // REQ-214: Must seed before projects
    this.seedProjects();
    this.seedSubcontractors();
    this.seedDocuments();
    this.seedPolicies();
    this.seedEndorsements();
    this.seedRequirements();
    this.seedComplianceScores();
    this.seedTasks();
  }

  // REQ-214: Seed organizations for cross-schema FK tests
  private seedOrganizations(): void {
    const organizations: DBOrganization[] = [
      { id: 'org-gc-1', name: 'Massei Construction', slug: 'massei-construction', type: 'general_contractor', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
      { id: 'org-gc-2', name: 'Turner Development', slug: 'turner-development', type: 'general_contractor', created_at: '2024-01-02T00:00:00Z', updated_at: '2024-01-02T00:00:00Z' },
      { id: 'org-broker-1', name: 'CMR Insurance', slug: 'cmr-insurance', type: 'broker', created_at: '2024-01-03T00:00:00Z', updated_at: '2024-01-03T00:00:00Z' },
    ];

    this.data.organizations = organizations;
  }

  private seedUsers(): void {
    const users: DBUser[] = [
      { id: 'user-manager-1', email: 'manager1@example.com', role: 'manager', created_at: '2024-01-01T00:00:00Z' },
      { id: 'user-manager-2', email: 'manager2@example.com', role: 'manager', created_at: '2024-01-02T00:00:00Z' },
      { id: 'user-manager-3', email: 'manager3@example.com', role: 'manager', created_at: '2024-01-03T00:00:00Z' },
      { id: 'user-manager-4', email: 'manager4@example.com', role: 'manager', created_at: '2024-01-04T00:00:00Z' },
      { id: 'user-manager-5', email: 'manager5@example.com', role: 'manager', created_at: '2024-01-05T00:00:00Z' },
      { id: 'user-broker-1', email: 'broker1@example.com', role: 'broker', created_at: '2024-01-06T00:00:00Z' },
      { id: 'user-admin-1', email: 'admin@example.com', role: 'admin', created_at: '2024-01-07T00:00:00Z' },
    ];

    this.data.users = users;
  }

  private seedProjects(): void {
    const projects: DBProject[] = [
      { id: 'project-1', name: 'Downtown Office Complex', manager_id: 'user-manager-1', created_at: '2024-01-10T00:00:00Z', updated_at: '2024-01-10T00:00:00Z' },
      { id: 'project-2', name: 'Residential Tower Phase 1', manager_id: 'user-manager-2', created_at: '2024-01-11T00:00:00Z', updated_at: '2024-01-11T00:00:00Z' },
      { id: 'project-3', name: 'Highway Extension Project', manager_id: 'user-manager-3', created_at: '2024-01-12T00:00:00Z', updated_at: '2024-01-12T00:00:00Z' },
      { id: 'project-4', name: 'Medical Center Renovation', manager_id: 'user-manager-4', created_at: '2024-01-13T00:00:00Z', updated_at: '2024-01-13T00:00:00Z' },
      { id: 'project-5', name: 'Retail Mall Construction', manager_id: 'user-manager-5', created_at: '2024-01-14T00:00:00Z', updated_at: '2024-01-14T00:00:00Z' },
    ];

    this.data.projects = projects;
  }

  private seedSubcontractors(): void {
    const companies = [
      'Elite Electrical', 'ABC Plumbing', 'Superior HVAC', 'Premium Concrete',
      'First Choice Framing', 'Quality Roofing', 'Expert Drywall', 'Master Painters',
      'Pro Landscaping', 'Reliable Excavation', 'Trusted Flooring', 'Best Insulation',
      'Top Masonry', 'Prime Steel', 'Advanced Glass', 'Perfect Tile',
      'Ultimate Carpentry', 'Precision Welding', 'Complete Demolition', 'Smart Security',
    ];

    const subcontractors: DBSubcontractor[] = companies.map((company, index) => ({
      id: `sub-${index + 1}`,
      name: `Contact ${index + 1}`,
      company,
      contact_info: {
        email: `contact${index + 1}@${company.toLowerCase().replace(/\s+/g, '')}.com`,
        phone: `555-${String(index + 1).padStart(4, '0')}`,
      },
      created_at: `2024-01-${String(15 + index).padStart(2, '0')}T00:00:00Z`,
    }));

    this.data.subcontractors = subcontractors;
  }

  private seedDocuments(): void {
    const documents: DBDocument[] = [];

    // Create documents for first 10 subcontractors across various projects
    for (let i = 0; i < 10; i++) {
      const projectIndex = i % 5;
      documents.push({
        id: `doc-${i + 1}`,
        subcontractor_id: `sub-${i + 1}`,
        project_id: `project-${projectIndex + 1}`,
        file_url: `https://storage.example.com/docs/coi-${i + 1}.pdf`,
        upload_date: `2024-02-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
        status: i % 3 === 0 ? 'approved' : i % 3 === 1 ? 'pending' : 'rejected',
      });
    }

    this.data.documents = documents;
  }

  private seedPolicies(): void {
    const carriers = ['Travelers', 'Liberty Mutual', 'Hartford', 'Zurich', 'AIG'];
    const coverageTypes: CoverageType[] = ['general_liability', 'workers_comp', 'umbrella', 'auto'];
    const policies: DBPolicy[] = [];

    // Create 5 policies per document (50 total)
    for (let docIndex = 0; docIndex < 10; docIndex++) {
      for (let policyIndex = 0; policyIndex < 5; policyIndex++) {
        const id = docIndex * 5 + policyIndex;
        const coverageType = coverageTypes[policyIndex % 4];

        let coverageAmount = 1000000;
        if (coverageType === 'general_liability') coverageAmount = 2000000;
        if (coverageType === 'umbrella') coverageAmount = 5000000;
        if (coverageType === 'workers_comp') coverageAmount = 1000000;
        if (coverageType === 'auto') coverageAmount = 1000000;

        policies.push({
          id: `policy-${id + 1}`,
          document_id: `doc-${docIndex + 1}`,
          policy_number: `POL-${String(id + 1).padStart(6, '0')}`,
          carrier: carriers[id % carriers.length],
          start_date: '2024-01-01',
          end_date: '2024-12-31',
          coverage_type: coverageType,
          coverage_amount: coverageAmount,
        });
      }
    }

    this.data.policies = policies;
  }

  private seedEndorsements(): void {
    const endorsementTypes: EndorsementType[] = ['additional_insured', 'waiver_of_subrogation', 'primary_non_contributory'];
    const endorsements: DBEndorsement[] = [];

    // Add endorsements to general liability policies
    const glPolicies = this.data.policies.filter((p: any) => p.coverage_type === 'general_liability');

    glPolicies.forEach((policy: any, index: number) => {
      endorsementTypes.forEach((type, typeIndex) => {
        endorsements.push({
          id: `endorsement-${index * 3 + typeIndex + 1}`,
          policy_id: policy.id,
          type,
          details: {
            description: `${type.replace(/_/g, ' ')} endorsement`,
            effective_date: policy.start_date,
          },
        });
      });
    });

    this.data.endorsements = endorsements;
  }

  private seedRequirements(): void {
    const requirements: DBRequirement[] = [];

    // Each project has requirements for all coverage types
    for (let i = 0; i < 5; i++) {
      const coverageTypes: CoverageType[] = ['general_liability', 'workers_comp', 'umbrella', 'auto'];

      coverageTypes.forEach((coverageType, index) => {
        let minimumAmount = 1000000;
        if (coverageType === 'general_liability') minimumAmount = 2000000;
        if (coverageType === 'umbrella') minimumAmount = 5000000;

        requirements.push({
          id: `req-${i * 4 + index + 1}`,
          project_id: `project-${i + 1}`,
          coverage_type: coverageType,
          minimum_amount: minimumAmount,
          endorsements_required: coverageType === 'general_liability'
            ? ['additional_insured', 'waiver_of_subrogation', 'primary_non_contributory']
            : [],
        });
      });
    }

    this.data.requirements = requirements;
  }

  private seedComplianceScores(): void {
    const scores: DBComplianceScore[] = [];

    // Create scores for each subcontractor-project pair (first 10 subs across 5 projects = 50 scores)
    for (let subIndex = 0; subIndex < 10; subIndex++) {
      for (let projIndex = 0; projIndex < 5; projIndex++) {
        const score = 40 + (subIndex + projIndex) * 5; // Scores from 40 to 95
        const hasGaps = score < 70;

        scores.push({
          id: `score-${subIndex * 5 + projIndex + 1}`,
          project_id: `project-${projIndex + 1}`,
          subcontractor_id: `sub-${subIndex + 1}`,
          score: Math.min(100, score),
          last_evaluated: `2024-03-${String((subIndex + projIndex) % 28 + 1).padStart(2, '0')}T00:00:00Z`,
          gaps: hasGaps ? [
            {
              type: 'coverage_gap',
              description: 'General liability coverage below required amount',
              severity: score < 50 ? 'high' : 'medium',
            },
          ] : [],
        });
      }
    }

    this.data.compliance_scores = scores;
  }

  private seedTasks(): void {
    const tasks: DBTask[] = [];
    const statuses: TaskStatus[] = ['pending', 'in_progress', 'completed'];

    // Create 30 tasks
    for (let i = 0; i < 30; i++) {
      const projIndex = i % 5;
      const subIndex = i % 10;
      const statusIndex = i % 3;

      tasks.push({
        id: `task-${i + 1}`,
        project_id: `project-${projIndex + 1}`,
        subcontractor_id: `sub-${subIndex + 1}`,
        title: `Task ${i + 1}: Upload missing COI`,
        description: `Please upload the missing Certificate of Insurance for compliance verification`,
        status: statuses[statusIndex],
        created_at: `2024-03-${String((i % 28) + 1).padStart(2, '0')}T00:00:00Z`,
        completed_at: statuses[statusIndex] === 'completed'
          ? `2024-03-${String(((i % 28) + 2)).padStart(2, '0')}T00:00:00Z`
          : null,
      });
    }

    this.data.tasks = tasks;
  }
}
