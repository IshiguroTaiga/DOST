export const MANUAL_CATEGORIES = [
  { id: 'admin', title: 'Administration', icon: 'Users' },
  { id: 'events', title: 'Events & Tracking', icon: 'CalendarCheck' },
  { id: 'reporting', title: 'Reporting & Data', icon: 'FilePlus' },
  { id: 'review', title: 'Review & Analysis', icon: 'CheckCircle' },
  { id: 'developer', title: 'Developers Profile', icon: 'User' },
  { id: 'handbook', title: 'Project Handbook', icon: 'BookOpen' },
  { id: 'logs_v2', title: 'Update Logs V2 (Current)', icon: 'ClipboardText' },
  { id: 'logs_v1', title: 'Update Logs V1 (Legacy)', icon: 'History' }
];

export const MANUAL_SECTIONS = [
  // --- ADMINISTRATION (CURRENT) ---
  {
    id: 'admin-auto-clone',
    category: 'admin',
    title: 'Intelligent SitRep Auto-Clone',
    roles: ['Super Admin', 'Regional Admin', 'Provincial Admin'],
    description: 'Learn how the system automatically carries forward data between reporting cycles.',
    steps: [
      {
        title: 'Automatic Data Inheritance',
        text: 'When creating a new Situational Report, PROACT automatically detects the latest approved report and clones all 15 data categories. This reduces manual entry and ensures continuity.',
        visual: '/assets/help/dashboard_demo.webp',
        type: 'video'
      },
      {
        title: 'Hierarchy-Aware Filtering',
        text: 'Cloning respects your administrative level. LGUs clone only their city data, while Provincial and Regional admins clone their respective consolidated datasets.',
        visual: '/assets/help/dashboard_demo.webp',
        type: 'video'
      },
      {
        title: 'Audit & Traceability',
        text: 'Every auto-cloned report is marked with its source ID and timestamp. You can see which fields were inherited and which were modified in the activity logs.',
        visual: '/assets/help/dashboard_demo.webp',
        type: 'video'
      }
    ]
  },
  {
    id: 'admin-hierarchy-rules',
    category: 'admin',
    title: 'Role-Based Data Scoping',
    roles: ['Super Admin', 'Regional Admin', 'Provincial Admin'],
    description: 'Understanding how data visibility and cloning permissions are strictly enforced.',
    steps: [
      {
        title: 'LGU Level Scoping',
        text: 'LGU users can only access and clone data for their specific city. They cannot see or modify data from neighboring municipalities.',
        visual: '/assets/help/dashboard_demo.webp',
        type: 'video'
      },
      {
        title: 'Provincial Consolidation',
        text: 'Provincial admins can clone and edit data from all LGUs within their province, providing a middle layer of verification before regional submission.',
        visual: '/assets/help/dashboard_demo.webp',
        type: 'video'
      }
    ]
  },

  // --- EVENTS & TRACKING (CURRENT) ---
  {
    id: 'manage-events-detailed',
    category: 'events',
    title: 'How to Manage Disaster Events',
    roles: ['Super Admin', 'Regional Admin', 'Provincial Admin'],
    description: 'Detailed guide on initiating and maintaining disaster events in the system.',
    steps: [
      {
        title: 'Creating a New Event',
        text: '1. Click "Manage Events" in the sidebar.\n2. Select "Add Event".\n3. Fill in the name, disaster type, and alert level.\n4. Select the affected provinces and LGUs.\n5. Click "Save" to deploy the event to relevant users.',
        visual: '/assets/help/dashboard_demo.webp',
        type: 'video'
      },
      {
        title: 'Updating Alert Levels',
        text: 'You can change an event\'s alert status (White, Blue, Yellow, Orange, Red) as the situation evolves. This will immediately update the dashboard for all users.',
        visual: '/assets/help/dashboard_demo.webp',
        type: 'video'
      },
      {
        title: 'Closing Events',
        text: 'Once a disaster response is concluded, mark the event as inactive. This archives the data but keeps it available for future reporting and analysis.',
        visual: '/assets/help/dashboard_demo.webp',
        type: 'video'
      }
    ]
  },
  {
    id: 'event-logs-detailed',
    category: 'events',
    title: 'Event Logs & Activity Tracking',
    roles: ['Super Admin', 'Regional Admin', 'Provincial Admin'],
    description: 'Monitor all system activities and data changes in real-time.',
    steps: [
      {
        title: 'Accessing Event Logs',
        text: 'Click the "Event Logs" icon in the sidebar. This view shows every major action taken within the system, tagged with the user and timestamp.',
        visual: '/assets/help/dashboard_demo.webp',
        type: 'video'
      },
      {
        title: 'Auditing Data Changes',
        text: 'Logs track when reports are created, edited, approved, or rejected. This ensures accountability and provides a clear trail for data verification.',
        visual: '/assets/help/dashboard_demo.webp',
        type: 'video'
      }
    ]
  },

  // --- REPORTING & DATA (CURRENT) ---
  {
    id: 'add-report-detailed',
    category: 'reporting',
    title: 'LGU Reporting Workflow',
    roles: ['Super Admin', 'Regional Admin', 'Provincial Admin', 'Provincial', 'LGU Admin', 'LGU'],
    description: 'Guidelines for submitting accurate and timely situational reports.',
    steps: [
      {
        title: 'Selecting an Event',
        text: 'Only events deployed to your city or province will be visible. Select the active event you need to report for from the dropdown.',
        visual: '/assets/help/dashboard_demo.webp',
        type: 'video'
      },
      {
        title: 'Entering Data Categories',
        text: 'Data is organized into 15 categories (e.g., Affected Population, Damaged Houses, Power Status). Ensure you save each section before moving to the next.',
        visual: '/assets/help/dashboard_demo.webp',
        type: 'video'
      },
      {
        title: 'Saving Drafts',
        text: 'You don\'t have to complete the report in one go. Click "Save Draft" to store your progress and return to it later.',
        visual: '/assets/help/dashboard_demo.webp',
        type: 'video'
      },
      {
        title: 'Submitting for Approval',
        text: 'Once all sections are completed, click "Submit Report". Your report will move to the "Pending" status until reviewed by a Provincial or Regional officer.',
        visual: '/assets/help/dashboard_demo.webp',
        type: 'video'
      }
    ]
  },
  {
    id: 'consolidated-reports-detailed',
    category: 'reporting',
    title: 'Consolidated Reports & Data Analytics',
    roles: ['Super Admin', 'Regional Admin', 'Provincial Admin', 'Provincial'],
    description: 'How to verify, edit, and consolidate data from multiple LGUs into official reports.',
    steps: [
      {
        title: 'Drill-down to LGU Data',
        text: 'Navigate to the Consolidated Report module. Click on an event, then a SitRep version to see data broken down by province and LGU.',
        visual: '/assets/help/dashboard_demo.webp',
        type: 'video'
      },
      {
        title: 'Editing and Verifying',
        text: 'Admins can directly edit or delete rows submitted by LGUs if corrections are needed before final approval.',
        visual: '/assets/help/dashboard_demo.webp',
        type: 'video'
      },
      {
        title: 'AI Summary Generation',
        text: 'Use the "Generate AI Summary" feature to quickly synthesize data into a readable format for executive briefs.',
        visual: '/assets/help/dashboard_demo.webp',
        type: 'video'
      },
      {
        title: 'Exporting Data',
        text: 'Generate PDF SitReps with official signatories or export raw data to CSV for external agency requirements.',
        visual: '/assets/help/dashboard_demo.webp',
        type: 'video'
      }
    ]
  },

  // --- REVIEW & ANALYSIS (CURRENT) ---
  {
    id: 'review-workflow',
    category: 'review',
    title: 'Reviewing and Consolidating Reports',
    roles: ['Super Admin', 'Regional Admin', 'Provincial Admin', 'Provincial'],
    description: 'How to verify LGU data and generate consolidated regional reports.',
    steps: [
      {
        title: 'Reviewing Submissions',
        text: 'Navigate to "Consolidated Report" to see pending LGU submissions. You can view details, request corrections, or approve the data.',
        visual: '/assets/help/dashboard_demo.webp',
        type: 'video'
      },
      {
        title: 'Managing SitRep Versions',
        text: 'The system maintains versions of reports (e.g., SitRep No. 1, No. 2). Ensure you are reviewing the latest version for the current reporting period.',
        visual: '/assets/help/dashboard_demo.webp',
        type: 'video'
      },
      {
        title: 'Generating Situational Reports (SitRep)',
        text: 'Once LGU data is approved, you can generate an official SitRep in PDF or Excel format for circulation to higher agencies.',
        visual: '/assets/help/dashboard_demo.webp',
        type: 'video'
      }
    ]
  },
  {
    id: 'rejection-handling',
    category: 'review',
    title: 'Handling Rejected Reports',
    roles: ['Super Admin', 'Regional Admin', 'Provincial Admin', 'Provincial'],
    description: 'Steps to take when a report requires correction.',
    steps: [
      {
        title: 'Reviewing Rejection Remarks',
        text: 'If a report is rejected, check the remarks provided by the reviewer. This will specify which sections need correction.',
        visual: '/assets/help/dashboard_demo.webp',
        type: 'video'
      },
      {
        title: 'Correcting and Resubmitting',
        text: 'Open the rejected report, make the necessary adjustments in the specific categories, and click "Resubmit" to send it back for review.',
        visual: '/assets/help/dashboard_demo.webp',
        type: 'video'
      }
    ]
  },

  {
    id: 'about-me',
    category: 'developer',
    title: 'Developers Profile',
    roles: ['All'],
    description: 'Information about the developer/contributor of PROACT.',
    steps: [
      {
        title: 'Developers Profile',
        text: 'Patongan, Joaquin\nBullanday, Luis\nLadera, Ivan\nPagurayan, Angel Lyka\nPermison, Micko Gabriel',
        visual: '/assets/help/DVShowcase.jpeg',
        type: 'iframe',
        clickableNames: true
      },
      {
        title: 'Developer Showcase',
        developersShowcase: true,
        developers: [
          {
            id: 'bullanday-luis',
            name: 'Bullanday, Luis',
            photo: '/assets/devs/bullanday.jpg',
            about: "Yo! I'm a Computer Science student and an aspiring Frontend Developer who loves creating clean, interactive, and user-friendly websites. Outside of coding, I enjoy watching anime, playing video games, and spending time learning new things at my own pace. I like bringing ideas to life through code and building projects that are both fun and useful. Code. Learn. Repeat. No Sleep XD.",
            email: 'bullandayluist@gmail.com',
            github: 'github.com/rcssln',
            number: '09164453919',
            links: [
              'https://www.facebook.com/luis.tegerero.bullanday'
            ]
          },
          {
            id: 'ladera-ivan',
            name: 'Ladera, Ivan',
            photo: '/assets/devs/ladera.jpg',
            about: "Sup! I'm a Computer Science student at MMSU. currently learning programming and continuously improving my skills through self-study. Aside from coding, I have a basic background in graphic design and enjoy creating simple, clean designs whenever I get the chance. I like watching movies and thrift shopping. I'm always looking for opportunities to learn something new and become a better developer every day.",
            email: 'Ivanjustinladera0722@gmail.com',
            github: 'github.com/ItlogNaMaalat',
            number: '09263898004',
            links: [
              'https://www.facebook.com/Ihbann/'
            ]
          },
          {
            id: 'pagurayan-angel-lyka',
            name: 'Pagurayan, Angel Lyka S.',
            photo: '/assets/devs/pagurayan.jpg',
            about: "Hi, I’m Angel, a Computer Science student driven by the intersection of technology and visual design. I specialize in bridging the gap between functional code and aesthetic impact, leveraging my background in photography and graphic design to enhance the user experience of my tech projects. I am deeply committed to continuous growth and dedicated to building creative, high-impact digital solutions.",
            email: 'pagurayanangellyka@gmail.com',
            github: 'github.com/jykzrepo',
            number: '0995 785 4029 / 0960 853 9878',
            links: [
              'linkedin.com/in/angel-lyka-pagurayan-8ba51718b',
              'https://www.facebook.com/pagurayan.angel',
              'https://www.instagram.com/cout.angel_/'
            ]
          },
          {
            id: 'permison-micko-gabriel',
            name: 'Permison, Micko Gabriel D.',
            photo: '/assets/devs/permison.png',
            about: "Halo! a Computer Science MMSU student here i am the one under the name IshiguroTaiga which you might have seen me on other social platforms and games, very interested into web development. Whether I'm building highly personalized, anime-themed sites or systems for school and corporate projects, I love bringing ideas to life on the screen. Outside programming, I spend a lot of my time gaming, reading mangas/manhwas and a bit of studying.",
            email: 'mickogabriel75@gmail.com',
            github: 'github.com/IshiguroTaiga',
            number: '0998 155 6469 / 0916 442 5310',
            links: [
              'https://www.facebook.com/micko.gabriel.47',
              'https://www.facebook.com/mickogabriel.permison.47',
              'https://www.instagram.com/ishigurotaiga/',
              'https://www.tiktok.com/@ishiguro_taiga'
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'project-handbook',
    category: 'handbook',
    title: 'Project Handbook',
    roles: ['All'],
    description: 'Comprehensive guide covering project objectives, manual vs. PROACT comparison, features, and workflows.',
    steps: [
      {
        title: '1. What is PROACT?',
        text: 'PROACT (formerly SIREN) is an automated web-based disaster risk reduction and management (DRRM) system tailored for DOST Region 1. It links LGUs, Provinces, and Region into a unified reporting pipeline.',
        visual: '/assets/help/dashboard_demo.webp',
        type: 'video'
      },
      {
        title: '2. Purpose & Problem Statements',
        text: 'Developed to resolve delayed reporting cycles, fragmented communication, data silos, transcription errors, and manual consolidation bottlenecks between different government tiers during disaster responses.',
        visual: '/assets/help/dashboard_demo.webp',
        type: 'video'
      },
      {
        title: '3. Benefits & Addressable Needs',
        text: 'Provides real-time validation, automatic multi-LGU consolidation, auto-cloning of data across SitReps, secure location-based scoping, live geolocation weather tracking, and one-click AI executive summaries.',
        visual: '/assets/help/dashboard_demo.webp',
        type: 'video'
      },
      {
        title: '4. Manual vs. PROACT Process',
        text: 'Manual: Slow copy-pasting of LGU sheets, repetitive manual logs, static/slow weather monitoring, and manual briefing reports.\nPROACT: Instant automated consolidation, auto-cloning of logs, live local weather widgets, and instant AI summary briefs.',
        visual: '/assets/help/dashboard_demo.webp',
        type: 'video'
      },
      {
        title: '5. NSTP / NSDB Alignment & Uniqueness',
        text: 'Aligned with the National Science Development Board guidelines on localization of resilient technology and data-driven emergency management. PROACT is a unique, first-of-its-kind nested system tailored for Philippine administrative hierarchy.',
        visual: '/assets/help/dashboard_demo.webp',
        type: 'video'
      },
      {
        title: '6. Features & Usage Workflow',
        text: '1. Regional admin deploys the event context.\n2. LGU admins fill in 15 damage/displacement categories, upload signed reports, and submit.\n3. Provincial admins verify and approve consolidated logs.\n4. Regional dashboard updates instantly with verified data for monitoring and AI briefs.',
        visual: '/assets/help/dashboard_demo.webp',
        type: 'video'
      },
      {
        title: '7. User Role Hierarchy & Management',
        text: 'PROACT operates a strict nested role structure:\n- **Super Admin**: Global access, server controls, and settings configuration (SMTP, AI, Backups).\n- **Regional Admin**: Broad oversight, event deployment, and user approval for regional and lower tiers.\n- **Provincial Admin**: Locked to their assigned province, reviews/approves local SitReps, and manages provincial/LGU users.\n- **LGU Admin**: Limited strictly to their municipality, enters telemetry/damage metrics, and submits SitReps.',
        visual: '/assets/help/dashboard_demo.webp',
        type: 'video'
      },
      {
        title: '8. System Settings & Configuration Logs',
        text: 'The Settings gear icon accesses visual preferences and backend diagnostic integrations:\n- **Security**: Complex password requirements and automatic session expiration on update.\n- **Appearance**: Theme selection (Classic vs. Modern style guide).\n- **Maintenance**: Database backups (restricted to Super Admin; disabled in local SQLite mode).\n- **Email Config & Logs**: Setup SMTP credentials (utilizing App Passwords for 2FA validation) and view history logs.\n- **AI Configuration**: Toggle between Groq and Google Gemini API keys for instant summaries.\n- **System Event Logs**: Full screen table of all admin operations (logins, uploads, approvals).\n- **Map Logs**: Tracks creation, coordinates update, and removal of stations.',
        visual: '/assets/help/dashboard_demo.webp',
        type: 'video'
      }
    ]
  },

// --- UPDATE LOGS V2 (CURRENT SUMMARY) ---
  {
    id: 'logs-v2-summary',
    category: 'logs_v2',
    title: 'PROACT System Development Logs',
    roles: ['All'],
    description: 'Chronological track of system updates, bug fixes, and feature implementations.',
    steps: [
      {
        title: 'Week 1: Introduction and Initial UI Changes',
        text: '**June 1:** Oriented with SIREN project; rebranding to PROACT; implemented clickable dashboard category buttons.\n**June 2:** Fixed event assignment "apply to all" functionality; developed Affected Persons details modal; integrated SOLIDO DRRM Knowledge Hub sidebar link; updated log-in page background to WhiteSmoke.\n**June 3:** React/JavaScript project file structure orientation; dashboard header UI refinements; finalized PROACT logo.\n**June 4:** Added Hazard Information to sidebar with external resources (Solido, PAGASA, PHIVOLCS); fixed dash-hero-meta and dash-hero-amount overlapping layout.'
      },
      {
        title: 'Week 2: Backend Logic and System Optimization',
        text: '**June 8:** Integrated Browser Geolocation API (wttr) into Dashboard.jsx; removed redundant "Approver" user roles; implemented LGU/Province self-approval workflow; fixed Add Report classification/summary layout; added weatherClassification.json; fixed 1M/1B currency formatting for Assistance Value; added scroll-to-bottom utility for Damaged Houses.\n**June 9:** Developed AI report summary generator supporting Groq (Llama 3) and Google Gemini via custom API keys; changed dash-hero-meta layout from flex to grid.\n**June 10:** Tested Vercel deployment; resolved user login fetching and Super Admin privilege bugs on proact.dost1.ph.\n**June 11:** Fixed remote PDF preview bugs; designed database schema for AI executive summary history; converted Affected Person vertical bar chart to horizontal with filtering; updated city suspension tracking to LGU scope.'
      },
      {
        title: 'Week 3: Final Features and Debugging',
        text: '**June 15:** Resolved provincial data leaks and standardized global SitRep numbering; added barangay accordions to Affected Person list; implemented synchronized pop-up barangay charts when clicking city data.\n**June 16:** Security audit & "Edit User" password bypass patch; corrected gaps in weatherClassifications.json (e.g., 30°C alignment); enforced Mandatory Report Categories (Red Dots); reorganized Help Manual with developer profiles and iframe/video support; fixed sidebar collapse visibility for hazard links; changed weather icons to black; fixed Affected Person numerical bugs.\n**June 16-17:** Integrated ExcelJS for advanced exports; added native data validation dropdowns and dependent city-to-barangay filtering via INDIRECT formulas; built mobile-first responsive UI with Hamburger Menu and optimized grids.\n**June 17:** Developed Interactive GIS Map for monitoring stations; refactored Equipment Inventory to a space-efficient horizontal grid layout; implemented draggable/editable detail modals; configured partial update PATCH routes for stations; added 11-digit Philippine mobile formatting; updated PROACT logo to feature the 1RDRRMC crest.\n**June 18:** Enforced LGU/Provincial scope validation for Excel uploads and limited templates to assigned cities; added frontend import filters with warnings for unauthorized rows; secured backend API using validateReportAccess across POST/PATCH routes; normalized city string comparisons.'
      },
      {
        title: 'Week 4: Final Permissions & Context Synchronization',
        text: '**June 22:** Reverted station permissions to allow LGU edits; locked down and pre-populated Province/LGU fields in the mapping station drawer to block cross-jurisdictional updates; added fetchEvents and useEffect sync hooks to resolve auto-refresh lag for mandatory report markers; corrected the default alert status indicator color for "White (Normal)" from indigo to gray/white (#94a3b8); documented Davis Instruments v1 API proxying simulation token configurations.\n**June 23:** Rearranged sidebar layout (Interactive Map placed below Users); fixed user edit modal location reset bugs for LGUs/Provinces; implemented real-time auto-refresh utilizing Socket.io (users:changed) on user mutations; fixed user email and password database updates with administrative password reset bypasses; fixed a database foreign key constraint violation error when deleting user accounts by wrapping the operation in a transaction that cascades sets to NULL and deletes associated activity logs; implemented custom cyclone monitoring details (Location, Wind/Gust, Movement, Coordinates, and dynamic real-time clock) for Tropical Cyclone events on the Dashboard hero section and event creation/edit workflows; integrated a comprehensive Project Handbook under Help & Manual (Developer Profiles) and exported the root-level handbook.md.\n**June 24:** Exposed "Add Report" tab in sidebar to Regional users; added dedicated "For Approval" link in sidebar for approvers; updated backend routing to allow creators to fetch and edit their own unapproved draft reports; made SitRep auto-cloning permanent in the frontend; constrained backend auto-clone lookup by report province; scoped database replication during auto-cloning by city boundaries from region1_barangays.json to prevent cross-province data leaks; expanded the Project Handbook and Help Manual with user hierarchy role descriptions and settings panel configurations; integrated accountability logs tracking report authorship and approvals.\n**June 25:** Resolved git merge conflicts for final deployment; successfully presented the completed PROACT system and stay learnings to DOST Region 1.'
      },
      {
        title: 'Week 5: Guest Access & Handover Maintenance',
        text: '**June 29:** Implemented a full guest/viewer role across system components, blocking database modifications on key forms while granting read-only capabilities; refactored the developer showcase layout to a clickable side-by-side view with absolute URLs; integrated toggleable responsive mobile mode support for tabular views; resolved final spacing and layout constraints.'
      }
    ]
  },

  // --- UPDATE LOGS V1 (LEGACY MANUAL) ---
  {
    id: 'intro-v1',
    category: 'logs_v1',
    title: 'System Overview (Legacy)',
    roles: ['All'],
    description: 'Original introduction to the PROACT system.',
    steps: [
      {
        title: 'Understanding the Dashboard',
        text: 'The dashboard displays aggregated data from all LGUs at a glance.',
        visual: '/assets/help/dashboard_demo.webp',
        type: 'video'
      }
    ]
  },
  {
    id: 'security-passwords-v1',
    category: 'logs_v1',
    title: 'Account Security (Legacy)',
    roles: ['All'],
    description: 'Original account and password security guidelines.',
    steps: [
      {
        title: 'First-time Login',
        text: 'Guidelines for initial password changes and account setup.',
        visual: '/assets/help/dashboard_demo.webp',
        type: 'video'
      }
    ]
  },
  {
    id: 'user-management-detailed-v1',
    category: 'logs_v1',
    title: 'Managing Accounts (Legacy)',
    roles: ['Super Admin', 'Regional Admin', 'Provincial Admin'],
    description: 'Legacy user management and tiered permission documentation.',
    steps: [
      {
        title: 'Tiered Permissions',
        text: 'Original rules for administrative levels and user creation.',
        visual: '/assets/help/dashboard_demo.webp',
        type: 'video'
      }
    ]
  },
  {
    id: 'backup-restore-detailed-v1',
    category: 'logs_v1',
    title: 'Maintenance (Legacy)',
    roles: ['Super Admin'],
    description: 'Original system backup and restoration procedures.',
    steps: [
      {
        title: 'Full System Backup',
        text: 'Legacy documentation for maintenance and data archiving.',
        visual: '/assets/help/dashboard_demo.webp',
        type: 'video'
      }
    ]
  }
];