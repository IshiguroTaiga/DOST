# Update LOGS: PROACT System Development

## Week 1: Introduction and Initial UI Changes

### Day 1 (June 1)
- Oriented with the Situation Intelligence & Rapid Emergency Network (SIREN) project.
- Began rebranding the system to PROACT (Proactive Reporting, Operation, Analysis, Communication and Tracking System).
- Implemented clickable category buttons on the dashboard overview.

### Day 2 (June 2)
- Fixed bugs in the event assignment interface to allow "apply to all" functionality.
- Developed a pop-up modal to display details for "Affected Persons".
- Integrated a redirection link to the SOLIDO DRRM Knowledge Hub in the sidebar.
- Log in page BG to WhiteSmoke.

### Day 3 (June 3)
- Familiarized with the project's file structure (React/JavaScript stack).
- Implemented UI refinements to the dashboard header as instructed.
- Finalized PROACT logo.

### Day 4 (June 4)
- Sidebar: Added Hazard Information which includes three external resources: Solido, PAGASA, and PHIVOLCS.
- Fixed dash-hero-meta and dash-hero-amount overlapping.

## Week 2: Backend Logic and System Optimization

### Day 5 (June 8)
- Integrated the Browser Geolocation API (wttr) into `Dashboard.jsx` for real-time local weather tracking.
- Simplified user management by removing redundant "Approver" roles.
- Implemented a self-approval workflow for LGUs and Provinces.
- Add Report: fixed classification and summary details not displaying.
- Added weatherClassification.json.
- Assistance Value: not properly displaying 1M, 1B currency
- Added handleScrollToBottom for Damaged Houses

### Day 6 (June 9)
- Developed an AI report summary generator that allows users to switch between models like Groq (Llama 3) and Google Gemini using custom API keys.
- dashboard.css == changed display: flex; to display: grid; at dash-hero-meta

### Day 7 (June 10)
- Conducted testing on a Vercel deployment.
- Resolved critical bugs related to user login fetching and Super Admin privileges during the initial deployment to `proact.dost1.ph`.

### Day 8 (June 11)
- Worked remotely to fix PDF preview bugs.
- Created a new database schema to store a history of AI-generated executive summaries.
- Affected Person: Barchart Vertical turned to Barchart Horizontal and Added Filtering.
- Suspension: Suspension by City changed to Suspension by LGU.

## Week 3: Final Features and Debugging

### Day 9 (June 15)
- Fixed two major bugs in situational reporting: isolated data leaking between provinces and standardized the global SitRep numbering sequence.
- Affected Person: Clicking the city/municipality displays their respective barangays (Accordion).
- Affected Person Chart: Added Pop-up modal, if the user click the chart of the specific city/municipality it will show the barangays chart too.

### Day 10 (June 16)
- Conducted a final security audit.
- Fixed a password bypass flaw in the "Edit User" modal.
- Fixed temperature range gaps in `weatherClassifications.json` to ensure consistent labeling (e.g., exactly 30°C).
- Implemented "Mandatory Report Categories" (Red Dots) feature in `Dashboard.jsx` and `AddReport.jsx`.
- Reorganized Help Manual categories and added a "Developer Profile" section.
- Added iframe/video embed support to the manual for developer showcases.
- Completed the Update Summary and Code Review documentation for final system hand-over.
- Hazard Information: when the sidebar is collapsed, Solido, PAGASA, and PHIVOLCS are not showing FIXED.
- Weather Icon to Black Colors.
- Fixed Affected Person showing wrong numbers.

### Day 11 (June 16-17)
- Integrated **ExcelJS** to replace standard CSV/XLSX exports in templates.
- Added **Native Data Validation (Dropdowns)** for City/Municipality and Barangay in Excel files.
- Implemented **Dependent Dropdowns**: Selecting a City in Excel automatically filters available Barangays via `INDIRECT` formulas.
- Implemented a **Mobile-First Responsive UI** including a Hamburger Menu and optimized grids for phone/tablet users.

### Day 12 (June 17)
- Developed the **Interactive GIS Map** for monitoring and warning stations.
- Refactored Equipment Inventory to a **Horizontal 3-3-1 Grid Layout** for improved space efficiency.
- Implemented **Draggable & Editable Detail Modals** for real-time equipment specification updates.
- Refactored backend `PATCH` routes for stations to support **Partial Updates** and surgical data modification.
- Added numeric validation and Philippine mobile number formatting (11 digits) to contact fields.
- Changed the Proact Logo. Proact Logo now has 1RDRRMC Logo in it.