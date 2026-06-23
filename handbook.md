# PROACT Project Handbook
*Proactive Reporting, Operation, Analysis, Communication and Tracking System*

---

## 1. What is PROACT?
**PROACT** (formerly SIREN - Situation Intelligence & Rapid Emergency Network) is an advanced, automated web-based disaster risk reduction and management (DRRM) system specifically tailored for the Department of Science and Technology (DOST) Region 1. 

The platform serves as a unified command and reporting console connecting Local Government Units (LGUs), Provincial DRRM offices, and the Regional Disaster Risk Reduction and Management Council (RDRRMC). It facilitates real-time data entry, verification, consolidation, and visualization of disaster incidents, telemetry stations, and hazard forecasts.

---

## 2. Why was it Developed?
During disaster events (such as typhoons, earthquakes, and floods), time is the most critical resource. Traditionally, disaster reporting has suffered from significant friction:
* **Delayed Response:** Data takes hours or days to consolidate from the barangay level up to the region.
* **Information Silos:** LGUs, provinces, and regional headquarters maintain separate logs, leading to conflicting casualty, displacement, and damage statistics.
* **Human Error:** Manual transcription of damage assessments in spreadsheets often leads to broken formulas, missing records, or duplicate entries.
* **Complex Compliance:** Aligning reports with national structures (like DROMIC) requires tedious formatting under extreme time constraints.

PROACT was developed to eliminate these bottlenecks by digitizing the communication pipeline, ensuring there is a **single source of truth** during crisis operations.

---

## 3. What the System is Addressing
PROACT directly addresses the inefficiencies of traditional disaster management workflows:
* **Slow Reporting Cycles:** Accelerates paper/email-based updates to instant digital submissions.
* **Data Overlap and Inconsistencies:** Implements strict validation and automated consolidation rules.
* **Data Leakage and Security Concerns:** Restricts LGU users to their own jurisdictions while providing regional authorities with consolidated views.
* **Repetitive Administrative Work:** Features automated data propagation (cloning) from previous reporting cycles (SitReps) to minimize manual re-entry.

---

## 4. Benefits & Solutions
* **Time Efficiency:** Accelerates SitRep creation from hours to minutes via auto-cloning and automatic consolidation.
* **Data Integrity:** Excel exports and template uploads are restricted and validated on the backend.
* **AI-Assisted Executive Briefings:** Instantly translates complex tabular data into concise, narrative summaries using LLMs (Google Gemini or Groq Llama 3) for quick decision-making.
* **Geospatial Visibility:** An interactive GIS map tracks telemetry stations (AWS/ARG/WLMS) and visualizes live weather data across the region.
* **Immediate Alerts:** Sends global system notifications and email alerts directly to affected provinces when new events are deployed.

---

## 5. Differentiation: Manual Process vs. PROACT

| Aspect | Manual Process | PROACT |
| :--- | :--- | :--- |
| **Data Submission** | LGUs fill out Excel files and email them to the province. | Direct digital inputs on the dashboard with draft/send workflow. |
| **Consolidation** | Provincial staff manually copy-paste data from multiple LGU spreadsheets. | System aggregates LGU inputs automatically into a single view. |
| **Reporting History** | Staff manually type data from SitRep No. 1 into SitRep No. 2. | **Auto-Cloning** carries forward previous entries with one click. |
| **Access Control** | Anyone with the file can edit any LGU's entries. | Role-based boundaries (LGU admins are locked to their own towns). |
| **Weather Tracking** | Checking external weather apps manually. | Live local weather via Browser Geolocation API on the dashboard. |
| **Briefings** | Writing summaries manually after looking at raw numbers. | AI-generated summaries generated instantly. |

---

## 6. Uniqueness & System Comparison
Unlike generic disaster tracking apps or standard spreadsheets, PROACT is a **tailored, first-of-its-kind DRRM platform** designed specifically for the administrative hierarchy of the Philippines. 
It respects the distinct operational scopes of:
1. **LGUs (Municipalities/Cities):** Field reporting units.
2. **Provinces:** Verification and consolidation units.
3. **Region:** Strategic oversight and resource mobilization command.

Rather than replacing existing systems, PROACT sits on top of them as an integration layer, connecting weather telemetry (Davis WeatherLink), manual reporting, and AI summarization in a secure database structure.

---

## 7. Alignment with the National Science & Technology Plan (NSDB)
PROACT aligns with the core objectives of the **National Science and Technology Plan (NSTP) / National Science Development Board (NSDB)** guidelines on disaster resilience and climate adaptation:
* **Science-Based Decision Making:** Integrates real-time weather stations and environmental sensors to provide data-driven warnings.
* **Localization of Technology:** Deploys accessible digital tools to local community leaders (LGUs) to build grass-roots resilience.
* **Information & Communication Infrastructure:** Standardizes communication formats across local and national bodies to ensure seamless interoperability.

---

## 8. Core Features
* **Active Event Deployment:** Regional admins can declare active alerts (Red, Blue, White) and define which provinces are inside the warning scope.
* **Situational Reports (SitReps):** Track 15 distinct categories of information:
  1. Affected Population (families/persons inside/outside evacuation centers)
  2. Damaged Houses (totally/partially damaged)
  3. Agriculture Damage (farmers, area, production loss value)
  4. Infrastructure Damage (bridges, school buildings, health centers)
  5. Casualties (dead, injured, missing)
  6. Roads and Bridges Status (passable/non-passable)
  7. Power Supply (restored/interrupted)
  8. Water Supply
  9. Communication Lines
  10. Class Suspensions
  11. Work Suspensions
  12. Pre-emptive Evacuation numbers
  13. Declarations of State of Calamity
  14. Assistance Provided (by LGUs, NGOs, DSWD)
  15. Related Incidents (landslides, storm surges)
* **GIS Map Console:** Interactive Leaflet map displaying telemetry stations with equipment specifications, inventory status, and live weather telemetry feeds.
* **Excel Data Exchange:** Direct spreadsheet upload with validation checking and customized export formats using ExcelJS.
* **Signatory Workflow:** Digital attachment of official signatories and signed PDF report uploads.

---

## 9. Operational Process Flow
1. **Regional Admin** deploys an Event (Notifications & Emails sent).
2. **LGU Admin** creates a SitRep Draft, updates data, and clicks **Submit to Province**.
3. **Provincial Admin** reviews LGU data, consolidation occurs, and clicks **Approve** (or rejects with remarks).
4. **Regional Dashboard** updates automatically with verified consolidated data.
5. **AI Summarizer** processes data to produce briefing executive summaries.
