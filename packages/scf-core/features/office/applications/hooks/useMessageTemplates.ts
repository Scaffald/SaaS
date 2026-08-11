/**
 * Hooks for managing stage-specific message templates.
 * Uses local state with defaults until backend API is available.
 *
 * @see Issue #89
 */

import { useCallback, useMemo, useState } from 'react'
import type { ApplicationStatus } from '../types'
import {
  DEFAULT_TEMPLATES,
  type MessageTemplate,
  applyTemplateVariables,
} from '../components/message-templates'

/**
 * Hook to manage message templates with CRUD operations.
 * Templates are stored in local state with defaults pre-loaded.
 * When the backend API is available, this can be swapped to use React Query.
 */
export function useMessageTemplates() {
  const [customTemplates, setCustomTemplates] = useState<MessageTemplate[]>([])

  const allTemplates = useMemo(
    () => [...DEFAULT_TEMPLATES, ...customTemplates],
    [customTemplates]
  )

  const getTemplatesForStage = useCallback(
    (stage: ApplicationStatus) => {
      return allTemplates.filter((t) => t.stage === stage || t.stage === 'all')
    },
    [allTemplates]
  )

  const createTemplate = useCallback(
    (template: Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'isDefault'>) => {
      const newTemplate: MessageTemplate = {
        ...template,
        id: `tpl_custom_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: 0,
        isDefault: false,
      }
      setCustomTemplates((prev) => [...prev, newTemplate])
      return newTemplate
    },
    []
  )

  const updateTemplate = useCallback(
    (id: string, updates: Partial<Pick<MessageTemplate, 'name' | 'body' | 'stage' | 'variables'>>) => {
      setCustomTemplates((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
        )
      )
    },
    []
  )

  const deleteTemplate = useCallback(
    (id: string) => {
      // Only allow deleting custom templates
      setCustomTemplates((prev) => prev.filter((t) => t.id !== id))
    },
    []
  )

  const incrementUsage = useCallback(
    (id: string) => {
      setCustomTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, usageCount: t.usageCount + 1 } : t))
      )
    },
    []
  )

  return {
    templates: allTemplates,
    getTemplatesForStage,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    incrementUsage,
    applyVariables: applyTemplateVariables,
  }
}
