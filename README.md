# EmergencyLink

EmergencyLink is a role-aware emergency healthcare coordination prototype for registering emergency cases, checking hospital resource availability, recommending candidate hospitals, requesting referral acceptance, assigning ambulances, tracking journey status, and reviewing audit/history data.

It combines:

- React + TypeScript + Vite frontend
- Node.js + Express + MongoDB backend
- Socket.IO real-time events
- Python + FastAPI recommendation/AI-ML service
- Fictional/demo operational data for Pakistani hospitals and ambulances

> Important: EmergencyLink is a hackathon/demo decision-support system, not a medical device, dispatch authority, clinical triage system, or production emergency service. Use fictional/demo data only. Recommendations must be reviewed by humans and require receiving-hospital acceptance.

## Current Status

This README reflects the current audited system in `EmergencyLink-Final`.

Verified locally on 2026-10-14:

| Area | Command | Result |
|---|---|---|
| Backend tests | `cd backend && npm test` | 11 suites / 66 tests passed |
| Frontend build | `cd frontend && npm run build` | Passed, with Vite large-bundle warning |
| AI/ML service tests | `cd ai-ml-service && python -m pytest` | 381 tests passed, 1 dependency deprecation warning |

Production-facing hardening already applied:

- Strict production CORS allow-list behavior
- Production startup checks for required security config
- Removal of hardcoded Mapbox fallback token
- Disabled unauthenticated public ambulance telemetry writes
- Expanded audit redaction for sensitive fields
- Duplicate case-ID retry on unique-key collision
- Active ambulance assignment duplicate guard and partial unique index
- Offline queue payload aligned with backend sync schema

Still required before real-world use:

- Deployment-specific security testing
- Browser end-to-end tests for offline/reconnect and Socket.IO lifecycle
- Monitoring, backups, incident response, and disaster recovery
- Privacy and data-retention review
- Clinical, operational, and institutional validation

## Features

### Public Citizen Portal

- Public portal route for demo emergency request/tracking flows.
- Symptom/condition input with AI triage fallback behavior.
- Private tracking-token model for public case tracking.
- Public tracking endpoint hides internal clinical summaries and requires valid tracking credentials.
- Caller location updates are token-protected.
- Public ambulance telemetry writes are disabled; ambulance location updates require authenticated API access.

### Operations Dashboard

- Role-aware command center for coordinators, hospital staff, ambulance staff, admins, and observers.
- Active emergency overview, pending referral visibility, ambulance availability, and resource freshness indicators.
- Case details view with referrals, assignments, and workflow status.

### Emergency Case Workflow

- Register cases with priority, pickup location, required resources, and required specialties.
- Generate unique case IDs with duplicate-key retry.
- Validate state transitions.
- Require referral acceptance before destination confirmation.
- Assign ambulances only after confirmed destination.
- Prevent duplicate active ambulance assignments for one case.

### Hospital Resources

- Hospital directory with location, facility type, specialties, and resource snapshots.
- Resource freshness and verification support.
- Server-side scoping for hospital staff.
- Stale-resource reminder service for configured environments.

### Recommendation Engine

- In-process JavaScript recommendation engine.
- Optional Python/FastAPI recommendation service.
- Hard constraints are applied before ranking:
  - Closed hospitals are excluded.
  - Missing required resources are excluded.
  - Insufficient required resource counts are excluded.
  - Missing required specialties are excluded.
- Eligible hospitals are scored using travel, freshness, capacity, and capability components.
- Scores are operational prototype heuristics, not clinical probabilities.

### Referral Workflow

- Create referrals for candidate hospitals.
- Hospital staff can accept, reject, or request clarification.
- Accepted referral confirms the destination.
- Other active referrals for the case are auto-cancelled after acceptance.
- Referral actions are audited and can emit real-time updates.

### Ambulance Coordination

- Ambulance directory and status updates.
- Assignment lifecycle: `assigned -> en_route -> arrived -> handed_over`.
- Authenticated ambulance location updates.
- Role and ambulance-scope checks for restricted actions.
- Real-time status events through Socket.IO.

### Offline Sync Prototype

- Frontend local queue for supported offline events.
- Backend sync event ingestion with idempotency by `clientEventId`.
- Conflict records for version mismatches.
- Conflict review and resolution endpoints.

Offline support is implemented as a prototype. Full browser offline/restart/reconnect behavior still needs E2E tests.

### AI/ML Microservice

The Python service includes:

- Recommendation engine
- ETA and distance helpers
- Reliability and completeness indicators
- Forecasting prototypes
- Shortage/surge simulation helpers
- FastAPI API surface and automated tests

The AI/ML results are demo/prototype decision-support outputs. They are not clinically validated.

## Project Structure

```text
EmergencyLink-Final/
├── backend/
│   ├── src/
│   │   ├── config/             # Environment, constants, DB connection
│   │   ├── controllers/        # Express controllers
│   │   ├── middleware/         # Auth, RBAC, validation, audit, errors, rate limits
│   │   ├── models/             # Mongoose models
│   │   ├── routes/             # API route modules
│   │   ├── seed/               # Demo seed data and seed script
│   │   ├── services/           # Workflow, recommendation, routing, sync, email services
│   │   ├── sockets/            # Socket.IO setup and authorization helpers
│   │   └── utils/              # ApiError, response helpers, tracking tokens
│   ├── tests/                  # Jest API, unit, workflow tests
│   ├── docs/api-contract.md
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── pages/
│   │   └── shared/
│   ├── .env.example
│   └── package.json
├── ai-ml-service/
│   ├── app/
│   ├── tests/
│   ├── data/
│   └── requirements.txt
├── data/
├── AUDIT_REPORT.md
├── IMPLEMENTATION_STATUS.md
├── KNOWN_ISSUES.md
├── start-all.bat
├── stop-all.bat
└── README.md
```

## Demo Data

The seed source currently contains:

- 193 hospital records
- 73 ambulance records
- 96 distinct city names in the hospital dataset
- 7 demo users
- Resource snapshots across seeded hospitals
- 3 sample emergency cases
- Sample referrals and assignment data

Run the seed script only against a local/demo database. It clears and recreates application data.

## Demo Accounts

After running `npm run seed`, the demo accounts use the configured `SEED_PASSWORD`.

Default local password from `.env.example`:

```text
Demo@12345
```

| Role | Email | Notes |
|---|---|---|
| Coordinator | `coordinator@demo.test` | Emergency coordination and referrals |
| Ambulance staff | `amb1@demo.test` | Assigned ambulance workflow |
| Hospital staff | `city.staff@demo.test` | Punjab Institute of Cardiology demo staff |
| Hospital staff | `riverside.staff@demo.test` | Mayo Hospital Lahore demo staff |
| Hospital staff | `stmarys.staff@demo.test` | Services Hospital Lahore demo staff |
| System admin | `admin@demo.test` | User/facility administration |
| Observer | `observer@demo.test` | Read-only/monitoring style role |

Do not use demo credentials in production.

## Requirements

- Node.js and npm
- Python 3.11+ recommended for the AI/ML service
- MongoDB local instance or authorized MongoDB connection string
- Optional API keys for Mapbox, OpenRouteService, Gemini, and SMTP

## Environment Setup

### Backend

Create `backend/.env` from `backend/.env.example`:

```powershell
cd .\backend
Copy-Item .env.example .env
```

Important backend variables:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/emergencylink
JWT_SECRET=replace_with_a_long_random_local_secret
JWT_EXPIRES_IN=8h
CLIENT_ORIGIN=http://localhost:5173
RECOMMENDATION_MODE=module
RECOMMENDATION_SERVICE_URL=http://localhost:8000
RESOURCE_CONFIRMED_MAX_AGE=30
RESOURCE_STALE_AFTER=120
REFERRAL_ESCALATE_AFTER=10
SEED_PASSWORD=Demo@12345
```

Optional backend variables:

```env
MAPBOX_ACCESS_TOKEN=
OPENROUTESERVICE_API_KEY=
GEMINI_API_KEY=
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
APP_URL=http://localhost:5173
```

Production notes:

- `JWT_SECRET` must be long and random.
- `CLIENT_ORIGIN` must be explicitly configured.
- Do not set `SEED_PASSWORD` in production.
- Do not commit `.env` files.

### Frontend

Create `frontend/.env` from `frontend/.env.example` if needed:

```env
VITE_API_BASE_URL=/api/v1
```

For local Vite proxy mode, the relative `/api/v1` default is usually enough.

### Python AI/ML Service

Install dependencies from `ai-ml-service/requirements.txt`.

## Run Locally

### Option A: Windows Batch Script

From `EmergencyLink-Final`:

```cmd
start-all.bat
```

This launches:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- AI/ML service: `http://localhost:8000`

Stop all services:

```cmd
stop-all.bat
```

### Option B: Manual Terminals

Terminal 1, backend:

```powershell
cd .\backend
npm install
npm run seed
npm start
```

Terminal 2, frontend:

```powershell
cd .\frontend
npm install
npm run dev
```

Terminal 3, AI/ML service:

```powershell
cd .\ai-ml-service
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## Useful URLs

| Service | URL |
|---|---|
| Frontend | `http://localhost:5173` |
| Public portal | `http://localhost:5173/portal` |
| Staff login | `http://localhost:5173/login` |
| Backend health | `http://localhost:5000/api/v1/health` |
| Public cities endpoint | `http://localhost:5000/api/v1/public/portal/cities` |
| AI/ML Swagger docs | `http://localhost:8000/docs` |

## API Overview

Backend base path:

```text
/api/v1
```

Key route groups:

| Route group | Purpose |
|---|---|
| `/auth` | Login and authenticated profile |
| `/users` | User administration |
| `/emergencies` | Emergency case registration and case workflow |
| `/hospitals` | Hospital directory and resource updates |
| `/referrals` | Referral requests and hospital responses |
| `/ambulances` | Ambulance list, status, and authenticated location updates |
| `/assignments` | Ambulance assignment lifecycle |
| `/recommendations` | Hospital recommendation requests |
| `/sync` | Offline event sync and conflict resolution |
| `/audit-events` | Audit history |
| `/analytics` | Operational analytics |
| `/dashboard` | Dashboard summary |
| `/public/portal` | Public demo portal and token-protected tracking |

See `backend/docs/api-contract.md` for additional endpoint details.

## Testing

Run backend tests:

```powershell
cd .\backend
npm test
```

Run frontend build:

```powershell
cd .\frontend
npm run build
```

Run AI/ML tests:

```powershell
cd .\ai-ml-service
python -m pytest
```

Current verified result:

- Backend: 66 tests passing
- Frontend: production build passing with a large-bundle warning
- AI/ML: 381 tests passing with one dependency deprecation warning

## Security and Privacy Notes

- Server-side RBAC is required; frontend role-aware navigation is only a usability layer.
- Public case tracking requires a private token.
- Raw tracking tokens are not stored directly.
- Sensitive fields are redacted from audit payloads where the audit helper is used.
- Production CORS is allow-list based.
- Public ambulance telemetry writes are disabled.
- Demo data must not be treated as real operational data.
- Real patient data should not be entered into this prototype.

## Known Limitations

- Not clinically validated.
- Not production emergency infrastructure.
- Offline sync needs browser E2E testing.
- Socket.IO reconnect/listener lifecycle needs browser E2E testing.
- Frontend has no dedicated UI test suite yet.
- Frontend bundle is large and should be code-split.
- Real deployments need monitoring, backups, security review, privacy review, and institutional approval.

See:

- `AUDIT_REPORT.md`
- `IMPLEMENTATION_STATUS.md`
- `KNOWN_ISSUES.md`

## Final Verdict

EmergencyLink is a strong, demo-ready emergency coordination prototype with hardened backend behavior and broad automated test coverage. It is appropriate for hackathon judging, controlled demonstrations, and further engineering iteration with fictional data. It is not ready for real emergency dispatch or clinical use without formal validation, production operations work, and authorized institutional deployment.
