# truck-service-managment
Web app for managing a truck service workshop: finances (income/expense), employee attendance, inventory stock, and service appointments.

## Architecture

This project follows a layered architecture:

- UI layer: React pages and components
- Routes layer: Express API endpoints
- Services layer: business logic
- Models layer: domain classes
- Data layer: repository abstractions and CSV repository demo

PostgreSQL remains the main runtime database for the real application, while a CSV repository is included to demonstrate the Repository Pattern required by the semester assignment.