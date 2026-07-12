# API Reference Manual

This document registers the endpoint endpoints, schemas, validation rules, and response payloads of the **StadiumIQ AI API**.

---

## Headers & Authentication

All private terminal requests require a Bearer token:
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

---

## 1. Authentication Module

### Register Account
- **Endpoint**: `POST /api/auth/register`
- **Rate Limit**: Max 15 attempts / 15 mins.
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@stadiumiq.com",
    "password": "securepassword123",
    "role": "volunteer"
  }
  ```
- **Responses**:
  - `201 Created`:
    ```json
    {
      "message": "Registration successful.",
      "token": "eyJhbGciOiJIUzI1NiIsIn...",
      "user": { "id": 5, "name": "Jane Doe", "email": "jane@stadiumiq.com", "role": "volunteer" }
    }
    ```
  - `400 Bad Request`: Validation failure.
  - `409 Conflict`: Email already registered.

### Login Account
- **Endpoint**: `POST /api/auth/login`
- **Rate Limit**: Max 15 attempts / 15 mins.
- **Request Body**:
  ```json
  {
    "email": "organizer@stadiumiq.com",
    "password": "organizerpassword123"
  }
  ```
- **Responses**:
  - `200 OK`: Returns JWT token and user info.
  - `401 Unauthorized`: Bad credentials.

---

## 2. Matches & Schedules Module

### List Matches
- **Endpoint**: `GET /api/matches`
- **Query Params**:
  - `page`: Page index (default: `1`).
  - `limit`: Page count limit (default: `10`).
  - `stadiumId`: Filter by stadium ID (optional).
- **Response**:
  ```json
  {
    "total": 4,
    "page": 1,
    "totalPages": 1,
    "matches": [
      {
        "id": 1,
        "homeTeam": "USA",
        "awayTeam": "England",
        "dateTime": "2026-06-15T18:00:00.000Z",
        "status": "scheduled",
        "score": "0-0",
        "stadiumId": 1,
        "stadium": { "name": "SoFi Stadium", "city": "Los Angeles" }
      }
    ]
  }
  ```

---

## 3. Operations & Smart Bins Module

### List Stadium Gates
- **Endpoint**: `GET /api/stadiums/:stadiumId/gates`
- **Query Params**:
  - `recommend`: Set to `true` to invoke the routing engine.
  - `side`: Filter target side (e.g. `'North'`, optional).
- **Response (`recommend=true`)**:
  ```json
  {
    "gates": [...],
    "recommended": {
      "id": 2,
      "name": "Gate B (South)",
      "flowRate": 40,
      "status": "open",
      "currentQueueSize": 50,
      "estimatedWaitTimeMinutes": 1
    },
    "waitTimeMinutes": 1
  }
  ```

### Configure Gate Parameters
- **Endpoint**: `PATCH /api/stadiums/:stadiumId/gates/:gateId/flow`
- **Access**: Role `staff` or `organizer` only.
- **Request Body**:
  ```json
  {
    "flowRate": 65,
    "currentQueueSize": 180,
    "status": "bottleneck"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Gate status updated successfully.",
    "gate": { "id": 1, "name": "Gate A", "flowRate": 65, "currentQueueSize": 180, "status": "bottleneck" }
  }
  ```

### Optimize Smart Bin Waste Routing
- **Endpoint**: `GET /api/stadiums/:stadiumId/bins/routes`
- **Access**: Role `volunteer`, `staff`, or `organizer` only.
- **Response**:
  ```json
  {
    "route": [
      { "id": 2, "zoneName": "Concourse B South", "fillLevel": 92, "locationDetails": "Near Sec 120" }
    ],
    "summary": "Optimized collection route generated for 1 bins..."
  }
  ```

---

## 4. AI Services Module

### Fan Chatbot
- **Endpoint**: `POST /api/ai/chat`
- **Request Body**:
  ```json
  {
    "query": "How do I get to Gate A from Lot C?",
    "language": "en"
  }
  ```
- **Response**:
  ```json
  {
    "response": "🏟️ To get to Gate A from Lot C:\n1. Follow the blue navigation signs..."
  }
  ```

### Operations AI Briefing
- **Endpoint**: `POST /api/ai/ops-query`
- **Access**: Role `staff` or `organizer` only.
- **Request Body**:
  ```json
  {
    "query": "List all active bottleneck zones and delayed transit routes."
  }
  ```
- **Response**:
  ```json
  {
    "response": "📊 **Operations Command Briefing**:\n\n### Bottlenecks:\n- Gate B (South) is bottlenecked..."
  }
  ```
