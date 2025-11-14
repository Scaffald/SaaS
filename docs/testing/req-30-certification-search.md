# REQ-30 – Certification Search Manual QA

End-to-end checklist for validating the multi-level certification search and immediate add workflow across web and Expo clients.

## Preconditions

- Local stack running (`pnpm dev`, Supabase, background services). Do **not** run tests against production tenants.
- Seed data loaded (default test user `regular` owns a handful of OSHA certifications already).
- Playwright helpers (`signInAsTestUser`, `ensureProfileComplete`) succeed – profile must be fully completed to access `/dashboard/profile/certifications`.
- Recommended browsers: Chromium + Safari. Mobile: Expo Go or dev client (iOS + Android simulators).

## Web Flow

1. **Navigate**
   - Sign in via web.
   - Go to `/dashboard/profile/certifications`.
   - Wait for both left (search) and right (Your Certifications) panels to render.

2. **Search Grouping**
   - Focus the search input (`placeholder` contains “Search certifications…”).
   - Type `OSHA`.
   - Verify the dropdown stays open and shows headers for:
     - `Top Level Categories`
     - `<Parent> > Categories`
     - `<Parent> > Certifications`
   - Confirm cards display depth badges (Top Level / Category / Certification) and descriptions when present.

3. **Immediate Add – Depth 2**
   - Click any card from the `cert-search-card-2` column (first “Specific Certification” entry works).
   - Expect toast: title `Certification Added`, message `<Name> added successfully`.
   - Dropdown should remain open, search input should still contain `OSHA`, and the selected card disappears from results.
   - In the right panel under “Specific Certifications” the same certification should appear with `✓ Added to profile` highlight for ~3 seconds.

4. **Immediate Add – Depth 1 and Depth 0**
   - Repeat for a Category card (depth 1) and a Top Level card (depth 0). This exercises parent-chain creation.
   - Validate toasts + highlight each time.

5. **Duplicate Prevention**
   - Attempt to add a certification that is already present:
     - Use the search input, type an existing name (e.g., one of the cards you just added before removing it).
     - Because the UI filters owned IDs, manually force a duplicate check by quickly clicking the same card twice before it disappears; the second click should show `Already Added` toast.
   - Alternatively toggle a depth 2 checkbox that is already checked in the right panel – should display `Already Added` toast and no extra record should appear in Supabase.

6. **Cleanup**
   - For each certification added in this session, open the matching card in “Your Certifications” and click `Remove`. Confirm the highlight flips to `Removed from profile` and the card disappears after refetch.

## Mobile / Expo Flow

1. Launch Expo client (iOS + Android) and sign in with the same test user.
2. Navigate to Profile → Certifications.
3. Repeat search/add/remove scenarios above. Pay attention to:
   - Virtual keyboard not hiding dropdown results.
   - Toasts using native Burnt toasts (3s auto-dismiss).
   - Highlight banner appearing inside the scrollable right column (QuickLinks tray) without layout jumps.

## Error / Edge Cases

- **Network failure:** With devtools or Charles, abort the POST to `profile.certifications.addCertification`. UI must show `Unable to add this certification right now.` and keep the card visible.
- **Supabase duplicate guard:** From psql or the Supabase dashboard, manually insert a duplicate row for the same user/cert and ensure the UI surfaces the “You already have this certification” toast on next press.
- **Proof optionality:** After adding a cert, expand it and confirm you can leave both file + URL blank, and later add/remove proof via the right panel.
- **Section empties:** Search for a term with only depth-2 matches and ensure depth-0/1 headers hide automatically (no blank sections).

## Expected Outputs

- Multi-depth results appear within 300 ms debounce and remain open during repeated adds.
- Toasts and highlights appear for every successful add/remove.
- Search input never clears automatically; user can continue adding multiple items.
- Duplicate attempts never create extra rows in `core.user_certifications` (check via Supabase dashboard if needed).

Document any discrepancies (screenshots + console logs) and reset the certification list to its original state at the end of each run.***

