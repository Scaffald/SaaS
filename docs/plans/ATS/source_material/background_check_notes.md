Key ATS- and background-check–related points that are currently missing or too light in your notes:

### 1\. Overall Product Direction (Scaffold-style ATS on top of Accio)

-   Build a highly flexible ATS/ops system that:
    -   Sits on top of Accio’s API instead of rebuilding all 50-state integrations
    -   Treats Accio (and others like BIS, runners, etc.) as pluggable providers behind a translation layer
    -   Lets NationSearch (and later clients) customize stages, triggers, emails/SMS, and workflows without hard‑coding
-   Design it so:
    -   NationSearch can start with Accio for all data
    -   Over time, specific components (e.g., BIS, direct county/runners) can be swapped in “behind the scenes” where they’re better/cheaper/faster
    -   NationSearch remains a processor, not custodian, when possible (data stays with providers; only pulled when needed)

### 2\. Dynamic Rules Engine for Background-Check Logic

You talked a lot about needing rules and decisions in software, not just static settings:

-   Account-level rules that define:
    -   Agreement decisions (e.g., what they’ve contracted for, especially credit)
    -   Billing decisions (how packages and components are priced/marked up)
    -   Background-search scope rules:
        -   Lookback (2/5/7/10 years)
        -   County vs statewide vs federal components
        -   Which states/counties to search (e.g., current address only vs all addresses in X-year window)
        -   AKA handling (# of names, cost vs risk)
    -   Reporting rules:
        -   What’s legally reportable under FCRA + state law
        -   What *you* will report vs what the employer decides to act on
-   Desire for:
    -   A rule builder where you can say in plain language what should happen (

If candidate lives in CA and position is in FL, then…

), and AI helps convert that to system rules

-   Ability to manage:
    -   FCRA vs federal vs state conflicts (e.g., 7 vs 10 years)
    -   State-specific quirks (CA DOB removal, WY confidentiality, FL adjudication withheld, GA limits)
    -   Employer policy differences (e.g., theft thresholds, what civil infractions they care about)

### 3\. Account Creation / Client Onboarding – More Detail

You described a more nuanced flow than what’s in your notes:

-   Desired future flow (inside your own system):
    -   Public intake form on your site:
        -   Basic company info
        -   Which services they want: criminal, MVR, employment/education, civil, credit, drug, etc.
        -   Scope preferences (lookback period, counties vs statewide, AKA policy)
    -   That intake:
        -   Creates a “lead/client record” with status (Contacted → Proposal → Agreement → Active)
        -   Stores proposal details (what you promised, prices, packages) so you don’t have to hunt through Word docs
        -   Drives generation of the agreement (including credit addendum if needed)
    -   After signed agreement + payment:
        -   Kick off Accio account creation from your app (via API), mapping:
            -   Selected components (criminal, MVR, employment, education, civil, etc.)
            -   Add-to-Crim rules (e.g., “up to 2 counties in last 5 years”)
            -   AKA handling
            -   Restrictions (credit allowed, MVR allowed, etc.)
        -   Optionally trigger 3rd-party onsite inspection + TransUnion onboarding when credit is selected
-   Need to explicitly capture and store, per client:
    -   Where they’re based and where they hire (impacts reporting rules)
    -   Their risk/HR policies (e.g., theft over $50k; marijuana in CA/other; how they treat civil cases)
    -   Their preferences on:
        -   AKA searches
        -   Address history depth
        -   Whether they want you to *call* courts/runners when data is unclear/expensive
    -   Whether they want to log in and self-order vs send you fax/email (and whether they pay more if you do the ordering)

### 4\. Applicant Intake & Background Check Workflow

Missing/background items:

-   Current modes:
    -   40% of clients log in to Accio and place orders themselves
    -   60% still rely on you to do ordering (fax/email/phone); you scan/upload/shred releases
-   Desired improvements:
    -   QR-code or link-based applicant intake:
        -   Client or NationSearch triggers an invite
        -   Applicant fills out the same information they’d otherwise handwrite / fax (name, DOB, SSN, addresses, license, etc.)
        -   Reduces errors and manual data entry
    -   System should:
        -   Auto-construct the background check “order” based on:
            -   Client’s scope rules
            -   Candidate’s address history & identifiers
        -   Route out to:
            -   Databases (BIS, statewide, multijurisdictional)
            -   County-level searches
            -   Runners where necessary (e.g., WY, tricky CA counties, etc.)
            -   CBI and equivalent for other states, if used
        -   Trigger manual “phone-call required” tasks where the only option is to call a clerk or runner
-   AI and workflow examples you discussed:
    -   Use a workflow engine (like Temporal style) to:
        -   Handle steps that wait on humans (runners, county offices, onsite inspections)
        -   Resume automatically when data comes back
    -   Use AI:
        -   To propose rules (

You said you want 5-year scope and California candidates. Suggest these settings…

) - To generate and adjust email/SMS templates - To help build “if this then that” workflows from natural language

### 5\. Data Sources and Provider Abstraction

You went deeper than the notes capture:

-   Providers to abstract behind your “translation layer”:
    -   Accio (core background platform + integrations)
    -   BIS (CO statewide criminal)
    -   CBI (arrest records)
    -   TransUnion (credit)
    -   State-specific portals (e.g., FL public records, WY courts)
    -   Runners (CA counties, WY, other hard jurisdictions)
    -   Possibly other data brokers (but carefully—quality & liability)
-   Goals:
    -   Central “provider abstraction” layer:
        -   Your app talks to “CriminalSearch” not “BIS vs Accio vs county runner”
        -   You can swap/compose providers per state/county/source without changing the front-end or your internal logic
    -   Like your email gateway idea:
        -   Multiple email providers behind one app → multiple background data providers behind one interface
        -   Ability to fall back if one provider is down/slow

### 6\. Compliance / Reporting Logic & Documentation

More explicit elements you mentioned:

-   Need to encode:
    -   State rules:
        -   CA: no DOB on public terminals; limits on reporting first marijuana offenses; DOB workaround via runners/calls
        -   FL: OK to *report* adjudication withheld, but employer must be told about FCRA limits
        -   WY: confidentiality state; must mail; no runners; slow, manual processes
        -   GA and others: specific new restrictions (e.g., certain offenses can’t be reported)
    -   Federal vs state scope rules:
        -   FCRA 7-year rule
        -   Federal “go back 10 years” expectation for some roles
    -   Sector-specific considerations:
        -   Healthcare, vulnerable populations (elderly, kids) vs construction vs tech
-   Documentation & notes:
    -   You emphasized the need for:
        -   Notes on every client, candidate, and search:
            -   Who you spoke to (client or clerk)
            -   When
            -   What they said (e.g.,

clerk confirmed warrant belongs to X based on DOB,

client requested report outside 10-year scope verbally,

etc.) - Central place to record: - When you went “above scope” (e.g., found a murderer older than 10 years, told client verbally) - Why you made judgment calls (e.g., ignored obvious wrong John Smith in San Diego because candidate never lived there)

-   This ties directly into:
    -   Audit logging
    -   Litigation defense
    -   Protecting the business when clients misuse information

### 7\. Client & Relationship Management Features

You touched on CRM-like needs, specific to background checks:

-   Need to:
    -   Track proposals (content + pricing) and whether they converted
    -   Track:
        -   Last contact with each client
        -   Follow-up tasks (esp. for new clients and key legacy clients)
        -   “At-risk” clients (e.g., ones that switched to Paylocity/Checkr before)
    -   Have notes and tasks embedded in the same place as:
        -   Account settings/rules
        -   Integration setup
        -   Background-check history (high level)
-   Specific questions you raised:
    -   How do we:
        -   Identify which clients we haven’t called in a while?
        -   Automatically create tasks to call:
            -   New clients on some cadence
            -   Long-term clients on a retention cadence
    -   Desired: a simple, non–Salesforce, non–HubSpot CRM layer focused on:
        -   Relationships
        -   Rules/configs
        -   Compliance notes

---

If you want, I can now:

-   Expand your existing notes with these items; or
-   Organize them into a clearer “Product Requirements” spec (sections for ATS, background workflow, compliance, integrations, CRM, etc.).