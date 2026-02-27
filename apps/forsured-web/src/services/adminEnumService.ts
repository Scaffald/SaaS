// src/services/adminEnumService.ts
// Admin enum CRUD operations
//
// Provides create, update, delete, and reorder operations for enum values.

import { forsured } from '../lib/supabase';
import { logAdminAction, AUDIT_ACTIONS } from './auditLogService';
import { invalidateAllEnumCaches, EnumValue } from '../hooks/useEnums';

export interface CreateEnumValueInput {
  enum_type: string;
  value: string;
  display_name: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateEnumValueInput {
  display_name?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  is_active?: boolean;
}

/**
 * Create a new enum value
 */
export async function createEnumValue(
  adminUserId: string,
  input: CreateEnumValueInput
): Promise<EnumValue> {
  console.log('[AdminEnumService] Creating enum value:', input);

  // Get current max sort_order for this type
  const { data: existing } = await forsured('enum_values')
    .select('sort_order')
    .eq('enum_type', input.enum_type)
    .order('sort_order', { ascending: false })
    .limit(1);

  const maxSortOrder = existing?.[0]?.sort_order ?? 0;

  const { data, error } = await forsured('enum_values')
    .insert({
      enum_type: input.enum_type,
      value: input.value,
      display_name: input.display_name,
      description: input.description || null,
      metadata: input.metadata || {},
      sort_order: maxSortOrder + 1,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('[AdminEnumService] Failed to create enum value:', error);
    throw new Error(`Failed to create enum value: ${error.message}`);
  }

  // Log the action
  await logAdminAction({
    admin_user_id: adminUserId,
    action: AUDIT_ACTIONS.ENUM_CREATED,
    target_type: 'enum_value',
    target_id: data.id,
    new_value: data,
  });

  // Invalidate cache
  invalidateAllEnumCaches();

  return data as EnumValue;
}

/**
 * Update an enum value
 */
export async function updateEnumValue(
  adminUserId: string,
  enumId: string,
  input: UpdateEnumValueInput
): Promise<EnumValue> {
  console.log('[AdminEnumService] Updating enum value:', enumId, input);

  // Get current value for audit log
  const { data: current, error: fetchError } = await forsured('enum_values')
    .select('*')
    .eq('id', enumId)
    .single();

  if (fetchError || !current) {
    throw new Error('Enum value not found');
  }

  const { data, error } = await forsured('enum_values')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', enumId)
    .select()
    .single();

  if (error) {
    console.error('[AdminEnumService] Failed to update enum value:', error);
    throw new Error(`Failed to update enum value: ${error.message}`);
  }

  // Log the action
  await logAdminAction({
    admin_user_id: adminUserId,
    action: AUDIT_ACTIONS.ENUM_UPDATED,
    target_type: 'enum_value',
    target_id: enumId,
    old_value: current,
    new_value: data,
  });

  // Invalidate cache
  invalidateAllEnumCaches();

  return data as EnumValue;
}

/**
 * Soft delete an enum value (set is_active = false)
 */
export async function deleteEnumValue(
  adminUserId: string,
  enumId: string
): Promise<void> {
  console.log('[AdminEnumService] Deleting enum value:', enumId);

  // Get current value for audit log
  const { data: current, error: fetchError } = await forsured('enum_values')
    .select('*')
    .eq('id', enumId)
    .single();

  if (fetchError || !current) {
    throw new Error('Enum value not found');
  }

  const { error } = await forsured('enum_values')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', enumId);

  if (error) {
    console.error('[AdminEnumService] Failed to delete enum value:', error);
    throw new Error(`Failed to delete enum value: ${error.message}`);
  }

  // Log the action
  await logAdminAction({
    admin_user_id: adminUserId,
    action: AUDIT_ACTIONS.ENUM_DELETED,
    target_type: 'enum_value',
    target_id: enumId,
    old_value: current,
    new_value: { ...current, is_active: false },
  });

  // Invalidate cache
  invalidateAllEnumCaches();
}

/**
 * Reorder an enum value (move up or down)
 */
export async function reorderEnumValue(
  adminUserId: string,
  enumId: string,
  direction: 'up' | 'down'
): Promise<void> {
  console.log('[AdminEnumService] Reordering enum value:', enumId, direction);

  // Get current value
  const { data: current, error: fetchError } = await forsured('enum_values')
    .select('*')
    .eq('id', enumId)
    .single();

  if (fetchError || !current) {
    throw new Error('Enum value not found');
  }

  // Get adjacent value to swap with
  const { data: adjacent } = await forsured('enum_values')
    .select('*')
    .eq('enum_type', current.enum_type)
    .eq('is_active', true)
    [direction === 'up' ? 'lt' : 'gt']('sort_order', current.sort_order)
    .order('sort_order', { ascending: direction === 'down' })
    .limit(1);

  if (!adjacent || adjacent.length === 0) {
    console.log('[AdminEnumService] No adjacent value to swap with');
    return; // Already at the boundary
  }

  const adjacentItem = adjacent[0];

  // Swap sort_order values
  const { error: updateCurrentError } = await forsured('enum_values')
    .update({ sort_order: adjacentItem.sort_order, updated_at: new Date().toISOString() })
    .eq('id', enumId);

  if (updateCurrentError) {
    throw new Error(`Failed to update sort order: ${updateCurrentError.message}`);
  }

  const { error: updateAdjacentError } = await forsured('enum_values')
    .update({ sort_order: current.sort_order, updated_at: new Date().toISOString() })
    .eq('id', adjacentItem.id);

  if (updateAdjacentError) {
    throw new Error(`Failed to update adjacent sort order: ${updateAdjacentError.message}`);
  }

  // Log the action
  await logAdminAction({
    admin_user_id: adminUserId,
    action: AUDIT_ACTIONS.ENUM_REORDERED,
    target_type: 'enum_value',
    target_id: enumId,
    old_value: { sort_order: current.sort_order },
    new_value: { sort_order: adjacentItem.sort_order },
  });

  // Invalidate cache
  invalidateAllEnumCaches();
}

/**
 * Restore a soft-deleted enum value
 */
export async function restoreEnumValue(
  adminUserId: string,
  enumId: string
): Promise<EnumValue> {
  console.log('[AdminEnumService] Restoring enum value:', enumId);

  const { data, error } = await forsured('enum_values')
    .update({
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', enumId)
    .select()
    .single();

  if (error) {
    console.error('[AdminEnumService] Failed to restore enum value:', error);
    throw new Error(`Failed to restore enum value: ${error.message}`);
  }

  // Log the action
  await logAdminAction({
    admin_user_id: adminUserId,
    action: AUDIT_ACTIONS.ENUM_UPDATED,
    target_type: 'enum_value',
    target_id: enumId,
    new_value: { is_active: true },
  });

  // Invalidate cache
  invalidateAllEnumCaches();

  return data as EnumValue;
}

/**
 * Get all enum types with counts
 */
export async function getEnumTypesWithCounts(): Promise<Array<{ type: string; count: number; activeCount: number }>> {
  const { data, error } = await forsured('enum_values')
    .select('enum_type, is_active');

  if (error) {
    console.error('[AdminEnumService] Failed to get enum types:', error);
    throw new Error(`Failed to get enum types: ${error.message}`);
  }

  // Group by type and count
  const typeCounts = (data || []).reduce((acc: Record<string, { count: number; activeCount: number }>, row: { enum_type: string; is_active: boolean }) => {
    if (!acc[row.enum_type]) {
      acc[row.enum_type] = { count: 0, activeCount: 0 };
    }
    acc[row.enum_type].count++;
    if (row.is_active) {
      acc[row.enum_type].activeCount++;
    }
    return acc;
  }, {});

  return Object.entries(typeCounts).map(([type, counts]) => ({
    type,
    ...counts,
  }));
}
