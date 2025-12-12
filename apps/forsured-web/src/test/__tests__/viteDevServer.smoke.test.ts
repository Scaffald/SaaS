/**
 * Vite Dev Server Smoke Test
 *
 * This test validates that the Vite dev server can start successfully.
 * It catches esbuild/optimizeDeps errors that only surface during actual
 * dev server startup, not during unit tests (which use mocks).
 *
 * IMPORTANT: This test actually starts the Vite dev server and verifies
 * it responds. It's slow (~5-10s) so it's marked as a "smoke" test
 * that should run:
 * - In CI before deployment
 * - After modifying vite.config.ts
 * - After adding new react-native dependencies
 *
 * The test will FAIL if:
 * - esbuild can't parse a dependency (JSX in .js files)
 * - react-native internal paths aren't properly shimmed
 * - optimizeDeps is missing required excludes
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, type ChildProcess } from 'node:child_process';
import { resolve } from 'node:path';

// Skip in normal test runs - only run when explicitly requested
const SKIP_SMOKE_TESTS = process.env.RUN_SMOKE_TESTS !== 'true';

describe.skipIf(SKIP_SMOKE_TESTS)('Vite Dev Server Smoke Test', () => {
  let serverProcess: ChildProcess | null = null;
  let serverUrl: string | null = null;
  const packageRoot = resolve(__dirname, '../../../');

  beforeAll(async () => {
    // Start Vite dev server
    serverProcess = spawn('pnpm', ['dev'], {
      cwd: packageRoot,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, FORCE_COLOR: '0' },
    });

    // Wait for server to be ready by looking for "ready" in output
    const readyPromise = new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Vite dev server failed to start within 30 seconds'));
      }, 30000);

      let stdout = '';
      let stderr = '';

      serverProcess!.stdout?.on('data', (data) => {
        const chunk = data.toString();
        stdout += chunk;

        // Look for the Local URL line
        const urlMatch = chunk.match(/Local:\s+(http:\/\/localhost:\d+)/);
        if (urlMatch) {
          clearTimeout(timeout);
          resolve(urlMatch[1]);
        }
      });

      serverProcess!.stderr?.on('data', (data) => {
        const chunk = data.toString();
        stderr += chunk;

        // Check for esbuild errors
        if (chunk.includes('error:') || chunk.includes('Build failed')) {
          clearTimeout(timeout);
          reject(new Error(`Vite build error:\n${stderr}\n\nStdout:\n${stdout}`));
        }
      });

      serverProcess!.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });

      serverProcess!.on('exit', (code) => {
        if (code !== 0 && code !== null) {
          clearTimeout(timeout);
          reject(new Error(`Vite exited with code ${code}:\n${stderr}`));
        }
      });
    });

    serverUrl = await readyPromise;
  }, 60000); // 60s timeout for beforeAll

  afterAll(async () => {
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
      // Wait for process to exit
      await new Promise<void>((resolve) => {
        serverProcess!.on('exit', () => resolve());
        setTimeout(resolve, 2000); // Force resolve after 2s
      });
    }
  });

  it('should start Vite dev server without esbuild errors', () => {
    expect(serverUrl).toBeTruthy();
    expect(serverUrl).toMatch(/^http:\/\/localhost:\d+$/);
  });

  it('should respond to HTTP requests', async () => {
    expect(serverUrl).toBeTruthy();

    const response = await fetch(serverUrl!);
    expect(response.ok).toBe(true);

    const html = await response.text();
    // Verify it's actually the app, not an error page
    expect(html).toContain('<div id="root">');
  });

  it('should serve JavaScript modules without import errors', async () => {
    expect(serverUrl).toBeTruthy();

    // Request the main entry point
    const response = await fetch(`${serverUrl}/src/main.tsx`);
    expect(response.ok).toBe(true);

    const contentType = response.headers.get('content-type');
    expect(contentType).toContain('javascript');
  });
}, 120000); // 2 minute timeout for the entire describe block
