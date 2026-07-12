# Architecture Design Document

This document outlines the architecture design principles and data boundaries of **StadiumIQ AI**.

## Core Design Principles

To ensure modularity, scalability, and ease of testing, StadiumIQ AI follows **Clean Architecture** patterns. The layers are decoupled, separating presentation logic, business services, and database layers:

```
+-------------------------------------------------------------+
| Presentation Layer (React.js Single Page App, CSS)          |
+-------------------------------------------------------------+
                            | (HTTP REST API)
                            v
+-------------------------------------------------------------+
| Application / Middleware (Express.js Routing, JWT Auth,     |
| Validation, Rate Limiter)                                   |
+-------------------------------------------------------------+
                            |
                            v
+-------------------------------------------------------------+
| Domain Service Layer (Routing Algorithms, Gemini AI Service)|
+-------------------------------------------------------------+
                            |
                            v
+-------------------------------------------------------------+
| Infrastructure / Database Adapters (Sequelize ORM, SQLite)  |
+-------------------------------------------------------------+
```

---

## Technical Modular Flow

### 1. Presentation Layer (Client)
- Built using React.js and TypeScript.
- Decoupled modules represent dashboard spaces: Fan portal, Staff/Volunteer terminal, and Organizer command dashboard.
- Features `apiFetch` service which acts as the HTTP interface layer. It maps auth headers and session resets (401 redirection).
- Designed with premium CSS containing variable token schemes for transitions, layout metrics, and instant dark/light themes.

### 2. Application Layer (Server Router)
- Built using Node.js and Express.ts.
- Controllers act as route boundaries, handling requests and calling appropriate database queries or domain optimization algorithms.
- Configured with security pipelines:
  - **Helmet**: Secures headers (Clickjacking, MIME Sniffing, XSS filtering).
  - **Auth Rate Limiters**: Throttles registration/login paths.
  - **Express Validators**: Rejects invalid schemas at the boundary level.
  - **JWT Authorization**: Enforces role access keys (Fan, Volunteer, Staff, Organizer).

### 3. Business Service Layer (Optimization & GenAI)
- **Routing Service**: Custom calculations for estimated wait times (Queue/Flow) and waste collection priority paths (Greedy Sorting).
- **Gemini Service**: Handles AI requests. It maps dynamic database records into highly descriptive system instructions.
- Includes context caching limits and local pattern fallbacks to handle missing key configurations.

### 4. Infrastructure Data Layer (ORM / Database)
- Maps Sequelize entities to database tables.
- Applies strict constraints, validations, index columns, and database transactions.
