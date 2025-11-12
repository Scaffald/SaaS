## REQ-173 Feedback Widget Manual QA

- **Access & Visibility**  
  - Log in with a dashboard-capable account on web and mobile (Expo dev client).  
  - Visit `/dashboard`. Confirm the floating “Feedback” button renders bottom-right above content but below modals.  
  - Verify the offline banner appears when `pendingCount > 0` by toggling network throttling (Chrome dev tools offline, Expo dev tools “Offline”).

- **Modal & Validation**  
  - Open the modal; ensure `Feedback Type` buttons toggle selection state and the submit CTA stays disabled until a type and ≥100 characters are provided.  
  - Enter <100 characters and blur the textarea to confirm inline error + red counter.  
  - Provide ≥100 characters, confirm counter switches to default color and errors clear when re-validating.

- **Screenshot Upload**  
  - Upload a PNG under 5 MB from desktop; confirm preview renders with filename and “Remove” option.  
  - Attempt to upload >5 MB (use test asset) and unsupported format (e.g., `.bmp`) to verify inline error messaging and no preview added.  
  - Validate native flow via Expo app by selecting a photo from camera roll.

- **Submission Flow**  
  - With network online, submit a valid bug report. Expect loading state on CTA, toast “Feedback Submitted!”, modal closes, pending banner hidden.  
  - Inspect Supabase `logs.user_feedback` (local Supabase Studio) to confirm record with captured context (page URL, browser info, screenshot path when provided).  
  - Verify edge function invocation updates `braingrid_sync_status` to `synced` or `failed` with error payload (check logs in Supabase function execution or table columns).

- **Offline Queue & Retry**  
  - Disable network prior to submission; expect warning toast “Submission Saved Locally.”  
  - Refresh, ensure offline notice persists (`pendingCount` reflects queued items).  
  - Re-enable network, press “Retry Pending,” confirm toast success and queue clears automatically.

- **Accessibility & Keyboard**  
  - Tab to the floating button, hit Enter to open modal. Ensure focus lands on `Feedback Type` controls and Escape closes modal.  
  - Screen reader (VoiceOver / NVDA) announces field labels, errors, and context summary text.  
  - Validate that buttons (`Retry Pending`, CTA) have accessible names and remain operable via keyboard-only navigation.

- **Regression Checks**  
  - Confirm drawer notifications menu still functions when modal is open/closed.  
  - On mobile (Expo), verify the feedback button overlays correctly across tabs and does not interfere with navigation gestures.  
  - Ensure no console errors in web dev tools or Metro logs during widget interactions.

- **Post-Submission Verification**  
  - Confirm Braingrid receives request (inspect function logs or Braingrid UI).  
  - Validate emails/alerts downstream if configured (optional).  
  - Repeat for feature request & general comment to verify type mapping.

