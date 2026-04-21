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
