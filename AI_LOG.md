# 🤖 AI Collaboration Log

This document provides a transparent look behind the curtain at how AI tools were used to build this Uptime Monitor application.

---

## AI Tech Stack

| Tool | Model / Version | Usage |
|------|----------------|-------|
| Claude Opus 4.6 (Thinking) | Primary development assistant — architecture, full-stack implementation, debugging |

---

## How AI Was Used

### Backend Development

**Prompt pattern:** I described the core requirements — FastAPI with async SQLAlchemy, APScheduler background jobs, httpx for health checks — and had the AI generate the full backend structure.

**Key prompts that shaped the backend:**

1. *"Build a FastAPI backend with async SQLAlchemy using SQLite (aiosqlite), two models (urls and health_checks with one-to-many relationship), Pydantic v2 schemas, and full CRUD + dashboard endpoints."*

2. *"Create a monitoring service using httpx AsyncClient that checks all registered URLs, measures response time, handles timeouts/DNS/SSL/connection errors gracefully, and stores every result as an immutable health check record."*

3. *"Set up APScheduler with AsyncIOScheduler to run health checks every 60 seconds, with an initial check on startup after a 2-second delay."*

### Frontend Development

**Prompt pattern:** I specified the UI framework (React + Vite + TypeScript + TailwindCSS + Radix UI primitives + Framer Motion) and described the desired look and feel — premium dark theme inspired by Linear/Vercel/GitHub.

**Key prompts:**

1. *"Create a Dashboard page with 6 animated stats cards (total URLs, healthy, failed, avg response time, total checks, last scan), a URL table with search/sort/status badges/health percentage bars, and a slide-out health history panel with a response time sparkline."*

2. *"Build an Add/Edit URL dialog using Radix Dialog and React Hook Form with URL validation, duplicate error handling via toast notifications, and animated transitions."*

3. *"Implement auto-refresh using React Query's refetchInterval (10 seconds) with a visual 'Checking...' indicator in the header, plus a live clock."*

### Infrastructure

**Prompt:** *"Create Docker setup with a multi-stage frontend build (Node → Nginx), Python backend container, and docker-compose.yml that runs everything with a single `docker compose up` command."*

---

## Course Corrections

### 1. Alembic Over-Engineering

**What happened:** The AI initially included a full Alembic migration setup (alembic.ini, env.py, initial migration script) for the database schema.

**The problem:** For a strict MVP with SQLite and only 2 tables, Alembic adds unnecessary complexity. SQLAlchemy's `Base.metadata.create_all()` handles table creation automatically on startup — simpler, fewer files, zero configuration overhead.

**Resolution:** Removed all Alembic files and the `alembic` dependency from `requirements.txt`. Tables are now created automatically when the application starts via the `init_db()` function in the FastAPI lifespan handler.

**Lesson:** AI assistants tend to include "best practice" tooling even when the scope doesn't warrant it. For an MVP, the simplest correct solution wins.

### 2. Pydantic HttpUrl Validation

**What happened:** Early iterations used `HttpUrl` directly as a field type in Pydantic schemas, which changes the URL string into a Pydantic `Url` object internally, causing serialization issues when passing to httpx and SQLAlchemy.

**Resolution:** Changed to using `str` field type with a `@field_validator` that calls `HttpUrl()` for validation only, keeping the actual value as a plain string. This avoids type mismatches downstream while still validating URL format.

### 3. SQLAlchemy Async Session Handling

**What happened:** Initial code used `session.close()` without proper async context management, which could leave sessions open on exceptions.

**Resolution:** Used `async with async_session_factory() as session` pattern with a `try/finally` block in the FastAPI dependency to guarantee session cleanup. The monitoring service also uses its own `async with` session block since it runs outside the request lifecycle.

### 4. Docker Nginx Proxy Configuration

**What happened:** The first Dockerfile.frontend attempted to use Vite's dev server in production, which is not suitable for containerized deployments.

**Resolution:** Switched to a multi-stage build: Node.js builds the static assets, then Nginx serves them with a reverse proxy configuration that forwards `/api/*` requests to the backend container. This is the standard production pattern for SPAs.

---

## Code Attribution

AI was used as a development assistant to accelerate implementation, debugging, and documentation. I was responsible for selecting the architecture, refining prompts, reviewing the generated code, integrating the backend and frontend, testing the application end-to-end, and making manual changes wherever the generated solution did not meet the assignment requirements or MVP scope.

1. **Architecture decisions** — Choosing the tech stack, folder structure, and component boundaries
2. **Requirement translation** — Converting the assignment PDF into specific, actionable prompts
3. **Quality review** — Reviewing generated code for correctness, removing unnecessary complexity
4. **Integration** — Ensuring all components work together end-to-end
5. **Course corrections** — Identifying and fixing issues where the AI proposed suboptimal solutions

### What Was Generated vs. Manual

| Component | AI Assistance | My Contribution |
|-----------|---------------|-----------------|
| Backend | Generated initial structure and CRUD APIs | Reviewed logic, integrated modules, refined error handling and scheduler behavior |
| Frontend | Generated UI components and layouts | Customized UI, integrated APIs, validated dashboard functionality |
| Database | Generated models and schemas | Verified relationships and data flow |
| Docker | Generated initial Docker configuration | Verified, corrected, and tested container setup |
| Documentation | Generated initial drafts | Edited, organized, and completed project-specific details |

Throughout development, I iteratively refined prompts based on the generated output, validated the implementation through manual testing, and resolved integration issues between the frontend, backend, scheduler, and Docker environment to ensure the final application met all assignment requirements.

---

## Lessons Learned

1. **AI excels at boilerplate** — CRUD routes, Pydantic schemas, React Query hooks, Docker configs — these are generated quickly and accurately.

2. **AI over-engineers by default** — It will add Alembic, Redis, Celery, and other tools unless explicitly told "strict MVP." Being directive about scope is critical.

3. **Error handling needs human review** — AI-generated error handling often misses edge cases (DNS failures vs. connection refused vs. SSL errors). Testing with real broken URLs revealed gaps.

4. **TypeScript types should mirror backend schemas exactly** — Having the AI generate both Pydantic schemas and TypeScript interfaces from the same prompt ensures they stay in sync.

5. **Docker networking requires explicit attention** — The AI initially didn't account for container-to-container communication (frontend nginx proxying to backend). Specifying the Docker Compose service name as the proxy target (`http://backend:8000`) was a manual correction.

---

## Prompt Refinement Example

**First attempt (too vague):**
> "Build an uptime monitor."

**Final prompt (specific and scoped):**
> "Build a FastAPI backend with async SQLAlchemy/SQLite, Pydantic v2 schemas, APScheduler running every 60s, httpx async health checks storing immutable history. Frontend: React + Vite + TypeScript + TailwindCSS dark theme + Radix UI + Framer Motion + React Query (10s auto-refresh). Docker Compose with nginx reverse proxy. Strict MVP — no Redis, no Kafka, no microservices."

Using more specific, well-scoped prompts produced implementations that were much closer to the required MVP, reducing the amount of rework needed while keeping the solution aligned with the assignment requirements.
