# Website Status Monitor
Containerized website uptime monitoring service built with Python, FastAPI, Pytest, SQLalchemy, React, 
PostgreSQL, and Docker.

Designed to automate website status tracking and log performance metrics 
so users don't have to manually check if their services are live.
> *Processes user registration and authentication securely using bcrypt and JWTs. 
> Monitoring jobs are configured with REST endpoints, and ping response logs 
> are tracked in a PostgreSQL database running in an isolated Docker container.*
---
## Features

- Continuous website uptime monitoring
- Secure user authentication
- Session management using HTTP-only JWT cookies
- Relational data modeling with SQLAlchemy ORM
- Fully containerized environment with Docker
- Automated integration and unit testing with Pytest
---
## Architecture

```text
Client (HTTP / React)
   │
   ▼
FastAPI REST API
   │
   ├── Auth Service (JWT/Bcrypt)
   │
   ├── Ping/Monitor Route
   │
   └── PostgreSQL (Docker Volume)
```
---
## Engineering Challenges

- Engineered a testing environment using SQLAlchemy StaticPool and Pytest to ensure repeatable SQLite test runs without effecting the main database.
- Created authentication with JWTs in http-only cookies to allow users to log into their accounts that are stored on PostgreSQL. 
- Managed secure user sessions across stateless REST endpoints.
---

## API Overview

### Register User

```
POST /register
```

| Parameter | Description |
|-----------|-------------|
| username | Unique user identifier |
| password | Plaintext password (hashed before storage) |

### Authenticate

```
POST /login
```

Verifies credentials and returns a secure access token cookie for subsequent API calls.

### Health Check

```
GET /health
```

Returns {"status": "healthy"} to verify the API container is actively routing requests.

---
### Requirements

- Python 3.11+
- Docker & Docker Compose
- Pytest
---
## Installation

### Spin Up Containers

```
# Clone the repository and build the Docker containers
git clone [https://github.com/yourusername/website-status-monitor.git](https://github.com/yourusername/website-status-monitor.git)
cd website-status-monitor

# Build and start the backend and database services
docker compose up --build
```
---

## Configuration

Update docker-compose.yml or your .env file to configure the database connection:

```
POSTGRES_USER=myuser
POSTGRES_PASSWORD=mypassword
POSTGRES_DB=uptime_db
DATABASE_URL=postgresql://myuser:mypassword@postgres_db:5432/uptime_db
```
---
## Running Tests

Integration tests use Pytest and an in-memory database override to verify endpoint logic without polluting the production database.

```
docker compose exec backend pytest
```
