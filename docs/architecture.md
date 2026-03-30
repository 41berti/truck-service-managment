# Architecture

## Tech Stack
- Frontend: React
- Backend: Node.js + Express
- Database: PostgreSQL
- API style: REST
- File storage demo: CSV

## Layers

### 1. UI Layer
**Location**
- `frontend/src/UI`
- `backend/src/UI/stockConsoleUI.js` (console demo for the assignment)

**Responsibility**
- Presents data to the user
- Reads input from the menu/form
- Calls the service layer
- Shows output/errors in a user-friendly way

### 2. Routes Layer
**Location**
- `backend/src/routes`

**Responsibility**
- Receives HTTP requests
- Validates request shape at a basic level
- Calls services
- Returns HTTP responses

### 3. Services Layer
**Location**
- `backend/src/Services`

**Responsibility**
- Contains business logic
- Handles login rules and transaction logic
- Validates stock input before writing to the CSV repository
- Implements filtering, low-stock detection, statistics, and CRUD rules

### 4. Models Layer
**Location**
- `backend/src/Models`

**Responsibility**
- Represents domain entities such as `User`, `Transaction`, `Attendance`, and `StockItem`
- Encapsulates data and serialization with `toJSON()`

### 5. Data Layer
**Location**
- `backend/src/Data`

**Responsibility**
- Contains repository abstractions and CSV repository implementations
- Reads/writes data from files
- Keeps persistence concerns separate from UI and service logic

## Repository Pattern

The project includes:
- `IRepository`
- `CsvTransactionRepository`
- `CsvStockItemRepository`

**Purpose**
- demonstrate the Repository Pattern required by the assignment
- show that storage logic can be abstracted behind a common contract
- prove dependency injection through `StockItemService(repository)`

## Main Design Decisions

### Why `server.js` is minimal
It works like the application bootstrap file and only starts the server.

### Why services were introduced
Authentication, transactions, and stock management already have enough logic to justify a Services layer.

### Why PostgreSQL is still the main data source
Because the real application already uses a relational database structure for the full workshop system. The existing schema already includes a dedicated `stock_items` table with domain fields needed for inventory handling.

### Why a CSV repository still exists
Because the assignment explicitly requires a file-based repository with real CRUD.

### Why `StockItem` was selected as the main CRUD model
The existing database schema already includes a `stock_items` table with attributes like `name`, `current_qty`, `min_qty`, and `unit_cost`, so this model fits both the project domain and the assignment rules.
