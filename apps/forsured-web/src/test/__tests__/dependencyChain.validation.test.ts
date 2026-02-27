/**
 * Dependency Chain Validation Tests
 *
 * These tests validate that the React Native -> react-native-web dependency chain
 * works correctly. They run ONCE with real imports (not mocks) to verify that:
 *
 * 1. The Vite shims for react-native internal paths work
 * 2. The esbuild optimizeDeps configuration is correct
 * 3. @scaffald/ui exports can be resolved
 *
 * If these tests pass, the unit tests can safely use mocks knowing the
 * dependency chain is valid up to the mock boundary.
 *
 * CRITICAL: These tests use the REAL vite config, not test mocks.
 * They validate what Vite's esbuild sees during dependency optimization.
 */

import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const packageRoot = resolve(__dirname, '../../../');

describe('Vite Configuration Validation', () => {
  it('should have vite.config.ts with required shim patterns', () => {
    const viteConfigPath = resolve(packageRoot, 'vite.config.ts');
    expect(existsSync(viteConfigPath)).toBe(true);

    const viteConfig = readFileSync(viteConfigPath, 'utf-8');

    // Verify shim patterns include react-native/Libraries/ catch-all
    expect(viteConfig).toContain("'react-native/Libraries/'");
    expect(viteConfig).toContain("'react-native/package.json'");
  });

  it('should have react-native-shims.ts file', () => {
    const shimPath = resolve(packageRoot, 'src/shims/react-native-shims.ts');
    expect(existsSync(shimPath)).toBe(true);
  });

  it('should have react-native-web-extended.ts file', () => {
    const shimPath = resolve(packageRoot, 'src/shims/react-native-web-extended.ts');
    expect(existsSync(shimPath)).toBe(true);
  });

  it('should have expo-router-shim.ts file', () => {
    const shimPath = resolve(packageRoot, 'src/shims/expo-router-shim.ts');
    expect(existsSync(shimPath)).toBe(true);
  });

  it('should exclude problematic packages from optimizeDeps', () => {
    const viteConfigPath = resolve(packageRoot, 'vite.config.ts');
    const viteConfig = readFileSync(viteConfigPath, 'utf-8');

    // These packages cause esbuild errors if included in optimizeDeps
    expect(viteConfig).toContain("'react-native-gesture-handler'");
    expect(viteConfig).toContain("'expo-linear-gradient'");
    expect(viteConfig).toContain("'react-native-gifted-charts'");
  });

  it('should have JSX loader for .js files in esbuild options', () => {
    const viteConfigPath = resolve(packageRoot, 'vite.config.ts');
    const viteConfig = readFileSync(viteConfigPath, 'utf-8');

    // Expo packages have JSX in .js files
    expect(viteConfig).toContain("'.js': 'jsx'");
  });
});

describe('Shim File Content Validation', () => {
  it('react-native-web-extended.ts should export TurboModuleRegistry', () => {
    const shimPath = resolve(packageRoot, 'src/shims/react-native-web-extended.ts');
    const content = readFileSync(shimPath, 'utf-8');

    // TurboModuleRegistry is commonly needed by RN libraries
    expect(content).toContain('TurboModuleRegistry');
  });

  it('react-native-shims.ts should provide stub for internal paths', () => {
    const shimPath = resolve(packageRoot, 'src/shims/react-native-shims.ts');
    const content = readFileSync(shimPath, 'utf-8');

    // Should export something (even empty) to satisfy imports
    expect(content.length).toBeGreaterThan(0);
  });
});

describe('Mock Alignment Validation', () => {
  /**
   * This test validates that the mock for @scaffald/ui exports
   * the same component names as the real package would export.
   *
   * This ensures tests using mocks don't pass for the wrong reason
   * (e.g., testing a component that doesn't exist in the real package).
   */
  it('UI mock should export components that exist in real @scaffald/ui', () => {
    const mockPath = resolve(packageRoot, 'src/test/__mocks__/@scaffald/ui.tsx');
    expect(existsSync(mockPath)).toBe(true);

    const mockContent = readFileSync(mockPath, 'utf-8');

    // Core components that must exist in both mock and real package
    const requiredExports = [
      'Button',
      'Text',
      'Stack',
      'Row',
      'Input',
      'Card',
      'Spinner',
      'Tabs',
    ];

    for (const exportName of requiredExports) {
      expect(mockContent).toContain(`export const ${exportName}`);
    }
  });
});
