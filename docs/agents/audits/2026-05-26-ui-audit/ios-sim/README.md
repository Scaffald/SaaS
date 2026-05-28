# iOS simulator deep-dive — handoff

Phase C-2 of the 2026-05-26 audit was supposed to verify the top web-audit
findings on the actual iOS simulator. Hit two CLI blockers I can't get around
without your hands on the keyboard.

## What's captured here

- `00-launch.png` — initial sim state when the app cold-launched
- `01-after-deeplink.png` — same state after attempting `xcrun simctl openurl`
- `02-after-esc.png` — same state after attempting an Esc keystroke

## Blockers

1. **OS-level Apple Account Verification dialog** is covering the dev client
   landing. It's a system dialog (likely tied to the sim's iCloud account
   prompting for password). Can't be dismissed via `xcrun simctl` — needs a
   manual tap on **Not Now**.
2. **`xcrun simctl` has no tap primitive** — the official CLI exposes
   `appearance` / `content_size` UI settings but not arbitrary touch events.
   Third-party options (`idb`, `cliclick`) aren't installed; `osascript`
   keystrokes are blocked without Accessibility permission for Terminal.

## Hand-off — ~10 min for you

1. Open the Simulator app (already booted: iPhone 16e).
2. Tap **Not Now** on the Apple Account Verification dialog.
3. In the Scaffald (development) dev menu, tap `http://192.168.1.43:8081`
   (or `localhost:8081`). The bundle should load.
4. Sign in if not already (clay@unicorn.love / password123).
5. Walk these 6 screens and capture each via:
   ```bash
   xcrun simctl io booted screenshot \
     docs/agents/audits/2026-05-26-ui-audit/ios-sim/<name>.png
   ```

   | Target | Web finding to verify | Capture name |
   |---|---|---|
   | `/auth` (signed out) | B6 (cookie banner blocks CTAs) | `auth-unauth.png` |
   | `/auth/verify` | P6 (top whitespace, OTP keyboard) | `verify.png` |
   | `/onboarding` | B1 (Loading hang — native too?) | `onboarding.png` |
   | `/profile/resume` | B3 (Loading hang — native too?) | `profile-resume.png` |
   | `/workers` (scroll to bottom) | P5 (tab bar clipping content) | `workers-bottom.png` |
   | `/jobs` then tap a job | (dynamic — couldn't reach on web) | `jobs-detail.png` |

6. For each, note in `findings.md` whether the bug reproduces natively or is
   web-only. Native-only issues should get a new ticket; native+web confirms
   the existing SC-77–89 ticket scope is correct.

## Why this matters

Native-only issues are usually safe-area / status-bar / modal-sheet bugs that
RN Web doesn't surface. If any of the Loading hangs (B1, B2, B3) work fine on
native, the issue is in web-specific data-fetching code (likely SWR/RSC
hydration) and not the underlying API.
