# Internship Board Product Brief

## Goal

Provide a clear internship discovery and application flow backed by a secure API.

## User needs

- Browse current internship opportunities.
- Search by role, employer, location, description, or skill.
- See progress, errors, empty results, and a way to retry failed data requests.
- Apply to an available role with clear validation feedback and submission confirmation.

## API contract

- `GET /api/v1/internships` returns `{ "internships": [...] }`. Optional query parameters are `q`, `location`, and `type`.
- `POST /api/v1/applications` accepts applicant name, email, phone, internship ID, skills, and cover letter.
- Valid applications return `201` with a confirmation and generated application ID.
- Invalid requests return a safe error and field-level validation messages. Unknown internship IDs are rejected.
- `GET /api/v1/health` returns the API health status.

## Acceptance criteria

1. Internship data is loaded from the backend by default and the UI exposes loading and failure states.
2. The application form validates on the client and the backend independently enforces its rules.
3. The API uses allowlisted CORS, security headers, bounded JSON request bodies, rate limits, and parameterized SQLite queries.
4. Automated tests cover list/search, valid and invalid submissions, request handling, security headers/CORS, and rate limiting.
5. The repository contains a test report and a concise security checklist with known limitations.

## Out of scope

Authentication, applicant administration, resume uploads, email delivery, and production hosting are not implemented. Do not submit real applicant data to this local training application.

