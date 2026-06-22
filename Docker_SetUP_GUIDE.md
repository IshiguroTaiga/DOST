# PROACT System - Docker Deployment Guide

This guide explains how to set up, run, and deploy the PROACT (Proactive Reporting, Operation, Analysis, Communication and Tracking) System using Docker.

---

## 1. Prerequisites
* **Docker Engine** & **Docker Compose** (v2.0+ recommended)
* A PostgreSQL database running on your host machine or external server (listening on Port `5434` by default, or as configured).

---

## 2. Environment Configuration
The system requires configuration files containing connection details and API keys.

### A. Backend Configuration (`backend/.env`)
Create a file at [backend/.env](file:///C:/Users/TUF/OneDrive/Desktop/DOST/PROACT/backend/.env):
```env
PORT=4000
DB_HOST=host.docker.internal
DB_PORT=5434
DB_NAME=proact
DB_USER=proact_user
DB_PASSWORD=proact_secret
JWT_SECRET=your_secure_jwt_secret_key
VITE_API_URL=http://localhost:4000/api

# Optional: Email SMTP SMTP credentials (fallback if not configured in Settings Dashboard)
OUTLOOK_EMAIL=your_email@outlook.com
OUTLOOK_PASSWORD=your_outlook_app_password
OUTLOOK_SENDER_NAME="DOST Region I DRRMO"
CLIENT_URL=https://proact.dost1.ph

# Optional: AI API keys (fallback if not configured in Settings Dashboard)
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_GROQ_API_KEY=your_groq_api_key
```
> **Linux Users Note:** If your database is running on the host machine and you are on Linux, `host.docker.internal` might not resolve by default. Set `DB_HOST` to your actual machine's local IP address or configure `extra_hosts` in the [docker-compose.yml](file:///C:/Users/TUF/OneDrive/Desktop/DOST/PROACT/docker-compose.yml).

### B. Frontend Configuration (`.env` in Root)
Create a file in the root directory named `.env`:
```env
VITE_API_URL=https://proact.dost1.ph/api
```
*(For local development, set this to `http://localhost:4000/api`)*

---

## 3. Pulling & Deploying Updates

Whenever new code is pushed to the repository or you make configuration adjustments, follow this sequence on your deployment host:

### 1. Pull the Latest Code
```bash
git pull
```

### 2. Verify Database Schema (For Existing Databases)
The PROACT backend automatically checks and runs basic schema verifications (such as creating the `lgu_submissions`, `ai_summaries`, and `monitoring_stations` tables) upon start. 

**However**, if you are upgrading an existing database (retaining older data) that does not yet have columns for review remarks or city tracking in `report_rows`, run the following SQL queries in your database management tool (e.g. pgAdmin, DBeaver, or `psql`):

```sql
-- Add city column to report rows
ALTER TABLE report_rows ADD COLUMN IF NOT EXISTS city TEXT DEFAULT '';

-- Add review remarks column to report rows
ALTER TABLE report_rows ADD COLUMN IF NOT EXISTS remarks TEXT DEFAULT '';
```

*Alternatively, run the migrations inside the container:*
```bash
# Add city column
docker exec -it proact_backend node migrate_city.cjs

# Add remarks column (if node is installed on the host)
node migrate_remarks.cjs
```

### 3. Rebuild and Start Containers
Rebuild the frontend static bundle and start the services:
```bash
docker compose up -d --build
```
*(If your host uses an older Docker installation, use `docker-compose up -d --build` instead).*

### 4. Verify Container Status
Check that both frontend and backend containers are active:
```bash
docker compose ps
```

---

## 4. Port and URL Mapping
Once the containers are running, they expose:
* **Frontend (Website):** [http://localhost:4001](http://localhost:4001) (mapped to container port 80 running Nginx)
* **Backend (API):** [http://localhost:4000/api](http://localhost:4000/api) (mapped to container port 4000 running Node.js)

---

## 5. Useful Administrative Commands

| Action | Command |
| :--- | :--- |
| **Check Backend Logs** | `docker logs proact_backend --tail 50 -f` |
| **Check Frontend Logs** | `docker logs proact_frontend --tail 50 -f` |
| **Stop Containers** | `docker compose down` |
| **Force Rebuild & Run** | `docker compose up -d --build` |
| **Run Interactive Shell (Backend)** | `docker exec -it proact_backend sh` |
| **Restart Backend Container** | `docker restart proact_backend` |

---

## 6. Common Troubleshooting

### Database Connection Refused
If the backend container fails to start or log database connection errors:
1. Confirm that PostgreSQL is running on the host machine.
2. Verify that PostgreSQL is configured to listen on port `5434` (or whatever matches `DB_PORT`).
3. Ensure the database user has correct permission grants and exists.

### Missing Data/Mismatched Environment
If API calls are pointing to the wrong endpoint or fallback settings are incorrect:
1. Verify that your root `.env` has the correct `VITE_API_URL` before compiling.
2. Remember that Docker cache can sometimes reuse old arguments. Run a clean rebuild using `docker compose build --no-cache` to force environmental updates to compile properly.
