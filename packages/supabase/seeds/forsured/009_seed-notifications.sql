-- =========================================================
-- 009_seed-notifications.sql - Notification Seed Data
-- Seeds notifications for all users in the database
-- Includes mix of read/unread/archived notifications with various types and severities
-- =========================================================

BEGIN;

-- =========================================================
-- NOTIFICATIONS FOR FORSURED USERS
-- =========================================================
-- ID Convention: 80000000-0000-0000-0000-0000000000XX
-- =========================================================

INSERT INTO core.notifications (
  id,
  user_id,
  type,
  severity,
  title,
  message,
  preview,
  body,
  metadata,
  routed_channels,
  read,
  read_at,
  archived_at,
  deleted_at,
  created_at,
  updated_at
)
VALUES
  -- =========================================================
  -- GC Users (50000000-0000-0000-0000-00000000000X)
  -- =========================================================
  
  -- GC Fresh User - Unread notifications
  (
    '80000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001',
    'team.assigned',
    'important',
    'New Task: Review Insurance Certificate',
    'A new task has been assigned to you: Review Insurance Certificate for Downtown Office Tower project.',
    'Review Insurance Certificate for Downtown Office Tower project.',
    '{"task_id": "75000000-0000-0000-0000-000000000001", "project_id": "70000000-0000-0000-0000-000000000001"}'::jsonb,
    '{"source": "task_system"}'::jsonb,
    ARRAY['in_app', 'email']::core.notification_channel[],
    false,
    NULL,
    NULL,
    NULL,
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '2 hours'
  ),
  (
    '80000000-0000-0000-0000-000000000002',
    '50000000-0000-0000-0000-000000000001',
    'warning',
    'critical',
    'Compliance Issue: Expiring Certificate',
    'Insurance certificate for Brown Concrete is expiring in 15 days. Action required.',
    'Insurance certificate for Brown Concrete is expiring in 15 days.',
    '{"subcontractor_id": "71000000-0000-0000-0000-000000000011", "days_until_expiry": 15}'::jsonb,
    '{"source": "compliance_system"}'::jsonb,
    ARRAY['in_app', 'email']::core.notification_channel[],
    false,
    NULL,
    NULL,
    NULL,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  ),
  
  -- GC Active User - Mix of read/unread
  (
    '80000000-0000-0000-0000-000000000011',
    '50000000-0000-0000-0000-000000000003',
    'success',
    'info',
    'Task Completed: Insurance Review',
    'The insurance certificate review task has been completed successfully.',
    'The insurance certificate review task has been completed.',
    '{"task_id": "75000000-0000-0000-0000-000000000001"}'::jsonb,
    '{"source": "task_system"}'::jsonb,
    ARRAY['in_app']::core.notification_channel[],
    true,
    NOW() - INTERVAL '3 hours',
    NULL,
    NULL,
    NOW() - INTERVAL '4 hours',
    NOW() - INTERVAL '3 hours'
  ),
  (
    '80000000-0000-0000-0000-000000000012',
    '50000000-0000-0000-0000-000000000003',
    'team.assigned',
    'important',
    'New Subcontractor Added to Project',
    'Brown Concrete has been added to the Downtown Office Tower project.',
    'Brown Concrete has been added to the Downtown Office Tower project.',
    '{"subcontractor_id": "71000000-0000-0000-0000-000000000011", "project_id": "70000000-0000-0000-0000-000000000001"}'::jsonb,
    '{"source": "project_system"}'::jsonb,
    ARRAY['in_app', 'email']::core.notification_channel[],
    false,
    NULL,
    NULL,
    NULL,
    NOW() - INTERVAL '30 minutes',
    NOW() - INTERVAL '30 minutes'
  ),
  (
    '80000000-0000-0000-0000-000000000013',
    '50000000-0000-0000-0000-000000000003',
    'info',
    'info',
    'Weekly Compliance Summary',
    'Your weekly compliance summary is ready. 5 projects are fully compliant, 2 need attention.',
    'Your weekly compliance summary is ready.',
    '{"compliant_projects": 5, "needs_attention": 2}'::jsonb,
    '{"source": "compliance_system"}'::jsonb,
    ARRAY['in_app', 'email']::core.notification_channel[],
    true,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day',
    NULL,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day'
  ),
  
  -- GC MultiProject User - Archived notifications
  (
    '80000000-0000-0000-0000-000000000021',
    '50000000-0000-0000-0000-000000000004',
    'success',
    'info',
    'Project Status Updated',
    'Riverside Medical Center Expansion project status has been updated to Active.',
    'Riverside Medical Center Expansion project status updated.',
    '{"project_id": "70000000-0000-0000-0000-000000000002", "status": "active"}'::jsonb,
    '{"source": "project_system"}'::jsonb,
    ARRAY['in_app']::core.notification_channel[],
    true,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '4 days',
    NULL,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '4 days'
  ),
  (
    '80000000-0000-0000-0000-000000000022',
    '50000000-0000-0000-0000-000000000004',
    'warning',
    'important',
    'Document Upload Required',
    'Please upload updated insurance certificate for Phoenix HVAC Solutions.',
    'Please upload updated insurance certificate.',
    '{"subcontractor_id": "71000000-0000-0000-0000-000000000003", "document_type": "insurance_certificate"}'::jsonb,
    '{"source": "document_system"}'::jsonb,
    ARRAY['in_app', 'email']::core.notification_channel[],
    false,
    NULL,
    NULL,
    NULL,
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '1 hour'
  ),
  
  -- =========================================================
  -- Contractor Users (50000000-0000-0000-0000-00000000001X)
  -- =========================================================
  
  -- Contractor Active User
  (
    '80000000-0000-0000-0000-000000000031',
    '50000000-0000-0000-0000-000000000012',
    'team.assigned',
    'important',
    'New Task: Update Insurance Certificate',
    'You have been assigned a task to update your insurance certificate for the Downtown Office Tower project.',
    'Update your insurance certificate for Downtown Office Tower.',
    '{"task_id": "75000000-0000-0000-0000-000000000001", "project_id": "70000000-0000-0000-0000-000000000001"}'::jsonb,
    '{"source": "task_system"}'::jsonb,
    ARRAY['in_app', 'email']::core.notification_channel[],
    false,
    NULL,
    NULL,
    NULL,
    NOW() - INTERVAL '4 hours',
    NOW() - INTERVAL '4 hours'
  ),
  (
    '80000000-0000-0000-0000-000000000032',
    '50000000-0000-0000-0000-000000000012',
    'success',
    'info',
    'Certificate Approved',
    'Your insurance certificate has been approved for the Riverside Medical Center project.',
    'Your insurance certificate has been approved.',
    '{"project_id": "70000000-0000-0000-0000-000000000002"}'::jsonb,
    '{"source": "compliance_system"}'::jsonb,
    ARRAY['in_app', 'email']::core.notification_channel[],
    true,
    NOW() - INTERVAL '1 day',
    NULL,
    NULL,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  ),
  (
    '80000000-0000-0000-0000-000000000033',
    '50000000-0000-0000-0000-000000000012',
    'warning',
    'critical',
    'Certificate Expiring Soon',
    'Your General Liability insurance certificate expires in 7 days. Please renew to avoid project delays.',
    'Your General Liability certificate expires in 7 days.',
    '{"certificate_type": "general_liability", "days_until_expiry": 7}'::jsonb,
    '{"source": "compliance_system"}'::jsonb,
    ARRAY['in_app', 'email', 'sms']::core.notification_channel[],
    false,
    NULL,
    NULL,
    NULL,
    NOW() - INTERVAL '6 hours',
    NOW() - INTERVAL '6 hours'
  ),
  
  -- Contractor NonCompliant User
  (
    '80000000-0000-0000-0000-000000000041',
    '50000000-0000-0000-0000-000000000013',
    'warning',
    'critical',
    'Compliance Action Required',
    'Your insurance documentation is incomplete. Please upload required certificates immediately.',
    'Your insurance documentation is incomplete.',
    '{"missing_documents": ["general_liability", "workers_compensation"]}'::jsonb,
    '{"source": "compliance_system"}'::jsonb,
    ARRAY['in_app', 'email']::core.notification_channel[],
    false,
    NULL,
    NULL,
    NULL,
    NOW() - INTERVAL '12 hours',
    NOW() - INTERVAL '12 hours'
  ),
  (
    '80000000-0000-0000-0000-000000000042',
    '50000000-0000-0000-0000-000000000013',
    'info',
    'info',
    'Project Invitation',
    'You have been invited to join the Industrial Park Renovation project.',
    'You have been invited to join Industrial Park Renovation.',
    '{"project_id": "70000000-0000-0000-0000-000000000011"}'::jsonb,
    '{"source": "project_system"}'::jsonb,
    ARRAY['in_app', 'email']::core.notification_channel[],
    true,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '2 days',
    NULL,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '2 days'
  ),
  
  -- =========================================================
  -- Broker Users (50000000-0000-0000-0000-00000000002X)
  -- =========================================================
  
  -- Broker Active User
  (
    '80000000-0000-0000-0000-000000000051',
    '50000000-0000-0000-0000-000000000022',
    'team.assigned',
    'important',
    'New Client Request',
    'Acme Construction Group has requested insurance assistance for a new project.',
    'Acme Construction Group has requested insurance assistance.',
    '{"client_id": "60000000-0000-0000-0000-000000000001", "project_id": "70000000-0000-0000-0000-000000000001"}'::jsonb,
    '{"source": "client_system"}'::jsonb,
    ARRAY['in_app', 'email']::core.notification_channel[],
    false,
    NULL,
    NULL,
    NULL,
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '2 hours'
  ),
  (
    '80000000-0000-0000-0000-000000000052',
    '50000000-0000-0000-0000-000000000022',
    'success',
    'info',
    'Policy Renewal Completed',
    'Insurance policy renewal for Elite Electrical Services has been completed successfully.',
    'Policy renewal for Elite Electrical Services completed.',
    '{"client_id": "60000000-0000-0000-0000-000000000011", "policy_type": "general_liability"}'::jsonb,
    '{"source": "policy_system"}'::jsonb,
    ARRAY['in_app']::core.notification_channel[],
    true,
    NOW() - INTERVAL '1 day',
    NULL,
    NULL,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  ),
  (
    '80000000-0000-0000-0000-000000000053',
    '50000000-0000-0000-0000-000000000022',
    'info',
    'info',
    'Monthly Client Summary',
    'Your monthly client summary is ready. 12 active clients, 3 renewals due this month.',
    'Your monthly client summary is ready.',
    '{"active_clients": 12, "renewals_due": 3}'::jsonb,
    '{"source": "reporting_system"}'::jsonb,
    ARRAY['in_app', 'email']::core.notification_channel[],
    true,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '4 days',
    NULL,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '4 days'
  ),
  
  -- =========================================================
  -- Admin Users (50000000-0000-0000-0000-00000000003X)
  -- =========================================================
  
  (
    '80000000-0000-0000-0000-000000000061',
    '50000000-0000-0000-0000-000000000031',
    'info',
    'info',
    'System Maintenance Scheduled',
    'Scheduled system maintenance will occur on Saturday, 2:00 AM - 4:00 AM EST.',
    'System maintenance scheduled for Saturday.',
    '{"maintenance_window": "2024-01-06T02:00:00Z - 2024-01-06T04:00:00Z"}'::jsonb,
    '{"source": "system"}'::jsonb,
    ARRAY['in_app', 'email']::core.notification_channel[],
    true,
    NOW() - INTERVAL '1 day',
    NULL,
    NULL,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  ),
  (
    '80000000-0000-0000-0000-000000000062',
    '50000000-0000-0000-0000-000000000031',
    'warning',
    'important',
    'High Priority Support Ticket',
    'A high priority support ticket has been assigned to you.',
    'High priority support ticket assigned.',
    '{"ticket_id": "TICKET-12345", "priority": "high"}'::jsonb,
    '{"source": "support_system"}'::jsonb,
    ARRAY['in_app', 'email']::core.notification_channel[],
    false,
    NULL,
    NULL,
    NULL,
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '3 hours'
  ),
  
  -- =========================================================
  -- Test Users (10000000-0000-0000-0000-00000000000X)
  -- =========================================================
  
  -- Test GC User
  (
    '80000000-0000-0000-0000-000000000071',
    '10000000-0000-0000-0000-000000000001',
    'team.assigned',
    'important',
    'Welcome to ForSured!',
    'Welcome to ForSured! You have been assigned your first task. Click to get started.',
    'Welcome to ForSured!',
    '{"task_id": "75000000-0000-0000-0000-000000000001"}'::jsonb,
    '{"source": "onboarding"}'::jsonb,
    ARRAY['in_app', 'email']::core.notification_channel[],
    false,
    NULL,
    NULL,
    NULL,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  ),
  (
    '80000000-0000-0000-0000-000000000072',
    '10000000-0000-0000-0000-000000000001',
    'success',
    'info',
    'Project Created Successfully',
    'Your project "Downtown Office Tower" has been created successfully.',
    'Project "Downtown Office Tower" created.',
    '{"project_id": "70000000-0000-0000-0000-000000000001"}'::jsonb,
    '{"source": "project_system"}'::jsonb,
    ARRAY['in_app']::core.notification_channel[],
    true,
    NOW() - INTERVAL '2 days',
    NULL,
    NULL,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
  ),
  
  -- Test Contractor User
  (
    '80000000-0000-0000-0000-000000000081',
    '10000000-0000-0000-0000-000000000002',
    'team.assigned',
    'important',
    'Insurance Certificate Required',
    'Please upload your insurance certificate to continue working on projects.',
    'Please upload your insurance certificate.',
    '{}'::jsonb,
    '{"source": "compliance_system"}'::jsonb,
    ARRAY['in_app', 'email']::core.notification_channel[],
    false,
    NULL,
    NULL,
    NULL,
    NOW() - INTERVAL '6 hours',
    NOW() - INTERVAL '6 hours'
  ),
  
  -- Test Broker User
  (
    '80000000-0000-0000-0000-000000000091',
    '10000000-0000-0000-0000-000000000003',
    'info',
    'info',
    'New Client Onboarded',
    'Test Construction Company has been onboarded as a new client.',
    'New client onboarded: Test Construction Company.',
    '{"client_id": "20000000-0000-0000-0000-000000000001"}'::jsonb,
    '{"source": "client_system"}'::jsonb,
    ARRAY['in_app', 'email']::core.notification_channel[],
    false,
    NULL,
    NULL,
    NULL,
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '1 hour'
  ),
  
  -- =========================================================
  -- NOTIFICATIONS FOR REGULAR USERS (from 002_seed-users.sql)
  -- =========================================================
  
  -- Super Admins (00000000-0000-0000-0000-00000000000X)
  (
    '80000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000001',
    'info',
    'info',
    'Platform Update Available',
    'A new platform update is available. Review the changelog for details.',
    'New platform update available.',
    '{"version": "2.1.0", "changelog_url": "/changelog"}'::jsonb,
    '{"source": "platform"}'::jsonb,
    ARRAY['in_app', 'email']::core.notification_channel[],
    false,
    NULL,
    NULL,
    NULL,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  ),
  (
    '80000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000002',
    'success',
    'info',
    'Feature Released: Notifications',
    'The new notifications system has been released. Check it out!',
    'New notifications system released.',
    '{"feature": "notifications", "release_date": "2024-01-01"}'::jsonb,
    '{"source": "platform"}'::jsonb,
    ARRAY['in_app']::core.notification_channel[],
    true,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '2 days',
    NULL,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '2 days'
  ),
  
  -- Regular Users (11111111-1111-1111-1111-11111111111X) - Sample notifications
  (
    '80000000-0000-0000-0000-000000000111',
    '11111111-1111-1111-1111-111111111111',
    'job.match',
    'important',
    'New Job Match Found',
    'A new job opportunity matches your profile: Commercial Electrician position.',
    'New job match: Commercial Electrician.',
    '{"job_id": "job-123", "title": "Commercial Electrician"}'::jsonb,
    '{"source": "job_matching"}'::jsonb,
    ARRAY['in_app', 'email']::core.notification_channel[],
    false,
    NULL,
    NULL,
    NULL,
    NOW() - INTERVAL '5 hours',
    NOW() - INTERVAL '5 hours'
  ),
  (
    '80000000-0000-0000-0000-000000000112',
    '11111111-1111-1111-1111-111111111112',
    'app.submitted',
    'info',
    'Application Submitted',
    'Your application for Licensed Plumber position has been submitted successfully.',
    'Application submitted for Licensed Plumber.',
    '{"application_id": "app-456", "job_title": "Licensed Plumber"}'::jsonb,
    '{"source": "application_system"}'::jsonb,
    ARRAY['in_app', 'email']::core.notification_channel[],
    true,
    NOW() - INTERVAL '2 days',
    NULL,
    NULL,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
  ),
  (
    '80000000-0000-0000-0000-000000000113',
    '11111111-1111-1111-1111-111111111113',
    'success',
    'info',
    'Profile Updated',
    'Your profile has been successfully updated.',
    'Your profile has been updated.',
    '{}'::jsonb,
    '{"source": "profile_system"}'::jsonb,
    ARRAY['in_app']::core.notification_channel[],
    true,
    NOW() - INTERVAL '1 week',
    NOW() - INTERVAL '6 days',
    NULL,
    NOW() - INTERVAL '1 week',
    NOW() - INTERVAL '6 days'
  )
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- =========================================================
-- NOTES:
-- =========================================================
-- 1. Notification ID Convention: 80000000-0000-0000-0000-0000000000XX
-- 2. Mix of notification states:
--    - Unread (read = false, read_at = NULL)
--    - Read (read = true, read_at set)
--    - Archived (archived_at set)
-- 3. Notification types used:
--    - team.assigned: Tasks and assignments
--    - success: Success messages
--    - warning: Warnings and alerts
--    - info: Informational messages
--    - job.match: Job matching notifications (for regular users)
--    - app.submitted: Application submissions (for regular users)
--    - platform.update: Platform updates (for admins)
-- 4. Severity levels:
--    - info: General information
--    - important: Requires attention
--    - critical: Urgent action required
-- 5. Routed channels:
--    - in_app: Always included
--    - email: For important notifications
--    - sms: For critical notifications
-- 6. All notifications are user-scoped (user_id matches auth.users.id)
-- 7. ON CONFLICT (id) makes this seed idempotent
-- =========================================================
