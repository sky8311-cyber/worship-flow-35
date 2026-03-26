

# K-Worship Institute 100% Blueprint

I'll generate a comprehensive Markdown blueprint document covering the entire Institute system architecture, database schema, page flows, Edge Functions, access control, and admin management. This document will be saved to `/mnt/documents/` for download.

## Document Structure

The blueprint will include:

1. **System Overview** — What Institute is, its purpose, current status (Worship Re:boot as primary course)

2. **Data Architecture (4-Layer Hierarchy)**
   - Pathways (institute_certifications) → Courses → Modules → Chapters
   - Junction tables (institute_certification_courses, institute_pathway_courses)
   - Complete DB schema for all 12 tables with columns, types, defaults, constraints

3. **Database Tables (Full Schema)**
   - institute_courses, institute_modules, institute_chapters
   - institute_enrollments, institute_chapter_progress
   - institute_certifications, institute_certification_courses
   - institute_pathways, institute_pathway_courses
   - institute_badges, institute_instructors, institute_invitations
   - RLS policies for each table

4. **Access Control / Tier System**
   - Tier hierarchy: member(0) → worship_leader(1) → premium(2) → church(3)
   - `required_tier` column on courses, modules, chapters
   - `useTierFeature` hook and `canAccess()` logic
   - AI Coach gated by `institute_ai_coach` feature flag

5. **Page Routes & Components**
   - `/institute` — Landing (certifications carousel + course cards with thumbnails)
   - `/institute/:courseId` — Course detail (dark hero banner, enrollment CTA, curriculum list)
   - `/institute/:courseId/:moduleId` — Module viewer (sidebar nav, chapter list)
   - `/institute/:courseId/:moduleId/:chapterId` — Chapter viewer (video/text/audio, completion)
   - `/institute/certification/:certId` — Certification detail + badge request
   - `/institute/setting` — Admin hub (curriculum tree, instructors, enrollments)
   - `/institute/manage` — Instructor manage page

6. **Edge Functions**
   - `institute-ai-coach` — Anthropic Claude-based learning coach
   - `award-institute-badge` — Badge issuance after all courses completed

7. **UI/UX Design Standards**
   - Platform-unified blue/coral design system
   - 16:9 thumbnail cards, dark hero banners
   - Chapter icons (PlayCircle/BookOpen/Headphones)
   - `.inst-prose` content rendering
   - `InstituteLayout` with feature gate (FeatureComingSoon)

8. **Admin Management**
   - AdminInstituteContentTree — 4-layer tree CRUD
   - AdminInstituteInstructors — Instructor management
   - AdminInstituteEnrollments — Enrollment monitoring
   - Invitation system (invite/accept/decline)

9. **Student Journey Flow**
   - Browse → Enroll → Learn chapters → Complete modules → Earn badge
   - Progress tracking (chapter-level + module-level)

10. **AI Integration**
    - AI Coach system prompt structure
    - Anthropic API configuration (ai-config.ts)
    - Usage logging via `log-ai-usage`

## Implementation

Single script execution to generate the Markdown file at `/mnt/documents/kworship-institute-blueprint.md` containing all gathered information from the codebase analysis.

