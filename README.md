# PROACT System (Proactive Reporting, Operation, Analysis, Communication and Tracking System)

PROACT is a comprehensive web-based platform designed for disaster risk reduction and management (DRRM) operations in Region I, Philippines. It automates situational report creation, review workflows, real-time weather monitoring, warning station tracking, and AI-powered executive summary generation.

---

## 🚀 Getting Started

The project is structured into a React/Vite frontend and a Node.js/Express backend, both containerized via Docker.

### Key Guides
* **Docker Deployment:** Check the [Docker Deployment Guide](file:///C:/Users/TUF/OneDrive/Desktop/DOST/PROACT/Docker_SetUP_GUIDE.md) to set up staging/production environments.
* **System Architecture:** See the [System Documentation](file:///C:/Users/TUF/OneDrive/Desktop/DOST/PROACT/SYSTEM_DOCUMENTATION.md) for data flows, schemas, and routes.
* **Notifications & Mail Setup:** See the [SMTP Setup Guide](file:///C:/Users/TUF/OneDrive/Desktop/DOST/PROACT/BREVO_SETUP.md) to configure automatic email notifications.

---

## 🛠️ Tech Stack
* **Frontend:** React 19, Vite, Leaflet (GIS Map), ExcelJS (Import/Export templates), Recharts, Tailwind/Vanilla CSS.
* **Backend:** Node.js, Express, Socket.io (real-time logs/alerts), Nodemailer.
* **Database:** PostgreSQL.
* **Containers:** Docker, Nginx (frontend serve & proxy).

---

## 💻 Running Locally (Development Mode)

### Prerequisites
1. **Node.js** (v20+ recommended)
2. **PostgreSQL** running locally on port `5434` (with database schema from [init.sql](file:///C:/Users/TUF/OneDrive/Desktop/DOST/PROACT/database/init.sql)).

### 1. Set Up Backend
1. Go to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment settings and modify them as needed:
   Create a [backend/.env](file:///C:/Users/TUF/OneDrive/Desktop/DOST/PROACT/backend/.env) file:
   ```env
   PORT=4000
   DB_HOST=localhost
   DB_PORT=5434
   DB_NAME=proact
   DB_USER=postgres
   DB_PASSWORD=your_password
   JWT_SECRET=development_secret
   ```
4. Start backend in development mode:
   ```bash
   npm run dev
   ```

### 2. Set Up Frontend
1. Return to the root folder:
   ```bash
   cd ..
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a [.env](file:///C:/Users/TUF/OneDrive/Desktop/DOST/PROACT/.env) file in the root:
   ```env
   VITE_API_URL=http://localhost:4000/api
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open your browser to the local URL (usually `http://localhost:5173`).

---

## 🐳 Running Staging / Production (Docker Compose)

Rebuild and start the containers from the root directory:
```bash
docker compose up -d --build
```
This serves the frontend on port `4001` (proxied by Nginx) and the API on port `4000`.

---

## 🔑 Default Admin User
On startup, if the user list is empty, a default admin is seeded:
* **Email:** `admin@proact.local`
* **Password:** `Admin@1234`
*(Change this password immediately after logging in for safety).*
