# InternBoard

InternBoard is a full-stack internship portal for students to discover opportunities, create an account, submit applications, and manage their student profile. The primary site is served by the Node.js API; an additional React internship board is available at `/current.html`.

## Try the complete journey

1. Open the home page and browse current opportunities.
2. Search listings and open an opportunity to apply.
3. Create an account or sign in when prompted.
4. Submit an application and view it in the student portal.

The primary pages and navigation adapt to mobile widths. The application form and API both validate submitted data. Demo listings are seeded from `edvyro-backend/data/internships.json`.

## Run locally

Requirements: Node.js 22.12 or newer and npm.

Install the frontend dependencies once:

```powershell
npm ci --prefix edvyro-frontend
```

Start both services from the project root:

```powershell
npm run dev
```

Open `http://127.0.0.1:5173`. The API is available at `http://127.0.0.1:5000`; its readiness endpoint is `http://127.0.0.1:5000/api/v1/health`. Keep the terminal open while using the app and press `Ctrl+C` to stop the services.

The local SQLite database is created at `edvyro-backend/data/edvyro.sqlite`. Vite proxies `/api` requests to the API. Configuration uses process environment variables; see [`edvyro-backend/.env.example`](./edvyro-backend/.env.example). The backend does not automatically load `.env` files.

## Engineering decisions

- **One deployable service:** the Node API serves the built frontend and API together, keeping deployment and CORS configuration simple.
- **SQLite with prepared statements:** a small, file-backed database is sufficient for the capstone; listing filters and writes use parameterized SQL.
- **Session-based API authentication:** passwords use salted `scrypt` hashes; database sessions store token hashes and expire after seven days.
- **Defense in depth:** server-side validation, bounded JSON bodies, allowlisted CORS, security headers, and request rate limits complement client-side checks.
- **Operational visibility:** `/api/v1/health` verifies database readiness. Structured request logs include a correlation ID, method, path, status, and duration, but omit query strings and credentials.
- **Progressive failure feedback:** listing views expose loading, empty, retry, and error states. The student flow confirms successful application submission.
- **Responsive polish:** the primary informational pages have a keyboard-accessible mobile menu, skip link, focus styles, reduced-motion support, and resized/compressed artwork with below-the-fold illustrations loaded lazily.
- **Honest contact/demo behavior:** contact requests open the user's email app instead of displaying a false server-delivery success; the home page's non-video placeholder now links to the real "How It Works" guide.
- **Privacy and scope:** resume uploads, email delivery, and admin tools are not implemented. Do not enter real applicant data in this learning project.

## API

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/v1/health` | API and SQLite readiness |
| `POST` | `/api/v1/auth/register` | Create an account and session |
| `POST` | `/api/v1/auth/login` | Authenticate and start a session |
| `GET` | `/api/v1/auth/session` | Return the signed-in user |
| `POST` | `/api/v1/auth/logout` | Revoke the current session |
| `GET` | `/api/v1/internships` | List internships; supports `q`, `location`, and `type` |
| `GET` | `/api/v1/applications` | List the signed-in student's applications |
| `POST` | `/api/v1/applications` | Validate and store an application |

Auth endpoints accept the bearer token returned at registration or login. Applications use the authenticated account's name and email and reject unknown internship IDs.

## Quality checks

Run all regression tests, frontend lint, and the production build:

```powershell
npm run check
```

This includes backend HTTP/SQLite integration tests and frontend component, hook, and validation tests. The test report and the checklists are in [`edvyro-frontend/docs/`](./edvyro-frontend/docs/).

## Deploy and submit one link

[`render.yaml`](./render.yaml) is a Render Blueprint for a single Node service with a persistent disk and `/api/v1/health` health check. To publish:

1. Push this project to a public GitHub repository.
2. In Render, create a new Blueprint from that repository and approve the `internboard` web service.
3. Wait for the health check to pass, then open the generated `https://…onrender.com` address and test registration, login, browsing, and applying.
4. Put the public repository (or a view-only project page containing the repository, deployed app, and supporting evidence) into the task's proof-link field. Add the deployed URL here once it exists.

**Deployment status:** this workspace has not been published or deployed, so it does not yet have a public proof URL. Hosting requires a Git remote and Render account access. The optional two-minute walkthrough can be recorded after deployment; show the mobile menu, search, sign-in, application submission, student portal, and health check, and briefly explain the engineering decisions above.

Before collecting real applicant data, configure backups and retention, monitor the service, and replace in-memory rate limiters with a shared store before scaling to multiple instances. Use HTTPS and keep dependencies updated. Login tokens are stored in browser local storage; deployments with stricter authentication requirements should use secure, HTTP-only cookies and CSRF protection.
