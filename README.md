# StadiumIQ AI - FIFA World Cup 2026 Platform

StadiumIQ AI is a Generative AI-powered venue management and fan experience platform designed for the FIFA World Cup 2026. Built on Clean Architecture principles, it optimizes stadium crowd flows, streamlines waste management, reports incidents, and provides a highly accessible, multilingual AI chatbot for spectators.

---

## 📋 Project Specifications & Overview

### 1. Chosen Vertical
StadiumIQ AI is tailored for **Smart Venue Management and Fan Experience** for the FIFA World Cup 2026. The platform bridges the gap between spectator convenience (finding open gates, checking transit delay details, requesting immediate assistance) and operational command efficiency (identifying bottlenecks, automated volunteer dispatches, sustainability smart bins routes, operations analyst copilot queries).

### 2. Approach and Logic
- **Decoupled Client-Server Structure**: React single-page frontend communicates with a modular Node/Express/TypeScript backend.
- **Relational Integrity & Indexes**: Enforces data reliability via SQLite database tables synced through Sequelize ORM. Custom index annotations optimize primary query targets like gate locations and reported incident queries.
- **Role-Based Operations**: Employs JSON Web Token authorization schemas to decouple command-level capabilities (organizers) from standard spectator views (fans).
- **Lightweight Caching**: Incorporates a module-scope caching layer inside the AI service to intercept consecutive duplicate queries, saving API processing overhead.
- **WCAG Accessibility Standards**: Connects inputs to labels explicitly, enables speech accessibility, adds toast closing aria annotations, and flags visual-only icons with `aria-hidden` attributes for inclusive screen-reader usage.

### 3. How the Solution Works
- **AI Gate Recommendations**: The routing service checks flow rates and current queue sizes across gates to estimate wait times. Artificially penalizes gate bottlenecks by scaling down flow rates.
- **Smart Bin Collection Optimization**: Smart bins report fill percentages. When staff requests route optimization, a greedy sorting algorithm maps collection priority for bins above the 50% capacity threshold.
- **Real-Time Incident Dispatch**: Fans report security issues or assistance requests. Incident routes filter logs depending on user privilege (spectators only view their logs, organizers access all). Volunteers are dispatched with status updates, triggering toast notifications in real-time.
- **Accessible AI Assist**: Multilingual speech-enabled chatbot provides directions, schedules, and information to spectators.

### 4. Assumptions Made
- **Stadia Scale**: We assume the stadium coordinates are static.
- **Default Database State**: The SQLite database seeds with baseline matches, gates, smart bins, and user accounts.
- **Google Gemini Fallback**: If the `GEMINI_API_KEY` is not provided in environment settings, the AI engine transparently falls back to a rules-based context simulation matching matches, transit routes, and smart bin locations to maintain offline operational continuity.

---

## 🛠️ Architecture & Tech Stack

StadiumIQ is built with a strictly decoupled frontend and backend ecosystem:

- **Frontend**: Single Page Application built using React.js, Vite, TypeScript, and Lucide Icons. Designed with premium Vanilla CSS featuring responsive layouts, glassmorphic themes, and accessible focus parameters conforming to WCAG standards.
- **Backend**: Modular REST API built with Node.js, Express.js, TypeScript, Winston logging, and Helmet security.
- **Database**: Fully normalized SQLite relational database mapped with Sequelize ORM, using transaction structures, foreign key constraints, and indexing.
- **AI Engine**: Google Gemini API integration (via `@google/generative-ai`) providing dynamic context-injected operations briefings and fan concierge dialogs, with seamless local simulation fallbacks if API keys are undefined.

---

## 🔑 Default Accounts (Seeded Data)

For evaluation and testing convenience, the database contains pre-configured users for each role:

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Organizer** | `organizer@stadiumiq.com` | `organizerpassword123` | KPI Command metrics, report incidents, dispatch volunteer actions, resolve incident dispatches, query AI operations analyst copilot. |
| **Spectator Fan** | `fan@stadiumiq.com` | `fanpassword123` | Read match lists, request AI gate recommendations, check transit delays, report assistance requests, track ticket dispatches in real-time. |

---

## ⚙️ Quick Start Installation

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### 1. Backend Setup
```bash
cd backend
# Install dependencies
npm install

# Create environment variables file
cp .env.example .env
```
Open `.env` and configure:
- `GEMINI_API_KEY`: Set your official Google Gemini API key. (If left blank, the system automatically falls back to local context simulation, remaining fully functional!)

### 2. Seed Database
Run the schema seeder to drop/recreate database tables and load baseline matches, gates, transit schedules, smart bins, and user accounts:
```bash
npm run seed
```

### 3. Frontend Setup
```bash
cd ../frontend
# Install dependencies
npm install
```

### 4. Running the Application Locally
In two separate terminal sessions:

**Start Backend Server** (Runs on port `5001`):
```bash
cd backend
npm run dev
```

**Start Frontend Client** (Runs on port `3000` with automated proxying to the backend):
```bash
cd frontend
npm run dev
```
Open your browser to `http://localhost:3000` to interact with the platform.

---

## 🧪 Testing Suite
We use Vitest and Supertest to execute unit and REST API integration tests. 

Run tests:
```bash
cd backend
npm run test
```
*Note: During testing, the database automatically initializes a separate in-memory SQLite sandbox (`:memory:`) to ensure no production or development database records are affected.*
