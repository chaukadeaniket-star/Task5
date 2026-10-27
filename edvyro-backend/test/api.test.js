import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import { createApp } from "../src/app.js";

const records = JSON.parse(
  await readFile(
    new URL("./fixtures/integration-test-records.json", import.meta.url),
    "utf8"
  )
);

async function withServer(options, run) {
  const app = createApp(options);
  await new Promise((resolve, reject) => {
    app.server.once("error", reject);
    app.server.listen(0, "127.0.0.1", resolve);
  });
  const address = app.server.address();

  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) => {
      app.server.close((error) => (error ? reject(error) : resolve()));
    });
    app.close();
  }
}

async function registerUser(baseUrl, email = "taylor@example.com") {
  const response = await fetch(`${baseUrl}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Taylor Morgan",
      email,
      password: "secure-pass-123",
    }),
  });
  assert.equal(response.status, 201);
  return response.json();
}

describe("EdVyro internship API", () => {
  it("reports database readiness and emits request logs without query strings", async () => {
    const logs = [];
    await withServer({ logger: (entry) => logs.push(JSON.parse(entry)) }, async (baseUrl) => {
      const response = await fetch(
        `${baseUrl}/api/v1/health?email=private%40example.com`
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.status, "ok");
      assert.deepEqual(body.checks, { database: "ok" });
      assert.match(response.headers.get("x-request-id"), /^[0-9a-f-]{36}$/i);
      assert.equal(logs.length, 1);
      assert.equal(logs[0].message, "http_request");
      assert.equal(logs[0].method, "GET");
      assert.equal(logs[0].path, "/api/v1/health");
      assert.equal(logs[0].status, 200);
      assert.equal(typeof logs[0].durationMs, "number");
      assert.equal(JSON.stringify(logs).includes("private@example.com"), false);
    });
  });

  it("registers accounts, authenticates sessions, and revokes sessions on logout", async () => {
    await withServer({}, async (baseUrl) => {
      const account = await registerUser(baseUrl);
      assert.equal(account.user.email, "taylor@example.com");
      assert.equal(account.token.length, 64);

      const duplicateResponse = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Taylor Morgan",
          email: "TAYLOR@example.com",
          password: "secure-pass-123",
        }),
      });
      assert.equal(duplicateResponse.status, 409);

      const loginResponse = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "TAYLOR@example.com",
          password: "secure-pass-123",
        }),
      });
      assert.equal(loginResponse.status, 200);
      const login = await loginResponse.json();
      const sessionResponse = await fetch(`${baseUrl}/api/v1/auth/session`, {
        headers: { Authorization: `Bearer ${login.token}` },
      });
      assert.equal(sessionResponse.status, 200);
      assert.equal((await sessionResponse.json()).user.email, "taylor@example.com");

      const rejectedLogin = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "taylor@example.com",
          password: "wrong-password",
        }),
      });
      assert.equal(rejectedLogin.status, 401);

      const logoutResponse = await fetch(`${baseUrl}/api/v1/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${login.token}` },
      });
      assert.equal(logoutResponse.status, 204);
      const expiredSession = await fetch(`${baseUrl}/api/v1/auth/session`, {
        headers: { Authorization: `Bearer ${login.token}` },
      });
      assert.equal(expiredSession.status, 401);
    });
  });

  it("serves internships and safely binds search filters", async () => {
    await withServer({}, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/v1/internships?q=React`);
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.ok(body.internships.length > 0);
      assert.ok(
        body.internships.every((internship) =>
          JSON.stringify(internship).toLowerCase().includes("react")
        )
      );

      const injectionResponse = await fetch(
        `${baseUrl}/api/v1/internships?q=${encodeURIComponent(records.parameterizedSearch)}`
      );
      const injectionBody = await injectionResponse.json();
      assert.equal(injectionResponse.status, 200);
      assert.deepEqual(injectionBody.internships, []);
    });
  });

  it("validates applications and rejects unknown internship IDs", async () => {
    await withServer({}, async (baseUrl) => {
      const account = await registerUser(baseUrl);
      const invalidResponse = await fetch(`${baseUrl}/api/v1/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${account.token}`,
        },
        body: JSON.stringify(records.invalidApplication),
      });
      const invalidBody = await invalidResponse.json();

      assert.equal(invalidResponse.status, 400);
      assert.ok(invalidBody.fields.fullName);
      assert.ok(invalidBody.fields.email);
      assert.ok(invalidBody.fields.phone);

      const unknownResponse = await fetch(`${baseUrl}/api/v1/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${account.token}`,
        },
        body: JSON.stringify(records.unknownInternshipApplication),
      });
      const unknownBody = await unknownResponse.json();
      assert.equal(unknownResponse.status, 400);
      assert.ok(unknownBody.fields.internshipId);
    });
  });

  it("stores a valid application and returns its identifier", async () => {
    await withServer({}, async (baseUrl) => {
      const account = await registerUser(baseUrl);
      const response = await fetch(`${baseUrl}/api/v1/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${account.token}`,
        },
        body: JSON.stringify(records.validApplication),
      });
      const body = await response.json();

      assert.equal(response.status, 201);
      assert.equal(body.message, "Application submitted successfully.");
      assert.equal(typeof body.applicationId, "number");

      const applications = await fetch(`${baseUrl}/api/v1/applications`, {
        headers: { Authorization: `Bearer ${account.token}` },
      });
      const applicationBody = await applications.json();
      assert.equal(applications.status, 200);
      assert.equal(applicationBody.applications.length, 1);
      assert.equal(applicationBody.applications[0].email, "taylor@example.com");
      assert.equal(applicationBody.applications[0].internshipId, "frontend-developer");
    });
  });

  it("requires an account session to submit an application", async () => {
    await withServer({}, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/v1/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(records.validApplication),
      });
      assert.equal(response.status, 401);
    });
  });

  it("reports malformed and oversized request bodies", async () => {
    await withServer({}, async (baseUrl) => {
      const account = await registerUser(baseUrl);
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${account.token}`,
      };
      const malformedResponse = await fetch(
        `${baseUrl}/api/v1/applications`,
        {
          method: "POST",
          headers,
          body: "{",
        }
      );
      assert.equal(malformedResponse.status, 400);

      const largeResponse = await fetch(`${baseUrl}/api/v1/applications`, {
        method: "POST",
        headers,
        body: JSON.stringify({ payload: "x".repeat(11 * 1024) }),
      });
      assert.equal(largeResponse.status, 413);
    });
  });

  it("sets security headers and enforces the configured CORS allowlist", async () => {
    await withServer({}, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/v1/health`, {
        headers: { Origin: "http://localhost:5173" },
      });

      assert.equal(response.status, 200);
      assert.equal(response.headers.get("x-content-type-options"), "nosniff");
      assert.equal(response.headers.get("x-frame-options"), "DENY");
      assert.equal(
        response.headers.get("access-control-allow-origin"),
        "http://localhost:5173"
      );

      const sameOrigin = await fetch(`${baseUrl}/api/v1/health`, {
        headers: { Origin: baseUrl },
      });
      assert.equal(sameOrigin.status, 200);
      assert.equal(sameOrigin.headers.get("access-control-allow-origin"), baseUrl);

      const blocked = await fetch(`${baseUrl}/api/v1/health`, {
        headers: { Origin: "https://untrusted.example" },
      });
      assert.equal(blocked.status, 403);
    });
  });

  it("rate limits repeated application submissions", async () => {
    await withServer(
      { applicationRateLimit: 1, rateWindowMs: 60_000 },
      async (baseUrl) => {
        const account = await registerUser(baseUrl);
        const submit = () =>
          fetch(`${baseUrl}/api/v1/applications`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${account.token}`,
            },
            body: JSON.stringify(records.validApplication),
          });

        assert.equal((await submit()).status, 201);
        const limitedResponse = await submit();
        const limitedBody = await limitedResponse.json();
        assert.equal(limitedResponse.status, 429);
        assert.ok(Number(limitedResponse.headers.get("retry-after")) > 0);
        assert.match(limitedBody.error, /Too many application submissions/);
      }
    );
  });
});
