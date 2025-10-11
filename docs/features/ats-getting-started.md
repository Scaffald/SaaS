# Getting Started: ATS UI Development

**Goal:** Build the recruiter interface with mock data in 1-2 weeks

---

## ⚡ Quick Start (5 minutes)

### 1. The Mock Data is Ready
✅ Already created: `/packages/core/features/office/mock-data/ats-mock-data.ts`

This file contains:
- 3 sample applications (add 17+ more as needed)
- TypeScript types for all data
- Helper functions for filtering
- Mock mutation functions

### 2. Start Your Dev Server
```bash
cd /Users/clay/Development/SCF-Neue

# Start Expo (mobile/web)
pnpm dev

# Or start web only
pnpm web
```

### 3. Create Your First Component

**File:** `/packages/core/features/office/applications/office-applications-screen.tsx`

```typescript
import { YStack, H2, Text } from '@app/ui'
import { mockApplications } from '../mock-data/ats-mock-data'

export const OfficeApplicationsScreen = () => {
  return (
    <YStack padding="$4">
      <H2>Applications ({mockApplications.length})</H2>
      
      {mockApplications.map(app => (
        <Text key={app.id}>
          {app.candidate.name} - {app.status} - Score: {app.score}
        </Text>
      ))}
    </YStack>
  )
}
```

### 4. Add the Route

**File:** `/Users/clay/Development/SCF-Neue/apps/expo/app/office/_layout.tsx`

Add the route to your office section (or create a new route file).

### 5. View It!

Open your browser to `http://localhost:8081` (or wherever your dev server runs) and navigate to the office/applications route.

**You should see a list of mock applications!** 🎉

---

## 📋 What to Build Next

### Day 1: Basic Kanban Board
**Goal:** Display applications in columns by status

```typescript
// ApplicationsKanbanBoard.tsx
import { XStack, YStack, Text, Card } from '@app/ui'
import { mockApplications } from '../mock-data/ats-mock-data'

const STATUSES = ['new', 'screen', 'interview', 'offer', 'hired']

export const ApplicationsKanbanBoard = () => {
  return (
    <XStack gap="$3">
      {STATUSES.map(status => {
        const apps = mockApplications.filter(app => app.status === status)
        
        return (
          <YStack key={status} minWidth={280}>
            <Text fontWeight="600">{status.toUpperCase()} ({apps.length})</Text>
            
            {apps.map(app => (
              <Card key={app.id} padding="$3" marginTop="$2">
                <Text>{app.candidate.name}</Text>
                <Text fontSize="$2" color="$gray11">Score: {app.score}</Text>
              </Card>
            ))}
          </YStack>
        )
      })}
    </XStack>
  )
}
```

### Day 2: Application Cards
Make the cards look nice with avatars, badges, etc.

### Day 3: Detail Modal
Click a card to open full candidate profile.

### Day 4-5: Tabs and Actions
Add tabs for Profile, Application, Notes, Messages.

### Day 6-7: Filters and Search
Add job filter, status filter, score range.

### Day 8-10: Polish
Animations, mobile responsive, dark mode.

---

## 🎨 UI Components to Use

### Tamagui Components (Already Available)
```typescript
import {
  YStack,      // Vertical stack
  XStack,      // Horizontal stack
  Card,        // Card container
  Button,      // Button
  Text,        // Text
  H1, H2, H3,  // Headings
  Input,       // Text input
  Select,      // Dropdown
  Avatar,      // Profile photo
  Badge,       // Small badge/tag
  Tabs,        // Tab navigation
  Sheet,       // Modal/drawer
  ScrollView,  // Scrollable area
} from '@app/ui'
```

### Drag and Drop
For drag-and-drop functionality, install:
```bash
pnpm add react-beautiful-dnd
pnpm add -D @types/react-beautiful-dnd
```

---

## 📝 Tips for Fast Development

### 1. Start Simple
- Don't worry about perfection initially
- Get something on screen first
- Iterate from there

### 2. Use Console Logs
```typescript
const handleCardClick = (appId: string) => {
  console.log('Clicked application:', appId)
  // TODO: Open detail modal
}
```

### 3. Mock Everything
```typescript
const handleAdvanceStage = (appId: string) => {
  console.log('Would advance application:', appId)
  // In real app: call API
  // For now: just log it
}
```

### 4. Add TODO Comments
```typescript
// TODO: Replace with real API call
const applications = mockApplications

// TODO: Add loading spinner
// TODO: Add error handling
// TODO: Add empty state
```

### 5. Test Different Scenarios

Edit the mock data to test:
```typescript
// Empty state
export const mockApplications: MockApplication[] = []

// One application
export const mockApplications: MockApplication[] = [mockApplications[0]]

// Lots of applications
export const mockApplications: MockApplication[] = [
  ...Array(50).fill(null).map((_, i) => ({
    ...mockApplications[0],
    id: `app-${i}`,
    candidate: { ...mockApplications[0].candidate, name: `Candidate ${i}` }
  }))
]
```

---

## 🚫 What NOT to Do

### ❌ Don't Start with Backend
- Don't create tRPC endpoints yet
- Don't create database migrations yet
- Don't wire up real data yet
- **Focus on UI only!**

### ❌ Don't Optimize Too Early
- Don't worry about performance yet
- Don't add caching yet
- Don't add pagination yet
- **Get it working first, optimize later**

### ❌ Don't Over-Engineer
- Keep components simple
- One component per file
- Don't create complex state management yet
- **KISS: Keep It Simple, Stupid**

---

## ✅ When is UI "Done"?

The UI is ready to wire up when:

- [ ] All screens are built and navigable
- [ ] All components render with mock data
- [ ] Filters and search work (on mock data)
- [ ] Modals and sheets open/close
- [ ] Forms have validation (client-side only)
- [ ] Mobile responsive on all screens
- [ ] Looks polished and professional
- [ ] Stakeholders approve the UX flow
- [ ] You can demo the entire workflow

**Then and only then:** Start wiring up the backend!

---

## 🔌 Later: Wiring Up Backend

Once UI is approved, you'll:

### 1. Replace Mock Imports
```typescript
// BEFORE (mock data)
import { mockApplications } from '../mock-data/ats-mock-data'

// AFTER (real data)
import { api } from '@app/core/utils/api'
const { data: applications } = api.applications.getAll.useQuery()
```

### 2. Replace Mock Functions
```typescript
// BEFORE (mock function)
const handleAdvance = (id: string) => {
  console.log('Advancing', id)
}

// AFTER (real mutation)
const advanceMutation = api.applications.advance.useMutation()
const handleAdvance = (id: string) => {
  advanceMutation.mutate({ id, status: 'interview' })
}
```

### 3. Add Loading States
```typescript
const { data, isLoading } = api.applications.getAll.useQuery()

if (isLoading) return <Spinner />
```

### 4. Add Error Handling
```typescript
const { data, error } = api.applications.getAll.useQuery()

if (error) return <ErrorMessage error={error} />
```

---

## 📚 Helpful Resources

### Documentation
- [ATS Implementation Revised](./ats-implementation-revised.md) - Full UI-first plan
- [ATS Mock Data](../../packages/core/features/office/mock-data/ats-mock-data.ts) - Your data file
- [Tamagui Docs](https://tamagui.dev/docs) - UI components
- [React Beautiful DnD](https://github.com/atlassian/react-beautiful-dnd) - Drag and drop

### Examples in Codebase
- `/packages/core/features/discover/` - Job discovery UI (for reference)
- `/packages/core/features/applications/` - Candidate application flow (for reference)
- `/packages/ui/src/components/` - Reusable UI components

---

## 🎯 Your Mission

**Build a beautiful, functional ATS recruiter interface that works 100% with mock data.**

No database. No API. Just UI.

When stakeholders say "This is perfect!" - **then** we wire it up.

---

**Ready? Start with that Kanban board!** 🚀

```bash
# In your terminal
cd /Users/clay/Development/SCF-Neue
pnpm dev

# In your editor
# Create: packages/core/features/office/applications/office-applications-screen.tsx
# Import: mockApplications
# Render: List of applications
# Go! 🎨
```

