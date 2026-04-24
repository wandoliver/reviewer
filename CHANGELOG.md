# Changelog

All notable changes to this project will be documented in this file.

The format is loosely based on Keep a Changelog.

## [0.1.0] - 2026-04-24

Initial public release.

### Added

- local HTTP review endpoint with `GET /health` and `POST /review`
- structured JSON review output
- CLI support for:
  - text review
  - single-file review
  - staged diff review
  - git diff range review
- bearer-token and `X-API-Token` authentication support
- upstream OpenAI error mapping for validation, quota, and auth failures
- mode-specific review behavior:
  - `plan_review`
  - `code_review`
  - `strict_review`
- prompt-evaluation fixture runner
- lightweight test suite using Node’s built-in test runner
- GitHub Actions CI for typecheck, build, and tests

### Notes

- uses the OpenAI API directly via Node built-ins (`fetch`, `http`)
- intentionally keeps the dependency footprint minimal
