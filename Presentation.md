---
marp: true
theme: default
backgroundColor: #0f172a
color: #e2e8f0
paginate: true
header: " "
footer: "PROACT System Presentation | DOST-1 ITSM Unit"
style: |
  section {
    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
    background: linear-gradient(135deg, #1e1b4b 0%, #450a0a 100%);
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 50px;
    border: 4px solid rgba(220, 38, 38, 0.3);
  }
  section::after {
    content: '';
    position: absolute;
    bottom: 20px;
    right: 20px;
    width: 100px;
    height: 100px;
    background: radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%);
    z-index: -1;
  }
  h1 {
    color: #ef4444;
    font-size: 2.5rem;
    text-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
    border-bottom: 2px solid #8b5cf6;
    display: inline-block;
    padding-bottom: 10px;
    margin-bottom: 30px;
  }
  h2 {
    color: #a78bfa;
    font-size: 1.8rem;
    margin-top: 0;
  }
  h3 {
    color: #fca5a5;
    font-size: 1.2rem;
  }
  ul {
    list-style-type: none;
    padding-left: 0;
  }
  li {
    margin-bottom: 15px;
    padding-left: 30px;
    position: relative;
  }
  li::before {
    content: '◈';
    position: absolute;
    left: 0;
    color: #ef4444;
    font-weight: bold;
  }
  strong {
    color: #f5d0fe;
    text-decoration: underline dotted #ef4444;
  }
  footer {
    color: rgba(167, 139, 250, 0.6);
    font-size: 0.7rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 2px;
  }
  .title-slide {
    text-align: center;
    align-items: center;
  }
  .title-slide h1 {
    font-size: 4rem;
    border-bottom: 4px solid #ef4444;
  }
  .glass {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    padding: 20px;
    border-radius: 15px;
    border: 1px solid rgba(139, 92, 246, 0.3);
  }
---

<!-- _class: title-slide -->
# **PROACT**
### Proactive Reporting, Operation, Analysis, Communication and Tracking System

<div class="glass">
  <strong>A Multi-Level Disaster Situational Reporting Platform</strong><br>
  Presented by: DOST OJT Team (Angel, Luis, Ivan, Micko)<br>
  Date: June 17, 2026
</div>

---

## **1. Project Overview**
### Transition from SIREN to PROACT

- **Legacy System:** SIREN (Situation Intelligence Network)
- **The Vision:** Overhaul the architecture to improve **workflow efficiency** and **data security**.
- **Domain:** [proact.dost1.ph](https://proact.dost1.ph)
- **Primary Goal:** Streamline collaboration between LGUs, Provincial, and Regional offices during disasters.

---

## **2. System Architecture (Part 1)**
### Modern Tech Stack

- **Frontend:** React 19 (Vite) + Context API
- **Real-Time:** Persistent Socket.IO WebSocket layer
- **Backend:** Node.js/Express (High Performance)
- **Database:** PostgreSQL (Normalized, 15+ sub-tables)

---

## **2. System Architecture (Part 2)**
### Robust Infrastructure

- **Infrastructure:** Docker & Docker Compose
- **Web Server:** Nginx Reverse Proxy
- **AI Engine:** Llama 3 (via Groq) / Gemini 2.0 Integration
- **File Handling:** Secure PDF generation and storage

---

## **3. Key Capabilities (Part 1)**
### Centralized Management

- **Event Tracking:** Real-time monitoring of typhoon, flood, and earthquake events.
- **Hierarchical Scoping:** Role-based data entry (LGU → Provincial → Regional).
- **Intelligent Auto-Clone:** Smart inheritance of historical report data between SitReps.

---

## **3. Key Capabilities (Part 2)**
### Advanced Analysis

- **Interactive GIS Map:** Real-time visualization of monitoring stations and assets.
- **AI Summarizer:** Automated executive briefs from complex raw metrics.
- **Approval Pipeline:** Formal government-standard workflow with digital audit trails.

---

## **4. The SitRep Workflow**
### Data Lifecycle & Consolidation

1. **LGU Input:** Drafts raw local data for their specific city.
2. **Submission:** LGU uploads signed PDF → **Sent to Province**.
3. **Consolidation:** Province reviews, aggregates, and verifies.
4. **Approval:** Provincial Approver signs off → Data becomes **Regional-visible**.
5. **Visibility:** Regional Dashboard updates instantly with verified data.

---

## **5. NEW: Interactive GIS Map**
### Geospatial Asset Visualization

- **Leaflet Integration:** High-performance geospatial plotting.
- **Station Inventory:** Full tracking of ARG, WLMS, and AWS units.
- **Dynamic Filters:** Rapidly locate stations via Province/LGU toggles.
- **Draggable Modals:** Interactive equipment detail windows for field updates.

---

## **6. Advanced Inventory Layout**
### Compact Space Management

- **Horizontal Grid:** Efficient **3-3-1 pattern** for equipment types.
- **UI Optimization:** Eliminated vertical scrolling in popups and forms.
- **Editable Specs:** Directly update Brand, Model, and Contacts from the map.
- **Validation:** 11-digit PH mobile number formatting.

---

## **7. Intelligent Auto-Clone**
### Consistency Without Friction

- **Automatic Inheritance:** Clones all category data from the latest approved report.
- **Strict Isolation:** LGUs clone only city data; Provinces clone provincial consolidated sets.
- **Historical Continuity:** Maintains event history across SN1, SN2, and SN3 cycles.

---

## **8. Mobile-First Optimization**
### Reporting Anywhere

- **Hamburger Menu:** Fluid navigation for mobile field officers.
- **Adaptive Grids:** Layouts that stack vertically on small screens.
- **Table Accessibility:** Native horizontal scrolling for dense data views.
- **LDRRMO Ready:** Designed for rugged field use during active inspections.

---

## **9. AI-Powered Analysis**
### Data into Intelligence

- **Executive Summarizer:** Synthesizes metrics into readable narrative briefs.
- **Flexible AI Core:** Toggle between Llama 3 and Google Gemini 2.0.
- **Summary History:** Dedicated DB for tracking and comparing AI generations.

---

## **10. Data Integrity & Excel Tools**
### The Offline Bridge

- **ExcelJS Power:** Native `.xlsx` template generation with dropdowns.
- **Validation:** Province/City/Barangay hardcoded data rules.
- **Dependent Lists:** Auto-filtering Barangays based on City selection.
- **DROMIC standard:** One-click import for evacuation data.

---

## **11. Technical Improvements**
### Refined Backend

- **Partial Update Support:** Surgical API updates for specific data fields.
- **Security Audit:** Fixed password bypass and tightened RBAC filters.
- **Real-Time Sync:** Instant broadcasts for every database mutation.
- **Optimized Transactions:** High-speed cloning across 15+ categories.

---

## **12. Development Timeline (Week 1-2)**
### The Journey Begins

- **Week 1:** Rebranding to PROACT, Dashboard Interactivity, SOLIDO Link.
- **Week 2:** Weather API, AI Summarizer, Vercel/Docker Deployment.
- **Week 2 (Cont.):** PDF Engine Fixes, AI Summary History Schema.

---

## **12. Development Timeline (Week 3)**
### The Final Push

- **Security:** Deep audit and password logic stabilization.
- **GIS Mapping:** Leaflet Integration & Station Inventories.
- **UI Overhaul:** Draggable Modals, 3-3-1 Grid, Mobile UI.
- **Data Tools:** ExcelJS Dependent Dropdowns & Partial Updates.

---

## **13. Future Roadmap**
### The Evolution of PROACT

- **Selective Cloning:** Category-level carry-over options.
- **GIS Incidents Layer:** Plotting landslides and floods in real-time.
- **AI Predictions:** Predictive trends based on historical data.
- **Scheduled Sync:** Automated reporting cycles for peak events.

---

## **14. Conclusion**
### Ready for Resilience

- **Status:** Production-ready at [proact.dost1.ph](https://proact.dost1.ph).
- **Impact:** Massive reduction in consolidation time and human error.
- **Resilience:** Powering the future of RDRRMC Region I reporting.

---

<!-- _class: title-slide -->
# **Q&A**
**PROACT System Hand-over**
*Thank you for your attention!*
