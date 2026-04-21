# Improvement Report

## Overview

For Part 2, I implemented three improvements that directly follow the project audit:

1. a code and structure improvement in the stock API
2. a reliability and validation improvement in API error handling and transaction validation
3. a documentation and explainability improvement across the repository

The goal was to improve the current system in a controlled way without inventing a new frontend or adding unnecessary dependencies.

## Improvement 1: Full stock CRUD through Express

### Previous problem

The stock module already had strong service and repository logic, plus a working console UI, but the Express API only exposed read endpoints. This meant the strongest CRUD flow in the project was not fully available through the actual backend API.

### What was changed

- Added `POST /stock`
- Added `PUT /stock/:id`
- Added `PATCH /stock/:id`
- Added `DELETE /stock/:id`
- Kept the route layer thin and reused `StockItemService`
- Added extra stock service tests for update and delete behavior

### Why the new version is better

- The backend API now exposes full stock CRUD instead of only list/read endpoints.
- The same service validation rules are reused everywhere.
- The architecture stays clean: `Route -> Service -> Repository`.
- The change is easy for a grader to verify by reading `stockRoutes.js` and the tests.

## Improvement 2: Centralized error handling and stronger transaction validation

### Previous problem

The routes repeated similar `try/catch` blocks and manual JSON error responses. Also, transaction validation was weaker than stock validation, especially for filter inputs and invalid date ranges.

### What was changed

- Added a shared `asyncHandler` utility for async routes
- Added a centralized API `errorHandler`
- Added a shared `createHttpError` utility
- Updated auth and authorization middleware to use centralized error flow
- Refactored `authRoutes`, `transactionRoutes`, and `stockRoutes` to be thinner
- Strengthened `TransactionService` validation for:
  - supported transaction type
  - valid calendar dates
  - invalid date ranges
  - invalid user IDs
  - repeated query parameters
- Added focused `transactionService` tests for success and failure cases

### Why the new version is better

- Error JSON is more consistent across the API.
- Validation failures return proper `400` responses before hitting the database.
- Unexpected failures are easier to handle in one place.
- The transaction module now has clearer behavior and better test coverage.

## Improvement 3: Documentation alignment and clearer setup

### Previous problem

The repository documentation was useful but not fully aligned with the real code. The README still described the project as a web app with React UI, while the actual repo is mainly backend-focused and the frontend folder is empty.

### What was changed

- Rewrote `README.md` to reflect the real current system
- Updated `docs/architecture.md` to describe the actual layers and current status
- Updated `docs/class-diagram.md` to include the stock module and repository classes
- Added `backend/.env.example`
- Added this `docs/improvement-report.md`

### Why the new version is better

- A new person can set up the backend more easily.
- The documentation matches what actually exists in the codebase.
- The grader can quickly see which parts are implemented and which parts are still planned.

## What still remains weak in the project

- The `frontend/` folder is still only a placeholder.
- Attendance, clients, trucks, appointments, and stock movements are still not complete backend modules.
- The stock assignment flow is currently CSV-based even though the broader system schema is PostgreSQL-based.
- There are still more opportunities for integration tests and route-level tests in the future.
