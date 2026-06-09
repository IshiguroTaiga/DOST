export const MANUAL_CATEGORIES = [
  { id: 'admin', title: 'Administration', icon: 'Users' },
  { id: 'events', title: 'Events & Tracking', icon: 'CalendarCheck' },
  { id: 'reporting', title: 'Reporting & Data', icon: 'FilePlus' },
  { id: 'review', title: 'Review & Approvals', icon: 'CheckCircle' },
  { id: 'logs_v2', title: 'Update Logs v2 (Current)', icon: 'ClipboardText' },
  { id: 'logs_v1', title: 'Update Logs v1 (Legacy)', icon: 'History' }
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
    roles: ['Super Admin', 'Regional Admin', 'Provincial Admin', 'Provincial Approver'],
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

  // --- REVIEW & APPROVALS (CURRENT) ---
  {
    id: 'review-workflow',
    category: 'review',
    title: 'Reviewing and Consolidating Reports',
    roles: ['Super Admin', 'Regional Admin', 'Provincial Admin', 'Provincial Approver'],
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

  // --- UPDATE LOGS V2 (CURRENT SUMMARY) ---
  {
    id: 'logs-v2-summary',
    category: 'logs_v2',
    title: 'System Improvements & Features (v2.0)',
    roles: ['All'],
    description: 'Overview of the latest updates and improved reporting features.',
    steps: [
      {
        title: 'Intelligent Auto-Clone',
        text: 'New automated data inheritance system for Situational Reports.',
        visual: '/assets/help/dashboard_demo.webp',
        type: 'video'
      },
      {
        title: 'Enhanced Administration',
        text: 'Consolidated admin tools and improved role-based scoping.',
        visual: '/assets/help/dashboard_demo.webp',
        type: 'video'
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
