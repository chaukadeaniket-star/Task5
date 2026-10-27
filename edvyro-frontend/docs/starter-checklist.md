# Secure Integration — Starter Checklist

Mark each item as you complete it.

- [ ] Start the backend and verify `GET /api/v1/health`.
- [ ] Start the frontend and confirm internship records come from the API.
- [ ] Verify loading, failure, and retry states on the internship board.
- [ ] Search internships and verify a filtered result set.
- [ ] Submit an invalid application and confirm client-side field errors.
- [ ] Submit a valid application and confirm a visible success state.
- [ ] Send invalid application data directly to the API and confirm server validation.
- [ ] Confirm unknown internship IDs are rejected by the server.
- [ ] Confirm disallowed CORS origins are rejected.
- [ ] Confirm security headers are returned.
- [ ] Confirm application rate limiting returns `429` when exceeded.
- [ ] Confirm search input cannot change the SQL query structure.
- [ ] Run `npm test` in `edvyro-backend`.
- [ ] Run `npm run test`, `npm run lint`, and `npm run build` in `edvyro-frontend`.
- [ ] Review [`security-checklist.md`](./security-checklist.md) and [`test-report.md`](./test-report.md).
- [ ] Publish a single public or view-only repository/project link for submission.

