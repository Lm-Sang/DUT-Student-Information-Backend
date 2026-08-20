# DUT Student Information Backend

Production-style REST API backend for a University Student Management System, designed for both React (web) and Flutter (mobile) clients.

## Technology Stack
- Java 21
- Spring Boot 3.x
- Spring Web, Spring Data JPA, Spring Security
- JWT authentication
- PostgreSQL
- Flyway migrations
- Maven
- Bean Validation
- Lombok
- OpenAPI / Swagger
- JUnit 5 + Mockito

## Architecture
Layered architecture with separated responsibilities:
- `controller`: HTTP endpoints
- `service`: business logic
- `repository`: data access
- `entity`: JPA entities
- `dto`: request/response models
- `mapper`: entity <-> DTO mapping
- `security`: JWT + auth filter
- `config`: security, OpenAPI, app properties
- `exception`: global exception handling
- `util`: API response wrappers

## Project Structure
`src/main/java/com/example/studentmanagement/...`
- `config, controller, dto, entity, repository, service, security, exception, mapper, util`

## Main Features
- JWT login/logout/me
- Role-based authorization (`STUDENT`, `ADMIN`, `STAFF`)
- Student CRUD + pagination/search
- Course CRUD + pagination/search/filters
- Enrollment rules (duplicate, capacity, closed course, credit limits, deadline)
- Grade management + total score + letter grade + GPA summary
- Schedule and exam listing
- Tuition and payment tracking (gateway-ready structure)
- Notifications by target role
- Admin dashboard statistics
- Consistent API response format
- Global exception handling

## Environment Variables
Use `.env.example` as a template:
- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET`
- `CORS_ALLOWED_ORIGINS`
- `MIN_CREDITS`
- `MAX_CREDITS`
- `REGISTRATION_DEADLINE`
- `MIDTERM_WEIGHT`
- `FINAL_WEIGHT`
- `JWT_EXPIRATION_MS`

## Database Setup
1. Start PostgreSQL and create DB `student_management`.
2. Configure environment variables.
3. Run app; Flyway applies migrations and seed data automatically.

## Default Development Accounts
- `admin / admin123` (ADMIN)
- `staff / staff123` (STAFF)
- `student / student123` (STUDENT)

Passwords are stored as BCrypt hashes in seed migration.

## Run Locally
```bash
mvn spring-boot:run
```

## Run Tests
```bash
mvn test
```

## Swagger / API Docs
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

## Docker
### Build and run with Docker Compose
```bash
docker compose up --build
```
Services:
- backend: `http://localhost:8080`
- postgres: `localhost:5432`

## Key API Groups
- `/api/v1/auth/*`
- `/api/v1/students/*`
- `/api/v1/courses/*`
- `/api/v1/enrollments/*`
- `/api/v1/grades/*`
- `/api/v1/schedules/*`, `/api/v1/exams/*`
- `/api/v1/tuition/*`
- `/api/v1/notifications/*`
- `/api/v1/admin/dashboard`
