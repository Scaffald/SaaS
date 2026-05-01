# App Store Review — Notes for Reviewer
## (Paste into App Store Connect → iOS App Version → App Review Information → Notes)

---

Scaffald is a hiring marketplace for the skilled trades — welders, electricians, plumbers, HVAC techs, scaffold crews, and the contractors who hire them.

Two demo accounts are provided. Sign in with **Email** on the Sign In screen (tap "Sign in with email" if the Apple/Google buttons appear first).

---

**WORKER ACCOUNT**
Email: reviewer-worker@scaffald.com
Password: Scaffald2026!

Persona: Alex Martinez — Journeyman Welder, Detroit MI. Prerequisites already completed; the account lands directly in the app (no onboarding required).

Suggested flow:
1. Sign in → lands on the Jobs tab (map view)
2. Map shows open trade positions near Detroit — tap any pin or card
3. Tap "Pipe Welder / Fabricator" at Apex Mechanical Inc.
4. Tap **Quick Apply** to submit the pre-filled application
5. Tap the profile tab to view Alex's worker profile (headline, experience, location)

---

**EMPLOYER ACCOUNT**
Email: reviewer-employer@scaffald.com
Password: Scaffald2026!

Persona: Jamie Chen — Owner of Apex Mechanical Inc., Detroit MI. Prerequisites already completed; the account lands directly in the app (no onboarding required).

Suggested flow:
1. Sign in → lands on the Dashboard (employer view)
2. Tap **Jobs** → see 3 active listings for Apex Mechanical
3. Tap "Pipe Welder / Fabricator" → tap **Applications** → Alex Martinez's application is already in the pipeline
4. Tap Alex's application → tap **Message** to initiate a conversation
5. Tap **Workers** tab to browse the verified worker directory and filter by trade or location

---

**Permissions used:**
- **Location (foreground only):** surfaces nearby jobs and workers on the map. The app requests location when the user first opens the Jobs or Workers map tab — it is never used in the background.
- **Push notifications:** sent for new job matches, application status changes, and incoming messages. The app requests permission after sign-in.

**No in-app purchases. No third-party advertising. No unrestricted web browsing.**

User-generated content (profiles and job listings) is limited to authenticated users and subject to moderation. No public posting or anonymous content.

---

Questions during review: support@scaffald.com or clay@unicorn.love
