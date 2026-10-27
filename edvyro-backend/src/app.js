import { createReadStream } from "node:fs";
import { randomUUID } from "node:crypto";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createApplication,
  createDatabase,
  getApplications,
  getInternships,
  internshipExists,
} from "./database.js";
import {
  endSession,
  getAuthenticatedUser,
  loginAccount,
  registerAccount,
} from "./auth.js";
import { validateApplication } from "./validation.js";

const BODY_LIMIT_BYTES = 10 * 1024;
const DEFAULT_RATE_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_API_RATE_LIMIT = 120;
const DEFAULT_APPLICATION_RATE_LIMIT = 5;
const AUTH_RATE_LIMIT = 10;
const STATIC_ROOT = resolve(fileURLToPath(new URL("../../edvyro-frontend/dist/", import.meta.url)));
const CONTENT_TYPES = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
  [".woff2", "font/woff2"],
]);

function sendJson(response, status, payload, headers = {}) {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    ...headers,
  });
  response.end(body);
}

function setSecurityHeaders(response) {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
  );
  response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
}

async function serveStaticFile(response, pathname, staticRoot, method) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    return false;
  }
  const relativePath = decodedPath === "/" ? "/index.html" : decodedPath;
  const filePath = resolve(staticRoot, `.${relativePath}`);
  if (filePath !== staticRoot && !filePath.startsWith(`${staticRoot}${sep}`)) {
    return false;
  }

  try {
    const fileInfo = await stat(filePath);
    if (!fileInfo.isFile()) {
      return false;
    }
    response.writeHead(200, {
      "Content-Type": CONTENT_TYPES.get(extname(filePath).toLowerCase()) ||
        "application/octet-stream",
      "Content-Length": fileInfo.size,
      "Cache-Control": extname(filePath).toLowerCase() === ".html"
        ? "no-cache"
        : "public, max-age=3600",
    });
    if (method === "HEAD") {
      response.end();
    } else {
      createReadStream(filePath).pipe(response);
    }
    return true;
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "ENOTDIR") {
      return false;
    }
    throw error;
  }
}

function createRateLimiter(maxRequests, windowMs) {
  const clients = new Map();

  return (key, now = Date.now()) => {
    for (const [clientKey, entry] of clients) {
      if (entry.resetAt <= now) {
        clients.delete(clientKey);
      }
    }

    const current = clients.get(key);
    if (!current || current.resetAt <= now) {
      clients.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, retryAfter: 0 };
    }

    if (current.count >= maxRequests) {
      return {
        allowed: false,
        retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
      };
    }

    current.count += 1;
    return { allowed: true, retryAfter: 0 };
  };
}

async function readJsonBody(request) {
  if (!request.headers["content-type"]?.toLowerCase().startsWith("application/json")) {
    return { status: 415, error: "Content-Type must be application/json." };
  }

  const declaredLength = Number(request.headers["content-length"] || 0);
  if (declaredLength > BODY_LIMIT_BYTES) {
    request.resume();
    return { status: 413, error: "Request body is too large." };
  }

  const chunks = [];
  let bytes = 0;

  for await (const chunk of request) {
    bytes += chunk.length;
    if (bytes > BODY_LIMIT_BYTES) {
      request.resume();
      return { status: 413, error: "Request body is too large." };
    }
    chunks.push(chunk);
  }

  try {
    return { value: JSON.parse(Buffer.concat(chunks).toString("utf8")) };
  } catch {
    return { status: 400, error: "Request body must contain valid JSON." };
  }
}

function parseFilters(url) {
  const filters = {};
  for (const key of ["q", "location", "type"]) {
    const value = url.searchParams.get(key)?.trim();
    if (value) {
      filters[key] = value.slice(0, 100);
    }
  }
  return filters;
}

function getClientKey(request) {
  const forwardedFor = request.headers["x-forwarded-for"];
  if (process.env.RENDER_EXTERNAL_URL && typeof forwardedFor === "string") {
    const hops = forwardedFor.split(",").map((address) => address.trim()).filter(Boolean);
    if (hops.length) {
      return hops[hops.length - 1];
    }
  }
  return request.socket.remoteAddress || "unknown";
}

export function createApp({
  databasePath = ":memory:",
  allowedOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"],
  apiRateLimit = DEFAULT_API_RATE_LIMIT,
  applicationRateLimit = DEFAULT_APPLICATION_RATE_LIMIT,
  rateWindowMs = DEFAULT_RATE_WINDOW_MS,
  logger = (entry) => console.log(entry),
} = {}) {
  const database = createDatabase(databasePath);
  const allowedOriginSet = new Set(allowedOrigins);
  const apiLimiter = createRateLimiter(apiRateLimit, rateWindowMs);
  const authLimiter = createRateLimiter(AUTH_RATE_LIMIT, DEFAULT_RATE_WINDOW_MS);
  const applicationLimiter = createRateLimiter(
    applicationRateLimit,
    rateWindowMs
  );

  const server = createServer(async (request, response) => {
    const requestId = randomUUID();
    const startedAt = Date.now();
    response.setHeader("X-Request-Id", requestId);
    response.once("finish", () => {
      const requestPath = new URL(request.url, "http://localhost").pathname;
      logger(JSON.stringify({
        level: response.statusCode >= 500
          ? "error"
          : response.statusCode >= 400 ? "warn" : "info",
        message: "http_request",
        requestId,
        method: request.method,
        path: requestPath,
        status: response.statusCode,
        durationMs: Date.now() - startedAt,
      }));
    });
    setSecurityHeaders(response);

    const origin = request.headers.origin;
    const isSameOrigin = (() => {
      if (!origin || !request.headers.host) {
        return false;
      }
      try {
        return new URL(origin).host === request.headers.host;
      } catch {
        return false;
      }
    })();
    if (origin && !allowedOriginSet.has(origin) && !isSameOrigin) {
      sendJson(response, 403, { error: "This origin is not allowed." });
      return;
    }
    if (origin) {
      response.setHeader("Access-Control-Allow-Origin", origin);
      response.setHeader("Vary", "Origin");
    }
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (request.method === "OPTIONS") {
      response.writeHead(204);
      response.end();
      return;
    }

    const url = new URL(request.url, "http://localhost");
    const clientKey = getClientKey(request);
    if (url.pathname.startsWith("/api/")) {
      const apiLimit = apiLimiter(clientKey);
      if (!apiLimit.allowed) {
        sendJson(
          response,
          429,
          { error: "Too many requests. Please wait before trying again." },
          { "Retry-After": String(apiLimit.retryAfter) }
        );
        return;
      }
    }

    try {
      if (request.method === "GET" && url.pathname === "/api/v1/health") {
        database.prepare("SELECT 1").get();
        sendJson(response, 200, {
          status: "ok",
          checks: { database: "ok" },
        });
        return;
      }

      const authorization = request.headers.authorization || "";
      const token = authorization.replace(/^Bearer\s+/i, "");
      if (request.method === "POST" && url.pathname === "/api/v1/auth/register") {
        const authLimit = authLimiter(clientKey);
        if (!authLimit.allowed) {
          sendJson(response, 429, { error: "Too many sign-in attempts. Please wait before trying again." }, {
            "Retry-After": String(authLimit.retryAfter),
          });
          return;
        }
        const body = await readJsonBody(request);
        if (body.error) {
          sendJson(response, body.status, { error: body.error });
          return;
        }
        const result = await registerAccount(database, body.value);
        if (result.errors) {
          sendJson(response, result.status || 400, {
            error: "Please correct the account details.",
            fields: result.errors,
          });
          return;
        }
        sendJson(response, 201, {
          message: "Account created successfully.",
          ...result.value,
        });
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/v1/auth/login") {
        const authLimit = authLimiter(clientKey);
        if (!authLimit.allowed) {
          sendJson(response, 429, { error: "Too many sign-in attempts. Please wait before trying again." }, {
            "Retry-After": String(authLimit.retryAfter),
          });
          return;
        }
        const body = await readJsonBody(request);
        if (body.error) {
          sendJson(response, body.status, { error: body.error });
          return;
        }
        const result = await loginAccount(database, body.value);
        if (result.errors) {
          sendJson(response, 400, {
            error: "Please provide a valid email address and password.",
            fields: result.errors,
          });
          return;
        }
        if (!result.value) {
          sendJson(response, 401, { error: "Email or password is incorrect." });
          return;
        }
        sendJson(response, 200, result.value);
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/v1/auth/session") {
        const user = getAuthenticatedUser(database, token);
        if (!user) {
          sendJson(response, 401, { error: "Sign in to continue." });
          return;
        }
        sendJson(response, 200, { user });
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/v1/auth/logout") {
        endSession(database, token);
        response.writeHead(204, { "Cache-Control": "no-store" });
        response.end();
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/v1/internships") {
        sendJson(response, 200, {
          internships: getInternships(database, parseFilters(url)),
        });
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/v1/applications") {
        const user = getAuthenticatedUser(database, token);
        if (!user) {
          sendJson(response, 401, { error: "Sign in to view your applications." });
          return;
        }
        sendJson(response, 200, { applications: getApplications(database, user.id) });
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/v1/applications") {
        const user = getAuthenticatedUser(database, token);
        if (!user) {
          sendJson(response, 401, { error: "Sign in before submitting an application." });
          return;
        }

        const applicationLimit = applicationLimiter(clientKey);
        if (!applicationLimit.allowed) {
          sendJson(
            response,
            429,
            { error: "Too many application submissions. Please try again later." },
            { "Retry-After": String(applicationLimit.retryAfter) }
          );
          return;
        }

        const body = await readJsonBody(request);
        if (body.error) {
          sendJson(response, body.status, { error: body.error });
          return;
        }

        const validation = validateApplication(body.value);
        if (validation.errors) {
          sendJson(response, 400, {
            error: "Please correct the highlighted application details.",
            fields: validation.errors,
          });
          return;
        }

        if (!internshipExists(database, validation.value.internshipId)) {
          sendJson(response, 400, {
            error: "Please select an available internship.",
            fields: { internshipId: "The selected internship is unavailable." },
          });
          return;
        }

        const applicationId = createApplication(
          database,
          {
            ...validation.value,
            fullName: user.name,
            email: user.email,
          },
          user.id
        );
        sendJson(response, 201, {
          message: "Application submitted successfully.",
          applicationId,
        });
        return;
      }

      if (url.pathname.startsWith("/api/")) {
        sendJson(response, 404, { error: "The requested endpoint was not found." });
      }
    } catch (error) {
      console.error(JSON.stringify({
        level: "error",
        message: "api_request_failed",
        requestId,
        method: request.method,
        path: url.pathname,
        error: error.message,
      }));
      if (!response.headersSent) {
        sendJson(response, 500, {
          error: "The server could not complete this request.",
        });
      } else {
        response.destroy();
      }
    }
    if (
      !response.writableEnded &&
      !url.pathname.startsWith("/api/") &&
      (request.method === "GET" || request.method === "HEAD")
    ) {
      try {
        const served = await serveStaticFile(response, url.pathname, STATIC_ROOT, request.method);
        if (!served) {
          sendJson(response, 404, { error: "The requested page was not found." });
        }
      } catch (error) {
        console.error(JSON.stringify({
          level: "error",
          message: "static_request_failed",
          requestId,
          method: request.method,
          path: url.pathname,
          error: error.message,
        }));
        if (!response.headersSent) {
          sendJson(response, 500, { error: "The requested page could not be loaded." });
        } else {
          response.destroy();
        }
      }
    } else if (!response.writableEnded && !url.pathname.startsWith("/api/")) {
      sendJson(response, 404, { error: "The requested page was not found." });
    }
  });

  return {
    server,
    close() {
      database.close();
    },
  };
}
