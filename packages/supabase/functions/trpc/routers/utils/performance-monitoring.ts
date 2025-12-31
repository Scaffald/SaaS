/**
 * Performance Monitoring
 *
 * Comprehensive performance monitoring for document operations.
 * Tracks API response times, upload throughput, and slow query detection.
 *
 * Features:
 * - Track API response times per endpoint
 * - Monitor upload throughput (MB/s)
 * - Detect and log slow queries (> 1s)
 * - Collect error rates by endpoint
 * - Rolling window metrics (last 5 minutes)
 */

export interface RequestMetric {
  path: string
  method: string
  durationMs: number
  timestamp: number
  success: boolean
  errorCode?: string
  bytesTransferred?: number
}

export interface EndpointMetrics {
  path: string
  requestCount: number
  successCount: number
  errorCount: number
  avgDurationMs: number
  p50DurationMs: number
  p95DurationMs: number
  p99DurationMs: number
  maxDurationMs: number
  minDurationMs: number
  errorRate: number
  bytesTransferred: number
  throughputMBps: number
}

export interface PerformanceSnapshot {
  timestamp: number
  windowMs: number
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  avgResponseTimeMs: number
  p95ResponseTimeMs: number
  slowQueries: number
  totalBytesTransferred: number
  overallThroughputMBps: number
  endpointMetrics: EndpointMetrics[]
}

export interface MonitoringOptions {
  windowMs?: number
  slowQueryThresholdMs?: number
  maxMetricsHistory?: number
  onSlowQuery?: (metric: RequestMetric) => void
}

const DEFAULT_WINDOW_MS = 5 * 60 * 1000 // 5 minutes
const DEFAULT_SLOW_QUERY_THRESHOLD_MS = 1000 // 1 second
const DEFAULT_MAX_METRICS_HISTORY = 10000

export class PerformanceMonitor {
  private metrics: RequestMetric[] = []
  private options: Required<MonitoringOptions>

  constructor(options: MonitoringOptions = {}) {
    this.options = {
      windowMs: options.windowMs ?? DEFAULT_WINDOW_MS,
      slowQueryThresholdMs: options.slowQueryThresholdMs ?? DEFAULT_SLOW_QUERY_THRESHOLD_MS,
      maxMetricsHistory: options.maxMetricsHistory ?? DEFAULT_MAX_METRICS_HISTORY,
      onSlowQuery: options.onSlowQuery ?? this.defaultSlowQueryHandler,
    }
  }

  /**
   * Record a request metric
   */
  record(metric: Omit<RequestMetric, 'timestamp'>): void {
    const fullMetric: RequestMetric = {
      ...metric,
      timestamp: Date.now(),
    }

    this.metrics.push(fullMetric)

    // Detect slow queries
    if (metric.durationMs > this.options.slowQueryThresholdMs) {
      this.options.onSlowQuery(fullMetric)
    }

    // Prune old metrics
    this.pruneOldMetrics()
  }

  /**
   * Record the start of a request and return a function to call when complete
   */
  startRequest(path: string, method = 'query'): () => void {
    const startTime = performance.now()

    return () => {
      const durationMs = Math.round(performance.now() - startTime)
      this.record({
        path,
        method,
        durationMs,
        success: true,
      })
    }
  }

  /**
   * Record an upload with byte count
   */
  recordUpload(
    path: string,
    durationMs: number,
    bytesTransferred: number,
    success: boolean,
    errorCode?: string
  ): void {
    this.record({
      path,
      method: 'upload',
      durationMs,
      success,
      errorCode,
      bytesTransferred,
    })
  }

  /**
   * Get a performance snapshot for the current window
   */
  getSnapshot(): PerformanceSnapshot {
    const now = Date.now()
    const windowStart = now - this.options.windowMs
    const windowMetrics = this.metrics.filter((m) => m.timestamp >= windowStart)

    if (windowMetrics.length === 0) {
      return this.emptySnapshot(now)
    }

    const durations = windowMetrics.map((m) => m.durationMs).sort((a, b) => a - b)
    const totalBytes = windowMetrics.reduce((sum, m) => sum + (m.bytesTransferred || 0), 0)
    const windowSeconds = this.options.windowMs / 1000

    return {
      timestamp: now,
      windowMs: this.options.windowMs,
      totalRequests: windowMetrics.length,
      successfulRequests: windowMetrics.filter((m) => m.success).length,
      failedRequests: windowMetrics.filter((m) => !m.success).length,
      avgResponseTimeMs: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
      p95ResponseTimeMs: this.percentile(durations, 95),
      slowQueries: windowMetrics.filter((m) => m.durationMs > this.options.slowQueryThresholdMs)
        .length,
      totalBytesTransferred: totalBytes,
      overallThroughputMBps: totalBytes / 1024 / 1024 / windowSeconds,
      endpointMetrics: this.getEndpointMetrics(windowMetrics),
    }
  }

  /**
   * Get metrics for a specific endpoint
   */
  getEndpointMetrics(metrics: RequestMetric[]): EndpointMetrics[] {
    const byPath = new Map<string, RequestMetric[]>()

    for (const metric of metrics) {
      const existing = byPath.get(metric.path) || []
      existing.push(metric)
      byPath.set(metric.path, existing)
    }

    const endpointMetrics: EndpointMetrics[] = []

    for (const [path, pathMetrics] of byPath.entries()) {
      const durations = pathMetrics.map((m) => m.durationMs).sort((a, b) => a - b)
      const successCount = pathMetrics.filter((m) => m.success).length
      const errorCount = pathMetrics.filter((m) => !m.success).length
      const totalBytes = pathMetrics.reduce((sum, m) => sum + (m.bytesTransferred || 0), 0)

      // Calculate time span for throughput
      const timeSpanMs =
        pathMetrics.length > 1
          ? pathMetrics[pathMetrics.length - 1].timestamp - pathMetrics[0].timestamp
          : 1000
      const timeSpanSeconds = Math.max(timeSpanMs / 1000, 0.001) // Avoid division by zero

      endpointMetrics.push({
        path,
        requestCount: pathMetrics.length,
        successCount,
        errorCount,
        avgDurationMs: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
        p50DurationMs: this.percentile(durations, 50),
        p95DurationMs: this.percentile(durations, 95),
        p99DurationMs: this.percentile(durations, 99),
        maxDurationMs: Math.max(...durations),
        minDurationMs: Math.min(...durations),
        errorRate: pathMetrics.length > 0 ? errorCount / pathMetrics.length : 0,
        bytesTransferred: totalBytes,
        throughputMBps: totalBytes / 1024 / 1024 / timeSpanSeconds,
      })
    }

    return endpointMetrics.sort((a, b) => b.requestCount - a.requestCount)
  }

  /**
   * Get slow queries from the current window
   */
  getSlowQueries(): RequestMetric[] {
    const now = Date.now()
    const windowStart = now - this.options.windowMs

    return this.metrics
      .filter((m) => m.timestamp >= windowStart && m.durationMs > this.options.slowQueryThresholdMs)
      .sort((a, b) => b.durationMs - a.durationMs)
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = []
  }

  /**
   * Get raw metrics for the current window
   */
  getRawMetrics(): RequestMetric[] {
    const now = Date.now()
    const windowStart = now - this.options.windowMs
    return this.metrics.filter((m) => m.timestamp >= windowStart)
  }

  /**
   * Calculate percentile value
   */
  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0
    const index = Math.ceil((p / 100) * sorted.length) - 1
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))]
  }

  /**
   * Remove metrics older than the window
   */
  private pruneOldMetrics(): void {
    const cutoff = Date.now() - this.options.windowMs

    // Remove old metrics
    this.metrics = this.metrics.filter((m) => m.timestamp >= cutoff)

    // Also limit total size
    if (this.metrics.length > this.options.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.options.maxMetricsHistory)
    }
  }

  /**
   * Default slow query handler - logs to console
   */
  private defaultSlowQueryHandler(metric: RequestMetric): void {
    console.warn('[performance] Slow query detected', {
      path: metric.path,
      method: metric.method,
      durationMs: metric.durationMs,
      timestamp: new Date(metric.timestamp).toISOString(),
    })
  }

  /**
   * Create an empty snapshot
   */
  private emptySnapshot(timestamp: number): PerformanceSnapshot {
    return {
      timestamp,
      windowMs: this.options.windowMs,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgResponseTimeMs: 0,
      p95ResponseTimeMs: 0,
      slowQueries: 0,
      totalBytesTransferred: 0,
      overallThroughputMBps: 0,
      endpointMetrics: [],
    }
  }
}

// Singleton instance for application-wide monitoring
let _performanceMonitor: PerformanceMonitor | null = null

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!_performanceMonitor) {
    _performanceMonitor = new PerformanceMonitor()
  }
  return _performanceMonitor
}

export function resetPerformanceMonitor(): void {
  if (_performanceMonitor) {
    _performanceMonitor.clear()
  }
  _performanceMonitor = null
}

/**
 * Create a timing wrapper for async functions
 */
export function withTiming<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  path: string
): T {
  const monitor = getPerformanceMonitor()

  return (async (...args: Parameters<T>) => {
    const endTimer = monitor.startRequest(path)
    try {
      return await fn(...args)
    } finally {
      endTimer()
    }
  }) as T
}
