# Changelog

All notable changes to the Scaffald SDK will be documented in this file.

For complete release history, see [GitHub Releases](https://github.com/Unicorn/UNI-Construct/releases).

## [0.3.0] - 2026-02-12

### Added
- MIT License file for open-source distribution
- Semantic-release automation for version management
- Comprehensive release tooling and documentation

### Changed
- Version bump from 0.2.0 to 0.3.0 for public release preparation
- Enhanced package.json with semantic-release dependencies

### Features
- 34 fully implemented SDK resources (applications, jobs, teams, connections, profiles, workers, organizations, etc.)
- 731+ passing tests (97.2% test coverage)
- Full API key and OAuth 2.0 authentication support
- Comprehensive TypeScript type definitions
- Dual-format builds (CommonJS + ESM) with tree-shaking support
- React hooks for @tanstack/react-query integration
- Complete documentation (README, ARCHITECTURE, examples, guides)
- Working examples for Node.js, React, and browser environments

### Technical Details
- Build system: tsup with dual CJS/ESM output
- Test framework: Vitest with MSW for API mocking
- Type safety: Full TypeScript with strict mode
- Bundle size: Optimized with tree-shaking and source maps
- Dependencies: Minimal runtime deps (only zod)

## [0.2.0] - 2024-01-14

Initial development release with core SDK functionality.
