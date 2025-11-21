# SCF-Neue Documentation

**Welcome to the SCF-Neue documentation!** This directory contains all technical documentation, implementation guides, and feature specifications.

**Last Updated:** November 19, 2025

---

## 📚 Quick Navigation

### For New Developers
1. Review [Features Documentation](./features/README.md) - All implemented and planned features
2. Check [Deployment Guides](./deployment/README.md) - Setting up your environment
3. Review [Code Quality Standards](./code-quality/) - TypeScript and linting guidelines

### For Feature Development
- [Features Directory](./features/) - Detailed feature specifications and progress
- [Office Administration](./office/) - Admin interface documentation
- [Code Quality Standards](./code-quality/) - TypeScript and linting guidelines

### For Deployment
- [Deployment Guides](./deployment/) - Production deployment instructions
- [OAuth Configuration](./deployment/oauth-configuration.md) - Authentication setup
- [Supabase Setup](./deployment/supabase-cloud-setup.md) - Database configuration

---

## 📂 Documentation Structure

```
docs/
├── README.md (this file)
│
├── features/                        # Feature Documentation
│   ├── README.md                   # Feature index
│   ├── ats-roadmap.md             # ATS implementation status (76% complete)
│   ├── ats-implementation-revised.md
│   ├── ats-getting-started.md
│   ├── ats-schema.md
│   ├── address-form-abstraction.md
│   ├── onet-integration.md
│   ├── onet-roadmap.md
│   └── ... (more feature docs)
│
├── office/                          # Office Administration
│   ├── crud-standards.md           # Standards and patterns
│   └── organizations-crud.md       # Organization management guide
│
├── code-quality/                    # Code Quality & Standards
│   └── improvements.md             # TypeScript strict checks progress
│
├── deployment/                      # Deployment Guides
│   ├── README.md
│   ├── aws-setup.md
│   ├── oauth-configuration.md
│   ├── supabase-cloud-setup.md
│   └── supabase-seeding.md
│
└── roadmap/                         # Future Planning
    └── ats-schema-design.md        # Complete ATS schema design
```

---

## 🎯 Current Project Status

### Completed Features (✅)
- **Office Administration** - Super admin interface for platform management
- **Profile Completion System** - Dashboard widget tracking completion
- **Multi-Taxonomy Skills** - CSI MasterFormat + O*NET integration
- **Address & Location System** - Autocomplete with dual provider support
- **News Feed System** - RSS-based industry news
- **ATS Phases 1-4A** - Database, API, candidate flow, recruiter UI (76% complete)

### In Progress (🚧)
- **ATS Phase 4B** - Backend integration and data wiring (50% complete)

### Planned (⏳)
- **ATS Phases 4C-6** - Advanced features, analytics, integrations
- **O*NET Career Intelligence** - Career assessment and recommendations
- **RSS Job Feeds** - External job feed integration

---

## 📖 Core Documentation

### Features
- **[Features Index](./features/README.md)** - Complete feature documentation directory
- **[ATS Roadmap](./features/ats-roadmap.md)** - Applicant Tracking System status and roadmap
- **[O*NET Integration](./features/onet-integration.md)** - Career intelligence system
- **[Address System](./features/address-form-abstraction.md)** - Location management

### Office Administration
- **[CRUD Standards](./office/crud-standards.md)** - Patterns for admin interfaces
- **[Organizations CRUD](./office/organizations-crud.md)** - Organization management guide

### Code Quality
- **[Code Quality Improvements](./code-quality/improvements.md)** - TypeScript strict checks
  - Phase 5 complete (56% overall)
  - Non-null assertions reduced from 13 to 7
  - Full type safety for routes

### Deployment
- **[Deployment README](./deployment/README.md)** - Deployment overview
- **[Supabase Setup](./deployment/supabase-cloud-setup.md)** - Database configuration
- **[OAuth Config](./deployment/oauth-configuration.md)** - Authentication setup
- **[AWS Setup](./deployment/aws-setup.md)** - AWS S3 + CloudFront setup

### Roadmap
- **[ATS Schema Design](./roadmap/ats-schema-design.md)** - Complete future ATS schema

---

## 🛠️ Development Resources

### Code Organization
- **Monorepo Structure**: pnpm workspace with apps/ and packages/
- **Apps**: `/apps/expo` - Cross-platform app (web, iOS, Android)
- **Packages**: 
  - `@app/core` - Core features and business logic
  - `@app/ui` - Reusable UI components (Tamagui/Bento)
  - `@app/schemas` - Zod validation schemas
  - `@app/supabase` - Database types and functions

### Key Commands
```bash
# Development
pnpm dev              # Start Expo dev server (port 8081)
pnpm web              # Start web dev server (port 3000)
pnpm ios              # Run iOS app
pnpm android          # Run Android app

# Code Quality
pnpm check            # Format, lint, typecheck (same as CI)
pnpm build            # Build all packages

# Supabase
pnpm supa start       # Start local Supabase
pnpm supa:studio      # Open Supabase Studio (port 54323)
pnpm supa:generate    # Generate TypeScript types
```

### Development Standards
- **TypeScript**: Strict mode enabled, no `any` types
- **Imports**: Direct imports preferred over barrel files
- **Routes**: Type-safe route constants (no string literals)
- **Components**: Tamagui for UI, Bento for complex patterns
- **Validation**: Zod schemas for all data
- **Testing**: Run `pnpm check` before committing

---

## 📊 Project Metrics

### Codebase Size
- **Total Lines**: ~50,000+ lines
- **Features**: 8 completed, 3 in progress, 5+ planned
- **Database Migrations**: 93+ migrations
- **Components**: 200+ React components
- **Documentation**: 2,640+ lines

### Documentation Health
- **Active Docs**: 20 files
- **Deleted (Oct 12)**: 10 outdated files
- **Recently Updated**: 6 files (Oct 12, 2025)
- **Comprehensive Features**: ATS (76%), O*NET (100% planned)

---

## 🔍 Finding What You Need

### "I want to..."
- **Learn about a feature** → [features/README.md](./features/README.md)
- **Deploy to production** → [deployment/README.md](./deployment/README.md)
- **Improve code quality** → [code-quality/improvements.md](./code-quality/improvements.md)
- **Build an admin interface** → [office/crud-standards.md](./office/crud-standards.md)
- **Work on ATS** → [features/ats-roadmap.md](./features/ats-roadmap.md)
- **Add a new feature** → [features/README.md](./features/README.md#contributing)

### "I need help with..."
- **Setting up locally** → [deployment/README.md](./deployment/README.md)
- **Understanding the database** → [features/ats-schema.md](./features/ats-schema.md)
- **TypeScript errors** → [code-quality/improvements.md](./code-quality/improvements.md)
- **Creating forms** → [office/crud-standards.md](./office/crud-standards.md)
- **Location/address features** → [features/address-form-abstraction.md](./features/address-form-abstraction.md)

---

## 📝 Contributing to Documentation

### When to Update Documentation
- **After completing a feature** - Update status and progress
- **Before starting major work** - Create implementation plan
- **When fixing bugs** - Document root cause and solution
- **Regularly** - Keep documentation current and remove stale files

### Documentation Standards
1. **Use Markdown** for all documentation
2. **Include dates** on all updates
3. **Link to code** where relevant
4. **Provide examples** for complex features
5. **Keep it current** - delete outdated docs
6. **Be specific** - include file locations, line counts, commit references

### File Naming
- Use lowercase with hyphens: `feature-name.md`
- Date-specific: `YYYY-MM-DD-topic.md`
- README files: `README.md` in each directory

---

## 🚀 Next Steps

### For Immediate Work
1. Review [ATS Roadmap](./features/ats-roadmap.md) for Phase 4B tasks
2. Check [Features Documentation](./features/README.md) for current status
3. Run `pnpm dev` and `pnpm web` to test locally

### For Planning
1. Review [O*NET Integration](./features/onet-integration.md) for future work
2. Check [features/README.md](./features/README.md) for planned features
3. Review [roadmap/ats-schema-design.md](./roadmap/ats-schema-design.md) for technical design

---

## 📞 Support & Questions

- **Code Issues**: Check [code-quality/improvements.md](./code-quality/improvements.md)
- **Deployment Issues**: Check [deployment/README.md](./deployment/README.md)
- **Feature Questions**: Check [features/README.md](./features/README.md)
- **Standards Questions**: Check [office/crud-standards.md](./office/crud-standards.md)

---

*Documentation last cleaned up: November 19, 2025*  
*Next review: December 19, 2025*
