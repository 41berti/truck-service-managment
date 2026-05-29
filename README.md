# Truck Service Management

Truck Service Management is an early web application for organizing the daily work of a truck service business. The goal is to replace scattered paper-based workflows with one digital system for stock, attendance, finance, and appointments.

Phase 1 focuses on one complete, useful flow:

```text
Admin login -> Dashboard -> Stock Management
```

The backend already provides authentication, role-based access control, stock CRUD, finance endpoints, validation, tests, and a PostgreSQL schema. The new frontend starts turning that foundation into a real browser product.

## Business problem

Small service businesses often track parts, employee attendance, daily income/expenses, and appointments with paper notes or separate files. That makes it harder to find information quickly, notice low stock early, prepare records, or scale the workflow beyond one person's memory.

This project is being evolved into a practical internal tool for:

- finding spare parts quickly
- warning when stock is low
- reducing manual stock mistakes
- preparing future printable records
- adding finance, attendance, and appointment workflows over time

## Current status

Completed in this phase:

- Node.js + Express backend
- JWT login and current-user endpoint
- admin role protection
- stock list, search, low-stock view, summary, create, update, and delete
- centralized backend error responses using `{ "ok": false, "message": "..." }`
- React + Vite frontend foundation
- admin login screen
- protected dashboard shell
- stock management screen connected to the backend API
- frontend API service layer
- backend service tests

Partially implemented:

- finance backend endpoints exist, but no frontend module yet
- PostgreSQL schema includes attendance, clients, trucks, appointments, stock items, and stock movements

Planned:

- attendance UI and backend flow
- finance UI and reporting
- appointment planning
- printable records
- migration of stock persistence from CSV demo storage to PostgreSQL

## Tech stack

- Backend: Node.js, Express, PostgreSQL, JWT
- Frontend: React, Vite, React Router
- Testing: Node built-in test runner
- Current stock persistence: CSV repository used by the existing stock module

## Project structure

```text
truck-service-managment/
├── backend/
│   ├── src/
│   │   ├── Data/
│   │   ├── Models/
│   │   ├── Services/
│   │   ├── db/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   └── utils/
│   └── test/
├── database/
├── docs/
└── frontend/
    └── src/
        ├── components/
        ├── context/
        ├── pages/
        └── services/
```

## Backend setup

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Edit `backend/.env`:

```env
PORT=5000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/truck_service_management
JWT_SECRET=replace-with-a-strong-secret
JWT_EXPIRES_IN=1d
CORS_ORIGIN=http://localhost:5173
```

Create the PostgreSQL database, then run the schema:

```powershell
psql -d truck_service_management -f ..\database\schema.sql
```

Seed demo users:

```powershell
npm run seed
```

Demo admin login:

- Email: `admin@test.local`
- Password: `test1234`

Run the backend:

```powershell
npm run dev
```

The API runs on `http://localhost:5000` by default.

## Frontend setup

```powershell
cd frontend
npm install
Copy-Item .env.example .env
```

Edit `frontend/.env` if your backend uses a different URL:

```env
VITE_API_BASE_URL=http://localhost:5000
```

Run the frontend:

```powershell
npm run dev
```

The app runs on `http://localhost:5173` by default.

## Useful commands

Backend tests:

```powershell
cd backend
npm test
```

Backend development server:

```powershell
cd backend
npm run dev
```

Frontend development server:

```powershell
cd frontend
npm run dev
```

## API response style

Successful responses use:

```json
{ "ok": true }
```

Error responses use:

```json
{ "ok": false, "message": "..." }
```

The frontend service layer expects this shape and displays backend validation messages directly to the user.

## Main backend routes

Public:

- `GET /`
- `GET /health`
- `GET /health/db`
- `POST /auth/login`

Protected:

- `GET /auth/me`
- `GET /admin/dashboard`

Stock:

- `GET /stock`
- `GET /stock/summary`
- `GET /stock/low-stock`
- `POST /stock`
- `GET /stock/:id`
- `PUT /stock/:id`
- `PATCH /stock/:id`
- `DELETE /stock/:id`

Finance backend:

- `POST /transactions/income`
- `POST /transactions/expense`
- `GET /transactions`
- `GET /transactions/summary`

## Documentation

Current product and technical docs:

- `docs/architecture.md`
- `docs/class-diagram.md`
- `docs/improvement-report.md`

Assignment-era planning, audit, and demo documents are still kept in `docs/` as historical reference. They are useful for project history, but the main product direction is now this README and the working frontend/backend flow.

## Current limitations

- Stock data still uses the CSV repository from the original assignment module.
- The frontend only implements login, dashboard, and stock management.
- Finance, attendance, and appointments are intentionally shown as planned modules.
- There are service-level tests, but route-level and browser-level automated tests are not added yet.
- Git was not available on PATH in the current local environment during this work.

## Recommended next modules

1. Move stock persistence from CSV to PostgreSQL while keeping the repository interface.
2. Add route-level API tests for auth and stock.
3. Build finance UI around the existing transaction endpoints.
4. Implement attendance check-in/check-out with printable daily records.
5. Add appointments with clients and trucks from the existing schema.
