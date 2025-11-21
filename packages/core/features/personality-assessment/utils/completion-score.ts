/**
 * Calculate completion percentage based on assessment progress
 * @param luscher1Completed - Whether Luscher Test 1 is completed (8 colors)
 * @param ipipCompleted - Whether IPIP test is completed (120 questions)
 * @param luscher2Completed - Whether Luscher Test 2 is completed (8 colors)
 * @param reportGenerated - Whether AI report is generated
 * @returns Completion percentage (0-100)
 */
export function calculateCompletionScore(
  luscher1Completed: boolean,
  ipipCompleted: boolean,
  luscher2Completed: boolean,
  reportGenerated: boolean
): number {
  // Each step is worth 25% (4 steps total)
  let score = 0

  if (luscher1Completed) score += 25
  if (ipipCompleted) score += 25
  if (luscher2Completed) score += 25
  if (reportGenerated) score += 25

  return score
}

/**
 * Calculate completion percentage based on partial progress
 * @param luscher1Choices - Number of colors selected in Luscher Test 1 (0-8)
 * @param ipipAnswers - Number of IPIP answers (0-120)
 * @param luscher2Choices - Number of colors selected in Luscher Test 2 (0-8)
 * @param reportGenerated - Whether AI report is generated
 * @returns Completion percentage (0-100)
 */
export function calculatePartialCompletionScore(
  luscher1Choices: number,
  ipipAnswers: number,
  luscher2Choices: number,
  reportGenerated: boolean
): number {
  // Luscher Test 1: 25% (8 colors = 100% of step 1)
  const luscher1Progress = Math.min((luscher1Choices / 8) * 25, 25)

  // IPIP Test: 25% (120 questions = 100% of step 2)
  const ipipProgress = Math.min((ipipAnswers / 120) * 25, 25)

  // Luscher Test 2: 25% (8 colors = 100% of step 3)
  const luscher2Progress = Math.min((luscher2Choices / 8) * 25, 25)

  // Report: 25% (all or nothing)
  const reportProgress = reportGenerated ? 25 : 0

  return Math.round(luscher1Progress + ipipProgress + luscher2Progress + reportProgress)
}
