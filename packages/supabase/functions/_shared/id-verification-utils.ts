// @ts-nocheck
import type { Json } from './database.types.ts'

type PlainRecord = Record<string, unknown>

function isPlainRecord(value: unknown): value is PlainRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toPlainRecord(value: unknown): PlainRecord {
  if (isPlainRecord(value)) {
    return value
  }
  return {}
}

export function mergeMetadata(existing: unknown, patch: PlainRecord): PlainRecord {
  return {
    ...toPlainRecord(existing),
    ...patch,
  }
}

export function addMonths(base: Date, months = 6): Date {
  const result = new Date(base)
  result.setMonth(result.getMonth() + months)
  return result
}

export function readReminderTimestamp(metadata: unknown, key: string): string | null {
  const reminders = toPlainRecord(toPlainRecord(metadata).reminders)
  const idVerificationReminders = toPlainRecord(reminders.id_verification)
  const value = idVerificationReminders[key]
  return typeof value === 'string' ? value : null
}

export function writeReminderTimestamp(metadata: unknown, key: string, value: string): PlainRecord {
  const base = toPlainRecord(metadata)
  const reminders = toPlainRecord(base.reminders)
  const idVerificationReminders = toPlainRecord(reminders.id_verification)

  idVerificationReminders[key] = value

  return mergeMetadata(base, {
    reminders: {
      ...reminders,
      id_verification: idVerificationReminders,
    },
  })
}

export function patchPersonaMetadata(
  existing: unknown,
  patch: Record<string, Json | undefined>
): PlainRecord {
  const current = toPlainRecord(existing)
  const persona = toPlainRecord(current.persona)
  return mergeMetadata(current, {
    persona: {
      ...persona,
      ...patch,
    },
  })
}
