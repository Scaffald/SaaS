# PRD: Team Management System

**Status:** Critical Priority
**Effort Estimate:** 2-3 weeks
**Dependencies:** Notification System, Email System
**Related Features:** Organization Management, ATS, Application Management

---

## 1. Overview

The Team Management System enables organizations to create teams, invite members, assign roles, and collaborate on hiring activities. This feature allows organizations to structure their hiring process across multiple people, with appropriate permissions and workflows for different team roles.

Teams are essential for larger organizations where hiring decisions involve multiple stakeholders (recruiters, hiring managers, department heads, admins). Without team management, organizations can't effectively collaborate on candidate evaluation and hiring decisions.

**Ecosystem Context:** In construction and skilled trades hiring, decisions often involve multiple stakeholders - a project manager needs specific technical skills, a safety officer reviews certifications, a recruiter manages the pipeline, and an administrator handles contracts. Team management ensures everyone has the right access and can collaborate effectively.

---

## 2. Goals & Objectives

### Primary Goal
Enable organizations to structure their hiring process by creating teams, assigning roles, and managing member access to jobs, applications, and workers.

### Secondary Goals
1. **Collaboration** - Multiple team members can work together on hiring processes
2. **Access Control** - Granular permissions ensure appropriate access for each role
3. **Efficiency** - Clear team structure reduces confusion and speeds up hiring
4. **Accountability** - Track which team members take actions on applications
5. **Flexibility** - Support various organizational structures (departments, projects, locations)

### Success Criteria
- Organizations with teams have 30% faster hiring cycles
- 80% of organizations with 5+ users create at least one team
- Team member invitation acceptance rate > 85%
- Team collaboration results in higher quality hires (measured by retention)

---

## 3. User Stories

### Organization Admin
- **As an organization admin**, I want to create teams for different departments so that hiring is organized by business unit
- **As an organization admin**, I want to invite team members so that colleagues can collaborate on hiring
- **As an organization admin**, I want to assign roles to team members so that everyone has appropriate permissions
- **As an organization admin**, I want to remove team members when they leave the organization so that access is properly controlled
- **As an organization admin**, I want to see all teams in my organization so that I can manage team structure

### Hiring Manager
- **As a hiring manager**, I want to create a team for my project so that I can coordinate hiring for specific needs
- **As a hiring manager**, I want to assign team members to specific jobs so that the right people review candidates
- **As a hiring manager**, I want to see which team members have reviewed each application so that I can track progress
- **As a hiring manager**, I want to share access to shortlisted candidates with my team so that we can discuss hiring decisions

### Recruiter
- **As a recruiter**, I want to be assigned to a team so that I can manage applications for that department
- **As a recruiter**, I want to see all jobs assigned to my teams so that I can focus on relevant positions
- **As a recruiter**, I want to collaborate with team members on candidate evaluation so that we make better hiring decisions
- **As a recruiter**, I want to mention team members in application notes so that I can get their input

### Team Member
- **As a team member**, I want to accept team invitations so that I can participate in hiring
- **As a team member**, I want to see what permissions I have in each team so that I understand my responsibilities
- **As a team member**, I want to leave teams I'm no longer involved with so that I reduce notification noise

---

## 4. Functional Requirements

### 4.1 Team Creation & Management

- **Create Team**
  - Organization admins can create new teams
  - Specify team name and description
  - Optionally set team purpose (department, project, location)
  - Set team visibility (organization-wide or private)
  - Assign initial team lead/manager

- **Edit Team**
  - Update team name and description
  - Change team purpose or visibility
  - Archive inactive teams (soft delete)
  - Transfer team ownership

- **Delete Team**
  - Only organization admins can delete teams
  - Confirm deletion with warning about impact
  - Reassign team members before deletion
  - Archive team data for compliance

### 4.2 Team Member Management

- **Invite Team Members**
  - Invite organization members to join team
  - Send invitation email with team details
  - Allow pending invitations to be viewed/managed
  - Support invitation expiration (7 days default)
  - Resend invitations if not accepted

- **Accept/Decline Invitations**
  - Members receive invitation notification
  - One-click accept or decline
  - Provide reason for declining (optional)
  - Redirect to team dashboard after accepting

- **Add Members Directly**
  - Team leads can add existing organization members without invitation
  - Select members from organization roster
  - Assign role during addition
  - Send notification of being added to team

- **Remove Team Members**
  - Team leads and admins can remove members
  - Confirm removal action
  - Notify removed member
  - Reassign their pending tasks before removal

### 4.3 Team Roles & Permissions

- **Role Types**
  - **Team Admin** - Full team management, can add/remove members, assign roles
  - **Team Lead** - Manage jobs and applications, invite members, view analytics
  - **Recruiter** - Manage applications, communicate with candidates, schedule interviews
  - **Reviewer** - View applications and provide feedback, no editing access
  - **Member** - View only, can comment on applications

- **Permission Mapping**
  - Create/edit/delete jobs (Team Admin, Team Lead)
  - Review applications (All roles)
  - Change application status (Team Admin, Team Lead, Recruiter)
  - Schedule interviews (Team Admin, Team Lead, Recruiter)
  - Extend offers (Team Admin, Team Lead)
  - Invite team members (Team Admin, Team Lead)
  - Assign roles (Team Admin only)
  - View team analytics (Team Admin, Team Lead)

- **Role Assignment**
  - Assign role when inviting member
  - Change member role anytime
  - Support multiple roles per member (across different teams)
  - Show effective permissions for each member

### 4.4 Team Organization

- **Team Hierarchy**
  - Support parent-child team relationships (optional)
  - Sub-teams inherit certain settings from parent
  - Organization-wide teams vs. department-specific teams
  - Team visibility controls (who can see this team)

- **Team Settings**
  - Default permissions for new members
  - Job auto-assignment rules
  - Notification preferences for team
  - Team-specific branding (future)

### 4.5 Team Workflows

- **Job Assignment to Teams**
  - Assign jobs to specific teams
  - Multiple teams can collaborate on one job
  - Team members automatically see assigned jobs
  - Notifications when new jobs assigned

- **Application Assignment**
  - Auto-assign applications to team based on job
  - Manually assign applications to specific team members
  - Load balancing across team recruiters
  - Transfer applications between team members

- **Team Collaboration**
  - Comment on applications with @mentions for team members
  - Internal notes visible only to team
  - Application activity feed showing team member actions
  - Team discussion threads (future)

### 4.6 Team Analytics & Reporting

- **Team Performance Metrics**
  - Applications reviewed per team member
  - Average time to review per team
  - Hiring success rate per team
  - Team member activity logs

- **Team Dashboards**
  - Team overview with key metrics
  - Active jobs assigned to team
  - Application pipeline status
  - Team member workload distribution

### 4.7 Team Documents & Resources

- **Shared Resources**
  - Team-specific hiring guidelines
  - Interview question templates
  - Offer letter templates
  - Evaluation rubrics

- **Document Management**
  - Upload team documents
  - Organize by folders
  - Version control for templates
  - Access control for sensitive documents

---

## 5. Non-Functional Requirements

### 5.1 Performance
- **Response Times**
  - Team creation < 2 seconds
  - Member invitation sent < 3 seconds
  - Load team dashboard < 2 seconds
  - Role assignment update < 1 second

- **Scalability**
  - Support 100+ teams per organization
  - Support 50+ members per team
  - Handle concurrent team operations
  - Efficient queries for team member permissions

### 5.2 Security
- **Access Control**
  - Row-level security (RLS) for team data
  - Team members can only see their teams
  - Strict permission enforcement at API level
  - Audit log for all team member actions

- **Data Protection**
  - Encrypt team communication and documents
  - Secure invitation tokens
  - Prevent unauthorized team access
  - Team data isolation per organization

### 5.3 Reliability
- **System Uptime**
  - Team management availability > 99.5%
  - Graceful degradation if features unavailable
  - Queue team invitations during outages

- **Data Integrity**
  - Atomic role assignments (no partial state)
  - Maintain team membership history
  - Prevent orphaned team members

### 5.4 Accessibility
- **UI Accessibility**
  - WCAG 2.1 AA compliant team management UI
  - Keyboard navigation for team operations
  - Screen reader support for team structure
  - Clear role and permission indicators

### 5.5 Mobile Experience
- **Mobile Optimization**
  - Responsive team management interface
  - Mobile-friendly member invitations
  - Quick team switching on mobile
  - Push notifications for team activities

---

## 6. Success Metrics

### 6.1 Quantitative Metrics

- **Adoption Metrics**
  - % of organizations using teams > 70%
  - Average teams per organization: 3-5
  - Average team size: 5-8 members
  - Invitation acceptance rate > 85%

- **Usage Metrics**
  - % of jobs assigned to teams > 60%
  - Team collaboration on applications > 50% of apps
  - Active team members per week > 80%
  - @mentions per application: 2-3

- **Efficiency Metrics**
  - Hiring cycle time reduction: 30%
  - Applications reviewed per week increase: 40%
  - Time to first review decrease: 50%

### 6.2 Qualitative Metrics

- **User Satisfaction**
  - Team management NPS > 40
  - Ease of collaboration score > 4/5
  - Positive feedback on permission clarity
  - Team leads report improved organization

- **Business Impact**
  - Organizations with teams have higher retention
  - Better quality hires from collaborative review
  - Reduced confusion in hiring process
  - Improved accountability in hiring decisions

### 6.3 Operational Metrics

- **System Health**
  - Zero unauthorized access incidents
  - Complete audit trail for compliance
  - Team permission errors < 0.1%
  - Invitation delivery success > 99%

---

## 7. Open Questions & Considerations

### Technical Decisions
1. **Team Hierarchy Depth** - Should we support unlimited team nesting or limit to 2-3 levels?
2. **Permission Caching** - How do we efficiently check permissions for large teams?
3. **Team Size Limits** - Should there be a maximum team size? 50? 100?
4. **Real-time Collaboration** - Should we support real-time presence (see who's online in team)?

### Business Decisions
1. **Default Roles** - What should be the default role when adding a new team member?
2. **Team Limits** - Should we limit number of teams per organization (e.g., based on subscription)?
3. **Invitation Expiration** - How long should invitations remain valid? 7 days? 30 days?
4. **Team Analytics** - What team performance metrics are most valuable?

### Edge Cases
1. **Last Admin** - What happens if the last team admin leaves the organization?
2. **Role Conflicts** - How do we handle conflicting permissions across multiple teams?
3. **Team Deletion** - What happens to jobs and applications assigned to deleted teams?
4. **Member Limit** - What happens when an organization tries to add more members than allowed?

### Future Enhancements
1. **Team Templates** - Pre-configured team structures for common use cases
2. **Delegation** - Temporary delegation of permissions when members are away
3. **Team Automation** - Auto-assign applications based on skills or availability
4. **External Collaborators** - Invite external recruiters or consultants with limited access
5. **Team Chat** - Built-in chat for team communication (vs. just comments)

---

## 8. Related Features

### Direct Dependencies
- **Notification System** - Team invitations, member activity notifications
- **Email System** - Invitation emails, team activity summaries

### Features Depending on This
- **Organization Management** - Teams are part of organization structure
- **ATS** - Teams collaborate on application review
- **Job Management** - Jobs assigned to teams

### Integration Points
- **Payment System** - Team size limits based on subscription tier
- **Application Management** - Team member assignment and collaboration
- **Analytics** - Team performance metrics

---

## 9. Implementation Notes

### API Endpoints (tRPC routers)
- `team.create` - Create new team
- `team.getAll` - Get all teams for organization
- `team.getById` - Get team details
- `team.update` - Update team information
- `team.delete` - Delete/archive team
- `team.inviteMember` - Invite member to team
- `team.addMember` - Add existing org member to team
- `team.removeMember` - Remove member from team
- `team.updateMemberRole` - Change member's team role
- `team.getMembers` - Get all team members
- `team.acceptInvitation` - Accept team invitation
- `team.declineInvitation` - Decline team invitation
- `team.getAnalytics` - Get team performance metrics

### Database Tables
- `teams` - Team records
- `team_members` - Team membership and roles
- `team_invitations` - Pending team invitations
- `team_roles` - Role definitions and permissions
- `team_documents` - Team shared documents (future)

### UI Components
- Team creation form
- Team list/directory
- Team detail page
- Member invitation interface
- Member list with roles
- Role assignment dropdown
- Team settings page
- Team analytics dashboard

### Permissions
- Implement permission checks at API level
- Use RLS policies for database-level security
- Cache permissions for performance
- Support hierarchical permission inheritance

---

*PRD Version: 1.0*
*Last Updated: January 2025*
*Owner: Product Team*
