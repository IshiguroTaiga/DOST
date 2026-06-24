# PROACT System Update Summary (June 1 - June 23, 2026)

This document summarizes the development, refactoring, and feature implementation performed during the initial 15-day period of the PROACT (formerly SIREN) system overhaul.

## 1. Rebranding & Core UI/UX
- **System Rebranding:** Successfully transitioned the system identity from **SIREN** (Situation Intelligence & Rapid Emergency Network) to **PROACT** (Proactive Reporting, Operation, Analysis, Communication and Tracking System).
- **Interactive Dashboard:** 
    - Overview buttons are now functional, redirecting users to specific report categories.
    - Implemented an "Affected Persons" popup to display detailed demographic and location data.
    - Integrated redirection to the **SOLIDO DRRM Knowledge Hub**.
- **Responsive Improvements:** Enabled "Show/Hide" toggles for PDF previews and implemented auto-refresh logic for real-time responsiveness across all users.

## 2. Role & Workflow Refactoring
- **Simplified Authorization:** Removed redundant "Approver" roles (Provincial/LGU Approver). The system now utilizes a streamlined self-approval and submission flow.
- **LGU Autonomy:** LGUs can now independently create Situational Reports (SitReps) and "Send to Prov" for review.
- **Provincial Workflow:** Provinces can now consolidate reports, review LGU submissions (Approve/Reject with remarks), and upload signed PDFs to finalize reports for Regional visibility.
- **Data Scoping:** Implemented strict backend filtering to ensure Regional/Super Admins only see "Approved" data, while Provincial/LGU users can monitor their respective drafts and pending reports.

## 3. SITREP & Data Management
- **Global Numbering:** Reverted to a global SitRep numbering sequence to maintain a consistent historical record across the entire event.
- **Auto-Cloning with Isolation:**
    - Implemented "Auto-Cloning" that carries over data from previous SitReps.
    - **Data Security:** Refined backend routes to ensure provinces only see their own data within a shared SitRep, while Regional users see the consolidated view.
- **DROMIC Integration:** Added functionality to download templates and import data directly from Excel, streamlining the reporting process.
- **User Management:** Enhanced user creation/editing modals to dynamically hide/show fields (like City/Municipality) based on account type.
- **Event Selection Refined:** Removed the legacy logic on the dashboard that forced automatic selection resets back to the active deployed event, allowing sticky selection of any event.
- **Auto-Refresh Optimization:** Refined the auto-refresh behaviors across all views to improve system stability and real-time state synchronization.

## 4. Real-Time Features & Notifications
- **Location-Aware Weather:** Integrated the browser Geolocation API for real-time local weather updates, with a fallback to the user's profile location.
- **Manual Weather Override:** Added an interface for Super Admins to manually set weather conditions when needed.
- **Notification System:**
    - Fixed and enhanced email notifications for event creation and deployments.
    - Implemented **Global System Notifications** visible across the dashboard.
    - Resolved SMTP issues by implementing Google App Password configurations.

## 5. AI Integration
- **AI Report Summarizer:** Developed a feature to automatically generate executive summaries from report data.
- **Model Flexibility:** Implemented a settings interface to switch between different AI models and manage API keys.
- **Summary History:** Created a database structure to store and manage a history of generated executive summaries.

## 6. Technical Support & Infrastructure
- **Deployment:** Managed Vercel deployment and coordinated with IT (Sir Ray) for Docker rebuilding and main domain (`proact.dost1.ph`) synchronization.
- **Inventory & Tech Support:** Performed hardware inventory (RSTL/Microlab), cable management (RJ45), and network debugging alongside software tasks.
- **Bug Fixes:** Resolved numerous issues including currency abbreviation logic (supporting Millions/Billions), PDF preview mismatches, and data leaking between LGU reports.

## 7. New System Enhancements (June 16-17, 2026)
- **Advanced Excel Templates:**
    - Integrated **ExcelJS** to replace standard CSV/XLSX exports.
    - Added **Native Data Validation (Dropdowns)** for City/Municipality and Barangay.
    - Implemented **Dependent Dropdowns**: Selecting a City automatically filters the available Barangays in the Excel file.
- **Interactive Map Feature:**
    - Developed a new module to visualize **Monitoring and Warning Stations** across Region I.
    - Integrated **Leaflet** for geospatial data plotting with OpenStreetMap.
    - **Automated Data Import**: Developed a robust migration script (`migrate_stations.cjs`) that parses inventory Excel sheets and imports coordinates to the database.
    - **Refined Inventory Management**: Implemented a horizontal 3-3-1 grid layout for equipment inventories in both popups and drawers.
    - **Interactive Interactivity**: Added draggable and editable detail modals, allowing users to update specs and contact numbers directly on the map.
    - **Surgical Backend**: Refactored API routes to support partial station updates, ensuring data integrity during equipment edits.
    - Added real-time filtering by Province and LGU searching on the map.
    - **Navigation Icon**: Added an "Interactive Map" sidebar navigation item with a custom `MapTrifold` icon.
    - Added numeric input validation and Philippine mobile number formatting rules.
- **Mobile Compatibility & UI Optimization:**
    - Implemented a **Hamburger Menu** and mobile header for navigation on small screens.
    - Optimized the **Dashboard** and **Add Report** pages for mobile viewports using responsive CSS grids.
    - Added **Horizontal Table Scrolling** to ensure data accessibility on mobile devices.
    - Enhanced **Modal Responsiveness** for phone and tablet users.

## 8. System Adjustments & Bug Fixes (June 22, 2026)
- **LGU Station Permissions Reverted**: Restored LGU users' ability to add and edit monitoring stations on both the frontend Interactive Map and backend API routes.
- **Interactive Map Pre-population**: Configured Province select and LGU Name inputs to pre-populate with user credentials and disabled them for LGU accounts to enforce correct mapping coordinates and prevent cross-jurisdictional updates.
- **Add Report Validation Markers Auto-Refresh**: Fixed a lag issue where newly created events/reports did not immediately render the red markers (required/pinged report types) until a page refresh. Destructured `fetchEvents` from the global `EventContext`, triggered it in the `handleCreateSitRep` creation callback, and added a `useEffect` synchronization hook to keep the local `selectedEvent` state fully synced with the global `events` array.
- **Manage Event White Alert Level Default Indicator Color**: Fixed a bug where creating events with "White (Normal)" alert status defaulted to a blue/indigo circle icon (`#6366f1`). Changed the default color in form state and the `blankForm()` constructor in `ManageEvents.jsx` to `#94a3b8` (gray/white) to match.
- **Davis Instruments API Token**: Provided clarification regarding the default API token (`5ECABC5CB8824E5D86D12115782CE2EC`) for weather stations.

## 9. System Adjustments & Bug Fixes (June 23, 2026)
- **Sidebar Navigation Rearrangement:** Moved the Interactive Map navigation item below the "Users" link and above the "Hazard Information" dropdown in the sidebar to streamline admin layout hierarchy.
- **User Edit Modal Location Fix:** Fixed a bug in the user editor where changing a user's role/account type within the same tier (e.g., LGU Admin <-> LGU or Provincial Admin <-> Provincial) would reset their province and city/municipality to blank. The system now retains their location details.
- **User Management Auto-Refresh:** Resolved the issue where the Users table did not automatically sync changes upon mutations without a manual page reload. Added Socket.io broadcasts (`users:changed`) to the backend `POST`, `PATCH`, and `DELETE` endpoints, and optimized frontend data-fetching in `Users.jsx` to refresh the user list in the background silently without screen flashing.
- **User Email & Password Update Fix:** Resolved a bug where administrative updates to user emails or passwords were not written to the PostgreSQL database. Modified the edit user modal to include `email` inside the JSON payload, structured the backend to parse and execute the email updates, and configured password changes to bypass `currentPassword` verification for administrative overrides (while still enforcing it when editing one's own account).
- **User Account Deletion Constraint Fix:** Fixed a database constraint violation error (foreign key `activity_logs_user_id_fkey`) when deleting user accounts. Wrapped the backend `DELETE` route in a PostgreSQL transaction that removes user referencing entries in `activity_logs` and sets referencing foreign keys in `lgu_submissions`, `situational_reports`, `event_deployments`, and `event_signals` to `NULL` before deleting the user.
- **Tropical Cyclone Monitor Details:** Replaced the generic active event hero description on the Dashboard with user-configured Location, Wind/Gust, Movement, Coordinates, and a dynamic real-time clock (HH:MM) that updates every minute for Tropical Cyclone (`typhoon`) events. Added these form inputs to both the main event manager (`ManageEvents.jsx`) and the Dashboard's edit event modal.
- **Project Handbook Integration:** Designed a comprehensive Project Handbook containing system purpose, background, addressed needs, manual-to-digital comparison, NSTP/NSDB integration, key features, and operational flows. Integrated this handbook under *Settings > Help & Manual (Developer Profiles)* and exported it to the root project directory as `handbook.md`.

## 10. Permissions, Auto-Cloning Overhaul, & User Security Scoping (June 24, 2026)
- **Regional Report Authoring:** Exposed the "Add Report" tab in `Sidebar.jsx` to Regional users, allowing them to author and manage situational reports.
- **Dedicated "For Approval" Route:** Added a clean "For Approval" link in the sidebar for all system approvers (`Super Admin`, `Regional`, `Regional Admin`, `Regional Approver`, `Provincial Approver`) to isolate the report signing and validation workflows.
- **Backend Creator Privileges:** Overrode backend reading restrictions in `reports.js` and `situationalReports.js` so that Regional creator accounts can access and modify unapproved draft reports they created themselves.
- **Permanent & Scoped Auto-Cloning:** 
    - Made auto-cloning permanent in the frontend (`AddReport.jsx`), displaying it as a non-toggleable, active system feature while leaving source select functionality active.
    - Scoped the backend auto-clone lookup by report province so that reports do not accidentally inherit data from a different province's timeline.
    - Scoped data replication during the clone process by matching cities in `region1_barangays.json` with target report provinces, guaranteeing complete data separation and preventing overlaps.
- **Super Admin Profile Hiding (Security Scoping):** Hidden Super Admin user profiles from the user listings (`GET /api/users` and `/api/users/pending-count`) for all non-Super Admin roles (Regional Admin, Provincial Admin, LGU Admin, etc.). Only Super Admins can view other Super Admin accounts.
- **Role Elevation Prevention:** Blocked non-Super Admin roles from assigning or promoting any user to the `Super Admin` role via the user creation (`POST /api/users`) or modification (`PATCH /api/users/:id`) API routes.
- **Super Admin Edit/Delete Locks:** Enforced backend checks to ensure Super Admin profiles can only be edited or deleted by another Super Admin or by themselves. Added a secure authorization verification query inside the user deletion transaction.

---
**Status:** System is optimized for provincial-level consolidation and regional-level oversight, with enhanced real-time capabilities, GIS mapping, and AI-assisted reporting.

## 10. System Flow Comparison (Old vs. New)

| Feature | Legacy Flow (SIREN) | New Flow (PROACT) |
| :--- | :--- | :--- |
| **Event Creation** | Manual creation with limited alert range. | Automated alerts via Email & Global System Notifications for affected provinces. |
| **LGU Role** | Purely data entry into Provincial-led reports. | **LGU Autonomy:** Can create own reports, sign PDFs, and submit directly for Provincial review. |
| **Approver Roles** | Required dedicated "Approver" accounts (Provincial/LGU Approver). | **Streamlined Roles:** Removed redundant Approver roles; Provincial/LGU admins handle signatures and uploads directly. |
| **SitRep Numbering** | Often localized or manually managed per province. | **Global Sequencing:** SitRep numbers are sequential across the entire event (e.g., SN1 Norte -> SN2 Sur). |
| **Data Cloning** | Manual or limited to same province. | **Auto-Cloning with Isolation:** Clones all historical data from previous SN; backend strictly filters visibility so provinces only see their relevant data. |
| **Approval Cycle** | Draft -> Pending -> Approved (Local to Province). | **Multi-Tier Review:** LGU (Draft) -> Pending Prov Review -> Approved (Visible to Region). |
| **Regional Visibility** | Often saw incomplete or draft data. | **Strict Verified Visibility:** Regional/Super Admin dashboards only display data from officially Approved/Signed reports. |
| **Weather Integration** | Manual text entry or static values. | **Real-Time Geolocation:** Uses browser API for local accuracy with manual Super Admin override for crisis management. |
| **Reporting** | Manual data compilation for summaries. | **AI-Powered:** One-click Executive Summary generation with historical tracking and model selection. |
| **Cyclone Monitoring** | Static generic subtitle "Monitoring active for this event.". | **Dynamic Details:** Admins enter Location, Wind/Gust, Movement, and Coordinates, rendering a live real-time clock under the title. |

### New Operational Workflow Summary:
1. **Regional Admin** creates an Event (Notifications sent).
2. **LGU** creates a Report -> Adds data -> Uploads signed PDF -> **Sends to Province**.
3. **Province** reviews LGU submission -> Consolidates all LGU data -> Uploads Provincial signed PDF -> Marks as **Approved**.
4. **Regional Dashboard** automatically populates with verified data from all Approved provincial reports.
5. **Auto-Cloning** ensures that each subsequent SitRep (e.g., No. 2, No. 3) carries the full event history while maintaining strict data privacy between provinces.