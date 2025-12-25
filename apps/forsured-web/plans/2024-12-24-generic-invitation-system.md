# Generic Invitation & Referral System

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a flexible, rule-based invitation system that handles all ForSured relationship types with referral tracking, personal messages, and admin-managed invitation rules.

**Architecture:** Database-driven invitation rules managed via admin UI. Invitations track both referral credit (who brought the user) and relationship establishment. Cookie + localStorage for pre-signup referral tracking. Graceful failure handling for relationship constraints.

**Tech Stack:** React, tRPC, Supabase, SendGrid, Vitest, Playwright

---

## Overview

This system replaces hardcoded invitation logic with a **rule-based architecture** that:

1. **Supports any relationship type** via admin-configurable rules
2. **Tracks referrals separately from relationships** - one user can refer another AND establish a working relationship
3. **Handles relationship constraints** gracefully (one broker per client, many contractors per project, etc.)
4. **Persists referral attribution** across signup via cookies + localStorage
5. **Enables personal messages** on any invitation

---

## Relationship Types & Constraints

| Source | Target | Relationship Type | Constraint | Notes |
|--------|--------|-------------------|------------|-------|
| Broker | Client | one-to-one | Client can only have ONE broker | Graceful failure if already has broker |
| Manager | Broker | one-to-many | Broker can work with many managers | Simple add |
| Manager | Contractor | one-to-many-via-project | Via project assignment | Uses project_subcontractors table |
| Contractor | Broker | one-to-many | Contractor can work with many brokers | Simple add |

### Constraint Handling

```
one-to-one:
  - Check if target already has relationship
  - If yes: Show message "This user already has a [role]. Would you like to notify them anyway?"
  - Still allow referral credit, just don't create relationship

one-to-many:
  - Always allow new relationship
  - Check for duplicates only

one-to-many-via-project:
  - Requires project context
  - Creates project_subcontractors record
  - Multiple projects allowed
```

---

## Database Schema

### Table: `invitation_rules`

Admin-managed rules that define what invitation types are available.

```sql
CREATE TABLE core.invitation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Rule definition
  source_role TEXT NOT NULL,       -- 'broker', 'manager', 'contractor'
  target_role TEXT NOT NULL,       -- 'client', 'broker', 'contractor'
  relationship_type TEXT NOT NULL, -- 'one-to-one', 'one-to-many', 'one-to-many-via-project'

  -- Configuration
  name TEXT NOT NULL,              -- 'Invite Client', 'Invite Contractor'
  description TEXT,                -- Admin-facing description
  email_template_id TEXT,          -- SendGrid template ID
  requires_project BOOLEAN DEFAULT false,

  -- Constraints
  constraint_message TEXT,         -- "This client already has a broker"
  allow_referral_only BOOLEAN DEFAULT true, -- Can still track referral even if constraint fails

  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(source_role, target_role)
);
```

### Table: `invitations`

All invitations go through this single table.

```sql
CREATE TABLE core.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The invitation rule being used
  rule_id UUID REFERENCES core.invitation_rules(id),

  -- Who is inviting
  inviter_id UUID REFERENCES core.users(id) NOT NULL,
  inviter_organization_id UUID REFERENCES core.organizations(id),

  -- Who is being invited (may not exist yet)
  invitee_email TEXT NOT NULL,
  invitee_user_id UUID REFERENCES core.users(id), -- Set when user signs up/accepts

  -- Project context (for project-based invitations)
  project_id UUID REFERENCES forsured.projects(id),

  -- Referral tracking
  is_referral BOOLEAN DEFAULT true,  -- Track for referral credit
  referral_code TEXT UNIQUE,          -- Unique code for this invitation

  -- Personal message
  personal_message TEXT,              -- Custom message from inviter

  -- Status
  status TEXT DEFAULT 'pending',      -- pending, accepted, declined, expired
  expires_at TIMESTAMPTZ,

  -- Constraint handling
  constraint_blocked BOOLEAN DEFAULT false, -- True if relationship constraint failed
  constraint_reason TEXT,                    -- Why it was blocked

  -- Tracking
  created_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  decline_reason TEXT,

  -- Audit
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_invitations_email ON core.invitations(invitee_email);
CREATE INDEX idx_invitations_code ON core.invitations(referral_code);
CREATE INDEX idx_invitations_status ON core.invitations(status);
```

### Table: `referrals`

Separate table to track referral credit (attribution).

```sql
CREATE TABLE core.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Referrer (who gets credit)
  referrer_id UUID REFERENCES core.users(id) NOT NULL,
  referrer_organization_id UUID REFERENCES core.organizations(id),

  -- Referred user
  referred_user_id UUID REFERENCES core.users(id) NOT NULL,

  -- Source invitation (if came from invitation)
  invitation_id UUID REFERENCES core.invitations(id),

  -- Attribution data
  referral_code TEXT,
  attribution_source TEXT,           -- 'invitation', 'link', 'cookie'

  -- Credit status
  credit_awarded BOOLEAN DEFAULT false,
  credit_awarded_at TIMESTAMPTZ,

  -- Tracking
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Prevent duplicate referral credits
  UNIQUE(referrer_id, referred_user_id)
);
```

### Table: `user_relationships`

Generic table for relationships that aren't project-specific.

```sql
CREATE TABLE core.user_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationship definition
  source_user_id UUID REFERENCES core.users(id) NOT NULL,
  target_user_id UUID REFERENCES core.users(id) NOT NULL,
  relationship_type TEXT NOT NULL,   -- 'broker_client', 'contractor_broker', etc.

  -- Source invitation
  invitation_id UUID REFERENCES core.invitations(id),

  -- Status
  status TEXT DEFAULT 'active',      -- active, removed

  -- Tracking
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Enforce uniqueness per relationship type
  UNIQUE(source_user_id, target_user_id, relationship_type)
);

CREATE INDEX idx_user_relationships_source ON core.user_relationships(source_user_id);
CREATE INDEX idx_user_relationships_target ON core.user_relationships(target_user_id);
```

---

## Referral Tracking Flow

### Step 1: Referral Link Generation

Each user can generate referral links:

```
https://forsured.com/invite?ref=ABC123&type=client
```

- `ref`: Unique code tied to the referrer
- `type`: What role they're inviting (client, broker, contractor)

### Step 2: Cookie/localStorage Persistence

When someone visits with a referral link:

```typescript
// On landing page or any page with ref param
function captureReferral() {
  const params = new URLSearchParams(window.location.search);
  const refCode = params.get('ref');
  const refType = params.get('type');

  if (refCode) {
    // Store in both cookie (7 days) AND localStorage (permanent until signup)
    document.cookie = `fs_ref=${refCode}; max-age=${7 * 24 * 60 * 60}; path=/; secure; samesite=lax`;
    localStorage.setItem('fs_referral', JSON.stringify({
      code: refCode,
      type: refType,
      timestamp: Date.now(),
      landingUrl: window.location.href
    }));
  }
}
```

### Step 3: Signup Attribution

On signup (NOT signin), check for referral:

```typescript
async function handleSignup(userData) {
  const referralData = localStorage.getItem('fs_referral');

  if (referralData) {
    const { code, type, timestamp } = JSON.parse(referralData);

    // Validate referral (max 30 days old)
    if (Date.now() - timestamp < 30 * 24 * 60 * 60 * 1000) {
      // Attach referral to signup
      await createReferral({
        referralCode: code,
        newUserId: userData.id,
        attributionSource: 'cookie'
      });
    }

    // Clear referral data after attribution
    localStorage.removeItem('fs_referral');
    document.cookie = 'fs_ref=; max-age=0; path=/';
  }
}
```

### Key Rule: Signup Only, Not Signin

Referral credit is ONLY awarded on account creation:
- First-time signup: Attribute referral
- Existing user signin: No new referral credit
- Invitation to existing user: No referral credit, but relationship still created

---

## Invitation Flows

### Flow 1: Broker Invites Client (One-to-One)

```
1. Broker clicks "Invite Client"
2. System checks invitation_rules for broker->client
3. Broker enters:
   - Client email
   - Personal message (optional)

4. System creates invitation record with:
   - is_referral: true
   - referral_code: generated
   - personal_message: broker's message

5. Email sent with:
   - Broker's personal message
   - Accept/Decline links
   - Signup link (if not registered)

6. Client receives email:

   Case A: New User
   - Clicks signup link with referral code
   - Signs up -> referral credited to broker
   - Accepts invitation -> relationship created

   Case B: Existing User, No Broker
   - Clicks accept
   - Relationship created
   - No referral credit (already existed)

   Case C: Existing User, Has Broker
   - System detects constraint
   - Shows: "You already have a broker (John Smith).
             Would you like to request a switch?"
   - Options: "Keep Current Broker" / "Request Switch"
   - If "Request Switch" -> Creates switch request, notifies both brokers
```

### Flow 2: Manager Invites Broker (One-to-Many)

```
1. Manager clicks "Invite Broker"
2. System checks invitation_rules for manager->broker
3. Manager enters:
   - Broker email
   - Personal message (optional)

4. Email sent with invitation

5. Broker receives email:

   Case A: New User
   - Signs up with referral code -> credit to manager's org
   - Accepts -> relationship created

   Case B: Existing User
   - Accepts -> relationship created (can have many managers)
   - No constraint issues
```

### Flow 3: Manager Invites Contractor to Project (One-to-Many-via-Project)

```
1. Manager opens project, clicks "Invite Subcontractor"
2. System checks invitation_rules for manager->contractor (requires_project: true)
3. Manager enters:
   - Contractor email
   - Personal message (optional)
   - Assigns to specific project

4. Invitation created with project_id

5. Email sent with project-specific context

6. Contractor receives email:
   - Shows project details
   - Accept -> Creates project_subcontractors record
   - Can be invited to multiple projects
```

### Flow 4: Contractor Invites Broker (One-to-Many)

```
1. Contractor clicks "Invite Broker"
2. System checks invitation_rules for contractor->broker
3. Contractor enters:
   - Broker email
   - Personal message (optional)

4. Email sent

5. Broker receives:
   - Accepts -> relationship created
   - Contractor can work with multiple brokers
```

---

## Graceful Failure Handling

### Constraint Detection

```typescript
async function checkRelationshipConstraint(
  ruleId: string,
  targetUserId: string
): Promise<{ allowed: boolean; reason?: string; existingRelationship?: any }> {
  const rule = await getInvitationRule(ruleId);

  if (rule.relationship_type !== 'one-to-one') {
    return { allowed: true };
  }

  // Check if target already has this type of relationship
  const existing = await supabase
    .from('user_relationships')
    .select('*, source:core.users!source_user_id(id, full_name)')
    .eq('target_user_id', targetUserId)
    .eq('relationship_type', rule.relationship_type)
    .eq('status', 'active')
    .single();

  if (existing.data) {
    return {
      allowed: false,
      reason: rule.constraint_message || `User already has a ${rule.target_role}`,
      existingRelationship: existing.data
    };
  }

  return { allowed: true };
}
```

### UI for Constraint Failures

```typescript
// InvitationResponseModal.tsx
function InvitationConstraintDialog({ invitation, constraint }) {
  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Relationship Already Exists</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p>{constraint.reason}</p>

          <div className="bg-muted p-4 rounded-lg">
            <p className="font-medium">Current {invitation.rule.target_role}:</p>
            <p>{constraint.existingRelationship.source.full_name}</p>
          </div>

          <p className="text-sm text-muted-foreground">
            You can still accept this invitation to be notified about future opportunities,
            but your current {invitation.rule.target_role} relationship will remain unchanged.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onDecline}>
            Decline Invitation
          </Button>
          <Button variant="secondary" onClick={onAcceptReferralOnly}>
            Stay Connected (No Relationship Change)
          </Button>
          {rule.allow_relationship_switch && (
            <Button onClick={onRequestSwitch}>
              Request Switch
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Admin UI for Invitation Rules

### Rules Management Page

```typescript
// /admin/invitation-rules/page.tsx
export default function InvitationRulesPage() {
  const { data: rules } = trpc.admin.invitationRules.list.useQuery();

  return (
    <AdminLayout>
      <PageHeader
        title="Invitation Rules"
        description="Configure which user types can invite others and how relationships are established"
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rule Name</TableHead>
            <TableHead>Source Role</TableHead>
            <TableHead>Target Role</TableHead>
            <TableHead>Relationship Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules?.map((rule) => (
            <TableRow key={rule.id}>
              <TableCell>{rule.name}</TableCell>
              <TableCell><Badge>{rule.source_role}</Badge></TableCell>
              <TableCell><Badge variant="outline">{rule.target_role}</Badge></TableCell>
              <TableCell>{rule.relationship_type}</TableCell>
              <TableCell>
                <Switch checked={rule.is_active} onCheckedChange={...} />
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="sm">Edit</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </AdminLayout>
  );
}
```

### Rule Editor

```typescript
// InvitationRuleEditor.tsx
function InvitationRuleEditor({ rule, onSave }) {
  return (
    <Form onSubmit={handleSubmit}>
      <FormField name="name" label="Rule Name">
        <Input placeholder="e.g., Invite Client" />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField name="source_role" label="Who Can Invite">
          <Select>
            <SelectItem value="broker">Broker</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="contractor">Contractor</SelectItem>
          </Select>
        </FormField>

        <FormField name="target_role" label="Who They Invite">
          <Select>
            <SelectItem value="client">Client</SelectItem>
            <SelectItem value="broker">Broker</SelectItem>
            <SelectItem value="contractor">Contractor</SelectItem>
          </Select>
        </FormField>
      </div>

      <FormField name="relationship_type" label="Relationship Type">
        <RadioGroup>
          <RadioGroupItem value="one-to-one">
            <div>
              <p className="font-medium">One-to-One</p>
              <p className="text-sm text-muted-foreground">
                Target can only have one of these relationships (e.g., one broker per client)
              </p>
            </div>
          </RadioGroupItem>
          <RadioGroupItem value="one-to-many">
            <div>
              <p className="font-medium">One-to-Many</p>
              <p className="text-sm text-muted-foreground">
                Target can have multiple relationships (e.g., broker works with many managers)
              </p>
            </div>
          </RadioGroupItem>
          <RadioGroupItem value="one-to-many-via-project">
            <div>
              <p className="font-medium">One-to-Many via Project</p>
              <p className="text-sm text-muted-foreground">
                Relationship is tied to a specific project
              </p>
            </div>
          </RadioGroupItem>
        </RadioGroup>
      </FormField>

      <FormField name="constraint_message" label="Constraint Message">
        <Textarea
          placeholder="Message shown when relationship constraint is violated"
        />
      </FormField>

      <FormField name="allow_referral_only" label="Allow Referral-Only">
        <Switch />
        <p className="text-sm text-muted-foreground">
          If constraint fails, still track referral credit
        </p>
      </FormField>

      <Button type="submit">Save Rule</Button>
    </Form>
  );
}
```

---

## Personal Message Feature

### Invitation Form with Personal Message

```typescript
// InviteUserModal.tsx
function InviteUserModal({ rule, onSubmit }) {
  const [email, setEmail] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');

  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{rule.name}</DialogTitle>
          <DialogDescription>
            Invite a {rule.target_role} to work with you
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <FormField label="Email Address">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter their email"
            />
          </FormField>

          <FormField label="Personal Message (Optional)">
            <Textarea
              value={personalMessage}
              onChange={(e) => setPersonalMessage(e.target.value)}
              placeholder="Add a personal note to your invitation..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-1">
              This message will be included in the invitation email
            </p>
          </FormField>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSubmit({ email, personalMessage })}>
            Send Invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Email Template with Personal Message

```typescript
// invitationEmailTemplate.ts
export function buildInvitationEmail(data: InvitationEmailData) {
  const personalMessageSection = data.personalMessage
    ? `
      <div style="background: #f0f7ff; padding: 16px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #2563eb;">
        <p style="margin: 0 0 8px 0; font-weight: 600; color: #1e40af;">
          Personal message from ${data.inviterName}:
        </p>
        <p style="margin: 0; font-style: italic; color: #374151;">
          "${data.personalMessage}"
        </p>
      </div>
    `
    : '';

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>You've Been Invited</h2>

      <p>Hi${data.inviteeName ? ` ${data.inviteeName}` : ''},</p>

      <p>
        <strong>${data.inviterName}</strong> has invited you to join ForSured
        as a <strong>${data.targetRole}</strong>.
      </p>

      ${personalMessageSection}

      <div style="margin: 32px 0; text-align: center;">
        <a href="${data.acceptUrl}" style="...">Accept Invitation</a>
        <a href="${data.declineUrl}" style="...">Decline</a>
      </div>

      ...
    </div>
  `;
}
```

---

## Implementation Tasks

### Task 1: Create Database Schema

**Files:**
- Create: `supabase/migrations/XXXXXX_generic_invitation_system.sql`

**Step 1: Write migration**

```sql
-- supabase/migrations/XXXXXX_generic_invitation_system.sql

-- Invitation Rules (admin-managed)
CREATE TABLE core.invitation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_role TEXT NOT NULL,
  target_role TEXT NOT NULL,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('one-to-one', 'one-to-many', 'one-to-many-via-project')),
  name TEXT NOT NULL,
  description TEXT,
  email_template_id TEXT,
  requires_project BOOLEAN DEFAULT false,
  constraint_message TEXT,
  allow_referral_only BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_role, target_role)
);

-- Invitations
CREATE TABLE core.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES core.invitation_rules(id),
  inviter_id UUID REFERENCES core.users(id) NOT NULL,
  inviter_organization_id UUID REFERENCES core.organizations(id),
  invitee_email TEXT NOT NULL,
  invitee_user_id UUID REFERENCES core.users(id),
  project_id UUID, -- Nullable, for project-based invitations
  is_referral BOOLEAN DEFAULT true,
  referral_code TEXT UNIQUE,
  personal_message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at TIMESTAMPTZ,
  constraint_blocked BOOLEAN DEFAULT false,
  constraint_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  decline_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_invitations_email ON core.invitations(invitee_email);
CREATE INDEX idx_invitations_code ON core.invitations(referral_code);
CREATE INDEX idx_invitations_status ON core.invitations(status);
CREATE INDEX idx_invitations_inviter ON core.invitations(inviter_id);

-- Referrals (credit tracking)
CREATE TABLE core.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES core.users(id) NOT NULL,
  referrer_organization_id UUID REFERENCES core.organizations(id),
  referred_user_id UUID REFERENCES core.users(id) NOT NULL,
  invitation_id UUID REFERENCES core.invitations(id),
  referral_code TEXT,
  attribution_source TEXT CHECK (attribution_source IN ('invitation', 'link', 'cookie')),
  credit_awarded BOOLEAN DEFAULT false,
  credit_awarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(referrer_id, referred_user_id)
);

CREATE INDEX idx_referrals_referrer ON core.referrals(referrer_id);
CREATE INDEX idx_referrals_referred ON core.referrals(referred_user_id);

-- User Relationships (non-project-based)
CREATE TABLE core.user_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_user_id UUID REFERENCES core.users(id) NOT NULL,
  target_user_id UUID REFERENCES core.users(id) NOT NULL,
  relationship_type TEXT NOT NULL,
  invitation_id UUID REFERENCES core.invitations(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'removed', 'switched')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_user_id, target_user_id, relationship_type)
);

CREATE INDEX idx_user_relationships_source ON core.user_relationships(source_user_id);
CREATE INDEX idx_user_relationships_target ON core.user_relationships(target_user_id);
CREATE INDEX idx_user_relationships_type ON core.user_relationships(relationship_type);

-- Seed default invitation rules
INSERT INTO core.invitation_rules (source_role, target_role, relationship_type, name, description, constraint_message, requires_project) VALUES
  ('broker', 'client', 'one-to-one', 'Invite Client', 'Broker invites a client to work with them', 'This client already has a broker. They can request to switch if desired.', false),
  ('manager', 'broker', 'one-to-many', 'Invite Broker', 'Manager invites a broker to their network', NULL, false),
  ('manager', 'contractor', 'one-to-many-via-project', 'Invite Subcontractor', 'Manager invites a subcontractor to a specific project', NULL, true),
  ('contractor', 'broker', 'one-to-many', 'Invite Broker', 'Contractor invites a broker to work with them', NULL, false);

-- RLS Policies
ALTER TABLE core.invitation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.user_relationships ENABLE ROW LEVEL SECURITY;

-- Invitation rules: Read for all authenticated, write for admins
CREATE POLICY "Anyone can read active rules" ON core.invitation_rules
  FOR SELECT USING (is_active = true);

-- Invitations: Users can see their own invitations (sent or received)
CREATE POLICY "Users can see own invitations" ON core.invitations
  FOR SELECT USING (
    inviter_id = auth.uid() OR
    invitee_user_id = auth.uid() OR
    invitee_email = (SELECT email FROM core.users WHERE id = auth.uid())
  );

CREATE POLICY "Users can create invitations" ON core.invitations
  FOR INSERT WITH CHECK (inviter_id = auth.uid());

CREATE POLICY "Users can update own received invitations" ON core.invitations
  FOR UPDATE USING (
    invitee_user_id = auth.uid() OR
    invitee_email = (SELECT email FROM core.users WHERE id = auth.uid())
  );

-- Referrals: Users can see referrals they made or received
CREATE POLICY "Users can see own referrals" ON core.referrals
  FOR SELECT USING (referrer_id = auth.uid() OR referred_user_id = auth.uid());

-- Relationships: Users can see relationships they're part of
CREATE POLICY "Users can see own relationships" ON core.user_relationships
  FOR SELECT USING (source_user_id = auth.uid() OR target_user_id = auth.uid());
```

**Step 2: Run migration**

```bash
supabase db push
```

**Step 3: Commit**

```bash
git add supabase/migrations/
git commit -m "feat(db): add generic invitation system schema"
```

---

### Task 2: Create Invitation Types and Service

**Files:**
- Create: `src/lib/invitations/types.ts`
- Create: `src/lib/invitations/invitationService.ts`

**Step 1: Create types**

```typescript
// src/lib/invitations/types.ts

export type RelationshipType = 'one-to-one' | 'one-to-many' | 'one-to-many-via-project';
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';
export type ReferralSource = 'invitation' | 'link' | 'cookie';

export interface InvitationRule {
  id: string;
  source_role: string;
  target_role: string;
  relationship_type: RelationshipType;
  name: string;
  description?: string;
  email_template_id?: string;
  requires_project: boolean;
  constraint_message?: string;
  allow_referral_only: boolean;
  is_active: boolean;
}

export interface Invitation {
  id: string;
  rule_id: string;
  inviter_id: string;
  inviter_organization_id?: string;
  invitee_email: string;
  invitee_user_id?: string;
  project_id?: string;
  is_referral: boolean;
  referral_code: string;
  personal_message?: string;
  status: InvitationStatus;
  expires_at?: string;
  constraint_blocked: boolean;
  constraint_reason?: string;
  created_at: string;
  accepted_at?: string;
  declined_at?: string;
  decline_reason?: string;
  metadata: Record<string, unknown>;
}

export interface CreateInvitationInput {
  ruleId: string;
  inviteeEmail: string;
  personalMessage?: string;
  projectId?: string;
  expiresInDays?: number;
}

export interface ConstraintCheckResult {
  allowed: boolean;
  reason?: string;
  existingRelationship?: {
    id: string;
    source_user: {
      id: string;
      full_name: string;
      email: string;
    };
  };
}

export interface ReferralData {
  code: string;
  type?: string;
  timestamp: number;
  landingUrl?: string;
}
```

**Step 2: Create service**

```typescript
// src/lib/invitations/invitationService.ts

import { supabase } from '../supabase';
import { auditService } from '../audit/AuditService';
import type {
  CreateInvitationInput,
  Invitation,
  InvitationRule,
  ConstraintCheckResult
} from './types';

function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export const invitationService = {
  /**
   * Get all active invitation rules
   */
  async getRules(): Promise<InvitationRule[]> {
    const { data, error } = await supabase
      .schema('core')
      .from('invitation_rules')
      .select('*')
      .eq('is_active', true)
      .order('source_role');

    if (error) throw error;
    return data || [];
  },

  /**
   * Get rules available for a specific user role
   */
  async getRulesForRole(sourceRole: string): Promise<InvitationRule[]> {
    const { data, error } = await supabase
      .schema('core')
      .from('invitation_rules')
      .select('*')
      .eq('source_role', sourceRole)
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  },

  /**
   * Check if a relationship constraint would be violated
   */
  async checkConstraint(
    ruleId: string,
    targetEmail: string
  ): Promise<ConstraintCheckResult> {
    // Get the rule
    const { data: rule, error: ruleError } = await supabase
      .schema('core')
      .from('invitation_rules')
      .select('*')
      .eq('id', ruleId)
      .single();

    if (ruleError || !rule) {
      throw new Error('Rule not found');
    }

    // Non one-to-one relationships have no constraints
    if (rule.relationship_type !== 'one-to-one') {
      return { allowed: true };
    }

    // Check if user exists
    const { data: targetUser } = await supabase
      .schema('core')
      .from('users')
      .select('id')
      .eq('email', targetEmail)
      .single();

    if (!targetUser) {
      // New user, no existing relationships
      return { allowed: true };
    }

    // Check for existing relationship of this type
    const { data: existingRel } = await supabase
      .schema('core')
      .from('user_relationships')
      .select(`
        id,
        source_user:core.users!source_user_id (
          id,
          full_name,
          email
        )
      `)
      .eq('target_user_id', targetUser.id)
      .eq('relationship_type', `${rule.source_role}_${rule.target_role}`)
      .eq('status', 'active')
      .single();

    if (existingRel) {
      return {
        allowed: false,
        reason: rule.constraint_message || `This user already has a ${rule.source_role}`,
        existingRelationship: existingRel
      };
    }

    return { allowed: true };
  },

  /**
   * Create a new invitation
   */
  async create(
    input: CreateInvitationInput,
    inviterId: string,
    organizationId?: string
  ): Promise<Invitation> {
    // Check constraint first
    const constraint = await this.checkConstraint(input.ruleId, input.inviteeEmail);

    const referralCode = generateReferralCode();
    const expiresAt = input.expiresInDays
      ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data, error } = await supabase
      .schema('core')
      .from('invitations')
      .insert({
        rule_id: input.ruleId,
        inviter_id: inviterId,
        inviter_organization_id: organizationId,
        invitee_email: input.inviteeEmail.toLowerCase(),
        project_id: input.projectId,
        referral_code: referralCode,
        personal_message: input.personalMessage,
        is_referral: true,
        expires_at: expiresAt,
        constraint_blocked: !constraint.allowed,
        constraint_reason: constraint.reason,
      })
      .select()
      .single();

    if (error) throw error;

    // Audit log
    await auditService.log({
      category: 'data_modification',
      action: 'invitation_created',
      severity: 'medium',
      user_id: inviterId,
      resource_type: 'invitation',
      resource_name: input.inviteeEmail,
      status: 'success',
      metadata: {
        invitationId: data.id,
        ruleId: input.ruleId,
        projectId: input.projectId,
        constraintBlocked: !constraint.allowed,
      },
    });

    return data;
  },

  /**
   * Accept an invitation
   */
  async accept(
    invitationId: string,
    acceptingUserId: string
  ): Promise<{ success: boolean; relationshipCreated: boolean }> {
    // Get invitation with rule
    const { data: invitation, error: fetchError } = await supabase
      .schema('core')
      .from('invitations')
      .select(`
        *,
        rule:invitation_rules (*)
      `)
      .eq('id', invitationId)
      .single();

    if (fetchError || !invitation) {
      throw new Error('Invitation not found');
    }

    if (invitation.status !== 'pending') {
      throw new Error(`Cannot accept invitation with status: ${invitation.status}`);
    }

    // Update invitation status
    const { error: updateError } = await supabase
      .schema('core')
      .from('invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        invitee_user_id: acceptingUserId,
      })
      .eq('id', invitationId);

    if (updateError) throw updateError;

    let relationshipCreated = false;

    // Create relationship if not constraint-blocked
    if (!invitation.constraint_blocked) {
      if (invitation.rule.relationship_type === 'one-to-many-via-project') {
        // Project-based relationship (use existing project_subcontractors table)
        const { error: relError } = await supabase
          .schema('forsured')
          .from('project_subcontractors')
          .insert({
            project_id: invitation.project_id,
            subcontractor_id: acceptingUserId,
            status: 'active',
            invited_by: invitation.inviter_id,
          });

        if (!relError) relationshipCreated = true;
      } else {
        // User-to-user relationship
        const { error: relError } = await supabase
          .schema('core')
          .from('user_relationships')
          .insert({
            source_user_id: invitation.inviter_id,
            target_user_id: acceptingUserId,
            relationship_type: `${invitation.rule.source_role}_${invitation.rule.target_role}`,
            invitation_id: invitationId,
          });

        if (!relError) relationshipCreated = true;
      }
    }

    // Audit log
    await auditService.log({
      category: 'data_modification',
      action: 'invitation_accepted',
      severity: 'medium',
      user_id: acceptingUserId,
      resource_type: 'invitation',
      resource_id: invitationId,
      status: 'success',
      metadata: {
        inviterId: invitation.inviter_id,
        relationshipCreated,
        constraintBlocked: invitation.constraint_blocked,
      },
    });

    return { success: true, relationshipCreated };
  },

  /**
   * Decline an invitation
   */
  async decline(
    invitationId: string,
    decliningUserId: string,
    reason?: string
  ): Promise<void> {
    const { error } = await supabase
      .schema('core')
      .from('invitations')
      .update({
        status: 'declined',
        declined_at: new Date().toISOString(),
        decline_reason: reason,
        invitee_user_id: decliningUserId,
      })
      .eq('id', invitationId);

    if (error) throw error;

    await auditService.log({
      category: 'data_modification',
      action: 'invitation_declined',
      severity: 'low',
      user_id: decliningUserId,
      resource_type: 'invitation',
      resource_id: invitationId,
      status: 'success',
      metadata: { reason },
    });
  },

  /**
   * Get pending invitations for a user (by email)
   */
  async getPendingForEmail(email: string): Promise<Invitation[]> {
    const { data, error } = await supabase
      .schema('core')
      .from('invitations')
      .select(`
        *,
        rule:invitation_rules (*),
        inviter:core.users!inviter_id (
          id,
          full_name,
          email
        ),
        project:forsured.projects (
          id,
          name
        )
      `)
      .eq('invitee_email', email.toLowerCase())
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get invitations sent by a user
   */
  async getSentByUser(userId: string): Promise<Invitation[]> {
    const { data, error } = await supabase
      .schema('core')
      .from('invitations')
      .select(`
        *,
        rule:invitation_rules (*)
      `)
      .eq('inviter_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Look up invitation by referral code
   */
  async getByReferralCode(code: string): Promise<Invitation | null> {
    const { data, error } = await supabase
      .schema('core')
      .from('invitations')
      .select(`
        *,
        rule:invitation_rules (*),
        inviter:core.users!inviter_id (
          id,
          full_name,
          email
        )
      `)
      .eq('referral_code', code.toUpperCase())
      .single();

    if (error) return null;
    return data;
  },
};
```

**Step 3: Commit**

```bash
git add src/lib/invitations/
git commit -m "feat(invitations): add types and service for generic invitation system"
```

---

### Task 3: Create Referral Tracking Utilities

**Files:**
- Create: `src/lib/referrals/referralTracking.ts`
- Create: `src/lib/referrals/useReferral.ts`

**Step 1: Create referral tracking**

```typescript
// src/lib/referrals/referralTracking.ts

import { supabase } from '../supabase';
import { auditService } from '../audit/AuditService';
import type { ReferralData } from '../invitations/types';

const COOKIE_NAME = 'fs_ref';
const STORAGE_KEY = 'fs_referral';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days
const REFERRAL_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Capture referral from URL params
 */
export function captureReferral(): void {
  if (typeof window === 'undefined') return;

  const params = new URLSearchParams(window.location.search);
  const refCode = params.get('ref');
  const refType = params.get('type');

  if (!refCode) return;

  const referralData: ReferralData = {
    code: refCode.toUpperCase(),
    type: refType || undefined,
    timestamp: Date.now(),
    landingUrl: window.location.href,
  };

  // Store in cookie (7 days, for cross-device tracking if cookies synced)
  document.cookie = `${COOKIE_NAME}=${refCode}; max-age=${COOKIE_MAX_AGE}; path=/; secure; samesite=lax`;

  // Store in localStorage (permanent until signup)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(referralData));
}

/**
 * Get stored referral data
 */
export function getStoredReferral(): ReferralData | null {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  try {
    const data: ReferralData = JSON.parse(stored);

    // Check if referral is still valid (30 days)
    if (Date.now() - data.timestamp > REFERRAL_MAX_AGE) {
      clearReferral();
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Clear referral data after attribution
 */
export function clearReferral(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(STORAGE_KEY);
  document.cookie = `${COOKIE_NAME}=; max-age=0; path=/`;
}

/**
 * Attribute referral on signup (NOT signin)
 */
export async function attributeReferralOnSignup(
  newUserId: string
): Promise<{ success: boolean; referrerId?: string }> {
  const referralData = getStoredReferral();
  if (!referralData) {
    return { success: false };
  }

  // Look up the invitation by referral code
  const { data: invitation, error: invError } = await supabase
    .schema('core')
    .from('invitations')
    .select('id, inviter_id, inviter_organization_id')
    .eq('referral_code', referralData.code)
    .single();

  if (invError || !invitation) {
    clearReferral();
    return { success: false };
  }

  // Check if referral already exists (prevent double credit)
  const { data: existing } = await supabase
    .schema('core')
    .from('referrals')
    .select('id')
    .eq('referrer_id', invitation.inviter_id)
    .eq('referred_user_id', newUserId)
    .single();

  if (existing) {
    clearReferral();
    return { success: false };
  }

  // Create referral record
  const { data: referral, error: refError } = await supabase
    .schema('core')
    .from('referrals')
    .insert({
      referrer_id: invitation.inviter_id,
      referrer_organization_id: invitation.inviter_organization_id,
      referred_user_id: newUserId,
      invitation_id: invitation.id,
      referral_code: referralData.code,
      attribution_source: 'cookie',
      credit_awarded: true,
      credit_awarded_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (refError) {
    console.error('Failed to create referral:', refError);
    return { success: false };
  }

  // Audit log
  await auditService.log({
    category: 'data_modification',
    action: 'referral_attributed',
    severity: 'medium',
    user_id: newUserId,
    resource_type: 'referral',
    resource_id: referral.id,
    status: 'success',
    metadata: {
      referrerId: invitation.inviter_id,
      referralCode: referralData.code,
      attributionSource: 'cookie',
    },
  });

  // Clear referral data
  clearReferral();

  return { success: true, referrerId: invitation.inviter_id };
}

/**
 * Get referral stats for a user
 */
export async function getReferralStats(userId: string): Promise<{
  totalReferrals: number;
  creditedReferrals: number;
  pendingInvitations: number;
}> {
  const [referralsResult, invitationsResult] = await Promise.all([
    supabase
      .schema('core')
      .from('referrals')
      .select('id, credit_awarded')
      .eq('referrer_id', userId),
    supabase
      .schema('core')
      .from('invitations')
      .select('id')
      .eq('inviter_id', userId)
      .eq('status', 'pending'),
  ]);

  const referrals = referralsResult.data || [];
  const invitations = invitationsResult.data || [];

  return {
    totalReferrals: referrals.length,
    creditedReferrals: referrals.filter(r => r.credit_awarded).length,
    pendingInvitations: invitations.length,
  };
}
```

**Step 2: Create React hook**

```typescript
// src/lib/referrals/useReferral.ts

import { useEffect } from 'react';
import { captureReferral, getStoredReferral } from './referralTracking';
import type { ReferralData } from '../invitations/types';

/**
 * Hook to capture and access referral data
 */
export function useReferral(): ReferralData | null {
  // Capture referral on mount
  useEffect(() => {
    captureReferral();
  }, []);

  return getStoredReferral();
}

/**
 * Hook to capture referral from landing page
 * Call this on your landing page or any entry point
 */
export function useReferralCapture(): void {
  useEffect(() => {
    captureReferral();
  }, []);
}
```

**Step 3: Commit**

```bash
git add src/lib/referrals/
git commit -m "feat(referrals): add referral tracking with cookie/localStorage persistence"
```

---

### Task 4: Create tRPC Invitations Router

**Files:**
- Create: `src/server/routers/invitations.ts`
- Modify: `src/server/routers/_app.ts`
- Test: `src/server/routers/__tests__/invitations.test.ts`

**Step 1: Write tests first**

```typescript
// src/server/routers/__tests__/invitations.test.ts

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { createCaller } from '../_app';
import { supabase } from '../../../lib/supabase';

describe('invitations router', () => {
  let testRuleId: string;
  let testInviterId: string;
  let testInviteeEmail: string;
  let createdInvitationIds: string[] = [];

  beforeAll(async () => {
    // Get a test rule
    const { data: rule } = await supabase
      .schema('core')
      .from('invitation_rules')
      .select('id')
      .limit(1)
      .single();

    if (!rule) throw new Error('No invitation rules found');
    testRuleId = rule.id;

    // Get a test user to act as inviter
    const { data: user } = await supabase
      .schema('core')
      .from('users')
      .select('id')
      .limit(1)
      .single();

    if (!user) throw new Error('No users found');
    testInviterId = user.id;
    testInviteeEmail = `test-${Date.now()}@example.com`;
  });

  afterAll(async () => {
    // Clean up created invitations
    if (createdInvitationIds.length > 0) {
      await supabase
        .schema('core')
        .from('invitations')
        .delete()
        .in('id', createdInvitationIds);
    }
  });

  describe('getAvailableRules', () => {
    it('should return rules for a given source role', async () => {
      const caller = createCaller({ user: { id: testInviterId } });
      const result = await caller.invitations.getAvailableRules({ sourceRole: 'broker' });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('create', () => {
    it('should create an invitation with referral code', async () => {
      const caller = createCaller({ user: { id: testInviterId } });
      const result = await caller.invitations.create({
        ruleId: testRuleId,
        inviteeEmail: testInviteeEmail,
        personalMessage: 'Welcome to ForSured!',
      });

      createdInvitationIds.push(result.id);

      expect(result.id).toBeDefined();
      expect(result.referral_code).toBeDefined();
      expect(result.referral_code.length).toBe(8);
      expect(result.personal_message).toBe('Welcome to ForSured!');
      expect(result.status).toBe('pending');
    });
  });

  describe('getPending', () => {
    it('should return pending invitations for email', async () => {
      const caller = createCaller({ user: { id: testInviterId } });
      const result = await caller.invitations.getPending({ email: testInviteeEmail });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].invitee_email).toBe(testInviteeEmail.toLowerCase());
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd apps/forsured-web && pnpm vitest run src/server/routers/__tests__/invitations.test.ts
```

**Step 3: Implement router**

```typescript
// src/server/routers/invitations.ts

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, publicProcedure } from '../trpc';
import { invitationService } from '../../lib/invitations/invitationService';
import { sendInvitationEmail } from '../../lib/email/invitationEmail';

export const invitationsRouter = router({
  /**
   * Get invitation rules available for a source role
   */
  getAvailableRules: protectedProcedure
    .input(z.object({ sourceRole: z.string() }))
    .query(async ({ input }) => {
      return invitationService.getRulesForRole(input.sourceRole);
    }),

  /**
   * Check if constraint would be violated
   */
  checkConstraint: protectedProcedure
    .input(z.object({
      ruleId: z.string().uuid(),
      inviteeEmail: z.string().email(),
    }))
    .query(async ({ input }) => {
      return invitationService.checkConstraint(input.ruleId, input.inviteeEmail);
    }),

  /**
   * Create a new invitation
   */
  create: protectedProcedure
    .input(z.object({
      ruleId: z.string().uuid(),
      inviteeEmail: z.string().email(),
      personalMessage: z.string().max(1000).optional(),
      projectId: z.string().uuid().optional(),
      expiresInDays: z.number().min(1).max(90).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const invitation = await invitationService.create(
        input,
        ctx.user.id,
        ctx.organizationId
      );

      // Send invitation email
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        await sendInvitationEmail({
          recipientEmail: input.inviteeEmail,
          recipientName: '', // We may not know their name yet
          inviterName: ctx.user.full_name || ctx.user.email,
          inviterOrganization: ctx.organizationName,
          personalMessage: input.personalMessage,
          referralCode: invitation.referral_code,
          acceptUrl: `${baseUrl}/invite/${invitation.referral_code}?action=accept`,
          declineUrl: `${baseUrl}/invite/${invitation.referral_code}?action=decline`,
        });
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
        // Don't fail the invitation creation if email fails
      }

      return invitation;
    }),

  /**
   * Get pending invitations for an email
   */
  getPending: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      return invitationService.getPendingForEmail(input.email);
    }),

  /**
   * Get invitations sent by current user
   */
  getSent: protectedProcedure
    .query(async ({ ctx }) => {
      return invitationService.getSentByUser(ctx.user.id);
    }),

  /**
   * Get invitation by referral code (public, for landing pages)
   */
  getByCode: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      const invitation = await invitationService.getByReferralCode(input.code);
      if (!invitation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invitation not found' });
      }
      return invitation;
    }),

  /**
   * Accept an invitation
   */
  accept: protectedProcedure
    .input(z.object({ invitationId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      return invitationService.accept(input.invitationId, ctx.user.id);
    }),

  /**
   * Decline an invitation
   */
  decline: protectedProcedure
    .input(z.object({
      invitationId: z.string().uuid(),
      reason: z.string().max(500).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await invitationService.decline(input.invitationId, ctx.user.id, input.reason);
      return { success: true };
    }),
});
```

**Step 4: Add to app router**

```typescript
// In src/server/routers/_app.ts
import { invitationsRouter } from './invitations';

export const appRouter = router({
  // ... existing routers
  invitations: invitationsRouter,
});
```

**Step 5: Run tests and commit**

```bash
cd apps/forsured-web && pnpm vitest run src/server/routers/__tests__/invitations.test.ts
git add src/server/routers/
git commit -m "feat(api): add generic invitations tRPC router"
```

---

### Task 5: Create Admin Invitation Rules UI

**Files:**
- Create: `src/app/admin/invitation-rules/page.tsx`
- Create: `src/components/Admin/InvitationRuleEditor.tsx`

(Implementation details in earlier sections - follow same TDD pattern)

---

### Task 6: Create Universal Invite Modal

**Files:**
- Create: `src/components/Invitations/InviteModal.tsx`
- Create: `src/components/Invitations/InviteButton.tsx`

(Implementation details in earlier sections - follow same TDD pattern)

---

### Task 7: Create Invitation Landing Page

**Files:**
- Create: `src/app/invite/[code]/page.tsx`

```typescript
// src/app/invite/[code]/page.tsx

'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { trpc } from '../../../lib/trpc';
import { useAuth } from '../../../hooks/useAuth';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';

export default function InvitationPage() {
  const { code } = useParams<{ code: string }>();
  const searchParams = useSearchParams();
  const action = searchParams.get('action');
  const { user, isLoading: authLoading } = useAuth();

  const { data: invitation, isLoading } = trpc.invitations.getByCode.useQuery(
    { code },
    { enabled: !!code }
  );

  const acceptMutation = trpc.invitations.accept.useMutation();
  const declineMutation = trpc.invitations.decline.useMutation();

  if (isLoading || authLoading) {
    return <div className="container py-12">Loading...</div>;
  }

  if (!invitation) {
    return (
      <div className="container py-12">
        <Card>
          <CardHeader>
            <CardTitle>Invitation Not Found</CardTitle>
            <CardDescription>
              This invitation may have expired or been cancelled.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // If not logged in, show signup/signin options
  if (!user) {
    return (
      <div className="container py-12 max-w-lg mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>You've Been Invited!</CardTitle>
            <CardDescription>
              {invitation.inviter?.full_name} has invited you to join ForSured.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {invitation.personal_message && (
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm italic">"{invitation.personal_message}"</p>
                <p className="text-xs text-muted-foreground mt-2">
                  — {invitation.inviter?.full_name}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Button asChild>
                <a href={`/signup?ref=${code}`}>Create Account</a>
              </Button>
              <Button variant="outline" asChild>
                <a href={`/signin?ref=${code}&redirect=/invite/${code}`}>
                  I already have an account
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is logged in, show accept/decline
  return (
    <div className="container py-12 max-w-lg mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Project Invitation</CardTitle>
          <CardDescription>
            From {invitation.inviter?.full_name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {invitation.personal_message && (
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm italic">"{invitation.personal_message}"</p>
            </div>
          )}

          {invitation.constraint_blocked && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
              <p className="text-sm text-amber-800">{invitation.constraint_reason}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => declineMutation.mutate({ invitationId: invitation.id })}
              disabled={declineMutation.isPending}
            >
              Decline
            </Button>
            <Button
              onClick={() => acceptMutation.mutate({ invitationId: invitation.id })}
              disabled={acceptMutation.isPending}
            >
              Accept Invitation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Migration from Existing System

The existing `project_subcontractors` table and `InviteSubcontractorModal` continue to work. This system:

1. **Adds new tables** without modifying existing ones
2. **project_subcontractors** is used for `one-to-many-via-project` relationships
3. **user_relationships** is used for non-project relationships
4. **Existing invitation flows** can be migrated incrementally

---

## Verification Checklist

- [x] Database schema created with all tables and indexes
- [x] Invitation rules seeded for all relationship types
- [x] Invitation service handles all CRUD operations
- [x] Referral tracking persists across signup
- [x] Constraint checking works for one-to-one relationships
- [x] Personal messages included in emails
- [ ] Admin UI allows rule management
- [ ] Landing page handles logged-in and anonymous users
- [x] Audit logging captures all invitation events
- [ ] Tests cover happy path and edge cases

---

**Plan Created:** 2024-12-24
**Author:** Claude (with writing-plans skill)
**Status:** In Progress (Tasks 1-4 Complete, Tasks 5-8 Pending)

## Implementation Progress

| Task | Description | Status |
|------|-------------|--------|
| 1 | Database Schema | ✅ Complete |
| 2 | Invitation Service | ✅ Complete |
| 3 | Referral Tracking | ✅ Complete |
| 4 | tRPC Router | ✅ Complete |
| 5 | Admin UI | ⏳ Pending |
| 6 | Universal Invite Modal | ⏳ Pending |
| 7 | Invitation Landing Page | ⏳ Pending |
| 8 | Dashboard Integration | ⏳ Pending |

**Last Updated:** 2024-12-24
**Commit:** 8552a515 - feat(invitations): implement generic invitation system (Tasks 1-4)
