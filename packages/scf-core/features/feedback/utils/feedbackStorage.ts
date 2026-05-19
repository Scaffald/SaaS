import type { FeedbackPendingSubmission } from '@scf/schemas/feedback'
import { kvStorage } from '@scf/core/utils/platform'

const STORAGE_KEY = '@scf-scaffald/feedback/pending-submissions'

function parseQueue(raw: string | null): FeedbackPendingSubmission[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed as FeedbackPendingSubmission[]
    }
  } catch (error) {
    console.error('[feedbackStorage] Failed to parse queue', error)
  }
  return []
}

async function readQueue(): Promise<FeedbackPendingSubmission[]> {
  try {
    return parseQueue(await kvStorage.get(STORAGE_KEY))
  } catch (error) {
    console.error('[feedbackStorage] Unable to read queue', error)
    return []
  }
}

async function writeQueue(queue: FeedbackPendingSubmission[]): Promise<void> {
  try {
    await kvStorage.set(STORAGE_KEY, JSON.stringify(queue))
  } catch (error) {
    console.error('[feedbackStorage] Unable to persist queue', error)
  }
}

export async function getPendingFeedbackQueue(): Promise<FeedbackPendingSubmission[]> {
  return readQueue()
}

export async function addPendingFeedback(submission: FeedbackPendingSubmission): Promise<void> {
  const queue = await readQueue()
  queue.push(submission)
  await writeQueue(queue)
}

export async function updatePendingFeedback(submission: FeedbackPendingSubmission): Promise<void> {
  if (!submission.id) return
  const queue = await readQueue()
  const nextQueue = queue.map((item) => (item.id === submission.id ? submission : item))
  await writeQueue(nextQueue)
}

export async function removePendingFeedback(id: string): Promise<void> {
  const queue = await readQueue()
  const nextQueue = queue.filter((item) => item.id !== id)
  await writeQueue(nextQueue)
}

export async function clearPendingFeedback(): Promise<void> {
  await writeQueue([])
}
