-- Migration: Seed help_articles with initial content
-- REQ: Phase 9 - Production Readiness (Help Articles DB Migration)
-- Date: 2025-12-02

-- =============================================================================
-- OVERVIEW
-- =============================================================================
-- This migration seeds the forsured.help_articles table with the initial
-- help documentation content that was previously stored in-memory in
-- helpArticleService.ts.
-- =============================================================================

-- Seed help articles
INSERT INTO forsured.help_articles (slug, title, content, user_types, category, sort_order) VALUES

-- =============================================================================
-- GC ARTICLES
-- =============================================================================

('getting-started', 'Getting Started as a General Contractor', E'# Getting Started as a General Contractor

Welcome to ForSured! This guide will help you set up your account and start
managing subcontractor compliance in minutes.

## Step 1: Complete Your Company Profile

After signing up, you''ll be guided through setting up your company profile:

1. **Company Information**
   - Enter your company name and address
   - Add your phone number
   - Upload your company logo (optional)

2. **Default Insurance Requirements**
   - Set your standard GL limits (e.g., $1M per occurrence / $2M aggregate)
   - Configure Workers'' Comp requirements
   - Set Auto Liability requirements
   - Specify if you require Additional Insured endorsements
   - Specify if you require Waiver of Subrogation

## Step 2: Create Your First Project

1. Click **"New Project"** from your dashboard
2. Enter the project details:
   - Project name
   - Job site address
   - Start and end dates
3. Customize insurance requirements (or use your defaults)
4. Click **"Create Project"**

## Step 3: Invite Contractors

1. Open your project
2. Click **"Invite Contractor"**
3. Enter the contractor''s email address
4. They''ll receive an invitation to join ForSured and your project

## What Happens Next?

- Contractors accept your invitation
- They upload their certificates of insurance (COIs)
- ForSured automatically validates compliance
- You see real-time compliance status on your dashboard

## Need Help?

- **Video**: [Watch the 3-minute quick start guide](#)
- **FAQ**: [Common questions answered](/gc/help/faq)
- **Support**: [Contact us](/support)', ARRAY['gc'], 'getting-started', 1),

('dashboard', 'Dashboard Overview (GC)', E'# Dashboard Overview (General Contractor)

Your dashboard is your central hub for managing all things subcontractor compliance.
Here''s a quick look at what you''ll find:

## Key Metrics

- **Total Projects**: Number of active and past projects.
- **Subcontractors**: Overview of your active subcontractor relationships.
- **Compliance Score**: Your overall compliance health at a glance.
- **Pending Tasks**: Any outstanding actions you need to take.

## Projects Section

Quickly access your projects, view their individual compliance statuses,
and dive into project-specific details.

## Upcoming Deadlines & Alerts

Stay on top of critical dates for COI expirations, task due dates, and
any compliance issues that require your attention.

## Quick Actions

Easily create new projects, invite subcontractors, or access help resources
directly from your dashboard.

## Need More Detail?

- [Managing Projects](/gc/help/projects)
- [Working with Contractors](/gc/help/contractors)', ARRAY['gc'], 'dashboard', 2),

('project-management', 'Managing Projects (GC)', E'# Managing Projects

Projects are the foundation of ForSured. Each project represents a job site
where you need to track subcontractor compliance.

## Creating a Project

1. From your dashboard, click **"+ New Project"**
2. Fill in the project details:
   - **Project Name**: A descriptive name (e.g., "Downtown Tower Phase 2")
   - **Address**: The job site location
   - **Start Date**: When work begins
   - **End Date**: Expected completion (optional)

3. **Set Insurance Requirements**
   - Use your default requirements, or
   - Customize for this specific project

4. Click **"Create Project"**

## Project Dashboard

Each project has its own dashboard showing:

- **Compliance Score**: Overall compliance percentage
- **Contractor List**: All contractors assigned to this project
- **Pending Tasks**: Action items that need attention
- **Recent Activity**: Latest updates and document uploads

## Adding Contractors to a Project

### Invite New Contractor
1. Click **"Invite Contractor"**
2. Enter their email address
3. They''ll receive an invitation to:
   - Create a ForSured account (if new)
   - Join your project
   - Upload required documents

### Add Existing Contractor
1. Click **"Add Contractor"**
2. Search for contractors already in ForSured
3. Select and add them to your project

## Managing Requirements

You can adjust insurance requirements at any time:

1. Go to **Project Settings** > **Requirements**
2. Modify limits, coverage types, or endorsements
3. Save changes

> **Note**: Changing requirements may affect contractor compliance status.
> Contractors will be notified of new requirements.

## Project Status

Projects can be in different states:

| Status | Description |
|--------|-------------|
| **Planning** | Project created, not yet active |
| **Active** | Work in progress |
| **Completed** | Project finished |
| **Archived** | Hidden from main view |

## Archiving Projects

When a project is complete:

1. Go to **Project Settings**
2. Click **"Archive Project"**
3. Archived projects are hidden but can be accessed from **All Projects**', ARRAY['gc'], 'project-management', 3),

('contractors', 'Working with Contractors (GC)', E'# Working with Contractors

Your contractors are at the heart of your compliance workflow. ForSured makes it easy to manage all your subcontractor relationships.

## Inviting New Contractors

1. Navigate to your project or click **"Invite Contractor"** from the dashboard
2. Enter the contractor''s email address
3. Optionally add a personal message
4. Click **"Send Invitation"**

The contractor will receive an email with instructions to:
- Create their ForSured account (if new)
- Join your project
- Upload required documentation

## Viewing Contractor Status

From your dashboard or project page, you can see:

| Status | Meaning |
|--------|---------|
| ✅ Compliant | All requirements met |
| ⚠️ Warning | Some items need attention |
| 🔴 Non-Compliant | Critical issues present |
| ⏳ Pending | Awaiting document upload |

## Managing Contractor Requirements

Each contractor can have project-specific requirements:

1. Click on a contractor''s name
2. Go to **"Requirements"** tab
3. Adjust limits or add/remove coverage types
4. Save changes

## Removing Contractors

To remove a contractor from a project:

1. Open the project
2. Find the contractor
3. Click **"Remove from Project"**

> **Note**: This doesn''t delete their account—they can be re-added later.

## Communication

Send reminders or messages:
- Click **"Send Reminder"** to prompt for document updates
- Use **"Message"** for custom communications', ARRAY['gc'], 'contractors', 4),

('compliance', 'Understanding Compliance (GC)', E'# Understanding Compliance

ForSured automatically tracks whether your contractors meet your insurance requirements.

## Compliance Scores

Each contractor has a compliance score based on:

- **Coverage verification**: Do their policies meet your limits?
- **Document validity**: Are their COIs current?
- **Endorsements**: Are required endorsements present?

### Score Breakdown

| Score | Status | Action |
|-------|--------|--------|
| 100% | ✅ Compliant | None needed |
| 70-99% | ⚠️ Warning | Review issues |
| 50-69% | 🟠 At Risk | Address soon |
| <50% | 🔴 Critical | Immediate action |

## Common Compliance Issues

### Expired Documents
- Certificate has passed expiration date
- **Fix**: Contractor uploads renewed COI

### Insufficient Limits
- Coverage amounts below requirements
- **Fix**: Contractor increases coverage or you adjust requirements

### Missing Endorsements
- Additional Insured or Waiver of Subrogation not included
- **Fix**: Contractor requests endorsement from their agent

## Automated Alerts

ForSured sends notifications:

| Alert | When | Who |
|-------|------|-----|
| Expiring Soon | 30 days before | GC + Contractor |
| Expired | On expiration | GC + Contractor |
| Status Change | When compliance drops | GC |

## Taking Action

- **Send Reminder**: Prompt contractor to update documents
- **Adjust Requirements**: Lower limits if appropriate
- **Document Exception**: Note any approved variances', ARRAY['gc'], 'compliance', 5),

('documents', 'Document Management (GC)', E'# Document Management

As a GC, you review and approve contractor-submitted documents.

## Reviewing Documents

1. Go to **Documents** from your dashboard
2. Filter by status: Pending Review, Approved, Rejected
3. Click a document to view details

## Document Details View

When reviewing a COI, you''ll see:

- **Policy Information**: Carrier, policy number, dates
- **Coverage Limits**: Per occurrence, aggregate, etc.
- **Named Insureds**: Who is covered
- **Additional Insureds**: If your company is listed
- **Endorsements**: Special provisions

## Approving Documents

If the document meets requirements:

1. Review all extracted information
2. Verify limits meet your requirements
3. Check endorsements are present
4. Click **"Approve"**

## Rejecting Documents

If there are issues:

1. Click **"Reject"**
2. Select the reason(s):
   - Insufficient limits
   - Missing endorsement
   - Expired
   - Wrong certificate type
   - Other (add note)
3. Add any comments for the contractor
4. Click **"Submit Rejection"**

The contractor will be notified and can upload a corrected document.

## Bulk Actions

For multiple documents:
1. Check the boxes next to documents
2. Use **"Bulk Actions"** menu
3. Approve or request updates in batch', ARRAY['gc'], 'documents', 6),

('faq', 'Frequently Asked Questions (GC)', E'# Frequently Asked Questions

## Account & Setup

**Q: How do I change my company information?**
A: Go to **Settings** > **Company Profile** to update your company name, address, and logo.

**Q: Can I have multiple users from my company?**
A: Yes! Go to **Settings** > **Team Members** to invite colleagues with different permission levels.

**Q: How do I set default insurance requirements?**
A: Go to **Settings** > **Insurance Defaults** to configure requirements that apply to all new projects.

## Projects

**Q: Can I copy requirements from one project to another?**
A: Yes, when creating a new project, select "Copy from existing project" and choose the source.

**Q: How do I archive a completed project?**
A: Open the project, go to **Settings**, and click **"Archive Project"**. Archived projects remain accessible in your history.

## Contractors

**Q: What happens when I invite a contractor who''s already on ForSured?**
A: They''ll receive an invitation to join your project. Their existing documents will be checked against your requirements.

**Q: Can I see a contractor''s compliance across all my projects?**
A: Yes! Click on the contractor''s name to see their company profile with status across all shared projects.

## Compliance

**Q: Why did a contractor''s status change to non-compliant?**
A: Common reasons: document expired, policy limits changed, or you updated your requirements. Check their profile for details.

**Q: Can I approve a contractor with minor compliance issues?**
A: You can add exceptions for specific items. Go to the contractor''s profile and click **"Add Exception"** with documentation.

## Documents

**Q: What file formats do you accept?**
A: PDF is recommended. We also accept JPG, PNG, and TIFF files.

**Q: How does automatic extraction work?**
A: Our AI reads uploaded COIs to extract policy details automatically. Always verify the extracted information is correct.', ARRAY['gc'], 'faq', 7),

-- =============================================================================
-- CONTRACTOR ARTICLES
-- =============================================================================

('getting-started', 'Getting Started as a Contractor', E'# Getting Started as a Contractor

Welcome to ForSured! This guide will help you get compliant and stay
compliant with your general contractors'' insurance requirements.

## How ForSured Works

1. **GC invites you** to their project
2. **You upload** your certificates of insurance (COIs)
3. **ForSured validates** your coverage automatically
4. **You stay notified** when documents need renewal

## Step 1: Accept Your Invitation

When a GC invites you:

1. Check your email for the invitation
2. Click the link to create your ForSured account
3. Complete your company profile

## Step 2: Complete Your Profile

Add your company information:

- Company name and address
- Trade/specialty
- Insurance carrier and agent information

## Step 3: Upload Your COIs

1. Go to **Documents** in your dashboard
2. Click **"+ Upload Document"**
3. Select document type:
   - General Liability
   - Workers'' Compensation
   - Commercial Auto
   - Umbrella/Excess
4. Choose your file (PDF recommended)
5. Click **"Upload"**

### Automatic Extraction

ForSured automatically reads your COI to extract:

- Policy numbers
- Effective and expiration dates
- Coverage limits
- Named insureds
- Additional insureds

> **Review the extracted information** to ensure accuracy.
> You can manually edit any fields if needed.

## Step 4: Monitor Your Tasks

Your dashboard shows:

- **Pending Tasks**: Actions you need to take
- **Upcoming Expirations**: COIs expiring soon
- **Project Status**: Your compliance status per project

## Tips for Staying Compliant

1. **Upload early**: Don''t wait until the last minute
2. **Check requirements**: Each project may have different limits
3. **Watch for expirations**: Renew 30+ days before expiration
4. **Keep your broker informed**: They can help meet requirements', ARRAY['contractor'], 'getting-started', 1),

('dashboard', 'Dashboard Overview (Contractor)', E'# Dashboard Overview

Your contractor dashboard is your command center for staying compliant.

## Key Sections

### Tasks
See all pending compliance tasks at a glance:
- Documents needing upload
- Expiring certificates
- GC requests

### Projects
View all projects you''re part of:
- Project name and GC
- Your compliance status
- Required documents

### Documents
Quick access to:
- Recently uploaded docs
- Expiring soon
- Pending review

### Compliance Score
Your overall health across all projects:
- 100% = Fully compliant everywhere
- Lower scores show where attention is needed

## Quick Actions

From your dashboard, you can:
- **Upload Document**: Add a new COI
- **View Task**: See what needs attention
- **Contact GC**: Message a general contractor

## Notifications

The bell icon shows:
- New project invitations
- Task reminders
- Document status updates
- Expiration warnings', ARRAY['contractor'], 'dashboard', 2),

('tasks', 'Managing Tasks (Contractor)', E'# Managing Tasks

Tasks keep you on track with compliance requirements.

## Task Types

| Type | Description | Priority |
|------|-------------|----------|
| 📄 Upload Required | New document needed | High |
| 🔄 Renewal Due | Certificate expiring | High |
| ⚠️ Compliance Issue | Problem with existing doc | Medium |
| 📝 Review Request | GC needs information | Medium |

## Working Through Tasks

### Step 1: View Task Details
Click any task to see:
- What''s needed
- Which project it''s for
- Due date
- Specific requirements

### Step 2: Take Action
Most tasks have a clear action:
- **Upload**: Attach your document
- **Update**: Provide new information
- **Review**: Check and confirm details

### Step 3: Submit
After completing the action, the task moves to "Pending Review" until the GC approves.

## Task Priorities

Focus on tasks in this order:
1. 🔴 **Overdue**: Past deadline
2. 🟠 **Due Soon**: Within 7 days
3. 🟡 **Upcoming**: Within 30 days
4. 🟢 **Future**: More than 30 days out

## Notifications

You''ll receive reminders:
- 30 days before expiration
- 14 days before expiration
- 7 days before expiration
- On expiration day', ARRAY['contractor'], 'tasks', 3),

('documents', 'Document Management (Contractor)', E'# Document Management

Your insurance documents are the key to staying compliant.

## Uploading Documents

1. Click **"+ Upload Document"**
2. Select document type:
   - General Liability
   - Workers'' Compensation
   - Commercial Auto
   - Umbrella/Excess
   - Professional Liability
3. Choose your file (PDF recommended)
4. Click **"Upload"**

## Automatic Extraction

ForSured reads your COI to extract:
- Policy numbers
- Effective dates
- Expiration dates
- Coverage limits
- Named insureds
- Additional insureds

**Important**: Always review extracted information for accuracy.

## Document Status

| Status | Meaning |
|--------|---------|
| ✅ Valid | Current and approved |
| ⏳ Pending | Awaiting GC review |
| ⚠️ Expiring | Within 30 days |
| 🔴 Expired | Past expiration |
| ❌ Rejected | GC found issues |

## Renewing Documents

When a COI expires:

1. Get your renewed certificate from your agent
2. Go to **Documents**
3. Find the expiring document
4. Click **"Upload Renewal"**
5. Select the new certificate

Your old document is archived automatically.

## Tips for Success

- **Upload early**: Don''t wait for deadlines
- **Use PDF format**: Best for automatic extraction
- **Complete certificates**: Include all pages
- **Check requirements**: Each GC may need different limits', ARRAY['contractor'], 'documents', 4),

('faq', 'Frequently Asked Questions (Contractor)', E'# Frequently Asked Questions

## Getting Started

**Q: How do I accept a project invitation?**
A: Click the link in your invitation email. If you''re new to ForSured, you''ll create an account first. If you already have an account, the project will be added automatically.

**Q: Can I be on multiple projects with different GCs?**
A: Yes! Each project appears separately on your dashboard with its own requirements.

## Documents

**Q: What file format should I use?**
A: PDF is strongly recommended. It works best with our automatic extraction.

**Q: My document was rejected. What do I do?**
A: Check the rejection reason, contact your insurance agent if needed, and upload a corrected document.

**Q: How far in advance should I upload renewals?**
A: We recommend at least 30 days before expiration to allow time for review.

## Insurance Requirements

**Q: The GC''s requirements are higher than my current coverage. What do I do?**
A: Contact your insurance agent to discuss increasing your limits. Some GCs may grant exceptions for specific projects.

**Q: What is "Additional Insured"?**
A: This endorsement adds the GC as a protected party on your policy. Your agent can add this to your policy.

**Q: What is "Waiver of Subrogation"?**
A: This prevents your insurance company from pursuing claims against the GC. Request this endorsement from your agent.

## Account

**Q: Can I add my insurance broker to help manage documents?**
A: Yes! Go to **Settings** > **Broker Access** and send them an invitation.

**Q: How do I update my company information?**
A: Go to **Settings** > **Company Profile** to make changes.', ARRAY['contractor'], 'faq', 5),

-- =============================================================================
-- BROKER ARTICLES
-- =============================================================================

('getting-started', 'Getting Started as a Broker', E'# Getting Started as a Broker

Welcome to ForSured! As a broker, you can help your contractor clients
stay compliant with GC insurance requirements.

## Broker Access

Broker accounts are invite-only. You received an invitation from ForSured
because:

- A contractor client requested broker access
- You work with contractors who use ForSured
- You were invited by ForSured directly

## Your Dashboard

As a broker, you see:

- **All your clients** in one place
- **Compliance status** across all projects
- **Expiring policies** that need attention
- **Document requests** from GCs

## Step 1: Add Your Clients

1. Click **"Add Client"** from your dashboard
2. Enter the contractor''s email
3. They''ll receive an invitation linking their account to yours

### If your client is already on ForSured:
1. They can add you as their broker from their settings
2. You''ll receive a confirmation request
3. Accept to link your accounts

## Step 2: Monitor Compliance

For each client, you can see:

- Active projects and their GCs
- Current compliance status
- Required vs. actual coverage
- Upcoming expirations

## Step 3: Upload on Their Behalf

You can upload COIs for your clients:

1. Select a client from your dashboard
2. Click **"Upload Document"**
3. Select the document type and upload

The document is linked to their account and submitted to relevant GCs.

## Benefits for You

- **Proactive notifications**: Know when policies need renewal
- **Coverage gap alerts**: See where clients need more coverage
- **Streamlined workflow**: One place for all client compliance', ARRAY['broker'], 'getting-started', 1),

('dashboard', 'Dashboard Overview (Broker)', E'# Dashboard Overview

Your broker dashboard gives you visibility into all your clients'' compliance status.

## Key Metrics

- **Total Clients**: Number of contractor clients
- **Compliance Rate**: Average across all clients
- **Expiring Policies**: Policies needing renewal
- **Pending Actions**: Items requiring attention

## Client Overview

See all your clients with:
- Company name
- Overall compliance score
- Number of active projects
- Urgent items flagged

## Alerts & Notifications

Priority items at the top:
- 🔴 Expired policies
- 🟠 Expiring within 7 days
- 🟡 Expiring within 30 days
- ⚠️ Compliance issues

## Quick Actions

- **Add Client**: Link a new contractor
- **Upload Document**: Submit COI for a client
- **View Reports**: See compliance analytics
- **Export Data**: Download client information', ARRAY['broker'], 'dashboard', 2),

('clients', 'Managing Clients (Broker)', E'# Managing Clients

As a broker, you can manage documents and compliance for your contractor clients.

## Adding Clients

### Invite a New Client
1. Click **"Add Client"**
2. Enter the contractor''s email
3. They''ll receive an invitation to link their account

### Link Existing Client
If your client is already on ForSured:
1. They go to **Settings** > **Broker Access**
2. They enter your email
3. You receive a confirmation request
4. Accept to link accounts

## Client Dashboard

For each client, you can see:

- **Projects**: All GC relationships
- **Documents**: Current COIs and status
- **Compliance**: Score and issues
- **Requirements**: What each GC needs

## Uploading on Behalf of Clients

1. Select the client from your dashboard
2. Click **"Upload Document"**
3. Choose document type
4. Upload the file
5. Review extracted information
6. Submit

The document is linked to the client''s account and sent to relevant GCs.

## Managing Multiple Clients

Use filters to focus:
- By compliance status
- By expiration date
- By GC relationship
- By document type needed', ARRAY['broker'], 'clients', 3),

('policies', 'Policy Tracking (Broker)', E'# Policy Tracking

Stay on top of all your clients'' policies in one place.

## Policy Overview

View all policies across clients:
- Policy type (GL, WC, Auto, etc.)
- Carrier
- Policy number
- Effective dates
- Expiration dates
- Status

## Expiration Calendar

See what''s coming due:
- **This Week**: Urgent renewals
- **This Month**: Plan ahead
- **Next 90 Days**: Pipeline view

## Coverage Analysis

For each client, see:
- Current limits vs. GC requirements
- Coverage gaps
- Endorsement status
- Compliance issues

## Renewal Workflow

1. **30+ Days Out**: Start renewal process
2. **Get Updated COI**: Request from carrier
3. **Upload to ForSured**: Document submitted
4. **GC Review**: Await approval
5. **Confirmed**: Compliance maintained

## Reports

Generate reports for:
- Upcoming renewals
- Compliance status by client
- Coverage gaps analysis
- GC requirement summary

Export to PDF or Excel for your records.', ARRAY['broker'], 'policies', 4),

('faq', 'Frequently Asked Questions (Broker)', E'# Frequently Asked Questions

## Access & Setup

**Q: How do I get broker access to ForSured?**
A: Broker accounts are by invitation only. Contact ForSured or have a client request broker access from their settings.

**Q: Can I have multiple users at my agency?**
A: Contact ForSured support to set up additional agency users.

## Managing Clients

**Q: Can I upload documents for any contractor?**
A: Only for clients who have linked their ForSured account to your broker account.

**Q: How do I see a client''s GC requirements?**
A: Open the client''s profile and view the "Requirements" tab. You''ll see what each GC needs.

**Q: Can I remove a client from my account?**
A: Yes, go to the client''s profile and click "Remove Connection". The client retains their account.

## Documents

**Q: What happens when I upload a document for a client?**
A: The document is added to their account and automatically submitted to relevant GCs for review.

**Q: Can I see the GC''s feedback on documents I uploaded?**
A: Yes, you''ll be notified when documents are approved or rejected, with any comments from the GC.

## Reports & Analytics

**Q: Can I get a report of all my clients'' compliance status?**
A: Yes! Go to **Reports** > **Compliance Summary** and export to PDF or Excel.

**Q: How do I track upcoming renewals across all clients?**
A: The dashboard shows upcoming expirations. You can also use **Reports** > **Renewal Pipeline** for a detailed view.

## Support

**Q: How do I contact ForSured support?**
A: Click the **"Help"** icon or email support@forsured.com.', ARRAY['broker'], 'faq', 5)

ON CONFLICT DO NOTHING;

-- Verify seed completed
DO $$
DECLARE
    article_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO article_count FROM forsured.help_articles;

    IF article_count < 15 THEN
        RAISE WARNING 'Expected at least 15 articles, found %', article_count;
    ELSE
        RAISE NOTICE '✅ Seeded % help articles successfully', article_count;
    END IF;
END $$;
