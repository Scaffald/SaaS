/**
 * ATS Mock Data for UI Development
 *
 * This file contains realistic mock data for building and testing
 * the ATS recruiter interface WITHOUT needing a backend.
 *
 * Once the UI is finalized, this will be replaced with real tRPC queries.
 */

export type ApplicationStatus =
  | "new"
  | "screen"
  | "interview"
  | "offer"
  | "hired"
  | "rejected";

export interface MockApplication {
  id: string;
  candidate: {
    id: string;
    name: string;
    email: string;
    phone: string;
    location: string;
    photo: string;
    title: string;
    yearsExperience: number;
    skills: Array<{
      name: string;
      proficiency: "beginner" | "intermediate" | "advanced" | "expert";
    }>;
    certifications: Array<{
      name: string;
      state?: string;
      issueDate?: string;
    }>;
    experience: Array<{
      title: string;
      company: string;
      duration: string;
      description: string;
    }>;
  };
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    payRange: string;
  };
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
  score: number;
  autoRejected: boolean;
  screeningAnswers: {
    currentLocation: string;
    willingToRelocate: boolean;
    yearsExperience: number;
    isAuthorizedToWork: boolean;
    earliestStartDate: string;
  };
  customAnswers: Array<{
    question: string;
    answer: string;
  }>;
  attachments: {
    resume?: {
      filename: string;
      size: number;
      uploadedAt: string;
    };
    coverLetter?: {
      filename: string;
      size: number;
      uploadedAt: string;
    };
    portfolio?: {
      filename: string;
      size: number;
      uploadedAt: string;
    };
  };
  notes: Array<{
    id: string;
    author: string;
    authorId: string;
    content: string;
    rating: number;
    createdAt: string;
  }>;
  messages: Array<{
    id: string;
    sender: "recruiter" | "candidate";
    senderName: string;
    content: string;
    sentAt: string;
    isRead: boolean;
  }>;
  stageHistory: Array<{
    fromStage: ApplicationStatus | null;
    toStage: ApplicationStatus;
    changedBy: string;
    changedAt: string;
    reason?: string;
  }>;
}

export const mockApplications: MockApplication[] = [
  {
    id: "app-001",
    candidate: {
      id: "user-001",
      name: "Sarah Johnson",
      email: "sarah.johnson@email.com",
      phone: "+1 (555) 123-4567",
      location: "Austin, Texas",
      photo: "https://i.pravatar.cc/150?img=1",
      title: "Senior Electrician",
      yearsExperience: 8,
      skills: [
        { name: "Electrical Wiring", proficiency: "expert" },
        { name: "Blueprint Reading", proficiency: "advanced" },
        { name: "Code Compliance", proficiency: "expert" },
        { name: "Commercial Installation", proficiency: "advanced" },
      ],
      certifications: [
        {
          name: "Master Electrician License",
          state: "TX",
          issueDate: "2020-03-15",
        },
        { name: "OSHA 30", issueDate: "2023-03-15" },
      ],
      experience: [
        {
          title: "Lead Electrician",
          company: "ABC Construction",
          duration: "2019 - Present",
          description:
            "Led team of 5 electricians on commercial projects. Specialized in high-voltage installations.",
        },
        {
          title: "Journeyman Electrician",
          company: "XYZ Electric",
          duration: "2016 - 2019",
          description:
            "Residential and commercial electrical work. Obtained master license.",
        },
      ],
    },
    job: {
      id: "job-001",
      title: "Commercial Electrician",
      company: "BuildCo Construction",
      location: "Austin, Texas",
      payRange: "$35-45/hour",
    },
    status: "interview",
    appliedAt: "2025-10-05T10:30:00Z",
    updatedAt: "2025-10-09T14:20:00Z",
    score: 87,
    autoRejected: false,
    screeningAnswers: {
      currentLocation: "Austin, Texas",
      willingToRelocate: false,
      yearsExperience: 8,
      isAuthorizedToWork: true,
      earliestStartDate: "Within 2 weeks",
    },
    customAnswers: [
      {
        question: "Have you worked on commercial projects over $1M?",
        answer:
          "Yes, I have worked on multiple commercial projects ranging from $1M to $5M, including office buildings, retail spaces, and industrial facilities.",
      },
      {
        question: "Are you comfortable with high-voltage installations?",
        answer:
          "Absolutely. I have extensive experience with high-voltage commercial installations and hold the necessary certifications.",
      },
    ],
    attachments: {
      resume: {
        filename: "sarah_johnson_resume.pdf",
        size: 245000,
        uploadedAt: "2025-10-05T10:30:00Z",
      },
      coverLetter: {
        filename: "cover_letter.pdf",
        size: 120000,
        uploadedAt: "2025-10-05T10:30:00Z",
      },
    },
    notes: [
      {
        id: "note-001",
        author: "John Recruiter",
        authorId: "user-recruiter-001",
        content:
          "Excellent experience and certifications. Phone screen went great. Moving to in-person.",
        rating: 5,
        createdAt: "2025-10-06T09:00:00Z",
      },
      {
        id: "note-002",
        author: "Jane Manager",
        authorId: "user-manager-001",
        content:
          "Strong technical skills. Would be great for our commercial team.",
        rating: 5,
        createdAt: "2025-10-08T15:30:00Z",
      },
    ],
    messages: [
      {
        id: "msg-001",
        sender: "recruiter",
        senderName: "John Recruiter",
        content:
          "Hi Sarah, thanks for applying! We'd love to schedule a phone screening. Are you available this week?",
        sentAt: "2025-10-07T11:00:00Z",
        isRead: true,
      },
      {
        id: "msg-002",
        sender: "candidate",
        senderName: "Sarah Johnson",
        content:
          "Hi John, thanks for reaching out! I'm available Thursday or Friday afternoon.",
        sentAt: "2025-10-07T14:30:00Z",
        isRead: true,
      },
      {
        id: "msg-003",
        sender: "recruiter",
        senderName: "John Recruiter",
        content:
          "Perfect! Let's schedule for Friday at 2pm. I'll send a calendar invite.",
        sentAt: "2025-10-07T15:00:00Z",
        isRead: true,
      },
    ],
    stageHistory: [
      {
        fromStage: null,
        toStage: "new",
        changedBy: "System",
        changedAt: "2025-10-05T10:30:00Z",
      },
      {
        fromStage: "new",
        toStage: "screen",
        changedBy: "John Recruiter",
        changedAt: "2025-10-06T14:20:00Z",
        reason: "Strong qualifications, moving to phone screen",
      },
      {
        fromStage: "screen",
        toStage: "interview",
        changedBy: "John Recruiter",
        changedAt: "2025-10-09T14:20:00Z",
        reason: "Phone screen went well, scheduling in-person interview",
      },
    ],
  },
  {
    id: "app-002",
    candidate: {
      id: "user-002",
      name: "Michael Chen",
      email: "michael.chen@email.com",
      phone: "+1 (555) 234-5678",
      location: "Houston, Texas",
      photo: "https://i.pravatar.cc/150?img=12",
      title: "Construction Project Manager",
      yearsExperience: 12,
      skills: [
        { name: "Project Management", proficiency: "expert" },
        { name: "Budget Management", proficiency: "expert" },
        { name: "Team Leadership", proficiency: "advanced" },
        { name: "Construction Safety", proficiency: "expert" },
      ],
      certifications: [
        { name: "PMP Certification", issueDate: "2019-06-20" },
        { name: "OSHA 30", issueDate: "2022-02-10" },
      ],
      experience: [
        {
          title: "Senior Project Manager",
          company: "Global Construction Group",
          duration: "2018 - Present",
          description:
            "Managing $20M+ commercial construction projects. Led teams of 50+ workers.",
        },
        {
          title: "Project Manager",
          company: "Regional Builders Inc",
          duration: "2013 - 2018",
          description: "Managed mid-size commercial and residential projects.",
        },
      ],
    },
    job: {
      id: "job-002",
      title: "Senior Project Manager",
      company: "MegaBuild Construction",
      location: "Houston, Texas",
      payRange: "$95k-120k/year",
    },
    status: "offer",
    appliedAt: "2025-09-28T08:15:00Z",
    updatedAt: "2025-10-10T16:45:00Z",
    score: 92,
    autoRejected: false,
    screeningAnswers: {
      currentLocation: "Houston, Texas",
      willingToRelocate: true,
      yearsExperience: 12,
      isAuthorizedToWork: true,
      earliestStartDate: "Within 4 weeks",
    },
    customAnswers: [
      {
        question: "What size projects have you managed?",
        answer:
          "I have managed projects ranging from $5M to $25M across commercial and mixed-use developments.",
      },
    ],
    attachments: {
      resume: {
        filename: "michael_chen_resume.pdf",
        size: 312000,
        uploadedAt: "2025-09-28T08:15:00Z",
      },
    },
    notes: [
      {
        id: "note-003",
        author: "Susan Director",
        authorId: "user-director-001",
        content: "Top candidate. Excellent interview. Preparing offer.",
        rating: 5,
        createdAt: "2025-10-08T11:20:00Z",
      },
    ],
    messages: [
      {
        id: "msg-004",
        sender: "recruiter",
        senderName: "Susan Director",
        content:
          "Michael, great news! We would like to extend an offer. Can we schedule a call tomorrow?",
        sentAt: "2025-10-10T16:45:00Z",
        isRead: false,
      },
    ],
    stageHistory: [
      {
        fromStage: null,
        toStage: "new",
        changedBy: "System",
        changedAt: "2025-09-28T08:15:00Z",
      },
      {
        fromStage: "new",
        toStage: "screen",
        changedBy: "John Recruiter",
        changedAt: "2025-09-30T10:00:00Z",
      },
      {
        fromStage: "screen",
        toStage: "interview",
        changedBy: "John Recruiter",
        changedAt: "2025-10-03T14:00:00Z",
      },
      {
        fromStage: "interview",
        toStage: "offer",
        changedBy: "Susan Director",
        changedAt: "2025-10-10T16:45:00Z",
        reason: "Excellent interviews with all team members. Extending offer.",
      },
    ],
  },
  {
    id: "app-003",
    candidate: {
      id: "user-003",
      name: "James Rodriguez",
      email: "james.rod@email.com",
      phone: "+1 (555) 345-6789",
      location: "Dallas, Texas",
      photo: "https://i.pravatar.cc/150?img=33",
      title: "Plumber",
      yearsExperience: 3,
      skills: [
        { name: "Pipe Installation", proficiency: "intermediate" },
        { name: "Pipe Repair", proficiency: "advanced" },
        { name: "Blueprint Reading", proficiency: "intermediate" },
      ],
      certifications: [{
        name: "Journeyman Plumber License",
        state: "TX",
        issueDate: "2023-01-15",
      }],
      experience: [
        {
          title: "Apprentice Plumber",
          company: "Quick Fix Plumbing",
          duration: "2022 - Present",
          description:
            "Residential and commercial plumbing. Working toward master license.",
        },
      ],
    },
    job: {
      id: "job-003",
      title: "Commercial Plumber",
      company: "BuildCo Construction",
      location: "Austin, Texas",
      payRange: "$28-35/hour",
    },
    status: "new",
    appliedAt: "2025-10-11T07:20:00Z",
    updatedAt: "2025-10-11T07:20:00Z",
    score: 65,
    autoRejected: false,
    screeningAnswers: {
      currentLocation: "Dallas, Texas",
      willingToRelocate: true,
      yearsExperience: 3,
      isAuthorizedToWork: true,
      earliestStartDate: "Within 2 weeks",
    },
    customAnswers: [],
    attachments: {
      resume: {
        filename: "james_rodriguez_resume.pdf",
        size: 178000,
        uploadedAt: "2025-10-11T07:20:00Z",
      },
    },
    notes: [],
    messages: [],
    stageHistory: [
      {
        fromStage: null,
        toStage: "new",
        changedBy: "System",
        changedAt: "2025-10-11T07:20:00Z",
      },
    ],
  },
  // Add more mock applications here...
  // TODO: Add 17+ more applications with varying:
  // - Different statuses (spread across all stages)
  // - Different jobs
  // - Different scores (40-95)
  // - Different experience levels (1-20 years)
  // - Some with messages, some without
  // - Some with notes, some without
  // - Mix of recent and older applications
  // - Some rejected with reasons
];

export const mockJobs = [
  {
    id: "job-001",
    title: "Commercial Electrician",
    company: "BuildCo Construction",
    location: "Austin, Texas",
    status: "active",
    postedDate: "2025-09-15",
    applicationCount: 12,
    pipeline: {
      new: 3,
      screen: 4,
      interview: 3,
      offer: 1,
      hired: 1,
    },
  },
  {
    id: "job-002",
    title: "Senior Project Manager",
    company: "MegaBuild Construction",
    location: "Houston, Texas",
    status: "active",
    postedDate: "2025-09-20",
    applicationCount: 8,
    pipeline: {
      new: 2,
      screen: 2,
      interview: 2,
      offer: 1,
      hired: 1,
    },
  },
  {
    id: "job-003",
    title: "Commercial Plumber",
    company: "BuildCo Construction",
    location: "Austin, Texas",
    status: "active",
    postedDate: "2025-10-01",
    applicationCount: 5,
    pipeline: {
      new: 3,
      screen: 1,
      interview: 1,
      offer: 0,
      hired: 0,
    },
  },
  // Add more jobs as needed
];

export const mockStats = {
  totalApplications: 47,
  activeApplications: 38,
  new: 12,
  screening: 10,
  interview: 8,
  offer: 3,
  hired: 5,
  rejected: 9,
  averageScore: 72,
  averageTimeToHire: 18, // days
  conversionRate: 0.12, // 12%
  topSources: [
    { source: "Scaffald", count: 25 },
    { source: "Referral", count: 12 },
    { source: "Indeed", count: 10 },
  ],
};

/**
 * Helper function to get applications by status
 */
export const getApplicationsByStatus = (
  status: ApplicationStatus,
): MockApplication[] => {
  return mockApplications.filter((app) => app.status === status);
};

/**
 * Helper function to get applications by job
 */
export const getApplicationsByJob = (jobId: string): MockApplication[] => {
  return mockApplications.filter((app) => app.job.id === jobId);
};

/**
 * Helper function to get application by ID
 */
export const getApplicationById = (id: string): MockApplication | undefined => {
  return mockApplications.find((app) => app.id === id);
};

/**
 * Mock function to simulate updating application status
 * In real implementation, this would be a tRPC mutation
 */
export const mockUpdateApplicationStatus = (
  applicationId: string,
  newStatus: ApplicationStatus,
  reason?: string,
): MockApplication => {
  const app = mockApplications.find((a) => a.id === applicationId);
  if (!app) throw new Error("Application not found");

  // Update status
  const oldStatus = app.status;
  app.status = newStatus;
  app.updatedAt = new Date().toISOString();

  // Add to history
  app.stageHistory.push({
    fromStage: oldStatus,
    toStage: newStatus,
    changedBy: "Current User", // In real app, use actual user
    changedAt: new Date().toISOString(),
    reason,
  });

  return app;
};

/**
 * Mock function to add a note to an application
 */
export const mockAddNote = (
  applicationId: string,
  content: string,
  rating: number,
): MockApplication => {
  const app = mockApplications.find((a) => a.id === applicationId);
  if (!app) throw new Error("Application not found");

  const newNote = {
    id: `note-${Date.now()}`,
    author: "Current User",
    authorId: "user-current",
    content,
    rating,
    createdAt: new Date().toISOString(),
  };

  app.notes.push(newNote);
  return app;
};

/**
 * Mock function to send a message to a candidate
 */
export const mockSendMessage = (
  applicationId: string,
  content: string,
): MockApplication => {
  const app = mockApplications.find((a) => a.id === applicationId);
  if (!app) throw new Error("Application not found");

  const newMessage = {
    id: `msg-${Date.now()}`,
    sender: "recruiter" as const,
    senderName: "Current User",
    content,
    sentAt: new Date().toISOString(),
    isRead: false,
  };

  app.messages.push(newMessage);
  return app;
};
