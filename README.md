# Reviewer

Standalone TypeScript review agent backed by the OpenAI API.

## What it does

This service exposes a local HTTP endpoint that accepts review requests and returns structured findings. It is designed for:

- plan reviews
- code/diff reviews
- file reviews
- machine-to-machine use from other local tools or CI glue

## Stack

- TypeScript
- Node built-in HTTP server
- Node built-in `fetch`
- OpenAI Responses API
- TypeScript only

## Setup

1. Copy `.env.example` to `.env`
2. Set `OPENAI_API_KEY`
3. Optionally set `REVIEWER_API_TOKEN`
4. Install dependencies:

```bash
npm install
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

## Example request

```bash
curl -X POST http://localhost:3333/review \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer change_me" \
  -d '{
    "mode": "plan",
    "title": "Review this plan",
    "content": "Context\n\nWe will add a new helper..."
  }'
```

Token auth also works with:

```bash
-H "X-API-Token: change_me"
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
  "change_summary": "The plan is close but still misses one branch."
}
```

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

## Notes

- The API key stays server-side.
- If you share this service with colleagues, do not share your OpenAI key. Give them the service endpoint and a separate bearer token.
- This is intentionally lightweight: no web framework, no OpenAI SDK, no runtime validation package.
