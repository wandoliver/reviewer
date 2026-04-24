import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { buildApp } from "../src/app.js";
import { RequestValidationError, UpstreamApiError } from "../src/errors.js";
async function listen(server) {
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    if (!address || typeof address === "string") {
        throw new Error("No address");
    }
    return address.port;
}
async function close(server) {
    await new Promise((resolve, reject) => {
        server.close((error) => {
            if (error) {
                reject(error);
                return;
            }
            resolve();
        });
    });
}
function okResponse() {
    return {
        summary: "ok",
        findings: [],
        open_questions: [],
        change_summary: "ok"
    };
}
test("health endpoint is public", async () => {
    const app = buildApp({ reviewerApiToken: "secret" });
    const port = await listen(app);
    const response = await fetch(`http://127.0.0.1:${port}/health`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.deepEqual(body, { ok: true });
    await close(app);
});
test("review endpoint accepts bearer token", async () => {
    const app = buildApp({
        reviewerApiToken: "secret",
        reviewFn: async (_request) => okResponse()
    });
    const port = await listen(app);
    const response = await fetch(`http://127.0.0.1:${port}/review`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer secret"
        },
        body: JSON.stringify({
            mode: "text",
            content: "hello"
        })
    });
    assert.equal(response.status, 200);
    await close(app);
});
test("review endpoint accepts X-API-Token", async () => {
    const app = buildApp({
        reviewerApiToken: "secret",
        reviewFn: async (_request) => okResponse()
    });
    const port = await listen(app);
    const response = await fetch(`http://127.0.0.1:${port}/review`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-API-Token": "secret"
        },
        body: JSON.stringify({
            mode: "text",
            content: "hello"
        })
    });
    assert.equal(response.status, 200);
    await close(app);
});
test("review endpoint rejects unauthorized requests", async () => {
    const app = buildApp({
        reviewerApiToken: "secret",
        reviewFn: async (_request) => okResponse()
    });
    const port = await listen(app);
    const response = await fetch(`http://127.0.0.1:${port}/review`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            mode: "text",
            content: "hello"
        })
    });
    const body = await response.json();
    assert.equal(response.status, 401);
    assert.equal(body.error, "Unauthorized");
    await close(app);
});
test("review endpoint maps validation errors to 400", async () => {
    const app = buildApp({
        reviewFn: async () => {
            throw new Error("should not be called");
        },
        reviewerApiToken: undefined
    });
    const port = await listen(app);
    const response = await fetch(`http://127.0.0.1:${port}/review`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            mode: "text"
        })
    });
    assert.equal(response.status, 400);
    await close(app);
});
test("review endpoint maps insufficient quota to 503", async () => {
    const app = buildApp({
        reviewerApiToken: undefined,
        reviewFn: async () => {
            throw new UpstreamApiError("Quota exceeded", 429, "insufficient_quota", "insufficient_quota");
        }
    });
    const port = await listen(app);
    const response = await fetch(`http://127.0.0.1:${port}/review`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            mode: "text",
            content: "hello"
        })
    });
    const body = await response.json();
    assert.equal(response.status, 503);
    assert.equal(body.error, "OpenAI request failed");
    await close(app);
});
test("review endpoint maps request validation errors thrown by reviewer to 400", async () => {
    const app = buildApp({
        reviewerApiToken: undefined,
        reviewFn: async () => {
            throw new RequestValidationError("bad request");
        }
    });
    const port = await listen(app);
    const response = await fetch(`http://127.0.0.1:${port}/review`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            mode: "text",
            content: "hello"
        })
    });
    assert.equal(response.status, 400);
    await close(app);
});
//# sourceMappingURL=app.test.js.map