# Architecture

Truck Service Management is now shaped as a full-stack web application with a stable backend foundation and a React frontend for the first real product flow.

## Current product flow

```text
Admin login -> protected dashboard -> stock management
```

The browser app consumes the existing Express API. Stock is the first complete module because it already has CRUD, validation, summary data, and low-stock business value.

## Tech stack

- Backend: Node.js + Express
- Frontend: React + Vite + React Router
- Database: PostgreSQL for users, finance, and the long-term domain schema
- Current stock storage: CSV repository
- Auth: JWT bearer tokens
- Tests: Node built-in test runner

## Backend layers

### Routes

Location: `backend/src/routes`

Routes expose HTTP endpoints and delegate business rules to services.

- `authRoutes` handles login and current-user lookup.
- `adminRoutes` exposes the protected admin dashboard check.
- `stockRoutes` exposes stock list, summary, low-stock, create, update, and delete.
- `transactionRoutes` exposes finance endpoints that will receive a frontend in a later phase.

### Services

Location: `backend/src/Services`

Services normalize input, enforce validation, and return domain-shaped data.

- `AuthService`
- `StockItemService`
- `TransactionService`

### Models

Location: `backend/src/Models`

Models wrap domain entities and define `toJSON()` output.

- `User`
- `StockItem`
- `Transaction`
- `Attendance`

### Data

Location: `backend/src/Data` and `backend/src/db`

PostgreSQL is configured through `backend/src/db/pool.js`. The stock module currently uses `CsvStockItemRepository` because the original assignment required file-backed repository CRUD.

The long-term product direction is to keep the repository boundary and move stock persistence to PostgreSQL later.

### Middleware

Location: `backend/src/middlewares`

- `authenticateToken` verifies JWT bearer tokens.
- `authorizeRoles` enforces role-based access.
- `errorHandler` returns consistent API errors.

## Frontend structure

Location: `frontend/src`

- `services/` centralizes API calls.
- `context/` stores auth state and token handling.
- `components/` contains layout and reusable UI pieces.
- `pages/` contains route-level screens.

The frontend intentionally implements only the first complete product path. Finance, attendance, and appointments appear as planned modules so users understand the roadmap without being misled.

## API response contract

Successful responses:

```json
{ "ok": true }
```

Error responses:

```json
{ "ok": false, "message": "..." }
```

The frontend service layer reads this contract and displays backend validation messages directly.

## Current limitations

- Stock data is still stored in CSV.
- Finance endpoints exist, but the frontend module is not built yet.
- Attendance, clients, trucks, appointments, and stock movements exist in the schema but are not full backend/frontend flows yet.
- Automated browser tests are not included yet.

## Recommended next architecture step

Move stock to PostgreSQL behind the existing repository/service boundary, then add route-level tests before building the next frontend module.
