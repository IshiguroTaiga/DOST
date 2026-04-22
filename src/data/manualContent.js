export const MANUAL_CATEGORIES = [
  { id: 'basics', title: 'System Basics', icon: 'BookOpen' },
  { id: 'events', title: 'Events & Tracking', icon: 'CalendarCheck' },
  { id: 'reporting', title: 'Reporting & Data', icon: 'FilePlus' },
  { id: 'review', title: 'Review & Approvals', icon: 'CheckCircle' },
  { id: 'admin', title: 'Administration', icon: 'Users' }
];

export const MANUAL_SECTIONS = [
  {
    id: 'intro',
    category: 'basics',
    title: 'Overview of PROACT',
    roles: ['All'],
    description: 'PROACT is designed to streamline disaster response data from the local level to regional consolidation.',
    steps: [
      {
        title: 'Understanding the Dashboard',
        text: 'The dashboard displays aggregated data from all LGUs. You can see the number of active events, affected populations, and status of critical infrastructure at a glance.',
        visual: '/assets/help/dashboard_demo.webp',
        type: 'video'
      },
      {
        title: 'Navigating the Menu',
        text: 'Use the sidebar to access different modules. Depending on your role, you will see options for Managing Events, Adding Reports, or User Management.',
        visual: '/assets/help/dashboard_demo.webp',
        type: 'video'
      }
    ]
  },
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
      }
    ]
  },
  {
    id: 'add-report-detailed',
    category: 'reporting',
    title: 'LGU Reporting Workflow',
    roles: ['LGU Admin', 'LGU', 'Provincial Admin', 'Provincial'],
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
        title: 'Submitting for Approval',
        text: 'Once all sections are completed, click "Submit Report". Your report will move to the "Pending" status until reviewed by a Provincial or Regional officer.',
        visual: '/assets/help/dashboard_demo.webp',
        type: 'video'
      }
    ]
  },
  {
    id: 'review-workflow',
    category: 'review',
    title: 'Reviewing and Consolidating Reports',
    roles: ['Regional Admin', 'Provincial Admin', 'Provincial Approver'],
    description: 'How to verify LGU data and generate consolidated regional reports.',
    steps: [
      {
        title: 'Reviewing Submissions',
        text: 'Navigate to "Consolidated Report" to see pending LGU submissions. You can view details, request corrections, or approve the data.',
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
    id: 'user-management-detailed',
    category: 'admin',
    title: 'Managing Accounts & Access',
    roles: ['Super Admin', 'Regional Admin', 'Provincial Admin'],
    description: 'Best practices for maintaining a secure and organized user directory.',
    steps: [
      {
        title: 'Tiered Permissions',
        text: 'Admins can only create accounts below their own tier. For example, a Provincial Admin can create LGU and local Provincial accounts but not Regional accounts.',
        visual: '/assets/help/dashboard_demo.webp',
        type: 'video'
      },
      {
        title: 'Account Status',
        text: 'Suspicious accounts can be deactivated immediately. "Pending" users are those who have been invited but have not yet completed their first login.',
        visual: '/assets/help/dashboard_demo.webp',
        type: 'video'
      }
    ]
  }
];
