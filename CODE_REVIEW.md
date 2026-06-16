# PROACT Technical Code Review

**Project State:** Inherited System (Legacy: SIREN) → Improved & Refactored (Current: PROACT)  
**Review Date:** June 16, 2026  
**Reviewers:** DOST OJT Team (Angel, Luis, Ivan, Micko)

## 1. Executive Summary
The PROACT system is a robust, full-stack disaster reporting platform. While originally developed as "SIREN" by a previous developer, the current codebase has been significantly overhauled to improve workflow efficiency, data security, and real-time responsiveness. The architecture is modular but carries the complexity inherent in managing 15+ distinct reporting categories.

---

## 2. Architectural Review

### 2.1 Frontend (React 19 + Vite)
- **State Management:** Uses React Context API (`EventContext.jsx`) effectively for global state (events, notifications, socket connections). This avoids "prop drilling" but the context file is becoming quite large (God Object pattern) and may need future splitting.
- **Routing:** React Router DOM v7 manages hierarchical routing.
- **Component Pattern:** Clean separation of UI components (`src/components`) and page-level logic (`src/pages`).
- **Styling:** Primarily CSS-based with some modern Mesh Gradients. CSS files are scoped per page/component, which is good for maintainability.

### 2.2 Backend (Node.js + Express)
- **Real-time:** Socket.io is well-integrated. The backend emits specific events for every database mutation (e.g., `<table>:bulk_created`), ensuring all connected clients stay in sync.
- **Concurrency:** Uses PostgreSQL connection pooling (`pg` library), which is appropriate for a high-availability reporting system.
- **File Handling:** Uses `multer` for disk storage of PDFs. *Note: Local storage is used; for scaling, a cloud-based bucket (S3) might be considered.*

---

## 3. Database & Data Integrity

### 3.1 Schema Design
- **Normalization:** The database is highly normalized with 15+ sub-tables for different disaster metrics (Power, Roads, Agriculture, etc.). This ensures data integrity but increases the complexity of "Consolidated" queries.
- **Relationships:** Strong foreign key constraints between `events`, `situational_reports`, and the sub-category tables.

### 3.2 The "Auto-Cloning" Logic
- **Complexity:** This is the most complex part of the backend. It performs deep-clones of data across all 15 tables within a single transaction.
- **Observation:** The implementation is solid but performance-sensitive. Large events with thousands of rows across all LGUs could experience slight latency during cloning.

---

## 4. Security & Authorization

### 4.1 Authentication
- **JWT-based:** Standard and secure implementation. Tokens are stored in `localStorage` and expire in 7 days.
- **Improvements:** Added "Force Password Change" logic for new users, which is a critical security best practice.

### 4.2 Row-Level Scoping (Data Privacy)
- **Role-Based Access Control (RBAC):** The system implements a "Strict Scoping" policy in almost all API controllers. 
- **The Filter:** `LGU` -> City Scope | `Provincial` -> Province Scope | `Regional/Super Admin` -> Global Scope.
- **Critical Fix:** The OJT team successfully resolved a "data leaking" bug where provinces could see data from other provinces during auto-cloning.

---

## 5. The "OJT Improvements" Review

The following features were added to the base system and follow current best practices:

### 5.1 Rebranding & Dashboard Interactive Elements (Day 1-3)
Transitioned from SIREN to PROACT and added interactive category filtering on the dashboard.
```javascript
// Example: Category redirection from Dashboard
const CATEGORY_LABELS = {
  relatedIncidents: 'Related Incidents',
  affectedPopulation: 'Affected Population',
  // ... 15 other categories
};

// Redirection logic for dashboard "Overview" buttons
const handleCategoryClick = (category) => {
  navigate(`/add-report?category=${category}`);
};
```

### 5.2 AI Summarizer Service (Day 6-8)
Developed a modular service to generate executive summaries using Llama 3 (via Groq) or Gemini 2.0.
```javascript
// src/openai/summaryService.js
export async function generateAISummary(data, event) {
  const prompt = buildPromptPayload(data, event);
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${groqKey}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }]
    })
  });
  return (await response.json()).choices[0].message.content;
}
```

### 5.3 Geolocation-Based Weather (Day 5)
Integrated browser Geolocation API to fetch real-time weather for the user's specific location.
```javascript
// src/pages/Dashboard.jsx
const fetchLocalWeather = useCallback(() => {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}...`);
      setWeather(await response.json());
    });
  }
}, []);
```

### 5.4 Email Notification Engine (Day 7)
Fixed legacy SMTP issues using secure Google App Passwords and implemented Brevo for reliable delivery.
```javascript
// backend/src/utils/mailer.js (Conceptual)
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_API_KEY
  }
});
```

### 5.5 Advanced Excel Templates & Mobile UI (Day 11)
Implemented native Excel dropdowns with dependent validation logic and a mobile-first responsive layout.

**ExcelJS Dependent List:**
```javascript
// src/pages/AddReport.jsx
const indirectFormula = `=INDIRECT("LGU_" & SUBSTITUTE(SUBSTITUTE(${cityCell}," ","_"),"-","_"))`
templateSheet.getCell(i, barangayCol).dataValidation = {
  type: 'list',
  allowBlank: true,
  formulae: [indirectFormula],
  error: 'Please select a valid Barangay. Ensure City is selected first.'
};
```

**Mobile Navigation Logic:**
```javascript
// src/components/Layout.jsx
return (
  <div className={`layout ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}>
    <header className="mobile-header">
      <button onClick={() => setIsMobileMenuOpen(true)}>
        <List size={24} />
      </button>
    </header>
    {isMobileMenuOpen && <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)} />}
    <Sidebar isMobileOpen={isMobileMenuOpen} />
    {/* ... main content */}
  </div>
);
```

---

## 6. Technical Debt & Maintenance (Recommendations)

1. **Context Bloat:** `EventContext.jsx` is handling too many responsibilities (Auth, Sockets, Events, Notifications). Consider splitting into `AuthContext`, `SocketContext`, and `ReportContext`.
2. **Testing Coverage:** Currently, there is a lack of automated unit/integration tests. It is highly recommended to implement a testing suite (e.g., Vitest for frontend, Jest/Supertest for backend) before any major new features.
3. **Hardcoded Limits:** Some dashboard logic was hardcoded for "Thousands (K)". This was fixed to support Millions/Billions, but the system should adopt a more dynamic formatting library (e.g., `numeral.js`) for all financial displays.
4. **Documentation:** While `GEMINI.md` and `UpdateSUMMARY.md` exist, the inline JSDoc comments in the backend are sparse. Improving these will help the next developers.

---

## 7. Conclusion
The codebase is in a high-quality state after the recent OJT refactors. The transition from a centralized "Approver-heavy" workflow to an "Autonomy-driven" LGU-Province flow has made the code more representative of real-world operations. The system is ready for production use at `proact.dost1.ph`.