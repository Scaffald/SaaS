# Testing Changelog

## 2025-11-21 — CI artifact visibility for faster triage
- Test Suite workflow now uploads Vitest coverage and any Playwright traces on every run and links them back in pull request comments.
- Code Quality workflow now captures lint and standalone typecheck logs as artifacts on each execution and posts the download link to pull requests.
- Use the PR comment links to review failures or gaps before re-running pipelines; keep attaching future suite/gate changes here.
