import test from "node:test";
import assert from "node:assert/strict";
import { handleRequest } from "../src/app.js";
import { RequestValidationError, UpstreamApiError } from "../src/errors.js";
import type { ReviewRequest, ReviewResponse } from "../src/types.js";

function okResponse(): ReviewResponse {
  return {
    summary: "ok",
    findings: [],
    open_questions: [],
    change_summary: "ok"
  };
}

test("health endpoint is public", async () => {
  const response = await handleRequest(
    { method: "GET", url: "/health", headers: {} },
    { reviewerApiToken: "secret" }
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, { ok: true });
});

test("review endpoint accepts bearer token", async () => {
  const response = await handleRequest({
    method: "POST",
    url: "/review",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer secret"
    },
    body: JSON.stringify({
      mode: "text",
      content: "hello"
    })
  }, {
    reviewerApiToken: "secret",
    reviewFn: async (_request: ReviewRequest) => okResponse()
  });

  assert.equal(response.statusCode, 200);
});

test("review endpoint accepts X-API-Token", async () => {
  const response = await handleRequest({
    method: "POST",
    url: "/review",
    headers: {
      "content-type": "application/json",
      "x-api-token": "secret"
    },
    body: JSON.stringify({
      mode: "text",
      content: "hello"
    })
  }, {
    reviewerApiToken: "secret",
    reviewFn: async (_request: ReviewRequest) => okResponse()
  });

  assert.equal(response.statusCode, 200);
});

test("review endpoint rejects unauthorized requests", async () => {
  const response = await handleRequest({
    method: "POST",
    url: "/review",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      mode: "text",
      content: "hello"
    })
  }, {
    reviewerApiToken: "secret",
    reviewFn: async (_request: ReviewRequest) => okResponse()
  });

  assert.equal(response.statusCode, 401);
  assert.deepEqual(response.body, { error: "Unauthorized" });
});

test("review endpoint maps validation errors to 400", async () => {
  const response = await handleRequest({
    method: "POST",
    url: "/review",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      mode: "text"
    })
  }, {
    reviewFn: async () => {
      throw new Error("should not be called");
    },
    reviewerApiToken: undefined
  });

  assert.equal(response.statusCode, 400);
});

test("review endpoint maps insufficient quota to 503", async () => {
  const response = await handleRequest({
    method: "POST",
    url: "/review",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      mode: "text",
      content: "hello"
    })
  }, {
    reviewerApiToken: undefined,
    reviewFn: async () => {
      throw new UpstreamApiError("Quota exceeded", 429, "insufficient_quota", "insufficient_quota");
    }
  });

  assert.equal(response.statusCode, 503);
  assert.deepEqual(response.body, {
    error: "OpenAI request failed",
    details: "Quota exceeded"
  });
});

test("review endpoint maps request validation errors thrown by reviewer to 400", async () => {
  const response = await handleRequest({
    method: "POST",
    url: "/review",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      mode: "text",
      content: "hello"
    })
  }, {
    reviewerApiToken: undefined,
    reviewFn: async () => {
      throw new RequestValidationError("bad request");
    }
  });

  assert.equal(response.statusCode, 400);
});
