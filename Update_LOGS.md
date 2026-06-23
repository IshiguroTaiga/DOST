# Update LOGS: PROACT System Development

## Week 1: Introduction and Initial UI Changes

### **Day 1** (June 1)
- Oriented with the Situation Intelligence & Rapid Emergency Network (SIREN) project.
- Began rebranding the system to PROACT (Proactive Reporting, Operation, Analysis, Communication and Tracking System).
- Implemented clickable category buttons on the dashboard overview.

### **Day 2** (June 2)
- Fixed bugs in the event assignment interface to allow "apply to all" functionality.
- Developed a pop-up modal to display details for "Affected Persons".
- Integrated a redirection link to the SOLIDO DRRM Knowledge Hub in the sidebar.
- Log in page BG to WhiteSmoke.

### **Day 3** (June 3)
- Familiarized with the project's file structure (React/JavaScript stack).
- Implemented UI refinements to the dashboard header as instructed.
- Finalized PROACT logo.

### **Day 4** (June 4)
- Sidebar: Added Hazard Information which includes three external resources: Solido, PAGASA, and PHIVOLCS.
- Fixed dash-hero-meta and dash-hero-amount overlapping.

## Week 2: Backend Logic and System Optimization

### **Day 5** (June 8)
- Integrated the Browser Geolocation API (wttr) into `Dashboard.jsx` for real-time local weather tracking.
- Simplified user management by removing redundant "Approver" roles.
- Implemented a self-approval workflow for LGUs and Provinces.
- Add Report: fixed classification and summary details not displaying.
- Added weatherClassification.json.
- Assistance Value: not properly displaying 1M, 1B currency
- Added handleScrollToBottom for Damaged Houses

### **Day 6** (June 9)
- Developed an AI report summary generator that allows users to switch between models like Groq (Llama 3) and Google Gemini using custom API keys.
- dashboard.css == changed display: flex; to display: grid; at dash-hero-meta

### **Day 7** (June 10)
- Conducted testing on a Vercel deployment.
- Resolved critical bugs related to user login fetching and Super Admin privileges during the initial deployment to `proact.dost1.ph`.

### **Day 8** (June 11)
- Worked remotely to fix PDF preview bugs.
- Created a new database schema to store a history of AI-generated executive summaries.
- Affected Person: Barchart Vertical turned to Barchart Horizontal and Added Filtering.
- Suspension: Suspension by City changed to Suspension by LGU.

## Week 3: Final Features and Debugging

### **Day 9** (June 15)
- Fixed two major bugs in situational reporting: isolated data leaking between provinces and standardized the global SitRep numbering sequence.
- Affected Person: Clicking the city/municipality displays their respective barangays (Accordion).
- Affected Person Chart: Added Pop-up modal, if the user click the chart of the specific city/municipality it will show the barangays chart too.

### **Day 10** (June 16)
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

### **Day 10-11** (June 16-17)
### **Day 11-12** (June 17)
- Developed the **Interactive GIS Map** for monitoring and warning stations.
- Refactored Equipment Inventory to a space-efficient **Horizontal 3-3-1 Grid Layout** in station info popups and forms.
- Implemented **Draggable & Editable Detail Modals** for real-time equipment specification updates.
- Refactored backend `PATCH` routes for stations to support **Partial Updates** and surgical data modification.
- Added numeric validation and Philippine mobile number formatting (11 digits) to contact fields.
- Updated system branding to include the official **1RDRRMC Logo** inside the main PROACT logo.

### **Day 12** (June 18)
- Implemented **LGU/Provincial Scope Validation** for Excel uploads.
- Restricted **Excel Template Dropdowns**: LGU users now only see their assigned city in the template selection.
- Added **Frontend Import Filtering**: Automatically skips unauthorized rows during Excel/CSV imports with a warning notification.
- Strengthened **Backend API Security**: Integrated `validateReportAccess` in all report `POST` and `PATCH` routes to strictly enforce LGU boundaries at the server level.
- Refactored `AddReport.jsx` and `reports.js` to use **Normalized City Comparison** (case-insensitive and prefix-aware) for robust access control.
- **Event Selection Refined**: Removed the legacy logic on the dashboard that forced automatic selection resets back to the active deployed event, allowing sticky selection of any event.
- **Auto-Refresh Optimization**: Refined the page auto-refresh behavior across system views to improve state stability.

## Week 4: Final Permissions & Context Synchronization

### **Day 13** (June 22)
- **LGU Station Permissions Reverted**: Restored LGU users' ability to add and edit monitoring stations on both the frontend Interactive Map and backend API routes.
- **Interactive Map Pre-population**: Configured the Province select and LGU Name input fields in the station drawer to automatically pre-populate and disable for LGU users to enforce mapping coordinates and prevent cross-jurisdictional updates.
- **Add Report Validation Markers Auto-Refresh**: Resolved the lag where newly created events/SitReps did not immediately display the red markers (required/pinged report categories) until a manual refresh. Destructured `fetchEvents` from `EventContext`, invoked it during report creation, and added `useEffect` sync hooks to keep the local `selectedEvent` state aligned with the global context.
- **Manage Event Alert Status Default Circle Color**: Fixed a bug where creating a new event under "White (Normal)" alert status defaulted to a blue/indigo circle color `#6366f1` instead of gray/white `#94a3b8`.
- **Davis API Token Clarification**: Clarified that token `5ECABC5CB8824E5D86D12115782CE2EC` is the default token used for weather data simulation and Davis Instruments v1 API proxying.

### **Day 14** (June 23)
- **Sidebar Navigation Rearrangement**: Moved the Interactive Map navigation item below the "Users" link and above the "Hazard Information" dropdown in the sidebar to streamline admin layout hierarchy.
- **User Edit Modal Location Fix**: Fixed a bug in the user editor where changing a user's role/account type within the same tier (e.g., LGU Admin <-> LGU or Provincial Admin <-> Provincial) would reset their province and city/municipality to blank. The system now retains their location details.
- **User Management Auto-Refresh**: Resolved the issue where the Users table did not automatically sync changes upon mutations without a manual page reload. Added Socket.io broadcasts (`users:changed`) to the backend `POST`, `PATCH`, and `DELETE` endpoints, and optimized frontend data-fetching in `Users.jsx` to refresh the user list in the background silently without screen flashing.
- **User Email & Password Update Fix**: Fixed a bug where changing user emails or passwords did not update the PostgreSQL database. Added the `email` field to frontend/backend update payload structures and bypassed target user `currentPassword` verification for administrator resets, while keeping it active for self-edits.
- **User Account Deletion Constraint Fix**: Fixed a database constraint violation error (foreign key `activity_logs_user_id_fkey`) when deleting user accounts. Wrapped the backend `DELETE` route in a PostgreSQL transaction that removes user referencing entries in `activity_logs` and sets referencing foreign keys in `lgu_submissions`, `situational_reports`, `event_deployments`, and `event_signals` to `NULL` before deleting the user.
- **Tropical Cyclone Monitor Details**: Replaced the generic active event hero description with user-configured Location, Wind/Gust, Movement, Coordinates, and a dynamic real-time clock (HH:MM) that updates every minute for Tropical Cyclone (`typhoon`) events. Added these form inputs to both the main event manager (`ManageEvents.jsx`) and the Dashboard's edit event modal.
