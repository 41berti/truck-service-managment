# Truck Service Management

Truck Service Management is a semester project for managing a truck service workshop. The current repository is mainly a backend-focused Node.js and Express application with a PostgreSQL schema and a CSV-based stock module used to demonstrate the repository pattern and CRUD flow.

## Current project status

Implemented in the current codebase:
- JWT authentication and current-user lookup
- Admin-only route protection
- Financial transaction creation, listing, and summary endpoints
- Full stock CRUD through `Route -> Service -> Repository`
- Stock statistics and low-stock filtering
- CSV repository demo and console UI for the stock module
- PostgreSQL schema for users, attendance, transactions, clients, trucks, appointments, stock items, and stock movements
- Unit tests for stock and transaction service behavior

Not yet implemented as full features:
- A real web frontend
- Full backend flows for attendance, clients, trucks, appointments, and stock movements

## Tech stack

- Node.js
- Express
- PostgreSQL
- JSON Web Tokens
- CSV file storage for the stock assignment module
- Node built-in test runner (`node:test`)

## Project structure

```text
truck-service-managment/
├── backend/
│   ├── src/
│   │   ├── Data/
│   │   ├── db/
│   │   ├── middlewares/
│   │   ├── Models/
│   │   ├── routes/
│   │   ├── Services/
│   │   ├── UI/
│   │   └── utils/
│   └── test/
├── database/
└── docs/
```

## Setup

### 1. Install dependencies

```powershell
cd "C:\Users\alber\OneDrive\Desktop\truck-service-project\truck-service-managment\backend"
npm install
```

### 2. Create environment file

Use `backend/.env.example` as the template and create `backend/.env`.

Required variables:
- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`

### 3. Prepare the database

Create a PostgreSQL database and run:

```powershell
psql -d your_database_name -f "..\database\schema.sql"
```

### 4. Seed test users

```powershell
npm run seed
```

This creates or updates these test accounts:
- `admin@test.local`
- `mechanic@test.local`
- `guard@test.local`

## Running the backend

Development mode:

```powershell
npm run dev
```

Production-style start:

```powershell
npm start
```

## Live demo quick commands

The strongest live demo flow is:

```text
Admin login -> stock list -> search/filter -> low-stock -> summary -> CRUD/validation
```

Before the demo:

```powershell
cd "C:\Users\alber\OneDrive\Desktop\truck-service-project\truck-service-managment\backend"
npm install
npm test
npm run seed
npm start
```

In a second terminal, log in as the seeded admin user:

```powershell
$login = curl.exe -s -X POST http://localhost:5000/auth/login `
  -H "Content-Type: application/json" `
  -d '{ "email": "admin@test.local", "password": "test1234" }' | ConvertFrom-Json

$token = $login.token
```

Useful stock demo requests:

```powershell
curl.exe -s http://localhost:5000/stock -H "Authorization: Bearer $token"
curl.exe -s "http://localhost:5000/stock?search=filter&sortBy=current_qty&sortOrder=desc" -H "Authorization: Bearer $token"
curl.exe -s http://localhost:5000/stock/low-stock -H "Authorization: Bearer $token"
curl.exe -s http://localhost:5000/stock/summary -H "Authorization: Bearer $token"
curl.exe -s "http://localhost:5000/stock?sortBy=supplier_name" -H "Authorization: Bearer $token"
curl.exe -s http://localhost:5000/stock/9999 -H "Authorization: Bearer $token"
```

Optional CRUD demo: create one temporary item, update it, then delete it before closing the demo.

```powershell
$created = curl.exe -s -X POST http://localhost:5000/stock `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{ "item_code": "DEMO-FLT-001", "name": "Demo Fuel Filter", "category": "Engine", "unit": "pcs", "current_qty": 2, "min_qty": 5, "unit_cost": 19.9, "supplier": "Demo Supplier", "location": "Demo Shelf" }' | ConvertFrom-Json

curl.exe -s -X PATCH "http://localhost:5000/stock/$($created.item.id)" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{ "current_qty": 8, "location": "Demo Shelf Updated" }'

curl.exe -s -X DELETE "http://localhost:5000/stock/$($created.item.id)" `
  -H "Authorization: Bearer $token"
```

## Useful commands

Run tests:

```powershell
npm test
```

Run the stock repository demo:

```powershell
npm run stock:demo
```

Open the stock console UI:

```powershell
npm run stock:ui
```

Run the CSV repository demo:

```powershell
npm run repo:demo
```

## Main API routes

Public routes:
- `GET /`
- `GET /health`
- `GET /health/db`
- `GET /health/users`
- `POST /auth/login`

Protected routes:
- `GET /auth/me`

Admin routes:
- `GET /admin/dashboard`

Transaction routes:
- `POST /transactions/income`
- `POST /transactions/expense`
- `GET /transactions`
- `GET /transactions/summary`

Stock routes:
- `GET /stock`
- `POST /stock`
- `GET /stock/:id`
- `PUT /stock/:id`
- `PATCH /stock/:id`
- `DELETE /stock/:id`
- `GET /stock/low-stock`
- `GET /stock/summary`

## Notes for graders and reviewers

- The stock module intentionally uses a CSV repository because the assignment requires a file-based repository with CRUD.
- PostgreSQL is still the main database design for the broader system.
- The frontend folder exists as a placeholder, but there is no real React frontend implementation in the current repository.
- The clearest end-to-end implemented flow is the stock module.
