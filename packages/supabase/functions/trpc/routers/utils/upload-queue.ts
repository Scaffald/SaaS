/**
 * Upload Queue
 *
 * Manages concurrent document uploads with configurable concurrency,
 * retry logic, and progress tracking.
 *
 * Features:
 * - Process 5 concurrent uploads at a time
 * - Retry failed uploads (3 attempts)
 * - Track queue depth and processing time
 * - Progress callbacks for monitoring
 */

export interface UploadTask {
  id: string
  file: Uint8Array
  path: string
  contentType: string
  metadata?: Record<string, string>
  retryCount: number
  createdAt: Date
}

export interface UploadResult {
  id: string
  success: boolean
  path?: string
  error?: string
  duration: number
  retries: number
}

export interface QueueMetrics {
  queueDepth: number
  processing: number
  completed: number
  failed: number
  avgProcessingTime: number
  totalProcessed: number
}

export type UploadHandler = (task: UploadTask) => Promise<{ path: string; checksum?: string }>

export interface QueueOptions {
  concurrency?: number
  maxRetries?: number
  retryDelay?: number
  onProgress?: (metrics: QueueMetrics) => void
  onTaskComplete?: (result: UploadResult) => void
  onTaskError?: (task: UploadTask, error: Error) => void
}

const DEFAULT_CONCURRENCY = 5
const DEFAULT_MAX_RETRIES = 3
const DEFAULT_RETRY_DELAY = 1000 // 1 second

export class UploadQueue {
  private queue: UploadTask[] = []
  private processing: Map<string, UploadTask> = new Map()
  private completed: UploadResult[] = []
  private failed: UploadResult[] = []
  private handler: UploadHandler
  private options: Required<QueueOptions>
  private isProcessing = false
  private processingTimes: number[] = []
  private resolvers: Map<
    string,
    { resolve: (result: UploadResult) => void; reject: (error: Error) => void }
  > = new Map()

  constructor(handler: UploadHandler, options: QueueOptions = {}) {
    this.handler = handler
    this.options = {
      concurrency: options.concurrency ?? DEFAULT_CONCURRENCY,
      maxRetries: options.maxRetries ?? DEFAULT_MAX_RETRIES,
      retryDelay: options.retryDelay ?? DEFAULT_RETRY_DELAY,
      onProgress: options.onProgress ?? (() => {}),
      onTaskComplete: options.onTaskComplete ?? (() => {}),
      onTaskError: options.onTaskError ?? (() => {}),
    }
  }

  /**
   * Add an upload task to the queue
   * Returns a promise that resolves when the task completes
   */
  enqueue(task: Omit<UploadTask, 'id' | 'retryCount' | 'createdAt'>): Promise<UploadResult> {
    const id = crypto.randomUUID()
    const fullTask: UploadTask = {
      ...task,
      id,
      retryCount: 0,
      createdAt: new Date(),
    }

    this.queue.push(fullTask)
    this.emitProgress()

    const promise = new Promise<UploadResult>((resolve, reject) => {
      this.resolvers.set(id, { resolve, reject })
    })

    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue()
    }

    return promise
  }

  /**
   * Add multiple upload tasks to the queue
   * Returns a promise that resolves when all tasks complete
   */
  enqueueBatch(
    tasks: Array<Omit<UploadTask, 'id' | 'retryCount' | 'createdAt'>>
  ): Promise<UploadResult[]> {
    return Promise.all(tasks.map((task) => this.enqueue(task)))
  }

  /**
   * Get current queue metrics
   */
  getMetrics(): QueueMetrics {
    const totalProcessed = this.completed.length + this.failed.length
    const avgProcessingTime =
      this.processingTimes.length > 0
        ? this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length
        : 0

    return {
      queueDepth: this.queue.length,
      processing: this.processing.size,
      completed: this.completed.length,
      failed: this.failed.length,
      avgProcessingTime: Math.round(avgProcessingTime),
      totalProcessed,
    }
  }

  /**
   * Clear completed and failed results
   */
  clearHistory(): void {
    this.completed = []
    this.failed = []
    this.processingTimes = []
  }

  /**
   * Get all completed results
   */
  getCompleted(): UploadResult[] {
    return [...this.completed]
  }

  /**
   * Get all failed results
   */
  getFailed(): UploadResult[] {
    return [...this.failed]
  }

  /**
   * Cancel a pending task by ID
   * Returns true if the task was found and cancelled
   */
  cancel(taskId: string): boolean {
    const index = this.queue.findIndex((t) => t.id === taskId)
    if (index !== -1) {
      this.queue.splice(index, 1)
      const resolver = this.resolvers.get(taskId)
      if (resolver) {
        resolver.reject(new Error('Task cancelled'))
        this.resolvers.delete(taskId)
      }
      this.emitProgress()
      return true
    }
    return false
  }

  /**
   * Cancel all pending tasks
   */
  cancelAll(): void {
    for (const task of this.queue) {
      const resolver = this.resolvers.get(task.id)
      if (resolver) {
        resolver.reject(new Error('Task cancelled'))
        this.resolvers.delete(task.id)
      }
    }
    this.queue = []
    this.emitProgress()
  }

  /**
   * Process the queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return
    this.isProcessing = true

    while (this.queue.length > 0 || this.processing.size > 0) {
      // Fill processing slots up to concurrency limit
      while (this.queue.length > 0 && this.processing.size < this.options.concurrency) {
        const task = this.queue.shift()
        if (task) {
          this.processing.set(task.id, task)
          this.processTask(task)
        }
      }

      // Wait a bit before checking again
      await new Promise((resolve) => setTimeout(resolve, 10))
    }

    this.isProcessing = false
  }

  /**
   * Process a single task
   */
  private async processTask(task: UploadTask): Promise<void> {
    const startTime = Date.now()
    let lastError: Error | null = null

    try {
      const result = await this.handler(task)
      const duration = Date.now() - startTime
      this.processingTimes.push(duration)

      const uploadResult: UploadResult = {
        id: task.id,
        success: true,
        path: result.path,
        duration,
        retries: task.retryCount,
      }

      this.completed.push(uploadResult)
      this.options.onTaskComplete(uploadResult)

      const resolver = this.resolvers.get(task.id)
      if (resolver) {
        resolver.resolve(uploadResult)
        this.resolvers.delete(task.id)
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (task.retryCount < this.options.maxRetries) {
        // Retry the task
        task.retryCount++
        this.options.onTaskError(task, lastError)

        // Wait before retry with exponential backoff
        const delay = this.options.retryDelay * 2 ** (task.retryCount - 1)
        await new Promise((resolve) => setTimeout(resolve, delay))

        // Re-queue the task
        this.queue.unshift(task)
      } else {
        // Max retries exceeded
        const duration = Date.now() - startTime
        const uploadResult: UploadResult = {
          id: task.id,
          success: false,
          error: lastError.message,
          duration,
          retries: task.retryCount,
        }

        this.failed.push(uploadResult)
        this.options.onTaskComplete(uploadResult)

        const resolver = this.resolvers.get(task.id)
        if (resolver) {
          resolver.resolve(uploadResult) // Resolve with failed result rather than reject
          this.resolvers.delete(task.id)
        }
      }
    } finally {
      this.processing.delete(task.id)
      this.emitProgress()
    }
  }

  /**
   * Emit progress update
   */
  private emitProgress(): void {
    this.options.onProgress(this.getMetrics())
  }
}

/**
 * Create an upload queue with the given handler
 */
export function createUploadQueue(handler: UploadHandler, options?: QueueOptions): UploadQueue {
  return new UploadQueue(handler, options)
}
