# Features Documentation

This directory contains detailed documentation for Scaffald's major features and implementations.

## Current Features

### Office Administration (Super Admin)
- **Status**: ✅ Implemented
- **Documentation**: 
  - [Office Organizations CRUD](../office/organizations-crud.md) - Organization management
  - [Office CRUD Standards](../office/crud-standards.md) - Standards and patterns
- **Description**: Super admin interface for managing platform resources
- **Key Features**:
  - **Organizations Management**: Create, update, delete organizations with industry classification
  - **Jobs Management**: Admin interface for job postings
  - **Users Management**: User administration and role management
  - **Universities Management**: University catalog with import and CRUD
  - **Applications Management**: View and manage job applications across organizations
- **Components**:
  - Unified OfficePageLayout with consistent styling
  - Reusable form components with Zod validation
  - Standardized list/table patterns with pagination
  - tRPC endpoints with proper RLS and service role access
- **Routes**: `/office/*` - Only accessible to super admins

### Profile Completion System
- **Status**: ✅ Implemented
- **Description**: Dashboard widget that tracks profile completion across different sections (general, employment, education, skills, certifications, experience)
- **Components**: 
  - Generic checklist UI components (`packages/ui/src/components/checklist/`)
  - Profile completion logic (`packages/core/features/dashboard/completion/`)
  - tRPC endpoint for completion status
- **Key Features**:
  - Real-time progress tracking
  - Clickable navigation to incomplete sections
  - Clean, left-aligned UI design
  - Responsive across all platforms

### Multi-Taxonomy Skills System
- **Status**: ✅ Implemented
- **Description**: Comprehensive skills management system with multiple industry taxonomies
- **Key Features**:
  - **CSI MasterFormat**: Construction industry skills with CSI codes
  - **O*NET Integration**: Occupational skills and requirements database
  - **Industry-based filtering**: Skills filtered by selected industries
  - **Multi-taxonomy search**: Search across CSI, O*NET, and custom skills
  - **Polymorphic associations**: Skills linked to profiles, jobs, organizations
  - **Proficiency levels**: Support for skill proficiency tracking
- **Database**: Dedicated `data` schema for taxonomies, migrations for O*NET import
- **Components**: `ProfileSkillsLeft.tsx` - Two-column inline pattern with search

### Address & Location System
- **Status**: ✅ Implemented
- **Description**: Comprehensive address autocomplete and location management system
- **Key Features**:
  - **Dual Provider Support**: Mapbox and Google Places APIs
  - **Address Autocomplete**: Real-time address suggestions with debouncing
  - **Location List Input**: Multi-location management component
  - **Geocoding**: Convert addresses to coordinates and vice versa
  - **Organization Locations**: JSONB-based location storage for organizations
  - **Infinite Loop Prevention**: Stable rendering with proper effect dependencies
- **Components**:
  - `AddressAutocomplete.tsx` - Main autocomplete component
  - `LocationListInput.tsx` - Multi-location list management
  - `OrganizationLocationsInput.tsx` - Organization-specific location input
  - `useAddressAutocomplete.ts` - Hook for autocomplete logic
  - `useGeocodingProvider.ts` - Provider abstraction layer
- **Database**: Migration 093 adds `locations` JSONB column to organizations

### News Feed System
- **Status**: ✅ Implemented
- **Description**: RSS-based news feed system for industry-specific content
- **Key Features**:
  - Multiple RSS feed support (ENR and other construction industry feeds)
  - Industry-specific content filtering
  - Real-time feed updates
  - Cross-platform news widgets
  - CORS proxy for feed fetching
- **Components**: 
  - RSS parser (`packages/core/features/news/utils/rss-parser.ts`)
  - News hooks (`packages/core/features/news/hooks/useNewsFeed.tsx`)
  - News widgets and cards (`packages/core/features/news/`)

### Job Management & ATS System
- **Status**: 🚧 76% Complete - Phase 4B In Progress
- **Documentation**: 
  - **[ATS Roadmap](./ats-roadmap.md)** - 📋 Complete status and GitHub issue mapping (single source of truth)
  - [ATS Implementation (UI-First)](./ats-implementation-revised.md) - UI-first development approach
  - [ATS Getting Started](./ats-getting-started.md) - Setup and quickstart guide
  - [ATS Schema](./ats-schema.md) - Basic database schema
  - [ATS Schema Design (Full)](../roadmap/ats-schema-design.md) - Complete future schema
- **Description**: Complete job posting, application, and applicant tracking system
- **Implementation Status**:
  - ✅ Phase 1: Database Schema & Storage (100%)
  - ✅ Phase 2: Backend API & Validation (100%)
  - ✅ Phase 3: Candidate Application Flow (100%)
  - ✅ Phase 4A: Core Recruiter UI (100%)
  - 🚧 Phase 4B: Backend Integration (50%)
  - ⏳ Phase 4C: Advanced Features (Planned)
  - ⏳ Phase 5: Analytics & Compliance (Planned)
- **Key Features**:
  - **Job Postings**: Create jobs with skills, certifications, location requirements
  - **Application Flow**: Multi-step wizard with screening questions, custom questions, file uploads
  - **Auto-Screening**: 100-point scoring algorithm with auto-rejection rules
  - **Recruiter UI**: Kanban board with 6 status columns, candidate detail modals
  - **File Management**: Resume, cover letter, portfolio storage with signed URLs
  - **Notes & Ratings**: Private recruiter notes with 5-star rating system
  - **Messaging**: Direct communication between recruiters and candidates
  - **Status Management**: Track applications through hiring pipeline
- **Database**: Migrations 075-078 (enhanced applications), 092 (applications view), 093 (organization locations)
- **Components**: 2,034 lines (Kanban board, detail modal, filters, mock data)
- **GitHub Issues**: 24 total (3 complete, 3 in progress, 18 planned)

## Planned Features

### O*NET Career Intelligence Integration
- **Status**: 📋 Planning Complete, Ready for Implementation
- **Documentation**: 
  - **[O*NET Integration](./onet-integration.md)** - 📚 Complete feature documentation
  - **[O*NET Roadmap](./onet-roadmap.md)** - 📋 Implementation roadmap with GitHub issues
- **Description**: Comprehensive integration of O*NET 30.0 Database for intelligent career guidance, skill recommendations, and enhanced job matching
- **Key Features**:
  - **RIASEC Career Assessment**: Scientific interest profiling during onboarding
  - **Career Recommendations**: AI-powered occupation matching based on user interests
  - **Skills Auto-Population**: Smart skill suggestions from occupation data
  - **Career Explorer**: Browse and search 1,000+ occupations with detailed insights
  - **Skill Gap Analysis**: Identify missing skills for target careers
  - **Enhanced Job Matching**: Multi-dimensional compatibility scoring (skills, abilities, interests, work values)
  - **Dashboard Widgets**: Career insights prominently displayed
  - **Abilities & Knowledge Tracking**: Comprehensive profile beyond just skills
- **Implementation**: 7-week phased approach across 6 phases
- **Business Value**:
  - Guide workers to discover new career paths
  - Increase profile completion by 30%
  - Improve job match quality by 25%
  - Differentiate platform with science-backed guidance
- **Foundation**: O*NET 30.0 database already imported with 1,016 occupations

### RSS Job Feeds Integration
- **Status**: 📋 Planned
- **Documentation**: Pending (summary tracked in product backlog)
- **Description**: Automatic fetching, parsing, and caching of job listings from external RSS feeds
- **Key Benefits**:
  - Expanded job market access
  - Skill-based job matching
  - Real-time job updates
  - Enhanced user value proposition
- **Implementation**: 8-week phased approach across 4 phases
- **Note**: Core job system is implemented; this adds external job feed integration

## Documentation Standards

Each feature documentation should include:

1. **Overview** - High-level description and business value
2. **Implementation Status** - Current state and completion status
3. **Technical Architecture** - Database schema, API design, service layer
4. **Implementation Plan** - Phased approach with clear milestones (for planned features)
5. **Testing Strategy** - Unit, integration, and E2E test plans
6. **Security Considerations** - Data protection and access control
7. **Monitoring & Metrics** - Key performance indicators
8. **Future Enhancements** - Roadmap for continued development

## Contributing

When adding new feature documentation:

1. Create a new markdown file in this directory
2. Follow the established documentation structure
3. Include implementation checklists with clear deliverables
4. Update this README with the new feature
5. Link to relevant code locations and components

## Quick Links

- [Architecture Documentation](../architecture/) - System design patterns
- [Deployment Guides](../deployment/) - Production deployment
