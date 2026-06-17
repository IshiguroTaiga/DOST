---
marp: true
theme: gaia
backgroundColor: #f8fafc
color: #1e293b
paginate: true
header: "**PROACT System Presentation** | June 2026"
footer: "DOST-1 ITSM Unit"
style: |
  section {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }
  h1 { color: #2563eb; }
  h2 { color: #3b82f6; }
  footer { color: #64748b; font-size: 0.8rem; }
  header { color: #94a3b8; font-size: 0.8rem; }
---

# **PROACT**
### Proactive Reporting, Operation, Analysis, Communication and Tracking System

**A Multi-Level Disaster Situational Reporting Platform**
Presented by: DOST OJT Team (Angel, Luis, Ivan, Micko)
Date: June 17, 2026

---

## **1. Project Overview**
### Transition from SIREN to PROACT

- **Legacy System:** SIREN (Situation Intelligence & Rapid Emergency Network)
- **The Vision:** Overhaul the architecture to improve **workflow efficiency**, **data security**, and **real-time responsiveness**.
- **Domain:** [proact.dost1.ph](https://proact.dost1.ph)
- **Primary Goal:** Streamline collaboration between LGUs, Provincial, and Regional offices during disaster events.

---

## **2. System Architecture**
### Modern, Containerized Tech Stack

- **Frontend:** React 19 (Vite), Context API, Socket.io-client
- **Backend:** Node.js/Express, Socket.IO
- **Database:** PostgreSQL (Normalized schema, 15+ sub-tables)
- **Real-Time:** Persistent WebSocket layer for instant updates
- **Infrastructure:** Docker & Docker Compose, Nginx Reverse Proxy
- **AI Engine:** Integration with LLMs (Llama 3 via Groq / Gemini 2.0)

---

## **3. Key Capabilities**
### A Robust Reporting Ecosystem

- **Event Management:** Centralized tracking of typhoon, flood, and earthquake events.
- **Hierarchical Scoping:** Role-based data entry (LGU → Provincial → Regional).
- **Auto-Clone Feature:** Intelligent inheritance of historical report data.
- **Interactive GIS Map:** Real-time visualization of monitoring stations.
- **AI Analysis:** Automated executive summaries from raw metrics.
- **Approval Pipeline:** Formal GOVERNMENT-standard workflow (Draft → Sent → Approved).

---

## **4. The SitRep Workflow**
### Data Lifecycle & Consolidation

1. **LGU Input:** Drafts raw local data for their specific city/municipality.
2. **Submission:** LGU uploads signed PDF → **Sent to Province**.
3. **Consolidation:** Province reviews LGU data, aggregates totals, and verifies accuracy.
4. **Approval:** Provincial Approver signs off → Data becomes **Regional-visible**.
5. **Real-Time Dashboards:** Regional/Super Admin views verified, approved data instantly.

---

## **5. NEW: Interactive GIS Map**
### Geospatial Visualization of Assets

- **Leaflet Integration:** Real-time plotting of Monitoring & Warning Stations.
- **Station Inventory:** Complete tracking of ARG, WLMS, AWS, and more.
- **Province/LGU Filters:** Rapidly locate stations within specific geographic bounds.
- **Interactive Interactivity:** Draggable and editable equipment detail modals for field updates.

---

## **6. Advanced Inventory Layout**
### Compact & Efficient Space Management

- **Horizontal Grid:** Implementation of a **3-3-1 pattern** for equipment types.
- **UI Optimization:** Significant reduction in vertical scrolling in both map popups and entry forms.
- **Editable Specs:** Directly update Brand, Model, Specs, and Contact Numbers from the map view.
- **Validation:** 11-digit numeric formatting for Philippine mobile numbers.

---

## **7. Intelligent Auto-Clone Feature**
### Reducing Friction in Rapid Reporting

- **Automatic Inheritance:** System detects the latest approved report and clones all category data.
- **Strict Isolation:** LGUs clone ONLY their city data; Provinces clone ONLY their province's consolidation.
- **Consistency:** Ensures historical continuity across SN1, SN2, and SN3 without re-typing persistent data.

---

## **8. Mobile-First Optimization**
### Reporting Anytime, Anywhere

- **Hamburger Menu:** Responsive navigation for tablets and smartphones.
- **Adaptive Grids:** Dashboard cards and report forms stack vertically on small screens.
- **Horizontal Scrolling:** Native support for large data tables on mobile browsers.
- **Field-Ready:** Designed for ease of use by LDRRMOs during on-site inspections.

---

## **9. AI-Powered Analysis**
### Synthesizing Data into Intelligence

- **Executive Summarizer:** Converts complex metrics (evacuation counts, damage costs) into readable narrative briefs.
- **Flexible Models:** Support for Groq (Llama 3) and Google Gemini 2.0.
- **Summary History:** A dedicated database for tracking all AI-generated briefs for consistency and review.

---

## **10. Data Integrity & Excel Tools**
### Professional Offline-to-Online Bridge

- **ExcelJS Integration:** Native `.xlsx` template generation.
- **Data Validation:** Hardcoded dropdowns for Province/City/Barangay selection.
- **Dependent Lists:** Choosing a City automatically filters the available Barangays within the Excel file.
- **DROMIC Support:** Streamlined import of DROMIC-standard evacuation data.

---

## **11. Technical Improvements**
### A Refined Backend for Performance

- **Partial Update Support:** API refactored to handle surgical updates (e.g., editing one equipment's specs) without requiring full payloads.
- **Security Audit:** Resolved password bypass flaws and tightened RBAC (Role-Based Access Control).
- **Socket.io Sync:** Every database mutation triggers a broadcast to keep all users synchronized in real-time.

---

## **12. Development Timeline**
### The Journey from June 1 to June 17

- **Week 1:** Rebranding, Dashboard Interactivity, SOLIDO Integration.
- **Week 2:** Weather API, AI Summarizer, Vercel Deployment, PDF Engine Fixes.
- **Week 3:** 
  - **Security:** Audit & Fixes.
  - **GIS:** Leaflet Map & Station Inventories.
  - **Interactivity:** Draggable Modals & 3-3-1 Grid Layouts.
  - **Responsiveness:** Mobile UI Overhaul & ExcelJS Templates.

---

## **13. Future Roadmap**
### What's Next for PROACT?

- **Selective Cloning:** Allow users to pick specific categories to carry over.
- **GIS Incidents Layer:** Plot floods, landslides, and storm surges directly on the map.
- **AI Predictions:** Forecast trends based on historical disaster data.
- **Scheduled Reports:** Automated SitRep generation every 6 hours during peak crisis periods.

---

## **14. Conclusion**
### PROACT: Ready for Resilience

- **Status:** Production-ready at [proact.dost1.ph](https://proact.dost1.ph).
- **Impact:** Significant reduction in manual consolidation time and improved data accuracy for the RDRRMC.
- **Thank You!**

---
# **Q&A**
**PROACT: Proactive Reporting, Operation, Analysis, Communication and Tracking System**
