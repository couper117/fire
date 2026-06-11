# FEMS — Fire Extinguisher Management System (TZW LTD)

A RESTful **microservices** system for managing fire extinguishers: user management,
extinguisher records, maintenance logging, inspection scheduling, and real-time reporting.
Built for TZW LTD to replace their monolithic system with a scalable, maintainable,
highly-available architecture.

## Architecture

```
                         ┌──────────────────────────┐
        Clients  ───────▶│   API Gateway  (:4000)   │  single entry point
                         └────────────┬─────────────┘
              ┌───────────────┬───────┴────────┬────────────────┐
              ▼               ▼                ▼                ▼
      ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
      │ User Service │ │ Extinguisher │ │ Inspection   │ │ Reporting    │
      │   (:4001)    │ │  Service     │ │  Service     │ │  Service     │
      │              │ │   (:4002)    │ │   (:4003)    │ │   (:4004)    │
      └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
             │                │                │                │
        users.sqlite   extinguisher.sqlite  inspection.sqlite  (no DB —
        (own DB)         (own DB)            (own DB)          aggregates
                                                              via HTTP)
```

Each domain service owns its **own database** (database-per-service pattern) and exposes
its own documented REST API. Services never touch each other's database; cross-service
needs go over HTTP. JWT issued by the user service is validated by every service using a
shared secret.

## Services

| Service | Port | Docs | Responsibility |
|---|---|---|---|
| API Gateway | 4000 | — | Routes `/users`, `/extinguishers`, `/inspections`, `/reports` |
| User Service | 4001 | `/api/docs` | Auth, roles, registration, JWT, profiles |
| Extinguisher Service | 4002 | `/api/docs` | Extinguisher CRUD + maintenance logs |
| Inspection Service | 4003 | `/api/docs` | Schedule inspections, notify personnel |
| Reporting Service | 4004 | `/api/docs` | Real-time daily/monthly/yearly reports |

## Requirements

- Node.js 18+ (uses the built-in `fetch`)
- No native build tools needed — storage uses pure-JS SQLite (`sql.js`, WebAssembly).

## Install & Run

```bash
# from the fems/ directory
npm run install:all      # install deps for every service

npm start                # boot all services in one process (gateway on :4000)
# or run each service in its own terminal:
npm run start:user
npm run start:extinguisher
npm run start:inspection
npm run start:reporting
npm run start:gateway
```

Default seeded admin: **admin@tzw.rw** / **Admin@123**

## Run the tests

```bash
npm test     # end-to-end smoke test covering all four activities (17 checks)
```

## Roles

- **Admin** — manages all features, users and data integrity (full access).
- **Inspector** — conducts inspections, logs results, schedules maintenance.
- **User** — views extinguisher status and schedules inspections (read-mostly).

## API quick reference (via the gateway on :4000)

> Direct service access works too (e.g. `http://localhost:4001/api/...`).
> Through the gateway, prefix the service: `/users`, `/extinguishers`, `/inspections`, `/reports`.

### 1) Register + login

```bash
# Register (public) -> always creates a "User"
curl -X POST http://localhost:4000/users/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"firstName":"Jane","lastName":"Doe","email":"jane@tzw.rw","password":"Passw0rd1"}'

# Login -> returns a JWT
curl -X POST http://localhost:4000/users/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@tzw.rw","password":"Admin@123"}'
# => { "token": "eyJ...", "user": {...} }

# Save it:
TOKEN=eyJ...    # paste the token value
```

### 2) Profile management

```bash
curl http://localhost:4000/users/api/users/me -H "Authorization: Bearer $TOKEN"

curl -X PUT http://localhost:4000/users/api/users/me \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"firstName":"Janet"}'

curl -X PUT http://localhost:4000/users/api/users/me/password \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"currentPassword":"Admin@123","newPassword":"NewPass99"}'
```

### 3) Password recovery

```bash
curl -X POST http://localhost:4000/users/api/auth/forgot-password \
  -H 'Content-Type: application/json' -d '{"email":"jane@tzw.rw"}'
# => { "resetToken": "abc123..." }

curl -X POST http://localhost:4000/users/api/auth/reset-password \
  -H 'Content-Type: application/json' \
  -d '{"resetToken":"abc123...","newPassword":"Reset123"}'
```

### 4) Extinguishers (Admin/Inspector to write, anyone to read)

```bash
# Register a new extinguisher
curl -X POST http://localhost:4000/extinguishers/api/extinguishers \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"serialNumber":"EXT-001","location":"Building A - Floor 2","type":"CO2","size":"5 lbs","installationDate":"2025-01-15","expiryDate":"2030-01-15"}'

# List all (filter by ?status= / ?type= / ?location=)
curl http://localhost:4000/extinguishers/api/extinguishers -H "Authorization: Bearer $TOKEN"

# View one by id
curl http://localhost:4000/extinguishers/api/extinguishers/<id> -H "Authorization: Bearer $TOKEN"

# Update
curl -X PUT http://localhost:4000/extinguishers/api/extinguishers/<id> \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"status":"Needs Maintenance"}'

# Remove (Admin only)
curl -X DELETE http://localhost:4000/extinguishers/api/extinguishers/<id> \
  -H "Authorization: Bearer $TOKEN"
```

### 5) Maintenance logging

```bash
curl -X POST http://localhost:4000/extinguishers/api/extinguishers/<id>/maintenance \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"actionTaken":"Pressure check and refill","actionDate":"2026-06-01","conditionsNoted":"Gauge in green zone"}'

curl http://localhost:4000/extinguishers/api/extinguishers/<id>/maintenance \
  -H "Authorization: Bearer $TOKEN"
```

### 6) Schedule inspections (selects extinguisher, date/time, notifies personnel)

```bash
curl -X POST http://localhost:4000/inspections/api/inspections \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"extinguisherId":"<id>","scheduledAt":"2026-07-01T09:00:00Z","assignedTo":"inspector@tzw.rw"}'

curl http://localhost:4000/inspections/api/inspections?upcoming=true -H "Authorization: Bearer $TOKEN"

# Complete / record result
curl -X PUT http://localhost:4000/inspections/api/inspections/<id> \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"status":"Completed","result":"Passed"}'
```

### 7) Real-time reports (daily / monthly / yearly)

```bash
curl http://localhost:4000/reports/api/reports/daily   -H "Authorization: Bearer $TOKEN"
curl http://localhost:4000/reports/api/reports/monthly -H "Authorization: Bearer $TOKEN"
curl http://localhost:4000/reports/api/reports/yearly  -H "Authorization: Bearer $TOKEN"

# Live stream (Server-Sent Events)
curl -N http://localhost:4000/reports/api/reports/stream/live -H "Authorization: Bearer $TOKEN"
```

A report includes the **total number of extinguishers in stock**, a breakdown by status
and type, and the **inspection status** counts — aggregated live from the other services.

## Deliverables map (assignment activities)

| Activity | Where |
|---|---|
| **1. Requirement analysis & design** | `docs/Activity1-Design-Document.docx`, `design/figma-signup-wireframe.svg` |
| **2. User management** (roles, registration, JWT, profiles) | `services/user-service/` |
| **3. Extinguisher management** (a–e CRUD, f scheduling, g maintenance) | `services/extinguisher-service/`, `services/inspection-service/` |
| **4. Reporting services** (real-time daily/monthly/yearly) | `services/reporting-service/` |
| **OpenAPI / Swagger docs** | each service's `/api/docs` + `openapi.js` |
| **Microservices + gateway** | `services/api-gateway/`, database-per-service |

## Project layout

```
fems/
├── package.json            # workspace scripts
├── start-all.js            # boots every service in one process
├── shared/                 # db (sql.js wrapper), auth (JWT/RBAC), validation
├── services/
│   ├── api-gateway/
│   ├── user-service/
│   ├── extinguisher-service/
│   ├── inspection-service/
│   └── reporting-service/
├── docs/
│   ├── Activity1-Design-Document.docx
│   └── build-design-doc.js
├── design/
│   └── figma-signup-wireframe.svg
├── test/
│   └── smoke-test.js
└── data/                   # per-service .sqlite files (created at runtime)
```

## Notes on storage

The brief asks for a microservices design with a per-service database. This implementation
uses **SQLite via `sql.js`** (a pure-WebAssembly build) so it runs anywhere with **zero
native compilation**. Each service keeps its own `.sqlite` file under `data/`. Swapping to
PostgreSQL/MySQL per service in production is a matter of replacing `shared/db.js` — the
service code uses a small `prepare().run/.get/.all` interface that maps cleanly onto any
SQL driver.
