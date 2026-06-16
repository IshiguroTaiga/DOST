# PROACT: Overall Project Summary & System Documentation

**System Name:** PROACT (Proactive Reporting, Operation, Analysis, Communication and Tracking System)  
**Formerly:** SIREN (Situation Intelligence & Rapid Emergency Network)  
**Domain:** https://proact.dost1.ph  
**Version:** 1.2.1 (June 2026)

---

## 1. Project Overview

PROACT is a multi-level disaster situational reporting platform designed for the RDRRMC (Regional Disaster Risk Reduction and Management Council). It facilitates real-time collaboration between Local Government Units (LGUs), Provincial Offices, and Regional Offices during disaster events. The system focuses on hierarchical data collection, automated consolidation, and formal approval workflows to streamline emergency response and oversight.

### Key Capabilities:
- **Disaster Event Management:** Centralized creation and tracking of disaster events (typhoons, floods, etc.).
- **Hierarchical Reporting:** Role-based data entry (LGU → Provincial → Regional).
- **Automated Consolidation:** Real-time aggregation of local data into provincial and regional views.
- **Smart Data Inheritance:** Intelligent auto-cloning of historical report data.
- **Advanced Excel Templates:** Native Excel dropdowns and dependent location selection using ExcelJS.
- **Mobile-Responsive Design:** Full support for smartphones and tablets with a hamburger navigation menu.
- **AI-Powered Analysis:** Automated executive summary generation using LLMs.
- **Formal Approval Workflow:** Document-based approval pipeline mimicking government workflows.

---

## 2. System Architecture

The PROACT system is built on a modern, containerized stack optimized for real-time performance and reliability.

### 2.1 Technical Stack:
- **Frontend:** React 19 (Vite), Context API, Socket.io-client, ExcelJS.
- **Backend:** Node.js/Express, Socket.IO (for real-time updates).
- **Database:** PostgreSQL (normalized schema with 15+ specialized sub-tables).
- **Infrastructure:** Docker & Docker Compose, Nginx (Reverse Proxy).
- **AI Integration:** OpenAI API for report summarization.

### 2.2 Deployment Model:
```
Browser (React SPA)
       │
   Nginx (Reverse Proxy)
   ├── /api/*       → Express Backend (Node.js)
   ├── /socket.io/  → Real-time WebSocket Layer
   └── /*           → Static SPA Files
       │
  PostgreSQL Database (Persistent Storage)
```

---

## 3. Core Features & Workflows

### 3.1 Situational Report (SitRep) Workflow
The SitRep lifecycle follows a strict hierarchical path:
1.  **Draft:** LGUs input raw data for their localities.
2.  **Sent:** LGUs upload signed PDFs and submit to the Province.
3.  **Pending Approval:** Provincial users review LGU data, consolidate it, and prepare provincial-level reports.
4.  **Approved:** Once a provincial approver signs off, the data becomes visible to the Regional/Super Admin dashboards.

### 3.2 Auto-Clone Feature
To reduce friction during rapid disaster cycles, PROACT features an **Intelligent Auto-Clone** mechanism:
- **Automatic Detection:** The system detects the latest previous SitRep for an event.
- **Hierarchy-Aware Filtering:** 
    - **LGUs:** Clone only their city's data.
    - **Provincial:** Clone all data within their province.
    - **Regional:** Clone the entire regional dataset.
- **Transactional Integrity:** Ensures data consistency across all 15 category sub-tables during the clone process.

### 3.3 AI-Powered Reporting
- **Executive Summarizer:** Converts raw metrics (evacuation counts, damage costs, etc.) into readable narrative summaries.
- **Model Flexibility:** Admins can switch between different AI models and manage API keys via the settings interface.
- **Summary History:** Tracks all generated summaries for historical reference.

### 3.4 Real-Time Synchronization
- **WebSockets:** Uses Socket.IO to push updates instantly. When an LGU saves data, Provincial and Regional views update without a page refresh.
- **Global Notifications:** Real-time alerts for event deployments, SitRep assignments, and approval status changes.

---

## 4. Database Schema & Data Modeling

The database is designed with high normalization to support complex disaster metrics.

### 4.1 Core Tables:
- **`users`:** Role-based access (Super Admin, Regional, Provincial, LGU).
- **`events`:** Root entity for disasters, tracking deployment and alert signals.
- **`situational_reports`:** Snapshots of data at specific time points.
- **`event_signals`:** Typhoon warning signals per province/city/barangay.
- **`event_deployments`:** Tracks which LGUs are active for a specific event.

### 4.2 Report Categories (Sub-tables):
Data is split into 15+ specialized tables, all linked to a SitRep ID:
1.  **Affected Population:** Demographic data (families, persons, ECs).
2.  **Related Incidents:** Floods, landslides, storm surges.
3.  **Agriculture/Infrastructure Damage:** Costs and units damaged.
4.  **Power/Water/Communication:** Service interruption and restoration status.
5.  **Roads & Bridges:** Passability and damage reports.
6.  **Suspensions:** Class and work suspension tracking.
7.  **Assistance:** Aid provided by LGUs and agencies.

---

## 5. Recent System Updates (June 2026)

- **Rebranding:** Full transition from SIREN to PROACT with updated UI/UX.
- **LGU Autonomy:** LGUs can now independently create and submit reports for review.
- **Simplified Roles:** Removed redundant "Approver" roles in favor of a streamlined submission/signature flow.
- **Weather Integration:** Real-time local weather updates via browser Geolocation API with Super Admin overrides.
- **Security Enhancements:** Strengthened RBAC (Role-Based Access Control) and rigorous password verification logic.
- **DROMIC Integration:** Template downloads and Excel import functionality for streamlined data entry.

---

## 6. Future Enhancements & Roadmap

1.  **Selective Cloning:** Allow users to choose specific categories to carry over.
2.  **Smart Suggestions:** AI-driven recommendations based on historical data trends.
3.  **Scheduled Auto-Reports:** Automatic SitRep generation at fixed intervals (e.g., every 6 hours).
4.  **Mobile-First Reporting:** Optimized interface for field-level data entry.
5.  **Advanced GIS Integration:** Real-time mapping of incidents and damage reports.

---

**Last Updated:** June 16, 2026  
**Maintained By:** DOST ITSM Unit Development Team
