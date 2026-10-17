/**
 * How an IPIP item and its answer scale are shown (#1194).
 *
 * The scale was drawn reversed — Very Accurate first — because the screen
 * reversed the `choices` array, and for minus-keyed items that array is
 * already listed in reverse score order. Display order and score are two
 * different things: `color` is the position on the scale (1 = very
 * inaccurate … 5 = very accurate) whichever way the item is keyed, `score`
 * is what that answer is worth. The list runs by position, as the IPIP
 * convention and the prototype both do.
 */

import type { IPIPChoice } from './types'

export interface IPIPDisplayChoice {
  /** 1–5, left to right / top to bottom. */
  position: number
  /** "Very inaccurate", not the data's "Very Inaccurate". */
  label: string
  choice: IPIPChoice
}

/** "Neither Accurate Nor Inaccurate" → "Neither accurate nor inaccurate". */
export function sentenceCase(text: string): string {
  const lower = text.toLowerCase()
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

export function displayChoices(choices: readonly IPIPChoice[]): IPIPDisplayChoice[] {
  return [...choices]
    .sort((a, b) => a.color - b.color)
    .map((choice) => ({ position: choice.color, label: sentenceCase(choice.text), choice }))
}

/** "Worry about things" → "“I worry about things.”" */
export function formatIPIPItem(text: string): string {
  const trimmed = text.trim().replace(/[.!?]+$/, '')
  const body = trimmed.charAt(0).toLowerCase() + trimmed.slice(1)
  return `“I ${body}.”`
}
