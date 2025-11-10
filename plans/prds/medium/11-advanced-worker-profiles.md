# PRD: Advanced Worker Profile Features

**Status:** Medium Priority
**Effort Estimate:** 2-3 weeks
**Dependencies:** Worker Profiles (basic), Work Log System
**Related Features:** Job Matching, Search, Background Checks

---

## 1. Overview

Advanced Worker Profile Features extend the basic worker profile with project portfolios, video introductions, availability calendars, driver's license tracking, skill endorsements, and enhanced media galleries. These features help workers stand out and provide organizations with richer information for hiring decisions.

**Ecosystem Context:** In skilled trades, visual portfolios, availability, and verified credentials differentiate excellent workers from good ones. Advanced profile features enable workers to showcase their best work and qualifications.

---

## 2. Goals & Objectives

### Primary Goal
Enable workers to create comprehensive, engaging profiles that showcase their skills, experience, and availability to increase hiring opportunities.

### Secondary Goals
1. **Visual Portfolio** - Showcase work through photos and videos
2. **Availability Transparency** - Clear communication of availability and schedule
3. **Credential Tracking** - Maintain driver's license and certification expiration dates
4. **Social Proof** - Skill endorsements from colleagues and employers
5. **Profile Completeness** - Incentivize complete, high-quality profiles

### Success Criteria
- 70% of workers add at least one project to portfolio
- 50% of workers upload profile video
- 60% of workers maintain availability calendar
- Workers with complete advanced profiles get 50% more opportunities
- Skill endorsements increase profile trust score

---

## 3. User Stories

### Worker
- **As a worker**, I want to showcase my best projects with photos so that employers see my work quality
- **As a worker**, I want to upload a video introduction so that employers can get to know me
- **As a worker**, I want to maintain my availability calendar so that employers know when I can start
- **As a worker**, I want to track my driver's license expiration so that I stay compliant
- **As a worker**, I want to receive skill endorsements so that my profile has social proof

### Employer/Organization
- **As an employer**, I want to view a worker's project portfolio so that I can assess their capabilities
- **As an employer**, I want to watch video introductions so that I can evaluate communication skills
- **As an employer**, I want to see worker availability so that I can plan project staffing
- **As an employer**, I want to see endorsed skills so that I trust the worker's claimed expertise

---

## 4. Functional Requirements

### 4.1 Project Portfolio

**Project Creation**
- Project name and description
- Project dates (start/end)
- Worker's role on project
- Organization/contractor
- Skills used
- Project scope and accomplishments
- Certifications required

**Project Media**
- Upload multiple photos (before/after, progress, finished)
- Photo captions and descriptions
- Organize photos in galleries
- Video uploads (future)

**Project Organization**
- Featured projects (highlight best work)
- Filter projects by type, skill, date
- Project privacy controls

### 4.2 Video Introduction

**Video Upload**
- Record or upload video (max 2 minutes)
- Webcam/camera integration
- Video compression and optimization
- Preview before publishing

**Video Content Suggestions**
- Introduction and background
- Skills and experience highlights
- Work philosophy and approach
- Availability and goals

### 4.3 Availability Calendar

**Calendar Management**
- Mark available/unavailable dates
- Set availability patterns (Mon-Fri, weekends)
- Note partial availability (mornings only)
- Set availability range (next 3-6 months)

**Availability Status**
- Currently available (start immediately)
- Available soon (start date)
- Not available (currently employed)
- Open to opportunities

**Preferences**
- Preferred project duration
- Willing to travel (distance radius)
- Preferred start times
- Schedule flexibility

### 4.4 Driver's License & Compliance Tracking

**License Information**
- Driver's license number (encrypted)
- License state and class
- Expiration date
- Endorsements (CDL, etc.)
- Restrictions

**Expiration Alerts**
- Reminder 60 days before expiration
- Warning 30 days before expiration
- Urgent alert at expiration
- Profile status indicator if expired

**Other Credentials**
- OSHA certifications expiration
- Safety training renewals
- Professional license renewals
- Track all time-sensitive credentials

### 4.5 Skill Endorsements

**Request Endorsements**
- Request endorsement from colleagues
- Request from previous employers
- Specify skills to endorse

**Provide Endorsements**
- Endorse worker's skills
- Add endorsement note/testimonial
- Specify how skills were observed
- Link to project worked together

**Endorsement Display**
- Show endorsement count per skill
- Display endorser names and roles
- Verified endorsements (from platform users)
- External endorsements (from non-users)

### 4.6 Media Gallery

**Photo Management**
- Upload work photos
- Organize into albums
- Tag photos by skill/project
- Set featured images

**Video Management**
- Upload work videos
- Video thumbnails
- Video descriptions
- Embed external videos (YouTube)

### 4.7 Profile Completeness

**Completion Tracking**
- Progress bar showing profile completeness
- Checklist of missing sections
- Priority recommendations
- Completion badges/rewards

**Profile Sections**
- Basic info (name, location, contact)
- Skills and certifications
- Work experience
- Education
- Projects portfolio
- Video introduction
- Availability calendar
- References/endorsements

---

## 5. Non-Functional Requirements

### 5.1 Performance
- Profile load < 3 seconds with media
- Video upload < 30 seconds per MB
- Photo upload < 5 seconds per photo
- Calendar interactions < 1 second

### 5.2 Storage
- Video limit: 100MB per video, 2 videos per profile
- Photos: 20MB per photo, 50 photos per profile
- Automatic compression and optimization

### 5.3 Accessibility
- WCAG 2.1 AA compliant
- Video captions support (future)
- Alt text for portfolio images

---

## 6. Success Metrics

- 70% of workers add project portfolio
- 50% upload profile video
- 60% maintain availability calendar
- Workers with advanced features get 50% more opportunities
- Profile completeness average: 80%

---

## 7. Related Features

- **Work Log System:** Projects link to work logs
- **Background Checks:** Credentials verified via checks
- **Job Matching:** Availability impacts matching

---

## 8. Implementation Notes

### API Endpoints
- `profile.addProject`, `profile.uploadVideo`, `profile.setAvailability`
- `profile.addEndorsement`, `profile.trackLicense`

### Database Tables
- `worker_projects`, `worker_videos`, `worker_availability`
- `worker_endorsements`, `worker_credentials`

### Storage
- Supabase Storage for videos and project photos
- CDN for optimized media delivery

---

*PRD Version: 1.0*
*Last Updated: January 2025*
