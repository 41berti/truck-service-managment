# Architecture

## Tech stack

- Backend: Node.js + Express
- Database: PostgreSQL
- API style: REST
- File storage demo: CSV
- Authentication: JWT
- Tests: Node built-in test runner

## Current system shape

The current repository is mainly a backend project. The planned frontend web layer is not implemented yet. The only working UI in the repository is the stock console UI in `backend/src/UI/stockConsoleUI.js`.

## Layers

### 1. UI Layer
**Current location**
- `backend/src/UI/stockConsoleUI.js`
- `frontend/` exists as a placeholder, but it does not yet contain a real web UI

**Responsibility**
- Read user input for the stock demo flow
- Show output and validation errors
- Call the service layer

### 2. Routes Layer
**Location**
- `backend/src/routes`

**Responsibility**
- Expose HTTP endpoints
- Keep controllers thin
- Delegate business rules to services
- Return JSON responses

Current route modules:
- `authRoutes`
- `adminRoutes`
- `transactionRoutes`
- `stockRoutes`

### 3. Services Layer
**Location**
- `backend/src/Services`

**Responsibility**
- Hold business rules
- Validate input
- Normalize data
- Decide when to return `400`, `404`, or `500` style errors

Current service modules:
- `AuthService`
- `TransactionService`
- `StockItemService`

### 4. Models Layer
**Location**
- `backend/src/Models`

**Responsibility**
- Represent domain entities
- Encapsulate serialization with `toJSON()`

Current models:
- `User`
- `Transaction`
- `Attendance`
- `StockItem`

### 5. Data Layer
**Location**
- `backend/src/Data`
- `backend/src/db`

**Responsibility**
- PostgreSQL access through `pg` for the main backend
- CSV repository persistence for the stock assignment module
- Keep storage concerns out of routes

Current persistence paths:
- `backend/src/db/pool.js` for PostgreSQL
- `backend/src/Data/repositories/CsvStockItemRepository.js`
- `backend/src/Data/repositories/CsvTransactionRepository.js`

## Main design decisions

### Why the stock module uses CSV

The project already has a PostgreSQL `stock_items` table in the schema, but the semester assignment also requires a repository-pattern example with file-based CRUD. Because of that, the stock module currently uses `CsvStockItemRepository` for the assignment flow.

### Why routes are thin

Business rules such as stock validation, low-stock detection, transaction filter validation, and login checks belong in services. This keeps the HTTP layer smaller and easier to maintain.

### Why the app now uses centralized API error handling

The project has multiple route files. Returning errors through a shared error handler keeps JSON error responses more consistent and reduces repeated `try/catch` logic inside routes.

### Why PostgreSQL still matters

The broader project domain is larger than the current implemented API. The schema already models attendance, clients, trucks, appointments, stock, and financial transactions, so PostgreSQL remains the main long-term data design for the system.

## Implemented flows

### Authentication flow
`Route -> AuthService -> PostgreSQL`

Implemented endpoints:
- `POST /auth/login`
- `GET /auth/me`

### Transaction flow
`Route -> TransactionService -> PostgreSQL`

Implemented endpoints:
- `POST /transactions/income`
- `POST /transactions/expense`
- `GET /transactions`
- `GET /transactions/summary`

### Stock flow
`Route -> StockItemService -> CsvStockItemRepository -> CSV file`

Implemented endpoints:
- `GET /stock`
- `POST /stock`
- `GET /stock/:id`
- `PUT /stock/:id`
- `PATCH /stock/:id`
- `DELETE /stock/:id`
- `GET /stock/low-stock`
- `GET /stock/summary`

Console/demo entry points:
- `npm run stock:ui`
- `npm run stock:demo`

## Current limitations

- There is no real frontend web application yet.
- Attendance, clients, trucks, appointments, and stock movements are present in the schema, but not yet implemented as full backend modules.
- The stock module is strong for the assignment, but it still uses CSV instead of PostgreSQL.
