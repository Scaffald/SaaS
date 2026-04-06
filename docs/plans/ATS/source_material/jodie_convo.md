### Background Screening Industry Overview

- Jodie’s background: inherited mother’s business in 2007, grew from 3 to 15 employees before losing major clients
  - Forced downsizing led to system evaluation and switch from DeVeris to Accio platform
  - Accio based in Texas, component-based pricing structure
  - DeVeris recently approached with lower rates after previous marketing issues
- Industry consolidation: only 3 major background screening platforms remain
- Key data sources and costs:
  - BIS (Background Investigation Services): $6.85 per name for Colorado criminal records
  - [https://bisi.com/?pg=wholesale-co](https://bisi.com/?pg=wholesale-co)
  - Colorado Bureau of Investigation (CBI): [https://cbi.colorado.gov/records-background-checks/employment-and-background-checks](https://cbi.colorado.gov/records-background-checks/employment-and-background-checks)
  - TransUnion for credit reports (requires extensive verification process)

### Data Challenges and Quality Issues

- Social Security numbers are identifiers, not magic keys to all records
  - Multiple identifiers needed: name, DOB, social, address, motor vehicle records
  - Must verify all identifiers belong to same person
- Geographic complications:
  - California removed dates of birth from records (Gavin Newsom policy)
  - Creates massive John Smith problem - can’t distinguish between individuals
  - Wyoming is confidentiality state - no runners allowed, must mail requests
- Checkr problems:
  - Data mining approach creates accuracy issues
  - No proper identifiers in database pulls
  - Joe Smith from California mixed with Joe Smith from other states
  - Over 40 lawsuits in 2019, including major Uber settlement for missed sex offender record

### Regulatory Compliance Framework

- Where the user is based and where the job is based change the rules for background check reporting
- What can be reported and how it is reported or used depends on:
  - FCRA regulations
  - State regulations
  - Employee handbook
- Jodie’s policy:
  - What we report is what we can legally report
  - However what you do with it, how you grade it - is up to you - you make the subjective risk decision on your own, we don’t do that
- State-specific variations:
  - Florida: can report adjudication withheld records but must note limitations
  - California: cannot report first marijuana infractions
  - Georgia: new restrictions on certain offense types

### Client Onboarding

- Initial contact → proposal → follow-up → agreement → system setup
- Proposal documents are standardized, sent via email
- When client says “We’re ready” send them agreement that they have to sign
- Special requirements for credit reporting:
  - They have to add to the agreement when the applicant applies that the applicant agrees to a credit agreement
  - There is a second part of an agreement they would have to agree to:
    - They have to agree to Nationsearch’s agreement about the credit reporting
  - Once the client has signed agreements and paid: (this next part takes 5-10 days)
    - Then they have to go through a 3rd party investigation on-site
    - Then TransUnion gets paperwork and Jodie gets codes that go into the backend of Accio
- Additional service options customers can select:
  - MVR searches - customer would check this on signup
  - Employment searches - customer checks on signup
  - Education searches allowed - customer checks on signup
- Current Accio setup process:
  - Add account - create off template using existing client pricebooks
  - Configure “Add to Crim” settings based on client requirements
    - Different options: 2 counties, 5 years, 2 years, 1 year
    - Clients want to see cost implications - range of costs, different counties cost different things
  - Create user accounts (40% of clients actually log in)
  - Set up skin code for branded UI
  - Configure AKA searches (adds costs - some clients willing to accept risk of skipping)

### New Applicants

- For customers who do log in: they do online order, invite applicant through Accio online order UI
- Some clients fax in release with full name, DOB, license, Social
  - Nationsearch scans, uploads and then shreds it
  - QR code approach would be better - create form same as online order but let applicant fill out their own info
- Quality assurance process: Jodie does QA against all work that is done

### Integration Challenges

- Cannot get into major ATS platforms due to kickback requirements or volume thresholds
  - Paylocity requires either revenue sharing (unaffordable) or minimum client volume
  - Lost TransWest client initially due to lack of integration, regained after 3 months when Paylocity opened APIs
- Checkr dominance in tech companies due to technology connections
  - Martin Marietta uses both Nationsearch and Checkr
  - Checkr took 3 weeks for Pueblo County search, Nationsearch delivered in 2 days

### Questions

- What are the decisions we make when creating an account that define agreement decisions, billing decisions, account settings, and other triggers that we need to setup rules/decisions
- How can we identify which clients we haven’t called in a while - based on notes
- Tasks - to call clients, especially new clients, but old clients on a certain schedule

### Required Features

- Audit logging
- Phone call recording/transcripts
- Notes on all clients, applicants, stages

---

Chat with meeting transcript: [https://notes.granola.ai/t/b0dca5fa-928c-4850-89e1-72606c0a78ac](https://notes.granola.ai/t/b0dca5fa-928c-4850-89e1-72606c0a78ac)