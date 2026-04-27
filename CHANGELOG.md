# Changelog

All notable changes to this project will be documented in this file.

The format is loosely based on Keep a Changelog.

## [0.3.1] - 2026-04-27

### Fixed

- removed locally-generated `metadata` from the model-facing strict JSON schema so OpenAI accepts review requests again
- added coverage to keep `metadata` out of the response schema while still allowing it in the final local response payload

## [0.3.0] - 2026-04-25

### Added

- response metadata in review responses:
  - model
  - duration in milliseconds
  - upstream response id when available
  - token usage when available

### Changed

- quiet test logging by making request logging suppressible in test/injected app usage while keeping runtime logging enabled by default

## [0.2.0] - 2026-04-24

### Added

- dedicated `POST /review/file` endpoint for single-file review payloads
- dedicated `POST /review/diff` endpoint for direct diff review payloads
- explicit request validation and test coverage for the dedicated endpoints

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
