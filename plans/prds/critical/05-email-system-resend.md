# PRD: Email System (BernierLLC Architecture)

**Status:** Critical Priority
**Effort Estimate:** 3-4 weeks (initial implementation) | 13 weeks (full system with all features)
**Dependencies:** None (foundational)
**Related Features:** Notification System, Authentication, All user-facing features
**Reference Architecture:** BernierLLC Email System (tools/plans/packages/email-system-integration-plan.md)

---

## 1. Overview

The Email System provides reliable, professional email delivery for all platform communications including authentication flows, transactional emails, notification digests, and marketing communications. This feature implements the **BernierLLC Email System architecture**, a comprehensive multi-provider email platform with advanced template management, sender configuration, and production safety features.

The BernierLLC architecture provides enterprise-grade email capabilities including multi-provider support (SendGrid, Mailgun, AWS SES, SMTP), database-backed template management with versioning, bidirectional provider synchronization, staging email safety, and plugin-based extensibility. This system exceeds basic email requirements and provides production-ready resilience and scalability.

Email is fundamental to user engagement and platform operations. Users need emails for account verification, password resets, important notifications, hiring updates, and ongoing communication. A professional email system builds trust and ensures critical messages reach users.

**Ecosystem Context:** In skilled trades hiring, email remains a primary communication channel. Workers often check email for job alerts and application updates, while organizations rely on email for candidate communications and team notifications. Professional, branded emails enhance platform credibility.

**Implementation Note:** An existing 13-week implementation plan is available that provides phased deployment of the complete BernierLLC email system. A minimal viable implementation can be achieved in 3-4 weeks using core packages.

---

## 2. Goals & Objectives

### Primary Goal
Deliver reliable, professional, and branded email communications using the BernierLLC email system architecture that provides multi-provider resilience, advanced template management, and production safety.

### Secondary Goals
1. **Multi-Provider Resilience** - Automatic failover between email providers for 99.9%+ uptime
2. **Template Management** - Database-backed templates with versioning and provider synchronization
3. **Sender Management** - Domain-based sender configuration with verification
4. **Production Safety** - Staging environment email whitelisting and rewriting
5. **Performance** - Fast email sending without blocking application performance
6. **Analytics** - Comprehensive email tracking and reporting
7. **Extensibility** - Plugin architecture for adding new providers and features

### Success Criteria
- Email deliverability rate > 99% across all providers
- Email open rate > 25% (transactional), > 15% (marketing)
- Click-through rate > 10% for actionable emails
- Bounce rate < 2%
- Zero spam complaints
- Provider failover time < 30 seconds
- Template sync success rate > 99%

---

## 3. User Stories

### Worker
- **As a worker**, I want to receive a welcome email when I sign up so that I understand how to get started
- **As a worker**, I want to receive email notifications for important events so that I don't miss opportunities even when not logged in
- **As a worker**, I want to reset my password via email so that I can regain access to my account
- **As a worker**, I want to receive a weekly digest of matching jobs so that I stay informed without being overwhelmed

### Employer/Organization
- **As an employer**, I want to receive email notifications when candidates apply so that I can review them promptly
- **As an employer**, I want to receive confirmation emails for account actions so that I can verify my activity
- **As an employer**, I want to invite team members via email so that they can join our organization
- **As an employer**, I want branded emails that reflect our organization so that communications are professional

### Platform Admin
- **As a platform admin**, I want to monitor email delivery across multiple providers so that I can ensure system health
- **As a platform admin**, I want to manage email templates with version control so that changes are tracked
- **As a platform admin**, I want staging emails to be safe (whitelisted/rewritten) so that test emails don't reach real users
- **As a platform admin**, I want to configure sender domains so that emails come from appropriate addresses
- **As a platform admin**, I want automatic provider failover so that email sending continues if one provider fails

---

## 4. BernierLLC Email System Architecture

### 4.1 Package Hierarchy

```
Email System Architecture (MECE Principle)

Core Packages (Atomic utilities)
├── @bernierllc/template-variable-registry - Centralized variable management
├── @bernierllc/email-template-engine - Handlebars + Jinja2 rendering
├── @bernierllc/email-sender - Core sending functionality
├── @bernierllc/email-sendgrid-plugin - SendGrid-specific features
└── @bernierllc/email-sender-manager - Database-backed sender configs

Service Packages (Orchestration)
└── @bernierllc/email-template-service - Template lifecycle & sync

Suite Packages (Complete solutions)
└── @bernierllc/email-manager - Orchestrates all packages

UI Packages (React components)
├── @bernierllc/email-admin-ui - Admin interface
└── @bernierllc/email-ui - End-user interface
```

### 4.2 Key Capabilities

**Multi-Provider Support**
- SendGrid, Mailgun, AWS SES, SMTP
- Automatic failover on provider failure
- Provider priority and load balancing
- Rate limiting per provider

**Template Management**
- Database-backed templates with versioning
- Bidirectional sync with provider templates (SendGrid, etc.)
- Base template + content composition
- Variable registry with validation
- Handlebars and Jinja2 support

**Sender Management**
- Database-backed sender configurations
- Domain-based sender selection
- Verified sender integration (SendGrid, etc.)
- Sender authentication (SPF/DKIM/DMARC)

**Production Safety**
- Staging email whitelisting (prevent test emails to real users)
- Email rewriting for non-production environments
- Shared account protection for providers

**Advanced Features**
- Email scheduling and queueing
- Batch email processing
- Email analytics and tracking
- Retry logic with exponential backoff
- Plugin architecture for extensibility

---

## 5. Functional Requirements

### 5.1 Email Template Library

**Authentication & Account Emails**
- **Welcome Email** - Platform introduction and quick start guide
- **Email Verification** - Confirm email address with secure token
- **Magic Link Login** - Passwordless authentication
- **Password Reset** - Secure password recovery
- **Password Changed Confirmation** - Security notification

**Job & Application Emails**
- **Job Posted Confirmation** - Employer confirmation
- **Application Received** - Employer notification
- **Application Status Changed** - Worker updates
- **Job Match Alert** - Worker opportunity notifications

**Team & Collaboration Emails**
- **Team Invitation** - Invite to join team with accept/decline
- **Team Member Assigned** - Assignment notifications

**Payment & Billing Emails**
- **Payment Receipt** - Transaction confirmation with invoice
- **Payment Failed** - Failed payment notification
- **Subscription Renewal Reminder** - Upcoming renewal alert
- **Invoice** - Detailed billing statement with PDF

**Review & Feedback Emails**
- **New Review Notification** - Review received alert
- **Review Response** - Response to review notification

**Background Check Emails**
- **Background Check Initiated** - Process started confirmation
- **Background Check Completed** - Results available notification

**Digest & Summary Emails**
- **Daily/Weekly Activity Digest** - Activity summary
- **Monthly Platform Updates** - Feature announcements

### 5.2 Template Management System

- **Template Creation & Versioning**
  - Create templates with HTML/text versions
  - Version control for template changes
  - Template categories and organization
  - Template activation/deactivation

- **Variable Management**
  - Centralized variable registry
  - Variable validation and type checking
  - Variable suggestions based on context
  - Required vs. optional variables

- **Provider Synchronization**
  - Bidirectional sync with email providers (SendGrid, etc.)
  - Conflict resolution strategies
  - Sync status tracking
  - Batch synchronization

- **Base Templates**
  - Create reusable base templates (header/footer)
  - Compose content with base templates
  - Theme and branding management
  - Style inheritance

### 5.3 Email Sending

- **Transactional Email Sending**
  - Send individual emails triggered by user actions
  - Dynamic template variable substitution
  - File attachments (PDFs, documents)
  - Custom reply-to addresses
  - Real-time sending status

- **Batch Email Sending**
  - Bulk email operations with rate limiting
  - Per-recipient personalization
  - Scheduled batch sends
  - Batch progress tracking

- **Email Queueing & Scheduling**
  - Async email queue processing
  - Priority queue for critical emails
  - Scheduled email sending
  - Automatic retry with exponential backoff
  - Dead letter queue for failures

- **Multi-Provider Orchestration**
  - Automatic provider selection based on priority
  - Failover to backup providers on failure
  - Provider-specific features via plugins
  - Provider health monitoring

### 5.4 Sender Configuration

- **Sender Management**
  - Database-backed sender configurations
  - Domain-based sender matching
  - Verified sender integration
  - Default sender per environment

- **Domain Configuration**
  - SPF record configuration
  - DKIM signing setup
  - DMARC policy configuration
  - Dedicated sending domains

- **Sender Verification**
  - Provider-specific verification (SendGrid verified senders)
  - Verification status tracking
  - Re-verification workflows

### 5.5 Production Safety Features

- **Staging Email Safety**
  - Email whitelisting for staging environments
  - Email rewriting to safe addresses
  - Test mode indicators in emails
  - Shared account protection

- **Environment-Specific Behavior**
  - Different sender configs per environment
  - Provider selection per environment
  - Template overrides for testing

### 5.6 Email Tracking & Analytics

- **Delivery Tracking**
  - Email sent, delivered, bounced, spam reports
  - Provider delivery status webhooks
  - Bounce classification (hard/soft)
  - Blacklist monitoring

- **Engagement Tracking**
  - Email opens (pixel tracking)
  - Link clicks (redirect tracking)
  - Reply tracking
  - Time-to-open metrics
  - Device/client analytics

- **Performance Metrics**
  - Deliverability rate per provider and template
  - Open rates by email type
  - Click-through rates
  - Bounce rates
  - Unsubscribe rates
  - Provider performance comparison

### 5.7 Email Preferences & Unsubscribe

- **User Preferences**
  - Opt-in/opt-out per email type
  - Frequency controls (immediate, daily digest, weekly)
  - Channel preferences (email vs. in-app only)
  - One-click unsubscribe compliance

- **Unsubscribe Management**
  - Immediate unsubscribe processing
  - Critical transactional emails exemption
  - Unsubscribe reason collection
  - Re-subscription option

### 5.8 Plugin Architecture

- **Provider Plugins**
  - SendGrid plugin with verified senders and template sync
  - Mailgun plugin (future)
  - AWS SES plugin (future)
  - SMTP plugin for custom providers

- **Feature Plugins**
  - Analytics integrations
  - A/B testing plugins
  - Custom validation plugins

---

## 6. Non-Functional Requirements

### 6.1 Performance
- **Send Speed**
  - Email queued < 1 second
  - Transactional email sent < 10 seconds
  - Batch email processing: 1000+/minute
  - No blocking of main application

- **Template Rendering**
  - Template compilation < 500ms
  - Variable substitution < 100ms
  - Template caching for performance

### 6.2 Reliability
- **Delivery Guarantee**
  - 99.9%+ deliverability across providers
  - Automatic retry for failed sends (3 attempts with backoff)
  - Dead letter queue for permanent failures
  - Provider failover < 30 seconds
  - Alert on delivery issues

- **System Uptime**
  - Email service availability > 99.9%
  - Graceful handling of provider downtime
  - Queue emails during outages
  - No data loss on failures

### 6.3 Security
- **Data Protection**
  - Encrypt email content in transit (TLS)
  - Secure API keys in environment variables
  - Audit log for email operations
  - No sensitive data in templates

- **Authentication**
  - SPF/DKIM/DMARC authentication
  - Verified sender domains
  - Provider API key rotation support

- **Spam Prevention**
  - Rate limiting per user and globally
  - CAN-SPAM compliance
  - Spam score checking
  - Email spoofing prevention

### 6.4 Scalability
- **Volume Handling**
  - Support 10,000+ emails/day initially
  - Scale to 1,000,000+ emails/day
  - Horizontal scaling of email queue workers
  - Multi-provider load distribution

- **Database Performance**
  - Efficient template queries with caching
  - Sender configuration caching
  - Archive old email history
  - Index optimization

### 6.5 Accessibility
- **Email Accessibility**
  - Semantic HTML structure
  - Alt text for images
  - High contrast text
  - Clear link descriptions
  - Text-only fallback

---

## 7. Success Metrics

### 7.1 Quantitative Metrics

- **Delivery Metrics**
  - Deliverability rate > 99.9%
  - Bounce rate < 2%
  - Spam complaint rate < 0.1%
  - Average time to deliver < 10 seconds
  - Provider failover success rate > 99%

- **Engagement Metrics**
  - Transactional email open rate > 25%
  - Marketing email open rate > 15%
  - Click-through rate > 10%
  - Reply rate for engagement emails > 5%

- **System Metrics**
  - Email service uptime > 99.9%
  - Template sync success rate > 99%
  - Queue processing lag < 1 minute
  - Zero data loss incidents

### 7.2 Qualitative Metrics

- **User Satisfaction**
  - Email relevance score > 4/5
  - Professional appearance feedback
  - Clear call-to-action effectiveness
  - Brand consistency positive feedback

- **Business Impact**
  - Increased user engagement from email CTAs
  - Higher response rates to time-sensitive emails
  - Reduced support tickets from clear communication
  - Improved brand perception

### 7.3 Operational Metrics

- **System Health**
  - API error rate < 0.5%
  - Template rendering errors < 0.1%
  - Provider errors < 1%

- **Reputation Metrics**
  - Sender reputation score > 95
  - Zero blacklist incidents
  - Successful SPF/DKIM/DMARC alignment > 99%

---

## 8. Implementation Approach

### 8.1 Phased Implementation (Recommended)

**Phase 1: Core Foundation (Weeks 1-3)**
- Implement core packages:
  - Template variable registry
  - Email sender manager (database-backed)
  - SendGrid plugin
- Basic template management
- Single-provider sending (SendGrid)

**Phase 2: Service Integration (Weeks 4-6)**
- Template engine enhancement
- Email sender enhancement with staging safety
- Email template service
- Template synchronization

**Phase 3: Suite Enhancement (Weeks 7-8)**
- Email manager suite integration
- Advanced sending workflows
- System testing and optimization

**Phase 4: UI & Admin (Weeks 9-11)**
- Admin UI for template and sender management
- End-user email preferences UI
- Template builder

**Phase 5: Production Readiness (Weeks 12-13)**
- Migration tools
- Monitoring and alerting
- Security audit
- Documentation

**Total Timeline:** 13 weeks for full system

### 8.2 Minimal Viable Implementation (3-4 weeks)

For faster initial deployment, implement core functionality:
- Email sender with SendGrid
- Basic template management (database-backed)
- Email queue and retry logic
- Essential templates (auth, notifications)
- Staging email safety

Advanced features (provider sync, multi-provider, admin UI) can be added incrementally.

---

## 9. Open Questions & Considerations

### Technical Decisions
1. **Initial Provider** - Start with SendGrid or implement multi-provider from day one?
2. **Template Engine** - Handlebars, Jinja2, or both?
3. **Queue Technology** - Database queue, Redis, or BullMQ?
4. **Template Storage** - Database only or sync with provider?

### Business Decisions
1. **Email Volume Limits** - Per-user send limits to prevent abuse?
2. **Provider Selection** - Which providers to support initially?
3. **Branding** - Per-organization branding or platform-wide?
4. **Digest Frequency** - Default digest frequency for different user types?

### Compliance Considerations
1. **CAN-SPAM** - Full compliance implementation details
2. **GDPR** - Email data retention and deletion policies
3. **Unsubscribe** - Processing timeframe (10 business days max)
4. **Record Keeping** - Email archive retention requirements

### Migration Considerations
1. **Existing Emails** - Migration from Supabase basic email
2. **Template Migration** - Converting existing email templates
3. **Sender Configuration** - Setting up verified domains
4. **User Preferences** - Migrating existing notification preferences

---

## 10. Related Features

### Direct Dependencies
- None (foundational feature)

### Features Depending on This
- **Notification System** - Uses email as delivery channel
- **Authentication** - Email verification, password reset
- **Team Management** - Team invitations
- **Payment System** - Payment receipts, invoices
- **Background Checks** - Status notifications
- **All Features** - Most features generate emails

### Integration Points
- **Notification System** - Trigger emails from notifications
- **User Authentication** - Email verification flows
- **Analytics** - Email engagement tracking
- **Database** - Template and sender configuration storage

---

## 11. Implementation References

### Available Documentation
- **Integration Plan:** `tools/plans/packages/email-system-integration-plan.md` (13-week plan)
- **Email Manager:** `tools/plans/completed/services/email-manager.md`
- **Template Service:** `tools/plans/completed/service/email-template-service.md`
- **Sender Manager:** `tools/plans/completed/core/email-sender-manager.md`
- **SendGrid Plugin:** `tools/plans/completed/core/email-sendgrid-plugin.md`

### BernierLLC Packages (NPM)
- `@bernierllc/email-manager` - Suite package
- `@bernierllc/email-template-service` - Service package
- `@bernierllc/email-sender` - Core package
- `@bernierllc/email-sender-manager` - Core package
- `@bernierllc/email-template-engine` - Core package
- `@bernierllc/template-variable-registry` - Core package
- `@bernierllc/email-sendgrid-plugin` - Provider plugin
- `@bernierllc/email-admin-ui` - Admin UI
- `@bernierllc/email-ui` - End-user UI

### Key Architectural Principles
- **MECE Principle** - Mutually exclusive, collectively exhaustive package design
- **Plugin Architecture** - Extensible provider and feature plugins
- **Database-Backed** - Template and sender configuration in database
- **Production Safety** - Staging email whitelisting and rewriting
- **Multi-Provider** - Resilience through provider diversity

---

## 12. Implementation Notes

### API Endpoints (tRPC routers)
- `email.send` - Send individual email
- `email.sendBatch` - Send multiple emails
- `email.sendTemplated` - Send using template ID
- `email.scheduleEmail` - Schedule for future sending
- `email.getHistory` - Get user's email history
- `email.getPreferences` - Get email preferences
- `email.updatePreferences` - Update preferences
- `email.unsubscribe` - Unsubscribe from emails

### Admin Endpoints
- `email.admin.createTemplate` - Create email template
- `email.admin.updateTemplate` - Update template
- `email.admin.syncTemplate` - Sync template to provider
- `email.admin.listTemplates` - List all templates
- `email.admin.configureSender` - Configure sender domain
- `email.admin.verifySender` - Verify sender with provider
- `email.admin.getAnalytics` - Get email analytics

### Database Tables
- `email_templates` - Template definitions with versioning
- `email_template_versions` - Template version history
- `email_senders` - Sender configurations
- `email_provider_configs` - Provider API configurations
- `email_queue` - Pending emails to send
- `email_history` - Sent email records
- `email_bounces` - Bounced email tracking
- `email_preferences` - User email preferences
- `email_sync_status` - Template sync status with providers

### Webhooks
- `/api/webhooks/sendgrid` - SendGrid delivery/engagement events
- `/api/webhooks/mailgun` - Mailgun events (future)
- `/api/webhooks/ses` - AWS SES events (future)

### UI Components
- Email template builder (admin)
- Template preview (admin)
- Sender configuration (admin)
- Provider status dashboard (admin)
- Email preferences page (user)
- Email history viewer (user)
- Unsubscribe page (user)

---

*PRD Version: 2.0*
*Last Updated: January 2025*
*Owner: Product Team*
*Architecture: BernierLLC Email System*
