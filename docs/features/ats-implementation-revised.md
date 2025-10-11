# ATS Implementation Plan - UI First Approach (REVISED)

**Date:** October 11, 2025  
**Strategy:** Build UI with mock data first, wire up backend later

---

## 🎯 New Strategy: UI-First Development

### Why This Approach?

**Benefits:**
- ✅ Iterate quickly on UX without backend dependencies
- ✅ Validate workflows with stakeholders before committing to schema
- ✅ Frontend and backend teams can work in parallel
- ✅ Easier to change things in the mockup phase
- ✅ Get visual feedback early and often

**Old Approach (Bottom-Up):**
```
Schema → API → UI → Integration → Testing
(Slow, hard to change, late feedback)
```

**New Approach (Outside-In):**
```
UI with Mocks → Iterate → Finalize → Wire Backend → Integration
(Fast, flexible, early feedback)
```

---

## 📋 Revised Implementation Phases

### Phase 1: UI Mockup & Iteration (PRIORITY)

**Goal:** Build complete recruiter interface with realistic mock data

**Timeline:** 1-2 weeks

**No Backend Required:**
- Use TypeScript mock data files
- Client-side only
- Fast iteration
- Easy to demo

---

## Phase 1 Detailed Plan: UI with Mock Data

### Step 1: Create Mock Data Structure (Day 1)

**File:** `/packages/core/features/office/mock-data/ats-mock-data.ts`

```typescript
// Mock data structure matching future API shape
export const mockApplications = [
  {
    id: 'app-001',
    candidate: {
      id: 'user-001',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '+1 (555) 123-4567',
      location: 'Austin, Texas',
      photo: 'https://i.pravatar.cc/150?img=1',
      
      // Profile data
      title: 'Senior Electrician',
      yearsExperience: 8,
      skills: [
        { name: 'Electrical Wiring', proficiency: 'expert' },
        { name: 'Blueprint Reading', proficiency: 'advanced' },
        { name: 'Code Compliance', proficiency: 'expert' },
      ],
      certifications: [
        { name: 'Master Electrician License', state: 'TX' },
        { name: 'OSHA 30', issueDate: '2023-03-15' },
      ],
      experience: [
        {
          title: 'Lead Electrician',
          company: 'ABC Construction',
          duration: '2019 - Present',
          description: 'Led team of 5 electricians on commercial projects'
        }
      ],
    },
    
    // Application details
    job: {
      id: 'job-001',
      title: 'Commercial Electrician',
      company: 'BuildCo Construction',
      location: 'Austin, Texas',
      payRange: '$35-45/hour',
    },
    
    status: 'screen', // new, screen, interview, offer, hired, rejected
    appliedAt: '2025-10-05T10:30:00Z',
    updatedAt: '2025-10-08T14:20:00Z',
    
    // Scoring
    score: 87,
    autoRejected: false,
    
    // Application answers
    screeningAnswers: {
      currentLocation: 'Austin, Texas',
      willingToRelocate: false,
      yearsExperience: 8,
      isAuthorizedToWork: true,
      earliestStartDate: 'Within 2 weeks',
    },
    
    customAnswers: [
      {
        question: 'Have you worked on commercial projects over $1M?',
        answer: 'Yes, I have worked on multiple commercial projects...'
      }
    ],
    
    // Files
    attachments: {
      resume: {
        filename: 'sarah_johnson_resume.pdf',
        size: 245000,
        uploadedAt: '2025-10-05T10:30:00Z'
      },
      coverLetter: {
        filename: 'cover_letter.pdf',
        size: 120000,
        uploadedAt: '2025-10-05T10:30:00Z'
      }
    },
    
    // Notes and ratings (added by recruiters)
    notes: [
      {
        id: 'note-001',
        author: 'John Recruiter',
        authorId: 'user-recruiter-001',
        content: 'Great experience, strong certifications. Schedule phone screen.',
        rating: 5,
        createdAt: '2025-10-06T09:00:00Z'
      }
    ],
    
    // Message thread
    messages: [
      {
        id: 'msg-001',
        sender: 'recruiter',
        senderName: 'John Recruiter',
        content: 'Hi Sarah, thanks for applying! Would you be available...',
        sentAt: '2025-10-07T11:00:00Z',
        isRead: true
      },
      {
        id: 'msg-002',
        sender: 'candidate',
        senderName: 'Sarah Johnson',
        content: 'Hi John, thanks for reaching out! I would be available...',
        sentAt: '2025-10-07T14:30:00Z',
        isRead: true
      }
    ],
    
    // Stage history
    stageHistory: [
      {
        fromStage: null,
        toStage: 'new',
        changedBy: 'System',
        changedAt: '2025-10-05T10:30:00Z'
      },
      {
        fromStage: 'new',
        toStage: 'screen',
        changedBy: 'John Recruiter',
        changedAt: '2025-10-08T14:20:00Z',
        reason: 'Strong qualifications, moving to phone screen'
      }
    ]
  },
  
  // Add 20-30 more mock applications with varying:
  // - Different statuses (spread across all stages)
  // - Different jobs
  // - Different scores (40-95)
  // - Different experience levels
  // - Some with messages, some without
  // - Some with notes, some without
  // - Mix of recent and older applications
];

export const mockJobs = [
  {
    id: 'job-001',
    title: 'Commercial Electrician',
    company: 'BuildCo Construction',
    location: 'Austin, Texas',
    status: 'active',
    applicationCount: 12,
    pipeline: {
      new: 3,
      screen: 4,
      interview: 3,
      offer: 1,
      hired: 1
    }
  },
  // More jobs...
];

export const mockStats = {
  totalApplications: 47,
  activeApplications: 38,
  hired: 5,
  averageTimeToHire: 18, // days
  conversionRate: 0.12,
};
```

**Deliverables:**
- [ ] Mock data file created
- [ ] 20-30 diverse mock applications
- [ ] 5-10 mock jobs
- [ ] Mock stats and analytics data
- [ ] TypeScript types for all data

---

### Step 2: Build Core Navigation & Layout (Day 1-2)

**Location:** `/packages/core/features/office/`

**New Routes:**
```typescript
// Add to app/office/_layout.tsx or create new routes

office/applications/          → Applications list/Kanban view
office/applications/[id]/     → Single application detail
office/jobs/[id]/applications → Applications for specific job
office/analytics/             → Dashboard with stats
```

**Files to Create:**
```
packages/core/features/office/
├── applications/
│   ├── office-applications-screen.tsx          (Main view)
│   ├── office-application-detail-screen.tsx    (Detail view)
│   └── components/
│       ├── ApplicationsKanbanBoard.tsx         (Kanban layout)
│       ├── ApplicationsList.tsx                (List layout)
│       ├── ApplicationsFilters.tsx             (Filters)
│       └── ApplicationsStats.tsx               (Summary stats)
└── mock-data/
    └── ats-mock-data.ts                        (Mock data)
```

**Layout Component:**
```typescript
// office-applications-screen.tsx
import { useMemo, useState } from 'react'
import { mockApplications, mockJobs } from '../mock-data/ats-mock-data'
import { ApplicationsKanbanBoard } from './components/ApplicationsKanbanBoard'
import { ApplicationsList } from './components/ApplicationsList'
import { ApplicationsFilters } from './components/ApplicationsFilters'

export const OfficeApplicationsScreen = () => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [filters, setFilters] = useState({
    jobId: null,
    status: null,
    minScore: 0,
  })
  
  // Filter mock data based on filters
  const filteredApplications = useMemo(() => {
    return mockApplications.filter(app => {
      if (filters.jobId && app.job.id !== filters.jobId) return false
      if (filters.status && app.status !== filters.status) return false
      if (app.score < filters.minScore) return false
      return true
    })
  }, [filters])
  
  return (
    <YStack flex={1} padding="$4">
      <XStack justifyContent="space-between" marginBottom="$4">
        <H2>Applications</H2>
        <XStack gap="$2">
          <Button 
            size="$3"
            variant={viewMode === 'kanban' ? 'outlined' : 'ghost'}
            onPress={() => setViewMode('kanban')}
          >
            Kanban
          </Button>
          <Button 
            size="$3"
            variant={viewMode === 'list' ? 'outlined' : 'ghost'}
            onPress={() => setViewMode('list')}
          >
            List
          </Button>
        </XStack>
      </XStack>
      
      <ApplicationsFilters 
        filters={filters}
        onFiltersChange={setFilters}
        jobs={mockJobs}
      />
      
      {viewMode === 'kanban' ? (
        <ApplicationsKanbanBoard applications={filteredApplications} />
      ) : (
        <ApplicationsList applications={filteredApplications} />
      )}
    </YStack>
  )
}
```

**Deliverables:**
- [ ] Routes added to app
- [ ] Main applications screen layout
- [ ] View mode toggle (Kanban/List)
- [ ] Filter interface
- [ ] Navigation working

---

### Step 3: Build Kanban Board UI (Day 2-3)

**File:** `ApplicationsKanbanBoard.tsx`

**Features:**
- Status columns: New, Screen, Interview, Offer, Hired, Rejected
- Drag-and-drop cards between columns
- Card shows: photo, name, score, applied date
- Click card to open detail modal
- Summary count per column

```typescript
import { useMemo } from 'react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { YStack, XStack, Card, Text, Avatar } from '@app/ui'

const STATUSES = ['new', 'screen', 'interview', 'offer', 'hired', 'rejected']
const STATUS_LABELS = {
  new: 'New Applications',
  screen: 'Screening',
  interview: 'Interview',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Rejected'
}

export const ApplicationsKanbanBoard = ({ applications }) => {
  // Group applications by status
  const groupedApplications = useMemo(() => {
    return STATUSES.reduce((acc, status) => {
      acc[status] = applications.filter(app => app.status === status)
      return acc
    }, {})
  }, [applications])
  
  const handleDragEnd = (result) => {
    // For now, just console.log
    // Later: update application status via API
    console.log('Moved', result.draggableId, 'to', result.destination.droppableId)
  }
  
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <XStack gap="$3" overflow="scroll">
        {STATUSES.map(status => (
          <Droppable key={status} droppableId={status}>
            {(provided) => (
              <YStack
                ref={provided.innerRef}
                {...provided.droppableProps}
                minWidth={280}
                backgroundColor="$color2"
                borderRadius="$4"
                padding="$3"
              >
                <XStack justifyContent="space-between" marginBottom="$3">
                  <Text fontWeight="600">{STATUS_LABELS[status]}</Text>
                  <Text color="$color11">{groupedApplications[status].length}</Text>
                </XStack>
                
                <YStack gap="$2">
                  {groupedApplications[status].map((app, index) => (
                    <Draggable key={app.id} draggableId={app.id} index={index}>
                      {(provided) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          padding="$3"
                          pressStyle={{ scale: 0.98 }}
                          hoverStyle={{ backgroundColor: '$color3' }}
                          cursor="pointer"
                        >
                          <XStack gap="$3" alignItems="center">
                            <Avatar circular size="$4">
                              <Avatar.Image src={app.candidate.photo} />
                              <Avatar.Fallback>{app.candidate.name[0]}</Avatar.Fallback>
                            </Avatar>
                            
                            <YStack flex={1}>
                              <Text fontWeight="600">{app.candidate.name}</Text>
                              <Text fontSize="$2" color="$color11">
                                {app.candidate.title}
                              </Text>
                              <XStack gap="$2" marginTop="$1">
                                <Text fontSize="$2" color="$blue10">
                                  Score: {app.score}
                                </Text>
                                <Text fontSize="$2" color="$color11">
                                  {new Date(app.appliedAt).toLocaleDateString()}
                                </Text>
                              </XStack>
                            </YStack>
                          </XStack>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </YStack>
              </YStack>
            )}
          </Droppable>
        ))}
      </XStack>
    </DragDropContext>
  )
}
```

**Deliverables:**
- [ ] Kanban board component
- [ ] Status columns with counts
- [ ] Application cards designed
- [ ] Drag-and-drop working
- [ ] Hover and press states
- [ ] Responsive layout

---

### Step 4: Build Application Detail Modal (Day 3-4)

**File:** `CandidateDetailModal.tsx`

**Features:**
- Full-screen modal on mobile, side sheet on desktop
- Complete candidate profile display
- Application metadata sidebar
- Tabs: Profile, Application, Notes, Messages
- Quick actions: Advance, Reject, Message

```typescript
export const CandidateDetailModal = ({ applicationId, onClose }) => {
  const application = mockApplications.find(app => app.id === applicationId)
  const [activeTab, setActiveTab] = useState<'profile' | 'application' | 'notes' | 'messages'>('profile')
  
  return (
    <Sheet modal open={!!applicationId} onOpenChange={onClose}>
      <Sheet.Frame padding="$4" maxWidth={900} width="90%">
        {/* Header */}
        <XStack justifyContent="space-between" marginBottom="$4">
          <YStack>
            <H3>{application.candidate.name}</H3>
            <Text color="$color11">{application.candidate.title}</Text>
          </YStack>
          <Button size="$2" circular onPress={onClose}>
            ✕
          </Button>
        </XStack>
        
        {/* Quick Actions */}
        <XStack gap="$2" marginBottom="$4">
          <Button theme="green" flex={1}>
            Advance to Interview
          </Button>
          <Button theme="red" flex={1}>
            Reject
          </Button>
          <Button flex={1}>
            Send Message
          </Button>
        </XStack>
        
        {/* Score Badge */}
        <Card backgroundColor="$blue2" padding="$3" marginBottom="$4">
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontWeight="600">Application Score</Text>
            <Text fontSize="$8" fontWeight="bold" color="$blue10">
              {application.score}
            </Text>
          </XStack>
        </Card>
        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="profile">Profile</Tabs.Tab>
            <Tabs.Tab value="application">Application</Tabs.Tab>
            <Tabs.Tab value="notes">Notes ({application.notes.length})</Tabs.Tab>
            <Tabs.Tab value="messages">Messages ({application.messages.length})</Tabs.Tab>
          </Tabs.List>
          
          <Tabs.Content value="profile">
            <CandidateProfileView candidate={application.candidate} />
          </Tabs.Content>
          
          <Tabs.Content value="application">
            <ApplicationDetailsView application={application} />
          </Tabs.Content>
          
          <Tabs.Content value="notes">
            <NotesView notes={application.notes} applicationId={application.id} />
          </Tabs.Content>
          
          <Tabs.Content value="messages">
            <MessagesView messages={application.messages} applicationId={application.id} />
          </Tabs.Content>
        </Tabs>
      </Sheet.Frame>
    </Sheet>
  )
}
```

**Deliverables:**
- [ ] Detail modal component
- [ ] Tab navigation working
- [ ] Profile tab complete
- [ ] Application tab complete
- [ ] Notes tab with add/edit
- [ ] Messages tab with send
- [ ] Quick actions functional
- [ ] Mobile responsive

---

### Step 5: Build Supporting Components (Day 4-5)

**Components to Create:**

1. **CandidateProfileView** - Display full candidate profile
   - Skills with proficiency bars
   - Certifications with badges
   - Work experience timeline
   - Education history

2. **ApplicationDetailsView** - Show application specifics
   - Screening answers
   - Custom question answers
   - File attachments (view/download mock)
   - Application timeline

3. **NotesView** - Notes interface
   - List of existing notes with ratings
   - Add new note form
   - Star rating widget
   - Filter by rating

4. **MessagesView** - Message thread
   - Message list with thread view
   - Send message form
   - Message templates dropdown

5. **ApplicationsFilters** - Filter UI
   - Job selector dropdown
   - Status filter
   - Score range slider
   - Date range picker

6. **ApplicationsStats** - Summary statistics
   - Total applications
   - Breakdown by status
   - Average score
   - Conversion rate

**Deliverables:**
- [ ] All 6 components built
- [ ] Proper mock data integration
- [ ] Forms functional (locally)
- [ ] Validation messages
- [ ] Loading states
- [ ] Empty states

---

### Step 6: Build Analytics Dashboard (Day 5-6)

**File:** `office-analytics-screen.tsx`

**Features:**
- Key metrics cards
- Applications funnel chart
- Time-to-hire graph
- Source of hire breakdown
- Top performing jobs
- Recent activity feed

```typescript
export const OfficeAnalyticsScreen = () => {
  return (
    <YStack padding="$4" gap="$4">
      <H2>Analytics Dashboard</H2>
      
      {/* Key Metrics */}
      <XStack gap="$3">
        <Card flex={1} padding="$4">
          <Text color="$color11">Total Applications</Text>
          <H1>{mockStats.totalApplications}</H1>
          <Text color="$green10">↑ 12% from last month</Text>
        </Card>
        
        <Card flex={1} padding="$4">
          <Text color="$color11">Hired</Text>
          <H1>{mockStats.hired}</H1>
          <Text color="$green10">↑ 5% from last month</Text>
        </Card>
        
        <Card flex={1} padding="$4">
          <Text color="$color11">Avg. Time to Hire</Text>
          <H1>{mockStats.averageTimeToHire} days</H1>
          <Text color="$red10">↑ 2 days from last month</Text>
        </Card>
      </XStack>
      
      {/* Funnel Chart */}
      <Card padding="$4">
        <H3 marginBottom="$3">Applications Funnel</H3>
        {/* Use a charting library or custom bars */}
        <FunnelChart data={mockStats} />
      </Card>
      
      {/* More charts... */}
    </YStack>
  )
}
```

**Deliverables:**
- [ ] Analytics screen layout
- [ ] Key metrics cards
- [ ] Funnel visualization
- [ ] Time-to-hire chart
- [ ] Source breakdown chart
- [ ] Responsive grid

---

### Step 7: Polish & Iterate (Day 6-7)

**Focus Areas:**
- Animation and transitions
- Loading states
- Empty states (no applications yet)
- Error states (mock error scenarios)
- Mobile responsiveness
- Dark mode support
- Accessibility (keyboard navigation, ARIA labels)

**Testing Scenarios:**
- [ ] New employer with no applications
- [ ] Employer with 1 application
- [ ] Employer with 100+ applications
- [ ] Filter to show 0 results
- [ ] All status columns
- [ ] Drag and drop between all columns
- [ ] Open/close detail modal
- [ ] Add note and rating
- [ ] Send message
- [ ] Switch between Kanban and List view
- [ ] Test on mobile device
- [ ] Test on tablet
- [ ] Test on desktop

---

## Phase 2: Backend Wiring (LATER)

**Only start after UI is validated and approved!**

### Step 1: Finalize Schema Based on UI
- Review what data the UI actually needs
- Design database schema to match
- Create migrations (reuse 075-078 or modify)
- Add any missing fields discovered during UI development

### Step 2: Implement tRPC Endpoints
- Map each UI action to an API endpoint
- Implement queries for data fetching
- Implement mutations for updates
- Add validation and error handling

### Step 3: Replace Mock Data with Real Data
- Update components to use tRPC hooks
- Replace mock imports with API calls
- Handle loading states
- Handle error states
- Add optimistic updates

### Step 4: File Upload Integration
- Wire up actual file upload
- Use existing storage system from Phase 1
- Add progress indicators
- Handle upload errors

### Step 5: Real-time Updates (Optional)
- Add Supabase subscriptions
- Update UI when data changes
- Handle concurrent edits
- Show real-time status updates

---

## 📁 File Structure

```
packages/core/features/office/
├── applications/
│   ├── office-applications-screen.tsx
│   ├── office-application-detail-screen.tsx
│   └── components/
│       ├── ApplicationsKanbanBoard.tsx
│       ├── ApplicationsList.tsx
│       ├── StatusColumn.tsx
│       ├── ApplicationCard.tsx
│       ├── ApplicationsFilters.tsx
│       ├── ApplicationsStats.tsx
│       ├── CandidateDetailModal.tsx
│       ├── CandidateProfileView.tsx
│       ├── ApplicationDetailsView.tsx
│       ├── NotesView.tsx
│       ├── MessagesView.tsx
│       ├── QuickActionsBar.tsx
│       └── index.ts
├── analytics/
│   ├── office-analytics-screen.tsx
│   └── components/
│       ├── MetricsCards.tsx
│       ├── FunnelChart.tsx
│       ├── TimeToHireChart.tsx
│       └── index.ts
└── mock-data/
    ├── ats-mock-data.ts
    ├── mock-applications.ts
    ├── mock-candidates.ts
    └── index.ts
```

---

## ✅ Success Criteria (Phase 1 - UI Only)

### Functional Requirements
- [ ] Recruiter can view applications in Kanban board
- [ ] Recruiter can view applications in List view
- [ ] Recruiter can drag-and-drop applications between stages
- [ ] Recruiter can click application to see full details
- [ ] Recruiter can view candidate profile (skills, experience, certs)
- [ ] Recruiter can view application answers and attachments
- [ ] Recruiter can add notes and ratings
- [ ] Recruiter can send messages to candidates
- [ ] Recruiter can advance applications to next stage
- [ ] Recruiter can reject applications
- [ ] Recruiter can filter applications by job, status, score
- [ ] Recruiter can view analytics dashboard
- [ ] All features work with mock data
- [ ] All features work on web and mobile

### Non-Functional Requirements
- [ ] Smooth animations and transitions
- [ ] Fast performance (< 100ms interactions)
- [ ] Responsive on all screen sizes
- [ ] Accessible (keyboard navigation, screen readers)
- [ ] Dark mode support
- [ ] Loading states for all async actions (mocked)
- [ ] Empty states for no data scenarios
- [ ] Error states for failure scenarios (mocked)

---

## 🎯 Key Benefits of This Approach

1. **Fast Iteration** - Change UI without touching database
2. **Parallel Work** - Frontend and backend can work separately
3. **Early Feedback** - Demo to stakeholders quickly
4. **Less Risk** - Validate workflow before committing to schema
5. **Better UX** - Focus on user experience first
6. **Easier Testing** - Test UI without backend dependencies

---

## 📝 Notes

- All mock data should be **realistic** - use actual names, locations, scores
- Mock data should cover **edge cases** - empty states, errors, extreme values
- Keep mock data in **separate files** for easy replacement later
- Use **TypeScript types** that match future API shape
- Document any **assumptions** about how backend will work
- Take **screenshots** of all views for documentation
- Get **feedback early and often** from actual recruiters

---

## 🚀 Ready to Start!

**First Task:** Create `/packages/core/features/office/mock-data/ats-mock-data.ts` with 20-30 realistic mock applications.

**Then:** Build the Kanban board view using that mock data.

**Remember:** Don't worry about the backend yet - just focus on making the UI perfect!

