# PRD — scaffald.com/support and scaffald.com/privacy

**Owner:** Clay McIlrath
**Priority:** Blocking — App Store submission cannot proceed without these pages returning 200.
**Deadline:** Before clicking "Add for Review" in App Store Connect.

---

## Background

App Store Connect requires a Support URL and a Privacy Policy URL for every app. Apple reviewers click both links during review. Either page returning 404 results in immediate rejection on the first review cycle.

The URLs already entered in App Store Connect:
- **Support URL:** https://scaffald.com/support
- **Privacy Policy URL:** https://scaffald.com/privacy

Both currently 404. The marketing root (scaffald.com) resolves to 200.

---

## /support

### Goal
Give App Store reviewers (and real users) a place to get help and reach the team.

### Minimum viable content (passes review)
1. **Contact method** — at minimum an email address. `support@scaffald.com` works.
2. **Short description** of what Scaffald is, so the reviewer confirms it matches the app listing.
3. Page title that includes the app name.

### Recommended content
- Email: `support@scaffald.com`
- Response time expectation ("We respond within 1 business day")
- 3–5 FAQ items covering the most likely reviewer/user questions:
  - How do I reset my password?
  - How do I delete my account?
  - How do I report a job posting or user?
  - How do I update my profile or trade certifications?
  - I applied for a job — how do I track its status?
- Link to Privacy Policy (`/privacy`)

### What Apple checks
- Page loads (200)
- Page is in English
- Contact information is present and reachable
- Page is about the app (not a generic company support page)

### Design bar
Simple is fine. A single-column page with the app logo, a paragraph about Scaffald, the FAQ list, and the email is sufficient to pass review. Does not need to match a full marketing design system.

---

## /privacy

### Goal
Satisfy App Store review, applicable privacy laws (CCPA for California users), and user trust. This is a legal document — accuracy matters more than design.

### What Apple checks
- Page loads (200)
- Privacy policy is present and written in plain English
- The types of data collected match what you declared in ASC's App Privacy section
- There is a data deletion or contact mechanism

### Required sections (based on Scaffald's App Privacy declaration in ASC)

#### 1. Introduction
Who is the controller: Unicorn LLC. Contact: support@scaffald.com.
Effective date.

#### 2. What we collect
Match exactly to the App Privacy data types you declared in ASC:

| Data | Why |
|---|---|
| Name | Account creation and display |
| Email address | Authentication, account management, transactional email |
| Phone number | Optional — account recovery, two-factor |
| Precise location | Show nearby jobs and workers on the map (foreground only) |
| Coarse location | Same as above |
| Photos / video | Profile photo and optional job photos |
| Messages | In-app direct messaging between workers and employers |
| User ID | Internal account identifier |
| Device ID | Crash diagnostics and analytics (not linked to identity) |
| Usage data — product interaction | Feature analytics to improve the app (not linked to identity) |
| Crash data | Sentry crash reporting |
| Performance data | App stability monitoring |

#### 3. What we do NOT collect
- Physical/mailing address
- Search history
- Browsing history
- Purchase history
- Financial information
- Health or fitness data

#### 4. How we use your data
- Provide the Scaffald service (matching workers and employers)
- Send transactional notifications (application updates, messages)
- Improve the app via anonymized analytics
- Respond to support requests

We do not sell your data. We do not use your data for cross-app tracking or advertising.

#### 5. How we share your data
- **With employers:** Your name, headline, trade, location (city/state), and certifications are visible to employers when you apply or when your profile is public. Your contact details (email, phone) are never shared without your explicit action.
- **With workers:** Employers' company name, location, and job listings are visible to workers.
- **Service providers:** Supabase (database/auth), Sentry (crash reporting), Expo/EAS (build delivery), Apple Push Notification Service (push notifications). All bound by data processing agreements.
- **Legal:** If required by law or to protect safety.

#### 6. Location data
Location is used only while the app is in the foreground to show nearby jobs and workers on a map. We do not track location in the background. Location data is not sold or shared with third parties for advertising.

#### 7. Data retention
We retain your data for as long as your account is active. You may request deletion at any time — see section 9.

#### 8. Children
Scaffald is not directed at children under 13. We do not knowingly collect data from children.

#### 9. Your rights / data deletion
To delete your account and all associated data:
- In the app: Settings → Account → Delete Account
- By email: support@scaffald.com — include "Delete my account" in the subject

California residents have additional rights under CCPA. Contact support@scaffald.com to exercise them.

#### 10. Changes to this policy
We will update the effective date and notify users in-app for material changes.

#### 11. Contact
Unicorn LLC
support@scaffald.com

---

## Implementation notes

- Both pages can be static HTML/Markdown rendered by whatever powers scaffald.com (Vercel, Cloudflare Pages, etc.)
- No authentication required — they must be publicly accessible
- No specific design required — plain readable text is acceptable to Apple
- HTTPS required (already handled by your domain)
- Both pages must return exactly **200** (not 301/302) — Apple's checker may not follow redirects reliably

## Acceptance criteria

- [ ] `curl -sL -o /dev/null -w "%{http_code}" https://scaffald.com/support` returns `200`
- [ ] `curl -sL -o /dev/null -w "%{http_code}" https://scaffald.com/privacy` returns `200`
- [ ] /privacy contains: data types listed above, data deletion instructions, contact email
- [ ] /support contains: contact email, basic FAQ or help content
- [ ] Both pages title/content clearly reference "Scaffald"
