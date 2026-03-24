# Architecture

## Tech Stack
- Frontend: React
- Backend: Node.js + Express
- Database: PostgreSQL
- API style: REST

## Layers

### 1. UI Layer
Location:
- `frontend/src/UI`

Responsibility:
- Presents data to the user
- Handles forms, pages, tables, buttons, and role-based screens

Reason:
- Keeps visual logic separate from backend business logic

### 2. Routes Layer
Location:
- `backend/src/routes`

Responsibility:
- Receives HTTP requests
- Validates request shape at a basic level
- Calls services
- Returns HTTP responses

Reason:
- Keeps route files focused on API behavior

### 3. Services Layer
Location:
- `backend/src/Services`

Responsibility:
- Contains business logic
- Handles login rules, transaction validation, and summaries

Reason:
- Prevents large route files and keeps logic reusable

### 4. Models Layer
Location:
- `backend/src/Models`

Responsibility:
- Represents domain entities such as User, Transaction, and Attendance

Reason:
- Makes the code easier to understand and document

### 5. Data Layer
Location:
- `backend/src/Data`

Responsibility:
- Contains repository abstractions and CSV repository implementation

Reason:
- Separates persistence concerns from business logic

## Repository Pattern

The project includes:
- `IRepository`
- `CsvTransactionRepository`

Purpose:
- demonstrate the Repository Pattern required by the assignment
- show that storage logic can be abstracted behind a common contract

Important note:
- PostgreSQL remains the real database for the running application
- the CSV repository is included as an architecture/demo implementation

## Main Design Decisions

### Why `server.js` is minimal
It works like the application bootstrap file and only starts the server.

### Why services were introduced
Authentication and transactions already had enough logic to justify a Services layer.

### Why PostgreSQL is still the main data source
Because the real application already uses a relational database structure.

### Why the CSV repository exists
Because the assignment explicitly requires a file-based repository that reads/writes CSV.