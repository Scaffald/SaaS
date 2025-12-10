import { validateRecord } from './mockDatabase.validators';
import { RBACUser, applyRBACFilter } from './mockDatabase.rbac';
import { parseSelectWithNested, resolveRelationships } from './mockDatabase.relationships';
import { formatNotFoundError, formatMultipleRowsError } from './mockDatabase.errors';

type TableName =
  | 'tasks'
  | 'projects'
  | 'clients'
  | 'users'
  | 'policies'
  | 'compliance_records'
  | 'relationships'
  | 'broker_delegations'
  | 'broker_acknowledgement_forms'
  | 'project_participants'
  // REQ-17: Workflow Activation tables
  | 'comments'
  | 'attachments'
  | 'approval_items'
  | 'bid_proposals'
  | 'user_invitations'
  | 'integration_connections'
  | 'compliance_issues'
  | 'document_versions'
  | 'ai_extractions'
  | 'status_history'
  // REQ-124: Document Upload & Storage
  | 'documents'
  // REQ-106: Database Schema Design & MockDatabase Implementation
  | 'subcontractors'
  | 'endorsements'
  | 'requirements'
  | 'compliance_scores'
  // REQ-269: Policy & Endorsement Level Flags
  | 'compliance_flags'
  // REQ-267: Due Date History
  | 'task_due_date_history'
  // REQ-267: Notifications
  | 'notifications'
  // REQ-261: Task Types
  | 'task_types'
  // REQ-263: Coverage Limit Requirements (Org vs Project)
  | 'coverage_limit_requirements';

interface QueryOptions {
  column?: string;
  ascending?: boolean;
}

interface DataStore {
  [key: string]: any[];
}

/**
 * Supabase-compatible response format
 */
interface SupabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Filter type for query builder
 */
interface Filter {
  column: string;
  operator: 'eq' | 'neq' | 'in';
  value: any;
}

/**
 * Order configuration for sorting
 */
interface OrderConfig {
  column: string;
  ascending: boolean;
}

/**
 * Supabase-compatible QueryBuilder class for method chaining
 * Implements the Supabase query builder pattern with full method chaining support
 *
 * @example
 * ```typescript
 * const { data, error } = await mockDB
 *   .from('tasks')
 *   .select('*')
 *   .eq('status', 'pending')
 *   .order('created_at', { ascending: false })
 *   .limit(10);
 * ```
 */
class QueryBuilder<T = any> {
  private table: TableName;
  private store: DataStore;
  private currentUser: RBACUser | null;
  private filters: Filter[] = [];
  private orderConfig: OrderConfig | null = null;
  private limitValue: number | null = null;
  private selectedColumns: string[] = [];
  private nestedQueries: Array<{ table: string; columns: string[] }> = [];
  private operation: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private insertData: any = null;
  private updateData: any = null;

  constructor(table: TableName, store: DataStore, currentUser: RBACUser | null = null) {
    this.table = table;
    this.store = store;
    this.currentUser = currentUser;
  }

  /**
   * Select columns to return (default: all columns)
   * Supports nested queries: select('*, documents(*)')
   * @param columns Comma-separated column names or '*' for all, with optional nested queries
   */
  select(columns: string = '*'): this {
    this.operation = 'select';

    // Parse for nested queries
    const parsed = parseSelectWithNested(columns);

    // Store base columns
    if (parsed.baseColumns.includes('*')) {
      this.selectedColumns = [];
    } else {
      this.selectedColumns = parsed.baseColumns;
    }

    // Store nested queries
    this.nestedQueries = parsed.nested;

    return this;
  }

  /**
   * Filter by equality
   * @param column Column name
   * @param value Value to match
   */
  eq(column: string, value: any): this {
    this.filters.push({ column, operator: 'eq', value });
    return this;
  }

  /**
   * Filter by inequality
   * @param column Column name
   * @param value Value to not match
   */
  neq(column: string, value: any): this {
    this.filters.push({ column, operator: 'neq', value });
    return this;
  }

  /**
   * Filter by inclusion in array
   * @param column Column name
   * @param values Array of values to match
   */
  in(column: string, values: any[]): this {
    this.filters.push({ column, operator: 'in', value: values });
    return this;
  }

  /**
   * Order results by column
   * @param column Column to sort by
   * @param options Sort options (ascending: true/false)
   */
  order(column: string, options: { ascending?: boolean } = {}): this {
    this.orderConfig = {
      column,
      ascending: options.ascending !== false // default to ascending
    };
    return this;
  }

  /**
   * Limit number of results
   * @param count Maximum number of results to return
   */
  limit(count: number): this {
    this.limitValue = count;
    return this;
  }

  /**
   * Insert data into table
   * @param data Record(s) to insert
   */
  insert(data: any): this {
    this.operation = 'insert';
    this.insertData = data;
    return this;
  }

  /**
   * Update filtered records
   * @param data Fields to update
   */
  update(data: any): this {
    this.operation = 'update';
    this.updateData = data;
    return this;
  }

  /**
   * Delete filtered records
   */
  delete(): this {
    this.operation = 'delete';
    return this;
  }

  /**
   * Return single record (or error if 0 or 2+ found)
   */
  async single(): Promise<SupabaseResponse<T>> {
    const results = await this.execute();

    if (results.error) {
      return results;
    }

    const data = results.data as T[];

    if (data.length === 0) {
      return {
        data: null,
        error: formatNotFoundError(this.table) as any
      };
    }

    if (data.length > 1) {
      return {
        data: null,
        error: formatMultipleRowsError(data.length, this.table) as any
      };
    }

    return {
      data: data[0],
      error: null
    };
  }

  /**
   * Execute the query and return results
   * Makes QueryBuilder thenable (can be awaited)
   */
  then<TResult1 = SupabaseResponse<T[]>, TResult2 = never>(
    onfulfilled?: ((value: SupabaseResponse<T[]>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  /**
   * Internal method to execute the query
   */
  private async execute(): Promise<SupabaseResponse<T[]>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          let result: any;

          switch (this.operation) {
            case 'insert':
              result = this.executeInsert();
              break;
            case 'update':
              result = this.executeUpdate();
              break;
            case 'delete':
              result = this.executeDelete();
              break;
            case 'select':
            default:
              result = this.executeSelect();
              break;
          }

          resolve(result);
        } catch (error) {
          resolve({
            data: null,
            error: error as Error
          });
        }
      }, 100);
    });
  }

  /**
   * Execute SELECT query
   */
  private executeSelect(): SupabaseResponse<T[]> {
    let data = [...(this.store[this.table] || [])];

    // Apply RBAC filtering first
    data = applyRBACFilter(this.table, data, this.currentUser);

    // Apply user filters
    data = this.applyFilters(data);

    // Apply ordering
    if (this.orderConfig) {
      data.sort((a, b) => {
        const aVal = a[this.orderConfig!.column];
        const bVal = b[this.orderConfig!.column];

        if (aVal < bVal) return this.orderConfig!.ascending ? -1 : 1;
        if (aVal > bVal) return this.orderConfig!.ascending ? 1 : -1;
        return 0;
      });
    }

    // Apply limit
    if (this.limitValue !== null) {
      data = data.slice(0, this.limitValue);
    }

    // Resolve nested relationships BEFORE column projection
    if (this.nestedQueries.length > 0) {
      data = resolveRelationships(this.table, data, this.nestedQueries, this.currentUser);
    }

    // Apply column selection
    if (this.selectedColumns.length > 0) {
      data = data.map(record => {
        const selected: any = {};
        this.selectedColumns.forEach(col => {
          if (col in record) {
            selected[col] = record[col];
          }
        });
        return selected;
      });
    }

    return {
      data: data as T[],
      error: null
    };
  }

  /**
   * Execute INSERT query
   */
  private executeInsert(): SupabaseResponse<T[]> {
    const now = new Date().toISOString();
    const records = Array.isArray(this.insertData) ? this.insertData : [this.insertData];

    // Validate each record before inserting
    for (const record of records) {
      const validationError = validateRecord(this.table, record);
      if (validationError) {
        return {
          data: null,
          error: validationError as any
        };
      }
    }

    const insertedRecords = records.map(record => ({
      ...record,
      id: record.id || this.generateId(), // Allow custom IDs for seed data
      created_at: now,
      updated_at: now
    }));

    if (!this.store[this.table]) {
      this.store[this.table] = [];
    }

    this.store[this.table].push(...insertedRecords);

    return {
      data: insertedRecords as T[],
      error: null
    };
  }

  /**
   * Execute UPDATE query
   */
  private executeUpdate(): SupabaseResponse<T[]> {
    let data = [...(this.store[this.table] || [])];

    // Find records matching filters
    const matchingIndices: number[] = [];
    data.forEach((record, index) => {
      if (this.matchesFilters(record)) {
        matchingIndices.push(index);
      }
    });

    const now = new Date().toISOString();
    const updatedRecords: T[] = [];

    // Validate all updates first
    for (const index of matchingIndices) {
      const mergedRecord = {
        ...this.store[this.table][index],
        ...this.updateData,
        updated_at: now
      };

      // Validate the merged record (pass existing ID to allow unique checks to exclude self)
      const validationError = validateRecord(this.table, mergedRecord, mergedRecord.id);
      if (validationError) {
        return {
          data: null,
          error: validationError as any
        };
      }
    }

    // Apply updates after validation passes
    matchingIndices.forEach(index => {
      this.store[this.table][index] = {
        ...this.store[this.table][index],
        ...this.updateData,
        updated_at: now
      };
      updatedRecords.push(this.store[this.table][index]);
    });

    return {
      data: updatedRecords,
      error: null
    };
  }

  /**
   * Execute DELETE query
   */
  private executeDelete(): SupabaseResponse<null> {
    let data = [...(this.store[this.table] || [])];

    // Find records NOT matching filters (keep these)
    const remainingRecords = data.filter(record => !this.matchesFilters(record));

    this.store[this.table] = remainingRecords;

    return {
      data: null,
      error: null
    };
  }

  /**
   * Apply all filters to data array
   */
  private applyFilters(data: any[]): any[] {
    return data.filter(record => this.matchesFilters(record));
  }

  /**
   * Check if a record matches all filters (AND logic)
   */
  private matchesFilters(record: any): boolean {
    return this.filters.every(filter => {
      const recordValue = record[filter.column];

      switch (filter.operator) {
        case 'eq':
          return recordValue === filter.value;
        case 'neq':
          return recordValue !== filter.value;
        case 'in':
          return Array.isArray(filter.value) && filter.value.includes(recordValue);
        default:
          return false;
      }
    });
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

class MockDatabase {
  private store: DataStore = {
    tasks: [],
    projects: [],
    clients: [],
    users: [],
    policies: [],
    compliance_records: [],
    complianceRecords: [],
    relationships: [],
    broker_delegations: [],
    brokerDelegations: [],
    brokerAssignments: [],
    broker_acknowledgement_forms: [],
    project_participants: [],
    projectParticipants: [],
    // REQ-17: Workflow Activation tables
    comments: [],
    attachments: [],
    approval_items: [],
    bid_proposals: [],
    user_invitations: [],
    integration_connections: [],
    compliance_issues: [],
    document_versions: [],
    ai_extractions: [],
    status_history: [],
    // REQ-124: Document Upload & Storage
    documents: [],
    // REQ-106: Database Schema Design & MockDatabase Implementation
    subcontractors: [],
    endorsements: [],
    requirements: [],
    compliance_scores: [],
    // REQ-267: Due Date History
    task_due_date_history: [],
    // REQ-267: Notifications
    notifications: [],
    // REQ-261: Task Types
    task_types: [],
    // REQ-263: Coverage Limit Requirements (Org vs Project)
    coverage_limit_requirements: []
  };

  private currentUser: RBACUser | null = null;

  async query<T>(
    table: TableName,
    filters: Record<string, any> = {},
    orderBy?: QueryOptions
  ): Promise<T[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let data = [...(this.store[table] || [])];

        Object.entries(filters).forEach(([key, value]) => {
          data = data.filter(item => item[key] === value);
        });

        if (orderBy?.column) {
          data.sort((a, b) => {
            const aVal = a[orderBy.column!];
            const bVal = b[orderBy.column!];

            if (aVal < bVal) return orderBy.ascending ? -1 : 1;
            if (aVal > bVal) return orderBy.ascending ? 1 : -1;
            return 0;
          });
        }

        resolve(data as T[]);
      }, 100);
    });
  }

  async queryOne<T>(
    table: TableName,
    filters: Record<string, any>
  ): Promise<T | null> {
    const results = await this.query<T>(table, filters);
    return results[0] || null;
  }

  async queryOr<T>(
    table: TableName,
    filterArray: Record<string, any>[],
    orderBy?: QueryOptions
  ): Promise<T[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let data = [...(this.store[table] || [])];

        const matchedData = data.filter(item => {
          return filterArray.some(filters => {
            return Object.entries(filters).every(([key, value]) => item[key] === value);
          });
        });

        if (orderBy?.column) {
          matchedData.sort((a, b) => {
            const aVal = a[orderBy.column!];
            const bVal = b[orderBy.column!];

            if (aVal < bVal) return orderBy.ascending ? -1 : 1;
            if (aVal > bVal) return orderBy.ascending ? 1 : -1;
            return 0;
          });
        }

        resolve(matchedData as T[]);
      }, 100);
    });
  }

  async insert<T extends { id?: string }>(
    table: TableName,
    data: Omit<T, 'id' | 'created_at' | 'updated_at'>
  ): Promise<T> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const now = new Date().toISOString();
        const newRecord = {
          ...data,
          id: this.generateId(),
          created_at: now,
          updated_at: now
        } as T;

        if (!this.store[table]) {
          this.store[table] = [];
        }

        this.store[table].push(newRecord);
        resolve(newRecord);
      }, 100);
    });
  }

  async update<T extends { id: string }>(
    table: TableName,
    id: string,
    updates: Partial<T>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = this.store[table]?.findIndex(item => item.id === id);

        if (index === -1 || index === undefined) {
          reject(new Error('Record not found'));
          return;
        }

        const now = new Date().toISOString();
        this.store[table][index] = {
          ...this.store[table][index],
          ...updates,
          updated_at: now
        };

        resolve(this.store[table][index] as T);
      }, 100);
    });
  }

  async delete(table: TableName, id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = this.store[table]?.findIndex(item => item.id === id);

        if (index === -1 || index === undefined) {
          reject(new Error('Record not found'));
          return;
        }

        this.store[table].splice(index, 1);
        resolve();
      }, 100);
    });
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  seedData(table: TableName, data: any[]): void {
    this.store[table] = data;
  }

  clearTable(table: TableName): void {
    this.store[table] = [];
  }

  clearAll(): void {
    Object.keys(this.store).forEach(key => {
      this.store[key] = [];
    });
  }

  /**
   * Set the current user for RBAC filtering
   */
  setCurrentUser(user: RBACUser | null): void {
    this.currentUser = user;
  }

  /**
   * Get current user
   */
  getCurrentUser(): RBACUser | null {
    return this.currentUser;
  }

  /**
   * Get all records from a table (used by RBAC helper functions)
   */
  getAll(table: string): any[] {
    return this.store[table] || [];
  }

  /**
   * Find a record by ID (used by validators)
   */
  findById(table: string, id: string): any | null {
    const records = this.store[table] || [];
    return records.find((r: any) => r.id === id) || null;
  }

  /**
   * Create a new query builder for the specified table (Supabase-compatible API)
   * @param table Table name
   * @returns QueryBuilder instance for method chaining
   *
   * @example
   * ```typescript
   * const { data, error } = await mockDB
   *   .from('tasks')
   *   .select('*')
   *   .eq('status', 'pending')
   *   .order('created_at', { ascending: false });
   * ```
   */
  from<T = any>(table: TableName): QueryBuilder<T> {
    return new QueryBuilder<T>(table, this.store, this.currentUser);
  }
}

export default new MockDatabase();
