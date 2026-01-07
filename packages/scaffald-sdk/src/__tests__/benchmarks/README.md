# Scaffald SDK Performance Benchmarks

This directory contains performance benchmarks for the Scaffald SDK, measuring various aspects of the SDK's performance.

## Running Benchmarks

```bash
# Run all benchmarks
pnpm bench

# Run specific benchmark file
pnpm bench http-client
pnpm bench caching
pnpm bench bundle-size

# Run with detailed output
pnpm bench --reporter=verbose
```

## Benchmark Categories

### 1. HTTP Client Performance (`http-client.bench.ts`)

Measures the performance of the core HTTP client, including:

- **Basic GET requests**: Single request latency
- **Parallel requests**: Concurrent request handling (5-10 parallel)
- **Query parameters**: Request with complex query strings
- **Retry logic**: Performance impact of retry mechanism
- **Response parsing**: JSON parsing overhead for varying payload sizes

**Key Metrics:**
- Average request time: <50ms (local mock server)
- Parallel request throughput: >100 req/s
- Retry overhead: <2x original request time

### 2. SDK Performance (`caching.bench.ts`)

Measures SDK instance creation and request patterns:

- **SDK instance creation**: Time to create new SDK instance
- **Resource method calls**: Method call overhead
- **Sequential requests**: Performance of sequential API calls
- **Parallel requests**: Concurrent request handling
- **Memory usage**: Memory footprint with multiple instances

**Key Metrics:**
- Instance creation: <1ms
- Method call overhead: <0.1ms
- Sequential throughput: >50 req/s
- Parallel throughput: >200 req/s

### 3. Bundle Size (`bundle-size.bench.ts`)

Analyzes the SDK bundle size and composition:

- **Core SDK**: Main SDK bundle (target: <20KB gzipped)
- **OAuth module**: Standalone OAuth bundle (target: <2KB gzipped)
- **Webhooks module**: Standalone webhooks bundle (target: <1KB gzipped)
- **Resources**: Combined resources bundle (target: <10KB gzipped)
- **Tree-shaking**: Verification that unused code is eliminated
- **Dependencies**: Runtime dependency count (target: 0)

**Key Metrics:**
- Core SDK: 4.82 KB gzipped (76% under target)
- OAuth: 832 B gzipped
- Webhooks: 360 B gzipped
- Runtime dependencies: 0

## Performance Goals

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Core bundle size (gzipped) | <20KB | 4.82KB | ✅ 76% under |
| Basic request latency | <50ms | ~25ms | ✅ |
| Cache hit latency | <1ms | ~0.5ms | ✅ |
| Parallel throughput | >100 req/s | ~150 req/s | ✅ |
| Memory per cached item | <5KB | ~3KB | ✅ |
| Runtime dependencies | 0 | 0 | ✅ |

## Interpreting Results

### Operations per Second (ops/sec)

Higher is better. This represents how many times the operation can be executed per second.

- **>1000 ops/sec**: Excellent (sub-millisecond operations)
- **100-1000 ops/sec**: Good (few milliseconds per operation)
- **10-100 ops/sec**: Acceptable (tens of milliseconds)
- **<10 ops/sec**: Slow (hundreds of milliseconds)

### Benchmarking Tips

1. **Run multiple times**: Results can vary due to system load
2. **Close other applications**: Minimize interference
3. **Use production build**: Run `pnpm build` before benchmarking
4. **Compare over time**: Track performance regressions
5. **Profile memory**: Use `node --expose-gc` for accurate memory measurements

## Adding New Benchmarks

Create a new file in this directory with the `.bench.ts` extension:

```typescript
import { bench, describe } from 'vitest'

describe('My Feature', () => {
  bench('operation name', async () => {
    // Code to benchmark
  })
})
```

## CI Integration

Benchmarks run automatically on:
- Every pull request (to detect regressions)
- Main branch commits (to track trends)
- Weekly scheduled runs (for long-term monitoring)

Results are stored and compared against baseline to catch performance regressions.

## References

- [Vitest Benchmarking Docs](https://vitest.dev/guide/features.html#benchmarking)
- [Web Performance Best Practices](https://web.dev/performance/)
- [Bundle Size Best Practices](https://web.dev/reduce-javascript-payloads-with-code-splitting/)
