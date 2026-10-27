# Secure Application Integration — Step-by-Step Guide

## Objective

Connect the internship board to a backend API and accept applications with visible loading, validation, retry, success, and failure states.

## 1. Start the integrated project

1. Use Node.js 22.5 or newer.
2. Start the API from `edvyro-backend` with `npm start`.
3. Start the Vite frontend from `edvyro-frontend` with `npm run dev`.
4. Confirm the API is healthy at `http://127.0.0.1:5000/api/v1/health`.
5. Open the frontend and check the opportunities load from the API, not demo mode.

## 2. Verify the internship board

1. Confirm a loading indicator appears while requests are pending.
2. Confirm returned API internships render as cards and search works.
3. Stop the API and refresh the page; verify the network error is visible.
4. Restart the API and use **Try again**; verify the cards load without a page reload.

## 3. Verify the application form

1. Open an internship application and submit an empty form.
2. Confirm client-side errors identify required or malformed fields.
3. Enter valid name, email, phone, and internship; submit the form.
4. Confirm the success state appears and the backend returns an application ID.
5. Send invalid or unknown internship data directly to the API; confirm server-side validation rejects it.

## 4. Verify security controls

1. Check that an unapproved `Origin` is rejected and the configured frontend origin is allowed.
2. Confirm standard security response headers are present.
3. Submit repeatedly and confirm the application endpoint returns `429` when its configured limit is exceeded.
4. Try an SQL-like search term; confirm it is treated as a value, not executable SQL.
5. Run backend and frontend tests and review the security checklist.

## Passing evidence

- Integrated source: this repository
- Automated checks: [`test-report.md`](./test-report.md)
- Security controls and production caveats: [`security-checklist.md`](./security-checklist.md)
- Reproducible request records: [`integration-test-records.json`](./integration-test-records.json)

