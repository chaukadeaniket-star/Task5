# Secure Application Integration — Security Checklist

## Implemented and verified

- [x] Server validates all required and optional application fields independently of the client.
- [x] Server confirms the selected internship exists before accepting an application.
- [x] SQL values use prepared statements for listing filters, internship lookup, and application insertion.
- [x] Application JSON bodies are limited to 10 KiB; field lengths are bounded.
- [x] API responses include `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, Content Security Policy, and `Permissions-Policy`.
- [x] CORS is restricted to explicit local development origins by default; configure production origins explicitly.
- [x] API traffic has an in-memory rate limit; submissions have a stricter limit and return `429` with `Retry-After`.
- [x] Error responses do not include database errors or stack traces.
- [x] Request logs include a correlation ID, method, path, status, and duration, while excluding query strings and request bodies.
- [x] The readiness endpoint executes a SQLite query and reports database status.
- [x] Local SQLite database files are ignored by Git.
- [x] Automated checks exercise validation, unknown IDs, malformed/oversized bodies, CORS, headers, parameterized search, and rate limiting.

## Before production

- [ ] Terminate HTTPS at a trusted proxy and configure secure transport end to end.
- [ ] Replace process-local rate limits with shared storage when running multiple instances; configure proxy IP handling carefully.
- [ ] Define data retention, deletion, backup, and restricted access for applicant personal information.
- [ ] Add operational monitoring, alerting, and database recovery procedures.
- [ ] Configure log collection, retention, access controls, and alerting without capturing credentials or applicant payloads.
- [ ] Set the exact production CORS allowlist; do not use wildcard origins with private application data.
- [ ] Review privacy notices and applicable legal requirements before collecting real applicant information.
- [ ] Upgrade from the built-in experimental `node:sqlite` API to a supported deployment database if runtime stability requirements demand it.

This repository is a local learning integration. It has no authentication or administrator endpoints and must not be exposed publicly with real applicant data as-is.