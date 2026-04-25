# Reviewer

[![Release](https://img.shields.io/badge/release-v0.3.0-blue.svg)](https://github.com/wandoliver/reviewer/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/wandoliver/reviewer/blob/main/LICENSE)

Standalone review agent backed by the OpenAI API.

## Status

Usable early version with dedicated file/diff endpoints and response metadata.

Current scope:

- local HTTP review endpoint
- CLI for file and git-diff review
- structured JSON review output
- response metadata (`model`, `duration_ms`, upstream response id and token usage when available)
- lightweight tests
- prompt-evaluation fixtures

Not implemented yet:

- streaming responses
- multi-user auth/tenant model
- Docker packaging

## Why this exists

Reviewer is a small local service for turning the OpenAI API into a repeatable review endpoint.

It is meant for cases where ChatGPT itself is not enough because you want:

- a stable HTTP endpoint
- a fixed reviewer persona
- structured JSON output
- CLI access for files, staged changes, and diffs
- a tool that other local systems or colleagues can call

## Important billing note

This uses the OpenAI API, not ChatGPT billing.

That means:

- you need an `OPENAI_API_KEY`
- your API project needs its own budget/quota
- a paid ChatGPT subscription by itself is not enough for this tool

## What it does

This service exposes a local HTTP endpoint that accepts review requests and returns structured findings. It is designed for:

- plan reviews
- code/diff reviews
- file reviews
- machine-to-machine use from other local tools or CI glue

HTTP surfaces:

- `POST /review` for the full generic request shape
- `POST /review/file` for direct single-file review payloads
- `POST /review/diff` for direct diff review payloads

## Stack

- TypeScript
- Node built-in HTTP server
- Node built-in `fetch`
- OpenAI Responses API
- minimal dependency footprint

## Setup

1. Copy `.env.example` to `.env`
2. Set `OPENAI_API_KEY`
3. Optionally set `REVIEWER_API_TOKEN`
4. Install dependencies:

```bash
npm install
```

Minimal `.env`:

```bash
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-5
PORT=3333
REVIEWER_API_TOKEN=change_me
```

## Quick start

```bash
npm install
npm run build
npm start
```

Then in a second terminal:

```bash
curl http://localhost:3333/health
```

Expected response:

```json
{"ok":true}
```

## Run

Production build:

```bash
npm run build
npm start
```

In-process smoke test:

```bash
npm run build
npm run smoke
```

Default server:

- `GET /health`
- `POST /review`
- `POST /review/file`
- `POST /review/diff`

Endpoint intent:

- `/review`
  - generic entry point
  - accepts `mode`, `content`, `diff`, `files`, and optional `context`
- `/review/file`
  - convenience wrapper for file review
  - accepts `path`, `content`, optional `title`, optional `context`, optional `mode`
  - defaults to `code_review`
- `/review/diff`
  - convenience wrapper for diff review
  - accepts `diff`, optional `title`, optional `context`, optional `mode`
  - defaults to `code_review`

## Example request

```bash
curl -X POST http://localhost:3333/review \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer change_me" \
  -d @examples/plan-review-request.json
```

Token auth also works with:

```bash
-H "X-API-Token: change_me"
```

Dedicated file-review request:

```bash
curl -X POST http://localhost:3333/review/file \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer change_me" \
  -d '{
    "path": "src/app.ts",
    "content": "export function activate() { client.status = \"active\"; }"
  }'
```

Dedicated diff-review request:

```bash
curl -X POST http://localhost:3333/review/diff \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer change_me" \
  -d '{
    "diff": "diff --git a/src/app.ts b/src/app.ts"
  }'
```

## Example response

```json
{
  "summary": "1 high-severity finding",
  "findings": [
    {
      "severity": "high",
      "title": "Activation parity is incomplete",
      "body": "The plan updates one activation path but leaves a second path unchanged.",
      "references": ["app/Livewire/...:78"]
    }
  ],
  "open_questions": [],
  "change_summary": "The plan is close but still misses one branch.",
  "metadata": {
    "model": "gpt-5",
    "duration_ms": 412,
    "response_id": "resp_123",
    "usage": {
      "input_tokens": 120,
      "output_tokens": 340,
      "total_tokens": 460
    }
  }
}
```

See also:

- [examples/plan-review-request.json](examples/plan-review-request.json)
- [examples/code-review-request.json](examples/code-review-request.json)

## CLI

Review a local text file:

```bash
npm run build
npm run cli -- text ./example-plan.md plan_review
```

Review a single code file:

```bash
npm run cli -- file ./src/app.ts code_review
```

Review staged changes:

```bash
npm run cli -- staged strict_review
```

Review a git diff range:

```bash
npm run cli -- diff HEAD~1..HEAD code_review
```

Prompt-evaluation fixtures:

```bash
npm run build
npm run eval
```

This runs a small set of stored review requests through the live reviewer and prints lightweight pass/fail checks so prompt tuning is less guessy.

## Development

Checks:

```bash
npm run check
npm run build
npm test
```

CI runs the same three commands on GitHub Actions.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## Roadmap

- improve prompt evaluation with more fixtures
- optional markdown rendering mode
- optional Docker packaging

## Notes

- The API key stays server-side.
- If you share this service with colleagues, do not share your OpenAI key. Give them the service endpoint and a separate bearer token.
- This is intentionally lightweight: no web framework, no OpenAI SDK, no runtime validation package.
