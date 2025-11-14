# Removed Tests Log

This document tracks tests that were removed during the test folder consolidation.

## Removal Criteria

Tests were removed if they met one or more of these criteria:
1. Not executed by `pnpm test` command
2. Testing code/features that no longer exist
3. Currently failing or skipped
4. Using outdated testing patterns
5. Duplicating coverage of other tests

## Removed Tests

### Date: 2025-01-16 (During REQ-203 Migration)

No tests were removed during this initial migration. The migration focused on:
- Moving Vitest infrastructure from `test/` to `tests/infrastructure/vitest/`
- Reorganizing Playwright tests into `tests/e2e/` by feature
- Moving Playwright infrastructure to `tests/infrastructure/playwright/`

All existing tests were preserved and organized into the new structure.

## Future Cleanup

The following may be considered for future cleanup after the migration is complete:
- Review skipped tests and determine if they should be fixed or removed
- Consolidate duplicate test coverage
- Remove tests for deprecated features
- Update outdated test patterns

